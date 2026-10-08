import React, { useState } from 'react';
import { X, Download, Lock, Loader2, Key } from 'lucide-react';
import { Paper } from './adminTypes';

interface AdminDownloadPaperModalProps {
  paper: Paper | null;
  onClose: () => void;
  onDownload: (password: string) => Promise<void>;
  isDownloading: boolean;
}

export const AdminDownloadPaperModal: React.FC<AdminDownloadPaperModalProps> = ({
  paper,
  onClose,
  onDownload,
  isDownloading,
}) => {
  const [password, setPassword] = useState('');

  if (!paper) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    await onDownload(password.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-[#00D26A]/30 text-[#00D26A] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Protected Download</h3>
            <p className="text-xs text-slate-400">
              <span className="font-mono text-[#00D26A] font-bold mr-1">{paper.unit_code}</span>
              <span>{paper.paper_title}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Admin Authorization Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
                className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00D26A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-400 hover:text-white font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDownloading || !password.trim()}
              className="px-4 py-2 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black inline-flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Decrypting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
