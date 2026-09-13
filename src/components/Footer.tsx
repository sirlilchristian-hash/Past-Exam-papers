import React, { useState } from 'react';
import { LegalSlideModal } from './LegalSlideModal';

interface FooterProps {
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  onOpenAdmin?: () => void;
  onOpenAffiliate?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onOpenAdmin,
  onOpenAffiliate,
}) => {
  const [internalModal, setInternalModal] = useState<{
    isOpen: boolean;
    tab: 'terms' | 'privacy';
  }>({
    isOpen: false,
    tab: 'terms',
  });

  const [dotClicks, setDotClicks] = useState<number>(0);

  const handleDotClick = () => {
    const nextCount = dotClicks + 1;
    if (nextCount >= 3) {
      setDotClicks(0);
      if (onOpenAdmin) onOpenAdmin();
    } else {
      setDotClicks(nextCount);
      // Reset count after 2 seconds if not completed
      setTimeout(() => {
        setDotClicks(0);
      }, 2000);
    }
  };

  const handleOpen = (tab: 'terms' | 'privacy') => {
    if (onOpenLegal) {
      onOpenLegal(tab);
    } else {
      setInternalModal({ isOpen: true, tab });
    }
  };

  return (
    <footer className="w-full py-8 px-4 max-w-7xl mx-auto relative z-10 flex flex-col items-center gap-3">
      {/* Divider line and Powered By */}
      <div className="flex items-center justify-center gap-4 w-full">
        <div className="h-[1px] flex-1 max-w-xs bg-gradient-to-r from-transparent via-[#15803d]/40 to-transparent" />
        <p className="text-xs sm:text-sm text-[#8BB99E] font-medium tracking-wide">
          Powered by <span className="text-[#00D26A] font-bold">GodreryTone Publishers</span>
        </p>
        <div className="h-[1px] flex-1 max-w-xs bg-gradient-to-r from-transparent via-[#15803d]/40 to-transparent" />
      </div>

      {/* Links Row: Affiliate Program, Terms & Conditions and Privacy Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#8BB99E]">
        <button
          onClick={onOpenAffiliate}
          className="inline-flex items-center gap-1.5 text-[#00D26A] hover:text-[#00b85c] hover:underline font-bold transition-colors cursor-pointer focus:outline-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D26A] animate-ping" />
          <span>Affiliate Program</span>
        </button>

        <span className="text-white/20 select-none">•</span>

        <button
          onClick={() => handleOpen('terms')}
          className="hover:underline hover:text-[#00D26A] transition-colors cursor-pointer focus:outline-none"
        >
          Terms and Conditions
        </button>

        <span
          onClick={handleDotClick}
          className="text-white/30 cursor-default select-none focus:outline-none"
          title=""
        >
          •
        </span>

        <button
          onClick={() => handleOpen('privacy')}
          className="hover:underline hover:text-[#00D26A] transition-colors cursor-pointer focus:outline-none"
        >
          Privacy Policy
        </button>
      </div>

      {/* Legal Slide Modal fallback if not handled by parent */}
      {!onOpenLegal && (
        <LegalSlideModal
          isOpen={internalModal.isOpen}
          initialTab={internalModal.tab}
          onClose={() => setInternalModal((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </footer>
  );
};
