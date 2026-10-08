import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";

import { initReceiptGenerator, generateAndMergeReceipt } from './receiptGenerator.ts';
import { sendActivationEmail } from './emailService.ts';
import { PDFDocument } from 'pdf-lib';

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

import crypto from 'crypto';

// In-memory cache for order email delivery status
const orderEmailStatusMap = new Map<string, { status: 'EMAIL SENT' | 'EMAIL FAILED' | 'EMAIL NOT CONFIGURED'; sentAt?: string; error?: string }>();


const ENCRYPTION_KEY = process.env.JWT_SECRET ? crypto.createHash('sha256').update(process.env.JWT_SECRET).digest('base64').substring(0, 32) : crypto.createHash('sha256').update('fallback-secret-32-chars-long-abc').digest('base64').substring(0, 32);
const IV_LENGTH = 16;

function generateAccessToken(orderId: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(orderId, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

function verifyAccessToken(token: string): string | null {
    try {
        const parts = token.split(':');
        if (parts.length !== 3) return null;
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = Buffer.from(parts[2], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return null;
    }
}

function getDocumentAccessUrl(req: express.Request, token: string): string {
    const envAppUrl = process.env.APP_URL?.trim().replace(/\/+$/, '');
    if (envAppUrl) {
        return `${envAppUrl}/document/access/${token}`;
    }
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    return `${protocol}://${host}/document/access/${token}`;
}


dotenv.config();

const app = express();
const PORT = 3000;

// Configure Multer memory storage for PDF file uploads (25MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Initialize Supabase Server Admin Client
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
if (!rawSupabaseUrl) {
  console.error("FATAL: VITE_SUPABASE_URL or SUPABASE_URL is required for the production server.");
  process.exit(1);
}
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY is required for the production server. NEVER use the anon key on the server.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Initialize receipt generator with server-authoritative Supabase client
initReceiptGenerator(supabaseAdmin);

// Increase body limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Environment variables for Admin
const JWT_SECRET = process.env.JWT_SECRET || "default-dev-jwt-secret-do-not-use-in-prod";

// Middleware to protect admin routes
interface AdminJwtPayload {
  account_id: string;
  role: string;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
    res.locals.admin = decoded;
    next();
  } catch (err) {
    console.warn(`[Admin Auth] Failed access attempt to ${req.originalUrl} from ${req.ip}`);
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
}

function requireRole(allowedRoles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const admin = res.locals.admin as AdminJwtPayload | undefined;
    if (!admin) {
      return res.status(401).json({ error: "Unauthorized: No admin session" });
    }
    if (!allowedRoles.includes(admin.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}

// Admin login endpoint
app.post("/api/admin/login", async (req, res) => {
  const { accountId, password } = req.body;
  if (!accountId || !password) {
    return res.status(400).json({ error: "Account ID and Password are required" });
  }

  const cleanAccountId = typeof accountId === "string" ? accountId.trim() : "";
  const cleanPassword = typeof password === "string" ? password.trim() : "";

  try {
    // 1. Case-insensitive lookup for active account in admin_users table
    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .ilike("account_id", cleanAccountId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[Admin Auth DB Error]", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!user || !user.password_hash) {
      console.info(`[Admin Auth] Unauthorized login attempt for ${cleanAccountId} from ${req.ip}`);
      return res.status(401).json({ error: "Incorrect Account ID or Password" });
    }

    // 2. Strict bcrypt password verification against stored password_hash
    const isValid = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!isValid) {
      console.info(`[Admin Auth] Unauthorized login attempt for ${cleanAccountId} from ${req.ip}`);
      return res.status(401).json({ error: "Incorrect Account ID or Password" });
    }

    // 3. Issue standard admin JWT session
    const token = jwt.sign({ account_id: user.account_id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
    return res.json({ success: true, token, role: user.role });
  } catch (err) {
    console.error("[Admin Auth Error]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Authoritative session verification endpoint for Admin Portal
app.get("/api/admin/verify", requireAdmin, async (req, res) => {
  const admin = res.locals.admin as AdminJwtPayload;
  try {
    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("account_id, role, status")
      .ilike("account_id", admin.account_id)
      .eq("status", "active")
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: "Administrator account inactive or not found", valid: false });
    }
    return res.json({ success: true, valid: true, account_id: user.account_id, role: user.role });
  } catch (err) {
    return res.json({ success: true, valid: true, account_id: admin.account_id, role: admin.role });
  }
});

// Admin Self-Service: Change Password
app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = res.locals.admin as AdminJwtPayload;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Valid current and new password (min 8 chars) required." });
  }

  try {
    const { data: user } = await supabaseAdmin
      .from("admin_users")
      .select("password_hash")
      .eq("account_id", admin.account_id)
      .single();

    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({ password_hash: newHash })
      .eq("account_id", admin.account_id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      console.error("[Admin Change Password Update Error]", updateError);
      return res.status(500).json({ error: "Failed to update password." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Admin Change Password Error]", err);
    res.status(500).json({ error: "Failed to change password." });
  }
});

// Super Admin: List Users
app.get("/api/admin/users", requireAdmin, requireRole(["super_admin"]), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .select("id, account_id, role, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin users." });
  }
});

// Super Admin: Create User
app.post("/api/admin/users", requireAdmin, requireRole(["super_admin"]), async (req, res) => {
  const { accountId, password, role } = req.body;
  if (!accountId || !password || !role) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (role === 'super_admin') {
    return res.status(403).json({ error: "Cannot create a super_admin via this endpoint." });
  }
  if (!['finance_admin', 'content_admin', 'support_admin'].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .insert([{ account_id: accountId, password_hash, role, status: "active" }])
      .select("id, account_id, role, status, created_at")
      .single();
    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (err: any) {
    console.error("Create User Error:", err);
    res.status(500).json({ error: err.message || "Failed to create user. Ensure Account ID is unique." });
  }
});

// Super Admin: Update User Role/Status
app.patch("/api/admin/users/:accountId", requireAdmin, requireRole(["super_admin"]), async (req, res) => {
  const { accountId } = req.params;
  const { role, status } = req.body;
  
  if (accountId === res.locals.admin.account_id) {
    return res.status(403).json({ error: "Cannot modify your own role or status." });
  }
  if (role && role === 'super_admin') {
    return res.status(403).json({ error: "Cannot promote to super_admin." });
  }
  if (role && !['finance_admin', 'content_admin', 'support_admin'].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  try {
    const updates: any = {};
    if (role) updates.role = role;
    if (status) updates.status = status;

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .update(updates)
      .eq("account_id", accountId)
      .select("id, account_id, role, status, created_at")
      .single();
    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

// Super Admin: Reset User Password
app.post("/api/admin/users/:accountId/reset-password", requireAdmin, requireRole(["super_admin"]), async (req, res) => {
  const { accountId } = req.params;
  const { newPassword } = req.body;
  
  if (accountId === res.locals.admin.account_id) {
    return res.status(403).json({ error: "Cannot reset your own password here. Use the Change Password function." });
  }
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  try {
    const password_hash = await bcrypt.hash(newPassword, 12);
    const { error } = await supabaseAdmin
      .from("admin_users")
      .update({ password_hash })
      .eq("account_id", accountId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password." });
  }
});
// API Route for Digitizing Exam Paper
app.post("/api/digitize-paper", requireAdmin, requireRole(["super_admin", "content_admin"]), async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    let ai;
    try {
      ai = getAiClient();
    } catch (err: any) {
      return res.status(503).json({ error: "AI processing is currently disabled because the Gemini API key is not configured on the server." });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || "image/png",
              },
            },
            {
              text: "You are an expert OCR engine. Extract all the text from this exam paper image. Organize it into a clean, structured JSON format that represents the paper's contents. The JSON should have the following structure: { \"university\": \"Name of University\", \"examination\": \"Type of Exam/Year\", \"school\": \"School Name\", \"department\": \"Department Name\", \"course\": \"Course Name (e.g., BBIT/BSCIT/BSCCS)\", \"type\": \"e.g., REGULAR\", \"unitCode\": \"Unit Code\", \"unitTitle\": \"Unit Title\", \"date\": \"Date\", \"time\": \"Time (e.g. 11.00AM)\", \"session\": \"Session (e.g. MAIN EXAM)\", \"timeAllowed\": \"Time Allowed\", \"instructions\": \"Instructions to candidates\", \"sections\": [ { \"name\": \"Section Name (e.g. SECTION A: COMPULSORY)\", \"questions\": [ { \"questionNumber\": \"e.g. QUESTION ONE\", \"totalMarks\": \"e.g. 30 MARKS\", \"subQuestions\": [ { \"label\": \"e.g. a)\", \"text\": \"Question text\", \"marks\": \"e.g. 2 Marks\", \"subSubQuestions\": [ { \"label\": \"e.g. i)\", \"text\": \"Sub-question text\", \"marks\": \"e.g. 2 Marks\" } ] } ] } ] } ] }. If any field is not present in the image, you can omit it or leave it empty, but try to infer the structure as accurately as possible. Pay close attention to nested lists (e.g. i, ii, iii).",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text;
    let parsedData = {};
    if (jsonText) {
       parsedData = JSON.parse(jsonText);
    }
    
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Digitization Error:", error);
    res.status(500).json({ error: error.message || "Failed to process image" });
  }
});

// Database API Routes

/**
 * Secure Backend Endpoint for Paper Upload & Administration
 * Validates request, uploads PDF to private Supabase Storage bucket "Papers",
 * inserts/updates public."Papers", handles transactional cleanup on DB error.
 */
app.post("/api/papers/upload", requireAdmin, requireRole(["super_admin", "content_admin"]), upload.single("pdfFile"), async (req, res) => {
  try {
    const paperId = req.body?.paperId?.trim();
    const operationMode = (req.body?.operationMode || req.body?.mode || 'replace').trim().toLowerCase();
    const unitCode = (req.body?.unit_code || req.body?.unitCode || '').trim().toUpperCase();
    const paperTitle = (req.body?.paper_title || req.body?.unitName || req.body?.paperTitle || '').trim();
    const rawPrice = (req.body?.price || '').toString().trim();
    const status = (req.body?.status || 'available').trim().toLowerCase();

    // 1. Server-side Validation
    if (!unitCode || unitCode.length < 2) {
      return res.status(400).json({ error: "Invalid Unit Code. Code must be at least 2 characters." });
    }

    if (!paperTitle || paperTitle.length < 3) {
      return res.status(400).json({ error: "Invalid Paper Title. Title must be at least 3 characters." });
    }

    const numericPrice = parseInt(rawPrice.replace(/\D/g, '') || '0', 10);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: "Invalid Price. Price must be a positive amount (e.g. KSh 50)." });
    }
    const formattedPrice = rawPrice.startsWith('KSh') ? rawPrice : `KSh ${numericPrice}`;

    if (status !== 'available' && status !== 'unavailable') {
      return res.status(400).json({ error: "Invalid status. Supported values are 'available' or 'unavailable'." });
    }

    const file = req.file;

    // Requirement: PDF file required for new paper creation
    if (!paperId && !file) {
      return res.status(400).json({ error: "PDF file is required when uploading a new paper." });
    }

    if (file) {
      // Extension validation
      const originalName = file.originalname || '';
      if (!originalName.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ error: "Invalid file format. Only .pdf files are permitted." });
      }

      // MIME type validation
      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: "Invalid MIME type. File type must be application/pdf." });
      }

      // Magic bytes signature validation (%PDF-)
      const magicBytes = file.buffer.slice(0, 5).toString('utf-8');
      if (!magicBytes.startsWith('%PDF-')) {
        return res.status(400).json({ error: "Invalid PDF file content. File failed signature verification." });
      }

      // File size validation (25MB)
      if (file.size > 25 * 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds the 25 MB limit." });
      }
    }

    // Normalized unit code for collision-safe storage path
    const normalizedCode = unitCode.replace(/[^A-Z0-9]/g, '') || 'PAPER';

    if (!paperId) {
      // --- CREATE NEW PAPER ---
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const storagePath = `papers/${normalizedCode}/${uniqueId}.pdf`;

      // Step 1: Upload PDF to private Supabase Storage bucket "Papers"
      const { data: uploadData, error: storageError } = await supabaseAdmin.storage
        .from("Papers")
        .upload(storagePath, file!.buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (storageError) {
        console.error("Supabase Storage Upload Error:", storageError.message);
        return res.status(500).json({
          error: "Storage upload failed. Ensure the server has valid storage write authorization.",
        });
      }

      // Step 2: Insert metadata into public."Papers"
      const { data: insertedData, error: dbError } = await supabaseAdmin
        .from("Papers")
        .insert([
          {
            unit_code: unitCode,
            paper_title: paperTitle,
            price: numericPrice,
            status: status,
            file_path: storagePath,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error("Supabase Database Insert Error:", dbError.message);
        // CLEANUP: DB insert failed -> delete newly uploaded Storage object
        await supabaseAdmin.storage.from("Papers").remove([storagePath]).catch((cleanupErr) => {
          console.error("Cleanup error removing storage object:", cleanupErr);
        });

        return res.status(500).json({
          error: "Database insertion failed. The uploaded file was safely cleaned up.",
        });
      }

      const safePaper = {
        id: insertedData.id,
        created_at: insertedData.created_at,
        unit_code: insertedData.unit_code,
        paper_title: insertedData.paper_title,
        price: insertedData.price,
        file_path: insertedData.file_path,
        status: insertedData.status,
        isAvailable: insertedData.status === 'available',
        fileName: insertedData.file_path,
        fileSize: `${(file!.size / (1024 * 1024)).toFixed(1)} MB`,
      };

      return res.status(201).json({ success: true, paper: safePaper });
    } else {
      // --- EDIT EXISTING PAPER ---
      const { data: existingPaper, error: fetchPaperErr } = await supabaseAdmin
        .from("Papers")
        .select("*")
        .eq("id", paperId)
        .single();

      if (fetchPaperErr || !existingPaper) {
        return res.status(404).json({ error: "Examination paper not found." });
      }

      const oldFilePath = existingPaper.file_path || null;

      if (file) {
        if (operationMode === 'merge') {
          // --- MERGE NEW PDF WITH EXISTING PDF ---
          if (!oldFilePath) {
            return res.status(400).json({ error: "Existing paper does not have a valid document path to merge with." });
          }

          // 1. Retrieve existing private PDF
          const { data: existingPdfBlob, error: downloadErr } = await supabaseAdmin.storage
            .from("Papers")
            .download(oldFilePath);

          if (downloadErr || !existingPdfBlob) {
            console.error("Storage download error for existing paper during merge:", downloadErr);
            return res.status(500).json({ error: "Failed to download existing PDF document from storage. Original document preserved." });
          }

          const existingBytes = Buffer.from(await existingPdfBlob.arrayBuffer());
          const newBytes = file.buffer;

          // 2. Validate & Merge PDFs: existing PDF pages first, new uploaded PDF pages second
          let mergedPdfBytes: Uint8Array;
          try {
            const existingDoc = await PDFDocument.load(existingBytes);
            const newDoc = await PDFDocument.load(newBytes);
            const mergedDoc = await PDFDocument.create();

            // Copy existing pages first
            const existingPages = await mergedDoc.copyPages(existingDoc, existingDoc.getPageIndices());
            existingPages.forEach((p) => mergedDoc.addPage(p));

            // Copy new pages second
            const newPages = await mergedDoc.copyPages(newDoc, newDoc.getPageIndices());
            newPages.forEach((p) => mergedDoc.addPage(p));

            mergedPdfBytes = await mergedDoc.save();
          } catch (mergeErr: any) {
            console.error("PDF merge processing error:", mergeErr);
            return res.status(400).json({
              error: `Failed to merge PDF documents: ${mergeErr.message || "Corrupt or invalid PDF"}. Original document preserved.`
            });
          }

          // 3. Upload merged PDF to private "Papers" bucket with a new unique storage path
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const mergedStoragePath = `papers/${normalizedCode}/${uniqueId}-merged.pdf`;

          const { error: uploadErr } = await supabaseAdmin.storage
            .from("Papers")
            .upload(mergedStoragePath, Buffer.from(mergedPdfBytes), {
              contentType: "application/pdf",
              upsert: true,
            });

          if (uploadErr) {
            console.error("Failed to upload merged PDF to storage:", uploadErr);
            return res.status(500).json({ error: "Failed to store merged PDF. Original document preserved." });
          }

          // 4. Update database record with new merged file_path
          const { data: updatedData, error: dbUpdateErr } = await supabaseAdmin
            .from("Papers")
            .update({
              unit_code: unitCode,
              paper_title: paperTitle,
              price: numericPrice,
              status: status,
              file_path: mergedStoragePath,
            })
            .eq("id", paperId)
            .select()
            .single();

          if (dbUpdateErr) {
            console.error("Database update error on merged PDF:", dbUpdateErr);
            // Rollback newly uploaded merged file on DB failure, preserving old file & record
            await supabaseAdmin.storage.from("Papers").remove([mergedStoragePath]).catch(() => {});
            return res.status(500).json({ error: "Database update failed. Original document preserved." });
          }

          console.log(`[MERGE SUCCESS] Paper ID: ${paperId}, Unit: ${updatedData.unit_code}, Old file_path: '${oldFilePath}', New file_path: '${mergedStoragePath}'`);

          // 5. Safely delete old storage object ONLY after successful DB update
          if (oldFilePath && oldFilePath !== mergedStoragePath) {
            supabaseAdmin.storage.from("Papers").remove([oldFilePath]).catch((e) => {
              console.warn("Notice: Old storage file cleanup skipped:", e);
            });
          }

          const safePaper = {
            id: updatedData.id,
            created_at: updatedData.created_at,
            unit_code: updatedData.unit_code,
            paper_title: updatedData.paper_title,
            price: updatedData.price,
            file_path: updatedData.file_path,
            old_file_path: oldFilePath,
            status: updatedData.status,
            isAvailable: updatedData.status === 'available',
            fileName: updatedData.file_path,
            fileSize: `${(mergedPdfBytes.length / (1024 * 1024)).toFixed(2)} MB`,
            merged: true,
          };

          return res.json({ success: true, paper: safePaper, message: "Document merged successfully." });
        }

        // --- EDIT WITH REPLACEMENT PDF (Default Flow) ---
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newStoragePath = `papers/${normalizedCode}/${uniqueId}.pdf`;

        // 1. Upload new PDF
        const { error: newUploadErr } = await supabaseAdmin.storage
          .from("Papers")
          .upload(newStoragePath, file.buffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (newUploadErr) {
          console.error("Replacement Storage Upload Error:", newUploadErr.message);
          return res.status(500).json({ error: "Replacement storage upload failed." });
        }

        // 2. Update database record
        const { data: updatedData, error: dbUpdateErr } = await supabaseAdmin
          .from("Papers")
          .update({
            unit_code: unitCode,
            paper_title: paperTitle,
            price: numericPrice,
            status: status,
            file_path: newStoragePath,
          })
          .eq("id", paperId)
          .select()
          .single();

        if (dbUpdateErr) {
          console.error("Database Update Error on replacement PDF:", dbUpdateErr.message);
          // Delete newly uploaded file on DB failure, preserving old file & record
          await supabaseAdmin.storage.from("Papers").remove([newStoragePath]).catch(() => {});
          return res.status(500).json({ error: "Database update failed. Old file preserved." });
        }

        console.log(`[REPLACE SUCCESS] Paper ID: ${paperId}, Unit: ${updatedData.unit_code}, Old file_path: '${oldFilePath}', New file_path: '${newStoragePath}'`);

        // 3. Delete old file ONLY AFTER DB update succeeds
        if (oldFilePath && oldFilePath !== newStoragePath) {
          supabaseAdmin.storage.from("Papers").remove([oldFilePath]).catch((e) => {
            console.warn("Notice: Old storage file cleanup skipped:", e);
          });
        }

        const safePaper = {
          id: updatedData.id,
          created_at: updatedData.created_at,
          unit_code: updatedData.unit_code,
          paper_title: updatedData.paper_title,
          price: updatedData.price,
          file_path: updatedData.file_path,
          status: updatedData.status,
          isAvailable: updatedData.status === 'available',
          fileName: updatedData.file_path,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        };

        return res.json({ success: true, paper: safePaper });
      } else {
        // --- EDIT METADATA ONLY ---
        const { data: updatedData, error: dbUpdateErr } = await supabaseAdmin
          .from("Papers")
          .update({
            unit_code: unitCode,
            paper_title: paperTitle,
            price: numericPrice,
            status: status,
          })
          .eq("id", paperId)
          .select()
          .single();

        if (dbUpdateErr) {
          console.error("Database Update Error (metadata only):", dbUpdateErr.message);
          return res.status(500).json({ error: "Database update failed." });
        }

        const safePaper = {
          id: updatedData.id,
          created_at: updatedData.created_at,
          unit_code: updatedData.unit_code,
          paper_title: updatedData.paper_title,
          price: updatedData.price,
          file_path: updatedData.file_path,
          status: updatedData.status,
          isAvailable: updatedData.status === 'available',
          fileName: updatedData.file_path,
        };

        return res.json({ success: true, paper: safePaper });
      }
    }
  } catch (err: any) {
    console.error("Unexpected upload route error:", err);
    res.status(500).json({ error: "An unexpected error occurred processing the upload request." });
  }
});

/**
 * Explicit route for merging examination papers
 */
app.post("/api/papers/merge", requireAdmin, requireRole(["super_admin", "content_admin"]), upload.single("pdfFile"), async (req, res, next) => {
  req.body.operationMode = 'merge';
  // Forward to upload handler logic by calling the route handler
  try {
    const paperId = req.body?.paperId?.trim();
    const unitCode = (req.body?.unit_code || req.body?.unitCode || '').trim().toUpperCase();
    const paperTitle = (req.body?.paper_title || req.body?.unitName || req.body?.paperTitle || '').trim();
    const rawPrice = (req.body?.price || '').toString().trim();
    const status = (req.body?.status || 'available').trim().toLowerCase();

    if (!paperId) {
      return res.status(400).json({ error: "paperId is required for merging documents." });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "PDF file is required to append to the existing examination paper." });
    }

    // MIME and magic bytes validation
    const originalName = file.originalname || '';
    if (!originalName.toLowerCase().endsWith('.pdf') || file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: "Invalid file format. Only .pdf files are permitted." });
    }
    const magicBytes = file.buffer.slice(0, 5).toString('utf-8');
    if (!magicBytes.startsWith('%PDF-')) {
      return res.status(400).json({ error: "Invalid PDF file content. File failed signature verification." });
    }
    if (file.size > 25 * 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds the 25 MB limit." });
    }

    const { data: existingPaper, error: fetchPaperErr } = await supabaseAdmin
      .from("Papers")
      .select("*")
      .eq("id", paperId)
      .single();

    if (fetchPaperErr || !existingPaper) {
      return res.status(404).json({ error: "Examination paper not found." });
    }

    const oldFilePath = existingPaper.file_path || null;
    if (!oldFilePath) {
      return res.status(400).json({ error: "Existing paper does not have a valid document path to merge with." });
    }

    // 1. Retrieve existing private PDF
    const { data: existingPdfBlob, error: downloadErr } = await supabaseAdmin.storage
      .from("Papers")
      .download(oldFilePath);

    if (downloadErr || !existingPdfBlob) {
      console.error("Storage download error for existing paper during merge:", downloadErr);
      return res.status(500).json({ error: "Failed to download existing PDF document from storage. Original document preserved." });
    }

    const existingBytes = Buffer.from(await existingPdfBlob.arrayBuffer());
    const newBytes = file.buffer;

    // 2. Validate & Merge PDFs: existing PDF pages first, new uploaded PDF pages second
    let mergedPdfBytes: Uint8Array;
    try {
      const existingDoc = await PDFDocument.load(existingBytes);
      const newDoc = await PDFDocument.load(newBytes);
      const mergedDoc = await PDFDocument.create();

      const existingPages = await mergedDoc.copyPages(existingDoc, existingDoc.getPageIndices());
      existingPages.forEach((p) => mergedDoc.addPage(p));

      const newPages = await mergedDoc.copyPages(newDoc, newDoc.getPageIndices());
      newPages.forEach((p) => mergedDoc.addPage(p));

      mergedPdfBytes = await mergedDoc.save();
    } catch (mergeErr: any) {
      console.error("PDF merge processing error:", mergeErr);
      return res.status(400).json({
        error: `Failed to merge PDF documents: ${mergeErr.message || "Corrupt or invalid PDF"}. Original document preserved.`
      });
    }

    // 3. Upload merged PDF to private "Papers" bucket
    const normalizedCode = (unitCode || existingPaper.unit_code || 'PAPER').replace(/[^A-Z0-9]/g, '') || 'PAPER';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const mergedStoragePath = `papers/${normalizedCode}/${uniqueId}-merged.pdf`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("Papers")
      .upload(mergedStoragePath, Buffer.from(mergedPdfBytes), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Failed to upload merged PDF to storage:", uploadErr);
      return res.status(500).json({ error: "Failed to store merged PDF. Original document preserved." });
    }

    // 4. Update database record with new merged file_path
    const numericPrice = rawPrice ? parseInt(rawPrice.replace(/\D/g, '') || '0', 10) : existingPaper.price;
    const updatePayload: any = {
      file_path: mergedStoragePath,
    };
    if (unitCode) updatePayload.unit_code = unitCode;
    if (paperTitle) updatePayload.paper_title = paperTitle;
    if (numericPrice && numericPrice > 0) updatePayload.price = numericPrice;
    if (status) updatePayload.status = status;

    const { data: updatedData, error: dbUpdateErr } = await supabaseAdmin
      .from("Papers")
      .update(updatePayload)
      .eq("id", paperId)
      .select()
      .single();

    if (dbUpdateErr) {
      console.error("Database update error on merged PDF:", dbUpdateErr);
      await supabaseAdmin.storage.from("Papers").remove([mergedStoragePath]).catch(() => {});
      return res.status(500).json({ error: "Database update failed. Original document preserved." });
    }

    // 5. Safely delete old storage object ONLY after successful DB update
    if (oldFilePath && oldFilePath !== mergedStoragePath) {
      supabaseAdmin.storage.from("Papers").remove([oldFilePath]).catch((e) => {
        console.warn("Notice: Old storage file cleanup skipped:", e);
      });
    }

    const safePaper = {
      id: updatedData.id,
      created_at: updatedData.created_at,
      unit_code: updatedData.unit_code,
      paper_title: updatedData.paper_title,
      price: updatedData.price,
      file_path: updatedData.file_path,
      status: updatedData.status,
      isAvailable: updatedData.status === 'available',
      fileName: updatedData.file_path,
      fileSize: `${(mergedPdfBytes.length / (1024 * 1024)).toFixed(2)} MB`,
      merged: true,
    };

    return res.json({ success: true, paper: safePaper, message: "Document merged successfully." });
  } catch (err: any) {
    console.error("Unexpected error in /api/papers/merge:", err);
    return res.status(500).json({ error: "An unexpected error occurred processing the merge request." });
  }
});

