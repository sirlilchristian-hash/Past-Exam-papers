import React, { useState } from 'react';
import { X, Copy, Check, FileText, Smartphone, Key, CheckCircle, Clock } from 'lucide-react';
import { TransactionRecord } from './adminTypes';

interface OrderInquiryModalProps {
  order: TransactionRecord | null;
  onClose: () => void;
}

export const OrderInquiryModal: React.FC<OrderInquiryModalProps> = ({ order, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!order) return null;

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isCompleted =
    order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'paid';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-[#00D26A] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Purchase Order Details</h2>
            <p className="text-xs text-slate-400 font-mono">Order ID: {order.id}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Order Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Student Name</span>
            <span className="font-bold text-white">
              {order.studentFirstName} {order.studentSecondName}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Contact / Phone</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-200">
              <span>{order.phone}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(order.phone, 'phone')}
                className="p-1 text-slate-400 hover:text-white"
                title="Copy phone"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-3.5 h-3.5 text-[#00D26A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Unit Code</span>
            <span className="font-mono font-extrabold text-[#00D26A]">
              {order.unit_code || order.unitCode || 'UNIT'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Paper Title</span>
            <span className="font-semibold text-slate-200 text-right max-w-xs truncate">
              {order.paper_title || order.unitName}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">M-Pesa Receipt</span>
            <div className="flex items-center gap-1.5 font-mono font-black text-amber-300">
              <span>{order.mpesaReceipt || 'PENDING'}</span>
              {order.mpesaReceipt && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.mpesaReceipt, 'receipt')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy receipt"
                >
                  {copiedField === 'receipt' ? (
                    <Check className="w-3.5 h-3.5 text-[#00D26A]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Amount</span>
            <span className="font-extrabold text-white text-sm">{order.price}</span>
          </div>

          {order.passwordUsed && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Password Key</span>
              <div className="flex items-center gap-1.5 font-mono font-extrabold text-sky-400">
                <span>{order.passwordUsed}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.passwordUsed!, 'pwd')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy password key"
                >
                  {copiedField === 'pwd' ? (
                    <Check className="w-3.5 h-3.5 text-[#00D26A]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Timestamp</span>
            <span className="text-slate-400">
              {order.timestamp
                ? new Date(order.timestamp).toLocaleString()
                : '—'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
