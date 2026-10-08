import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  AlertTriangle,
  RotateCw,
  X,
  Lock,
  Key,
  FileCheck,
  Check,
} from 'lucide-react';
import { ActivationResult } from './adminTypes';

interface ActivationResultModalProps {
  data: ActivationResult | null;
  onClose: () => void;
  onResendEmail: (orderId: string) => Promise<void>;
  isResendingEmail: boolean;
}

export const ActivationResultModal: React.FC<ActivationResultModalProps> = ({
  data,
  onClose,
  onResendEmail,
  isResendingEmail,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!data) return null;

  const handleCopyLink = () => {
    if (data.openDocumentUrl) {
      navigator.clipboard.writeText(data.openDocumentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCode = () => {
    if (data.mpesaReceipt) {
      navigator.clipboard.writeText(data.mpesaReceipt);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const isEmailSent = data.emailStatus === 'EMAIL SENT';
  const isEmailFailed = data.emailStatus === 'EMAIL FAILED';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Verification Success Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-[#00D26A]/40 text-[#00D26A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              Order Activated &amp; Access Granted
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Receipt generated and secure document link issued
            </p>
          </div>
        </div>

        {/* Order Info Summary Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Student Name</span>
            <span className="font-bold text-white">
              {data.studentFirstName} {data.studentSecondName}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Student Email / Phone</span>
            <span className="font-mono text-slate-200">{data.studentEmail}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Paper &amp; Unit Code</span>
            <span className="font-bold text-white text-right">
              <span className="text-[#00D26A] font-mono mr-1">{data.unitCode}</span>
              <span>{data.paperTitle}</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">M-Pesa Receipt Code</span>
            <div className="flex items-center gap-1.5 font-mono font-extrabold text-amber-300">
              <span>{data.mpesaReceipt}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 text-slate-400 hover:text-white"
                title="Copy M-Pesa Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-[#00D26A]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Amount Paid</span>
            <span className="font-extrabold text-[#00D26A]">KSh {data.amount}</span>
          </div>
        </div>

        {/* Open Document URL Section */}
        {data.openDocumentUrl && (
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-white uppercase tracking-wider">
              Customer Secure Open Document URL
            </label>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-mono text-[11px] text-slate-300 break-all select-all">
                {data.openDocumentUrl}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00D26A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Document Link'}</span>
                </button>

                <a
                  href={data.openDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Open</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Email Delivery Status Badge & Resend Action */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-white">Gmail Delivery Status</span>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                isEmailSent
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isEmailFailed
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {data.emailStatus || 'PENDING'}
            </span>
          </div>

          {data.emailError && (
            <p className="text-[11px] text-rose-400 leading-normal">
              Notice: {data.emailError}
            </p>
          )}

          {/* Resend Email Button */}
          {data.orderId && (
            <button
              type="button"
              onClick={() => onResendEmail(data.orderId)}
              disabled={isResendingEmail}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isResendingEmail ? 'animate-spin text-[#00D26A]' : ''}`} />
              <span>{isResendingEmail ? 'Dispatching Email...' : 'Resend Activation Email'}</span>
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-extrabold text-xs transition-colors shadow-sm"
        >
          Done / Close
        </button>
      </div>
    </div>
  );
};
