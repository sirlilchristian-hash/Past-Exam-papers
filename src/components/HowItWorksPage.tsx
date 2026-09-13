import React from 'react';
import {
  Search,
  User,
  Phone,
  ShieldCheck,
  Zap,
  Headphones,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Lock,
  ArrowDown,
} from 'lucide-react';

interface HowItWorksPageProps {
  onSearchClick: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onSearchClick }) => {
  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 space-y-10 animate-fadeIn">
      {/* Header Eyebrow & Title */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-3 text-[#00D26A] font-extrabold text-xs sm:text-sm uppercase tracking-widest">
          <span className="h-[2px] w-8 bg-[#00D26A]/60" />
          <span>HOW IT WORKS</span>
          <span className="h-[2px] w-8 bg-[#00D26A]/60" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Get Your Past Papers in <span className="text-[#00D26A]">4 Simple Steps</span>
        </h1>

        <p className="text-sm sm:text-base text-[#a1cbb2] leading-relaxed max-w-2xl mx-auto">
          Fast. Secure. Easy. Follow the steps below and get your university course unit past papers in minutes.
        </p>
      </div>

      {/* 4 Steps Container Grid with Connectors */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* STEP 1 */}
          <div className="relative flex flex-col justify-between bg-[#031d12] border border-[#00D26A]/30 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-[#00D26A] transition-all duration-300 group">
            <div className="space-y-4">
              {/* Badge & Number */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#00D26A] text-slate-950 font-black text-lg flex items-center justify-center shadow-md shadow-[#00D26A]/30">
                  1
                </div>
              </div>

              {/* Step 1 Graphic Illustration */}
              <div className="relative my-4 p-4 rounded-xl bg-[#02140b] border border-white/10 flex flex-col items-center justify-center h-32 overflow-hidden">
                {/* Decorative Sparklines */}
                <div className="absolute top-2 right-4 text-[#00D26A] opacity-70 text-xs font-bold tracking-widest">
                  \ | /
                </div>

                {/* Mock Search Bar */}
                <div className="w-full max-w-[200px] flex items-center bg-white rounded-full p-1.5 shadow-md border border-slate-200">
                  <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                  <span className="text-xs text-slate-800 font-medium px-2 truncate">Calculus I</span>
                  <div className="w-6 h-6 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 shrink-0 ml-auto">
                    <Search className="w-3 h-3 text-slate-950" />
                  </div>
                </div>
              </div>

              {/* Title & Desc */}
              <h3 className="text-lg font-extrabold text-white group-hover:text-[#00D26A] transition-colors">
                Search for Your Unit
              </h3>

              <p className="text-xs sm:text-sm text-[#a1cbb2] leading-relaxed">
                Enter the unit name or unit code to find the past papers you need.
              </p>
            </div>

            {/* Bottom Tip Callout */}
            <div className="mt-4 p-2.5 rounded-xl bg-[#00D26A]/10 border border-[#00D26A]/30 flex items-start gap-2 text-[11px] text-[#8BB99E]">
              <Lightbulb className="w-4 h-4 text-[#00D26A] shrink-0 mt-0.5" />
              <span>Unit code is optional but recommended.</span>
            </div>

            {/* Connecting Arrow for Desktop */}
            <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#00D26A] text-slate-950 items-center justify-center shadow-md">
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </div>
          </div>

          {/* STEP 2 */}
          <div className="relative flex flex-col justify-between bg-[#031d12] border border-[#00D26A]/30 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-[#00D26A] transition-all duration-300 group">
            <div className="space-y-4">
              {/* Badge & Number */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#00D26A] text-slate-950 font-black text-lg flex items-center justify-center shadow-md shadow-[#00D26A]/30">
                  2
                </div>
              </div>

              {/* Step 2 Graphic Illustration */}
              <div className="relative my-4 p-3 rounded-xl bg-[#02140b] border border-white/10 flex flex-col items-center justify-center h-32 overflow-hidden">
                {/* Mock User Details Card */}
                <div className="w-full max-w-[180px] bg-white/90 rounded-xl p-2.5 space-y-1.5 shadow-md border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 mx-auto">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-100 rounded px-2 py-0.5 text-[10px] text-slate-700 font-semibold truncate text-center">
                    John
                  </div>
                  <div className="bg-slate-100 rounded px-2 py-0.5 text-[10px] text-slate-700 font-semibold truncate text-center">
                    Kamau
                  </div>
                  <div className="bg-slate-100 rounded px-2 py-0.5 text-[10px] text-slate-600 flex items-center justify-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-[#00D26A]" />
                    <span>07xx xxx xxx</span>
                  </div>
                </div>
              </div>

              {/* Title & Desc */}
              <h3 className="text-lg font-extrabold text-white group-hover:text-[#00D26A] transition-colors">
                Enter Your Details
              </h3>

              <p className="text-xs sm:text-sm text-[#a1cbb2] leading-relaxed">
                Provide your full name, email address, and active phone number to personalize your download access.
              </p>
            </div>

            {/* Connecting Arrow for Desktop */}
            <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#00D26A] text-slate-950 items-center justify-center shadow-md">
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </div>
          </div>

          {/* STEP 3 */}
          <div className="relative flex flex-col justify-between bg-[#031d12] border border-[#00D26A]/30 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-[#00D26A] transition-all duration-300 group">
            <div className="space-y-4">
              {/* Badge & Number */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#00D26A] text-slate-950 font-black text-lg flex items-center justify-center shadow-md shadow-[#00D26A]/30">
                  3
                </div>
              </div>

              {/* Step 3 Graphic Illustration */}
              <div className="relative my-4 p-3 rounded-xl bg-[#02140b] border border-white/10 flex items-center justify-center h-32 overflow-hidden gap-2">
                <span className="text-[#00D26A] font-bold text-xs">((</span>
                {/* Smartphone Mockup */}
                <div className="w-20 h-24 bg-slate-950 rounded-xl border-2 border-[#00D26A]/80 p-1 flex flex-col items-center justify-between shadow-lg">
                  <div className="w-6 h-1 rounded-full bg-[#00D26A]/40" />
                  <div className="w-full bg-[#00D26A] text-slate-950 font-black text-[9px] py-0.5 text-center rounded">
                    M-PESA
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#00D26A] text-slate-950 flex items-center justify-center my-1">
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  </div>
                  <div className="w-4 h-1 rounded-full bg-slate-800" />
                </div>
                <span className="text-[#00D26A] font-bold text-xs">))</span>
              </div>

              {/* Title & Desc */}
              <h3 className="text-lg font-extrabold text-white group-hover:text-[#00D26A] transition-colors">
                Pay with M-Pesa
              </h3>

              <p className="text-xs sm:text-sm text-[#a1cbb2] leading-relaxed">
                Click Pay with M-Pesa and complete the payment using the STK prompt sent to your phone.
              </p>
            </div>

            {/* Connecting Arrow for Desktop */}
            <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#00D26A] text-slate-950 items-center justify-center shadow-md">
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </div>
          </div>

          {/* STEP 4 */}
          <div className="relative flex flex-col justify-between bg-[#031d12] border border-[#00D26A]/30 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-[#00D26A] transition-all duration-300 group">
            <div className="space-y-4">
              {/* Badge & Number */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#00D26A] text-slate-950 font-black text-lg flex items-center justify-center shadow-md shadow-[#00D26A]/30">
                  4
                </div>
              </div>

              {/* Step 4 Graphic Illustration */}
              <div className="relative my-4 p-3 rounded-xl bg-[#02140b] border border-white/10 flex items-center justify-center h-32 overflow-hidden">
                {/* Document Mockup */}
                <div className="relative w-20 h-24 bg-white rounded-lg p-2 border border-slate-300 shadow-md flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-slate-200 rounded" />
                    <div className="w-3/4 h-1 bg-slate-200 rounded" />
                  </div>

                  <div className="bg-red-500 text-white font-black text-[9px] px-1 py-0.5 rounded text-center">
                    PDF
                  </div>

                  {/* Green Download Circle */}
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#00D26A] text-slate-950 flex items-center justify-center shadow-lg border-2 border-[#031d12]">
                    <ArrowDown className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Title & Desc */}
              <h3 className="text-lg font-extrabold text-white group-hover:text-[#00D26A] transition-colors">
                Download Your Paper
              </h3>

              <p className="text-xs sm:text-sm text-[#a1cbb2] leading-relaxed">
                Once your payment is confirmed, the Download PDF button will be activated. Download your protected paper and use your second name as the password.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Help & Trust Bar */}
      <div className="p-6 sm:p-8 bg-[#02140b] border border-[#00D26A]/40 rounded-2xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-2xl">
        {/* Left Side: Need Help Block */}
        <div className="lg:col-span-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00D26A] text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-[#00D26A]/20">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-bold text-white">Need Help?</h4>
            <p className="text-xs sm:text-sm text-[#8BB99E] leading-relaxed">
              If you have paid but the download is not activated, contact us with your M-Pesa transaction code and amount paid so we can verify your payment and assist you.
            </p>
          </div>
        </div>

        {/* Divider for desktop */}
        <div className="hidden lg:block lg:col-span-1 text-center">
          <div className="h-12 w-[1px] bg-white/10 mx-auto" />
        </div>

        {/* Right Side: 3 Trust Badges */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00D26A] text-slate-950 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white">Instant Access</div>
              <div className="text-[10px] text-[#8BB99E]">Get papers quickly</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00D26A] text-slate-950 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white">Secure &amp; Private</div>
              <div className="text-[10px] text-[#8BB99E]">Your details are safe</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00D26A] text-slate-950 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white">Friendly Support</div>
              <div className="text-[10px] text-[#8BB99E]">We&apos;re here to help</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center pt-2">
        <button
          onClick={onSearchClick}
          className="px-8 py-3.5 rounded-full bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-extrabold text-sm shadow-xl shadow-[#00D26A]/20 transition-all active:scale-95 cursor-pointer"
        >
          Search Past Papers Now
        </button>
      </div>
    </div>
  );
};
