import React, { useState } from 'react';
import {
  Mail,
  GraduationCap,
  Download,
  Sprout,
  Menu,
  X,
  Home,
  Search,
  HelpCircle,
  Info,
  Users,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type NavTab = 'home' | 'search' | 'how-it-works' | 'about' | 'contact' | 'affiliate';

interface HeaderProps {
  activeTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  onContactClick?: () => void;
  onDownloadClick?: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
  { id: 'about', label: 'About', icon: Info },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'affiliate', label: 'Affiliate', icon: Users },
];

/**
 * DESKTOP NAVIGATION
 * Rendered strictly on md (tablet/desktop) screens and above.
 * Free of mobile menus, hamburgers, or slide drawers.
 */
const DesktopNavigation: React.FC<{
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="hidden md:flex w-full items-center justify-center pt-2 pb-1 border-b border-white/10">
      <div className="flex items-center gap-8 lg:gap-12">
        {NAV_ITEMS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="relative py-2.5 text-sm lg:text-base font-semibold transition-colors cursor-pointer whitespace-nowrap focus:outline-none"
            >
              <span
                className={`transition-colors duration-150 ${
                  isActive ? 'text-white font-bold' : 'text-[#a1cbb2] hover:text-white'
                }`}
              >
                {tab.label}
              </span>

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <motion.div
                  layoutId="desktopActiveTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00D26A] rounded-full shadow-[0_0_8px_#00D26A]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * MOBILE NAVIGATION
 * Rendered strictly on mobile screens (below md).
 * Provides a dedicated mobile menu drawer so all 6 tabs are fully visible and easy to tap.
 */
const MobileNavigation: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onContactClick?: () => void;
  onDownloadClick?: () => void;
}> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onContactClick,
  onDownloadClick,
}) => {
  return (
    <div className="md:hidden w-full">
      {/* Current Active Tab Status Strip (Mobile only, when drawer is closed) */}
      {!isOpen && (
        <div className="w-full flex items-center justify-between py-1.5 px-1 border-b border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-[11px] text-[#8BB99E] uppercase tracking-wider font-bold">Page:</span>
            <span className="text-white font-extrabold flex items-center gap-1">
              {NAV_ITEMS.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          <button
            onClick={() => onSelectTab(activeTab)}
            className="text-[11px] text-[#00D26A] hover:underline font-bold flex items-center gap-0.5"
          >
            <span>Switch Tab</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Full Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-hidden bg-[#031d12]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-2xl space-y-3 mt-1"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8BB99E] uppercase tracking-wider px-1">
              <span>All Navigation Tabs</span>
              <span className="text-[#00D26A]">6 Tabs</span>
            </div>

            {/* Grid of all 6 tabs in mobile view */}
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      onClose();
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-left font-bold text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#00D26A] text-slate-950 shadow-md shadow-[#00D26A]/20'
                        : 'bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-slate-950' : 'text-[#00D26A]'
                      }`}
                    />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions at bottom of mobile menu */}
            <div className="pt-2.5 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={() => {
                  onSelectTab('contact');
                  onContactClick?.();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#00D26A]/40 bg-[#00D26A]/10 text-emerald-300 hover:bg-[#00D26A]/20 text-xs font-bold transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#00D26A]" />
                <span>Contact Us</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('search');
                  onDownloadClick?.();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Search Papers</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'home',
  onSelectTab,
  onContactClick,
  onDownloadClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: NavTab) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  return (
    <header className="w-full pt-4 sm:pt-6 pb-2 px-3 sm:px-8 max-w-7xl mx-auto flex flex-col gap-3 sm:gap-4 z-20 relative">
      {/* Top Header Row: Logo & Device-Specific Actions */}
      <div className="w-full flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleTabClick('home')}
          className="flex items-center space-x-2.5 sm:space-x-3.5 group cursor-pointer"
        >
          {/* Custom Logo Icon Box: Pure Black Graduation Cap on White Background */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-md shadow-black/30 group-hover:ring-2 group-hover:ring-[#00D26A] transition-all shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-black stroke-[2.2]" />
          </div>

          {/* Brand Text */}
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[11px] font-bold tracking-wider text-[#00D26A] mb-0.5">
              GodreryTone Publishers
            </span>
            <div className="flex items-center text-xl sm:text-3xl font-extrabold tracking-tight leading-none">
              <span className="text-white">Exam</span>
              <span className="text-[#00D26A]">Papers</span>
            </div>
            <span className="text-[10px] sm:text-xs text-[#8BB99E] font-medium tracking-wide mt-0.5 sm:mt-1 hidden xs:inline-block">
              Past Papers • Revision • Better Results
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop-Only Brand Attribution Badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#a1cbb2] font-medium pr-2">
            <Sprout className="w-4 h-4 text-[#00D26A]" />
            <span>
              Powered by <strong className="text-white font-semibold">Godrerytone Ltd</strong>
            </span>
          </div>

          {/* Download Button (Available across all devices) */}
          <button
            onClick={() => {
              handleTabClick('search');
              onDownloadClick?.();
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-[#00D26A]/20 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 stroke-[2.5]" />
            <span>Download</span>
          </button>

          {/* Desktop-Only: Contact Us Button */}
          <button
            onClick={() => {
              handleTabClick('contact');
              onContactClick?.();
            }}
            className="hidden md:flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#00D26A] text-white hover:bg-[#00D26A]/10 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 shadow-sm cursor-pointer shrink-0"
          >
            <Mail className="w-4 h-4 text-[#00D26A]" />
            <span>Contact Us</span>
          </button>

          {/* Mobile-Only: Navigation Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 hover:border-[#00D26A]/50 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <>
                <X className="w-4 h-4 text-[#00D26A]" />
                <span className="text-xs font-bold text-[#00D26A]">Close</span>
              </>
            ) : (
              <>
                <Menu className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">Menu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. DESKTOP NAVIGATION CODE: Strictly rendered on desktop screens */}
      <DesktopNavigation activeTab={activeTab} onSelectTab={handleTabClick} />

      {/* 2. MOBILE NAVIGATION CODE: Strictly rendered on mobile screens */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleTabClick}
        onContactClick={onContactClick}
        onDownloadClick={onDownloadClick}
      />
    </header>
  );
};

