import React from 'react';
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  CreditCard,
  BookOpen,
  Users2,
  Users,
  ShieldAlert,
  Smartphone,
  UserCog,
  UserPlus,
  Sliders,
  Activity,
  LogOut,
  Building2,
  X,
} from 'lucide-react';
import { AdminSection } from './adminTypes';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  pendingActivationsCount: number;
  pendingDeviceRequestsCount: number;
  adminAccountId?: string;
  adminRole: string;
  onLogout: () => void;
  onCloseMobile?: () => void;
  isMobileOpen?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSelectSection,
  pendingActivationsCount,
  pendingDeviceRequestsCount,
  adminAccountId = 'Superadmin',
  adminRole,
  onLogout,
  onCloseMobile,
  isMobileOpen = false,
  isOpen,
  onClose,
}) => {
  const effectiveMobileOpen = isOpen !== undefined ? isOpen : isMobileOpen;
  const handleClose = onClose || onCloseMobile;
  const formatRole = (role: string) => {
    if (!role) return 'Administrator';
    return role
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const navItemClass = (section: AdminSection) => {
    const isActive = activeSection === section;
    return `group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
      isActive
        ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;
  };

  const renderNavButton = (
    section: AdminSection,
    label: string,
    IconComponent: React.ComponentType<{ className?: string }>,
    badgeCount?: number
  ) => {
    const isActive = activeSection === section;
    return (
      <button
        type="button"
        id={`admin-nav-${section}`}
        onClick={() => {
          onSelectSection(section);
          if (onCloseMobile) onCloseMobile();
        }}
        className={navItemClass(section)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <IconComponent
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-[#00D26A]' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          <span className="truncate">{label}</span>
        </div>
        {typeof badgeCount === 'number' && badgeCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            {badgeCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {effectiveMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        id="admin-persistent-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          effectiveMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-[#00D26A]/30 flex items-center justify-center text-[#00D26A]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-serif tracking-wider font-extrabold text-white text-xs leading-none">
                GODRERY
              </div>
              <div className="font-serif tracking-widest text-slate-300 text-[10px] uppercase font-bold leading-none mt-0.5">
                PUBLISHERS
              </div>
              <div className="text-[9px] text-slate-500 font-medium tracking-wide mt-1">
                Admin Operations
              </div>
            </div>
          </div>
          {handleClose && (
            <button
              type="button"
              onClick={handleClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Scrollable Area */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Main Dashboard */}
          <div className="space-y-1">
            {renderNavButton('dashboard', 'Dashboard', LayoutDashboard)}
          </div>

          {/* Category: Sales */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Sales
            </div>
            {renderNavButton('activate_code', 'Activate Code', KeyRound, pendingActivationsCount)}
            {renderNavButton('orders', 'Orders', FileText)}
            {renderNavButton('payments', 'Payments', CreditCard)}
          </div>

          {/* Category: Content */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Content
            </div>
            {renderNavButton('papers', 'Papers', BookOpen)}
            {renderNavButton('paper_sellers', 'Paper Sellers', Users2)}
          </div>

          {/* Category: Customers */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Customers
            </div>
            {renderNavButton('customers', 'Customers', Users)}
          </div>

          {/* Category: Document Access */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Document Access
            </div>
            {renderNavButton('document_access', 'Document Access', ShieldAlert)}
            {renderNavButton('device_requests', 'Device Requests', Smartphone, pendingDeviceRequestsCount)}
          </div>

          {/* Category: Administration */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Administration
            </div>
            {renderNavButton('admin_users', 'Admin Users', UserCog)}
            {renderNavButton('add_admin', 'Add Admin', UserPlus)}
          </div>

          {/* Category: System */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              System
            </div>
            {renderNavButton('settings', 'Settings', Sliders)}
            {renderNavButton('system_status', 'System Status', Activity)}
          </div>
        </nav>

        {/* Footer: Current User & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {adminAccountId || 'admin'}
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                  {formatRole(adminRole)}
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20 shrink-0 ml-2" />
            </div>

            <button
              type="button"
              id="admin-logout-btn"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
