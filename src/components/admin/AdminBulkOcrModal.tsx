import React, { useRef, useState } from 'react';
import {
  X,
  Layers,
  FileUp,
  UploadCloud,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { Paper } from './adminTypes';

interface BulkTask {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progressText: string;
}

interface AdminBulkOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaperCreated: (newPaper: Paper) => void;
}

export const AdminBulkOcrModal: React.FC<AdminBulkOcrModalProps> = ({
  isOpen,
  onClose,
  onPaperCreated,
}) => {
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [bulkTasks, setBulkTasks] = useState<BulkTask[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleBulkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newTasks: BulkTask[] = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        status: 'pending',
        progressText: 'Waiting in queue',
      }));
      setBulkTasks((prev) => [...prev, ...newTasks]);
    }
  };

  const startBulkProcessing = async () => {
    setIsProcessingBulk(true);
    for (let i = 0; i < bulkTasks.length; i++) {
      if (bulkTasks[i].status === 'pending') {
        setBulkTasks((prev) =>
          prev.map((t) =>
            t.id === bulkTasks[i].id
              ? { ...t, status: 'processing', progressText: 'Scanning & Digitizing...' }
              : t
          )
        );

        try {
          const formData = new FormData();
          formData.append('file', bulkTasks[i].file);
          const res = await fetch('/api/digitize-paper', {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            body: formData,
          });

          if (!res.ok) throw new Error('AI Engine failed');
          const data = await res.json();

          const unitCodeExtracted =
            data.unit_code || `UNKNOWN-${Math.floor(Math.random() * 900) + 100}`;
          const unitTitleExtracted =
            data.unitTitle || bulkTasks[i].file.name.replace(/\.[^/.]+$/, '');

          const newPaper: Paper = {
            id: `AI-BULK-${Math.random().toString(36).substring(7)}`,
            unit_code: unitCodeExtracted.toUpperCase(),
            paper_title: unitTitleExtracted,
            price: 'KSh 50',
            status: 'available',
            file_path: bulkTasks[i].file.name,
          };

          try {
            const saveRes = await fetch('/api/papers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newPaper),
            });
            if (saveRes.ok) {
              const savedPaper = await saveRes.json();
              onPaperCreated(savedPaper);
            } else {
              onPaperCreated(newPaper);
            }
          } catch (e) {
            onPaperCreated(newPaper);
          }

          setBulkTasks((prev) =>
            prev.map((t) =>
              t.id === bulkTasks[i].id
                ? { ...t, status: 'completed', progressText: 'Digitized successfully' }
                : t
            )
          );
        } catch (err) {
          setBulkTasks((prev) =>
            prev.map((t) =>
              t.id === bulkTasks[i].id
                ? { ...t, status: 'error', progressText: 'Failed to extract text' }
                : t
            )
          );
        }
      }
    }
    setIsProcessingBulk(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#00D26A]" />
              <span>Bulk AI OCR Digitization Queue</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload multiple exam paper scanned images to extract metadata and register them into the database automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isProcessingBulk) return;
              onClose();
              setBulkTasks([]);
            }}
            disabled={isProcessingBulk}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          <input
            type="file"
            multiple
            ref={bulkInputRef}
            onChange={handleBulkSelect}
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            disabled={isProcessingBulk}
          />

          <div
            onClick={() => {
              if (!isProcessingBulk) bulkInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isProcessingBulk
                ? 'border-slate-800 bg-slate-900/50 cursor-not-allowed'
                : 'border-slate-700 bg-slate-950 hover:border-slate-500 cursor-pointer'
            }`}
          >
            <UploadCloud
              className={`w-8 h-8 mx-auto mb-2 ${
                isProcessingBulk ? 'text-slate-600' : 'text-[#00D26A]'
              }`}
            />
            <p className="font-bold text-white mb-0.5">Click to select examination images</p>
            <p className="text-[11px] text-slate-500">Supports .jpg, .png, .jpeg (Multi-select enabled)</p>
          </div>

          {bulkTasks.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-slate-300 flex justify-between items-center text-xs">
                <span>Queue Status ({bulkTasks.length} items)</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {bulkTasks.filter((t) => t.status === 'completed').length} completed
                </span>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {bulkTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-950 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate max-w-sm">{task.file.name}</div>
                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          task.status === 'error'
                            ? 'text-rose-400'
                            : task.status === 'completed'
                            ? 'text-[#00D26A]'
                            : 'text-slate-400'
                        }`}
                      >
                        {task.progressText}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {task.status === 'pending' && <Clock className="w-4 h-4 text-slate-500" />}
                      {task.status === 'processing' && (
                        <Loader2 className="w-4 h-4 text-[#00D26A] animate-spin" />
                      )}
                      {task.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-[#00D26A]" />
                      )}
                      {task.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (isProcessingBulk) return;
              onClose();
              setBulkTasks([]);
            }}
            disabled={isProcessingBulk}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={startBulkProcessing}
            disabled={
              isProcessingBulk ||
              bulkTasks.length === 0 ||
              bulkTasks.every((t) => t.status === 'completed')
            }
            className="px-5 py-2 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs inline-flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {isProcessingBulk ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Queue...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Start OCR Engine</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
