import React, { useState } from 'react';
import { Mail, Phone, ChevronDown, Copy, Check, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BookIllustration } from './BookIllustration';

interface ContactInfoProps {
  onSelectSupportChannel?: (type: string) => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ onSelectSupportChannel }) => {
  const [showPhone, setShowPhone] = useState(false);
  const [copied, setCopied] = useState(false);

  const phoneNumber = '+2541153823332';

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-8 pr-0 lg:pr-6">
      {/* Upper Headline & Paragraph */}
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Get in <br />
          <span className="text-[#00D26A]">Touch With Us</span>
        </h1>

        <p className="text-[#a1cbb2] text-sm sm:text-base leading-relaxed max-w-lg pt-1">
          Have a question, suggestion, or need help with our exam paper services? We&apos;re here to assist you.
          Reach out to us and we&apos;ll get back to you as soon as possible.
        </p>
      </div>

      {/* Contact Methods List */}
      <div className="space-y-5 pt-2">
        {/* Email Us */}
        <div 
          onClick={() => onSelectSupportChannel?.('email')}
          className="flex items-start space-x-4 group cursor-pointer p-2 rounded-xl transition-all hover:bg-white/5"
        >
          <div className="w-12 h-12 rounded-full bg-[#00D26A] flex items-center justify-center shrink-0 text-white shadow-md shadow-[#00D26A]/20 group-hover:scale-105 transition-transform">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base group-hover:text-[#00D26A] transition-colors">
              Email Us
            </h3>
            <p className="text-[#8BB99E] text-xs sm:text-sm mt-0.5">
              Send us an email and we&apos;ll respond within 24 hours.
            </p>
          </div>
        </div>

        {/* Call Us (With Dropdown Transition displaying +2541153823332) */}
        <div className="rounded-xl transition-all hover:bg-white/5 p-2 overflow-hidden border border-transparent hover:border-white/10">
          <div 
            onClick={() => {
              setShowPhone((prev) => !prev);
              onSelectSupportChannel?.('phone');
            }}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-[#00D26A] flex items-center justify-center shrink-0 text-white shadow-md shadow-[#00D26A]/20 group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5 text-white" />
              </div>
                <div>
                  <h3 className="text-white font-bold text-base group-hover:text-[#00D26A] transition-colors">
                    Call Us
                  </h3>
                  <p className="text-[#8BB99E] text-xs sm:text-sm mt-0.5">
                    Speak to our support team for quick assistance.
                  </p>
                </div>
            </div>
            <motion.div
              animate={{ rotate: showPhone ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-[#8BB99E] group-hover:text-white p-1"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Smooth Dropdown Phone Number Panel */}
          <AnimatePresence>
            {showPhone && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-[#031d12] border border-[#00D26A]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#00D26A]/20 flex items-center justify-center text-[#00D26A] shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8BB99E] block uppercase tracking-wider font-semibold">
                        Customer Helpline
                      </span>
                      <a
                        href={`tel:${phoneNumber}`}
                        className="text-lg sm:text-xl font-extrabold text-white tracking-wider hover:text-[#00D26A] transition-colors"
                      >
                        {phoneNumber}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                    <a
                      href={`tel:${phoneNumber}`}
                      className="px-4 py-2 bg-[#00D26A] hover:bg-[#00b85c] text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>

                    <button
                      onClick={handleCopyPhone}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#00D26A]" />
                          <span className="text-[#00D26A]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#8BB99E]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Graphic Illustration & Script Text Area */}
      <div className="pt-4 sm:pt-6 space-y-4">
        {/* Handwritten fancy motto text (Crisp, High-Contrast, No Blur, Separated from Books) */}
        <div className="select-none py-1">
          <p className="font-script text-4xl sm:text-5xl lg:text-6xl text-[#00D26A] font-bold leading-tight transform -rotate-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wide">
            Your Success <br />
            <span className="pl-6 sm:pl-10 text-white font-extrabold text-3xl sm:text-4xl lg:text-5xl underline decoration-[#00D26A] decoration-4 underline-offset-8">
              Our Priority
            </span>
          </p>
        </div>

        {/* Book & Exam Paper Illustration */}
        <div className="w-full pt-2">
          <BookIllustration />
        </div>
      </div>
    </div>
  );
};
