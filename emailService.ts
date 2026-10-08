import nodemailer from 'nodemailer';

export interface SendActivationEmailParams {
  to: string;
  firstName: string;
  paperTitle: string;
  openDocumentUrl: string;
}

export interface EmailResult {
  success: boolean;
  status: 'EMAIL SENT' | 'EMAIL FAILED' | 'EMAIL NOT CONFIGURED';
  error?: string;
}

export async function sendActivationEmail(params: SendActivationEmailParams): Promise<EmailResult> {
  const { to, firstName, paperTitle, openDocumentUrl } = params;

  if (!to || !to.includes('@')) {
    return {
      success: false,
      status: 'EMAIL FAILED',
      error: 'Invalid recipient email address.',
    };
  }

  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPassword = process.env.SMTP_PASSWORD?.trim();

  // If SMTP credentials are not configured
  if (!smtpUser || !smtpPassword) {
    console.warn('[EMAIL] SMTP credentials (SMTP_USER / SMTP_PASSWORD) not configured. Activation email skipped.');
    return {
      success: false,
      status: 'EMAIL NOT CONFIGURED',
      error: 'SMTP credentials (SMTP_USER / SMTP_PASSWORD) are not configured in environment.',
    };
  }

  try {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const displayName = firstName ? firstName.trim() : 'Valued Student';

    const textContent = `Hello ${displayName},

Your payment has been confirmed and your document has been activated.

Document:
${paperTitle}

Open your document here:
${openDocumentUrl}

Your document opens securely in your browser.
For security, access is limited to a maximum of 3 devices.

Please keep this email and your document link safe.

Godrery Publishers`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Godrery Publishers document is ready</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#022c22;padding:28px 32px;border-bottom:3px solid #00D26A;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">GODRERY PUBLISHERS</h1>
              <p style="margin:6px 0 0 0;font-size:12px;color:#00D26A;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Official Document Delivery</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#f8fafc;">Hello <strong>${displayName}</strong>,</p>
              <p style="margin:0 0 20px 0;font-size:15px;color:#cbd5e1;line-height:1.6;">Your payment has been confirmed and your document has been activated.</p>
              
              <div style="background-color:#1e293b;border-left:4px solid #00D26A;border-radius:8px;padding:16px 20px;margin:24px 0;">
                <span style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px;margin-bottom:4px;">Document:</span>
                <span style="font-size:16px;font-weight:700;color:#ffffff;">${paperTitle}</span>
              </div>

              <div style="text-align:center;margin:32px 0;">
                <a href="${openDocumentUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#00D26A;color:#022c22;text-decoration:none;padding:14px 32px;font-size:15px;font-weight:800;border-radius:10px;text-transform:uppercase;letter-spacing:0.5px;">
                  OPEN YOUR DOCUMENT
                </a>
              </div>

              <p style="margin:16px 0 8px 0;font-size:14px;color:#94a3b8;line-height:1.5;">Your document opens securely in your browser.</p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#94a3b8;line-height:1.5;">For security, access is limited to a maximum of 3 devices.</p>

              <hr style="border:0;border-top:1px solid #1e293b;margin:24px 0;" />

              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Please keep this email and your document link safe.</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">Godrery Publishers</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Godrery Publishers" <${smtpUser}>`,
      to,
      subject: 'Your Godrery Publishers document is ready',
      text: textContent,
      html: htmlContent,
    });

    console.log(`[EMAIL] Successfully sent activation email to: ${to}`);
    return {
      success: true,
      status: 'EMAIL SENT',
    };
  } catch (err: any) {
    // SECURITY: Never log process.env.SMTP_PASSWORD
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message || err);
    return {
      success: false,
      status: 'EMAIL FAILED',
      error: err.message || 'SMTP delivery failure',
    };
  }
}
