import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
  Trash2,
  Layers,
  ArrowDown,
} from 'lucide-react';
import { Paper, PaperFormValidationErrors } from './adminTypes';

interface AdminPaperEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPaper: Paper | null;
  onSave: (formData: FormData, savedPaperMeta: Paper) => Promise<boolean | Paper | null>;
  isSaving: boolean;
  onPreview: (draftPaper: Paper) => void;
  defaultPrice?: string;
  onDelete?: (paper: Paper) => void;
}

export const AdminPaperEditModal: React.FC<AdminPaperEditModalProps> = ({
  isOpen,
  onClose,
  editingPaper,
  onSave,
  isSaving,
  onPreview,
  defaultPrice = '50',
  onDelete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formUnitCode, setFormUnitCode] = useState<string>('');
  const [formPaperTitle, setFormPaperTitle] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>(defaultPrice);
  const [formStatus, setFormStatus] = useState<string>('available');
  const [formFilePath, setFormFilePath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [documentAction, setDocumentAction] = useState<'replace' | 'merge'>('replace');
  const [showMergeConfirm, setShowMergeConfirm] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [formErrors, setFormErrors] = useState<PaperFormValidationErrors>({});
  const [formTouched, setFormTouched] = useState<{ [key: string]: boolean }>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  useEffect(() => {
    if (editingPaper) {
      setFormUnitCode(editingPaper.unit_code || (editingPaper as any).unitCode || '');
      setFormPaperTitle(editingPaper.paper_title || (editingPaper as any).unitName || '');
      const cleanPrice = String(editingPaper.price || defaultPrice).replace(/[^\d]/g, '');
      setFormPrice(cleanPrice || '50');
      setFormStatus(editingPaper.status || 'available');
      setFormFilePath(editingPaper.file_path || '');
      setSelectedFile(null);
      setUploadedFileName('');
      setUploadedFileSize('');
      setDocumentAction('replace');
      setShowMergeConfirm(false);
      setSuccessMessage('');
    } else {
      setFormUnitCode('');
      setFormPaperTitle('');
      setFormPrice(defaultPrice.replace(/[^\d]/g, '') || '50');
      setFormStatus('available');
      setFormFilePath('');
      setSelectedFile(null);
      setUploadedFileName('');
      setUploadedFileSize('');
      setDocumentAction('replace');
      setShowMergeConfirm(false);
      setSuccessMessage('');
    }
    setFormErrors({});
    setFormTouched({});
    setHasAttemptedSubmit(false);
    setUploadError('');
  }, [editingPaper, isOpen, defaultPrice]);

  if (!isOpen) return null;

  const validateUnitCodeField = (val: string): string => {
    if (!val || !val.trim()) return 'Unit code is required (e.g. SMA 2101 or BCS 101).';
    const clean = val.trim().toUpperCase();
    if (clean.length < 2) return 'Unit code must be at least 2 characters.';
    if (clean.length > 20) return 'Unit code cannot exceed 20 characters.';
    if (!/^[A-Z0-9\s\-_.]{2,20}$/i.test(clean)) {
      return 'Unit code may only contain letters, numbers, spaces, and hyphens.';
    }
    return '';
  };

  const validatePaperTitleField = (val: string): string => {
    if (!val || !val.trim()) return 'Paper title is required.';
    const clean = val.trim();
    if (clean.length < 3) return 'Paper title must be at least 3 characters.';
    if (clean.length > 150) return 'Paper title cannot exceed 150 characters.';
    return '';
  };

  const validatePriceField = (val: string): string => {
    if (val === undefined || val === null || val === '') return 'Price is required.';
    const num = parseInt(String(val).replace(/[^\d]/g, ''), 10);
    if (isNaN(num)) return 'Please enter a valid numeric price.';
    if (num <= 0) return 'Price must be a valid positive amount greater than 0.';
    if (num > 10000) return 'Maximum price allowed is KSh 10,000.';
    return '';
  };

  const validatePdfFileField = (file: File | null, isEditing: boolean, action: 'replace' | 'merge'): string => {
    if (!isEditing && !file) {
      return 'A PDF document (.pdf) is required when adding a new paper.';
    }
    if (isEditing && action === 'merge' && !file) {
      return 'Please choose a PDF document to append and merge with the current paper.';
    }
    if (file) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return 'Invalid file type. Only PDF documents (.pdf) are accepted.';
      }
    }
    return '';
  };

  const validateAllFormFields = (): PaperFormValidationErrors => {
    const errors: PaperFormValidationErrors = {};
    const codeErr = validateUnitCodeField(formUnitCode);
    if (codeErr) errors.unit_code = codeErr;

    const titleErr = validatePaperTitleField(formPaperTitle);
    if (titleErr) errors.paper_title = titleErr;

    const priceErr = validatePriceField(formPrice);
    if (priceErr) errors.price = priceErr;

    const pdfErr = validatePdfFileField(selectedFile, Boolean(editingPaper), documentAction);
    if (pdfErr) errors.pdfFile = pdfErr;

    return errors;
  };

  const handleFileProcess = (file: File) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setSelectedFile(null);
      setUploadedFileName('');
      setUploadedFileSize('');
      const errorMsg = 'Invalid file type. Only PDF documents (.pdf) are accepted.';
      setUploadError(errorMsg);
      setFormErrors((prev) => ({ ...prev, pdfFile: errorMsg }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadError('');
    setSelectedFile(file);
    setUploadedFileName(file.name);
    const sizeStr =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;
    setUploadedFileSize(sizeStr);
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.pdfFile;
      return copy;
    });

    if (!formFilePath) {
      const sanitized = file.name.replace(/\s+/g, '_');
      setFormFilePath(`papers/${sanitized}`);
    }

    if (!formPaperTitle.trim()) {
      const guessedName = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[_-]/g, ' ')
        .trim();
      setFormPaperTitle(guessedName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    const validationErrors = validateAllFormFields();
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setUploadError(validationErrors.pdfFile || 'Please resolve the highlighted validation errors before submitting.');
      return;
    }

    if (editingPaper && documentAction === 'merge' && !showMergeConfirm) {
      setShowMergeConfirm(true);
      return;
    }

    await executeSubmit();
  };

  const executeSubmit = async () => {
    setUploadError('');
    const formattedCode = formUnitCode.trim().toUpperCase();
    const formattedTitle = formPaperTitle.trim();
    const cleanPrice = parseInt(formPrice.replace(/[^\d]/g, '') || '50', 10);
    const formattedPrice = `KSh ${cleanPrice}`;

    const formData = new FormData();
    if (editingPaper?.id) {
      formData.append('paperId', editingPaper.id);
      formData.append('operationMode', documentAction);
    }
    formData.append('unit_code', formattedCode);
    formData.append('paper_title', formattedTitle);
    formData.append('price', formattedPrice);
    formData.append('status', formStatus);

    if (selectedFile) {
      formData.append('pdfFile', selectedFile);
    }

    const savedPaperMeta: Paper = {
      id: editingPaper?.id || `paper-${Date.now()}`,
      unit_code: formattedCode,
      paper_title: formattedTitle,
      price: formattedPrice,
      status: formStatus,
      file_path: formFilePath.trim() || uploadedFileName || `${formattedCode}_Exam.pdf`,
    };

    const saveResult = await onSave(formData, savedPaperMeta);
    if (saveResult) {
      const savedPaper: Paper | null = typeof saveResult === 'object' ? saveResult : null;
      if (savedPaper?.file_path) {
        setFormFilePath(savedPaper.file_path);
      }
      if (savedPaper?.unit_code) {
        setFormUnitCode(savedPaper.unit_code);
      }
      if (savedPaper?.paper_title) {
        setFormPaperTitle(savedPaper.paper_title);
      }

      setSelectedFile(null);
      setUploadedFileName('');
      setUploadedFileSize('');
      setShowMergeConfirm(false);

      if (editingPaper && documentAction === 'merge') {
        setSuccessMessage('Document merged successfully. Current repository document updated.');
      } else if (editingPaper && documentAction === 'replace') {
        setSuccessMessage('Document replaced successfully. Current repository document updated.');
      } else {
        setSuccessMessage('Examination paper saved successfully.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-[#00D26A]/30 text-[#00D26A] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              {editingPaper ? 'Edit Examination Paper' : 'Upload New Examination Paper'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Repository record stored in Supabase table <code className="text-[#00D26A] font-mono">public."Papers"</code>
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00D26A] shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* PDF Document Management Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-300">
                PDF Document {!editingPaper && <span className="text-rose-400">*</span>}
              </label>
              {editingPaper && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Storage bucket: <span className="text-emerald-400">Papers (Private)</span>
                </span>
              )}
            </div>

            {/* Current Document Path Display */}
            {editingPaper && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">Current document</div>
                <div className="font-mono text-xs text-white break-all flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{formFilePath || editingPaper.file_path || 'None'}</span>
                </div>
              </div>
            )}

            {/* Segmented Control: Replace vs Merge (Only for existing papers) */}
            {editingPaper && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDocumentAction('replace');
                    setShowMergeConfirm(false);
                    setUploadError('');
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    documentAction === 'replace'
                      ? 'bg-emerald-500/10 border-[#00D26A] text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-[#00D26A]" />
                    <span>Replace Document</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Replace the current examination-paper PDF with a completely new PDF.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocumentAction('merge');
                    setShowMergeConfirm(false);
                    setUploadError('');
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    documentAction === 'merge'
                      ? 'bg-sky-500/10 border-sky-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Merge Previous Papers</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Keep the current document and append a new examination-paper PDF to it.
                  </div>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Mode 1: Replace Document or New Upload */}
            {(!editingPaper || documentAction === 'replace') && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileProcess(e.dataTransfer.files[0]);
                  }
                }}
                className={`p-4 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#00D26A] bg-[#00D26A]/5'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-left">
                      <FileText className="w-6 h-6 text-[#00D26A]" />
                      <div>
                        <div className="font-bold text-white max-w-[200px] truncate">{uploadedFileName}</div>
                        <div className="text-[11px] text-slate-400">{uploadedFileSize}</div>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">Choose different PDF</span>
                  </div>
                ) : editingPaper ? (
                  <div className="space-y-1">
                    <UploadCloud className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="font-semibold text-slate-300">
                      Upload Replacement PDF
                    </p>
                    <p className="text-[11px] text-slate-500">Click to upload a replacement PDF or drag &amp; drop</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-6 h-6 text-[#00D26A] mx-auto" />
                    <p className="font-bold text-white">Click to browse or drag &amp; drop PDF</p>
                    <p className="text-[11px] text-slate-500">Standard PDF examination format only</p>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Merge Previous Papers */}
            {editingPaper && documentAction === 'merge' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">New examination paper to append</div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 border border-dashed border-slate-700 hover:border-sky-500 rounded-xl bg-slate-900/60 text-center cursor-pointer transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-left">
                          <FileText className="w-5 h-5 text-sky-400" />
                          <div>
                            <div className="font-bold text-white text-xs max-w-[200px] truncate">{uploadedFileName}</div>
                            <div className="text-[10px] text-slate-400">{uploadedFileSize}</div>
                          </div>
                        </div>
                        <span className="text-sky-400 font-bold text-[11px]">Choose different PDF</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-slate-300 hover:text-white">
                        <UploadCloud className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-xs">Choose PDF</span>
                        <span className="text-[10px] text-slate-500">(Upload &amp; Merge PDF)</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedFile && (
                  <div className="p-3.5 bg-slate-950 border border-sky-900/40 rounded-xl space-y-2.5">
                    <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Merge order</span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                        <span className="text-slate-400">Current document</span>
                        <span className="text-white truncate max-w-[220px]">{formFilePath || editingPaper.file_path}</span>
                      </div>
                      <div className="flex justify-center text-sky-400">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                        <span className="text-slate-400">New examination paper</span>
                        <span className="text-white truncate max-w-[220px]">{selectedFile.name}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] font-bold text-slate-400 mb-1">Result</div>
                      <div className="text-xs text-white font-medium bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-emerald-400 font-bold">Current document + New examination paper</span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          The existing document remains first; the newly uploaded examination paper will be appended after the existing document.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirmation Box Before Processing Merge */}
                {showMergeConfirm && selectedFile && (
                  <div className="p-4 bg-slate-950 border border-sky-500/40 rounded-2xl space-y-2.5">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5 text-sky-300">
                      <AlertCircle className="w-4 h-4 text-sky-400" />
                      <span>Merge Documents?</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-400">Current document: </span>
                        <span className="text-white font-mono">{formFilePath || editingPaper.file_path}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">New examination paper: </span>
                        <span className="text-white font-mono">{selectedFile.name}</span>
                      </div>
                      <div className="pt-1 font-semibold text-emerald-400">
                        <span className="text-slate-400">Result: </span>
                        <span>Current document + New examination paper</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowMergeConfirm(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => executeSubmit()}
                        className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Merge &amp; Update Paper</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unit Code */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-300">
                Unit Code <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">e.g. MATH 101, BCOM 202</span>
            </div>
            <input
              type="text"
              value={formUnitCode}
              onChange={(e) => setFormUnitCode(e.target.value.toUpperCase())}
              placeholder="e.g. MATH 101"
              required
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          {/* Paper Title */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Paper Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formPaperTitle}
              onChange={(e) => setFormPaperTitle(e.target.value)}
              placeholder="e.g. Calculus & Analytical Geometry 2024"
              required
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          {/* Price & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Price (KSh)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                min="1"
                required
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00D26A]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#00D26A]"
              >
                <option value="available">available (Active)</option>
                <option value="unavailable">unavailable (Draft)</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            {editingPaper && onDelete ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onDelete(editingPaper)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 text-xs"
                title="Delete this examination paper"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Document</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white font-semibold"
              >
                Cancel
              </button>

            <button
              type="button"
              onClick={() => {
                const draftPaper: Paper = {
                  id: editingPaper?.id || 'DRAFT',
                  unit_code: formUnitCode.trim().toUpperCase() || 'UNIT',
                  paper_title: formPaperTitle.trim() || 'Exam Paper',
                  price: `KSh ${formPrice || '50'}`,
                  status: formStatus,
                  file_path: formFilePath || `${formUnitCode}_Draft.pdf`,
                  localFile: selectedFile,
                };
                onPreview(draftPaper);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Preview</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2 rounded-xl font-black inline-flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 ${
                editingPaper && documentAction === 'merge'
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                  : 'bg-[#00D26A] hover:bg-[#00b85c] text-slate-950'
              }`}
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {editingPaper
                  ? documentAction === 'merge'
                    ? 'Merge & Update Paper'
                    : 'Update Paper'
                  : 'Upload to Supabase'}
              </span>
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
};
