import React from 'react';
import { Menu, RefreshCw, X } from 'lucide-react';
import { AdminSection } from './adminTypes';

interface AdminTopHeaderProps {
  activeSection: AdminSection;
  onOpenMobileSidebar?: () => void;
  onToggleSidebar?: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onClosePortal: () => void;
  pendingActivationsCount?: number;
}

const SECTION_METADATA: Record<AdminSection, { title: string; category: string; description: string }> = {
  dashboard: {
    title: 'Operational Dashboard',
    category: 'Overview',
    description: 'Real-time metrics, pending activations, and recent system operations',
  },
  activate_code: {
    title: 'Manual Code Activation',
    category: 'Sales',
    description: 'Process and verify customer manual M-Pesa activations with instant document delivery',
  },
  orders: {
    title: 'Orders Directory',
    category: 'Sales',
    description: 'Searchable ledger of all customer examination paper purchases and entitlements',
  },
  payments: {
    title: 'Payments Ledger',
    category: 'Sales',
    description: 'Transaction logs and M-Pesa payment receipts',
  },
  papers: {
    title: 'Examination Papers Catalog',
    category: 'Content',
    description: 'Repository management, upload new PDF papers, and update availability status',
  },
  paper_sellers: {
    title: 'Affiliate Paper Sellers',
    category: 'Content',
    description: 'Student and lecturer past paper acquisition submissions',
  },
  customers: {
    title: 'Customers Directory',
    category: 'Customers',
    description: 'Verified customer list with purchase history and contact details',
  },
  document_access: {
    title: 'Document Access & Security',
    category: 'Document Access',
    description: 'Encrypted document access tracking and device authorization status',
  },
  device_requests: {
    title: 'Device Requests',
    category: 'Document Access',
    description: 'Review and approve customer requests to authorize an additional device limit',
  },
  admin_users: {
    title: 'Administrator Accounts',
    category: 'Administration',
    description: 'System administrators, assigned security roles, and status management',
  },
  add_admin: {
    title: 'Add New Administrator',
    category: 'Administration',
    description: 'Provision an administrator account with role-based access controls',
  },
  settings: {
    title: 'System Settings',
    category: 'System',
    description: 'Security PIN configuration, paper pricing rates, and password management',
  },
  system_status: {
    title: 'System Status & Infrastructure',
    category: 'System',
    description: 'Operational health of database, storage, email dispatcher, and M-Pesa gateway',
  },
};

export const AdminTopHeader: React.FC<AdminTopHeaderProps> = ({
  activeSection,
  onOpenMobileSidebar,
  onToggleSidebar,
  onRefreshAll,
  isRefreshing,
  onClosePortal,
  pendingActivationsCount,
}) => {
  const handleOpenMenu = onToggleSidebar || onOpenMobileSidebar;
  const meta = SECTION_METADATA[activeSection] || {
    title: 'Admin Portal',
    category: 'Operations',
    description: 'Godrery Publishers Administrative Interface',
  };

  return (
    <header
      id="admin-top-header"
      className="bg-slate-950/90 backdrop-blur-sm border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4"
    >
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={handleOpenMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
          title="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span>{meta.category}</span>
            <span>/</span>
            <span className="text-[#00D26A] font-semibold">{meta.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: Status, Refresh, Exit */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Live</span>
        </div>

        {/* Sync / Refresh Button */}
        <button
          type="button"
          id="admin-refresh-all-btn"
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors disabled:opacity-60"
          title="Refresh real-time data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00D26A]' : ''}`} />
          <span className="hidden md:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Exit Portal Button */}
        <button
          type="button"
          id="admin-exit-portal-btn"
          onClick={onClosePortal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition-colors"
          title="Return to Public Storefront"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Exit Portal</span>
        </button>
      </div>
    </header>
  );
};