app.get("/api/papers", async (req, res) => {
  try {
    const { data: papers, error } = await supabaseAdmin
      .from("Papers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database query failed:", error);
      return res.status(500).json({ error: "Failed to fetch papers" });
    }

    if (papers) {
      const normalized = papers.map((p) => ({
        id: p.id,
        unit_code: p.unit_code,
        paper_title: p.paper_title,
        unitCode: p.unit_code,
        unitName: p.paper_title,
        price: p.price,
        status: p.status,
        isAvailable: p.status === 'available',
        file_path: p.file_path,
        fileName: p.file_path,
        created_at: p.created_at,
        createdAt: p.created_at,
      }));
      return res.json(normalized);
    }
    return res.json([]);
  } catch (err: any) {
    console.error("Database query failed:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch papers" });
  }
});

app.delete("/api/papers/:id", requireAdmin, requireRole(["super_admin", "content_admin"]), async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Paper ID is required" });
  }

  try {
    // 1. Retrieve the existing paper record from public."Papers" by ID
    const { data: paper, error: fetchErr } = await supabaseAdmin
      .from("Papers")
      .select("id, unit_code, paper_title, file_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      console.error(`[Delete Paper] Database fetch error for ID ${id}:`, fetchErr);
      return res.status(500).json({ error: "Failed to query paper repository" });
    }

    // Case A: Paper does not exist
    if (!paper) {
      return res.status(404).json({ error: "Document not found." });
    }

    const rawFilePath = paper.file_path ? paper.file_path.trim() : "";
    const storagePath = rawFilePath.replace(/^\/+/, "");

    // 2. Delete storage object from private bucket "Papers" first
    if (storagePath) {
      const { data: storageDelData, error: storageDelErr } = await supabaseAdmin
        .storage
        .from("Papers")
        .remove([storagePath]);

      // Case B: Storage deletion fails -> Do NOT delete database record
      if (storageDelErr) {
        console.error(`[Delete Paper] Storage deletion failed for paper ${id} (path: "${storagePath}"):`, storageDelErr);
        return res.status(500).json({
          error: "The document could not be removed from storage. The database record was not deleted.",
        });
      }

      // Case D: Already missing storage object -> Proceed to remove orphaned DB record
      if (!storageDelData || storageDelData.length === 0) {
        console.warn(
          `[Delete Paper] Physical storage object was already missing in bucket 'Papers': "${storagePath}". Proceeding with database record deletion for paper ID ${id}.`
        );
      } else {
        console.log(`[Delete Paper] Successfully deleted storage object "${storagePath}" from bucket 'Papers'.`);
      }
    } else {
      console.log(`[Delete Paper] Paper ${id} has no associated file_path. Proceeding directly with database record deletion.`);
    }

    // 3. Only after the storage operation is successfully handled, delete the database record
    const { error: dbDeleteErr } = await supabaseAdmin
      .from("Papers")
      .delete()
      .eq("id", id);

    if (dbDeleteErr) {
      // Case C: Database deletion fails after storage deletion
      console.error(
        `[Delete Paper] CRITICAL RECOVERY LOG: Storage file "${storagePath}" was deleted or verified missing, but DB row delete failed for paper ID ${id}:`,
        dbDeleteErr
      );
      return res.status(500).json({
        error: "Storage object was removed, but the database record could not be deleted. Please contact support or retry.",
      });
    }

    console.log(`[Delete Paper] Successfully deleted paper ${id} (${paper.unit_code} - ${paper.paper_title}) from public."Papers".`);
    return res.json({
      success: true,
      message: "Document deleted successfully.",
    });
  } catch (e: any) {
    console.error("[Delete Paper] Unexpected exception during paper deletion:", e);
    return res.status(500).json({ error: "Failed to delete paper" });
  }
});

