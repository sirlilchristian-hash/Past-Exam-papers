import React, { useState } from 'react';
import { Search, GraduationCap, ArrowRight, ChevronDown, ChevronUp, UserCheck, Smartphone, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeHeroPhotoProps {
  onSearchClick: (query?: string) => void;
  onHowItWorksClick?: () => void;
}

export const HomeHeroPhoto: React.FC<HomeHeroPhotoProps> = ({
  onSearchClick,
  onHowItWorksClick,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sampleUnits = [
    { label: 'Pharmaceuticals', code: '1279129' },
    { label: 'Microeconomics', code: 'BED1101 & BBM115' },
    { label: 'Calculus I', code: 'BMA1102' },
    { label: 'Organic Chemistry', code: 'BCH1105 & BCH1108' },
    { label: 'Software Engineering', code: 'BIT3101' },
  ];

  const handleSearchSubmit = (overrideQuery?: string) => {
    const queryToUse = overrideQuery !== undefined ? overrideQuery : searchQuery;
    onSearchClick(queryToUse.trim());
  };

  const stepsList = [
    {
      num: '1',
      icon: Search,
      title: 'Search',
      text: 'Enter the unit name or unit code to find your paper.',
    },
    {
      num: '2',
      icon: UserCheck,
      title: 'Details',
      text: 'Provide your name and M-Pesa phone number.',
    },
    {
      num: '3',
      icon: Smartphone,
      title: 'Payment',
      text: 'Confirm the automated M-Pesa STK prompt on your phone.',
    },
    {
      num: '4',
      icon: Download,
      title: 'Download',
      text: 'Access and save your password-protected PDF paper instantly.',
    },
  ];

  return (
    <div className="w-full relative rounded-3xl overflow-hidden border border-[#00D26A]/30 shadow-2xl bg-[#02180e] group mb-8 sm:mb-10">
      {/* Invisible backdrop for clicking outside/rear to vanish dropdown */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          className="fixed inset-0 z-20 cursor-default"
        />
      )}

      {/* Photo Container with instant fallback background gradient */}
      <div className="relative w-full min-h-[360px] sm:aspect-[21/9] md:aspect-[16/7] lg:aspect-[21/9] overflow-hidden bg-gradient-to-br from-[#02180e] via-[#052b1b] to-[#01120a]">
        <picture>
          <source srcSet="/home_hero_bg.webp" type="image/webp" />
          <img
            src="/home_hero_bg.jpg"
            alt="4 Steps to Academic Success - ExamPapers"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-all duration-700 ease-out"
          />
        </picture>

        {/* Subtle Dark Vignette Gradients for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#02180e] via-black/30 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#02180e]/90 via-transparent to-[#02180e]/50" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-5 sm:p-8 md:p-10 flex flex-col justify-end">
          <div className="max-w-2xl space-y-2.5 sm:space-y-3.5">
            {/* Headline */}
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Your Success is <span className="text-[#00D26A]">Our Priority</span>
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-base text-slate-200 line-clamp-2 sm:line-clamp-none max-w-xl font-medium drop-shadow">
              Search, enter details, pay via M-Pesa, and download official university course unit past papers instantly.
            </p>

            {/* Search Engine Input Bar */}
            <div className="pt-2 max-w-xl space-y-2 relative z-30">
              <div className="flex items-center bg-white/95 backdrop-blur-md rounded-full p-1.5 shadow-2xl border border-white/40 focus-within:ring-2 focus-within:ring-[#00D26A] transition-all">
                <input
                  type="text"
                  value={searchQuery ?? ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  placeholder="Search unit name or code (e.g. Calculus I, Pharmaceuticals)..."
                  className="w-full bg-transparent px-3.5 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-500 font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  title="Search Unit"
                  className="px-4 py-2 sm:py-2.5 rounded-full bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#00D26A]/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>

              {/* Sample Units Pills Down Slightly Below the Search Engine */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-200">
                <span className="font-bold text-[#8BB99E] mr-1">Sample Units:</span>
                {sampleUnits.map((unit) => (
                  <button
                    key={unit.code}
                    type="button"
                    onClick={() => {
                      setSearchQuery(unit.label);
                    }}
                    className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-[#00D26A] hover:text-slate-950 text-white border border-white/20 font-semibold transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>

            {/* How It Works Button & Actions */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3 relative z-30">
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 py-2 sm:py-2.5 rounded-full bg-black/80 hover:bg-black text-white border border-[#00D26A]/50 font-bold text-xs sm:text-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xl"
              >
                <GraduationCap className="w-4 h-4 text-[#00D26A]" />
                <span>How It Works (Steps 1-4)</span>
                {showDropdown ? (
                  <ChevronUp className="w-4 h-4 text-[#00D26A] ml-0.5" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#00D26A] ml-0.5" />
                )}
              </button>
            </div>

            {/* Faster Understanding Dropdown Menu */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-[#02180e]/95 border border-[#00D26A]/60 shadow-2xl backdrop-blur-xl max-w-xl z-30 relative"
                >
                  <div className="text-[11px] font-bold text-[#00D26A] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Quick 4-Step Summary</span>
                    <span className="text-[#8BB99E] normal-case text-[10px]">Instant Overview</span>
                  </div>

                  <div className="space-y-2">
                    {stepsList.map((step) => {
                      const IconComponent = step.icon;
                      return (
                        <div
                          key={step.num}
                          className="flex items-start gap-3 p-2 rounded-xl bg-black/50 border border-white/10 hover:border-[#00D26A]/40 transition-colors"
                        >
                          {/* Step Number */}
                          <div className="w-6 h-6 rounded-lg bg-[#00D26A] text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            {step.num}
                          </div>

                          {/* Symbol & One-Sentence Text */}
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-medium">
                            <IconComponent className="w-4 h-4 text-[#00D26A] shrink-0" />
                            <p className="leading-tight text-[#a1cbb2]">
                              <strong className="text-white font-bold mr-1">{step.title}:</strong>
                              {step.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Learn More Button linked to How It Works page */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      if (onHowItWorksClick) {
                        onHowItWorksClick();
                      }
                    }}
                    className="mt-3 w-full py-2 px-4 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#00D26A]/20 cursor-pointer"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
