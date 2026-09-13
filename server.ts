import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { db } from "./src/db";
import { examPapers, transactions, contactMessages, affiliatePartners } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Configure Multer memory storage for PDF file uploads (25MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Initialize Supabase Server Admin Client
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cwspikvwjsg2imxbuo5e.supabase.co';
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY) {
  console.warn(
    "Notice: SUPABASE_SERVICE_ROLE_KEY environment variable is not defined on server. Please add SUPABASE_SERVICE_ROLE_KEY to .env for server-side Storage administration."
  );
}

// Increase body limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Route for Digitizing Exam Paper
app.post("/api/digitize-paper", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
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

// Seed and fallback data store for exam papers (starts empty, real source of truth is Supabase public.papers)
const inMemoryPapers: any[] = [];

// Transactions store (starts empty, payment backend not yet connected)
const inMemoryTransactions: any[] = [];

// Messages store (starts empty, contact messaging backend not yet connected)
const inMemoryMessages: any[] = [];

// Affiliate partners store (starts empty, affiliate backend not yet connected)
const inMemoryAffiliates: any[] = [];

// Database API Routes with Safe In-Memory Fallback

/**
 * Secure Backend Endpoint for Paper Upload & Administration
 * Validates request, uploads PDF to private Supabase Storage bucket "Papers",
 * inserts/updates public."Papers", handles transactional cleanup on DB error.
 */
app.post("/api/papers/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    const paperId = req.body?.paperId?.trim();
    const unitCode = (req.body?.unit_code || req.body?.unitCode || '').trim().toUpperCase();
    const paperTitle = (req.body?.paper_title || req.body?.unitName || '').trim();
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

      const idx = inMemoryPapers.findIndex(p => p.id === safePaper.id);
      if (idx !== -1) {
        inMemoryPapers[idx] = safePaper;
      } else {
        inMemoryPapers.unshift(safePaper);
      }

      return res.status(201).json({ success: true, paper: safePaper });
    } else {
      // --- EDIT EXISTING PAPER ---
      const { data: existingPaper } = await supabaseAdmin
        .from("Papers")
        .select("*")
        .eq("id", paperId)
        .single();

      const oldFilePath = existingPaper?.file_path || null;

      if (file) {
        // --- EDIT WITH REPLACEMENT PDF ---
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

        const idx = inMemoryPapers.findIndex(p => p.id === paperId);
        if (idx !== -1) inMemoryPapers[idx] = safePaper;

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

        const idx = inMemoryPapers.findIndex(p => p.id === paperId);
        if (idx !== -1) inMemoryPapers[idx] = safePaper;

        return res.json({ success: true, paper: safePaper });
      }
    }
  } catch (err: any) {
    console.error("Unexpected upload route error:", err);
    res.status(500).json({ error: "An unexpected error occurred processing the upload request." });
  }
});

app.get("/api/papers", async (req, res) => {
  if (db) {
    try {
      const papers = await db.select().from(examPapers).orderBy(desc(examPapers.createdAt));
      if (papers && papers.length > 0) {
        const normalized = papers.map((p) => ({
          id: p.id,
          unit_code: p.unitCode,
          paper_title: p.unitName,
          unitCode: p.unitCode,
          unitName: p.unitName,
          price: p.price,
          status: p.isAvailable ? 'available' : 'unavailable',
          isAvailable: p.isAvailable,
          file_path: p.fileName || `papers/${p.unitCode}_Exam.pdf`,
          fileName: p.fileName,
          fileSize: p.fileSize || '1.2 MB',
          year: p.year,
          downloadsCount: p.downloadsCount,
          docId: p.docId,
          digitizedContent: p.digitizedContent,
          created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        }));
        return res.json(normalized);
      }
    } catch (err: any) {
      console.warn("Database query skipped/failed, using in-memory store:", err?.message || err);
    }
  }
  res.json(inMemoryPapers);
});