app.patch("/api/papers/:id", requireAdmin, requireRole(["super_admin", "content_admin"]), async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabaseAdmin.from("Papers").update(updates).eq("id", id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error("DB update failed:", e);
    res.status(500).json({ error: "Failed to update paper" });
  }
});

app.post("/api/papers", requireAdmin, requireRole(["super_admin", "content_admin"]), async (req, res) => {
  try {
    const payload = req.body;
    const { data, error } = await supabaseAdmin.from("Papers").insert([payload]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    console.error("DB insert failed:", e);
    res.status(500).json({ error: e.message || "Failed to create paper" });
  }
});

// Authoritative Single Paper Record Endpoint
app.get("/api/papers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: p, error } = await supabaseAdmin
      .from("Papers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Database query failed for paper id:", error);
      return res.status(500).json({ error: "Failed to fetch paper" });
    }
    if (!p) {
      return res.status(404).json({ error: "Paper not found" });
    }

    const normalized = {
      id: p.id,
      unit_code: p.unit_code,
      paper_title: p.paper_title,
      unitCode: p.unit_code,
      unitName: p.paper_title,
      price: typeof p.price === 'number' ? `KSh ${p.price}` : String(p.price || 'KSh 50'),
      status: p.status,
      isAvailable: p.status === 'available',
      file_path: p.file_path,
      fileName: p.file_path,
      created_at: p.created_at,
      createdAt: p.created_at,
    };
    return res.json(normalized);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch paper" });
  }
});

// Secure Admin Paper Preview Endpoint (Streams current PDF from private storage)
app.get("/api/admin/papers/:id/preview", requireAdmin, requireRole(["super_admin", "content_admin", "finance_admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path, paper_title, unit_code")
      .eq("id", id)
      .maybeSingle();

    if (paperErr || !paper || !paper.file_path) {
      return res.status(404).json({ error: "Paper document path not found in repository." });
    }

    const { data: fileData, error: downloadErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .download(paper.file_path);

    if (downloadErr || !fileData) {
      console.error(`Storage preview download error for ${paper.file_path}:`, downloadErr);
      return res.status(500).json({ error: "Failed to retrieve the PDF document from storage." });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(paper.unit_code || 'paper')}.pdf"`);

    return res.send(buffer);
  } catch (err: any) {
    console.error("Error generating admin paper preview:", err);
    return res.status(500).json({ error: "Internal server error generating preview." });
  }
});

