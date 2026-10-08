import React, { useState, useEffect } from 'react';
import { X, FileText, Download, CheckCircle2, RotateCw, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Paper } from './adminTypes';

interface AdminPaperViewerModalProps {
  paper: Paper | null;
  onClose: () => void;
  onRequestDownload: (paper: Paper) => void;
}

export const AdminPaperViewerModal: React.FC<AdminPaperViewerModalProps> = ({
  paper,
  onClose,
  onRequestDownload,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  useEffect(() => {
    if (!paper) {
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setTotalPages(0);
      return;
    }

    let isMounted = true;
    let createdBlobUrl: string | null = null;

    async function loadPdf() {
      setIsLoading(true);
      setError(null);

      try {
        let arrayBuffer: ArrayBuffer;

        // Check if there is a local file object (e.g., when previewing draft or selected file before save)
        if (paper.localFile && paper.localFile instanceof File) {
          arrayBuffer = await paper.localFile.arrayBuffer();
        } else if (!paper.id || paper.id === 'DRAFT' || paper.id.startsWith('paper-')) {
          setIsLoading(false);
          setError('No document file attached to preview. Please select a PDF document or save the paper first.');
          return;
        } else {
          // Authoritative Server-side preview from Supabase private storage
          const token = localStorage.getItem('admin_token');
          const res = await fetch(`/api/admin/papers/${paper.id}/preview?t=${Date.now()}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: 'no-store',
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to fetch document from repository (HTTP ${res.status})`);
          }

          arrayBuffer = await res.arrayBuffer();
        }

        // Inspect actual PDF page count using pdf-lib
        try {
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const count = pdfDoc.getPageCount();
          if (isMounted) {
            setTotalPages(count);
          }
        } catch (pageInspectionErr) {
          console.warn('Notice: PDF page count inspection warning:', pageInspectionErr);
          if (isMounted) {
            setTotalPages(1);
          }
        }

        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        createdBlobUrl = blobUrl;

        if (isMounted) {
          setPdfUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return blobUrl;
          });
          setIsLoading(false);
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error loading PDF preview:', err);
          setError(err.message || 'Unable to preview examination paper PDF.');
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [paper?.id, paper?.file_path, reloadTrigger]);

  if (!paper) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#00D26A]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-[#00D26A] text-slate-950 px-2 py-0.5 rounded font-mono font-black text-xs">
                  {paper.unit_code}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {paper.paper_title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5 font-mono">
                <span className="text-slate-300 font-semibold truncate max-w-md" title={paper.file_path}>
                  File: {paper.file_path || `${paper.unit_code}_Exam.pdf`}
                </span>
                <span>•</span>
                <span>Status: {paper.status || 'available'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">Price: {paper.price || 'KSh 50'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setReloadTrigger((prev) => prev + 1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Preview from Storage"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onRequestDownload(paper)}
              className="hidden sm:flex px-3.5 py-2 bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs rounded-xl items-center gap-1.5 shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Toolbar */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 font-mono font-bold text-slate-200">
              <span>Document Length:</span>
              <span className="text-[#00D26A] text-sm">
                {totalPages > 0 ? `${totalPages} ${totalPages === 1 ? 'Page' : 'Pages'}` : '—'}
              </span>
            </div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading document...</span>
              </span>
            ) : error ? (
              <span className="flex items-center gap-1.5 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Preview Error</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00D26A]" />
                <span>Live Repository PDF ({totalPages} {totalPages === 1 ? 'Page' : 'Pages'})</span>
              </span>
            )}
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Encrypted Vault Storage</span>
          </div>
        </div>

        {/* Document Rendering */}
        <div className="flex-1 bg-slate-950 p-3 sm:p-6 overflow-hidden flex flex-col justify-center items-center relative">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-[#00D26A] animate-spin" />
              <p className="text-sm font-mono">Fetching document from private storage repository...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="max-w-md p-6 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Document Preview Unavailable</h4>
              <p className="text-xs text-rose-200 font-mono leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={() => setReloadTrigger((prev) => prev + 1)}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Fetch</span>
              </button>
            </div>
          )}

          {!isLoading && !error && pdfUrl && (
            <object
              data={`${pdfUrl}#toolbar=1&navpanes=0`}
              type="application/pdf"
              className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl"
              title={`Preview: ${paper.unit_code} - ${paper.paper_title}`}
            >
              <iframe
                id="admin-pdf-preview-frame"
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800"
                title={`Preview: ${paper.unit_code} - ${paper.paper_title}`}
              />
            </object>
          )}
        </div>
      </div>
    </div>
  );
};
