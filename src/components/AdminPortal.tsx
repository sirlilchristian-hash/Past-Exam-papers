import { AdminManagementTab } from './AdminManagementTab';
import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  FileText,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Users,
  Download,
  Search,
  CheckCircle2,
  Clock,
  X,
  LogOut,
  BarChart3,
  Database,
  Lock,
  RefreshCw,
  Settings,
  Smartphone,
  Eye,
  Check,
  UploadCloud,
  FileUp,
  Paperclip,
  Mail,
  Layers,
  Loader2,
  AlertCircle,
  Linkedin,
  ExternalLink,
  Phone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

import { Paper, ExamPaperAdminItem, PaperUploadPayload, PaperFormValidationErrors } from '../types';
import {
  savePaperUnified,
  updatePaperUnified,
  deletePaperUnified,
  insertPaperToSupabase,
  updatePaperInSupabase,
  deletePaperFromSupabase,
} from '../lib/supabase';

export type { Paper, ExamPaperAdminItem };

export interface TransactionRecord {
  id: string;
  studentFirstName: string;
  studentSecondName: string;
  phone: string;
  unit_code: string;
  paper_title: string;
  price: string;
  mpesaReceipt: string;
  passwordUsed: string;
  status: 'Completed' | 'Pending' | 'Failed';
  timestamp: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: Paper[];
  setPapers: React.Dispatch<React.SetStateAction<Paper[]>>;
  isLoadingPapers?: boolean;
  papersError?: string | null;
  onRefreshPapers?: () => Promise<void>;
}

export const initialPapers: Paper[] = [];

const initialTransactions: TransactionRecord[] = [];