app.post("/api/papers", async (req, res) => {
  const paperData = req.body;
  const unitCode = (paperData.unit_code || paperData.unitCode || 'UNIT101').trim().toUpperCase();
  const unitName = (paperData.paper_title || paperData.unitName || 'Course Unit').trim();
  const price = paperData.price || 'KSh 50';
  const status = paperData.status || (paperData.isAvailable !== false ? 'available' : 'unavailable');
  const isAvailable = status === 'available';
  const filePath = paperData.file_path || paperData.fileName || `papers/${unitCode}_Exam.pdf`;
  const year = paperData.year || '2024';

  if (db) {
    try {
      const newPaper = await db.insert(examPapers).values({
        unitName,
        unitCode,
        year,
        price,
        isAvailable,
        downloadsCount: paperData.downloadsCount || 0,
        docId: paperData.docId || `MKU-${unitCode}-${year}-${Math.floor(100 + Math.random() * 900)}`,
        fileName: filePath,
        fileSize: paperData.fileSize || '1.2 MB',
        digitizedContent: paperData.digitizedContent || null,
      }).returning();

      if (newPaper && newPaper[0]) {
        const formatted = {
          id: newPaper[0].id,
          unit_code: newPaper[0].unitCode,
          paper_title: newPaper[0].unitName,
          unitCode: newPaper[0].unitCode,
          unitName: newPaper[0].unitName,
          price: newPaper[0].price,
          status: newPaper[0].isAvailable ? 'available' : 'unavailable',
          isAvailable: newPaper[0].isAvailable,
          file_path: newPaper[0].fileName,
          fileName: newPaper[0].fileName,
          fileSize: newPaper[0].fileSize,
          year: newPaper[0].year,
          downloadsCount: newPaper[0].downloadsCount,
          docId: newPaper[0].docId,
          digitizedContent: newPaper[0].digitizedContent,
          created_at: new Date(newPaper[0].createdAt).toISOString(),
          createdAt: new Date(newPaper[0].createdAt).toISOString(),
        };
        inMemoryPapers.unshift(formatted);
        return res.json(formatted);
      }
    } catch (err: any) {
      console.warn("Database insert skipped/failed, using in-memory store:", err?.message || err);
    }
  }

  const fallbackPaper = {
    id: `paper-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    unit_code: unitCode,
    paper_title: unitName,
    unitCode: unitCode,
    unitName: unitName,
    year,
    price,
    status,
    isAvailable,
    downloadsCount: paperData.downloadsCount || 0,
    docId: paperData.docId || `MKU-${unitCode}-${year}-${Math.floor(100 + Math.random() * 900)}`,
    file_path: filePath,
    fileName: filePath,
    fileSize: paperData.fileSize || '1.2 MB',
    digitizedContent: paperData.digitizedContent || null,
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  inMemoryPapers.unshift(fallbackPaper);
  res.json(fallbackPaper);
});

// Update Paper
app.patch("/api/papers/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const index = inMemoryPapers.findIndex(p => p.id === id || p.docId === id);
  if (index !== -1) {
    const existing = inMemoryPapers[index];
    const unitCode = updates.unit_code || updates.unitCode || existing.unit_code;
    const paperTitle = updates.paper_title || updates.unitName || existing.paper_title;
    const price = updates.price !== undefined ? updates.price : existing.price;
    const status = updates.status !== undefined ? updates.status : (updates.isAvailable !== undefined ? (updates.isAvailable ? 'available' : 'unavailable') : existing.status);
    const filePath = updates.file_path || updates.fileName || existing.file_path;

    const updated = {
      ...existing,
      unit_code: unitCode,
      paper_title: paperTitle,
      unitCode,
      unitName: paperTitle,
      price,
      status,
      isAvailable: status === 'available',
      file_path: filePath,
      fileName: filePath,
      ...(updates.year ? { year: updates.year } : {}),
    };
    inMemoryPapers[index] = updated;

    if (db) {
      try {
        await db.update(examPapers).set({
          unitName: paperTitle,
          unitCode,
          price,
          isAvailable: status === 'available',
          fileName: filePath,
          ...(updates.year ? { year: updates.year } : {}),
        }).where(eq(examPapers.id, id));
      } catch (e) {
        console.warn("DB update skipped:", e);
      }
    }

    return res.json(updated);
  }

  res.status(404).json({ error: "Paper not found" });
});

app.put("/api/papers/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = inMemoryPapers.findIndex(p => p.id === id || p.docId === id);
  if (index !== -1) {
    const existing = inMemoryPapers[index];
    const unitCode = (updates.unit_code || updates.unitCode || existing.unit_code).toUpperCase();
    const paperTitle = updates.paper_title || updates.unitName || existing.paper_title;
    const price = updates.price || existing.price;
    const status = updates.status || (updates.isAvailable !== undefined ? (updates.isAvailable ? 'available' : 'unavailable') : existing.status);
    const filePath = updates.file_path || updates.fileName || existing.file_path;

    const updated = {
      ...existing,
      unit_code: unitCode,
      paper_title: paperTitle,
      unitCode,
      unitName: paperTitle,
      price,
      status,
      isAvailable: status === 'available',
      file_path: filePath,
      fileName: filePath,
    };
    inMemoryPapers[index] = updated;
    return res.json(updated);
  }
  res.status(404).json({ error: "Paper not found" });
});

// Delete Paper
app.delete("/api/papers/:id", async (req, res) => {
  const { id } = req.params;
  const index = inMemoryPapers.findIndex(p => p.id === id || p.docId === id);
  if (index !== -1) {
    inMemoryPapers.splice(index, 1);
  }
  if (db) {
    try {
      await db.delete(examPapers).where(eq(examPapers.id, id));
    } catch (e) {
      console.warn("DB delete skipped:", e);
    }
  }
  res.json({ success: true });
});

app.post("/api/papers/:id/download", async (req, res) => {
  const { id } = req.params;
  const paperInMemory = inMemoryPapers.find(p => p.id === id || p.docId === id);
  if (paperInMemory) {
    paperInMemory.downloadsCount = (paperInMemory.downloadsCount || 0) + 1;
  }
  if (db) {
    try {
      const paper = await db.select().from(examPapers).where(eq(examPapers.id, id)).limit(1);
      if (paper.length > 0) {
        await db.update(examPapers).set({ downloadsCount: paper[0].downloadsCount + 1 }).where(eq(examPapers.id, id));
      }
    } catch (err: any) {
      console.warn("Database update skipped/failed:", err?.message || err);
    }
  }
  res.json({ success: true });
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
app.post("/api/mpesa/stkpush", async (req, res) => {
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

    // 7. Check Server M-Pesa Daraja Credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const mpesaEnv = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://example.com/api/mpesa/callback';

    if (!consumerKey || !consumerSecret) {
      // Revert newly created pending payment & order (preserve customer)
      await supabaseAdmin.from("payments").delete().eq("id", paymentId);
      await supabaseAdmin.from("Orders").delete().eq("id", orderId);

      return res.status(400).json({
        success: false,
        error: "Server M-Pesa Daraja credentials (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET) are not configured on the server."
      });
    }

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

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err: any) {
    console.error("Unexpected error in M-Pesa callback endpoint:", err);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

app.get("/api/transactions", async (req, res) => {
  if (db) {
    try {
      const tx = await db.select().from(transactions).orderBy(desc(transactions.timestamp));
      if (tx && tx.length > 0) {
        return res.json(tx);
      }
    } catch (err: any) {
      console.warn("Database query skipped/failed, using in-memory store:", err?.message || err);
    }
  }
  res.json(inMemoryTransactions);
});

app.post("/api/transactions", async (req, res) => {
  const txData = req.body;
  if (db) {
    try {
      const newTx = await db.insert(transactions).values(txData).returning();
      if (newTx && newTx[0]) {
        inMemoryTransactions.unshift(newTx[0] as any);
        return res.json(newTx[0]);
      }
    } catch (err: any) {
      console.warn("Database insert skipped/failed, using in-memory store:", err?.message || err);
    }
  }

  const fallbackTx = {
    id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
    studentFirstName: txData.studentFirstName || 'Student',
    studentSecondName: txData.studentSecondName || '',
    phone: txData.phone || '',
    unitCode: txData.unitCode || txData.unit_code || '',
    unitName: txData.unitName || txData.paper_title || '',
    unit_code: txData.unitCode || txData.unit_code || '',
    paper_title: txData.unitName || txData.paper_title || '',
    price: txData.price || 'KSh 50',
    mpesaReceipt: txData.mpesaReceipt || `QK${Math.floor(100000 + Math.random() * 900000)}`,
    passwordUsed: txData.passwordUsed || txData.studentFirstName || 'Paper',
    status: txData.status || 'Completed',
    timestamp: new Date().toISOString(),
  };
  inMemoryTransactions.unshift(fallbackTx);
  res.json(fallbackTx);
});

app.delete("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const index = inMemoryTransactions.findIndex(t => t.id === id || t.mpesaReceipt === id);
  if (index !== -1) {
    inMemoryTransactions.splice(index, 1);
  }
  res.json({ success: true });
});

app.get("/api/messages", async (req, res) => {
  if (db) {
    try {
      const msgs = await db.select().from(contactMessages).orderBy(desc(contactMessages.timestamp));
      if (msgs && msgs.length > 0) {
        return res.json(msgs);
      }
    } catch (err: any) {
      console.warn("Database query skipped/failed, using in-memory store:", err?.message || err);
    }
  }
  res.json(inMemoryMessages);
});

app.post("/api/messages", async (req, res) => {
  const msgData = req.body;
  if (db) {
    try {
      const newMsg = await db.insert(contactMessages).values(msgData).returning();
      if (newMsg && newMsg[0]) {
        inMemoryMessages.unshift(newMsg[0] as any);
        return res.json(newMsg[0]);
      }
    } catch (err: any) {
      console.warn("Database insert skipped/failed, using in-memory store:", err?.message || err);
    }
  }

  const fallbackMsg = {
    id: `MSG-${Math.floor(100 + Math.random() * 900)}`,
    fullName: msgData.fullName || 'Anonymous',
    email: msgData.email || '',
    phone: msgData.phone || '',
    subject: msgData.subject || 'Inquiry',
    message: msgData.message || '',
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  inMemoryMessages.unshift(fallbackMsg);
  res.json(fallbackMsg);
});

app.patch("/api/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { isRead } = req.body;
  const msg = inMemoryMessages.find(m => m.id === id);
  if (msg) {
    if (isRead !== undefined) msg.isRead = isRead;
    return res.json(msg);
  }
  res.status(404).json({ error: "Message not found" });
});

app.delete("/api/messages/:id", async (req, res) => {
  const { id } = req.params;
  const idx = inMemoryMessages.findIndex(m => m.id === id);
  if (idx !== -1) {
    inMemoryMessages.splice(idx, 1);
  }
  res.json({ success: true });
});

// Admin Live Stats Endpoint
app.get("/api/admin/stats", (req, res) => {
  const totalPapers = inMemoryPapers.length;
  const activePapers = inMemoryPapers.filter(p => p.status === 'available' || p.isAvailable).length;
  const totalDownloads = inMemoryPapers.reduce((sum, p) => sum + (Number(p.downloadsCount) || 0), 0);
  const totalRevenue = inMemoryTransactions
    .filter(t => t.status === 'Completed')
    .reduce((sum, t) => {
      const num = parseInt(String(t.price).replace(/[^0-9]/g, ''), 10) || 50;
      return sum + num;
    }, 0);
  const transactionCount = inMemoryTransactions.length;
  const pendingAffiliates = inMemoryAffiliates.filter(a => a.status === 'Pending Review').length;
  const unreadMessages = inMemoryMessages.filter(m => !m.isRead).length;

  res.json({
    totalPapers,
    activePapers,
    totalDownloads,
    totalRevenue: `KSh ${totalRevenue.toLocaleString()}`,
    transactionCount,
    pendingAffiliates,
    unreadMessages,
  });
});

// Affiliate Program Endpoints
app.get("/api/affiliates", async (req, res) => {
  if (db) {
    try {
      const affiliates = await db.select().from(affiliatePartners).orderBy(desc(affiliatePartners.createdAt));
      if (affiliates && affiliates.length > 0) {
        return res.json(affiliates);
      }
    } catch (err: any) {
      console.warn("Database query skipped/failed, using in-memory store:", err?.message || err);
    }
  }
  res.json(inMemoryAffiliates);
});

app.post("/api/affiliates", async (req, res) => {
  const {
    fullName,
    phone,
    email,
    linkedInUrl,
    university,
    campusCourse,
    unitsDescription,
    paperCount,
    academicYears,
    referralCode,
  } = req.body;

  const finalCode =
    referralCode ||
    `APP-${(fullName || 'AFF').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5)}${Math.floor(10 + Math.random() * 89)}`;

  const partnerData = {
    fullName: fullName || 'Anonymous Supplier',
    phone: phone || '',
    email: email || `${finalCode.toLowerCase()}@seller.exampapers.co.ke`,
    university: university || 'Mount Kenya University (MKU)',
    campusCourse: campusCourse || 'General Course',
    referralCode: finalCode,
    commissionRate: 'Direct Paper Purchase',
    totalEarnings: 'Pending Review',
    totalReferrals: typeof paperCount === 'string' ? parseInt(paperCount, 10) || 1 : 1,
    status: 'Pending Review',
  };

  if (db) {
    try {
      const newPartner = await db.insert(affiliatePartners).values(partnerData).returning();
      if (newPartner && newPartner[0]) {
        const enriched = {
          ...newPartner[0],
          linkedInUrl: linkedInUrl || '',
          unitsDescription: unitsDescription || '',
          paperCount: paperCount || '',
          academicYears: academicYears || '',
        };
        inMemoryAffiliates.unshift(enriched as any);
        return res.json(enriched);
      }
    } catch (err: any) {
      console.warn("Database insert skipped/failed, using in-memory store:", err?.message || err);
    }
  }

  const fallbackPartner = {
    id: `AFF-${Math.floor(100 + Math.random() * 900)}`,
    ...partnerData,
    linkedInUrl: linkedInUrl || '',
    unitsDescription: unitsDescription || '',
    paperCount: paperCount || '',
    academicYears: academicYears || '',
    createdAt: new Date().toISOString(),
  };
  inMemoryAffiliates.unshift(fallbackPartner);
  res.json(fallbackPartner);
});

app.patch("/api/affiliates/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const target = inMemoryAffiliates.find((a) => a.id === id || a.referralCode === id);
  if (target) {
    if (status) target.status = status;
    return res.json(target);
  }

  res.status(404).json({ error: "Affiliate not found" });
});

app.delete("/api/affiliates/:id", async (req, res) => {
  const { id } = req.params;
  const index = inMemoryAffiliates.findIndex((a) => a.id === id || a.referralCode === id);
  if (index !== -1) {
    inMemoryAffiliates.splice(index, 1);
    return res.json({ success: true });
  }
  res.json({ success: true });
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
