import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Smartphone,
  FileText,
  Headphones,
  BookOpen,
  MessageSquare,
  Mail,
  Clock,
  Zap,
  Building2,
  Users,
  Compass,
  CheckCircle2,
  Search,
  Sparkles
} from 'lucide-react';

interface AboutPageProps {
  onSearchClick: (unitName?: string) => void;
  onContactClick: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onSearchClick,
  onContactClick,
}) => {
  const popularUnits = [
    'Calculus I',
    'Microeconomics',
    'Pharmacology',
    'Toxicology',
    'Biopharmaceutics',
  ];

  const expansionUniversities = [
    { name: 'Kenyatta University (KU)', status: 'Onboarding Underway' },
    { name: 'Zetech University', status: 'Onboarding Underway' },
    { name: 'University of Nairobi (UoN)', status: 'Onboarding Underway' },
    { name: 'Jomo Kenyatta University (JKUAT)', status: 'Onboarding Underway' },
    { name: 'Chuka University', status: 'Onboarding Underway' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Hero Section (Direct match to image.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-[#021b10]/90 border border-[#00D26A]/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00D26A]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Left Content Column */}
        <div className="lg:col-span-7 space-y-5 z-10">
          {/* Eyebrow Badge (Exact match to image.png) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D26A]/15 border border-[#00D26A]/50 text-[#00D26A] text-xs font-black tracking-wider uppercase">
            <span>ABOUT EXPAMPAPERS</span>
          </div>

          {/* Big Bold Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Your University Past Papers,{' '}
            <span className="text-[#00D26A]">Simplified.</span>
          </h1>

          {/* Sub-bar with icons (Exact match to image.png) */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#a1cbb2] font-semibold">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#00D26A]" />
              <span>University Units</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00D26A]" />
              <span>Real Past Papers</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00D26A]" />
              <span>Fast &amp; Easy</span>
            </div>
          </div>

          {/* Lead Paragraph (Exact text from image.png) */}
          <p className="text-sm sm:text-base text-[#a1cbb2] leading-relaxed max-w-xl">
            We help Kenyan university students access verified past examination papers for their course units — quickly and easily.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={() => onSearchClick()}
              className="px-6 py-3.5 rounded-full bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-[#00D26A]/30 transition-all active:scale-95 cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Find Course Papers</span>
            </button>

            <button
              onClick={onContactClick}
              className="px-5 py-3.5 rounded-full border border-[#00D26A]/60 hover:bg-[#00D26A]/10 text-white font-bold text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#00D26A]" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        {/* Right Photo Composition (Direct match to image.png) */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          {/* Green handwritten chalk note */}
          <div className="absolute -top-4 sm:-top-6 right-2 sm:right-6 z-20 text-right">
            <span className="font-serif italic text-sm sm:text-base text-[#00D26A] font-bold tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
              <span>Better Preparation Brighter Future</span>
              <Sparkles className="w-4 h-4 text-[#00D26A] animate-pulse" />
            </span>
          </div>

          {/* Image Box */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#00D26A]/40 shadow-2xl group">
            <img
              src="/affiliate_hero.jpg"
              alt="Kenyan university student studying with ExamPapers laptop"
              className="w-full h-auto max-h-[360px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02180e]/80 via-transparent to-transparent" />

            {/* Stacked Textbook Labels overlay on bottom-right of image (Matching image.png) */}
            <div className="absolute bottom-3 right-3 space-y-1 text-[11px] font-bold">
              {[
                { title: 'Calculus I', bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60' },
                { title: 'Microeconomics', bg: 'bg-slate-900/90 text-emerald-200 border-slate-700' },
                { title: 'Pharmacology', bg: 'bg-amber-950/90 text-amber-300 border-amber-800/60' },
                { title: 'Toxicology', bg: 'bg-emerald-900/90 text-emerald-200 border-emerald-700/60' },
                { title: 'Biopharmaceutics', bg: 'bg-teal-950/90 text-teal-200 border-teal-700/60' },
              ].map((book) => (
                <div
                  key={book.title}
                  className={`px-2.5 py-0.5 rounded border text-right backdrop-blur-sm shadow-md ${book.bg}`}
                >
                  {book.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5 Feature Cards Grid (Direct Match to image.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: For Students */}
        <div className="bg-[#02180e] border border-[#00D26A]/20 hover:border-[#00D26A]/50 rounded-2xl p-5 flex flex-col items-center text-center space-y-3 shadow-lg transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 shadow-md shadow-[#00D26A]/30">
            <GraduationCap className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-extrabold text-white">For Students</h3>
          <p className="text-xs text-[#a1cbb2] leading-relaxed">
            Get the papers you need for your course units.
          </p>
          <div className="w-10 h-1 bg-[#00D26A]/50 rounded-full mt-auto pt-0.5" />
        </div>

        {/* Card 2: Verified Papers */}
        <div className="bg-[#02180e] border border-[#00D26A]/20 hover:border-[#00D26A]/50 rounded-2xl p-5 flex flex-col items-center text-center space-y-3 shadow-lg transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 shadow-md shadow-[#00D26A]/30">
            <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-extrabold text-white">Verified Papers</h3>
          <p className="text-xs text-[#a1cbb2] leading-relaxed">
            Clean, accurate and trusted sources.
          </p>
          <div className="w-10 h-1 bg-[#00D26A]/50 rounded-full mt-auto pt-0.5" />
        </div>

        {/* Card 3: Instant Payment */}
        <div className="bg-[#02180e] border border-[#00D26A]/20 hover:border-[#00D26A]/50 rounded-2xl p-5 flex flex-col items-center text-center space-y-3 shadow-lg transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 shadow-md shadow-[#00D26A]/30">
            <div className="flex flex-col items-center leading-none">
              <Smartphone className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-black tracking-tighter">M-PESA</span>
            </div>
          </div>
          <h3 className="text-base font-extrabold text-white">Instant Payment</h3>
          <p className="text-xs text-[#a1cbb2] leading-relaxed">
            Pay safely with M-Pesa and get started.
          </p>
          <div className="w-10 h-1 bg-[#00D26A]/50 rounded-full mt-auto pt-0.5" />
        </div>

        {/* Card 4: Easy Access */}
        <div className="bg-[#02180e] border border-[#00D26A]/20 hover:border-[#00D26A]/50 rounded-2xl p-5 flex flex-col items-center text-center space-y-3 shadow-lg transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 shadow-md shadow-[#00D26A]/30">
            <div className="flex flex-col items-center leading-none">
              <FileText className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-black tracking-tighter">PDF ↓</span>
            </div>
          </div>
          <h3 className="text-base font-extrabold text-white">Easy Access</h3>
          <p className="text-xs text-[#a1cbb2] leading-relaxed">
            Download your paper in seconds.
          </p>
          <div className="w-10 h-1 bg-[#00D26A]/50 rounded-full mt-auto pt-0.5" />
        </div>

        {/* Card 5: Real Support */}
        <div className="bg-[#02180e] border border-[#00D26A]/20 hover:border-[#00D26A]/50 rounded-2xl p-5 flex flex-col items-center text-center space-y-3 shadow-lg transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 shadow-md shadow-[#00D26A]/30">
            <Headphones className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-extrabold text-white">Real Support</h3>
          <p className="text-xs text-[#a1cbb2] leading-relaxed">
            Need help? We're just a message away.
          </p>
          <div className="w-10 h-1 bg-[#00D26A]/50 rounded-full mt-auto pt-0.5" />
        </div>
      </div>

      {/* Popular Units Banner Card (Direct match to image.png) */}
      <div className="bg-[#02180e] border border-[#00D26A]/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#00D26A]/15 border border-[#00D26A]/40 flex items-center justify-center text-[#00D26A] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              Popular Units
            </h4>
            <p className="text-xs text-[#a1cbb2]">
              Find past papers for the units you're studying.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {popularUnits.map((unit) => (
            <button
              key={unit}
              onClick={() => onSearchClick(unit)}
              className="px-4 py-2 rounded-full bg-[#01140b] border border-[#00D26A]/40 hover:border-[#00D26A] hover:bg-[#00D26A]/10 text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {unit}
            </button>
          ))}
          <div className="flex items-center gap-1 text-xs text-[#00D26A] font-bold italic ml-1">
            <span className="hidden sm:inline">⤹</span>
            <span>and many more...</span>
          </div>
        </div>
      </div>

      {/* Mount Kenya University & Publisher Company Profile */}
      <div className="bg-[#031d12] border border-[#00D26A]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-[#00D26A]/20 border border-[#00D26A]/40 flex items-center justify-center text-[#00D26A] shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              GodreryTone Publishers Ltd
            </h2>
            <p className="text-xs sm:text-sm text-[#8BB99E] mt-1">
              A Registered Educational Publisher • Powered by 20–30 Dedicated Employees
            </p>
          </div>
        </div>

        {/* Current Availability Badge */}
        <div className="p-4 sm:p-5 bg-black/60 border border-[#00D26A]/50 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-[#00D26A] font-extrabold text-sm sm:text-base">
            <GraduationCap className="w-5 h-5" />
            <span>Currently Serving: Mount Kenya University (MKU)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Our repository is currently <strong className="text-white font-semibold">tailored for Mount Kenya University (MKU) students</strong>, offering comprehensive coverage across degree, diploma, and certificate course units.
          </p>
        </div>

        {/* Expansion Roadmap Section */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg">
            <Compass className="w-5 h-5 text-[#00D26A]" />
            <h3>Expansion Underway — Coming Soon To:</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {expansionUniversities.map((uni) => (
              <div
                key={uni.name}
                className="p-3 bg-[#02140b] border border-white/10 hover:border-[#00D26A]/40 rounded-xl flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#00D26A] shrink-0" />
                  <span>{uni.name}</span>
                </div>
                <span className="text-[10px] text-[#00D26A] font-bold bg-[#00D26A]/10 px-2 py-0.5 rounded-full shrink-0">
                  Underway
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Need Help? Bottom Bar (Direct match to image.png) */}
      <div className="bg-[#02180e] border border-[#00D26A]/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Chat Icon & Need Help? */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-11 h-11 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 shrink-0 shadow-md shadow-[#00D26A]/30">
            <MessageSquare className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white">Need Help?</h4>
            <p className="text-xs text-[#a1cbb2]">We're here to support you.</p>
          </div>
        </div>

        {/* Right Contact Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* WhatsApp */}
          <a
            href="https://wa.me/254115382332?text=Hello%20ExamPapers%20Team"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#01140b] border border-[#00D26A]/30 hover:border-[#00D26A] hover:bg-[#00D26A]/10 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-[#00D26A] text-slate-950 flex items-center justify-center text-[10px] font-black">
              WA
            </div>
            <span>WhatsApp 0115382332</span>
            <span className="text-[#00D26A]">›</span>
          </a>

          {/* Email Us */}
          <a
            href="mailto:sirlilchristian@gmail.com"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#01140b] border border-[#00D26A]/30 hover:border-[#00D26A] hover:bg-[#00D26A]/10 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4 text-[#00D26A]" />
            <span>Email Us sirlilchristian@gmail.com</span>
            <span className="text-[#00D26A]">›</span>
          </a>

          {/* Quick Response */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#01140b] border border-white/10 text-xs font-semibold text-[#8BB99E]">
            <Clock className="w-4 h-4 text-[#00D26A]" />
            <span>Quick Response Mon – Sat, 8AM – 8PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