const initialMessages: ContactMessage[] = [];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  papers,
  setPapers,
  isLoadingPapers = false,
  papersError = null,
  onRefreshPapers,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      setAdminRole(localStorage.getItem('admin_role') || '');
    }
  }, []);

  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpMsg, setCpMsg] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCpMsg('Password changed successfully.');
        setCpCurrent('');
        setCpNew('');
      } else {
        setCpMsg(data.error || 'Failed to change password.');
      }
    } catch (err) {
      setCpMsg('Network error.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    setAdminRole('');
    setIsAuthenticated(false);
  };
  const [accountId, setAccountId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'papers' | 'transactions' | 'messages' | 'affiliates' | 'settings' | 'admins'>('dashboard');

  // Database State
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]); // Intended target: public.downloads
  const [protectedPasswords, setProtectedPasswords] = useState<any[]>([]); // Intended target: document access / password generation workflow

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setTransactions(data);
          }
        })
        .catch(err => console.error(err));

      fetch('/api/messages', { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data);
          }
        })
        .catch(err => console.error(err));

      fetch('/api/affiliates', { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setAffiliates(data);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isAuthenticated]);

  // Search & Filter
  const [paperSearch, setPaperSearch] = useState<string>('');
  const [txSearch, setTxSearch] = useState<string>('');
  const [affiliateSearch, setAffiliateSearch] = useState<string>('');
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all');
  const [isRefreshingAffiliates, setIsRefreshingAffiliates] = useState<boolean>(false);

  const handleRefreshAffiliates = () => {
    setIsRefreshingAffiliates(true);
    fetch('/api/affiliates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAffiliates(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsRefreshingAffiliates(false));
  };

  const handleUpdateAffiliateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setAffiliates(prev =>
        prev.map(a => (a.id === id || a.referralCode === id ? { ...a, status: newStatus } : a))
      );
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleDeleteAffiliate = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this affiliate submission?')) return;
    try {
      await fetch(`/api/affiliates/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      setAffiliates(prev => prev.filter(a => a.id !== id && a.referralCode !== id));
    } catch (e) {
      console.error('Error deleting affiliate:', e);
    }
  };

  // Add/Edit & Document Viewer Modals
  const [isPaperModalOpen, setIsPaperModalOpen] = useState<boolean>(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [downloadAdminPaper, setDownloadAdminPaper] = useState<Paper | null>(null);
  const [downloadAdminPassword, setDownloadAdminPassword] = useState<string>('');
  const [isDownloadingAdmin, setIsDownloadingAdmin] = useState<boolean>(false);
  const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);
  const [viewingPage, setViewingPage] = useState<number>(1);
  const [selectedInquiryTx, setSelectedInquiryTx] = useState<TransactionRecord | null>(null);

  // Bulk Processing State
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState<boolean>(false);
  const [bulkTasks, setBulkTasks] = useState<{
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progressText: string;
  }[]>([]);

  // Form Fields for Add/Edit (Supabase public.papers schema) with structured validation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formUnitCode, setFormUnitCode] = useState<string>('');
  const [formPaperTitle, setFormPaperTitle] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('50');
  const [formStatus, setFormStatus] = useState<string>('available');
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2024');
  const [formExamPeriod, setFormExamPeriod] = useState<string>('Main Examination');
  const [formFilePath, setFormFilePath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isSavingPaper, setIsSavingPaper] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<PaperFormValidationErrors>({});
  const [formTouched, setFormTouched] = useState<{ [key: string]: boolean }>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

  // Table Sorting and Filtering State for Standard Dashboard Layout
  const [paperStatusFilter, setPaperStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [paperSortField, setPaperSortField] = useState<'unit_code' | 'paper_title' | 'price' | 'status' | 'created_at'>('created_at');
  const [paperSortOrder, setPaperSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formActionNotice, setFormActionNotice] = useState<{
    type: 'warning' | 'info' | 'error';
    message: string;
  } | null>(null);
  const [catalogActionNotice, setCatalogActionNotice] = useState<{
    type: 'warning' | 'info' | 'error';
    message: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDigitizing, setIsDigitizing] = useState<boolean>(false);
  const [digitizedContent, setDigitizedContent] = useState<any>(null);

  // Field validation helpers
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

  const validatePdfFileField = (file: File | null, isEditing: boolean): string => {
    if (!isEditing && !file) {
      return 'A PDF document (.pdf) is required when adding a new paper.';
    }
    if (file) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return 'Invalid file type. Only PDF documents (.pdf) are accepted.';
      }
    }
    return '';
  };

  const validateFilePathField = (val: string): string => {
    if (!val || !val.trim()) return '';
    const clean = val.trim().toLowerCase();
    if (!clean.endsWith('.pdf')) {
      return 'Storage file path must end with .pdf extension.';
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

    const pdfErr = validatePdfFileField(selectedFile, Boolean(editingPaper));
    if (pdfErr) errors.pdfFile = pdfErr;

    return errors;
  };

  // System Settings
  const [defaultPrice, setDefaultPrice] = useState<string>('KSh 50');
  const [requirePasswordProtection, setRequirePasswordProtection] = useState<boolean>(true);
  const [currentAdminPin, setCurrentAdminPin] = useState<string>('1234');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string>('');

  // Reset auth state when portal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsAuthenticated(false);
      setAccountId(''); setPassword('');
      setLoginError('');
      setActiveTab('dashboard');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleRemoveSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!editingPaper) {
      setFormErrors((prev) => ({
        ...prev,
        pdfFile: 'A PDF document (.pdf) is required when adding a new paper.',
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_role', data.role);
        setAdminRole(data.role);
        setIsAuthenticated(true);
        setLoginError('');
        setAccountId('');
      } else {
        setLoginError(data.error || 'Incorrect Admin PIN');
      }
    } catch (err) {
      setLoginError('Network error connecting to backend.');
    }
  };

  const handleRefreshCatalog = async () => {
    if (onRefreshPapers) {
      setIsRefreshing(true);
      try {
        await onRefreshPapers();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingPaper(null);
    setFormUnitCode('');
    setFormPaperTitle('');
    setFormPrice('50');
    setFormStatus('available');
    setFormAcademicYear('2024');
    setFormExamPeriod('Main Examination');
    setFormFilePath('');
    setSelectedFile(null);
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadError('');
    setFormErrors({});
    setFormTouched({});
    setHasAttemptedSubmit(false);
    setFormActionNotice(null);
    setDigitizedContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsPaperModalOpen(true);
  };

  const handleAdminDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadAdminPaper || !downloadAdminPassword.trim()) return;
    setIsDownloadingAdmin(true);
    try {
      const res = await fetch(`/api/admin/papers/${downloadAdminPaper.id}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ password: downloadAdminPassword.trim() })
      });
      if (!res.ok) {
         const errText = await res.text();
         throw new Error(errText);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadAdminPaper.unit_code || 'Document'}_Exam.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadAdminPaper(null);
      setDownloadAdminPassword('');
    } catch (e) {
      console.error(e);
      alert("Failed to download document.");
    } finally {
      setIsDownloadingAdmin(false);
    }
  };

  const handleOpenEditModal = (paper: Paper) => {
    setEditingPaper(paper);
    const code = paper.unit_code || (paper as any).unitCode || '';
    const title = paper.paper_title || (paper as any).unitName || '';
    const rawPrice = paper.price !== undefined && paper.price !== null ? String(paper.price) : '50';
    const numPrice = rawPrice.replace(/[^\d]/g, '') || '50';

    setFormUnitCode(code);
    setFormPaperTitle(title);
    setFormPrice(numPrice);
    setFormStatus(paper.status || 'available');
    setFormAcademicYear('2024');
    setFormExamPeriod('Main Examination');
    setFormFilePath(paper.file_path || '');
    setSelectedFile(null);
    setUploadedFileName(paper.file_path ? paper.file_path.split('/').pop() || paper.file_path : '');
    setUploadedFileSize('');
    setUploadError('');
    setFormErrors({});
    setFormTouched({});
    setHasAttemptedSubmit(false);
    setFormActionNotice(null);
    setDigitizedContent((paper as any).digitizedContent || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsPaperModalOpen(true);
  };

  const handleSavePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const validationErrors = validateAllFormFields();
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setUploadError('Please resolve the highlighted validation errors before submitting.');
      return;
    }

    setUploadError('');
    setIsSavingPaper(true);
    setFormActionNotice(null);

    const formattedCode = formUnitCode.trim().toUpperCase();
    const formattedTitle = formPaperTitle.trim();
    const cleanPrice = parseInt(formPrice.replace(/[^\d]/g, '') || '50', 10);
    const formattedPrice = `KSh ${cleanPrice}`;

    // Construct FormData for multipart/form-data request
    const formData = new FormData();
    if (editingPaper?.id) {
      formData.append('paperId', editingPaper.id);
    }
    formData.append('unit_code', formattedCode);
    formData.append('paper_title', formattedTitle);
    formData.append('price', formattedPrice);
    formData.append('status', formStatus);

    if (selectedFile) {
      formData.append('pdfFile', selectedFile);
    }

    try {
      const res = await fetch('/api/papers/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
        body: formData, // Browser sets multipart boundary header automatically
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setUploadError(result.error || 'Failed to process paper upload via backend');
        setIsSavingPaper(false);
        return;
      }

      const savedPaper: Paper = result.paper || {
        id: result.id || `paper-${Date.now()}`,
        unit_code: formattedCode,
        paper_title: formattedTitle,
        price: formattedPrice,
        status: formStatus,
        file_path: result.file_path || null,
      };

      // Update local papers array state
      if (setPapers) {
        setPapers((prev) => {
          if (editingPaper) {
            return prev.map((p) => (p.id === editingPaper.id ? { ...p, ...savedPaper } : p));
          }
          return [savedPaper, ...prev];
        });
      }

      // Refresh catalog from backend / database
      if (onRefreshPapers) {
        onRefreshPapers();
      }

      setFormActionNotice({
        type: 'info',
        message: editingPaper
          ? `Paper [${formattedCode}] updated successfully in repository.`
          : `Paper [${formattedCode}] uploaded and registered successfully in Supabase!`,
      });

      // Reset form states & close modal
      setFormUnitCode('');
      setFormPaperTitle('');
      setFormPrice('50');
      setFormStatus('available');
      setSelectedFile(null);
      setUploadedFileSize('');
      setFormErrors({});
      setHasAttemptedSubmit(false);
      setIsPaperModalOpen(false);
      setEditingPaper(null);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setUploadError(err?.message || 'Network error communicating with upload backend server.');
    } finally {
      setIsSavingPaper(false);
    }
  };

  const handleExportPapersCsv = () => {
    if (!papers || papers.length === 0) {
      alert('No papers to export.');
      return;
    }
    const headers = ['ID', 'Unit Code', 'Paper Title', 'Price', 'Status', 'File Path', 'Date Created'];
    const rows = papers.map((p) => [
      `"${p.id || ''}"`,
      `"${(p.unit_code || (p as any).unitCode || '').replace(/"/g, '""')}"`,
      `"${(p.paper_title || (p as any).unitName || '').replace(/"/g, '""')}"`,
      `"${(typeof p.price === 'number' ? `KSh ${p.price}` : p.price || 'KSh 50').replace(/"/g, '""')}"`,
      `"${(p.status || 'available').replace(/"/g, '""')}"`,
      `"${(p.file_path || '').replace(/"/g, '""')}"`,
      `"${p.created_at ? new Date(p.created_at).toISOString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GodreryTone_Papers_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePaper = async (paper: Paper) => {
    if (!window.confirm(`Are you sure you want to remove / unpublish paper "${paper.paper_title || paper.unit_code}"?`)) {
      return;
    }

    setCatalogActionNotice(null);
    const { success, error } = await deletePaperUnified(paper.id);

    if (!success && error) {
      setCatalogActionNotice({
        type: 'warning',
        message: `Notice: ${error}`,
      });
      return;
    }

    if (onRefreshPapers) {
      await onRefreshPapers();
    }
  };

  const handleToggleAvailability = async (paper: Paper) => {
    const newStatus = paper.status === 'available' ? 'unavailable' : 'available';
    setCatalogActionNotice(null);

    const { error } = await updatePaperUnified(paper.id, {
      status: newStatus,
    });

    if (error) {
      setCatalogActionNotice({
        type: 'warning',
        message: `Notice: ${error}`,
      });
      return;
    }

    if (onRefreshPapers) {
      await onRefreshPapers();
    }
  };

  const handleBulkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newTasks = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        status: 'pending' as const,
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
              ? { ...t, status: 'processing', progressText: 'Scanning Image & Digitizing...' }
              : t
          )
        );

        try {
          const formData = new FormData();
          formData.append('file', bulkTasks[i].file);
          const res = await fetch('/api/digitize-paper', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
            body: formData,
          });

          if (!res.ok) throw new Error('AI Engine failed');
          const data = await res.json();

          const unitCodeExtracted = data.unit_code || `UNKNOWN-${Math.floor(Math.random() * 900) + 100}`;
          const unitTitleExtracted = data.unitTitle || bulkTasks[i].file.name.replace(/\.[^/.]+$/, '');
          const yearExtracted = data.date ? data.date.slice(-4) : '2024';

          const newPaper: Omit<ExamPaperAdminItem, 'id'> = {
            unit_code: unitCodeExtracted.toUpperCase(),
            paper_title: unitTitleExtracted,
            price: 'KSh 50', status: 'available', file_path: bulkTasks[i].file.name,
          };

          try {
             const saveRes = await fetch('/api/papers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPaper)
             });
             if (saveRes.ok) {
                const savedPaper = await saveRes.json();
                setPapers((prev) => [savedPaper, ...prev]);
             } else {
                // fallback if save fails
                setPapers((prev) => [{ ...newPaper, id: `AI-BULK-${Math.random().toString(36).substring(7)}` }, ...prev]);
             }
          } catch (e) {
             console.error("Bulk save error:", e);
             setPapers((prev) => [{ ...newPaper, id: `AI-BULK-${Math.random().toString(36).substring(7)}` }, ...prev]);
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

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length >= 4) {
      setCurrentAdminPin(newPinInput);
      setNewPinInput('');
      setSettingsSuccessMsg('Admin PIN updated successfully!');
      setTimeout(() => setSettingsSuccessMsg(''), 3000);
    }
  };

  const filteredPapers = (papers || [])
    .filter((p) => {
      if (!p) return false;
      const title = (p.paper_title || (p as any).unitName || '').toLowerCase();
      const code = (p.unit_code || (p as any).unitCode || '').toLowerCase();
      const query = (paperSearch || '').toLowerCase();
      const matchesQuery = !query || title.includes(query) || code.includes(query) || (p.id && p.id.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      const isAvail = p.status ? p.status === 'available' : (p as any).isAvailable !== false;
      if (paperStatusFilter === 'available') {
        return isAvail;
      }
      if (paperStatusFilter === 'unavailable') {
        return !isAvail;
      }
      return true;
    })
    .sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (paperSortField === 'unit_code') {
        valA = (a.unit_code || (a as any).unitCode || '').toLowerCase();
        valB = (b.unit_code || (b as any).unitCode || '').toLowerCase();
      } else if (paperSortField === 'paper_title') {
        valA = (a.paper_title || (a as any).unitName || '').toLowerCase();
        valB = (b.paper_title || (b as any).unitName || '').toLowerCase();
      } else if (paperSortField === 'price') {
        valA = parseInt(String(a.price || '0').replace(/[^\d]/g, ''), 10) || 0;
        valB = parseInt(String(b.price || '0').replace(/[^\d]/g, ''), 10) || 0;
      } else if (paperSortField === 'status') {
        valA = a.status || 'available';
        valB = b.status || 'available';
      } else {
        // default 'created_at'
        valA = a.created_at ? new Date(a.created_at).getTime() : 0;
        valB = b.created_at ? new Date(b.created_at).getTime() : 0;
      }

      if (valA < valB) return paperSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return paperSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const availablePapersCount = (papers || []).filter((p) => (p.status ? p.status === 'available' : (p as any).isAvailable !== false)).length;
  const unavailablePapersCount = (papers || []).length - availablePapersCount;

  const filteredTransactions = (transactions || []).filter((t) => {
    if (!t) return false;
    const q = (txSearch || '').toLowerCase();
    return (
      (t.studentFirstName || '').toLowerCase().includes(q) ||
      (t.studentSecondName || '').toLowerCase().includes(q) ||
      (t.phone || '').includes(txSearch || '') ||
      (t.unit_code || '').toLowerCase().includes(q) ||
      (t.mpesaReceipt || '').toLowerCase().includes(q)
    );
  });

  const totalRevenue = filteredTransactions.reduce((acc, tx) => {
    const amount = parseInt(String(tx.price || '').replace(/\D/g, '') || '0', 10);
    return acc + amount;
  }, 0);
  
  const totalDownloads = (downloads || []).length;
  const protectedPasswordsCount = (protectedPasswords || []).length;
  const databaseCount = (papers || []).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00D26A]/20 border border-[#00D26A]/40 text-[#00D26A] flex items-center justify-center font-black">
              <ShieldAlert className="w-5 h-5 text-[#00D26A]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>GodreryTone Admin Portal</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-[#00D26A] border border-[#00D26A]/30 px-2 py-0.5 rounded-full">
                  System v2.4
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">ExamPapers Database &amp; Purchase Logs Management</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State 1: PIN Authentication Screen */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full text-center space-y-6 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-[#00D26A]/30 text-[#00D26A] flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-8 h-8 text-[#00D26A]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-white">Administrator Login</h3>
              <p className="text-xs text-slate-400">
                Enter your secure credentials to access backend database logs and controls.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Account ID
                </label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="Enter Account ID"
                  className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-[#00D26A] focus:ring-1 focus:ring-[#00D26A] text-white text-center tracking-widest text-lg outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="Enter secure password"
                  className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-[#00D26A] focus:ring-1 focus:ring-[#00D26A] text-white text-center tracking-widest text-lg outline-none"
                />
                {loginError && (
                  <p className="text-xs text-rose-500 font-semibold mt-2">{loginError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-[#00D26A] hover:bg-[#00b55b] text-slate-950 font-bold py-3 rounded-xl transition-colors mt-2"
              >
                Authenticate
              </button>
            </form>
          </div>
        ) : (
          /* State 2: Authenticated Admin Dashboard Layout */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Admin Nav Tabs (Mobile Quick Selector & Horizontal Scrollable Tabs) */}
            <div className="sm:hidden px-3 py-2 bg-slate-950/80 border-b border-slate-800">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#00D26A]"
              >
                <option value="dashboard">Dashboard Overview</option>
                <option value="papers">Exam Papers Catalog ({papers.length})</option>
                <option value="transactions">M-Pesa Purchase Logs ({transactions.length})</option>
                <option value="messages">Messages ({messages.filter(m => !m.isRead).length || messages.length})</option>
                <option value="affiliates">Affiliate Paper Sellers ({affiliates.length})</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            <div className="px-3 sm:px-6 bg-slate-950/60 border-b border-slate-800 flex flex-nowrap items-center gap-2 shrink-0 py-2.5 overflow-x-auto scrollbar-none no-scrollbar touch-pan-x">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'bg-[#00D26A] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('papers')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'papers'
                    ? 'bg-[#00D26A] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Exam Papers Catalog ({papers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'transactions'
                    ? 'bg-[#00D26A] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>M-Pesa Purchase Logs ({transactions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'messages'
                    ? 'bg-[#00D26A] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Messages ({messages.filter(m => !m.isRead).length || messages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('affiliates')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'affiliates'
                    ? 'bg-[#00D26A] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Affiliate Paper Sellers ({affiliates.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-[#00D26A] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              {adminRole === 'super_admin' && (
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    activeTab === 'admins'
                      ? 'bg-[#00D26A]/20 text-[#00D26A]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  Admin Management
                </button>
              )}

              <button
                onClick={() => setShowChangePassword(true)}
                className="ml-auto px-3 py-1.5 text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 shrink-0"
              >
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="ml-3 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>
            </div>

            
            {showChangePassword && (
              <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative">
                  <button onClick={() => setShowChangePassword(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">X</button>
                  <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Current Password</label>
                      <input type="password" value={cpCurrent} onChange={e => setCpCurrent(e.target.value)} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 focus:border-[#00D26A] text-white" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">New Password</label>
                      <input type="password" value={cpNew} onChange={e => setCpNew(e.target.value)} minLength={8} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 focus:border-[#00D26A] text-white" required />
                    </div>
                    <button type="submit" className="w-full bg-[#00D26A] hover:bg-[#00b55b] text-slate-950 font-bold py-2 rounded-lg">Update Password</button>
                    {cpMsg && <p className="text-sm mt-2 text-center text-[#00D26A]">{cpMsg}</p>}
                  </form>
                </div>
              </div>
            )}
            {/* Dashboard Scrollable Body */}

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                        <span>Total Revenue</span>
                        <DollarSign className="w-4 h-4 text-[#00D26A]" />
                      </div>
                      <p className="text-2xl font-black text-white">KSh {totalRevenue}</p>
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <span>✓ Verified M-Pesa receipts</span>
                      </p>
                    </div>

                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                        <span>Database Catalog</span>
                        <FileText className="w-4 h-4 text-[#00D26A]" />
                      </div>
                      <p className="text-2xl font-black text-white">{databaseCount} Papers</p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {papers.filter((p) => p.status === 'available').length} Active &amp; Ready
                      </p>
                    </div>

                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                        <span>Total Downloads</span>
                        <Download className="w-4 h-4 text-[#00D26A]" />
                      </div>
                      <p className="text-2xl font-black text-white">{totalDownloads}</p>
                      <p className="text-[11px] text-emerald-400 font-medium">
                        <span>100% Protected PDFs</span>
                      </p>
                    </div>

                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                        <span>Protected Passwords</span>
                        <Lock className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-black text-white">{protectedPasswordsCount} Keys</p>
                      <p className="text-[11px] text-amber-400 font-medium">
                        Purchaser First Names
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('affiliates')}
                      className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-left hover:border-[#00D26A]/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                        <span>Affiliate Sellers</span>
                        <Users className="w-4 h-4 text-[#00D26A] group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-2xl font-black text-white">{affiliates.length} Registered</p>
                      <p className="text-[11px] text-[#00D26A] font-medium flex items-center gap-1">
                        <span>{affiliates.filter(a => a.status === 'Pending Review').length} Pending Review →</span>
                      </p>
                    </button>
                  </div>

                  {/* Recent Activity Table Preview */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#00D26A]" />
                        <span>Recent M-Pesa Downloads</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs text-[#00D26A] hover:underline font-bold"
                      >
                        View All
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3">Unit Code</th>
                            <th className="p-3">Receipt</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">PDF Password</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {transactions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-500 font-bold">
                                No recent M-Pesa transactions logged in the system.
                              </td>
                            </tr>
                          ) : (
                            transactions.slice(0, 5).map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3 font-bold text-white">
                                  {tx.studentFirstName} {tx.studentSecondName}
                                </td>
                                <td className="p-3 text-slate-400">{tx.phone}</td>
                                <td className="p-3 font-mono text-[#00D26A] font-bold">
                                  {tx.unit_code}
                                </td>
                                <td className="p-3 font-mono text-slate-300">{tx.mpesaReceipt}</td>
                                <td className="p-3 font-black text-white">{tx.price}</td>
                                <td className="p-3 font-bold text-amber-400">{tx.passwordUsed}</td>
                                <td className="p-3 text-right">
                                  <span className="bg-emerald-500/20 text-[#00D26A] border border-[#00D26A]/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                                    {tx.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXAM PAPERS CATALOG MANAGEMENT */}
              {activeTab === 'papers' && (
                <div className="space-y-5">
                  {/* Metric Filter Tabs & Actions Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    {/* Status Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                      <button
                        type="button"
                        onClick={() => setPaperStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                          paperStatusFilter === 'all'
                            ? 'bg-[#00D26A] text-slate-950 shadow-md shadow-[#00D26A]/20'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span>All Papers</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                          paperStatusFilter === 'all' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {papers.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaperStatusFilter('available')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                          paperStatusFilter === 'available'
                            ? 'bg-[#00D26A] text-slate-950 shadow-md shadow-[#00D26A]/20'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Available</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                          paperStatusFilter === 'available' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-emerald-400'
                        }`}>
                          {availablePapersCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaperStatusFilter('unavailable')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                          paperStatusFilter === 'unavailable'
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        <span>Unavailable / Drafts</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                          paperStatusFilter === 'unavailable' ? 'bg-black/30 text-white' : 'bg-slate-800 text-rose-400'
                        }`}>
                          {unavailablePapersCount}
                        </span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <button
                        type="button"
                        onClick={handleExportPapersCsv}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold rounded-xl border border-slate-800 hover:border-slate-700 text-xs flex items-center justify-center gap-1.5 transition-all shadow shrink-0"
                        title="Export current database catalog to CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRefreshCatalog}
                        disabled={isRefreshing || isLoadingPapers}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold rounded-xl border border-slate-800 hover:border-slate-700 text-xs flex items-center justify-center gap-1.5 transition-all shadow disabled:opacity-50 shrink-0"
                        title="Reload catalog from Supabase public.papers"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoadingPapers ? 'animate-spin text-[#00D26A]' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-3 py-2 bg-emerald-950/40 text-[#00D26A] font-extrabold rounded-xl border border-emerald-800/50 hover:bg-emerald-900/50 flex items-center justify-center gap-1.5 text-xs transition-all shadow shrink-0"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="whitespace-nowrap">Bulk Digitize</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="flex-1 lg:flex-none px-4 py-2 bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="whitespace-nowrap">Add Paper</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Sort Tool Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={paperSearch ?? ''}
                        onChange={(e) => setPaperSearch(e.target.value)}
                        placeholder="Search by unit code, paper title, or ID..."
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#00D26A] transition-colors"
                      />
                      {paperSearch && (
                        <button
                          type="button"
                          onClick={() => setPaperSearch('')}
                          className="absolute right-3 top-3 text-slate-500 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Showing <strong className="text-white font-mono">{filteredPapers.length}</strong> of <strong className="text-slate-300 font-mono">{papers.length}</strong> papers</span>
                    </div>
                  </div>

                  {/* Operational Notices */}
                  {catalogActionNotice && (
                    <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-950/40 text-amber-200 text-xs flex items-start justify-between gap-3 animate-fadeIn">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-300">Catalog Action Notice</p>
                          <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">{catalogActionNotice.message}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCatalogActionNotice(null)}
                        className="text-amber-400 hover:text-white p-1 rounded-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {papersError && (
                    <div className="p-3.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <span className="font-bold text-rose-300">Supabase Connection Notice: </span>
                          <span className="text-[11px]">{papersError}</span>
                        </div>
                      </div>
                      {onRefreshPapers && (
                        <button
                          type="button"
                          onClick={handleRefreshCatalog}
                          className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg font-bold text-[10px]"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  )}

                  {/* Standardized Papers Data Table */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300 border-collapse">
                        <thead className="bg-slate-900/95 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800 select-none">
                          <tr>
                            <th
                              onClick={() => {
                                if (paperSortField === 'unit_code') {
                                  setPaperSortOrder(paperSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaperSortField('unit_code');
                                  setPaperSortOrder('asc');
                                }
                              }}
                              className="p-3.5 cursor-pointer hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Unit Code</span>
                                {paperSortField === 'unit_code' ? (
                                  paperSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00D26A]" /> : <ArrowDown className="w-3 h-3 text-[#00D26A]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => {
                                if (paperSortField === 'paper_title') {
                                  setPaperSortOrder(paperSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaperSortField('paper_title');
                                  setPaperSortOrder('asc');
                                }
                              }}
                              className="p-3.5 cursor-pointer hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Paper Title &amp; Details</span>
                                {paperSortField === 'paper_title' ? (
                                  paperSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00D26A]" /> : <ArrowDown className="w-3 h-3 text-[#00D26A]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => {
                                if (paperSortField === 'price') {
                                  setPaperSortOrder(paperSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaperSortField('price');
                                  setPaperSortOrder('asc');
                                }
                              }}
                              className="p-3.5 cursor-pointer hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Price</span>
                                {paperSortField === 'price' ? (
                                  paperSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00D26A]" /> : <ArrowDown className="w-3 h-3 text-[#00D26A]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => {
                                if (paperSortField === 'status') {
                                  setPaperSortOrder(paperSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaperSortField('status');
                                  setPaperSortOrder('asc');
                                }
                              }}
                              className="p-3.5 cursor-pointer hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Status</span>
                                {paperSortField === 'status' ? (
                                  paperSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00D26A]" /> : <ArrowDown className="w-3 h-3 text-[#00D26A]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                                )}
                              </div>
                            </th>
                            <th className="p-3.5">
                              <span>Storage Key</span>
                            </th>
                            <th
                              onClick={() => {
                                if (paperSortField === 'created_at') {
                                  setPaperSortOrder(paperSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaperSortField('created_at');
                                  setPaperSortOrder('desc');
                                }
                              }}
                              className="p-3.5 cursor-pointer hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Date Added</span>
                                {paperSortField === 'created_at' ? (
                                  paperSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00D26A]" /> : <ArrowDown className="w-3 h-3 text-[#00D26A]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                                )}
                              </div>
                            </th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-normal">
                          {isLoadingPapers ? (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-slate-400 text-xs">
                                <Loader2 className="w-8 h-8 mx-auto mb-2.5 text-[#00D26A] animate-spin" />
                                <p className="font-bold text-slate-200 text-sm">Loading catalog from Supabase...</p>
                                <p className="text-[11px] text-slate-500 mt-1">Fetching records from public.papers</p>
                              </td>
                            </tr>
                          ) : filteredPapers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-10 text-center text-slate-400 text-xs">
                                <FileText className="w-9 h-9 mx-auto mb-3 text-slate-600 opacity-60" />
                                <p className="font-bold text-slate-200 text-sm">No examination papers found</p>
                                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                                  {paperSearch || paperStatusFilter !== 'all'
                                    ? 'No papers matched your search or status filter criteria. Try clearing search filters.'
                                    : 'The repository is currently empty in Supabase. Click "Add Paper" to upload the first examination document.'}
                                </p>
                                {(paperSearch || paperStatusFilter !== 'all') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPaperSearch('');
                                      setPaperStatusFilter('all');
                                    }}
                                    className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
                                  >
                                    Reset Filters
                                  </button>
                                )}
                              </td>
                            </tr>
                          ) : (
                            filteredPapers.map((paper) => {
                              const isAvail = paper.status ? paper.status === 'available' : (paper as any).isAvailable !== false;
                              const paperTitle = paper.paper_title || (paper as any).unitName || 'Examination Paper';
                              const paperCode = paper.unit_code || (paper as any).unitCode || 'UNIT';
                              const paperPrice = typeof paper.price === 'number' ? `KSh ${paper.price}` : (paper.price || 'KSh 50');
                              const paperStatus = typeof paper.status === 'string' ? paper.status : (isAvail ? 'available' : 'unavailable');
                              const paperDate = paper.created_at
                                ? new Date(paper.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—';
                              const paperFile = paper.file_path || (paper as any).fileName || `${paperCode}_Paper.pdf`;

                              return (
                                <tr
                                  key={paper.id}
                                  className="hover:bg-slate-900/70 transition-colors group"
                                >
                                  {/* Column 1: Unit Code */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-[#00D26A]/10 text-[#00D26A] border border-[#00D26A]/30">
                                      {paperCode}
                                    </span>
                                  </td>

                                  {/* Column 2: Title & Details */}
                                  <td className="p-3.5 font-bold text-white max-w-xs sm:max-w-md">
                                    <div className="flex items-start gap-2.5">
                                      <FileText className="w-4 h-4 text-[#00D26A] shrink-0 mt-0.5" />
                                      <div className="min-w-0">
                                        <p className="truncate text-white font-bold leading-snug">{paperTitle}</p>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-normal text-slate-400">
                                          <span className="font-mono text-slate-500">ID: {paper.id}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Column 3: Price */}
                                  <td className="p-3.5 font-black text-slate-100 whitespace-nowrap">
                                    <span className="font-mono text-xs">{paperPrice}</span>
                                  </td>

                                  {/* Column 4: Interactive Status Toggle */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAvailability(paper)}
                                      title={`Status: ${paperStatus}. Click to toggle availability in Supabase.`}
                                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                        paperStatus === 'available'
                                          ? 'bg-emerald-500/20 text-[#00D26A] border-[#00D26A]/40 hover:bg-emerald-500/30'
                                          : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${paperStatus === 'available' ? 'bg-[#00D26A]' : 'bg-rose-400'}`}></span>
                                      <span className="capitalize">{paperStatus}</span>
                                    </button>
                                  </td>

                                  {/* Column 5: Storage Path */}
                                  <td className="p-3.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                                    <div className="flex items-center gap-1.5 text-slate-300">
                                      <Paperclip className="w-3 h-3 text-emerald-400/80 shrink-0" />
                                      <span className="truncate max-w-[160px]">{paperFile}</span>
                                    </div>
                                  </td>

                                  {/* Column 6: Date Added */}
                                  <td className="p-3.5 text-slate-400 whitespace-nowrap text-[11px]">
                                    {paperDate}
                                  </td>

                                  {/* Column 7: Actions */}
                                  <td className="p-3.5 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setViewingPaper(paper);
                                          setViewingPage(1);
                                        }}
                                        className="p-1.5 bg-[#00D26A]/20 hover:bg-[#00D26A] text-[#00D26A] hover:text-slate-950 rounded-lg transition-all inline-flex items-center gap-1 font-bold text-[10px]"
                                        title="View Document Preview"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">View</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(paper)}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors inline-block"
                                        title="Edit Paper"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDownloadAdminPaper(paper);
                                          setDownloadAdminPassword('');
                                        }}
                                        className="p-1.5 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-400 rounded-lg transition-colors inline-block"
                                        title="Download Document"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePaper(paper)}
                                        className="p-1.5 bg-rose-950/50 hover:bg-rose-900/70 text-rose-400 rounded-lg transition-colors inline-block"
                                        title="Remove Paper from Catalog"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Summary Footer */}
                    <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>Total Catalog: <strong className="text-white">{papers.length} records</strong></span>
                        <span>•</span>
                        <span>Published: <strong className="text-emerald-400">{availablePapersCount} active</strong></span>
                        <span>•</span>
                        <span>Drafts: <strong className="text-rose-400">{unavailablePapersCount}</strong></span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        Sync Source: <span className="text-emerald-400 font-mono">public.papers (Supabase)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: M-PESA TRANSACTION LOGS & INQUIRY SEARCH ENGINE */}
              {activeTab === 'transactions' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Search className="w-4 h-4 text-[#00D26A]" />
                        <span>Document Inquiry &amp; Retrieval Search Engine</span>
                      </h3>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-[#00D26A]/30 px-2.5 py-0.5 rounded-full">
                        Instant Lookup
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={txSearch ?? ''}
                        onChange={(e) => setTxSearch(e.target.value)}
                        placeholder="Search student name, phone, M-Pesa receipt (e.g. QK89X2PL91) or unit code..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#00D26A]"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="p-3.5">Log ID</th>
                            <th className="p-3.5">Purchaser Name</th>
                            <th className="p-3.5">Phone Number</th>
                            <th className="p-3.5">Unit Code</th>
                            <th className="p-3.5">Receipt Code</th>
                            <th className="p-3.5">Amount Paid</th>
                            <th className="p-3.5">PDF Password</th>
                            <th className="p-3.5">Time</th>
                            <th className="p-3.5 text-right">Inquiry Retrieval</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {filteredTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-500 font-bold">
                                No purchase transactions found matching your criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredTransactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-900/60 transition-colors">
                                <td className="p-3.5 font-mono text-slate-500">{tx.id}</td>
                                <td className="p-3.5 font-bold text-white">
                                  {tx.studentFirstName} {tx.studentSecondName}
                                </td>
                                <td className="p-3.5 text-slate-300 font-mono">{tx.phone}</td>
                                <td className="p-3.5 font-mono text-[#00D26A] font-bold">
                                  {tx.unit_code}
                                </td>
                                <td className="p-3.5 font-mono text-slate-200">{tx.mpesaReceipt}</td>
                                <td className="p-3.5 font-black text-white">{tx.price}</td>
                                <td className="p-3.5">
                                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold font-mono">
                                    {tx.passwordUsed}
                                  </span>
                                </td>
                                <td className="p-3.5 text-slate-400 text-[11px]">{tx.timestamp}</td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => setSelectedInquiryTx(tx)}
                                    className="px-2.5 py-1 bg-[#00D26A]/20 hover:bg-[#00D26A] text-[#00D26A] hover:text-slate-950 font-extrabold rounded-lg border border-[#00D26A]/30 transition-all text-[10px] inline-flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Retrieve</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MESSAGES LOGS */}
              {activeTab === 'messages' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#00D26A]" />
                      <span>User Contact Inquiries</span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800 p-2">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Student Name</th>
                          <th className="p-3.5">Email / Phone</th>
                          <th className="p-3.5">Subject</th>
                          <th className="p-3.5">Message Content</th>
                          <th className="p-3.5">Time</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {messages.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                              No messages found in the system.
                            </td>
                          </tr>
                        ) : (
                          messages.map((msg) => (
                            <tr key={msg.id} className={`transition-colors ${msg.isRead ? 'hover:bg-slate-900/60' : 'bg-slate-900/40 hover:bg-slate-900 border-l-2 border-l-[#00D26A]'}`}>
                              <td className="p-3.5">
                                {msg.isRead ? (
                                  <span className="text-slate-500 font-bold text-[10px] uppercase">Read</span>
                                ) : (
                                  <span className="text-[#00D26A] font-black text-[10px] uppercase px-1.5 py-0.5 bg-[#00D26A]/20 rounded-md">New</span>
                                )}
                              </td>
                              <td className="p-3.5 font-bold text-white">{msg.fullName}</td>
                              <td className="p-3.5 text-slate-300 font-mono">
                                <div>{msg.email}</div>
                                <div className="text-[10px] text-slate-500">{msg.phone}</div>
                              </td>
                              <td className="p-3.5 font-bold text-emerald-400">
                                {msg.subject}
                              </td>
                              <td className="p-3.5 text-slate-300 max-w-xs truncate" title={msg.message}>
                                {msg.message}
                              </td>
                              <td className="p-3.5 text-slate-400 text-[11px]">{msg.timestamp}</td>
                              <td className="p-3.5 text-right">
                                {!msg.isRead && (
                                  <button
                                    onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m))}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors text-[10px]"
                                  >
                                    Mark Read
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: AFFILIATE PAPER SELLERS */}
              {activeTab === 'affiliates' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#00D26A]" />
                        <span>Affiliate Paper Sellers</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Students and contributors registered to sell university past papers. Review background &amp; LinkedIn for workmanship eligibility before requesting paper files.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRefreshAffiliates}
                        disabled={isRefreshingAffiliates}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#00D26A] ${isRefreshingAffiliates ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Status Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={affiliateSearch ?? ''}
                        onChange={(e) => setAffiliateSearch(e.target.value)}
                        placeholder="Search seller, phone, university, or unit..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D26A]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                      {[
                        { key: 'all', label: `All (${affiliates.length})` },
                        { key: 'pending', label: `Pending (${affiliates.filter(a => !a.status || a.status === 'Pending Review').length})` },
                        { key: 'verified', label: `Verified (${affiliates.filter(a => a.status === 'Eligibility Verified' || a.status === 'Approved & Paid').length})` },
                        { key: 'contacted', label: `Contacted (${affiliates.filter(a => a.status === 'Contacted').length})` },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setAffiliateFilter(tab.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            affiliateFilter === tab.key
                              ? 'bg-[#00D26A] text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Affiliates Table */}
                  <div className="overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800 p-2">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-3.5">Status &amp; Eligibility</th>
                          <th className="p-3.5">Seller Name &amp; Profile</th>
                          <th className="p-3.5">Contact (Phone &amp; Email)</th>
                          <th className="p-3.5">University &amp; Course</th>
                          <th className="p-3.5">Units Available (Shallow Summary)</th>
                          <th className="p-3.5">Volume &amp; Years</th>
                          <th className="p-3.5 text-right">Outreach Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {affiliates.filter((aff) => {
                          const matchesSearch =
                            !affiliateSearch.trim() ||
                            (aff.fullName && aff.fullName.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                            (aff.phone && aff.phone.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                            (aff.email && aff.email.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                            (aff.university && aff.university.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                            (aff.campusCourse && aff.campusCourse.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                            (aff.unitsDescription && aff.unitsDescription.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                            (aff.referralCode && aff.referralCode.toLowerCase().includes(affiliateSearch.toLowerCase()));

                          const matchesStatus =
                            affiliateFilter === 'all' ||
                            (affiliateFilter === 'pending' && (!aff.status || aff.status === 'Pending Review')) ||
                            (affiliateFilter === 'verified' && (aff.status === 'Eligibility Verified' || aff.status === 'Approved & Paid')) ||
                            (affiliateFilter === 'contacted' && aff.status === 'Contacted');

                          return matchesSearch && matchesStatus;
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                              No affiliate applications found matching your criteria.
                            </td>
                          </tr>
                        ) : (
                          affiliates
                            .filter((aff) => {
                              const matchesSearch =
                                !affiliateSearch.trim() ||
                                (aff.fullName && aff.fullName.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                                (aff.phone && aff.phone.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                                (aff.email && aff.email.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                                (aff.university && aff.university.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                                (aff.campusCourse && aff.campusCourse.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                                (aff.unitsDescription && aff.unitsDescription.toLowerCase().includes(affiliateSearch.toLowerCase())) ||
                                (aff.referralCode && aff.referralCode.toLowerCase().includes(affiliateSearch.toLowerCase()));

                              const matchesStatus =
                                affiliateFilter === 'all' ||
                                (affiliateFilter === 'pending' && (!aff.status || aff.status === 'Pending Review')) ||
                                (affiliateFilter === 'verified' && (aff.status === 'Eligibility Verified' || aff.status === 'Approved & Paid')) ||
                                (affiliateFilter === 'contacted' && aff.status === 'Contacted');

                              return matchesSearch && matchesStatus;
                            })
                            .map((aff: any) => {
                              const cleanPhone = aff.phone?.replace(/[^0-9]/g, '') || '';
                              const intlPhone = cleanPhone.startsWith('0') ? `254${cleanPhone.slice(1)}` : cleanPhone;

                              return (
                                <tr key={aff.id || aff.referralCode} className="hover:bg-slate-900/60 transition-colors">
                                  {/* Status and Selector */}
                                  <td className="p-3.5 align-top">
                                    <div className="space-y-1.5">
                                      <span
                                        className={`inline-block font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${
                                          aff.status === 'Eligibility Verified' || aff.status === 'Approved & Paid'
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                            : aff.status === 'Contacted'
                                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                            : aff.status === 'Rejected'
                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        }`}
                                      >
                                        {aff.status || 'Pending Review'}
                                      </span>

                                      <select
                                        value={aff.status || 'Pending Review'}
                                        onChange={(e) => handleUpdateAffiliateStatus(aff.id || aff.referralCode, e.target.value)}
                                        className="block w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-[#00D26A]"
                                      >
                                        <option value="Pending Review">Pending Review</option>
                                        <option value="Eligibility Verified">Eligibility Verified</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Papers Requested">Papers Requested</option>
                                        <option value="Paid &amp; Concluded">Paid &amp; Concluded</option>
                                        <option value="Rejected">Rejected</option>
                                      </select>
                                    </div>
                                  </td>

                                  {/* Seller Name & LinkedIn */}
                                  <td className="p-3.5 align-top">
                                    <div className="font-bold text-white text-xs">{aff.fullName}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{aff.referralCode || aff.id}</div>

                                    {aff.linkedInUrl ? (
                                      <a
                                        href={aff.linkedInUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-[#0077b5]/20 hover:bg-[#0077b5]/30 text-[#70b5f9] border border-[#0077b5]/40 text-[10px] font-semibold transition-colors"
                                      >
                                        <Linkedin className="w-3 h-3 text-[#0077b5]" />
                                        <span>LinkedIn Profile</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                      </a>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 italic block mt-0.5">
                                        No LinkedIn URL
                                      </span>
                                    )}
                                  </td>

                                  {/* Phone & Email */}
                                  <td className="p-3.5 align-top font-mono">
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                                      <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                      <a href={`tel:${aff.phone}`} className="hover:underline">
                                        {aff.phone}
                                      </a>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                                      <a href={`mailto:${aff.email}`} className="hover:text-white hover:underline">
                                        {aff.email}
                                      </a>
                                    </div>
                                  </td>

                                  {/* University & Course */}
                                  <td className="p-3.5 align-top">
                                    <div className="font-semibold text-slate-200">{aff.university}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{aff.campusCourse}</div>
                                  </td>

                                  {/* Shallow Units Overview */}
                                  <td className="p-3.5 align-top max-w-xs">
                                    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                                      {aff.unitsDescription || 'No unit list provided'}
                                    </div>
                                  </td>

                                  {/* Quantity & Years */}
                                  <td className="p-3.5 align-top text-[11px]">
                                    <div className="font-bold text-white">{aff.paperCount || '1 - 5 Papers'}</div>
                                    <div className="text-slate-400 text-[10px] mt-0.5">
                                      {aff.academicYears || 'Current / Recent'}
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="p-3.5 align-top text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <a
                                        href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(
                                          `Hello ${aff.fullName}, this is the ExamPapers Acquisitions Team regarding your affiliate application (${aff.referralCode || aff.id}) to sell past papers for ${aff.university}. We have verified your eligibility for workmanship! Please send over the paper files/samples for ${aff.unitsDescription || 'your units'} here.`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-[10px] rounded-lg transition-all shadow-sm"
                                        title="WhatsApp candidate to request documents"
                                      >
                                        <span>WhatsApp</span>
                                      </a>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAffiliate(aff.id || aff.referralCode)}
                                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                                        title="Delete submission"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: SYSTEM SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-6 py-2">
                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#00D26A]" />
                      <span>Update Admin Security PIN</span>
                    </h3>

                    <form onSubmit={handleUpdatePin} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          New Admin PIN (Minimum 4 digits)
                        </label>
                        <input
                          type="password"
                          value={newPinInput ?? ''}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          placeholder="e.g. 5678"
                          className="w-full px-4 py-2.5 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs outline-none focus:border-[#00D26A]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#00D26A] text-slate-950 font-extrabold text-xs rounded-xl hover:bg-[#00b85c] transition-all"
                      >
                        Update PIN
                      </button>
                    </form>
                  </div>

                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#00D26A]" />
                      <span>Default Paper Price Configuration</span>
                    </h3>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={defaultPrice ?? ''}
                        onChange={(e) => setDefaultPrice(e.target.value)}
                        className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs outline-none focus:border-[#00D26A]"
                      />
                      <span className="text-xs text-slate-400">Default rate per download</span>
                    </div>
                  </div>

                  {settingsSuccessMsg && (
                    <div className="p-3 bg-emerald-500/20 border border-[#00D26A]/40 text-[#00D26A] text-xs font-bold rounded-xl text-center">
                      {settingsSuccessMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Exam Paper Modal with Structured Form Validation */}
            {/* Admin Download Modal */}
      {downloadAdminPaper && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 animate-fadeIn shadow-2xl my-8">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center font-bold">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Download Protected Document</h3>
              </div>
            </div>
            
            <form onSubmit={handleAdminDownload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Enter PDF Password</label>
                <input
                  type="text"
                  value={downloadAdminPassword}
                  onChange={(e) => setDownloadAdminPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-[#00D26A] focus:ring-1 focus:ring-[#00D26A] outline-none"
                  placeholder="e.g. Kamau"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-2 leading-tight">This password will be used to encrypt the downloaded PDF file. It is not saved.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDownloadAdminPaper(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDownloadingAdmin || !downloadAdminPassword.trim()}
                  className="px-4 py-2 bg-[#00D26A] hover:bg-[#00b359] text-slate-950 text-sm font-extrabold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDownloadingAdmin ? (
                    <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin block"></span>
                  ) : null}
                  Download Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaperModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 animate-fadeIn shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center font-bold">
                  {editingPaper ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingPaper ? 'Edit Examination Paper' : 'Add New Examination Paper'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingPaper ? `Updating catalog record ${editingPaper.id}` : 'Store validated exam paper directly to Supabase'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaperModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Operational & Authorization Notice */}
            {formActionNotice && (
              <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-950/40 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-300">Notice</p>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">{formActionNotice.message}</p>
                </div>
              </div>
            )}

            {/* Overall form error banner */}
            {hasAttemptedSubmit && Object.keys(formErrors).length > 0 && (
              <div className="p-3.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <p className="text-[11px] font-semibold text-rose-300">
                  Please resolve the highlighted validation errors before saving.
                </p>
              </div>
            )}

            <form onSubmit={handleSavePaper} noValidate className="space-y-4 text-xs">
              {/* PDF Document File Upload Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5 text-[#00D26A]" />
                    <span>PDF Document (.pdf)</span>
                    {!editingPaper && <span className="text-rose-400">*</span>}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Private Papers bucket</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf,.pdf"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#00D26A] bg-[#00D26A]/10 scale-[1.01]'
                      : (formTouched.pdfFile || hasAttemptedSubmit) && formErrors.pdfFile
                      ? 'border-rose-500/80 bg-rose-950/20'
                      : uploadedFileName || selectedFile
                      ? 'border-emerald-500/50 bg-slate-950 hover:border-[#00D26A]'
                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                  }`}
                >
                  {uploadedFileName || selectedFile ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[#00D26A]" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                            <span>{uploadedFileName || selectedFile?.name}</span>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                              PDF
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{uploadedFileSize || (selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Existing Storage File')}</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-[#00D26A]" /> {selectedFile ? 'Ready for backend upload' : 'Existing File'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition-colors"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveSelectedFile}
                          title="Remove selected file"
                          className="p-1 bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 text-[10px] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-2">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-[#00D26A] flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5 text-[#00D26A]" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-xs">
                          {editingPaper ? 'Upload Replacement PDF (Optional)' : 'Select Examination PDF (.pdf)'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Drag &amp; drop PDF file here or click to browse
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {((formTouched.pdfFile || hasAttemptedSubmit) && formErrors.pdfFile) && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{formErrors.pdfFile}</span>
                  </p>
                )}
                {uploadError && !formErrors.pdfFile && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{uploadError}</span>
                  </p>
                )}
              </div>

              {/* Unit Code Field with Real-Time Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1">
                    <span>Unit Code (unit_code)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">e.g. MATH101, BCOM202</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formUnitCode ?? ''}
                    onFocus={() => setFormTouched((prev) => ({ ...prev, unit_code: true }))}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormUnitCode(val);
                      const err = validateUnitCodeField(val);
                      setFormErrors((prev) => ({ ...prev, unit_code: err || undefined }));
                      if (!formFilePath || formFilePath.startsWith('papers/')) {
                        setFormFilePath(`papers/${val.trim() || 'UNIT'}_Exam.pdf`);
                      }
                    }}
                    placeholder="e.g. MATH101"
                    className={`w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border font-mono uppercase text-xs text-white outline-none transition-colors ${
                      (formTouched.unit_code || hasAttemptedSubmit) && formErrors.unit_code
                        ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                        : 'border-slate-800 focus:border-[#00D26A]'
                    }`}
                  />
                  {(formTouched.unit_code || hasAttemptedSubmit) && !formErrors.unit_code && formUnitCode && (
                    <CheckCircle2 className="w-4 h-4 text-[#00D26A] absolute right-3 top-3" />
                  )}
                </div>
              {activeTab === 'admins' && adminRole === 'super_admin' && (
                <AdminManagementTab />
              )}

                {(formTouched.unit_code || hasAttemptedSubmit) && formErrors.unit_code && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{formErrors.unit_code}</span>
                  </p>
                )}
              </div>

              {/* Paper Title Field with Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1">
                    <span>Paper Title (paper_title)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Official course name</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formPaperTitle ?? ''}
                    onFocus={() => setFormTouched((prev) => ({ ...prev, paper_title: true }))}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormPaperTitle(val);
                      const err = validatePaperTitleField(val);
                      setFormErrors((prev) => ({ ...prev, paper_title: err || undefined }));
                    }}
                    placeholder="e.g. Calculus &amp; Analytical Geometry 2024"
                    className={`w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border text-xs text-white outline-none transition-colors ${
                      (formTouched.paper_title || hasAttemptedSubmit) && formErrors.paper_title
                        ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                        : 'border-slate-800 focus:border-[#00D26A]'
                    }`}
                  />
                  {(formTouched.paper_title || hasAttemptedSubmit) && !formErrors.paper_title && formPaperTitle && (
                    <CheckCircle2 className="w-4 h-4 text-[#00D26A] absolute right-3 top-3" />
                  )}
                </div>
                {(formTouched.paper_title || hasAttemptedSubmit) && formErrors.paper_title && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{formErrors.paper_title}</span>
                  </p>
                )}
              </div>

              {/* Price & Status in Structured Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Price Field */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Price (KSh)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-500 select-none">KSh</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={formPrice ?? ''}
                      onFocus={() => setFormTouched((prev) => ({ ...prev, price: true }))}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormPrice(val);
                        const err = validatePriceField(val);
                        setFormErrors((prev) => ({ ...prev, price: err || undefined }));
                      }}
                      placeholder="50"
                      className={`w-full pl-12 pr-3.5 py-2.5 bg-slate-950 rounded-xl border font-mono text-xs text-white outline-none transition-colors ${
                        (formTouched.price || hasAttemptedSubmit) && formErrors.price
                          ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                          : 'border-slate-800 focus:border-[#00D26A]'
                      }`}
                    />
                  </div>
                  {(formTouched.price || hasAttemptedSubmit) && formErrors.price && (
                    <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.price}</span>
                    </p>
                  )}
                </div>

                {/* Status Field */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-white text-xs outline-none focus:border-[#00D26A] transition-colors"
                  >
                    <option value="available">available (Active in Catalog)</option>
                    <option value="unavailable">unavailable (Inactive / Draft)</option>
                  </select>
                </div>
              </div>

              {/* Storage File Path with Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1">
                    <span>Storage Path (file_path)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">papers/CODE_year.pdf</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formFilePath ?? ''}
                    onFocus={() => setFormTouched((prev) => ({ ...prev, file_path: true }))}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormFilePath(val);
                      const err = validateFilePathField(val);
                      setFormErrors((prev) => ({ ...prev, file_path: err || undefined }));
                    }}
                    placeholder="e.g. papers/MATH101_2024.pdf"
                    className={`w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border font-mono text-xs text-white outline-none transition-colors ${
                      (formTouched.file_path || hasAttemptedSubmit) && formErrors.file_path
                        ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                        : 'border-slate-800 focus:border-[#00D26A]'
                    }`}
                  />
                </div>
                {(formTouched.file_path || hasAttemptedSubmit) && formErrors.file_path && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{formErrors.file_path}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  Supabase column <code className="text-emerald-400 font-mono">papers.file_path</code>. Used by download token handler.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaperModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const validationErrors = validateAllFormFields();
                    if (Object.keys(validationErrors).length > 0) {
                      setFormErrors(validationErrors);
                      setHasAttemptedSubmit(true);
                      return;
                    }
                    const draftPaper: Paper = {
                      id: editingPaper?.id || 'DRAFT-ID',
                      unit_code: formUnitCode.trim().toUpperCase(),
                      paper_title: formPaperTitle.trim(),
                      price: `KSh ${formPrice.replace(/[^\d]/g, '') || '50'}`,
                      status: formStatus,
                      file_path: formFilePath.trim() || uploadedFileName || `${formUnitCode}_Draft.pdf`,
                    };
                    setViewingPaper(draftPaper);
                    setViewingPage(1);
                  }}
                  className="px-4 py-2 bg-slate-800 text-[#00D26A] border border-[#00D26A]/30 font-bold rounded-xl hover:bg-[#00D26A]/10 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  type="submit"
                  disabled={isSavingPaper}
                  className="px-5 py-2 bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-extrabold rounded-xl transition-all shadow-md shadow-[#00D26A]/20 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSavingPaper && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPaper ? 'Save Changes' : 'Save to Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Full Interactive Document Viewer Modal */}
      {viewingPaper && (
        <div className="fixed inset-0 z-80 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Document Viewer Header Bar */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#00D26A]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#00D26A] text-slate-950 px-2 py-0.5 rounded font-mono font-black text-xs">
                      {viewingPaper.unit_code}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                      {viewingPaper.paper_title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                    <span>File: {viewingPaper.file_path || `${viewingPaper.unit_code}_Exam.pdf`}</span>
                    <span>•</span>
                    <span>Status: {viewingPaper.status || 'available'}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">Price: {viewingPaper.price || 'KSh 50'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setDownloadAdminPaper(viewingPaper);
                    setDownloadAdminPassword('');
                  }}
                  className="hidden sm:flex px-3.5 py-2 bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs rounded-xl items-center gap-1.5 shadow transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setViewingPaper(null)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Viewer Page Navigation Toolbar */}
            <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  disabled={viewingPage <= 1}
                  onClick={() => setViewingPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold rounded-lg transition-colors"
                >
                  ← Prev
                </button>
                <span className="font-mono font-bold text-slate-200">
                  Page <span className="text-[#00D26A]">{viewingPage}</span> of 3
                </span>
                <button
                  disabled={viewingPage >= 3}
                  onClick={() => setViewingPage((p) => Math.min(3, p + 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold rounded-lg transition-colors"
                >
                  Next →
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00D26A]" /> PDF Document Validated
                </span>
                <span>•</span>
                <span>Protected Vault Record</span>
              </div>
            </div>

            {/* Document Paper Page Rendering Area */}
            <div className="p-4 sm:p-8 bg-slate-950 overflow-y-auto flex-1 flex justify-center">
              <div className="bg-white text-slate-900 w-full max-w-2xl min-h-[700px] rounded-lg shadow-2xl p-6 sm:p-10 font-serif relative flex flex-col justify-between border border-slate-200 select-none">
                {/* Official Exam Paper Header */}
                <div>
                  <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider font-sans text-slate-900">
                      UNIVERSITY EXAMINATION PAPER
                    </h2>
                    <p className="text-xs font-bold text-slate-700 font-sans uppercase tracking-widest mt-0.5">
                      DEPARTMENT OF ACADEMIC &amp; EXAMINATION QUALITY
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600 font-sans mt-1">
                      END OF SEMESTER EXAMINATION • UNIT {viewingPaper.unit_code}
                    </p>
                  </div>

                  {/* Paper Meta Details Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs font-sans font-bold text-slate-800 bg-slate-100 p-4 rounded-md border border-slate-300 mb-6">
                    <div>
                      <span className="text-slate-500 font-normal block text-[10px] uppercase">UNIT CODE:</span>
                      <span className="font-mono text-sm font-black text-slate-950">{viewingPaper.unit_code}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-normal block text-[10px] uppercase">UNIT TITLE:</span>
                      <span className="font-extrabold text-slate-900">{viewingPaper.paper_title}</span>
                    </div>
                    <div className="col-span-2 grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-500 font-normal block text-[10px] uppercase">STATUS:</span>
                        <span className="uppercase text-emerald-700 font-bold">{viewingPaper.status || 'available'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-normal block text-[10px] uppercase">PRICE:</span>
                        <span className="text-slate-900">{viewingPaper.price || 'KSh 50'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-normal block text-[10px] uppercase">TIME ALLOWED:</span>
                        <span>2 HOURS</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 p-3 bg-amber-50 border-l-4 border-amber-500 text-[11px] font-sans text-slate-800">
                    <strong>INSTRUCTIONS TO CANDIDATES:</strong> Answer QUESTION ONE (Compulsory) in Section A and any TWO (2) questions from Section B.
                  </div>

                  {/* Page-by-Page Exam Content */}
                  {viewingPage === 1 && (
                    <div className="space-y-5 text-xs text-slate-900 leading-relaxed font-sans">
                      <div className="border-b pb-2 font-bold text-sm text-slate-950">
                        SECTION A: COMPULSORY QUESTION (30 MARKS)
                      </div>

                      <div>
                        <p className="font-bold mb-1">
                          QUESTION ONE (30 MARKS)
                        </p>
                        <ul className="space-y-3 pl-2">
                          <li>
                            <p className="font-medium">
                              (a) Define the core concepts of <strong>{viewingPaper.paper_title}</strong> and explain their practical significance in modern academic applications. <span className="font-bold text-slate-600 float-right">[6 Marks]</span>
                            </p>
                          </li>
                          <li>
                            <p className="font-medium">
                              (b) Outline four fundamental principles associated with code <strong>{viewingPaper.unit_code}</strong>. <span className="font-bold text-slate-600 float-right">[8 Marks]</span>
                            </p>
                          </li>
                          <li>
                            <p className="font-medium">
                              (c) Differentiate clearly between primary analytical methods and secondary evaluation frameworks with relevant examples. <span className="font-bold text-slate-600 float-right">[8 Marks]</span>
                            </p>
                          </li>
                          <li>
                            <p className="font-medium">
                              (d) Calculate the expected throughput parameters using standard formulation equations for {viewingPaper.unit_code}. <span className="font-bold text-slate-600 float-right">[8 Marks]</span>
                            </p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {viewingPage === 2 && (
                    <div className="space-y-5 text-xs text-slate-900 leading-relaxed font-sans">
                      <div className="border-b pb-2 font-bold text-sm text-slate-950">
                        SECTION B: ANSWER ANY TWO (2) QUESTIONS (40 MARKS)
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="font-bold mb-1">QUESTION TWO (20 MARKS)</p>
                          <p className="font-medium">
                            (a) Discuss in detail the systematic workflow required when formulating solutions in <strong>{viewingPaper.paper_title}</strong>. Include schematic diagrams where applicable. <span className="font-bold text-slate-600 float-right">[12 Marks]</span>
                          </p>
                          <p className="font-medium mt-2">
                            (b) Highlight three key constraints faced during empirical testing under code {viewingPaper.unit_code}. <span className="font-bold text-slate-600 float-right">[8 Marks]</span>
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-200">
                          <p className="font-bold mb-1">QUESTION THREE (20 MARKS)</p>
                          <p className="font-medium">
                            (a) Evaluate the impact of optimization techniques on overall systemic performance in modern environments. <span className="font-bold text-slate-600 float-right">[10 Marks]</span>
                          </p>
                          <p className="font-medium mt-2">
                            (b) Derive the fundamental mathematical relation governing equilibrium for {viewingPaper.unit_code}. <span className="font-bold text-slate-600 float-right">[10 Marks]</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewingPage === 3 && (
                    <div className="space-y-5 text-xs text-slate-900 leading-relaxed font-sans">
                      <div className="border-b pb-2 font-bold text-sm text-slate-950">
                        SECTION B (CONTINUED) &amp; MARKING OUTLINE
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="font-bold mb-1">QUESTION FOUR (20 MARKS)</p>
                          <p className="font-medium">
                            (a) Case Study Analysis: Examine the scenarios provided in <strong>{viewingPaper.paper_title}</strong> and propose a verified 5-step mitigation strategy. <span className="font-bold text-slate-600 float-right">[14 Marks]</span>
                          </p>
                          <p className="font-medium mt-2">
                            (b) Summarize two ethical considerations in research methodologies. <span className="font-bold text-slate-600 float-right">[6 Marks]</span>
                          </p>
                        </div>

                        <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-[10px] text-emerald-900 space-y-1">
                          <p className="font-bold uppercase tracking-wider">Official End of Exam Paper</p>
                          <p>Database Record ID: {viewingPaper.id || 'Pending Sync'} | Storage: {viewingPaper.file_path || 'Standard Document Vault'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Watermark & Page Number */}
                <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-sans">
                  <span>GODRERYTONE PUBLISHERS — OFFICIAL EXAM CATALOG</span>
                  <span className="font-bold font-mono text-slate-900">
                    PAGE {viewingPage} OF 3
                  </span>
                  <span>DOC: {viewingPaper.unit_code}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Document Retrieval & Customer Support Modal */}
      {selectedInquiryTx && (
        <div className="fixed inset-0 z-80 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 max-w-lg w-full space-y-5 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#00D26A]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Purchase Inquiry &amp; Retrieval</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Receipt Code: {selectedInquiryTx.mpesaReceipt}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedInquiryTx(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                {/* Student Full Name */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Purchaser Full Name</span>
                  <span className="font-extrabold text-white text-sm">
                    {selectedInquiryTx.studentFirstName} {selectedInquiryTx.studentSecondName}
                  </span>
                </div>

                {/* Phone Number + Copy Function */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Phone Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200 font-bold">{selectedInquiryTx.phone}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInquiryTx.phone);
                        alert(`Copied Phone Number: ${selectedInquiryTx.phone}`);
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[#00D26A] font-bold rounded text-[10px] transition-colors"
                      title="Copy Phone Number"
                    >
                      Copy Phone
                    </button>
                  </div>
                </div>

                {/* Unit Course */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Unit Course</span>
                  <span className="font-bold text-[#00D26A] font-mono">
                    {selectedInquiryTx.unit_code} - {selectedInquiryTx.paper_title}
                  </span>
                </div>

                {/* Receipt Code + Copy Function */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">M-Pesa Receipt Code</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-100">{selectedInquiryTx.mpesaReceipt}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInquiryTx.mpesaReceipt);
                        alert(`Copied M-Pesa Receipt Code: ${selectedInquiryTx.mpesaReceipt}`);
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[#00D26A] font-bold rounded text-[10px] transition-colors"
                      title="Copy Receipt Code"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>

                {/* Amount Paid */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Amount Purchased</span>
                  <span className="font-black text-white text-sm bg-emerald-500/10 text-[#00D26A] px-2.5 py-0.5 rounded-lg border border-[#00D26A]/30">
                    {selectedInquiryTx.price}
                  </span>
                </div>

                {/* PDF Password Key + Copy Function */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">PDF Password Key</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                      {selectedInquiryTx.passwordUsed}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInquiryTx.passwordUsed);
                        alert(`Copied PDF Password Key: ${selectedInquiryTx.passwordUsed}`);
                      }}
                      className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded text-[10px] transition-colors"
                      title="Copy Password Key"
                    >
                      Copy Pass
                    </button>
                  </div>
                </div>

                {/* Transaction Time */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Purchase Timestamp</span>
                  <span className="text-slate-400 font-mono text-[11px]">{selectedInquiryTx.timestamp}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-[#00D26A]/30 rounded-xl text-slate-300 space-y-1">
                <p className="font-bold text-xs text-[#00D26A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00D26A]" />
                  <span>Document Record Verified &amp; Active</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  You can copy the student's phone number (<strong className="text-slate-200">{selectedInquiryTx.phone}</strong>) or password (<strong className="text-amber-300">{selectedInquiryTx.passwordUsed}</strong>) for SMS support, or view/download the document copy below.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  const paper = papers.find((p) => p.unit_code === selectedInquiryTx.unit_code);
                  if (paper) {
                    setViewingPaper(paper);
                    setViewingPage(1);
                    setSelectedInquiryTx(null);
                  } else {
                    alert(`Opening exam paper preview for ${selectedInquiryTx.unit_code}`);
                  }
                }}
                className="px-4 py-2.5 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700 flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4 text-[#00D26A]" />
                <span>View Purchased Document</span>
              </button>
              <button
                onClick={() => {
                  alert("Student PDF copies cannot be re-downloaded securely. Ask the student to re-request.");
                }}
                className="hidden sm:flex px-4 py-2.5 bg-[#00D26A] text-slate-950 font-black text-xs rounded-xl hover:bg-[#00b85c] items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Processing Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
            <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-3xl">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#00D26A]" /> Bulk AI Digitization Queue
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload multiple exam paper images to be converted into PDF documents automatically using the AI engine.
                </p>
              </div>
              <button
                onClick={() => {
                  if (isProcessingBulk) return;
                  setIsBulkModalOpen(false);
                  setBulkTasks([]);
                }}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                disabled={isProcessingBulk}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              <label className="block font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5 text-[#00D26A]" />
                  <span>Select Exam Papers to Digitize</span>
                </span>
              </label>

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
                <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${isProcessingBulk ? 'text-slate-600' : 'text-slate-400'}`} />
                <p className="text-sm font-bold text-white mb-1">Click to select files</p>
                <p className="text-xs text-slate-500">Supports .jpg, .png, .jpeg (Multi-select enabled)</p>
              </div>

              {/* Status Indicator Queue */}
              {bulkTasks.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                    Processing Queue ({bulkTasks.filter(t => t.status === 'completed').length} / {bulkTasks.length})
                  </h4>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {bulkTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 bg-slate-950 border rounded-xl flex items-center justify-between transition-colors ${
                          task.status === 'processing'
                            ? 'border-[#00D26A]/40 bg-[#00D26A]/5'
                            : task.status === 'completed'
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : task.status === 'error'
                            ? 'border-rose-500/30 bg-rose-500/5'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col flex-1 min-w-0 mr-4">
                          <span className="text-sm text-slate-200 font-bold truncate">
                            {task.file.name}
                          </span>
                          <span
                            className={`text-xs mt-0.5 truncate ${
                              task.status === 'error'
                                ? 'text-rose-400'
                                : task.status === 'completed'
                                ? 'text-[#00D26A]'
                                : 'text-slate-500'
                            }`}
                          >
                            {task.progressText}
                          </span>
                        </div>
                        <div className="flex items-center justify-end shrink-0">
                          {task.status === 'pending' && <Clock className="w-5 h-5 text-slate-600" />}
                          {task.status === 'processing' && <Loader2 className="w-5 h-5 text-[#00D26A] animate-spin" />}
                          {task.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-[#00D26A]" />}
                          {task.status === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/50 rounded-b-3xl">
              <button
                onClick={startBulkProcessing}
                disabled={isProcessingBulk || bulkTasks.length === 0 || bulkTasks.every(t => t.status === 'completed')}
                className={`w-full py-3.5 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isProcessingBulk
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : bulkTasks.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 shadow-md shadow-[#00D26A]/20'
                }`}
              >
                {isProcessingBulk ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Engine Active...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    <span>Start Bulk Digitization Engine</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
