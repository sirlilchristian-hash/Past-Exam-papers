import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

// Will be initialized from server.ts
let supabaseAdmin: any = null;

export function initReceiptGenerator(client: any) {
    supabaseAdmin = client;
}

function getSupabaseClient(): any {
    if (supabaseAdmin) return supabaseAdmin;
    const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        return supabaseAdmin;
    }
    throw new Error('Supabase client not initialized in receipt generator');
}

export async function generateAndMergeReceipt(orderId: string): Promise<boolean> {
    try {
        console.log(`[RECEIPT] Starting receipt generation for order ${orderId}...`);
        const client = getSupabaseClient();
        
        // 1. Check if already generated
        const mergedPath = `merged/${orderId}.pdf`;
        const { data: existing } = await client.storage.from("Papers").list('merged', {
            search: `${orderId}.pdf`
        });
        if (existing && existing.length > 0 && existing[0].name === `${orderId}.pdf`) {
            console.log(`[RECEIPT] Merged PDF already exists for order ${orderId}. Skipping.`);
            return true;
        }

        // 2. Fetch required data sequentially to avoid Supabase join issues
        const { data: order, error: orderErr } = await client
            .from("Orders")
            .select("*")
            .eq("id", orderId)
            .single();
            
        if (orderErr || !order) {
            console.error(`[RECEIPT] Order not found for generation:`, orderErr);
            return false;
        }

        const { data: customer } = await client.from("customers").select("first_name, second_name").eq("id", order.customer_id).maybeSingle();
        const { data: paper } = await client.from("Papers").select("paper_title, unit_code, file_path").eq("id", order.paper_id).maybeSingle();
        
        const { data: payment } = await client
            .from("payments")
            .select("mpesa_receipt, transaction_date")
            .eq("order_id", orderId)
            .maybeSingle();

        if (!paper || !paper.file_path) {
            console.error(`[RECEIPT] Paper file_path missing for order ${orderId}`);
            return false;
        }

        // 3. Download original PDF
        const { data: fileData, error: downloadErr } = await client.storage.from("Papers").download(paper.file_path);
        if (downloadErr || !fileData) {
            console.error(`[RECEIPT] Failed to download source PDF for order ${orderId}:`, downloadErr);
            return false;
        }

        const originalPdfBytes = await fileData.arrayBuffer();
        const originalPdf = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });

        // 4. Generate Receipt PDF
        const receiptDoc = await PDFDocument.create();
        const page = receiptDoc.addPage([595, 842]); // A4
        const font = await receiptDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await receiptDoc.embedFont(StandardFonts.HelveticaBold);
        
        let y = 780;
        const drawText = (text: string, size: number, isBold: boolean = false, color = rgb(0,0,0)) => {
            page.drawText(text, { x: 50, y, size, font: isBold ? boldFont : font, color });
            y -= (size + 10);
        };

        drawText('Godrery Publishers', 24, true);
        y -= 10;
        drawText('PURCHASE RECEIPT', 18, true, rgb(0.2, 0.2, 0.2));
        y -= 20;

        const dateStr = payment?.transaction_date 
            ? new Date(payment.transaction_date).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
            : new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

        drawText(`Date (EAT): ${dateStr}`, 12);
        drawText(`Receipt Ref: ${payment?.mpesa_receipt || 'Manual/N/A'}`, 12);
        drawText(`Order ID: ${orderId}`, 10, false, rgb(0.5, 0.5, 0.5));
        y -= 15;
        
        drawText(`Customer: ${customer?.first_name || ''} ${customer?.second_name || ''}`, 12, true);
        y -= 15;
        
        drawText(`Document Details:`, 14, true);
        drawText(`Title: ${paper?.paper_title || 'Unknown Document'}`, 12);
        drawText(`Unit Code: ${paper?.unit_code || 'N/A'}`, 12);
        y -= 15;

        drawText(`Payment Summary:`, 14, true);
        drawText(`Amount Paid: KSh ${order.amount}`, 12);
        drawText(`Status: Confirmed & Paid`, 12, true, rgb(0, 0.5, 0));
        
        y -= 40;
        drawText('Thank you for purchasing with Godrery Publishers!', 12, true);
        drawText('Your document begins on the next page.', 12, false, rgb(0.3, 0.3, 0.3));

        // 5. Merge PDFs
        const mergedDoc = await PDFDocument.create();
        
        // Copy receipt page
        const [receiptPage] = await mergedDoc.copyPages(receiptDoc, [0]);
        mergedDoc.addPage(receiptPage);
        
        // Copy original pages
        const pageIndices = Array.from({ length: originalPdf.getPageCount() }, (_, i) => i);
        const originalPages = await mergedDoc.copyPages(originalPdf, pageIndices);
        originalPages.forEach((p) => mergedDoc.addPage(p));
        
        const mergedBytes = await mergedDoc.save();

        // 6. Upload merged PDF
        const { error: uploadErr } = await client.storage.from("Papers").upload(mergedPath, mergedBytes, {
            contentType: 'application/pdf',
            upsert: true
        });

        if (uploadErr) {
            console.error(`[RECEIPT] Failed to upload merged PDF for order ${orderId}:`, uploadErr);
            return false;
        }

        console.log(`[RECEIPT] Successfully generated and stored merged PDF for order ${orderId}.`);
        return true;

    } catch (err) {
        console.error(`[RECEIPT] Unexpected error during generation for order ${orderId}:`, err);
        return false;
    }
}
