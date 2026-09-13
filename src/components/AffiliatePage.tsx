import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Mail,
  MessageSquare,
  ShieldCheck,
  Send,
  Linkedin,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Briefcase,
  Globe,
  Database,
  Cpu,
  TrendingUp,
  Users,
  Info,
  ExternalLink,
  UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import affiliateBg from '../assets/images/affiliate_hero_bg_1789202174941.jpg';

interface AffiliatePageProps {
  onSearchClick?: (unitName?: string) => void;
  onContactClick?: () => void;
}

const sampleMkuUnits = [
  'BED1101 & BBM115 Microeconomics',
  'BMA1102 Calculus I',
  'BCH1105 & BCH1108 Organic Chemistry',
  'BIT3101 Software Engineering',
  'BPH1101 Human Anatomy',
  'BBA1101 Business Management',
  'BPH1102 Medical Physiology',
  'BCS1101 Intro to Computers',
  'BLW1101 Legal Methods',
  'BTH1101 Introduction to Theology',
  'BPS1101 Public Speaking'
];

export const AffiliatePage: React.FC<AffiliatePageProps> = ({ onSearchClick, onContactClick }) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [university, setUniversity] = useState('Mount Kenya University (MKU)');
  const [customUniversity, setCustomUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [paperCount, setPaperCount] = useState('1 - 5 Papers');
  const [academicYears, setAcademicYears] = useState('2023 - 2024');
  const [unitsDescription, setUnitsDescription] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    fullName: string;
    phone: string;
    email: string;
    university: string;
    course: string;
    linkedInUrl?: string;
    unitsDescription: string;
    paperCount: string;
    referenceCode: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  

  const universitiesList = [
    'Mount Kenya University (MKU)',
    'University of Nairobi (UoN)',
    'Kenyatta University (KU)',
    'Jomo Kenyatta University (JKUAT)',
    'Moi University',
    'Egerton University',
    'Maseno University',
    'Technical University of Kenya (TUK)',
    'Zetech University',
    'Chuka University',
    'Strathmore University',
    'Daystar University',
    'Other Institution',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !phone.trim() || !email.trim() || !unitsDescription.trim()) {
      setErrorMessage('Please fill in your name, phone number, email address, and a brief description of the units.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('Please confirm that you understand actual document files will only be requested after workmanship eligibility is verified.');
      return;
    }

    setIsSubmitting(true);
    const resolvedUniversity = university === 'Other Institution' && customUniversity.trim()
      ? customUniversity.trim()
      : university;

    const refCode = `APP-${fullName.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`;

    try {
      await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          linkedInUrl: linkedInUrl.trim(),
          university: resolvedUniversity,
          campusCourse: course.trim() || 'General Coursework',
          unitsDescription: unitsDescription.trim(),
          paperCount,
          academicYears,
          referralCode: refCode,
        }),
      });
    } catch (err) {
      console.warn('Submission recorded:', err);
    }

    setIsSubmitting(false);
    setSubmittedData({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      university: resolvedUniversity,
      course: course.trim() || 'General Coursework',
      linkedInUrl: linkedInUrl.trim(),
      unitsDescription: unitsDescription.trim(),
      paperCount,
      referenceCode: refCode,
    });
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setUnitsDescription('');
    setLinkedInUrl('');
    setAgreedToTerms(false);
  };

  return (
    <div className="w-full animate-fadeIn text-slate-100 pb-12">
      
      {/* 1. HERO FANCY SECTION Matching Image */}
      <section className="relative w-full min-h-[85vh] bg-[#020a06] overflow-hidden flex flex-col justify-between rounded-b-[2.5rem] shadow-2xl border-b border-[#00E588]/20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
           <img src={affiliateBg} alt="Student working on digital platform" className="w-full h-full object-cover opacity-[0.85] mix-blend-screen" />
           {/* Gradients for text readability */}
           <div className="absolute inset-0 bg-gradient-to-r from-[#010906] via-[#010906]/90 to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#010906] via-[#010906]/40 to-transparent" />

           {/* Animated Floating Math & Tech Orbits */}
           <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
             {/* Tech Rings */}
             <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
               className="absolute top-[5%] -right-[10%] md:top-[10%] md:right-[5%] w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] border-[1.5px] border-[#00E588]/15 rounded-full"
             >
                {/* PDF 1 */}
                <motion.div 
                  onClick={() => onSearchClick?.('MATH101')}
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-600 border border-rose-400 text-white font-black text-[10px] sm:text-xs px-2.5 py-1.5 rounded flex items-center gap-1 shadow-[0_0_20px_rgba(225,29,72,0.5)] backdrop-blur-sm cursor-pointer hover:bg-rose-500 hover:scale-110 transition-transform pointer-events-auto"
                >
                  <FileText className="w-3 h-3"/> MATH101 PDF
                </motion.div>
                {/* PDF 2 */}
                <motion.div 
                  onClick={() => onSearchClick?.('COMP102')}
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-1/4 -left-4 -translate-y-1/2 bg-rose-600 border border-rose-400 text-white font-black text-[10px] sm:text-xs px-2.5 py-1.5 rounded flex items-center gap-1 shadow-[0_0_20px_rgba(225,29,72,0.5)] backdrop-blur-sm cursor-pointer hover:bg-rose-500 hover:scale-110 transition-transform pointer-events-auto"
                >
                  <FileText className="w-3 h-3"/> COMP102 PDF
                </motion.div>
             </motion.div>
             
             {/* Secondary Reverse Ring */}
             <motion.div 
               animate={{ rotate: -360 }} 
               transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
               className="absolute top-[15%] -right-[20%] md:top-[20%] md:right-[-5%] w-[500px] h-[500px] sm:w-[800px] sm:h-[800px] border-[1.5px] border-cyan-500/15 rounded-full border-dashed"
             >
                {/* Holographic Virtual Exam Paper */}
                <motion.div 
                  onClick={() => onSearchClick?.('BDS3208')}
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                  className="absolute top-[20%] -left-8 sm:-left-16 -translate-y-1/2 w-[220px] sm:w-[280px] p-4 sm:p-5 bg-[#001a0e]/40 backdrop-blur-md border border-[#00E588]/40 rounded-xl shadow-[0_0_40px_rgba(0,229,136,0.2)] flex flex-col font-serif cursor-pointer hover:bg-[#001a0e]/60 hover:scale-105 transition-all pointer-events-auto"
                >
                  {/* Glowing Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00E588]/10 via-transparent to-[#00E588]/5 pointer-events-none rounded-xl" />
                  
                  {/* Header */}
                  <div className="flex items-center justify-center gap-2 mb-3 w-full relative z-10">
                     <span className="text-[#00E588] font-black text-[8px] sm:text-[10px] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,229,136,0.8)]">Mount Kenya</span>
                     <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#00E588] drop-shadow-[0_0_8px_rgba(0,229,136,0.8)]" />
                     <span className="text-[#00E588] font-black text-[8px] sm:text-[10px] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,229,136,0.8)]">University</span>
                  </div>
                  
                  <div className="text-center text-[6px] sm:text-[7px] text-emerald-100/90 font-sans tracking-[0.2em] mb-3 border-b border-[#00E588]/30 pb-2 w-full relative z-10">
                    UNIVERSITY EXAMINATION 2018/2019
                  </div>
                  
                  <div className="text-center text-[5.5px] sm:text-[6.5px] text-emerald-200/90 font-bold uppercase mb-4 leading-relaxed relative z-10">
                    Medical School<br/>
                    Department of Dental Sciences<br/>
                    <span className="text-[#00E588] mt-1 block tracking-wider drop-shadow-[0_0_3px_rgba(0,229,136,0.5)]">UNIT CODE: BDS3208 &nbsp; UNIT TITLE: ORAL PATHOLOGY I</span>
                  </div>
                  
                  {/* Questions structure */}
                  <div className="text-left w-full text-[5.5px] sm:text-[6.5px] text-emerald-100/70 space-y-2 font-sans relative z-10">
                    <div>
                      <p className="font-bold text-emerald-300 border-b border-[#00E588]/30 pb-1 mb-1">SECTION A (30 Marks) - SHORT ANSWER QUESTIONS</p>
                      <p className="leading-tight mb-0.5">1. List features of hereditary ectodermal dysplasia.</p>
                      <p className="leading-tight mb-0.5">2. Describe features of amelogenesis imperfect.</p>
                      <p className="leading-tight">3. List features of Pierre Robbins syndrome.</p>
                    </div>
                    
                    <div className="pt-1">
                      <p className="font-bold text-emerald-300 border-b border-[#00E588]/30 pb-1 mb-1">SECTION B (40 Marks) - ESSAY QUESTIONS</p>
                      <p className="leading-tight mb-0.5">1. Classify candidiasis, causes and management.</p>
                      <p className="leading-tight">2. Classify salivary gland tumours.</p>
                    </div>
                  </div>
                </motion.div>
             </motion.div>

             {/* Floating Math Equations */}
             <motion.div animate={{ y: [0, -15, 0], opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[25%] left-[40%] md:left-[55%] font-mono text-cyan-300 text-lg sm:text-2xl drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]">
               ∫ x² dx = x³/3
             </motion.div>
             
             <motion.div animate={{ y: [0, 20, 0], opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[35%] right-[10%] md:right-[15%] font-mono text-emerald-300 text-2xl sm:text-4xl drop-shadow-[0_0_12px_rgba(52,211,153,0.6)] font-bold">
               E = mc²
             </motion.div>

             <motion.div animate={{ x: [0, -20, 0], opacity: [0.1, 0.6, 0.1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[35%] right-[20%] md:right-[25%] font-mono text-blue-300 text-sm sm:text-lg drop-shadow-[0_0_8px_rgba(147,197,253,0.5)] whitespace-nowrap">
               x = (-b ± √(b² - 4ac)) / 2a
             </motion.div>
             
             <motion.div animate={{ y: [0, -25, 0], opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute top-[15%] right-[25%] md:right-[35%] font-mono text-fuchsia-300 text-sm sm:text-xl drop-shadow-[0_0_8px_rgba(240,171,252,0.5)]">
               ∇ × B = μ₀J + μ₀ε₀(∂E/∂t)
             </motion.div>
             
             <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="absolute bottom-[25%] left-[45%] md:left-[50%] font-mono text-[#00D26A] text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(0,210,106,0.5)]">
               ∑
             </motion.div>
           </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-32 pb-48 flex flex-col items-start">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-300 mb-6 flex items-center gap-2">
            Sell Your Past Papers <span className="text-[#00D26A] px-1">•</span> Reach Global Students
          </p>
          
          <h1 className="text-5xl sm:text-6xl md:text-[5rem] font-black text-white leading-[1.1] tracking-tight max-w-2xl">
            Turn Your Past Papers <br/>
            <span className="text-[#00E588] drop-shadow-[0_0_20px_rgba(0,229,136,0.25)]">into Income</span>
          </h1>
          
          <p className="mt-8 text-slate-300 text-sm sm:text-base md:text-lg max-w-md font-medium leading-relaxed">
            Partner with Godrery Publishers and reach thousands of students worldwide. Upload. We handle the rest.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto">
            <button
              onClick={() => {
                setIsRegisterOpen(true);
                document.getElementById('register-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00D26A]/20"
            >
              Become a Partner <span className="text-xl leading-none -mt-0.5">→</span>
            </button>
            <button
              onClick={() => {
                document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#01140b] hover:bg-white/10 text-white border border-[#00E588]/40 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              Learn More <span className="text-lg leading-none -mt-0.5">▷</span>
            </button>
          </div>
        </div>

        {/* Floating Features Bar */}
        <div id="features-section" className="relative z-20 max-w-5xl mx-auto w-full px-4 sm:px-6 -mt-24 mb-16 transform translate-y-1/4">
          <div className="bg-[#021109]/95 backdrop-blur-2xl border border-[#00E588]/30 rounded-3xl p-8 sm:p-12 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x divide-white/10">
              {/* Feature 1 */}
              <div className="px-6 flex flex-col items-start pt-4 md:pt-0 first:pt-0">
                <div className="w-14 h-14 rounded-full border-[1.5px] border-[#00E588]/80 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,229,136,0.15)] bg-[#00E588]/5">
                  <UploadCloud className="w-6 h-6 text-[#00E588]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Easy Upload</h3>
                <p className="text-[#a1cbb2] text-sm leading-relaxed max-w-[220px]">
                  Send us your past papers in a few clicks.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="px-6 flex flex-col items-start pt-8 md:pt-0 border-white/10 md:border-l">
                <div className="w-14 h-14 rounded-full border-[1.5px] border-[#00E588]/80 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,229,136,0.15)] bg-[#00E588]/5">
                  <ShieldCheck className="w-6 h-6 text-[#00E588]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Secure & Reliable</h3>
                <p className="text-[#a1cbb2] text-sm leading-relaxed max-w-[220px]">
                  We protect your content and handle the sales.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="px-6 flex flex-col items-start pt-8 md:pt-0 border-white/10 md:border-l">
                <div className="w-14 h-14 rounded-full border-[1.5px] border-[#00E588]/80 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,229,136,0.15)] bg-[#00E588]/5">
                  <TrendingUp className="w-6 h-6 text-[#00E588]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Get Paid</h3>
                <p className="text-[#a1cbb2] text-sm leading-relaxed max-w-[220px]">
                  Earn from every download — globally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INFINITE SCROLLING MKU PAST PAPERS MARQUEE */}
      <section className="w-full overflow-hidden bg-gradient-to-b from-[#020a06] to-[#01120a] py-8 border-y border-[#00E588]/10 relative shadow-2xl mt-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#01120a] via-transparent to-[#01120a] z-10 pointer-events-none w-full" />
        
        <div className="flex w-[200%] sm:w-[150%] md:w-max group">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 80, repeat: Infinity }}
            className="flex items-center gap-6 md:gap-8 whitespace-nowrap pr-6 md:pr-8 group-hover:[animation-play-state:paused]"
          >
            {[...sampleMkuUnits, ...sampleMkuUnits, ...sampleMkuUnits, ...sampleMkuUnits].map((unit, idx) => (
              <div key={idx} className="flex items-center gap-6 md:gap-8 shrink-0">
                <div 
                  onClick={() => onSearchClick?.(unit)}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00D26A]/10 to-transparent border border-[#00D26A]/20 shadow-[0_0_15px_rgba(0,210,106,0.05)] backdrop-blur-sm transition-all hover:border-[#00D26A] hover:bg-[#00D26A]/30 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#00D26A]/20 flex items-center justify-center text-[#00E588] shadow-inner">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-sans font-semibold text-emerald-50 text-sm tracking-wide">
                    {unit}
                  </span>
                </div>
                {/* Separator Star */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#00D26A]/40 shadow-[0_0_8px_rgba(0,210,106,0.8)]" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="space-y-12 max-w-7xl mx-auto pt-16 px-4 sm:px-6">
        {/* 4. HIDDEN REGISTRATION FORM DROPDOWN (ACCORDION) */}
        <section id="register-section" className="max-w-3xl mx-auto px-4 w-full">
          <div className="w-full bg-gradient-to-b from-[#02180e] to-[#01140b] rounded-3xl border border-[#00D26A]/30 shadow-2xl overflow-hidden">
            
            <button 
              onClick={() => setIsRegisterOpen(!isRegisterOpen)}
              className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/5 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isRegisterOpen ? 'bg-[#00D26A] text-slate-950 shadow-lg shadow-[#00D26A]/40' : 'bg-[#00D26A]/10 text-[#00D26A]'}`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Register Now
                  </h2>
                  <p className="text-xs sm:text-sm text-[#a1cbb2]">
                    Become a GodreryTone Publisher Affiliate
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                {isRegisterOpen ? (
                  <ChevronUp className="w-5 h-5 text-[#00D26A]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#00D26A]" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isRegisterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 sm:p-8 bg-white border-t border-slate-200">
                    {/* Reassurance Banner */}
                    <div className="bg-[#f0fdf4] border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <h3 className="font-extrabold text-emerald-950">
                          No Document Uploads Required Right Now
                        </h3>
                        <p className="text-emerald-800 leading-relaxed">
                          Please note that you do not need to attach or upload any papers at this stage. Documents are only requested after our team verifies your background and confirms eligibility for workmanship.
                        </p>
                      </div>
                    </div>

                    {!submittedData ? (
                      <form onSubmit={handleSubmit} className="space-y-6 text-slate-900">
                        {errorMessage && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                            {errorMessage}
                          </div>
                        )}

                        {/* Section 1: Contact Information */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                            1. Contact Details
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700">
                                Full Name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={fullName ?? ''}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Collins Angima"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700">
                                Phone Number (WhatsApp / M-Pesa) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                value={phone ?? ''}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 0115 382 332 or 07XXXXXXXX"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                              />
                              <span className="text-[11px] text-slate-500 block">
                                Used for follow-up and eventual M-Pesa payout.
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700">
                                Email Address <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={email ?? ''}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. student@gmail.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Linkedin className="w-3.5 h-3.5 text-[#0077B5]" />
                                <span>LinkedIn Profile URL</span>
                                <span className="text-[11px] font-normal text-slate-500">(Recommended)</span>
                              </label>
                              <input
                                type="url"
                                value={linkedInUrl ?? ''}
                                onChange={(e) => setLinkedInUrl(e.target.value)}
                                placeholder="https://linkedin.com/in/yourprofile"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                              />
                              <span className="text-[11px] text-slate-500 block">
                                Helps us verify your academic and professional workmanship.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Academic Institution */}
                        <div className="space-y-4 pt-2">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                            2. Academic Background
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700">
                                University / College <span className="text-rose-500">*</span>
                              </label>
                              <select
                                value={university ?? ''}
                                onChange={(e) => setUniversity(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all bg-white"
                              >
                                {universitiesList.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700">
                                Course / Program
                              </label>
                              <input
                                type="text"
                                value={course ?? ''}
                                onChange={(e) => setCourse(e.target.value)}
                                placeholder="e.g. BSc. Computer Science, BCom, Pharmacy"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                              />
                            </div>
                          </div>

                          {university === 'Other Institution' && (
                            <div className="space-y-1 animate-fadeIn">
                              <label className="block text-xs font-bold text-slate-700">
                                Specify Institution Name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={customUniversity ?? ''}
                                onChange={(e) => setCustomUniversity(e.target.value)}
                                placeholder="e.g. Kisii University, KEMU, etc."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                              />
                            </div>
                          )}
                        </div>

                        {/* Section 3: Shallow Info About Papers */}
                        <div className="space-y-4 pt-2">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                            3. Shallow Information About Your Papers
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700">
                                Approximate Number of Papers
                              </label>
                              <select
                                value={paperCount ?? ''}
                                onChange={(e) => setPaperCount(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all bg-white"
                              >
                                <option value="1 - 5 Papers">1 - 5 Papers</option>
                                <option value="6 - 15 Papers">6 - 15 Papers</option>
                                <option value="16 - 30 Papers">16 - 30 Papers</option>
                                <option value="30+ Papers">30+ Papers</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700">
                                Academic Years
                              </label>
                              <select
                                value={academicYears ?? ''}
                                onChange={(e) => setAcademicYears(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all bg-white"
                              >
                                <option value="2024">2024</option>
                                <option value="2023 - 2024">2023 – 2024</option>
                                <option value="2021 - 2024">2021 – 2024</option>
                                <option value="2020 and Older">2020 and Older</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-700">
                              Brief Summary of Units Available <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                              required
                              rows={3}
                              value={unitsDescription ?? ''}
                              onChange={(e) => setUnitsDescription(e.target.value)}
                              placeholder="Just a shallow summary of the units, e.g.:&#10;MATH101 Calculus 1, COMP102 Programming, ECON101 Microeconomics"
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all resize-none"
                            />
                            <span className="text-[11px] text-slate-500">
                              No document files needed now. Just mention the units or subjects you have on hand.
                            </span>
                          </div>
                        </div>

                        {/* Confirmation Checkbox */}
                        <div className="pt-2">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={agreedToTerms}
                              onChange={(e) => setAgreedToTerms(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#00D26A] focus:ring-[#00D26A] accent-[#00D26A]"
                            />
                            <span className="text-xs text-slate-600 leading-relaxed">
                              I understand this is a preliminary registration. ExamPapers will review my application and contact me to request actual paper files only after verifying my eligibility for workmanship.
                            </span>
                          </label>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-4 px-6 bg-[#00D26A] hover:bg-[#00b85c] disabled:bg-emerald-800 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-[#00D26A]/20 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <span>Sending Application...</span>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              <span>Send Affiliate Application</span>
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Submission Success View */
                      <div className="space-y-5 py-4 animate-fadeIn text-slate-900">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
                          <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                        </div>

                        <div className="text-center space-y-1 max-w-md mx-auto">
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Application Received!
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Thank you, <strong className="text-slate-900">{submittedData.fullName}</strong>. Your details have been delivered to our administrative desk.
                          </p>
                        </div>

                        {/* Summary Details Box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 max-w-md mx-auto text-xs sm:text-sm text-slate-700 shadow-inner">
                          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                            <span className="font-semibold text-slate-500">Reference:</span>
                            <span className="font-mono font-black bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-300">
                              {submittedData.referenceCode}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-500">Phone / WhatsApp:</span>
                            <strong className="text-slate-900 font-mono">{submittedData.phone}</strong>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-500">Institution:</span>
                            <span className="font-medium text-slate-800 text-right max-w-[60%]">{submittedData.university}</span>
                          </div>

                          {submittedData.linkedInUrl && (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-500">LinkedIn:</span>
                              <a
                                href={submittedData.linkedInUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0077B5] hover:underline font-medium inline-flex items-center gap-1"
                              >
                                <span>Profile Link</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-200">
                            <span className="font-semibold text-slate-500 block mb-1.5">Units Summary:</span>
                            <p className="text-slate-800 bg-white p-3 rounded-xl border border-slate-200 font-medium whitespace-pre-wrap leading-relaxed shadow-sm">
                              {submittedData.unitsDescription}
                            </p>
                          </div>
                        </div>

                        {/* Clarification on next steps */}
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm leading-relaxed max-w-md mx-auto space-y-1.5 shadow-sm">
                          <div className="flex items-center gap-2 font-bold text-emerald-900">
                            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                            <span>Eligibility Verification Before Submitting</span>
                          </div>
                          <p className="text-emerald-900 font-medium">
                            Our verification desk is checking your background. Once eligibility for workmanship is confirmed, our team will reach out directly to your WhatsApp or phone to request the actual documents.
                          </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto">
                          <a
                            href={`https://wa.me/254115382332?text=${encodeURIComponent(
                              `Hello ExamPapers Team, I have submitted an affiliate application (${submittedData.referenceCode}) to sell past papers for ${submittedData.university}. My name is ${submittedData.fullName}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#00D26A]/20"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>WhatsApp (0115382332)</span>
                          </a>

                          <button
                            type="button"
                            onClick={handleResetForm}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all cursor-pointer"
                          >
                            Submit Another
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Support / Inquiries Footer Bar */}
        <div className="max-w-3xl mx-auto bg-[#02180e] border border-[#00D26A]/30 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-white mx-4 lg:mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00D26A] flex items-center justify-center text-slate-950 shrink-0 font-black text-sm shadow-md shadow-[#00D26A]/20">
              WA
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">Have questions about selling papers?</h4>
              <p className="text-xs text-[#a1cbb2] mt-0.5">Reach out directly to our team anytime.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href="https://wa.me/254115382332?text=Hello%20ExamPapers%20Team,%20I%20have%20an%20inquiry%20about%20selling%20past%20papers"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#01140b] border border-[#00D26A]/40 hover:border-[#00D26A] text-xs font-semibold text-white transition-all shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#00D26A] animate-pulse" />
              <span>WhatsApp 0115382332</span>
            </a>

            <a
              href="mailto:sirlilchristian@gmail.com"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#01140b] border border-[#00D26A]/40 hover:border-[#00D26A] text-xs font-semibold text-white transition-all shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-[#00D26A]" />
              <span>sirlilchristian@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
