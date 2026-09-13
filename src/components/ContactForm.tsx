import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

interface ContactFormProps {
  initialUnitQuery?: string;
  onSuccess?: (details: { name: string; email: string; subject: string }) => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ initialUnitQuery, onSuccess, onOpenLegal }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: initialUnitQuery ? `Unit Inquiry: ${initialUnitQuery}` : '',
    message: initialUnitQuery ? `I am looking for the past paper / marking scheme for unit: ${initialUnitQuery}` : '',
    agreeToTerms: false,
  });

  React.useEffect(() => {
    if (initialUnitQuery) {
      setFormData((prev) => ({
        ...prev,
        subject: `Unit Inquiry: ${initialUnitQuery}`,
        message: `I am looking for the past paper / marking scheme for unit: ${initialUnitQuery}`,
      }));
    }
  }, [initialUnitQuery]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const subjects = [
    'University Course Unit Past Papers',
    'Degree & Diploma Examination Papers',
    'Continuous Assessment Tests (CATs)',
    'General Inquiry & Feedback',
    'Technical Support / Account Issue',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value ?? ''),
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Unit name/code is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms & Conditions and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          isRead: false
        })
      });

      if (res.ok) {
        setIsSubmitting(false);
        setSubmittedSuccess(true);
        if (onSuccess) {
          onSuccess({
            name: formData.fullName,
            email: formData.email,
            subject: formData.subject,
          });
        }
      } else {
         console.error('Failed to submit message');
         setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      agreeToTerms: false,
    });
    setErrors({});
    setSubmittedSuccess(false);
  };

  if (submittedSuccess) {
    return (
      <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-2xl text-slate-800 flex flex-col items-center justify-center min-h-[500px] text-center space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-[#00D26A]/10 text-[#00D26A] flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[#00D26A]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            Message Sent Successfully!
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            Thank you, <span className="font-semibold text-slate-900">{formData.fullName}</span>. We have received your inquiry regarding <span className="font-semibold text-slate-900">&quot;{formData.subject}&quot;</span>. Our team will get back to you at <span className="font-semibold text-[#00D26A]">{formData.email}</span> shortly.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="mt-4 px-8 py-3 bg-[#00D26A] hover:bg-[#00b85c] text-white font-bold rounded-full transition-all text-sm shadow-md shadow-[#00D26A]/20 active:scale-95"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-8 md:p-10 shadow-2xl text-slate-800 border border-slate-100">
      {/* Title Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-7 sm:h-8 bg-[#00D26A] rounded-full inline-block" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
            Contact Us
          </h2>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm mt-2 font-normal">
          Fill out the form below and we&apos;ll get back to you shortly.
        </p>
      </div>

      {/* Form Element */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Full Name & Email Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-xs font-bold text-slate-800">
              Full Name <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName ?? ''}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#00D26A] transition-all ${
                errors.fullName ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            />
            {errors.fullName && (
              <p className="text-red-500 text-[11px] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-bold text-slate-800">
              Email Address <span className="text-emerald-600">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email ?? ''}
              onChange={handleChange}
              placeholder="you@exemple.com"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#00D26A] transition-all ${
                errors.email ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-[11px] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Phone Number & Unit name/code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Phone Number */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-xs font-bold text-slate-800">
              Phone Number <span className="text-emerald-600">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone ?? ''}
              onChange={handleChange}
              placeholder="07XXXXXXXX"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#00D26A] transition-all ${
                errors.phone ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-[11px] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.phone}
              </p>
            )}
          </div>

          {/* Unit Name / Code Text Input */}
          <div className="space-y-1.5">
            <label htmlFor="subject" className="block text-xs font-bold text-slate-800">
              Unit name/code <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject ?? ''}
              onChange={handleChange}
              placeholder="e.g. EDU 101, MED 204, IT 305"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#00D26A] transition-all ${
                errors.subject ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            />
            {errors.subject && (
              <p className="text-red-500 text-[11px] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.subject}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Message Textarea */}
        <div className="space-y-1.5">
          <label htmlFor="message" className="block text-xs font-bold text-slate-800">
            Message <span className="text-emerald-600">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message ?? ''}
            onChange={handleChange}
            placeholder="Type your message here..."
            className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#00D26A] transition-all resize-none ${
              errors.message ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
            }`}
          />
          {errors.message && (
            <p className="text-red-500 text-[11px] flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> {errors.message}
            </p>
          )}
        </div>

        {/* Checkbox: Terms & Conditions */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-0.5 w-4 h-4 rounded text-[#00D26A] focus:ring-[#00D26A] border-slate-300 cursor-pointer accent-[#00D26A]"
            />
            <span className="text-xs text-slate-600 leading-tight">
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenLegal?.('terms');
                }}
                className="text-[#00D26A] font-semibold hover:underline bg-transparent border-0 p-0 inline font-inherit cursor-pointer"
              >
                Terms &amp; Conditions
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenLegal?.('privacy');
                }}
                className="text-[#00D26A] font-semibold hover:underline bg-transparent border-0 p-0 inline font-inherit cursor-pointer"
              >
                Privacy Policy
              </button>
              .
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-[11px] flex items-center gap-1 mt-1 pl-6">
              <AlertCircle className="w-3 h-3" /> {errors.agreeToTerms}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-full bg-[#00D26A] hover:bg-[#00b85c] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#00D26A]/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 text-white -rotate-12" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
