import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  X,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Paper, ExamPaperAdminItem } from '../types';
import {
  deletePaperUnified,
  updatePaperUnified,
} from '../lib/supabase';

// Modular Admin Components
import {
  AdminSection,
  TransactionRecord,
  DeviceRequest,
  AffiliateRecord,
  ActivationResult,
} from './admin/adminTypes';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminTopHeader } from './admin/AdminTopHeader';
import { AdminDashboardView } from './admin/AdminDashboardView';
import { AdminActivateCodeView } from './admin/AdminActivateCodeView';
import { AdminOrdersView } from './admin/AdminOrdersView';
import { AdminPaymentsView } from './admin/AdminPaymentsView';
import { AdminPapersView } from './admin/AdminPapersView';
import { AdminPaperSellersView } from './admin/AdminPaperSellersView';
import { AdminCustomersView } from './admin/AdminCustomersView';
import { AdminDocumentAccessView } from './admin/AdminDocumentAccessView';
import { AdminDeviceRequestsView } from './admin/AdminDeviceRequestsView';
import { AdminUsersView } from './admin/AdminUsersView';
import { AdminAddUserView } from './admin/AdminAddUserView';
import { AdminSettingsView } from './admin/AdminSettingsView';
import { AdminSystemStatusView } from './admin/AdminSystemStatusView';
import { ActivationResultModal } from './admin/ActivationResultModal';
import { OrderInquiryModal } from './admin/OrderInquiryModal';
import { AdminPaperEditModal } from './admin/AdminPaperEditModal';
import { AdminPaperViewerModal } from './admin/AdminPaperViewerModal';
import { AdminDownloadPaperModal } from './admin/AdminDownloadPaperModal';
import { AdminBulkOcrModal } from './admin/AdminBulkOcrModal';

