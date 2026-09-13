import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

// Database API Routes

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

app.delete("/api/papers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: paper } = await supabaseAdmin.from("Papers").select("file_path").eq("id", id).single();
    await supabaseAdmin.from("Papers").delete().eq("id", id);
    if (paper?.file_path) {
      await supabaseAdmin.storage.from("Papers").remove([paper.file_path]).catch(e => console.warn("Notice: Old storage cleanup skipped", e));
    }
    res.json({ success: true });
  } catch (e) {
    console.error("DB delete failed:", e);
    res.status(500).json({ error: "Failed to delete paper" });
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
app.post("/api/mpesa/stkpush", async (req, res) => {
  // 0. Check Server M-Pesa Daraja Credentials early to avoid DB writes if missing
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const passkey = process.env.MPESA_PASSKEY;
  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const mpesaEnv = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!consumerKey || !consumerSecret || !callbackUrl) {
    return res.status(500).json({
      success: false,
      error: "M-Pesa configuration is incomplete. MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_CALLBACK_URL are required."
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
      .select("id, status, paper_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== 'paid') {
      return res.status(403).json({ success: false, error: "Payment not verified. Access denied." });
    }

    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("Papers")
      .select("id, file_path, paper_title, unit_code")
      .eq("id", order.paper_id)
      .maybeSingle();

    if (paperErr || !paper || !paper.file_path) {
      return res.status(404).json({ success: false, error: "Paper file not found in repository." });
    }

    try {
      const { error: insertErr } = await supabaseAdmin
        .from("downloads")
        .insert({
          order_id: order.id,
          paper_id: order.paper_id,
          downloaded_at: new Date().toISOString()
        });
      
      // We purposefully ignore unique_violation errors (code '23505') to allow re-downloads
      if (insertErr && insertErr.code !== '23505') {
        console.warn("Notice: downloads record creation issue:", insertErr);
      }
    } catch (dlErr) {
      console.warn("Notice: downloads record exception:", dlErr);
    }

    const { data: signedData, error: signErr } = await supabaseAdmin
      .storage
      .from("Papers")
      .createSignedUrl(paper.file_path, 60);

    if (signErr || !signedData?.signedUrl) {
      console.error("Error generating signed download URL:", signErr);
      return res.status(500).json({ success: false, error: "Failed to generate secure download link." });
    }

    return res.json({
      success: true,
      downloadUrl: signedData.signedUrl,
      paper_title: paper.paper_title,
      unit_code: paper.unit_code
    });
  } catch (err: any) {
    console.error("Error generating order download:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(`
        id, mpesa_receipt, phone, amount, status, created_at,
        Orders (
          id,
          customers (first_name, second_name, phone),
          Papers (unit_code, paper_title)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formatted = data.map((p: any) => ({
      id: p.id,
      studentFirstName: p.Orders?.customers?.first_name || '',
      studentSecondName: p.Orders?.customers?.second_name || '',
      phone: p.phone,
      unitCode: p.Orders?.Papers?.unit_code || '',
      unitName: p.Orders?.Papers?.paper_title || '',
      price: `KSh ${p.amount}`,
      mpesaReceipt: p.mpesa_receipt || 'PENDING',
      status: p.status === 'completed' ? 'Completed' : (p.status === 'pending' ? 'Pending' : 'Failed'),
      timestamp: p.created_at
    }));
    return res.json(formatted);
  } catch (err) {
    console.error("Transactions fetch error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", async (req, res) => {
  res.status(403).json({ error: "Forbidden. Use secure M-Pesa STK push flow." });
});

app.delete("/api/transactions/:id", async (req, res) => {
  res.status(403).json({ error: "Forbidden. Cannot delete transaction records." });
});

app.get("/api/messages", async (req, res) => {
  res.json([]);
});

app.post("/api/messages", async (req, res) => {
  res.status(501).json({ error: "Messages not yet implemented in Supabase" });
});

app.patch("/api/messages/:id", async (req, res) => {
  res.status(501).json({ error: "Messages not yet implemented in Supabase" });
});

app.delete("/api/messages/:id", async (req, res) => {
  res.status(501).json({ error: "Messages not yet implemented in Supabase" });
});

// Admin Live Stats Endpoint
app.get("/api/admin/stats", async (req, res) => {
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

// Affiliate Program Endpoints
app.get("/api/affiliates", async (req, res) => {
  res.json([]);
});

app.post("/api/affiliates", async (req, res) => {
  res.status(501).json({ error: "Affiliates not yet implemented in Supabase" });
});

app.patch("/api/affiliates/:id", async (req, res) => {
  res.status(501).json({ error: "Affiliates not yet implemented in Supabase" });
});

app.delete("/api/affiliates/:id", async (req, res) => {
  res.status(501).json({ error: "Affiliates not yet implemented in Supabase" });
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
