import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  Lock, FolderOpen,
  Download,
  Home,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Info,
  Check,
  RotateCcw,
  Loader2,
  Database,
  KeyRound,
  FileSpreadsheet,
  X,
  AlertTriangle,
  Sparkles,
  Trash2,
  Send,
  Mail,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { ExamPaperAdminItem } from './AdminPortal';
import { calculateAuthoritativePagesPrice, PagePricingModel, PagePriceRange } from '../lib/pricingCalculator';

interface SearchPaperWorkflowProps {
  initialUnitQuery?: string;
  onBackToHome?: () => void;
  papers?: ExamPaperAdminItem[];
}

interface PaperItem {
  id: string;
  unit_code: string;
  paper_title: string;
  price: string | number;
  status: string;
  file_path: string;
  eligible_pages?: number[];
  total_pages?: number;
  pricing_model?: PagePricingModel;
  fixed_page_price?: number;
  page_price_ranges?: PagePriceRange[];
  custom_page_prices?: Record<string | number, number>;
  min_page_limit?: number;
}

const PdfDocLockBadge: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  if (size === 'sm') {
    return (
      <div className="w-10 h-10 rounded-full bg-emerald-100/90 border border-emerald-200 flex items-center justify-center shrink-0 relative">
        <div className="w-6 h-7 bg-white rounded-sm shadow-xs border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-600" />
          <span className="bg-rose-600 text-white font-black text-[7px] px-0.5 rounded-2xs uppercase tracking-tighter">PDF</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-700 text-white p-0.5 rounded-full shadow border border-white">
          <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100/90 border border-emerald-300 flex items-center justify-center shrink-0 relative shadow-md">
        <span className="absolute top-1 left-2 text-emerald-500 font-bold text-xs">✦</span>
        <span className="absolute bottom-1 right-2 text-emerald-500 font-bold text-xs">✦</span>
        <span className="absolute top-2 right-2 text-emerald-400 font-bold text-xs">✦</span>

        <div className="w-12 h-16 sm:w-14 sm:h-18 bg-white rounded-md shadow-lg border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden p-1">
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-600 rounded-bl-sm" />
          <span className="bg-rose-600 text-white font-black text-[11px] sm:text-xs px-1.5 py-0.5 rounded shadow-xs uppercase tracking-tight">PDF</span>
          <div className="w-full px-1 space-y-1 mt-1.5 opacity-40">
            <div className="h-0.5 bg-slate-400 rounded-full w-full" />
            <div className="h-0.5 bg-slate-400 rounded-full w-3/4" />
          </div>
        </div>

        <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-1.5 rounded-xl shadow-md border-2 border-white flex items-center justify-center">
          <Lock className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-full bg-emerald-100/90 border border-emerald-200 flex items-center justify-center shrink-0 relative shadow-sm">
      <span className="absolute top-0.5 left-1 text-emerald-500 font-bold text-[9px]">✦</span>
      <span className="absolute bottom-0.5 right-1 text-emerald-500 font-bold text-[9px]">✦</span>

      <div className="w-8 h-11 bg-white rounded-md shadow-md border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden p-0.5">
        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-600 rounded-bl-sm" />
        <span className="bg-rose-600 text-white font-black text-[9px] px-1 py-0.2 rounded shadow-2xs uppercase tracking-tight">PDF</span>
        <div className="w-full px-0.5 space-y-0.5 mt-1 opacity-40">
          <div className="h-0.5 bg-slate-400 rounded-full w-full" />
          <div className="h-0.5 bg-slate-400 rounded-full w-2/3" />
        </div>
      </div>

      <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-700 text-white p-1 rounded-lg shadow-md border border-white flex items-center justify-center">
        <Lock className="w-3 h-3 stroke-[2.5]" />
      </div>
    </div>
  );
};