// Re-export types for backward compatibility
export type { Paper, ExamPaperAdminItem, TransactionRecord, DeviceRequest };

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
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [adminRole, setAdminRole] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Active Section Navigation & Mobile Sidebar
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Data Collections
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [pendingActivations, setPendingActivations] = useState<any[]>([]);
  const [deviceRequests, setDeviceRequests] = useState<DeviceRequest[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);

  // Refresh Indicators
  const [isRefreshingAll, setIsRefreshingAll] = useState<boolean>(false);
  const [isRefreshingActivations, setIsRefreshingActivations] = useState<boolean>(false);
  const [isRefreshingDeviceReqs, setIsRefreshingDeviceReqs] = useState<boolean>(false);
  const [isActivatingId, setIsActivatingId] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);

  // Modals State
  const [activationResultModal, setActivationResultModal] = useState<ActivationResult | null>(null);
  const [selectedInquiryTx, setSelectedInquiryTx] = useState<TransactionRecord | null>(null);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState<boolean>(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [isSavingPaper, setIsSavingPaper] = useState<boolean>(false);
  const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);
  const [downloadAdminPaper, setDownloadAdminPaper] = useState<Paper | null>(null);
  const [isDownloadingAdmin, setIsDownloadingAdmin] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

  // Paper Deletion State & Feedback
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [isDeletingPaper, setIsDeletingPaper] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteNotification, setDeleteNotification] = useState<string | null>(null);

  // Settings State
  const [currentAdminPin, setCurrentAdminPin] = useState<string>('');
  const [defaultPrice, setDefaultPrice] = useState<string>('50');

  // Verify administrator session authoritatively on mount or when portal opens
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setAdminRole('');
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        setIsCheckingAuth(true);
        const res = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.valid && isMounted) {
            setIsAuthenticated(true);
            setAdminRole(data.role || localStorage.getItem('admin_role') || 'support_admin');
            setIsCheckingAuth(false);
            return;
          }
        }
        // If verification failed (invalid token, expired, deactivated)
        if (isMounted) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_role');
          setIsAuthenticated(false);
          setAdminRole('');
          setIsCheckingAuth(false);
        }
      } catch (err) {
        if (isMounted) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_role');
          setIsAuthenticated(false);
          setAdminRole('');
          setIsCheckingAuth(false);
        }
      }
    };

    if (isOpen) {
      verifySession();
    } else {
      setIsCheckingAuth(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Fetch pending activations
  const fetchPendingActivations = async () => {
    try {
      setIsRefreshingActivations(true);
      const res = await fetch('/api/admin/manual-activation/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        setLoginError('Your administrative session has expired. Please sign in again.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPendingActivations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load pending activations:', err);
    } finally {
      setIsRefreshingActivations(false);
    }
  };

  // Fetch transactions / orders
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        setLoginError('Your administrative session has expired. Please sign in again.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  // Fetch device requests
  const fetchDeviceRequests = async () => {
    try {
      setIsRefreshingDeviceReqs(true);
      const res = await fetch('/api/admin/device-requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        setLoginError('Your administrative session has expired. Please sign in again.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDeviceRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load device requests:', err);
    } finally {
      setIsRefreshingDeviceReqs(false);
    }
  };

  // Fetch affiliates
  const fetchAffiliates = async () => {
    try {
      const res = await fetch('/api/affiliates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        setLoginError('Your administrative session has expired. Please sign in again.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAffiliates(data);
        }
      }
    } catch (err) {
      console.error('Failed to load affiliates:', err);
    }
  };

  // Synchronize all resources
  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      await Promise.allSettled([
        fetchTransactions(),
        fetchPendingActivations(),
        fetchDeviceRequests(),
        fetchAffiliates(),
        onRefreshPapers ? onRefreshPapers() : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  // Fetch all operational data when authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      handleRefreshAll();
    }
  }, [isAuthenticated, isOpen]);

  // Handle Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!accountId.trim() || !password.trim()) {
      setLoginError('Please provide both Account ID and Password.');
      return;
    }

    try {
      setIsLoggingIn(true);
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: accountId.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_role', data.role);
        setAdminRole(data.role);
        setIsAuthenticated(true);
        setLoginError('');
        setPassword('');
      } else {
        setLoginError(data.error || 'Invalid credentials. Please verify your Account ID and Password.');
      }
    } catch (err) {
      setLoginError('Unable to connect to administration authentication service.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    setAdminRole('');
    setIsAuthenticated(false);
    setActiveSection('dashboard');
    setPassword('');
  };

  // Handle Manual Code Activation (ACTIVATE Button)
  const handleActivateRequest = async (orderId: string) => {
    try {
      setIsActivatingId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActivationResultModal(data.result);
        fetchPendingActivations();
        fetchTransactions();
      } else {
        alert(data.error || 'Failed to activate order.');
      }
    } catch (err) {
      alert('Network connection error during activation.');
    } finally {
      setIsActivatingId(null);
    }
  };

  // Handle Resending Activation Email
  const handleResendEmail = async (orderId: string) => {
    if (!orderId) return;
    try {
      setIsResendingEmail(true);
      const res = await fetch(`/api/admin/orders/${orderId}/resend-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      const data = await res.json();
      if (data.emailStatus && activationResultModal) {
        setActivationResultModal({
          ...activationResultModal,
          emailStatus: data.emailStatus,
          emailError: data.error,
        });
      }
      if (res.ok && data.success) {
        alert('Activation email resent successfully!');
      } else {
        alert(data.error || `Email delivery notice: ${data.emailStatus || 'FAILED'}`);
      }
    } catch (err) {
      alert('Network error while resending email.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Device Requests Handlers
  const handleApproveDeviceRequest = async (id: string) => {
    if (!confirm('Approve this device authorization request? This will increase the student device limit by 1.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/device-requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.ok) {
        fetchDeviceRequests();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to approve request');
      }
    } catch (err) {
      alert('Network connection error');
    }
  };

  const handleRejectDeviceRequest = async (id: string) => {
    if (!confirm('Reject this additional device request?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/device-requests/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.ok) {
        fetchDeviceRequests();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to reject request');
      }
    } catch (err) {
      alert('Network connection error');
    }
  };

  // Affiliate Handlers
  const handleUpdateAffiliateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/affiliates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setAffiliates((prev) =>
        prev.map((a) => (a.id === id || a.referralCode === id ? { ...a, status: newStatus } : a))
      );
    } catch (e) {
      console.error('Error updating affiliate status:', e);
    }
  };

  const handleDeleteAffiliate = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this affiliate partner?')) return;
    try {
      await fetch(`/api/affiliates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      setAffiliates((prev) => prev.filter((a) => a.id !== id && a.referralCode !== id));
    } catch (e) {
      console.error('Error deleting affiliate:', e);
    }
  };

  // Paper Catalog Handlers
  const handleSavePaper = async (formData: FormData, savedPaperMeta: Paper): Promise<Paper | null> => {
    setIsSavingPaper(true);
    try {
      const res = await fetch('/api/papers/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
        body: formData,
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(result.error || 'Failed to save paper in repository');
        return null;
      }

      // Authoritative source: Fetch refreshed Paper record from database directly by ID
      const paperId = result.paper?.id || savedPaperMeta.id;
      let freshPaper: Paper | null = null;
      if (paperId && !paperId.startsWith('paper-')) {
        try {
          const fetchRes = await fetch(`/api/papers/${paperId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            cache: 'no-store',
          });
          if (fetchRes.ok) {
            freshPaper = await fetchRes.json();
          }
        } catch (fetchErr) {
          console.warn('Notice: Failed to fetch fresh paper by id:', fetchErr);
        }
      }

      const saved: Paper = freshPaper || {
        ...savedPaperMeta,
        ...(result.paper || {}),
        price: typeof result.paper?.price === 'number' ? `KSh ${result.paper.price}` : (result.paper?.price || savedPaperMeta.price),
        file_path: result.paper?.file_path || savedPaperMeta.file_path,
      };

      // 1. Update the editingPaper state in AdminPortal with the fresh record
      setEditingPaper(saved);

      // 2. Update the papers list in AdminPortal state
      setPapers((prev) => {
        if (editingPaper) {
          return prev.map((p) => (p.id === editingPaper.id ? { ...p, ...saved } : p));
        }
        return [saved, ...prev];
      });

      // 3. Re-run onRefreshPapers to keep all parent views synchronized
      if (onRefreshPapers) {
        await onRefreshPapers();
      }

      return saved;
    } catch (err) {
      alert('Network error while saving paper');
      return null;
    } finally {
      setIsSavingPaper(false);
    }
  };

  const handleDeletePaper = (paper: Paper) => {
    setDeleteError(null);
    setPaperToDelete(paper);
  };

  const handleConfirmDeletePaper = async () => {
    if (!paperToDelete) return;
    setIsDeletingPaper(true);
    setDeleteError(null);

    const { success, error } = await deletePaperUnified(paperToDelete.id);
    if (!success) {
      setIsDeletingPaper(false);
      setDeleteError(error || 'Failed to delete document.');
      return;
    }

    // 1. Remove the paper from the Admin Papers list immediately after successful deletion
    setPapers((prev) => prev.filter((p) => p.id !== paperToDelete.id));

    // 2. Refresh/revalidate the Papers data from the server
    if (onRefreshPapers) {
      await onRefreshPapers();
    }

    // 3. Close any open modal
    setIsPaperModalOpen(false);
    setEditingPaper(null);
    setPaperToDelete(null);
    setIsDeletingPaper(false);

    // 4. Show concise success notification
    setDeleteNotification('Document deleted successfully.');
    setTimeout(() => {
      setDeleteNotification((current) => (current === 'Document deleted successfully.' ? null : current));
    }, 4000);
  };

  const handleTogglePaperStatus = async (paper: Paper) => {
    const newStatus = paper.status === 'available' ? 'unavailable' : 'available';
    const { error } = await updatePaperUnified(paper.id, { status: newStatus });
    if (error) {
      alert(`Notice: ${error}`);
      return;
    }
    if (onRefreshPapers) {
      await onRefreshPapers();
    }
  };

  // Admin Paper Download Handler
  const handleExecuteAdminDownload = async (pwd: string) => {
    if (!downloadAdminPaper) return;
    setIsDownloadingAdmin(true);
    try {
      const res = await fetch(`/api/admin/papers/${downloadAdminPaper.id}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ password: pwd }),
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
    } catch (e: any) {
      alert(e.message || 'Failed to download document.');
    } finally {
      setIsDownloadingAdmin(false);
    }
  };

  // Settings Handlers
  const handleUpdatePin = async (newPin: string): Promise<boolean> => {
    setCurrentAdminPin(newPin);
    return true;
  };

  const handleUpdateDefaultPrice = async (newPrice: string): Promise<boolean> => {
    setDefaultPrice(newPrice);
    return true;
  };

  if (!isOpen) return null;

  // Render authoritative session verification indicator
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#00D26A] animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
            Verifying Administrator Session...
          </p>
        </div>
      </div>
    );
  }

  // Render Login Card if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B0F17] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto">
          {/* Close button to return to storefront */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Return to Storefront"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Crest / Header */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-[#00D26A]/30 text-[#00D26A] flex items-center justify-center mx-auto shadow-sm">
              <BookOpen className="w-7 h-7 text-[#00D26A]" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold tracking-widest text-[#00D26A] uppercase font-mono">
                Godrery Publishers
              </div>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                Administrative Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Authorized Operations &amp; Academic Publishing Access
              </p>
            </div>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Account ID
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Enter Account ID"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#00D26A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Protected System: Access restricted to authorized administrative personnel only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Classic, Smart, Professional Full Portal Layout
  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F17] text-slate-100 flex overflow-hidden">
      {/* Persistent Desktop Sidebar with Mobile Slide Drawer */}
      <AdminSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setIsSidebarOpen(false);
        }}
        onLogout={handleLogout}
        adminRole={adminRole}
        pendingActivationsCount={pendingActivations.length}
        pendingDeviceRequestsCount={
          deviceRequests.filter((r) => (r.status || '').toLowerCase() === 'pending').length
        }
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Administrative Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0B0F17]">
        {/* Top Header with Breadcrumbs & Sync Controls */}
        <AdminTopHeader
          activeSection={activeSection}
          onRefreshAll={handleRefreshAll}
          isRefreshing={isRefreshingAll}
          onClosePortal={onClose}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          pendingActivationsCount={pendingActivations.length}
        />

        {/* Scrollable Viewport Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#0B0F17]">
          {/* Active View Router */}
          {activeSection === 'dashboard' && (
            <AdminDashboardView
              papers={papers}
              transactions={transactions}
              pendingActivations={pendingActivations}
              deviceRequests={deviceRequests}
              affiliates={affiliates}
              onNavigate={(sec) => setActiveSection(sec)}
            />
          )}

          {activeSection === 'activate_code' && (
            <AdminActivateCodeView
              pendingActivations={pendingActivations}
              onActivate={handleActivateRequest}
              isActivatingId={isActivatingId}
              onRefresh={fetchPendingActivations}
              isRefreshing={isRefreshingActivations}
            />
          )}

          {activeSection === 'orders' && (
            <AdminOrdersView
              transactions={transactions}
              onInspectOrder={(tx) => setSelectedInquiryTx(tx)}
              onRefresh={fetchTransactions}
              isRefreshing={isRefreshingAll}
            />
          )}

          {activeSection === 'payments' && (
            <AdminPaymentsView
              transactions={transactions}
              onRefresh={fetchTransactions}
              isRefreshing={isRefreshingAll}
            />
          )}

          {activeSection === 'papers' && (
            <AdminPapersView
              papers={papers}
              isLoading={isLoadingPapers}
              onOpenAddPaperModal={() => {
                setEditingPaper(null);
                setIsPaperModalOpen(true);
              }}
              onEditPaper={(paper) => {
                setEditingPaper(paper);
                setIsPaperModalOpen(true);
              }}
              onDeletePaper={handleDeletePaper}
              onToggleStatus={handleTogglePaperStatus}
              onDownloadPaper={(paper) => setDownloadAdminPaper(paper)}
              onRefresh={async () => {
                if (onRefreshPapers) await onRefreshPapers();
              }}
              isRefreshing={isRefreshingAll}
              onOpenBulkModal={() => setIsBulkModalOpen(true)}
            />
          )}

          {activeSection === 'paper_sellers' && (
            <AdminPaperSellersView
              affiliates={affiliates}
              onUpdateStatus={handleUpdateAffiliateStatus}
              onDeleteAffiliate={handleDeleteAffiliate}
              onRefresh={fetchAffiliates}
              isRefreshing={isRefreshingAll}
            />
          )}

          {activeSection === 'customers' && (
            <AdminCustomersView
              transactions={transactions}
              onInspectCustomerOrders={(phone) => {
                setActiveSection('orders');
              }}
            />
          )}

          {activeSection === 'document_access' && (
            <AdminDocumentAccessView
              transactions={transactions}
              deviceRequests={deviceRequests}
              onNavigateToDeviceRequests={() => setActiveSection('device_requests')}
            />
          )}

          {activeSection === 'device_requests' && (
            <AdminDeviceRequestsView
              deviceRequests={deviceRequests}
              onApprove={handleApproveDeviceRequest}
              onReject={handleRejectDeviceRequest}
              onRefresh={fetchDeviceRequests}
              isRefreshing={isRefreshingDeviceReqs}
            />
          )}

          {activeSection === 'admin_users' && (
            <AdminUsersView
              onNavigateToAddAdmin={() => setActiveSection('add_admin')}
              currentAdminRole={adminRole}
            />
          )}

          {activeSection === 'add_admin' && (
            <AdminAddUserView onNavigate={(sec) => setActiveSection(sec)} />
          )}

          {activeSection === 'settings' && (
            <AdminSettingsView
              currentPin={currentAdminPin}
              onUpdatePin={handleUpdatePin}
              defaultPrice={defaultPrice}
              onUpdatePrice={handleUpdateDefaultPrice}
            />
          )}

          {activeSection === 'system_status' && <AdminSystemStatusView />}
        </main>
      </div>

      {/* Modals & Dialogs Layer */}
      {/* 1. Activation Result Feedback & Resend Email Modal */}
      <ActivationResultModal
        data={activationResultModal}
        onClose={() => setActivationResultModal(null)}
        onResendEmail={handleResendEmail}
        isResendingEmail={isResendingEmail}
      />

      {/* 2. Order Details Inspection Modal */}
      <OrderInquiryModal
        order={selectedInquiryTx}
        onClose={() => setSelectedInquiryTx(null)}
      />

      {/* 3. Paper Add / Edit Modal */}
      <AdminPaperEditModal
        isOpen={isPaperModalOpen}
        onClose={() => {
          setIsPaperModalOpen(false);
          setEditingPaper(null);
        }}
        editingPaper={editingPaper}
        onSave={handleSavePaper}
        isSaving={isSavingPaper}
        onPreview={(draft) => setViewingPaper(draft)}
        defaultPrice={defaultPrice}
        onDelete={handleDeletePaper}
      />

      {/* 4. Examination Paper Preview / Viewer Modal */}
      <AdminPaperViewerModal
        paper={viewingPaper}
        onClose={() => setViewingPaper(null)}
        onRequestDownload={(paper) => {
          setViewingPaper(null);
          setDownloadAdminPaper(paper);
        }}
      />

      {/* 5. Protected Download Authorization Modal */}
      <AdminDownloadPaperModal
        paper={downloadAdminPaper}
        onClose={() => setDownloadAdminPaper(null)}
        onDownload={handleExecuteAdminDownload}
        isDownloading={isDownloadingAdmin}
      />

      {/* 6. AI Bulk OCR Digitization Modal */}
      <AdminBulkOcrModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onPaperCreated={(newPaper) => {
          setPapers((prev) => [newPaper, ...prev]);
        }}
      />

      {/* 7. Paper Delete Confirmation Modal */}
      {paperToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">
                  Delete this examination paper?
                </h3>
                <p className="text-xs text-rose-300 font-medium leading-relaxed">
                  This will permanently remove the paper record and its stored PDF. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Unit Code:</span>
                <span className="font-mono font-bold text-white">{paperToDelete.unit_code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Title:</span>
                <span className="font-medium text-slate-200 truncate max-w-[200px] text-right">{paperToDelete.paper_title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Storage Object:</span>
                <span className="font-mono text-[11px] text-emerald-400 truncate max-w-[200px] text-right">
                  {paperToDelete.file_path || 'None'}
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeletingPaper}
                onClick={() => {
                  setPaperToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold transition-colors text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingPaper}
                onClick={handleConfirmDeletePaper}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black inline-flex items-center gap-1.5 transition-colors text-xs disabled:opacity-50 shadow-sm"
              >
                {isDeletingPaper ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Floating Success Notification */}
      {deleteNotification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-950" />
          <span>{deleteNotification}</span>
        </div>
      )}
    </div>
  );
};
