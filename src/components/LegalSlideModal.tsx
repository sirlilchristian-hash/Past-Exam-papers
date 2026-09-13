import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';

interface LegalSlideModalProps {
  isOpen: boolean;
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
}

export const LegalSlideModal: React.FC<LegalSlideModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleScrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const renderScrollToBottomButton = () => (
    <div className="flex justify-center my-2">
      <button
        type="button"
        onClick={handleScrollToBottom}
        className="inline-flex items-center gap-2 bg-black/90 border border-white/20 rounded-xl px-4 py-2 text-white hover:text-[#00D26A] transition-colors shadow-xl cursor-pointer focus:outline-none"
        title="Scroll to far end (Bottom)"
      >
        <ChevronDown className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );

  const renderScrollToTopButton = () => (
    <div className="flex justify-center my-2">
      <button
        type="button"
        onClick={handleScrollToTop}
        className="inline-flex items-center gap-2 bg-black/90 border border-white/20 rounded-xl px-4 py-2 text-white hover:text-[#00D26A] transition-colors shadow-xl cursor-pointer focus:outline-none"
        title="Scroll to far beginning (Top)"
      >
        <ChevronUp className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Simple Modal Window Dialog with Background Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-[#031d12] border border-[#00D26A]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
          >
            {/* Background Image Layer */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <img
                src="/terms_bg.jpg"
                alt="Background"
                className="w-full h-full object-cover opacity-20 filter blur-[1px]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#031d12]/90 via-[#031d12]/95 to-[#02130c]/98" />
            </div>

            {/* Modal Header */}
            <div className="relative z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 bg-black/40">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveTab('terms')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'terms'
                      ? 'bg-[#00D26A] text-slate-900 shadow-md'
                      : 'text-[#8BB99E] hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms &amp; Conditions</span>
                </button>

                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'privacy'
                      ? 'bg-[#00D26A] text-slate-900 shadow-md'
                      : 'text-[#8BB99E] hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable Document Text) */}
            <div
              ref={scrollContainerRef}
              className="relative z-10 p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-[#a1cbb2] leading-relaxed scroll-smooth"
            >
              {activeTab === 'terms' ? (
                /* TERMS AND CONDITIONS */
                <div className="space-y-4">
                  <div className="pb-3 border-b border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#00D26A]" />
                        TERMS &amp; CONDITIONS
                      </h3>
                      <p className="text-xs text-[#00D26A] mt-1 font-semibold">
                        ExamPapers • Powered by Godrerytone Ltd
                      </p>
                    </div>
                  </div>

                  {/* Down Arrow Button at Beginning of Document */}
                  {renderScrollToBottomButton()}

                  {/* 1 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">1. About the Service</h4>
                    <p>
                      ExamPapers is an online platform that allows users to search for and purchase educational examination papers and related academic documents for personal educational use.
                    </p>
                    <p className="text-[#00D26A] font-semibold">
                      The service is powered by Godrerytone Ltd.
                    </p>
                  </div>

                  {/* 2 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">2. Searching for Documents</h4>
                    <p>
                      Users may search for examination papers using the Unit Name and, where available, the Unit Code.
                    </p>
                    <p>
                      The Unit Code is optional but recommended because it helps identify the correct document more accurately.
                    </p>
                    <p>
                      Before purchasing, the platform displays the available document&apos;s information, including its title, identification details and price.
                    </p>
                  </div>

                  {/* 3 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">3. Purchasing a Document</h4>
                    <p>A user must provide their:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-white font-medium">
                      <li>First Name</li>
                      <li>Second Name</li>
                      <li>M-Pesa phone number</li>
                    </ul>
                    <p>The user must ensure that the information provided is accurate.</p>
                    <p>The displayed price is the amount payable for the selected document.</p>
                  </div>

                  {/* 4 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">4. M-Pesa Payments</h4>
                    <p>Payments are processed through M-Pesa.</p>
                    <p>
                      A document is not considered purchased merely because a user has initiated an M-Pesa payment.
                    </p>
                    <p>
                      The purchase is considered successful only after the payment has been successfully confirmed by the platform&apos;s payment system.
                    </p>
                    <p className="text-[#00D26A] font-semibold">
                      Once payment has been confirmed, the Download function becomes available.
                    </p>
                  </div>

                  {/* 5 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">5. Payment Made but Download Not Generated</h4>
                    <p>
                      If a user has successfully paid but the document or download does not become available, the user should contact support for assistance.
                    </p>
                    <p>To allow us to locate and verify the transaction quickly, the user must provide:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-white font-medium">
                      <li>M-Pesa transaction code</li>
                      <li>Amount paid</li>
                      <li>The phone number used for the payment</li>
                      <li>The document/unit they were attempting to purchase</li>
                    </ul>
                    <div className="my-2 p-3 bg-black/60 border border-[#00D26A]/40 rounded-xl space-y-1 text-xs text-slate-200">
                      <p className="font-bold text-[#00D26A]">Example:</p>
                      <p><strong>M-Pesa Code:</strong> QGH7XXXXXX</p>
                      <p><strong>Amount Paid:</strong> KSh 30</p>
                      <p><strong>Document:</strong> Mathematics Paper 1 – 2024</p>
                    </div>
                    <div className="p-2.5 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs font-bold">
                      Do not send your M-Pesa PIN. We will never ask you for your M-Pesa PIN.
                    </div>
                    <p className="pt-1">
                      Support will use the transaction information to verify the payment and assist with the purchase.
                    </p>
                  </div>

                  {/* 6 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">6. Downloaded Documents</h4>
                    <p>
                      After successful payment confirmation, the purchased document becomes available for download.
                    </p>
                    <p>
                      Downloaded documents may be protected using a password associated with the purchaser&apos;s information.
                    </p>
                    <p>Users are responsible for keeping their downloaded documents and passwords secure.</p>
                  </div>

                  {/* 7 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">7. Personal Use</h4>
                    <p>
                      Purchased documents are intended primarily for the purchaser&apos;s educational and personal use.
                    </p>
                    <p>
                      Users should not reproduce, resell, commercially redistribute, upload, or publicly distribute purchased documents without the necessary authorization.
                    </p>
                  </div>

                  {/* 8 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">8. Document Accuracy</h4>
                    <p>
                      We make reasonable efforts to ensure that documents listed on the platform correspond to their displayed descriptions.
                    </p>
                    <p>
                      Users should check the document information, including the unit name, unit code, examination/year and other identifying information before making a purchase.
                    </p>
                  </div>

                  {/* 9 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">9. Refunds and Payment Issues</h4>
                    <p>
                      If a payment has been completed but the purchased document is not delivered or cannot be accessed because of a technical problem, the user should contact support using the transaction details described above.
                    </p>
                    <p>Each payment issue will be reviewed against the relevant transaction.</p>
                  </div>

                  {/* 10 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">10. Changes to the Service</h4>
                    <p>
                      We may update the platform, document listings, prices, features and these Terms &amp; Conditions from time to time.
                    </p>
                  </div>

                  {/* 11 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">11. Contact</h4>
                    <p>
                      For questions, payment problems or document-access issues, users may contact us through the Contact Us section of the platform.
                    </p>
                  </div>

                  {/* Up Arrow Button at End of Terms & Conditions */}
                  {renderScrollToTopButton()}
                </div>
              ) : (
                /* PRIVACY POLICY */
                <div className="space-y-4">
                  <div className="pb-3 border-b border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#00D26A]" />
                        PRIVACY POLICY
                      </h3>
                      <p className="text-xs text-[#00D26A] mt-1 font-semibold">
                        Godrerytone Ltd Privacy Safeguards
                      </p>
                    </div>
                  </div>

                  {/* Down Arrow Button at Beginning of Privacy Policy */}
                  {renderScrollToBottomButton()}

                  {/* 1 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">1. Information We Collect</h4>
                    <p>To provide the service, we may collect information such as:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-white font-medium">
                      <li>First name</li>
                      <li>Second name</li>
                      <li>Phone number</li>
                      <li>M-Pesa transaction information</li>
                      <li>Documents purchased</li>
                      <li>Date and time of purchases</li>
                      <li>Payment status</li>
                      <li>Technical information necessary to operate the website</li>
                    </ul>
                  </div>

                  {/* 2 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">2. Why We Collect This Information</h4>
                    <p>We use this information to:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-white font-medium">
                      <li>Process and verify purchases</li>
                      <li>Confirm M-Pesa payments</li>
                      <li>Provide purchased documents</li>
                      <li>Generate personalized/protected documents</li>
                      <li>Respond to customer-support requests</li>
                      <li>Maintain purchase records</li>
                      <li>Prevent fraudulent transactions</li>
                      <li>Improve the platform</li>
                    </ul>
                  </div>

                  {/* 3 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">3. M-Pesa Information</h4>
                    <p>Payment processing is handled through the relevant M-Pesa payment system.</p>
                    <p>
                      We may receive transaction information necessary to confirm a payment, such as the transaction reference, amount and payment status.
                    </p>
                    <p className="text-[#00D26A] font-semibold">We do not require or request your M-Pesa PIN.</p>
                    <p className="text-red-300 font-bold">
                      Never send your M-Pesa PIN to ExamPapers or to anyone claiming to provide support.
                    </p>
                  </div>

                  {/* 4 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">4. Document Ownership and Personalization</h4>
                    <p>
                      Information provided during purchase may be used to associate a purchased document with the purchasing user and, where applicable, personalize the downloaded document.
                    </p>
                  </div>

                  {/* 5 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">5. Protection of Information</h4>
                    <p>
                      We take reasonable technical and organizational measures to protect information held by the platform against unauthorized access, alteration, disclosure or misuse.
                    </p>
                  </div>

                  {/* 6 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">6. Sharing of Information</h4>
                    <p className="text-white font-bold">We do not sell users&apos; personal information.</p>
                    <p>
                      Information may be shared with service providers where necessary to operate the platform, process payments, provide hosting or provide technical services.
                    </p>
                  </div>

                  {/* 7 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">7. Cookies and Technical Information</h4>
                    <p>
                      The website may use cookies and similar technologies necessary for functions such as maintaining sessions, security and improving the user experience.
                    </p>
                  </div>

                  {/* 8 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">8. Customer Support</h4>
                    <p>
                      When contacting support about a failed or missing document after payment, users may be asked to provide their M-Pesa transaction code and amount paid so that the transaction can be located and verified.
                    </p>
                    <p className="text-red-300 font-bold">
                      Users should never provide their M-Pesa PIN, banking password or other authentication credentials.
                    </p>
                  </div>

                  {/* 9 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">9. Your Information</h4>
                    <p>
                      Users may contact us regarding their personal information or questions concerning how their information is used.
                    </p>
                  </div>

                  {/* 10 */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">10. Policy Updates</h4>
                    <p>
                      This Privacy Policy may be updated when the platform&apos;s services, technology or legal requirements change.
                    </p>
                  </div>

                  {/* Up Arrow Button at End of Privacy Policy */}
                  {renderScrollToTopButton()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="relative z-10 px-6 py-3 border-t border-white/10 flex items-center justify-between bg-black/40 text-xs">
              <span className="text-[#8BB99E]">
                Godrerytone Ltd © {new Date().getFullYear()}
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-[#00D26A] hover:bg-[#00b85c] text-slate-900 font-bold rounded-full transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