// Secure Signed URL Endpoint for Admin Paper Document
app.get("/api/admin/papers/:id/signed-url", requireAdmin, requireRole(["super_admin", "content_admin", "finance_admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path")
      .eq("id", id)
      .maybeSingle();

    if (paperErr || !paper || !paper.file_path) {
      return res.status(404).json({ error: "Paper document path not found." });
    }

    const { data: signedData, error: signedErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .createSignedUrl(paper.file_path, 600);

    if (signedErr || !signedData?.signedUrl) {
      console.error("Error generating signed URL:", signedErr);
      return res.status(500).json({ error: "Failed to generate signed URL." });
    }

    return res.json({
      signedUrl: signedData.signedUrl,
      filePath: paper.file_path,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/papers/:id/testdownload", async (req, res) => {
  console.log("Admin download hit:", req.params.id);
  const { id } = req.params;
  const { password } = req.body;
  console.log("Password present:", !!password);
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path, paper_title, unit_code")
      .eq("id", id)
      .maybeSingle();

    console.log("Paper lookup:", { found: !!paper, error: paperErr });
    if (paperErr || !paper || !paper.file_path) {
      return res.status(404).json({ error: "Paper file not found in repository." });
    }

    const { data: fileData, error: downloadErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .download(paper.file_path);

    console.log("Storage download:", { found: !!fileData, error: downloadErr });
    if (downloadErr || !fileData) {
      console.error("Error downloading PDF from Storage:", downloadErr);
      return res.status(500).json({ error: "Failed to retrieve the document." });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const pdfUint8 = new Uint8Array(arrayBuffer);
    console.log("File loaded to Uint8Array. Size:", pdfUint8.length);
    
    let encryptedBytes;
    try {
      encryptedBytes = await encryptPDF(pdfUint8, password, { algorithm: 'RC4' });
      console.log("File encrypted. Size:", encryptedBytes.length);
    } catch (encryptErr: any) {
      if (encryptErr.code === 'ALREADY_ENCRYPTED' || encryptErr.message?.includes('already password-protected') || encryptErr.message?.includes('Cannot read properties of undefined (reading \'Pages\')') || encryptErr.message?.includes('Pages')) {
        console.log("File is already encrypted or cannot be parsed for encryption, skipping encryption");
        encryptedBytes = pdfUint8;
      } else {
        throw encryptErr;
      }
    }
    
    const outputFilename = `${paper.unit_code}_Exam.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    
    return res.send(Buffer.from(encryptedBytes));
  } catch (err) {
    console.error("Error generating protected admin download:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/testpapers", async (req, res) => {
  const { data } = await supabaseAdmin.from("Papers").select("*").limit(1).single();
  res.json(data);
});
app.post("/api/admin/papers/:id/download", requireAdmin, requireRole(["super_admin", "content_admin"]), async (req, res) => {
  console.log("Admin download hit:", req.params.id);
  const { id } = req.params;
  const { password } = req.body;
  console.log("Password present:", !!password);
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path, paper_title, unit_code")
      .eq("id", id)
      .maybeSingle();

    console.log("Paper lookup:", { found: !!paper, error: paperErr });
    if (paperErr || !paper || !paper.file_path) {
      return res.status(404).json({ error: "Paper file not found in repository." });
    }

    const { data: fileData, error: downloadErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .download(paper.file_path);

    console.log("Storage download:", { found: !!fileData, error: downloadErr });
    if (downloadErr || !fileData) {
      console.error("Error downloading PDF from Storage:", downloadErr);
      return res.status(500).json({ error: "Failed to retrieve the document." });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const pdfUint8 = new Uint8Array(arrayBuffer);
    console.log("File loaded to Uint8Array. Size:", pdfUint8.length);
    
    let encryptedBytes;
    try {
      encryptedBytes = await encryptPDF(pdfUint8, password, { algorithm: 'RC4' });
      console.log("File encrypted. Size:", encryptedBytes.length);
    } catch (encryptErr: any) {
      if (encryptErr.code === 'ALREADY_ENCRYPTED' || encryptErr.message?.includes('already password-protected') || encryptErr.message?.includes('Cannot read properties of undefined (reading \'Pages\')') || encryptErr.message?.includes('Pages')) {
        console.log("File is already encrypted or cannot be parsed for encryption, skipping encryption");
        encryptedBytes = pdfUint8;
      } else {
        throw encryptErr;
      }
    }
    
    const outputFilename = `${paper.unit_code}_Exam.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    
    return res.send(Buffer.from(encryptedBytes));
  } catch (err) {
    console.error("Error generating protected admin download:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/papers/:id/download", async (req, res) => {
  res.status(403).json({ error: "Downloads must be processed through the secure order entitlement flow." });
});

// Helper function to normalize Kenyan phone numbers to 254XXXXXXXXX format
function normalizeKenyanPhone(phoneInput: string): string | null {
  if (!phoneInput) return null;
  const cleaned = phoneInput.trim().replace(/[\s\-\(\)]/g, '');
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return `254${cleaned.substring(1)}`;
  }
  if (/^\+254[17]\d{8}$/.test(cleaned)) {
    return cleaned.substring(1);
  }
  if (/^254[17]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

// STAGE 1: Real M-Pesa Daraja STK Push Initiation Endpoint
// STAGE 1 (Alternative): Manual WhatsApp Order Creation
app.post("/api/orders/whatsapp", async (req, res) => {
  try {
    const { paper_id, first_name, second_name, phone } = req.body;

    const targetPaperId = (paper_id || '').trim();
    const targetFirstName = (first_name || '').trim();
    const targetSecondName = (second_name || '').trim();

    if (!targetPaperId || !targetFirstName || !targetSecondName) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    let normalizedPhone = '';
    if (phone) {
      normalizedPhone = normalizeKenyanPhone(phone) || phone.trim();
    }

    const { data: dbPaper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("*")
      .eq("id", targetPaperId)
      .single();

    if (paperErr || !dbPaper) {
      return res.status(404).json({ success: false, error: "Paper not found." });
    }

    let customerId = null;
    if (normalizedPhone) {
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();
      if (existingCustomer?.id) {
        customerId = existingCustomer.id;
        await supabaseAdmin.from("customers").update({ first_name: targetFirstName, second_name: targetSecondName }).eq("id", customerId);
      }
    }
    
    if (!customerId) {
       const { data: newCustomer, error: createCustErr } = await supabaseAdmin
        .from("customers")
        .insert({
          first_name: targetFirstName,
          second_name: targetSecondName,
          phone: normalizedPhone || null
        })
        .select("id")
        .single();
        if (createCustErr) throw createCustErr;
        customerId = newCustomer.id;
    }

    const { data: newOrder, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .insert({
        customer_id: customerId,
        paper_id: targetPaperId,
        amount: Number(dbPaper.price) || 0,
        status: 'pending'
      })
      .select("id")
      .single();

    if (orderErr) throw orderErr;

    return res.json({ success: true, orderId: newOrder.id, accessToken: generateAccessToken(newOrder.id) });
  } catch (err) {
    console.error("WhatsApp order creation error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

app.post("/api/mpesa/stkpush", async (req, res) => {
  // 0. Check Server M-Pesa Daraja Credentials early to avoid DB writes if missing
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const mpesaEnv = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
  const isSandbox = mpesaEnv === 'sandbox';
  
  // Safaricom Sandbox Official Constants
  const SANDBOX_SHORTCODE = '174379';
  const SANDBOX_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

  const shortcode = isSandbox ? SANDBOX_SHORTCODE : process.env.MPESA_SHORTCODE;
  const passkey = isSandbox ? SANDBOX_PASSKEY : process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!consumerKey || !consumerSecret || !callbackUrl || !shortcode || !passkey) {
    return res.status(500).json({
      success: false,
      error: "M-Pesa configuration is incomplete. Missing required credentials for the active environment."
    });
  }

  const { paper_id, paperId, first_name, firstName, studentFirstName, second_name, secondName, studentSecondName, phone } = req.body;

  const targetPaperId = paper_id || paperId;
  const targetFirstName = (first_name || firstName || studentFirstName || '').trim();
  const targetSecondName = (second_name || secondName || studentSecondName || '').trim();

  // 1. Validate required fields
  if (!targetPaperId) {
    return res.status(400).json({ success: false, error: "Paper ID is required." });
  }
  if (!targetFirstName || !targetSecondName) {
    return res.status(400).json({ success: false, error: "First name and second name are required." });
  }

  // 2. Validate and normalize phone number
  const normalizedPhone = normalizeKenyanPhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      error: "Invalid Kenyan mobile phone number. Please enter a valid number (e.g. 0712345678 or 0112345678)."
    });
  }

  try {
    // 3. Query public."Papers" for authoritative paper price and availability status
    const { data: dbPaper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("*")
      .eq("id", targetPaperId)
      .single();

    if (paperErr || !dbPaper) {
      return res.status(404).json({ success: false, error: "The requested paper record was not found in the catalog." });
    }

    if (dbPaper.status?.toLowerCase() !== 'available') {
      return res.status(400).json({ success: false, error: "This paper is currently unavailable for purchase." });
    }

    const priceNumeric = Number(dbPaper.price);
    if (isNaN(priceNumeric) || priceNumeric <= 0) {
      return res.status(400).json({ success: false, error: "Invalid paper price configuration in catalog." });
    }

    // 4. Customer management: Find or create customer record in public.customers
    let customerId: string | null = null;
    const { data: existingCustomer, error: custSearchErr } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
      // Update first and second name if updated
      await supabaseAdmin
        .from("customers")
        .update({ first_name: targetFirstName, second_name: targetSecondName })
        .eq("id", customerId);
    } else {
      const { data: newCustomer, error: createCustErr } = await supabaseAdmin
        .from("customers")
        .insert({
          first_name: targetFirstName,
          second_name: targetSecondName,
          phone: normalizedPhone
        })
        .select("id")
        .single();

      if (createCustErr || !newCustomer) {
        console.error("Customer creation error:", createCustErr);
        return res.status(500).json({ success: false, error: "Failed to initialize customer record." });
      }
      customerId = newCustomer.id;
    }

    // 5. Order Creation: Create pending order in public."Orders" using DB price (never browser price)
    const { data: newOrder, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .insert({
        customer_id: customerId,
        paper_id: targetPaperId,
        amount: priceNumeric,
        status: 'pending'
      })
      .select("id")
      .single();

    if (orderErr || !newOrder) {
      console.error("Order creation error:", orderErr);
      return res.status(500).json({ success: false, error: "Failed to initialize order record." });
    }
    const orderId = newOrder.id;

    // 6. Payment Creation: Create pending payment record in public.payments
    const { data: newPayment, error: paymentErr } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: orderId,
        phone: normalizedPhone,
        amount: priceNumeric,
        status: 'pending',
        mpesa_receipt: null,
        transaction_date: null,
        checkout_request_id: null,
        merchant_request_id: null
      })
      .select("id")
      .single();

    if (paymentErr || !newPayment) {
      console.error("Payment record creation error:", paymentErr);
      // Rollback order
      await supabaseAdmin.from("Orders").delete().eq("id", orderId);
      return res.status(500).json({ success: false, error: "Failed to initialize payment tracking." });
    }
    const paymentId = newPayment.id;

    // 8. Safaricom Daraja STK Push Execution
    const baseUrl = mpesaEnv === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    
    // A. Generate OAuth Access Token
    const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const authRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authHeader}` }
    });

    if (!authRes.ok) {
      const authErrText = await authRes.text();
      console.error("M-Pesa OAuth Auth Error:", authErrText);
      await supabaseAdmin.from("payments").delete().eq("id", paymentId);
      await supabaseAdmin.from("Orders").delete().eq("id", orderId);
      return res.status(502).json({ success: false, error: "Failed to authenticate with Safaricom Daraja API." });
    }

    const authData = await authRes.json();
    const accessToken = authData.access_token;

    // B. Build STK Push Request
    const dateObj = new Date();
    const timestamp = dateObj.getFullYear().toString() +
      String(dateObj.getMonth() + 1).padStart(2, '0') +
      String(dateObj.getDate()).padStart(2, '0') +
      String(dateObj.getHours()).padStart(2, '0') +
      String(dateObj.getMinutes()).padStart(2, '0') +
      String(dateObj.getSeconds()).padStart(2, '0');

    const passwordStr = `${shortcode}${passkey || ''}${timestamp}`;
    const password = Buffer.from(passwordStr).toString('base64');

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(priceNumeric),
      PartyA: normalizedPhone,
      PartyB: shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: callbackUrl,
      AccountReference: dbPaper.unit_code || "ExamPaper",
      TransactionDesc: `Purchase ${dbPaper.unit_code || 'Paper'}`
    };

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(stkPayload)
    });

    const stkData = await stkRes.json();

    if (stkRes.ok && stkData.ResponseCode === "0") {
      // Safaricom accepted STK Push request
      
      console.log("[M-Pesa STK Push Debug] Safaricom Accepted Request:", {
        ResponseCode: stkData.ResponseCode,
        ResponseDescription: stkData.ResponseDescription,
        MerchantRequestID: stkData.MerchantRequestID,
        CheckoutRequestID: stkData.CheckoutRequestID,
        CustomerMessage: stkData.CustomerMessage
      });

      const checkoutRequestId = stkData.CheckoutRequestID;
      const merchantRequestId = stkData.MerchantRequestID;

      // Update payments table with CheckoutRequestID and MerchantRequestID
      await supabaseAdmin
        .from("payments")
        .update({
          checkout_request_id: checkoutRequestId,
          merchant_request_id: merchantRequestId
        })
        .eq("id", paymentId);

      return res.json({
        success: true,
        status: "pending",
        orderId: orderId,
        paymentId: paymentId,
        checkoutRequestId: checkoutRequestId,
        customerMessage: stkData.CustomerMessage || "STK Push sent to mobile device. Please enter your M-Pesa PIN."
      });
    } else {
      console.error("M-Pesa STK Push Rejected by Safaricom:", stkData);
      // Clean up payment and order records on definitive Daraja API rejection
      await supabaseAdmin.from("payments").delete().eq("id", paymentId);
      await supabaseAdmin.from("Orders").delete().eq("id", orderId);

      return res.status(400).json({
        success: false,
        error: stkData.CustomerMessage || stkData.ResponseDescription || "STK Push request was declined by Safaricom."
      });
    }
  } catch (err: any) {
    // Requirement 2: Ambiguous / Unknown Network Transport Error
    // Network timeouts or transport errors do NOT prove the STK Push failed on Safaricom's end.
    // Preserve pending Order and Payment records so later Daraja callback can reconcile using CheckoutRequestID.
    console.warn("[M-Pesa STK Push] Ambiguous network/transport error during initiation. Preserving pending Order & Payment for callback reconciliation:", err?.message);
    return res.status(504).json({
      success: false,
      error: "Payment status is being confirmed. If you already received an M-Pesa prompt, do not retry the payment."
    });
  }
});

// Helper function to parse Daraja M-Pesa 14-digit timestamp (YYYYMMDDHHmmss)
function parseMpesaTransactionDate(raw: string | number): string {
  const str = String(raw || '').trim();
  if (/^\d{14}$/.test(str)) {
    const yr = str.substring(0, 4);
    const mo = str.substring(4, 6);
    const dy = str.substring(6, 8);
    const hr = str.substring(8, 10);
    const mn = str.substring(10, 12);
    const sc = str.substring(12, 14);
    return new Date(`${yr}-${mo}-${dy}T${hr}:${mn}:${sc}Z`).toISOString();
  }
  return new Date().toISOString();
}

// STAGE 2: Real M-Pesa Daraja Asynchronous Callback Endpoint
app.post("/api/mpesa/callback", async (req, res) => {
  try {
    const callbackData = req.body?.Body?.stkCallback || req.body?.stkCallback || req.body;
    
    const merchantRequestId = callbackData?.MerchantRequestID;
    const checkoutRequestId = callbackData?.CheckoutRequestID;
    const resultCode = Number(callbackData?.ResultCode);
    const resultDesc = callbackData?.ResultDesc || '';

    console.log(`[M-Pesa Callback Received] CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${resultCode}`);

    // 1. Missing CheckoutRequestID check
    if (!checkoutRequestId) {
      console.warn("[M-Pesa Callback] Missing CheckoutRequestID in callback payload.");
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 2. Lookup payment tracking record by checkout_request_id
    const { data: dbPayment, error: payErr } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();

    if (payErr || !dbPayment) {
      console.warn(`[M-Pesa Callback] No payment record found for CheckoutRequestID: ${checkoutRequestId}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 3. MerchantRequestID validation (if stored)
    if (dbPayment.merchant_request_id && merchantRequestId && dbPayment.merchant_request_id !== merchantRequestId) {
      console.warn(`[M-Pesa Callback Security Violation] MerchantRequestID mismatch for CheckoutRequestID: ${checkoutRequestId}. Stored: ${dbPayment.merchant_request_id}, Received: ${merchantRequestId}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 4. Requirement 2: Terminal State Protection (Never downgrade or modify completed/failed terminal transactions)
    if (dbPayment.status === 'completed' || dbPayment.status === 'failed') {
      console.log(`[M-Pesa Callback] Terminal state protection: Callback ignored for payment ID ${dbPayment.id} currently in terminal state '${dbPayment.status}'`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 5. Handle Failed or Cancelled STK Push (ResultCode != 0)
    if (resultCode !== 0) {
      console.log(`[M-Pesa Callback] STK Push Failed/Cancelled for payment ID: ${dbPayment.id}. ResultCode: ${resultCode}, Desc: ${resultDesc}`);
      
      // Requirement 3: Safe conditional update on pending status
      await supabaseAdmin
        .from("payments")
        .update({ status: 'failed' })
        .eq("id", dbPayment.id)
        .eq("status", "pending");

      if (dbPayment.order_id) {
        await supabaseAdmin
          .from("Orders")
          .update({ status: 'failed' })
          .eq("id", dbPayment.order_id)
          .eq("status", "pending");
      }

      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 6. Process Successful Payment (ResultCode == 0)
    const items = callbackData?.CallbackMetadata?.Item || [];
    let mpesaReceipt = '';
    let callbackAmount = 0;
    let callbackPhone = '';
    let rawTxDate: string | number = '';

    for (const item of items) {
      if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = String(item.Value || '').trim();
      if (item.Name === 'Amount') callbackAmount = Number(item.Value || 0);
      if (item.Name === 'PhoneNumber') callbackPhone = String(item.Value || '').trim();
      if (item.Name === 'TransactionDate') rawTxDate = item.Value;
    }

    if (!mpesaReceipt) {
      console.error(`[M-Pesa Callback Security Violation] Missing MpesaReceiptNumber in successful callback metadata for payment ID: ${dbPayment.id}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Fetch associated order record
    const { data: dbOrder, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .select("*")
      .eq("id", dbPayment.order_id)
      .maybeSingle();

    if (orderErr || !dbOrder) {
      console.error(`[M-Pesa Callback Security Violation] Associated Order not found for payment ID: ${dbPayment.id}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Exact Amount Validation (Numeric precision tolerance 0.01)
    const orderAmount = Number(dbOrder.amount);
    if (isNaN(orderAmount) || isNaN(callbackAmount) || callbackAmount <= 0 || Math.abs(callbackAmount - orderAmount) > 0.01) {
      console.error(`[M-Pesa Callback Security Violation] Amount mismatch for Order ${dbOrder.id}! Expected: KSh ${orderAmount}, Received: KSh ${callbackAmount}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Requirement 1: Phone Number Mismatch MUST BLOCK Payment Completion
    const normalizedCallbackPhone = normalizeKenyanPhone(callbackPhone);
    if (!normalizedCallbackPhone || !dbPayment.phone || normalizedCallbackPhone !== dbPayment.phone) {
      console.error(`[M-Pesa Callback Security Violation] Phone number mismatch for Order ${dbOrder.id}! Payment Phone: ${dbPayment.phone}, Callback Phone: ${normalizedCallbackPhone}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 7. Update Database on Validated Success
    // LIMITATION ACKNOWLEDGEMENT: Without a single atomic database RPC/transaction, Supabase REST operations on 'payments' and 'Orders' execute sequentially.
    // To safeguard consistency:
    // A. Step 1 conditionally updates payment status from 'pending' to 'completed'.
    // B. Step 2 conditionally updates associated Order status from 'pending' to 'paid'.
    // If Step 2 fails, Order remains 'pending' (no download entitlement created). A critical consistency error is logged with internal IDs.
    const formattedDate = parseMpesaTransactionDate(rawTxDate);

    // A. Mark Payment Completed conditionally
    const { data: updatedPay, error: payUpdateErr } = await supabaseAdmin
      .from("payments")
      .update({
        status: 'completed',
        mpesa_receipt: mpesaReceipt,
        amount: callbackAmount,
        phone: normalizedCallbackPhone,
        transaction_date: formattedDate
      })
      .eq("id", dbPayment.id)
      .eq("status", "pending")
      .select("id");

    if (payUpdateErr || !updatedPay || updatedPay.length === 0) {
      console.error(`[M-Pesa Callback Error] Failed or skipped updating payment record ID ${dbPayment.id}:`, payUpdateErr);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // B. Mark Order Paid conditionally
    const { data: updatedOrd, error: orderUpdateErr } = await supabaseAdmin
      .from("Orders")
      .update({ status: 'paid' })
      .eq("id", dbOrder.id)
      .eq("status", "pending")
      .select("id");

    if (orderUpdateErr || !updatedOrd || updatedOrd.length === 0) {
      console.error(`[CRITICAL DATABASE INCONSISTENCY ERROR] Payment ID ${dbPayment.id} was marked completed with receipt ${mpesaReceipt}, but Order ID ${dbOrder.id} status update to 'paid' failed or skipped! Order status remains 'pending'. Error:`, orderUpdateErr);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    console.log(`[M-Pesa Callback Success] Order ID ${dbOrder.id} & Payment ID ${dbPayment.id} successfully marked PAID/COMPLETED! Receipt: ${mpesaReceipt}, Amount: KSh ${callbackAmount}`);

    // Proactively generate receipt
    // We don't await or we catch errors so callback still returns 200
    generateAndMergeReceipt(dbOrder.id).catch(err => {
        console.error("[RECEIPT ERROR] M-Pesa callback generation failed:", err);
    });

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err: any) {
    console.error("Unexpected error in M-Pesa callback endpoint:", err);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

// Real Order Status Checking Endpoint for Polling Client
app.get("/api/orders/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("status, mpesa_receipt")
      .eq("order_id", orderId)
      .maybeSingle();

    return res.json({
      success: true,
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: payment?.status || 'pending',
      isPaid: order.status === 'paid',
      accessToken: order.status === 'paid' ? generateAccessToken(order.id) : null,
      mpesaReceipt: order.status === 'paid' ? (payment?.mpesa_receipt || null) : null,
    });
  } catch (err: any) {
    console.error("Error checking order status:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Secure Authorized Download Endpoint for Confirmed Paid Orders
app.get("/api/orders/:orderId/download", async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .select("id, status, paper_id, customers (second_name)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== 'paid') {
      return res.status(403).json({ success: false, error: "Payment not verified. Access denied." });
    }

    // Ensure we have the second name to act as a password
    const customerData: any = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const secondName = customerData?.second_name?.trim();
    
    if (!secondName) {
      return res.status(400).json({ success: false, error: "Missing customer second name for password protection." });
    }

    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path, paper_title, unit_code")
      .eq("id", order.paper_id)
      .maybeSingle();

    if (paperErr || !paper || !paper.file_path) {
      return res.status(404).json({ success: false, error: "Paper file not found in repository." });
    }

    // Attempt to record the download
    try {
      const { error: insertErr } = await supabaseAdmin
        .from("downloads")
        .insert({
          order_id: order.id,
          paper_id: order.paper_id,
          downloaded_at: new Date().toISOString()
        });
      
      if (insertErr && insertErr.code !== '23505') {
        console.warn("Notice: downloads record creation issue:", insertErr);
      }
    } catch (dlErr) {
      console.warn("Notice: downloads record exception:", dlErr);
    }

    // Download the raw PDF bytes securely on the backend
    const { data: fileData, error: downloadErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .download(paper.file_path);

    if (downloadErr || !fileData) {
      console.error("Error downloading PDF from Storage:", downloadErr);
      return res.status(500).json({ success: false, error: "Failed to retrieve the document." });
    }

    // Convert Blob/File to Uint8Array and encrypt
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfUint8 = new Uint8Array(arrayBuffer);
    
    // Encrypt in-memory using the customer's second name as the user password
    let encryptedBytes;
    try {
      encryptedBytes = await encryptPDF(pdfUint8, secondName, { algorithm: 'RC4' });
    } catch (encryptErr: any) {
      if (encryptErr.code === 'ALREADY_ENCRYPTED' || encryptErr.message?.includes('already password-protected') || encryptErr.message?.includes('Cannot read properties of undefined (reading \'Pages\')') || encryptErr.message?.includes('Pages')) {
        console.log("File is already encrypted or cannot be parsed for encryption, skipping encryption");
        encryptedBytes = pdfUint8;
      } else {
        throw encryptErr;
      }
    }
    
    const outputFilename = `${paper.unit_code}_Exam.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    
    return res.send(Buffer.from(encryptedBytes));

  } catch (err: any) {
    console.error("Error generating protected order download:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.get("/api/transactions", requireAdmin, requireRole(["super_admin", "finance_admin"]), async (req, res) => {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select(`
        id, mpesa_receipt, phone, amount, status, created_at, order_id,
        Orders (
          id,
          paper_id,
          customers (first_name, second_name, phone)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    if (!payments || payments.length === 0) {
      return res.json([]);
    }

    // Safely collect paper_ids
    const paperIds = Array.from(
      new Set(
        payments
          .map((p: any) => p.Orders?.paper_id)
          .filter(Boolean)
      )
    );

    const paperMap = new Map();
    if (paperIds.length > 0) {
      const { data: papers } = await supabaseAdmin
        .from('Papers')
        .select('id, paper_title, unit_code')
        .in('id', paperIds);
      if (papers) {
        papers.forEach((paper: any) => paperMap.set(paper.id, paper));
      }
    }
    
    const formatted = payments.map((p: any) => {
      const paper = p.Orders?.paper_id ? paperMap.get(p.Orders.paper_id) : null;
      return {
        id: p.id,
        studentFirstName: p.Orders?.customers?.first_name || '',
        studentSecondName: p.Orders?.customers?.second_name || '',
        phone: p.phone,
        unitCode: paper?.unit_code || '',
        unitName: paper?.paper_title || '',
        price: `KSh ${p.amount}`,
        mpesaReceipt: p.mpesa_receipt || 'PENDING',
        status: p.status === 'completed' ? 'Completed' : (p.status === 'pending' ? 'Pending' : 'Failed'),
        timestamp: p.created_at
      };
    });
    return res.json(formatted);
  } catch (err) {
    console.error("Transactions fetch error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", requireAdmin, requireRole(["super_admin", "finance_admin"]), async (req, res) => {
  res.status(403).json({ error: "Forbidden. Use secure M-Pesa STK push flow." });
});

app.delete("/api/transactions/:id", requireAdmin, requireRole(["super_admin", "finance_admin"]), async (req, res) => {
  res.status(403).json({ error: "Forbidden. Cannot delete transaction records." });
});

app.get("/api/messages", requireAdmin, requireRole(["super_admin", "support_admin"]), async (req, res) => {
  res.json([]);
});

app.post("/api/messages", requireAdmin, requireRole(["super_admin", "support_admin"]), async (req, res) => {
  res.status(501).json({ error: "Messages not yet implemented in Supabase" });
});

app.patch("/api/messages/:id", requireAdmin, requireRole(["super_admin", "support_admin"]), async (req, res) => {
  res.status(501).json({ error: "Messages not yet implemented in Supabase" });
});

app.delete("/api/messages/:id", requireAdmin, requireRole(["super_admin", "support_admin"]), async (req, res) => {
  res.status(501).json({ error: "Messages not yet implemented in Supabase" });
});

// Admin Live Stats Endpoint
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [{ count: totalPapers }, { count: activePapers }, { count: totalDownloads }, { data: payments }] = await Promise.all([
      supabaseAdmin.from('Papers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('Papers').select('*', { count: 'exact', head: true }).eq('status', 'available'),
      supabaseAdmin.from('downloads').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('payments').select('amount').eq('status', 'completed')
    ]);

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    res.json({
      totalPapers: totalPapers || 0,
      activePapers: activePapers || 0,
      totalDownloads: totalDownloads || 0,
      totalRevenue: `KSh ${totalRevenue.toLocaleString()}`,
      transactionCount: payments?.length || 0,
      pendingAffiliates: 0,
      unreadMessages: 0,
    });
  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});


// --- MANUAL M-PESA ACTIVATION ENDPOINTS ---

// Admin: Get active manual codes

app.get("/api/admin/manual-activation/pending", requireAdmin, async (req, res) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('Orders')
      .select('*, customers(first_name, second_name, phone), payments(id, mpesa_receipt, phone, status, created_at)')
      .eq('status', 'waiting_for_activation')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Filter out orders that do not have an associated payment record
    const validOrders = orders.filter((o: any) => o.payments && o.payments.length > 0);
    if (validOrders.length === 0) {
      return res.json([]);
    }

    // Fetch related papers safely by paper_id
    const paperIds = Array.from(new Set(validOrders.map((o: any) => o.paper_id).filter(Boolean)));
    const paperMap = new Map();
    if (paperIds.length > 0) {
      const { data: papers } = await supabaseAdmin
        .from('Papers')
        .select('id, paper_title, unit_code')
        .in('id', paperIds);
      if (papers) {
        papers.forEach((p: any) => paperMap.set(p.id, p));
      }
    }

    const formatted = validOrders.map((order: any) => {
      const sortedPayments = Array.isArray(order.payments)
        ? [...order.payments].sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        : [];
      return {
        ...order,
        payments: sortedPayments,
        Papers: paperMap.get(order.paper_id) || null
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Admin fetch pending activations error:", err);
    res.status(500).json({ error: "Failed to fetch pending activations" });
  }
});

app.get("/api/admin/manual-activation", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('id, mpesa_receipt, amount, created_at, status')
      .eq('status', 'manual_active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Admin fetch manual codes error:", err);
    res.status(500).json({ error: "Failed to fetch manual codes" });
  }
});

// Admin: Create manual code
app.post("/api/admin/manual-activation", requireAdmin, async (req, res) => {
  try {
    const { mpesaCode, amount } = req.body;
    if (!mpesaCode || !amount || amount <= 0) {
      return res.status(400).json({ error: "Valid M-Pesa code and amount are required." });
    }

    const codeUpper = mpesaCode.toUpperCase().trim();

    // Check if code already exists and is not failed/pending
    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('mpesa_receipt', codeUpper)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "This M-Pesa code is already recorded in the system." });
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        mpesa_receipt: codeUpper,
        amount: Number(amount),
        status: 'manual_active',
        phone: 'MANUAL',
        order_id: null
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error("Admin create manual code error:", err);
    res.status(500).json({ error: "Failed to create manual activation code." });
  }
});

// Customer: Consume manual code

app.post("/api/manual-activation/request", async (req, res) => {
  try {
    const { mpesaCode, firstName, secondName, email, paperId, orderId: requestedOrderId } = req.body;
    if (!mpesaCode || !firstName || !secondName || !email || !paperId) {
      return res.status(400).json({ error: "First name, second name, email address, and M-Pesa transaction code are all required." });
    }

    const codeUpper = String(mpesaCode).toUpperCase().trim();
    const targetFirstName = String(firstName).trim();
    const targetSecondName = String(secondName).trim();
    const targetEmail = String(email).trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address format (e.g. name@example.com)." });
    }

    // Validate M-Pesa transaction code
    if (codeUpper.length < 5) {
      return res.status(400).json({ error: "Please enter a valid M-Pesa transaction code." });
    }

    // 1. Fetch paper
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, price, status, paper_title, unit_code")
      .eq("id", paperId)
      .maybeSingle();

    if (paperErr || !paper) return res.status(404).json({ error: "Document not found." });

    const paperAmount = Number(paper.price) || 0;

    // 2. Identify candidate customer records (by email or name) to avoid duplicate customer records
    let customerId: string | null = null;
    const candidateCustomerIds: string[] = [];

    const { data: custByEmail } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("phone", targetEmail);

    if (custByEmail && custByEmail.length > 0) {
      custByEmail.forEach((c: any) => {
        if (!candidateCustomerIds.includes(c.id)) candidateCustomerIds.push(c.id);
      });
      customerId = custByEmail[0].id;
    }

    const { data: custByName } = await supabaseAdmin
      .from("customers")
      .select("id")
      .ilike("first_name", targetFirstName)
      .ilike("second_name", targetSecondName);

    if (custByName && custByName.length > 0) {
      custByName.forEach((c: any) => {
        if (!candidateCustomerIds.includes(c.id)) candidateCustomerIds.push(c.id);
      });
      if (!customerId) customerId = custByName[0].id;
    }

    // 3. Locate Existing Order (EDIT / RESUBMISSION detection)
    let existingOrder: any = null;

    // Check by explicitly provided orderId from the client session
    if (requestedOrderId && typeof requestedOrderId === "string" && requestedOrderId.trim().length > 0) {
      const { data: orderById } = await supabaseAdmin
        .from("Orders")
        .select("id, customer_id, paper_id, status, amount")
        .eq("id", requestedOrderId.trim())
        .maybeSingle();

      if (orderById && orderById.paper_id === paper.id) {
        existingOrder = orderById;
      }
    }

    // If not identified by orderId, search across candidate customers for an existing pending order for this paper
    if (!existingOrder && candidateCustomerIds.length > 0) {
      const { data: pendingOrders } = await supabaseAdmin
        .from("Orders")
        .select("id, customer_id, paper_id, status, amount")
        .in("customer_id", candidateCustomerIds)
        .eq("paper_id", paper.id)
        .eq("status", "waiting_for_activation")
        .order("created_at", { ascending: false })
        .limit(1);

      if (pendingOrders && pendingOrders.length > 0) {
        existingOrder = pendingOrders[0];
      }
    }

    // 4. Resolve & Update Customer record (Preserve existing customer without creating duplicates)
    if (existingOrder?.customer_id) {
      customerId = existingOrder.customer_id;
      await supabaseAdmin.from("customers").update({
        first_name: targetFirstName,
        second_name: targetSecondName,
        phone: targetEmail
      }).eq("id", customerId);
    } else if (customerId) {
      await supabaseAdmin.from("customers").update({
        first_name: targetFirstName,
        second_name: targetSecondName,
        phone: targetEmail
      }).eq("id", customerId);
    } else {
      const { data: newCust, error: custErr } = await supabaseAdmin
        .from("customers")
        .insert({
          first_name: targetFirstName,
          second_name: targetSecondName,
          phone: targetEmail
        })
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCust.id;
      candidateCustomerIds.push(customerId);
    }

    // 5. Resolve Order ID (Update existing pending order or create new pending order)
    let orderId: string;
    if (existingOrder && existingOrder.status === "waiting_for_activation") {
      orderId = existingOrder.id;
      await supabaseAdmin.from("Orders").update({
        customer_id: customerId,
        paper_id: paper.id,
        amount: paperAmount,
        status: "waiting_for_activation"
      }).eq("id", orderId);
    } else {
      const { data: newOrder, error: orderErr } = await supabaseAdmin
        .from("Orders")
        .insert({
          customer_id: customerId,
          paper_id: paper.id,
          amount: paperAmount,
          status: "waiting_for_activation"
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;
      orderId = newOrder.id;
    }

    // 6. Verify that M-Pesa code is not already redeemed on a DIFFERENT order
    const { data: codeData } = await supabaseAdmin
      .from("payments")
      .select("id, status, order_id, mpesa_receipt")
      .eq("mpesa_receipt", codeUpper)
      .maybeSingle();

    if (codeData && codeData.order_id && codeData.order_id !== orderId && (codeData.status === 'completed' || codeData.status === 'manual_used')) {
      return res.status(400).json({ error: "This M-Pesa transaction code has already been redeemed." });
    }

    // 7. Resolve Payment Record (SINGLE PAYMENT GUARANTEE FOR THIS ORDER)
    const { data: existingPayments } = await supabaseAdmin
      .from("payments")
      .select("id, mpesa_receipt, status, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (existingPayments && existingPayments.length > 0) {
      // Update the primary payment record with the edited M-Pesa code and email
      const primaryPayment = existingPayments[0];
      await supabaseAdmin.from("payments").update({
        mpesa_receipt: codeUpper,
        amount: paperAmount,
        phone: targetEmail,
        status: 'waiting_for_activation',
        transaction_date: new Date().toISOString()
      }).eq("id", primaryPayment.id);

      // Clean up any extra duplicate payment records for this same order
      if (existingPayments.length > 1) {
        const extraPaymentIds = existingPayments.slice(1).map((p: any) => p.id);
        await supabaseAdmin.from("payments").delete().in("id", extraPaymentIds);
      }
    } else if (codeData && (!codeData.order_id || codeData.order_id === orderId)) {
      // Re-use unlinked matching code record
      await supabaseAdmin.from("payments").update({
        order_id: orderId,
        mpesa_receipt: codeUpper,
        amount: paperAmount,
        phone: targetEmail,
        status: 'waiting_for_activation',
        transaction_date: new Date().toISOString()
      }).eq("id", codeData.id);
    } else {
      // Insert single new payment for this order
      await supabaseAdmin.from("payments").insert({
        order_id: orderId,
        mpesa_receipt: codeUpper,
        amount: paperAmount,
        phone: targetEmail,
        status: 'waiting_for_activation',
        transaction_date: new Date().toISOString()
      });
    }

    // 8. Clean up any orphaned empty pending orders for this customer and paper
    if (candidateCustomerIds.length > 0) {
      const { data: otherPending } = await supabaseAdmin
        .from("Orders")
        .select("id, payments(id)")
        .in("customer_id", candidateCustomerIds)
        .eq("paper_id", paper.id)
        .eq("status", "waiting_for_activation")
        .neq("id", orderId);

      if (otherPending && otherPending.length > 0) {
        for (const orphan of otherPending) {
          if (!orphan.payments || orphan.payments.length === 0) {
            await supabaseAdmin.from("Orders").delete().eq("id", orphan.id);
          }
        }
      }
    }

    return res.json({ 
      success: true, 
      orderId: orderId,
      status: "waiting_for_activation",
      message: "Payment code submitted successfully. Your transaction is awaiting verification. Once your payment is confirmed, a confirmation email will be sent to your email address with your secure Open Document link."
    });

  } catch (err) {
    console.error("Manual activation request error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/manual-activation", async (req, res) => {
  try {
    const { mpesaCode, firstName, secondName, paperId } = req.body;
    if (!mpesaCode || !firstName || !secondName || !paperId) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const codeUpper = mpesaCode.toUpperCase().trim();
    const targetFirstName = firstName.trim().toLowerCase();
    const targetSecondName = secondName.trim().toLowerCase();

    // 1. Fetch paper price
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, price, status")
      .eq("id", paperId)
      .maybeSingle();

    if (paperErr || !paper) {
      return res.status(404).json({ error: "Document not found." });
    }
    if (paper.status !== 'available') {
      return res.status(400).json({ error: "Document is no longer available." });
    }
    
    const documentPrice = Number(paper.price);

    // 2. Fetch code
    const { data: codeData, error: codeErr } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("mpesa_receipt", codeUpper)
      .maybeSingle();

    if (codeErr || !codeData) {
      return res.status(400).json({ error: "Invalid M-Pesa transaction code." });
    }

    if (codeData.status === 'manual_used') {
      return res.status(400).json({ error: "This M-Pesa transaction code has already been redeemed and permanently consumed for a document purchase. Use 'View Your Document' to access your paper." });
    }

    if (codeData.status !== 'manual_active') {
      return res.status(400).json({ error: "Invalid, inactive, or already used M-Pesa code." });
    }

    if (Number(codeData.amount) < documentPrice) {
      return res.status(400).json({ error: "The amount paid does not cover this document. Please check that you selected the document you paid for." });
    }

    // 3. Consume code atomically
    const { data: consumed, error: consumeErr } = await supabaseAdmin
      .from("payments")
      .update({ status: 'manual_used' })
      .eq("id", codeData.id)
      .eq("status", "manual_active")
      .select()
      .single();

    if (consumeErr || !consumed) {
      return res.status(400).json({ error: "Code was just used by another request." });
    }

    // 4. Create or update customer
    // We will use a synthetic phone number or null to lookup
    const pseudoPhone = `MANUAL_${targetSecondName}_${targetFirstName}`;
    let customerId = null;

    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("first_name", targetFirstName)
      .eq("second_name", targetSecondName)
      .limit(1)
      .maybeSingle();
      
    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCust, error: custErr } = await supabaseAdmin
        .from("customers")
        .insert({
          first_name: targetFirstName,
          second_name: targetSecondName,
          phone: pseudoPhone
        })
        .select("id")
        .single();
      if (custErr) {
         // Revert code consumption if customer creation fails
         await supabaseAdmin.from("payments").update({ status: 'manual_active' }).eq("id", consumed.id);
         throw custErr;
      }
      customerId = newCust.id;
    }

    // 5. Create or Update Order (Fix 1: Prevent orphans)
    let finalOrderId = null;
    const { data: pendingOrder } = await supabaseAdmin
      .from("Orders")
      .select("id")
      .eq("customer_id", customerId)
      .eq("paper_id", paper.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (pendingOrder?.id) {
      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from("Orders")
        .update({ status: 'paid' })
        .eq("id", pendingOrder.id)
        .select("id")
        .single();
        
      if (updateErr) {
         await supabaseAdmin.from("payments").update({ status: 'manual_active' }).eq("id", consumed.id);
         throw updateErr;
      }
      finalOrderId = updatedOrder.id;
    } else {
      const { data: newOrder, error: orderErr } = await supabaseAdmin
        .from("Orders")
        .insert({
          paper_id: paper.id,
          customer_id: customerId,
          status: 'paid'
        })
        .select("id")
        .single();
  
      if (orderErr) {
         await supabaseAdmin.from("payments").update({ status: 'manual_active' }).eq("id", consumed.id);
         throw orderErr;
      }
      finalOrderId = newOrder.id;
    }

    // 6. Link Order to Payment
    await supabaseAdmin
      .from("payments")
      .update({ 
         order_id: finalOrderId,
        transaction_date: new Date().toISOString()
      })
      .eq("id", consumed.id);

    // 7. Proactively generate receipt
    // We do not fail the request if generation fails.
    try {
       await generateAndMergeReceipt(finalOrderId);
    } catch (e) {
       console.error("[RECEIPT ERROR] Manual activation generation failed:", e);
    }


    return res.json({ success: true, orderId: finalOrderId, accessToken: generateAccessToken(finalOrderId) });

  } catch (err) {
    console.error("Manual activation consume error:", err);
    res.status(500).json({ error: "Internal server error during manual activation." });
  }
});
// --- END MANUAL M-PESA ACTIVATION ENDPOINTS ---

// --- VIEW YOUR DOCUMENT: FIND PURCHASED DOCUMENT ---
app.post("/api/document/find", async (req, res) => {
  try {
    const { mpesaCode, firstName, secondName } = req.body || {};

    if (!mpesaCode || !firstName || !secondName) {
      return res.status(400).json({ error: "Please provide your M-Pesa Transaction Code, First Name, and Second Name." });
    }

    const codeUpper = String(mpesaCode).trim().toUpperCase();
    const inputFirst = String(firstName).trim().toLowerCase();
    const inputSecond = String(secondName).trim().toLowerCase();

    // 1. Locate the existing payment record using payments.mpesa_receipt and payments.status = 'manual_used'
    const { data: payment, error: paymentErr } = await supabaseAdmin
      .from("payments")
      .select("id, mpesa_receipt, status, order_id")
      .eq("mpesa_receipt", codeUpper)
      .eq("status", "manual_used")
      .maybeSingle();

    if (paymentErr || !payment || !payment.order_id) {
      return res.status(404).json({ error: "No completed purchase found with this M-Pesa transaction code." });
    }

    // 2. Locate the existing paid order using payments.order_id
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .select("id, status, customer_id, paper_id, customers(first_name, second_name)")
      .eq("id", payment.order_id)
      .maybeSingle();

    if (orderErr || !order || order.status !== 'paid') {
      return res.status(404).json({ error: "No valid paid order found for this transaction." });
    }

    // 3. Verify customer details match
    const cust = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    if (!cust) {
      return res.status(404).json({ error: "Customer details could not be verified." });
    }

    const targetFirst = (cust.first_name || "").trim().toLowerCase();
    const targetSecond = (cust.second_name || "").trim().toLowerCase();

    if (targetFirst !== inputFirst || targetSecond !== inputSecond) {
      return res.status(400).json({ error: "The names provided do not match the details used for this purchase." });
    }

    // 4. Locate the valid paper/document
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, paper_title, unit_code, status")
      .eq("id", order.paper_id)
      .maybeSingle();

    if (paperErr || !paper) {
      return res.status(404).json({ error: "The document associated with this order could not be found." });
    }

    // 5. Check device authorization status
    let deviceLimit = 3;
    let hasPendingRequest = false;
    let deviceCount = 0;

    const { data: dls } = await supabaseAdmin.from('downloads').select('id').eq('order_id', order.id);
    if (dls) {
        const uniqueDevices = new Set(dls.map(d => d.id));
        deviceCount = uniqueDevices.size;
    }

    const { data: reqs, error: reqErr } = await supabaseAdmin.from('device_requests').select('status').eq('order_id', order.id);
    if (!reqErr && reqs) {
        const approved = reqs.filter(r => r.status === 'approved').length;
        deviceLimit = 3 + approved;
        hasPendingRequest = reqs.some(r => r.status === 'pending');
    }

    // 6. Generate existing AES-256-GCM protected access token
    const accessToken = generateAccessToken(order.id);

    return res.json({
      success: true,
      paper: {
        paper_title: paper.paper_title,
        unit_code: paper.unit_code,
        access_status: "Authorized"
      },
      deviceStatus: {
        count: deviceCount,
        limit: deviceLimit,
        hasPendingRequest
      },
      accessToken,
      accessUrl: `/document/access/${accessToken}`
    });
  } catch (err) {
    console.error("Error in /api/document/find:", err);
    return res.status(500).json({ error: "An unexpected error occurred while locating your document." });
  }
});



// --- Device Requests Endpoints ---

app.post("/api/document/request-device", async (req, res) => {
    const { token } = req.body;
    const orderId = verifyAccessToken(token);
    if (!orderId) return res.status(400).json({ error: "Invalid link." });

    const { data: order } = await supabaseAdmin.from('Orders').select('id, status').eq('id', orderId).maybeSingle();
    if (!order || order.status !== 'paid') {
        return res.status(403).json({ error: "Access denied. Order is awaiting payment confirmation." });
    }

    const { data: reqs, error: reqErr } = await supabaseAdmin.from('device_requests').select('id, status').eq('order_id', orderId);
    
    if (reqErr) {
        console.warn("Device requests table may not exist yet:", reqErr);
        return res.status(500).json({ error: "Device requests are currently disabled while the database updates." });
    }

    if (reqs && reqs.some(r => r.status === 'pending')) {
        return res.status(400).json({ error: "You already have a pending request for this document." });
    }

    const { error: insertErr } = await supabaseAdmin.from('device_requests').insert({
        order_id: orderId,
        status: 'pending'
    });

    if (insertErr) {
        return res.status(500).json({ error: "Failed to submit request." });
    }

    return res.json({ success: true });
});

app.get("/api/admin/device-requests", requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('device_requests')
            .select('*, Orders(id, paper_id, customers(first_name, second_name))')
            .order('created_at', { ascending: false });
        
        if (error) {
           if (error.code === 'PGRST205' || error.code === '42501' || error.code === 'PGRST200') {
               return res.json({ requests: [] });
           }
           return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
           return res.json({ requests: [] });
        }

        const paperIds = Array.from(new Set(data.map((r: any) => r.Orders?.paper_id).filter(Boolean)));
        const paperMap = new Map();
        if (paperIds.length > 0) {
          const { data: papers } = await supabaseAdmin
            .from('Papers')
            .select('id, paper_title, unit_code')
            .in('id', paperIds);
          if (papers) {
            papers.forEach((p: any) => paperMap.set(p.id, p));
          }
        }
        
        // Calculate current devices for each
        const requestsWithCounts = await Promise.all(data.map(async (reqItem: any) => {
            const { count } = await supabaseAdmin.from('downloads').select('*', { count: 'exact', head: true }).eq('order_id', reqItem.order_id);
            const { data: approvedReqs } = await supabaseAdmin.from('device_requests').select('id').eq('order_id', reqItem.order_id).eq('status', 'approved');
            const paper = reqItem.Orders?.paper_id ? paperMap.get(reqItem.Orders.paper_id) : null;
            return {
                ...reqItem,
                current_devices: count || 0,
                device_limit: 3 + (approvedReqs ? approvedReqs.length : 0),
                Orders: {
                    customers: reqItem.Orders?.customers || null,
                    Papers: paper ? { paper_title: paper.paper_title, unit_code: paper.unit_code } : null
                }
            };
        }));

        return res.json({ requests: requestsWithCounts });
    } catch (err: any) {
        console.error("Device requests fetch error:", err);
        return res.json({ requests: [] });
    }
});

app.post("/api/admin/device-requests/:id/approve", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin
        .from('device_requests')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'pending');
        
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

app.post("/api/admin/device-requests/:id/reject", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin
        .from('device_requests')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'pending');
        
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

app.post("/api/document/verify", async (req, res) => {
    const { token } = req.body;
    const orderId = verifyAccessToken(token);
    if (!orderId) return res.status(400).json({ error: "Invalid or expired document link." });
    
    // Authoritative check: order must exist and be paid
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('Orders')
      .select('id, status, paper_id')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order || order.status !== 'paid') {
      return res.status(403).json({ error: "Access denied. Payment is awaiting verification or has not been confirmed." });
    }

    const cookies = req.headers.cookie || '';
    const match = cookies.match(/(?:^|; )device_id=([^;]*)/);
    const deviceId = match ? match[1] : null;
    
    const { data: dls } = await supabaseAdmin.from('downloads')
      .select('id')
      .eq('order_id', orderId)
      .order('downloaded_at', { ascending: true });
    
    const devices = dls || [];
    
    if (deviceId && devices.some(d => d.id === deviceId)) {
        console.log(`[ACCESS LOG] Successful access to order ${orderId} by device ${deviceId}`);
        return res.json({ success: true });
    }
    
    let limit = 3;
    const { data: reqs, error: reqErr } = await supabaseAdmin.from('device_requests').select('status').eq('order_id', orderId);
    if (!reqErr && reqs) {
        limit += reqs.filter(r => r.status === 'approved').length;
    }

    if (devices.length < limit) {
        return res.json({ requireNames: true });
    } else {
        return res.json({ error: `Device limit reached. This document has already been registered on ${limit} devices.` });
    }
});

app.post("/api/document/register-device", async (req, res) => {
    const { token, firstName, secondName } = req.body;
    const orderId = verifyAccessToken(token);
    if (!orderId) return res.status(400).json({ error: "Invalid link." });
    
    const { data: order } = await supabaseAdmin.from('Orders')
      .select('*, customers(first_name, second_name)')
      .eq('id', orderId)
      .maybeSingle();
      
    if (!order || order.status !== 'paid') return res.status(400).json({ error: "Order not active." });
    
    const cust = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    if (!cust) return res.status(400).json({ error: "Customer data missing." });
    
    const targetFirst = (cust.first_name || '').trim().toLowerCase();
    const targetSecond = (cust.second_name || '').trim().toLowerCase();
    const inputFirst = (firstName || '').trim().toLowerCase();
    const inputSecond = (secondName || '').trim().toLowerCase();
    
    if (targetFirst !== inputFirst || targetSecond !== inputSecond) {
        console.warn(`[ACCESS LOG] Failed device registration for order ${orderId}. Name mismatch.`);
        return res.status(400).json({ error: "These details do not match the information used for this purchase." });
    }

    const cookies = req.headers.cookie || '';
    const match = cookies.match(/(?:^|; )device_id=([^;]*)/);
    let deviceId = match ? match[1] : crypto.randomUUID();

    // 1. Fetch existing registered devices for this order using REAL orderId
    const { data: existingDls } = await supabaseAdmin.from('downloads')
      .select('id, order_id')
      .eq('order_id', orderId)
      .order('downloaded_at', { ascending: true });
      
    const devices = existingDls || [];
    
    // 2. Check if THIS device is already registered
    const isAlreadyRegistered = devices.some(d => d.id === deviceId);
    if (isAlreadyRegistered) {
        // ALLOW - Already registered
        res.setHeader('Set-Cookie', `device_id=${deviceId}; HttpOnly; Path=/; Max-Age=315360000; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
        return res.json({ success: true });
    }
    
    // 3. New device - check limit
    let limit = 3;
    const { data: reqs, error: reqErr } = await supabaseAdmin.from('device_requests').select('status').eq('order_id', orderId);
    if (!reqErr && reqs) {
        limit += reqs.filter(r => r.status === 'approved').length;
    }

    if (devices.length >= limit) {
        return res.status(400).json({ error: `Device limit reached. This document has already been registered on ${limit} devices.` });
    }
    
    // 4. Register new device using the REAL orderId
    const { error: insertErr } = await supabaseAdmin.from('downloads').insert({
        id: deviceId,
        order_id: orderId,
        paper_id: order.paper_id,
        downloaded_at: new Date().toISOString()
    });
    
    if (insertErr) {
        console.error("Device registration insert error:", insertErr);
        return res.status(500).json({ error: "Registration failed." });
    }
    
    // Concurrency check
    const { data: checkDls } = await supabaseAdmin.from('downloads')
      .select('id')
      .eq('order_id', orderId)
      .order('downloaded_at', { ascending: true });
      
    if (checkDls && checkDls.length > 3) {
        const allowedIds = checkDls.slice(0, 3).map(d => d.id);
        if (!allowedIds.includes(deviceId)) {
             await supabaseAdmin.from('downloads').delete().eq('id', deviceId).eq('order_id', orderId);
             return res.status(400).json({ error: "Device limit reached. This document has already been registered on 3 devices." });
        }
    }
    
    console.log(`[ACCESS LOG] Order ${orderId} successfully registered to device ${deviceId}`);
    
    res.setHeader('Set-Cookie', `device_id=${deviceId}; HttpOnly; Path=/; Max-Age=315360000; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return res.json({ success: true });
});

app.get("/api/document/stream/:token", async (req, res) => {
    const { token } = req.params;
    const orderId = verifyAccessToken(token);
    if (!orderId) return res.status(403).send("Invalid token");
    
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/(?:^|; )device_id=([^;]*)/);
    const deviceId = match ? match[1] : null;
    
    if (!deviceId) {
        console.warn(`[ACCESS LOG] Stream rejected for ${orderId}: No device cookie`);
        return res.status(403).send("Device unauthorized. Please open the document through the secure link.");
    }
    
    const { data: dls } = await supabaseAdmin.from('downloads')
      .select('id')
      .eq('order_id', orderId)
      .order('downloaded_at', { ascending: true });
      
    const devices = dls || [];
    const isRegistered = devices.some(d => d.id === deviceId);
    
    if (!isRegistered) {
        console.warn(`[ACCESS LOG] Stream rejected for ${orderId}: Device mismatch.`);
        return res.status(403).send("This document is already registered to another device.");
    }
    
    const { data: order } = await supabaseAdmin.from('Orders').select('paper_id, status').eq('id', orderId).maybeSingle();
    if (!order || order.status !== 'paid') return res.status(403).send("Access denied. Order is not active or awaiting payment confirmation.");
    
    const { data: paper } = await supabaseAdmin.from('Papers').select('file_path, unit_code').eq('id', order.paper_id).maybeSingle();
    if (!paper || !paper.file_path) return res.status(404).send("File not found (may have been deleted)");
    
    // Attempt to serve merged document first
    let downloadPath = paper.file_path;
    const mergedPath = `merged/${orderId}.pdf`;
    const { data: existingMerged } = await supabaseAdmin.storage.from("Papers").list('merged', { search: `${orderId}.pdf` });
    if (existingMerged && existingMerged.length > 0 && existingMerged[0].name === `${orderId}.pdf`) {
        downloadPath = mergedPath;
        console.log(`[ACCESS LOG] Serving merged document for order ${orderId}`);
    } else {
        console.log(`[ACCESS LOG] Serving original document for order ${orderId} (merged not found)`);
    }

    const { data: fileData, error: downloadErr } = await supabaseAdmin.storage.from("Papers").download(downloadPath);
    if (downloadErr || !fileData) {
        console.error("Storage download error:", downloadErr);
        return res.status(500).send("Storage error");
    }
    
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfUint8 = new Uint8Array(arrayBuffer);
    
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(pdfUint8), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    const payload = JSON.stringify({
        filename: `${paper.unit_code}.pdf`,
        contentType: 'application/pdf'
    });
    const payloadBuffer = Buffer.from(payload, 'utf-8');
    const payloadLength = Buffer.alloc(4);
    payloadLength.writeUInt32BE(payloadBuffer.length, 0);
    
    const encryptedBytes = Buffer.concat([
        iv,
        authTag,
        payloadLength,
        payloadBuffer,
        encrypted
    ]);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    console.log(`[ACCESS LOG] Successfully streamed encrypted document to device ${deviceId} for order ${orderId}`);
    return res.send(Buffer.from(encryptedBytes));
});




app.post("/api/admin/orders/:id/activate", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find Order with Customer details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .select("*, customers(first_name, second_name, phone)")
      .eq("id", id)
      .single();

    if (orderErr || !order) return res.status(404).json({ error: "Order not found" });

    // Fetch Paper details safely
    let paperObj: { paper_title?: string; unit_code?: string } | null = null;
    if (order.paper_id) {
      const { data: paper } = await supabaseAdmin
        .from("Papers")
        .select("paper_title, unit_code")
        .eq("id", order.paper_id)
        .maybeSingle();
      paperObj = paper;
    }

    // 2. Find Payment
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false });

    const payment = payments && payments.length > 0 ? payments[0] : null;

    const isAlreadyPaid = order.status === 'paid';

    // 3. Mark as Paid (Idempotent)
    if (!isAlreadyPaid) {
      await supabaseAdmin.from("Orders").update({ status: 'paid' }).eq("id", id);
    }
    if (payment && payment.status !== 'completed' && payment.status !== 'manual_used') {
      await supabaseAdmin.from("payments").update({ status: 'completed' }).eq("order_id", id);
    }

    // 4. Trigger Receipt Generation (Idempotent - checks if merged/{orderId}.pdf already exists)
    const receiptSuccess = await generateAndMergeReceipt(id);

    // 5. Generate Secure Open Document URL for this exact order
    const token = generateAccessToken(id);
    const openDocumentUrl = getDocumentAccessUrl(req, token);

    // 6. Check Document Access Status (Devices registered in downloads)
    const { data: devices } = await supabaseAdmin.from("downloads").select("id").eq("order_id", id);
    const deviceCount = devices ? devices.length : 0;

    // 7. Student details
    const studentEmail = order.customers?.phone || payment?.phone || '';
    const paperTitle = paperObj?.paper_title || 'Purchased Document';
    const unitCode = paperObj?.unit_code || '';

    // 8. Handle Automatic Email Sending
    // If order was ALREADY paid on previous activation, do NOT silently re-send email (use explicit RESEND EMAIL instead)
    let emailStatus: 'EMAIL SENT' | 'EMAIL FAILED' | 'EMAIL NOT CONFIGURED' = 'EMAIL NOT CONFIGURED';
    let emailError: string | undefined;

    if (isAlreadyPaid) {
      const cached = orderEmailStatusMap.get(id);
      emailStatus = cached ? cached.status : 'EMAIL SENT';
      emailError = cached?.error;
    } else {
      // First-time activation: trigger automatic email
      const emailResult = await sendActivationEmail({
        to: studentEmail,
        firstName: order.customers?.first_name || '',
        paperTitle,
        openDocumentUrl,
      });
      emailStatus = emailResult.status;
      emailError = emailResult.error;

      orderEmailStatusMap.set(id, {
        status: emailStatus,
        sentAt: new Date().toISOString(),
        error: emailError,
      });
    }

    const activationResult = {
      studentFirstName: order.customers?.first_name || '',
      studentSecondName: order.customers?.second_name || '',
      studentEmail: studentEmail,
      paperTitle: paperTitle,
      unitCode: unitCode,
      amount: order.amount,
      mpesaReceipt: payment?.mpesa_receipt || '',
      orderId: id,
      activationTimestamp: new Date().toISOString(),
      openDocumentUrl: openDocumentUrl,
      documentAccessStatus: `${deviceCount} / 3`,
      receiptGenerationStatus: receiptSuccess ? 'GENERATED' : 'FAILED',
      emailStatus: emailStatus,
      emailError: emailError,
      paymentStatus: 'CONFIRMED',
      alreadyActivated: isAlreadyPaid,
    };

    return res.json({ success: true, result: activationResult });

  } catch (err) {
    console.error("Admin activation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Resend Activation Email (Idempotent - does not duplicate orders, receipts, payments, or device registrations)
app.post("/api/admin/orders/:id/resend-email", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch existing order with customer details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("Orders")
      .select("*, customers(first_name, second_name, phone)")
      .eq("id", id)
      .single();

    if (orderErr || !order) return res.status(404).json({ error: "Order not found" });

    // Fetch Paper details safely
    let paperObj: { paper_title?: string; unit_code?: string } | null = null;
    if (order.paper_id) {
      const { data: paper } = await supabaseAdmin
        .from("Papers")
        .select("paper_title, unit_code")
        .eq("id", order.paper_id)
        .maybeSingle();
      paperObj = paper;
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ error: "Order is not activated yet. Please activate the order first." });
    }

    // 2. Fetch payment for phone fallback
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("phone")
      .eq("order_id", id)
      .limit(1)
      .maybeSingle();

    const studentEmail = order.customers?.phone || payment?.phone || '';
    if (!studentEmail || !studentEmail.includes('@')) {
      return res.status(400).json({ error: "No valid email address found for this order." });
    }

    // 3. Prepare exact Open Document URL for this purchase
    const token = generateAccessToken(id);
    const openDocumentUrl = getDocumentAccessUrl(req, token);

    const paperTitle = paperObj?.paper_title || 'Purchased Document';

    // 4. Resend email
    const emailResult = await sendActivationEmail({
      to: studentEmail,
      firstName: order.customers?.first_name || '',
      paperTitle,
      openDocumentUrl,
    });

    orderEmailStatusMap.set(id, {
      status: emailResult.status,
      sentAt: new Date().toISOString(),
      error: emailResult.error,
    });

    return res.json({
      success: emailResult.success,
      emailStatus: emailResult.status,
      error: emailResult.error,
    });

  } catch (err) {
    console.error("Admin resend email error:", err);
    return res.status(500).json({ error: "Failed to resend email." });
  }
});

app.post("/api/admin/orders/:id/generate-receipt", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const success = await generateAndMergeReceipt(id);
    if (success) {
        return res.json({ success: true });
    } else {
        return res.status(500).json({ error: "Failed to generate receipt." });
    }
});

// Admin: Correct / Update Submitted M-Pesa Code in-place (No duplicate payment/order)
app.patch("/api/admin/orders/:id/code", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { mpesaCode } = req.body;
    if (!mpesaCode || typeof mpesaCode !== 'string') {
      return res.status(400).json({ error: "A valid M-Pesa code is required." });
    }
    const cleanCode = mpesaCode.trim().toUpperCase();

    // Find existing payment for this order
    const { data: payments, error: findErr } = await supabaseAdmin
      .from("payments")
      .select("id, mpesa_receipt")
      .eq("order_id", id)
      .order("created_at", { ascending: false });

    if (findErr) throw findErr;

    if (payments && payments.length > 0) {
      const paymentId = payments[0].id;
      const { error: updateErr } = await supabaseAdmin
        .from("payments")
        .update({ mpesa_receipt: cleanCode })
        .eq("id", paymentId);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from("payments")
        .insert({
          order_id: id,
          mpesa_receipt: cleanCode,
          status: 'pending',
          phone: 'MANUAL',
        });
      if (insertErr) throw insertErr;
    }

    return res.json({ success: true, mpesaCode: cleanCode });
  } catch (err: any) {
    console.error("Update order M-Pesa code error:", err);
    return res.status(500).json({ error: "Failed to update M-Pesa code." });
  }
});

// Admin: Reject / Cancel Invalid Pending Activation Request
app.post("/api/admin/orders/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error: orderErr } = await supabaseAdmin
      .from("Orders")
      .update({ status: 'rejected' })
      .eq("id", id);
    if (orderErr) throw orderErr;

    await supabaseAdmin
      .from("payments")
      .update({ status: 'rejected' })
      .eq("order_id", id);

    return res.json({ success: true, message: "Order rejected." });
  } catch (err: any) {
    console.error("Reject order error:", err);
    return res.status(500).json({ error: "Failed to reject order." });
  }
});

// Admin: Complete Document Access Directory with real device tracking
app.get("/api/admin/document-access", requireAdmin, async (req, res) => {
  try {
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from("Orders")
      .select("id, amount, status, created_at, paper_id, customers(first_name, second_name, phone), payments(mpesa_receipt, status)")
      .in("status", ["paid", "completed"])
      .order("created_at", { ascending: false });

    if (ordersErr) throw ordersErr;
    if (!orders || orders.length === 0) return res.json([]);

    const paperIds = Array.from(new Set(orders.map((o: any) => o.paper_id).filter(Boolean)));
    const paperMap = new Map();
    if (paperIds.length > 0) {
      const { data: papers } = await supabaseAdmin
        .from("Papers")
        .select("id, paper_title, unit_code")
        .in("id", paperIds);
      if (papers) papers.forEach((p: any) => paperMap.set(p.id, p));
    }

    const orderIds = orders.map((o: any) => o.id);
    const { data: downloads } = await supabaseAdmin
      .from("downloads")
      .select("id, order_id, downloaded_at")
      .in("order_id", orderIds);

    const downloadsMap = new Map<string, any[]>();
    if (downloads) {
      downloads.forEach((d: any) => {
        const list = downloadsMap.get(d.order_id) || [];
        list.push(d);
        downloadsMap.set(d.order_id, list);
      });
    }

    const { data: devReqs } = await supabaseAdmin
      .from("device_requests")
      .select("order_id, status")
      .in("order_id", orderIds)
      .eq("status", "approved");

    const approvedReqsMap = new Map<string, number>();
    if (devReqs) {
      devReqs.forEach((r: any) => {
        const count = approvedReqsMap.get(r.order_id) || 0;
        approvedReqsMap.set(r.order_id, count + 1);
      });
    }

    const host = req.get("host");
    const protocol = req.protocol;

    const accessList = orders.map((order: any) => {
      const dls = downloadsMap.get(order.id) || [];
      const extraAllowed = approvedReqsMap.get(order.id) || 0;
      const maxAllowed = 3 + extraAllowed;
      const sortedDls = [...dls].sort((a, b) => new Date(b.downloaded_at || 0).getTime() - new Date(a.downloaded_at || 0).getTime());
      const lastAccess = sortedDls.length > 0 ? sortedDls[0].downloaded_at : null;
      const token = generateAccessToken(order.id);
      const openDocumentUrl = getDocumentAccessUrl(req, token);
      const paper = paperMap.get(order.paper_id) || null;

      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
      const payment = Array.isArray(order.payments) && order.payments.length > 0 ? order.payments[0] : order.payments;

      return {
        orderId: order.id,
        createdAt: order.created_at,
        customerName: customer ? `${customer.first_name || ''} ${customer.second_name || ''}`.trim() : 'Customer',
        customerPhone: customer?.phone || '—',
        paperTitle: paper?.paper_title || 'Past Exam Paper',
        unitCode: paper?.unit_code || 'UNIT',
        mpesaReceipt: payment?.mpesa_receipt || 'PAID',
        activationStatus: order.status,
        documentAccessStatus: 'ACTIVE',
        devicesUsed: dls.length,
        maxDevices: maxAllowed,
        lastAccessedAt: lastAccess,
        openDocumentUrl,
        deviceDetails: dls.map((d: any) => ({ id: d.id, downloadedAt: d.downloaded_at }))
      };
    });

    return res.json(accessList);
  } catch (err: any) {
    console.error("Admin document access error:", err);
    return res.status(500).json({ error: "Failed to fetch document access records." });
  }
});

// Admin: Reset registered devices for an order (Troubleshooting / Changed Device)
app.post("/api/admin/orders/:id/reset-devices", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("downloads").delete().eq("order_id", id);
    if (error) throw error;
    return res.json({ success: true, message: "Device authorizations successfully reset." });
  } catch (err: any) {
    console.error("Reset devices error:", err);
    return res.status(500).json({ error: "Failed to reset device authorizations." });
  }
});

// Admin: Operational Infrastructure Health Diagnostic
app.get("/api/admin/system/status", requireAdmin, async (req, res) => {
  try {
    const startTime = Date.now();

    // 1. Supabase Database Connection
    let dbStatus = "operational";
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      const { count, error: dbErr } = await supabaseAdmin
        .from("Orders")
        .select("*", { count: "exact", head: true });
      dbLatencyMs = Date.now() - dbStart;
      if (dbErr) dbStatus = "degraded";
    } catch (e) {
      dbStatus = "down";
    }

    // 2. Supabase Storage ("Papers" Bucket)
    let storageStatus = "operational";
    let storageCount = 0;
    try {
      const { data: storageList, error: stErr } = await supabaseAdmin
        .storage
        .from("Papers")
        .list("", { limit: 5 });
      if (stErr) {
        storageStatus = "degraded";
      } else {
        storageCount = storageList?.length || 0;
      }
    } catch (e) {
      storageStatus = "down";
    }

    // 3. M-Pesa Daraja Configuration Readiness
    const mpesaKeySet = Boolean(process.env.MPESA_CONSUMER_KEY);
    const mpesaSecretSet = Boolean(process.env.MPESA_CONSUMER_SECRET);
    const mpesaPasskeySet = Boolean(process.env.MPESA_PASSKEY);
    const mpesaShortcodeSet = Boolean(process.env.MPESA_SHORTCODE || process.env.MPESA_STORE_NUMBER);
    const mpesaReady = mpesaKeySet && mpesaSecretSet && mpesaPasskeySet;

    // 4. Email / SMTP Configuration Readiness
    const emailUserSet = Boolean(process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER);
    const emailPassSet = Boolean(process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD);
    const emailReady = emailUserSet && emailPassSet;

    const totalLatency = Date.now() - startTime;
    const uptimeSec = Math.floor(process.uptime());

    return res.json({
      timestamp: new Date().toISOString(),
      overall: dbStatus === "operational" && storageStatus === "operational" ? "healthy" : "warning",
      subsystems: {
        database: {
          name: "PostgreSQL Database (Supabase)",
          status: dbStatus,
          latencyMs: dbLatencyMs,
          connected: dbStatus === "operational",
        },
        storage: {
          name: 'Supabase Storage ("Papers" Bucket)',
          status: storageStatus,
          connected: storageStatus === "operational",
          accessibleFilesSample: storageCount,
        },
        mpesa: {
          name: "M-Pesa Daraja STK Gateway",
          status: mpesaReady ? "configured" : "pending_configuration",
          details: {
            consumerKeyConfigured: mpesaKeySet,
            consumerSecretConfigured: mpesaSecretSet,
            passkeyConfigured: mpesaPasskeySet,
            shortcodeConfigured: mpesaShortcodeSet,
          },
        },
        email: {
          name: "Email Dispatcher (Gmail / SMTP)",
          status: emailReady ? "configured" : "fallback_mode",
          details: {
            userConfigured: emailUserSet,
            credentialsConfigured: emailPassSet,
          },
        },
        security: {
          name: "AES-256-GCM Token Encryption & 3-Device Enforcement",
          status: "active_enforced",
          keyEstablished: true,
        },
        server: {
          uptimeSeconds: uptimeSec,
          nodeVersion: process.version,
          port: 3000,
          pingMs: totalLatency,
        },
      },
    });
  } catch (err) {
    console.error("System status probe error:", err);
    return res.status(500).json({ error: "Failed to retrieve system status" });
  }
});

app.get("/api/test_schema", async (req, res) => {
  const { data, error } = await supabaseAdmin.from('downloads').select('*').limit(1);
  res.json({ data, error });
});



// Affiliate Program Endpoints
app.get("/api/affiliates", requireAdmin, requireRole(["super_admin", "support_admin"]), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch affiliates error:", error);
      return res.status(500).json({ error: "Failed to fetch affiliates" });
    }

    const mapped = data.map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone_number,
      email: row.email_address,
      linkedInUrl: row.linkedin_url,
      university: row.university_college,
      campusCourse: row.course_program,
      paperCount: row.paper_volume,
      academicYears: row.academic_years,
      unitsDescription: row.units_summary,
      status: row.status,
      createdAt: row.created_at,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Affiliate get error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/affiliates", async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      linkedInUrl,
      university,
      campusCourse,
      paperCount,
      academicYears,
      unitsDescription,
    } = req.body;

    if (!fullName || !phone || !email || !university || !unitsDescription) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .insert([{
        full_name: fullName,
        phone_number: phone,
        email_address: email,
        linkedin_url: linkedInUrl || null,
        university_college: university,
        course_program: campusCourse || null,
        paper_volume: paperCount || null,
        academic_years: academicYears || null,
        units_summary: unitsDescription,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error("Affiliate insertion error:", error);
      return res.status(500).json({ error: "Failed to submit application" });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Affiliate post error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/affiliates/:id", requireAdmin, requireRole(["super_admin", "support_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Missing status" });
    }

    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update affiliate error:", error);
      return res.status(500).json({ error: "Failed to update affiliate" });
    }

    res.json(data);
  } catch (err) {
    console.error("Affiliate patch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/affiliates/:id", requireAdmin, requireRole(["super_admin", "support_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin
      .from("affiliates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete affiliate error:", error);
      return res.status(500).json({ error: "Failed to delete affiliate" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Affiliate delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Express 4 wildcard syntax
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
