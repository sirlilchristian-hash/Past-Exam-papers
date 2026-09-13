import { useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header, NavTab } from './components/Header';
import { ContactInfo } from './components/ContactInfo';
import { ContactForm } from './components/ContactForm';
import { Footer } from './components/Footer';
import { LegalSlideModal } from './components/LegalSlideModal';
import { HomeHeroPhoto } from './components/HomeHeroPhoto';
import { HowItWorksPage } from './components/HowItWorksPage';
import { AboutPage } from './components/AboutPage';
import { AffiliatePage } from './components/AffiliatePage';
import { SearchPaperWorkflow } from './components/SearchPaperWorkflow';
import { AdminPortal } from './components/AdminPortal';
import { Paper } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchPapersFromSupabase } from './lib/supabase';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [unitQuery, setUnitQuery] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoadingPapers, setIsLoadingPapers] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPapers = useCallback(async () => {
    try {
      setIsLoadingPapers(true);
      setError(null);

      // 1. Attempt fetching from Supabase client if available
      try {
        const { papers: sbPapers, error: sbError } = await fetchPapersFromSupabase();
        if (!sbError && Array.isArray(sbPapers)) {
          setPapers(sbPapers);
          return;
        }
        if (sbError) {
          console.info('Supabase query note, falling back to server repository:', sbError);
        }
      } catch (sbErr) {
        console.info('Supabase connect note, using server API:', sbErr);
      }

      // 2. Fetch from backend API endpoint (persistent & reliable)
      const res = await fetch('/api/papers');
      if (!res.ok) {
        throw new Error(`Failed to fetch papers from repository (${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setPapers(data);
      } else {
        throw new Error('Invalid papers data format received');
      }
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to load papers';
      setError(errorMessage);
      console.error('Error loading papers:', err);
    } finally {
      setIsLoadingPapers(false);
    }
  }, []);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    tab: 'terms' | 'privacy';
  }>({
    isOpen: false,
    tab: 'terms',
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectTab = (tab: NavTab, query?: string) => {
    if (query !== undefined) {
      setUnitQuery(query);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'search' || tab === 'contact') {
      setTimeout(() => {
        scrollToForm();
      }, 150);
    }
  };

  const handleOpenLegal = (tab: 'terms' | 'privacy') => {
    setLegalModal({ isOpen: true, tab });
  };

  const pageVariants = {
    initial: { opacity: 0, y: 16, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.99 },
  };

  const pageTransition = {
    type: 'spring' as const,
    stiffness: 260,
    damping: 25,
    duration: 0.25,
  };

  return (
    <div className="min-h-screen bg-[#052b1b] text-white flex flex-col justify-between selection:bg-[#00D26A] selection:text-slate-900 relative overflow-x-hidden">
      {/* Background Subtle Gradient & Glow Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Top Radial Glow */}
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-[#00D26A]/10 rounded-full blur-[140px]" />
        {/* Bottom Left Curve Gradient Glow */}
        <div className="absolute bottom-0 -left-20 w-[500px] h-[400px] bg-[#00E676]/15 rounded-full blur-[120px]" />
        {/* Bottom Wave Decorative Lines */}
        <svg
          className="absolute bottom-0 left-0 w-full opacity-25 text-[#00D26A]"
          viewBox="0 0 1440 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,128L80,149.3C160,171,320,213,480,208C640,203,800,149,960,138.7C1120,128,1280,160,1360,176L1440,192L1440,280L1360,280C1280,280,1120,280,960,280C800,280,640,280,480,280C320,280,160,280,80,280L0,280Z"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </svg>
      </div>

      {/* Header Bar with Navigation Tabs */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onContactClick={() => handleSelectTab('contact')}
        onDownloadClick={() => handleSelectTab('search')}
      />

      {/* Main Content Body with Smooth Motion Route Transitions */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 my-auto z-10 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'how-it-works' ? (
            <motion.div
              key="how-it-works"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full"
            >
              <HowItWorksPage onSearchClick={() => handleSelectTab('search')} />
            </motion.div>
          ) : activeTab === 'about' ? (
            <motion.div
              key="about"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full"
            >
              <AboutPage
                onSearchClick={() => handleSelectTab('search')}
                onContactClick={() => handleSelectTab('contact')}
              />
            </motion.div>
          ) : activeTab === 'affiliate' ? (
            <motion.div
              key="affiliate"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full"
            >
              <AffiliatePage
                onSearchClick={(query) => handleSelectTab('search', query)}
                onContactClick={() => handleSelectTab('contact')}
              />
            </motion.div>
          ) : activeTab === 'contact' ? (
            <motion.div
              key="contact"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center py-4"
            >
              {/* Left Side: Copy, Contact Badges, Graphic & Script Text */}
              <div className="lg:col-span-6">
                <ContactInfo onSelectSupportChannel={() => handleSelectTab('contact')} />
              </div>

              {/* Right Side: Contact Form Card */}
              <div ref={formRef} className="lg:col-span-6 w-full">
                <ContactForm onOpenLegal={handleOpenLegal} />
              </div>
            </motion.div>
          ) : activeTab === 'search' ? (
            <motion.div
              key="search"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="max-w-xl mx-auto w-full py-4 space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Search <span className="text-[#00D26A]">Examination Papers</span>
                </h1>
                <p className="text-sm text-[#a1cbb2]">
                  Find your course unit paper, verify availability, and download instantly via M-Pesa.
                </p>
              </div>
              <div ref={formRef} className="w-full">
                <SearchPaperWorkflow
                  initialUnitQuery={unitQuery}
                  onBackToHome={() => handleSelectTab('home')}
                  papers={papers}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="space-y-8 sm:space-y-12"
            >
              {/* Featured Home Photo Banner */}
              <HomeHeroPhoto
                onSearchClick={(query) => handleSelectTab('search', query)}
                onHowItWorksClick={() => handleSelectTab('how-it-works')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <Footer
        onOpenLegal={handleOpenLegal}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAffiliate={() => handleSelectTab('affiliate')}
      />

      {/* Full-Screen Slide Modal for Terms & Conditions and Privacy Policy */}
      <LegalSlideModal
        isOpen={legalModal.isOpen}
        initialTab={legalModal.tab}
        onClose={() => setLegalModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Secret Admin Portal triggered via dot in Footer */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        papers={papers}
        setPapers={setPapers}
        isLoadingPapers={isLoadingPapers}
        papersError={error}
        onRefreshPapers={loadPapers}
      />
    </div>
  );
}