export const SearchPaperWorkflow: React.FC<SearchPaperWorkflowProps> = ({
  initialUnitQuery = '',
  onBackToHome,
  papers = [],
}) => {
  // Current Workflow Step: 1, 2, 3, 4, 5, or 6
  const [step, setStep] = useState<number>(1);

  // Normalization helpers - completely safe against undefined or null inputs
  const getCleanCode = (c?: any): string => {
    if (!c) return '';
    const str = typeof c === 'string' ? c : String(c);
    return str.trim().toUpperCase().replace(/\s+/g, '');
  };

  const getNormStr = (s?: any): string => {
    if (!s) return '';
    const str = typeof s === 'string' ? s : String(s);
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const getPTitle = (p: any): string =>
    p?.paper_title || p?.unitName || p?.title || '';

  const getPCode = (p: any): string =>
    p?.unit_code || p?.unitCode || '';

  const isPAvailable = (p: any): boolean => {
    if (!p) return false;
    if (p.status !== undefined) return p.status === 'available';
    if (p.isAvailable !== undefined) return Boolean(p.isAvailable);
    return true;
  };

  // Step 1 Form Data & Database Searching State
  const [paper_title, setUnitName] = useState<string>(() => {
    if (initialUnitQuery) {
      if (/\d/.test(initialUnitQuery)) {
        // Contains digits -> likely a code, so unit name should be matched or empty
        const qClean = getCleanCode(initialUnitQuery);
        const matched = (papers || []).find((p) => {
          const pCode = getCleanCode(getPCode(p));
          return pCode && qClean && (pCode.includes(qClean) || qClean.includes(pCode));
        });
        return matched ? (getPTitle(matched) || '') : '';
      } else {
        return initialUnitQuery || '';
      }
    }
    return '';
  });

  const [unit_code, setUnitCode] = useState<string>(() => {
    if (initialUnitQuery) {
      if (/\d/.test(initialUnitQuery)) {
        // Contains digits -> likely a code
        return (initialUnitQuery.toUpperCase().replace(/\s+/g, '')) || '';
      } else {
        const norm = getNormStr(initialUnitQuery);
        const queryLower = initialUnitQuery.toLowerCase();
        const matched = (papers || []).find((p) => {
          const title = getPTitle(p);
          return (
            (title && getNormStr(title) === norm) ||
            (title && title.toLowerCase().includes(queryLower))
          );
        });
        if (matched) return getPCode(matched) || '';
        return '';
      }
    }
    return '';
  });
  const [step1Error, setStep1Error] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStatusMsg, setSearchStatusMsg] = useState<string>('Searching database catalog...');

  // Selected Paper Result & Multi-Result Handling
  const [selectedPaper, setSelectedPaper] = useState<PaperItem | null>(null);
  const [resultPapers, setResultPapers] = useState<PaperItem[]>([]);
  const [unrelatedConflict, setUnrelatedConflict] = useState<{
    enteredName: string;
    enteredCode: string;
    paperForName: PaperItem;
    paperForCode: PaperItem;
  } | null>(null);
  const [autoCorrectNotice, setAutoCorrectNotice] = useState<{
    title: string;
    message: string;
    correctedCode?: string;
    correctedName?: string;
  } | null>(null);
  const [removedPaperNotice, setRemovedPaperNotice] = useState<string>('');

  // Step 3 Payment Details Form Data
  const [firstName, setFirstName] = useState<string>('');
  const [secondName, setSecondName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [checkoutToken, setCheckoutToken] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [mpesaReceipt, setMpesaReceipt] = useState<string>('');
  const [isInitiatingPayment, setIsInitiatingPayment] = useState<boolean>(false);
  const [isUncertain, setIsUncertain] = useState<boolean>(false);
  const submittingRef = useRef<boolean>(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string>('');

  // In-App Password Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockInput, setUnlockInput] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string>('');

  // Download Triggered State
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);
  const [isProcessingWhatsApp, setIsProcessingWhatsApp] = useState<boolean>(false);
  const [purchaseType, setPurchaseType] = useState<'full' | 'pages'>('full');
  const [pageQuantity, setPageQuantity] = useState<number>(6);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);

  const totalPagesForSelected = selectedPaper ? (Number(selectedPaper.total_pages) || 12) : 12;
  const lastNPages = Array.from({ length: pageQuantity }, (_, i) => totalPagesForSelected - pageQuantity + i + 1);

  const pagesPricing = selectedPaper
    ? calculateAuthoritativePagesPrice(selectedPaper, lastNPages)
    : { totalAmount: 0, breakdown: '', pricingModel: 'fixed' as const, unitPriceSummary: '', itemizedDetails: [], isValid: false };

  const fullPaperNumericPrice = selectedPaper
    ? (typeof selectedPaper.price === 'number'
        ? selectedPaper.price
        : parseInt(String(selectedPaper.price).replace(/[^\d]/g, '') || '50', 10))
    : 50;

  const finalAmount = purchaseType === 'pages' ? pagesPricing.totalAmount : fullPaperNumericPrice;

  useEffect(() => {
    if (initialUnitQuery) {
      setUnitName(initialUnitQuery || '');
      const norm = getNormStr(initialUnitQuery);
      const queryLower = initialUnitQuery.toLowerCase();
      const matched = (papers || []).find((p) => {
        const title = getPTitle(p);
        return (
          (title && getNormStr(title) === norm) ||
          (title && title.toLowerCase().includes(queryLower))
        );
      });
      if (matched) {
        setUnitCode(getPCode(matched) || '');
      }
    }
  }, [initialUnitQuery, papers]);

  // Live detection while typing in Step 1
  const liveNormName = getNormStr(paper_title);
  const liveCleanCode = getCleanCode(unit_code);

  const livePaperByName = liveNormName
    ? (papers || []).find((p) => {
        const pNorm = getNormStr(getPTitle(p));
        return pNorm && (pNorm === liveNormName || pNorm.includes(liveNormName) || liveNormName.includes(pNorm));
      })
    : null;

  const livePaperByCode = liveCleanCode
    ? (papers || []).find((p) => {
        const pCodeNorm = getNormStr(getPCode(p));
        return pCodeNorm && pCodeNorm === getNormStr(liveCleanCode);
      })
    : null;

  const hasLiveMismatch =
    livePaperByName &&
    livePaperByCode &&
    livePaperByName.id !== livePaperByCode.id;

  // Handle Search Submission (Step 1 -> Database Lookup Loading -> Step 2)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paper_title.trim()) {
      setStep1Error('Please enter a unit name or course code.');
      return;
    }
    setStep1Error('');
    setIsSearching(true);
    setSearchStatusMsg('Connecting to GodreryTone Publishers repository...');

    const codeClean = getCleanCode(unit_code);
    const nameClean = paper_title.trim();
    const normName = getNormStr(nameClean);
    const normCode = getNormStr(codeClean);

    // 1. Identify paper in admin by unit name
    const matchedByName = (papers || []).find((p) => {
      const pTitle = getPTitle(p);
      const pNorm = getNormStr(pTitle);
      return (
        (pNorm && normName && (pNorm === normName || pNorm.includes(normName) || normName.includes(pNorm))) ||
        (pTitle && nameClean && (pTitle.toLowerCase().includes(nameClean.toLowerCase()) || nameClean.toLowerCase().includes(pTitle.toLowerCase())))
      );
    });

    // 2. Identify paper in admin by unit code
    const matchedByCode = codeClean
      ? (papers || []).find((p) => {
          const pCodeNorm = getNormStr(getPCode(p));
          return (
            pCodeNorm && normCode && (
              pCodeNorm === normCode ||
              pCodeNorm.includes(normCode) ||
              normCode.includes(pCodeNorm)
            )
          );
        })
      : null;

    // Simulate database lookup and backend verification steps
    setTimeout(() => {
      setSearchStatusMsg('Querying Mount Kenya University (MKU) catalog...');
    }, 700);

    setTimeout(() => {
      const nameMatchedTitle = matchedByName ? getPTitle(matchedByName) : '';
      const codeMatchedTitle = matchedByCode ? getPTitle(matchedByCode) : '';
      const nameMatchedCode = matchedByName ? getPCode(matchedByName) : '';

      if (matchedByName && matchedByCode && matchedByName.id !== matchedByCode.id) {
        setSearchStatusMsg(
          `Notice: Unrelated inputs detected — retrieving both "${nameMatchedTitle}" and "${codeMatchedTitle}"...`
        );
      } else if (matchedByName && codeClean && codeClean !== getCleanCode(nameMatchedCode)) {
        setSearchStatusMsg(
          `Auto-correcting unit code to ${nameMatchedCode} for ${nameMatchedTitle}...`
        );
      } else {
        setSearchStatusMsg('Verifying exam paper identity & marking keys...');
      }
    }, 1500);

    setTimeout(() => {
      // Clear previous notices
      setUnrelatedConflict(null);
      setAutoCorrectNotice(null);
      setRemovedPaperNotice('');

      const toPaperItem = (adminItem: any, overrideCode?: string, overrideName?: string): PaperItem => ({
        id: String(adminItem.id),
        paper_title: overrideName || getPTitle(adminItem) || nameClean,
        unit_code: overrideCode || getPCode(adminItem) || codeClean || 'UNIT101',
        file_path: adminItem.file_path || (adminItem as any).fileName || `${overrideCode || getPCode(adminItem) || 'Paper'}.pdf`,
        price: typeof adminItem.price === 'number' ? `KSh ${adminItem.price}` : (adminItem.price || 'KSh 50'),
        status: isPAvailable(adminItem) ? 'available' : 'unavailable',
        eligible_pages: adminItem.eligible_pages,
        total_pages: adminItem.total_pages || (Array.isArray(adminItem.eligible_pages) ? adminItem.eligible_pages.length : 12),
        pricing_model: adminItem.pricing_model,
        fixed_page_price: adminItem.fixed_page_price,
        page_price_ranges: adminItem.page_price_ranges,
        custom_page_prices: adminItem.custom_page_prices,
        min_page_limit: adminItem.min_page_limit,
      });

      // CASE A: Both name and code point to DIFFERENT documents in admin (UNRELATED DATA)
      if (matchedByName && matchedByCode && matchedByName.id !== matchedByCode.id) {
        const itemForName = toPaperItem(matchedByName, getPCode(matchedByName));
        const itemForCode = toPaperItem(matchedByCode, getPCode(matchedByCode));

        setResultPapers([itemForName, itemForCode]);
        setSelectedPaper(itemForName);
        setUnrelatedConflict({
          enteredName: nameClean,
          enteredCode: codeClean,
          paperForName: itemForName,
          paperForCode: itemForCode,
        });
      }
      // CASE B: Name matches an admin paper, but entered code was wrong/different (or doesn't match any other paper)
      else if (matchedByName) {
        const correctCode = getPCode(matchedByName);
        const enteredWrongCode = codeClean && codeClean !== getCleanCode(correctCode);

        const item = toPaperItem(matchedByName, correctCode);
        setResultPapers([item]);
        setSelectedPaper(item);
        setUnitCode(correctCode); // correct the input code to the official one!

        if (enteredWrongCode) {
          setAutoCorrectNotice({
            title: 'Unit Code Automatically Corrected',
            message: `You entered code "${unit_code.trim()}", but "${getPTitle(matchedByName)}" is officially registered under code "${correctCode}" in the repository. We updated it to the correct code.`,
            correctedCode: correctCode,
          });
        }
      }
      // CASE C: Code matches an admin paper, but name was misspelled / generic
      else if (matchedByCode) {
        const item = toPaperItem(matchedByCode, getPCode(matchedByCode));
        setResultPapers([item]);
        setSelectedPaper(item);
        setUnitName(getPTitle(matchedByCode)); // correct the unit name
        setUnitCode(getPCode(matchedByCode));

        setAutoCorrectNotice({
          title: 'Unit Name Verified by Code',
          message: `Unit code "${getPCode(matchedByCode)}" belongs to "${getPTitle(matchedByCode)}". We have verified and displayed the matching paper.`,
          correctedName: getPTitle(matchedByCode),
        });
      }
      // CASE D: Neither matched existing admin paper in database catalog
      else {
        setResultPapers([]);
        setSelectedPaper(null);
      }

      setIsSearching(false);
      setStep(2);
    }, 2200);
  };

  // Handle Dismissing / Deleting one document of choice (Cancel 'X' feature)
  const handleDismissPaper = (paperIdToDismiss: string) => {
    const paperToDelete = resultPapers.find((p) => p.id === paperIdToDismiss);
    const remaining = resultPapers.filter((p) => p.id !== paperIdToDismiss);

    setResultPapers(remaining);

    if (remaining.length > 0) {
      setSelectedPaper(remaining[0]);
      setUnitName(getPTitle(remaining[0]) || '');
      setUnitCode(getPCode(remaining[0]) || '');
      setRemovedPaperNotice(
        `✓ You deleted "${getPTitle(paperToDelete)}" (${getPCode(paperToDelete)}). "${getPTitle(remaining[0])}" (${getPCode(remaining[0])}) is kept and ready for checkout.`
      );
    }
  };

  // Handle selecting a specific paper directly and showing details
  const handleSelectPaperAndProceed = (paper: PaperItem) => {
    setSelectedPaper(paper);
    setResultPapers([paper]);
    setUnitName(getPTitle(paper) || '');
    setUnitCode(getPCode(paper) || '');
    setIsDetailsExpanded(true);
  };

  // Handle View Details & Purchase Options
  const handleViewDetails = (paper?: PaperItem) => {
    if (paper) {
      setSelectedPaper(paper);
      setResultPapers([paper]);
      setUnitName(getPTitle(paper) || '');
      setUnitCode(getPCode(paper) || '');
    }
    setIsDetailsExpanded(true);
  };

  // Handle Proceed to Payment Form (Step 2 -> Step 3)
  const handleProceedToCheckout = () => {
    setStep(3);
  };

  // Handle Initiate Real M-Pesa STK Push (Step 3 -> Step 4)
  const handlePaySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Guard: Return immediately if submission is already in progress
    if (submittingRef.current) return;

    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!secondName.trim()) errors.secondName = 'Second name is required';
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address (e.g. student@example.com)';
    }
    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^(07|01|2547|2541|\+2547|\+2541)\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      errors.phone = 'Enter a valid M-Pesa phone number (e.g., 0712345678 or 0112345678)';
    }

    if (Object.keys(errors).length > 0) {
      setPaymentErrors(errors);
      return;
    }

    if (!selectedPaper) return;

    setPaymentErrors({});
    
    // Guard: Lock the submission before the request
    submittingRef.current = true;
    setIsInitiatingPayment(true);

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: selectedPaper.id,
          first_name: firstName.trim(),
          second_name: secondName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          purchase_type: purchaseType,
          ...(purchaseType === 'pages' ? {
            page_quantity: pageQuantity,
          } : {}),
        }),
      });

      const data = await res.json();

      // 1. Check for Definitive Failure (Safe to retry: pre-validation or explicit Daraja rejection)
      if (data.outcome === "definite_failure" && data.uncertainOutcome !== true && data.success !== true) {
        setPaymentErrors({ general: data.error || 'Failed to initiate M-Pesa STK push.' });
        setIsInitiatingPayment(false);
        submittingRef.current = false; // UNLOCK for safe retry
        return;
      }

      // 2. Check for Valid Success
      if (res.ok && data.success === true && typeof data.orderId === 'string' && data.orderId.trim().length > 0) {
        setCurrentOrderId(data.orderId);
        if (data.checkoutToken) {
          setCheckoutToken(data.checkoutToken);
        }
        setIsInitiatingPayment(false);
        setPaymentStatusMessage(data.customerMessage || 'Please complete the M-Pesa prompt on your phone.');
        setStep(4);
        // Guard remains locked for successful payment workflow
        return;
      }

      // 3. Everything else (202, 504, !res.ok, uncertain, or malformed success) is Uncertain
      setIsUncertain(true);
      setPaymentErrors({ 
        general: data.error || 'The payment request may have been initiated, but we could not confirm its status. Please check your phone for an M-Pesa prompt. Do not attempt to initiate another payment.' 
      });
      setIsInitiatingPayment(false);
      // Guard remains LOCKED - Never unlock on uncertain/ambiguous outcomes
    } catch (err: any) {
      setPaymentErrors({ 
        general: 'Network error initiating payment. Please check your phone, do not retry, and contact support if needed.' 
      });
      setIsInitiatingPayment(false);
      setIsUncertain(true);
      // Guard remains locked on error
    }
  };

  // Step 4 Real Payment Verification: Poll backend /api/orders/:orderId/status
  useEffect(() => {
    if (step !== 4 || !currentOrderId) return;

    let attempts = 0;
    const maxAttempts = 30; // 30 * 2.5s = 75 seconds timeout
    const interval = setInterval(async () => {
      attempts++;
      try {
        const queryParam = checkoutToken ? `?checkoutToken=${encodeURIComponent(checkoutToken)}` : '';
        const res = await fetch(`/api/orders/${currentOrderId}/status${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isPaid || data.orderStatus === 'paid') {
            clearInterval(interval);
            if (data.mpesaReceipt) {
              setMpesaReceipt(data.mpesaReceipt);
            }
            if (data.accessToken) {
              setAccessToken(data.accessToken);
            }
            setStep(5);
            return;
          }
          if (data.paymentStatus === 'failed' || data.orderStatus === 'failed') {
            clearInterval(interval);
            setPaymentStatusMessage('Payment declined or failed. Please return to previous step and try again.');
            return;
          }
        }
      } catch (err) {
        console.error("Status poll error:", err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPaymentStatusMessage('Payment confirmation timed out. If you already entered your PIN, please refresh the page.');
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, currentOrderId, checkoutToken]);

  // Handle Trigger Real Encrypted PDF File Download (Protected & Uneditable Format)
  const handleDownloadPaper = async () => {
    if (!selectedPaper || !currentOrderId) return;
    try {
      setHasDownloaded(false);
      
      const res = await fetch(`/api/orders/${currentOrderId}/download`);
      
      if (!res.ok) {
        // Handle JSON error response if possible, otherwise generic text
        let errorMsg = "Failed to securely download paper.";
        try {
          const errData = await res.json();
          if (errData.error) errorMsg = errData.error;
        } catch(e) {}
        alert(errorMsg);
        return;
      }

      // Read the encrypted PDF blob directly from the response
      const blob = await res.blob();
      
      // Use the purchaser's first name in the filename
      const downloadFileName = `This_document_belongs_to_${firstName.trim().replace(/\s+/g, '_')}_${selectedPaper.unit_code}.pdf`;
      
      // Trigger download
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setHasDownloaded(true);
      setStep(5);
    } catch (err) {
      console.error('PDF Download Error:', err);
      alert("Network error during secure download. Please check your connection.");
    }
  };

  const handleResetSearch = () => {
    setStep(1);
    setHasDownloaded(false);
    setEmail('');
    setCurrentOrderId(null);
  };

  return (
    <div className={`w-full ${step === 2 && resultPapers.length > 1 ? 'max-w-3xl' : 'max-w-xl'} mx-auto transition-all duration-300 animate-fadeIn`}>
      {/* Container Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl text-slate-900 border border-slate-100">
        {/* ========================================================= */}
        {/* STEP 1: Find Your Unit (Search Form) */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#00D26A] text-slate-900 font-extrabold flex items-center justify-center text-sm shrink-0">
                1
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Find Your Unit
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Enter the unit name and (optionally) the unit code to find the paper you need.
            </p>

            <form onSubmit={handleSearchSubmit} className="space-y-5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Unit Name <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  value={paper_title ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/\d/.test(val)) {
                      setStep1Error('Unit Name cannot contain numbers. Please enter unit codes in the field below.');
                      setUnitName(val.replace(/\d/g, ''));
                    } else {
                      setUnitName(val);
                      if (step1Error) setStep1Error('');
                    }
                  }}
                  placeholder="e.g. Microeconomics"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Unit Code <span className="text-slate-400 font-normal lowercase">(optional but recommended)</span>
                </label>
                <input
                  type="text"
                  value={unit_code ?? ''}
                  onChange={(e) => setUnitCode(e.target.value)}
                  placeholder="e.g. ECON101"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                />
              </div>

              {/* Step 1 Live Mismatch Hint */}
              {hasLiveMismatch && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Unrelated Code Detected</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-snug">
                    Code <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded border border-amber-300">"{unit_code}"</strong> belongs to <strong>{getPTitle(livePaperByCode)}</strong>, while <strong>{getPTitle(livePaperByName)}</strong> uses code <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded border border-amber-300">{getPCode(livePaperByName)}</strong>.
                    <br />
                    <em>Submitting will display both documents with their respective codes and an option to cancel one.</em>
                  </p>
                  <button
                    type="button"
                    onClick={() => setUnitCode(getPCode(livePaperByName) || '')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-700" />
                    <span>Auto-Correct Code to {getPCode(livePaperByName)}</span>
                  </button>
                </div>
              )}

              {/* Step 1 Live Helpful Repository Code Hint */}
              {!hasLiveMismatch && livePaperByName && getCleanCode(unit_code) !== getCleanCode(getPCode(livePaperByName)) && (
                <div className="flex items-center justify-between text-xs text-emerald-900 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <span className="text-[11px]">
                    💡 Official code for <strong>{getPTitle(livePaperByName)}</strong>: <strong className="font-mono">{getPCode(livePaperByName)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnitCode(getPCode(livePaperByName) || '')}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer text-[11px] shrink-0 ml-2"
                  >
                    Apply {getPCode(livePaperByName)}
                  </button>
                </div>
              )}

              {step1Error && (
                <p className="text-xs text-rose-600 font-medium">{step1Error}</p>
              )}

              {/* Database Searching Loading Banner */}
              {isSearching && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-[#00D26A] text-white flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#00D26A]" />
                      <span>Searching Database</span>
                    </p>
                    <p className="text-[11px] text-emerald-800 font-medium">{searchStatusMsg}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3.5 bg-[#00D26A] hover:bg-[#00b85c] disabled:bg-emerald-700 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-[#00D26A]/20 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98] disabled:cursor-not-allowed cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching Database...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: Search Results */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#00D26A] font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to search</span>
            </button>

            {resultPapers.length === 0 && !selectedPaper ? (
              <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-lg font-black text-slate-800">
                    No examination papers found
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We could not find any past examination papers matching your search criteria. Please check the unit code or title and try searching again.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black rounded-full text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Search Again</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Search Results
                </h2>
                {resultPapers.length > 1 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                    2 Documents Found
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                {resultPapers.length > 1 ? (
                  <>
                    Multiple documents matched your entered data: <strong className="text-slate-800 font-bold">{paper_title}</strong> and code <strong className="text-slate-800 font-mono">{unit_code}</strong>.
                  </>
                ) : (
                  <>
                    Showing results for:{' '}
                    <strong className="text-slate-800 font-bold">{selectedPaper?.paper_title}</strong>{' '}
                    <span className="text-slate-500">(Unit Code: <strong className="font-mono text-slate-700">{selectedPaper?.unit_code}</strong>)</span>
                  </>
                )}
              </p>
            </div>

            {/* Notification A: Unrelated Data Conflict Alert */}
            {unrelatedConflict && resultPapers.length > 1 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/95 border-2 border-amber-400 text-amber-950 shadow-md space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-sm sm:text-base font-black text-amber-950 tracking-tight">
                        You Entered Unrelated Data
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                        Mismatch Resolution
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                      The unit name you entered (<strong className="font-extrabold text-amber-950">"{unrelatedConflict.enteredName}"</strong>) corresponds to <strong className="font-extrabold text-amber-950">{unrelatedConflict.paperForName.paper_title}</strong> under repository code <span className="font-mono font-black bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300 text-amber-950">{unrelatedConflict.paperForName.unit_code}</span>.
                    </p>
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                      However, the unit code you entered (<strong className="font-mono font-extrabold bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300 text-amber-950">"{unrelatedConflict.enteredCode}"</strong>) is registered to a different course: <strong className="font-extrabold text-amber-950">{unrelatedConflict.paperForCode.paper_title}</strong>.
                    </p>
                    <div className="pt-2 flex items-center gap-2 text-xs font-extrabold text-amber-950 border-t border-amber-300/80">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                      <span>
                        Both documents are displayed with their respective codes below. Click the <strong className="text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">✕ Delete</strong> button on either document to remove your choice, or click <strong>Select &amp; View Details</strong> on the paper you want.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification B: Auto-Corrected Notice */}
            {autoCorrectNotice && (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00D26A] text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                    {autoCorrectNotice.title}
                  </h3>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {autoCorrectNotice.message}
                  </p>
                </div>
              </div>
            )}

            {/* Notification C: Removed Paper Feedback */}
            {removedPaperNotice && (
              <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xs">
                <Check className="w-4 h-4 text-[#00D26A] stroke-[3]" />
                <span>{removedPaperNotice}</span>
              </div>
            )}

            {/* Multi-Paper View (When two documents are displayed) */}
            {resultPapers.length > 1 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                  <span>Available Documents ({resultPapers.length})</span>
                  <span>Use ✕ Delete on the unwanted document</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {resultPapers.map((paper) => {
                    const isFromName = unrelatedConflict?.paperForName.id === paper.id;
                    return (
                      <div
                        key={paper.id}
                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between relative shadow-md bg-white ${
                          selectedPaper?.id === paper.id
                            ? 'border-[#00D26A] ring-2 ring-[#00D26A]/20'
                            : 'border-slate-200 hover:border-[#00D26A]/60'
                        }`}
                      >
                        {/* Top Row: Match Tag & Cancel X Button */}
                        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                          <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isFromName
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {isFromName ? `Matched Name: ${paper.paper_title}` : `Matched Code: ${paper.unit_code}`}
                          </span>

                          {/* Cancel X to delete one of choice */}
                          <button
                            onClick={() => handleDismissPaper(paper.id)}
                            title={`Delete ${paper.paper_title} from search results`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-300 text-xs font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Delete</span>
                          </button>
                        </div>

                        {/* Paper Details */}
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <PdfDocLockBadge size="md" />
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                                    {paper.paper_title}
                                  </h3>
                                  <span className="bg-rose-100 text-rose-700 font-black text-[10px] px-2 py-0.5 rounded-full border border-rose-200 uppercase tracking-tight">
                                    PDF
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                                  Paper 1 – 2024 (Official Read-Only)
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-base font-black text-emerald-800 block">
                                {paper.price}
                              </span>
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 border ${paper.status === 'available' as any ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`}>
                                {paper.status === 'available' as any ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                          </div>

                          {/* Respective Code Highlight Box */}
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Respective Unit Code:</span>
                              <strong className="font-mono bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-300 font-black text-xs">
                                {paper.unit_code}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Academic Year:</span>
                              <span className="font-semibold text-slate-700">2024</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Repository ID:</span>
                              <span className="font-mono text-[10px] text-slate-600">{paper.id || paper.id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Button */}
                        <div className="pt-4 mt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleSelectPaperAndProceed(paper)}
                            disabled={paper.status !== 'available'}
                            className="w-full py-2.5 bg-[#00D26A] hover:bg-[#00b85c] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          >
                            <span>{paper.status === 'available' ? 'Select & View Details' : 'Unavailable'}</span>
                            {paper.status === 'available' && <ArrowRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : selectedPaper ? (
              /* Single Paper Result Card */
              <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/50 bg-slate-50/80 shadow-md space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <PdfDocLockBadge size="md" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                          {selectedPaper.paper_title}
                        </h3>
                        <span className="bg-rose-100 text-rose-700 font-black text-[10px] px-2 py-0.5 rounded-full border border-rose-200 uppercase tracking-tight">
                          PDF Format
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Paper 1 – 2024 (Official Read-Only Exam Paper)
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 flex-wrap">
                        <span>Respective Unit Code:</span>
                        <strong className="font-mono bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-300 font-black">
                          {selectedPaper.unit_code}
                        </strong>
                        <span className="text-slate-400">•</span>
                        <span>Year: <strong className="text-slate-700">2024</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base sm:text-lg font-black text-emerald-800 block">
                      {selectedPaper.price}
                    </span>
                    <div className="mt-1">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block border ${selectedPaper.status === 'available' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`}>
                        {selectedPaper.status === 'available' ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPaper.status !== 'available' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Unit Currently Under Digitization</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      This past examination paper is registered in our catalog but has not yet been digitized or verified by publishers. You can request priority digitization or search another unit code.
                    </p>
                  </div>
                )}

                {/* DUAL-PURCHASE SYSTEM (Option A: Buy Whole Document vs Option B: Buy Selected Pages) */}
                <div className="space-y-4 pt-4 border-t border-slate-200 bg-white p-4 sm:p-5 rounded-2xl shadow-xs text-left animate-fadeIn">
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span>Select Purchase Option</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          Dual Purchase System
                        </span>
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose whether to purchase the complete exam paper or select specific individual pages or ranges.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* OPTION A: Buy Whole Document */}
                    <div
                      onClick={() => setPurchaseType('full')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        purchaseType === 'full'
                          ? 'border-[#00D26A] bg-emerald-50/60 ring-2 ring-[#00D26A]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="purchaseModeRadio"
                          checked={purchaseType === 'full'}
                          onChange={() => setPurchaseType('full')}
                          className="mt-1 text-[#00D26A] focus:ring-[#00D26A]"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-black text-slate-900 text-sm">
                              Option A — Buy Whole Document
                            </span>
                            <span className="font-black text-emerald-800 text-sm bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                              {selectedPaper.price}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Provides immediate, unrestricted access to the complete examination paper including all sections, questions, and official structure upon verified payment.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* OPTION B: Buy Selected Pages (Last-N-Pages) */}
                    {(() => {
                      const totalPages = Number(selectedPaper.total_pages) || 12;

                      return (
                        <div
                          onClick={() => setPurchaseType('pages')}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            purchaseType === 'pages'
                              ? 'border-[#00D26A] bg-emerald-50/60 ring-2 ring-[#00D26A]/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="purchaseModeRadio"
                              checked={purchaseType === 'pages'}
                              onChange={() => setPurchaseType('pages')}
                              className="mt-1 text-[#00D26A] focus:ring-[#00D26A]"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="font-black text-slate-900 text-sm">
                                  Option B — Buy Selected Pages (Last N Pages)
                                </span>
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                  {totalPages} pages total
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 leading-relaxed">
                                Purchase the last <strong className="font-extrabold text-slate-900">{pageQuantity}</strong> pages of the document (pages <strong className="font-mono font-bold text-slate-900">{Math.max(1, totalPages - pageQuantity + 1)}–{totalPages}</strong>). Automatically selected from the end of the document.
                              </p>

                              {purchaseType === 'pages' && (
                                <div className="pt-3 mt-2 border-t border-emerald-200/80 space-y-3">
                                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                    <span className="font-bold text-slate-700">Select Page Quantity (N):</span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {[6, 10, 15, 20, Math.min(totalPages, 30)].filter((q, idx, arr) => q <= totalPages && arr.indexOf(q) === idx).map((qty) => (
                                        <button
                                          key={qty}
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setPageQuantity(qty); }}
                                          className={`px-3 py-1 font-bold rounded-lg border text-xs transition-all cursor-pointer ${
                                            pageQuantity === qty
                                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                                          }`}
                                        >
                                          {qty} Pages
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="font-bold text-slate-700">Custom Quantity:</span>
                                    <input
                                      type="number"
                                      min="6"
                                      max={totalPages}
                                      value={pageQuantity}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val)) setPageQuantity(Math.max(6, Math.min(totalPages, val)));
                                      }}
                                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white"
                                    />
                                    <span className="text-slate-500 text-[11px]">(Min 6, Max {totalPages})</span>
                                  </div>

                                  <div className="p-3.5 bg-emerald-100/60 rounded-xl border border-emerald-300 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between text-emerald-950">
                                      <span className="font-bold">Purchased Page Span:</span>
                                      <span className="font-mono font-black text-emerald-950">
                                        [{Math.max(1, totalPages - pageQuantity + 1)} ... {totalPages}] ({pageQuantity} pages)
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-emerald-950 font-black text-sm pt-1 border-t border-emerald-200">
                                      <span>Authoritative Amount:</span>
                                      <span className="text-base text-emerald-800">KSh {pagesPricing.totalAmount}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Proceed to Checkout Action */}
                  <div className="pt-3 flex justify-end border-t border-slate-200">
                    <button
                      onClick={handleProceedToCheckout}
                      disabled={
                        selectedPaper.status !== 'available' ||
                        (purchaseType === 'pages' && !pagesPricing.isValid)
                      }
                      className="px-6 py-2.5 bg-[#00D26A] hover:bg-[#00b85c] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black rounded-full transition-all text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: Enter Details & Initiate Payment */}
        {/* ========================================================= */}
        {step === 3 && selectedPaper && (
          <div className="space-y-6">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#00D26A] font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to results</span>
            </button>

            {/* Selected Purchase Summary Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5 text-left">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-300">
                      {purchaseType === 'pages' ? 'Option B: Selected Pages' : 'Option A: Whole Document'}
                    </span>
                    <span className="bg-rose-100 text-rose-700 font-black text-[10px] px-2 py-0.5 rounded-full border border-rose-200 uppercase tracking-tight">
                      PDF Format
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    {selectedPaper.paper_title} Paper 1 – 2024
                  </h2>
                  <p className="text-xs text-slate-500">
                    Respective Unit Code: <strong className="font-mono bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded text-xs font-bold">{selectedPaper.unit_code}</strong>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 block font-medium">Final Amount</span>
                  <span className="text-2xl font-black text-emerald-700">KSh {finalAmount}</span>
                </div>
              </div>

              {/* Specific breakdown for page-based purchases */}
              {purchaseType === 'pages' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold">Selected Page Count:</span>
                    <span className="font-black text-emerald-950">{pageQuantity} Pages (Last N Pages)</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 text-slate-700">
                    <span className="font-semibold shrink-0">Purchased Page Span:</span>
                    <span className="font-mono font-bold text-emerald-900 text-right break-all">
                      [{lastNPages.join(', ')}]
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-emerald-200/80">
                    <span>Pricing Breakdown:</span>
                    <span className="font-semibold text-slate-800">{pagesPricing.breakdown}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Scope of Access:</span>
                  <span className="font-bold text-slate-900">Full Official Examination Document</span>
                </div>
              )}
            </div>

            {/* AUTOMATED M-PESA PAYMENT FORM */}
            <form onSubmit={handlePaySubmit} className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-[#00D26A] text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
                  M
                </div>
                <div className="text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Lipa na M-Pesa Online
                  </h3>
                  <p className="text-slate-600">
                    Enter your details below. You will receive an instant M-Pesa prompt on your phone to complete payment.
                  </p>
                </div>
              </div>

              {paymentErrors.general && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{paymentErrors.general}</span>
                </div>
              )}

              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Customer &amp; Payment Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      First Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName ?? ''}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (paymentErrors.firstName) setPaymentErrors({...paymentErrors, firstName: ''});
                      }}
                      placeholder="e.g. John"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                    />
                    {paymentErrors.firstName && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{paymentErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Second Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={secondName ?? ''}
                      onChange={(e) => {
                        setSecondName(e.target.value);
                        if (paymentErrors.secondName) setPaymentErrors({...paymentErrors, secondName: ''});
                      }}
                      placeholder="e.g. Kamau"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                    />
                    {paymentErrors.secondName && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{paymentErrors.secondName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={email ?? ''}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (paymentErrors.email) setPaymentErrors({...paymentErrors, email: ''});
                    }}
                    placeholder="e.g. student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all"
                  />
                  {paymentErrors.email ? (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{paymentErrors.email}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Your document access link and receipt will be delivered to this email.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    M-Pesa Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone ?? ''}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (paymentErrors.phone) setPaymentErrors({...paymentErrors, phone: ''});
                    }}
                    placeholder="e.g. 0712345678 or 0112345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none transition-all font-mono"
                  />
                  {paymentErrors.phone ? (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{paymentErrors.phone}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Enter the Safaricom phone number to receive the M-Pesa PIN prompt.</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isInitiatingPayment}
                className="w-full py-4 bg-[#00D26A] hover:bg-[#00b55b] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold rounded-xl transition-all shadow-md shadow-[#00D26A]/20 flex items-center justify-center gap-2 text-base active:scale-[0.98] cursor-pointer"
              >
                {isInitiatingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending M-Pesa Prompt...</span>
                  </>
                ) : (
                  <span>PAY KSh {finalAmount} WITH M-PESA</span>
                )}
              </button>

              <div className="text-center pt-1 pb-2">
                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Safaricom Daraja STK Push &bull; Official Godrery Publishers</span>
                </p>
              </div>
            </form>
          </div>
        )}
        
        {/* ========================================================= */}

        {/* STEP 4: Waiting for M-Pesa Confirmation */}
        {/* ========================================================= */}
        {step === 4 && selectedPaper && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-8 h-8 text-[#00D26A]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Processing Payment
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                {paymentStatusMessage || 'Please complete the M-Pesa prompt on your phone.'}
              </p>
              <p className="text-xs text-slate-400 italic">
                Waiting for M-Pesa payment confirmation...
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Document:</span>
                <span className="font-bold text-slate-800">{selectedPaper.paper_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-emerald-700">{selectedPaper.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">M-Pesa Phone:</span>
                <span className="font-mono font-bold text-slate-800">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Email:</span>
                <span className="font-mono font-bold text-slate-800">{email}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Do not close this page. Once you enter your PIN, confirmation is automatic.</span>
            </div>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
            >
              Change Details / Retry
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: Payment Confirmed — Download Button Activated */}
        {/* ========================================================= */}
        {step === 5 && selectedPaper && (
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00D26A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-[#00D26A]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">
                Payment Confirmed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Your payment has been verified successfully.
              </p>
            </div>

            {/* Summary Card matching image.png */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <PdfDocLockBadge size="sm" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {selectedPaper.paper_title} Paper 1 – 2024
                    </h4>
                    <span className="bg-rose-100 text-rose-700 font-bold text-[9px] px-1.5 py-0.2 rounded uppercase">
                      PDF
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Unit Code: {selectedPaper.unit_code}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-slate-900 text-sm block">
                  {selectedPaper.price}
                </span>
                {mpesaReceipt && (
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                    {mpesaReceipt}
                  </span>
                )}
              </div>
            </div>

            {email && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Access Link Sent to Email</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    An official receipt and permanent document access link have also been delivered to <strong>{email}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Open Document Button */}
            <button
              onClick={() => {
                if (accessToken) {
                  window.location.href = `/document/access/${accessToken}`;
                } else {
                  alert("Access token missing. Please refresh.");
                }
              }}
              className="w-full py-3.5 bg-[#00D26A] hover:bg-[#00b85c] text-white font-extrabold rounded-xl transition-all shadow-md shadow-[#00D26A]/20 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Open Document</span>
            </button>


            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D26A]" />
              <span>Secure online access verified.</span>
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleResetSearch}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Search Another Paper</span>
              </button>
            </div>
          </div>
        )}

        
      </div>

      {/* Interactive Password Required Modal (Matching User Screenshot with Ownership) */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-slate-900 border border-slate-200 space-y-5 animate-fadeIn">
            {!isUnlocked ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (unlockInput.trim().toLowerCase() === firstName.trim().toLowerCase()) {
                    setIsUnlocked(true);
                    setUnlockError('');
                  } else {
                    setUnlockError(`Incorrect password. Password is owner's first name (${firstName}).`);
                  }
                }}
                className="space-y-4 text-center"
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <PdfDocLockBadge size="lg" />
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">Password required</h3>
                    <p className="text-[11px] font-black uppercase text-[#00D26A] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                      PDF Document • Password Encrypted
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-snug">
                    This document is owned by <strong className="font-extrabold text-slate-950 underline">{firstName}</strong> ({firstName} {secondName}). Please enter the password to open.
                  </p>
                </div>

                <div className="text-left pt-1">
                  <input
                    type="password"
                    value={unlockInput ?? ''}
                    onChange={(e) => {
                      setUnlockInput(e.target.value);
                      if (unlockError) setUnlockError('');
                    }}
                    placeholder="Enter password..."
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl border-b-2 border-blue-600 focus:outline-none text-slate-900 font-medium text-base placeholder:text-slate-400"
                    autoFocus
                  />
                  {unlockError && (
                    <p className="text-xs text-rose-600 font-semibold mt-1.5">{unlockError}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnlockModal(false);
                      setUnlockInput('');
                      setUnlockError('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full transition-all shadow"
                  >
                    Submit
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-emerald-100 text-[#00D26A] rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-[#00D26A] stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Document Unlocked!</h3>
                <p className="text-xs text-slate-600">
                  Verified Owner: <strong className="font-bold text-slate-900">{firstName} {secondName}</strong>
                </p>
                <div className="p-4 bg-slate-50 rounded-xl text-left text-xs font-mono text-slate-800 space-y-1 border border-slate-200">
                  <p className="font-bold text-emerald-700">✓ {selectedPaper?.paper_title} ({selectedPaper?.unit_code})</p>
                  <p>✓ Marking Scheme &amp; Solutions Included</p>
                  <p>✓ Status: Read-Only Official Document</p>
                </div>
                <button
                  onClick={() => {
                    setShowUnlockModal(false);
                    setIsUnlocked(false);
                    setUnlockInput('');
                  }}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Close Preview
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
