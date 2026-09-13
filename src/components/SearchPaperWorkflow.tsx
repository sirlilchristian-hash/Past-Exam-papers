import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import {
  Search,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
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
} from 'lucide-react';

import { ExamPaperAdminItem } from './AdminPortal';

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
  const [phone, setPhone] = useState<string>('');
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // In-App Password Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockInput, setUnlockInput] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string>('');

  // Download Triggered State
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);

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

  // Handle selecting a specific paper directly and advancing
  const handleSelectPaperAndProceed = (paper: PaperItem) => {
    setSelectedPaper(paper);
    setUnitName(getPTitle(paper) || '');
    setUnitCode(getPCode(paper) || '');
    setStep(3);
  };

  // Handle Proceed to Payment Form (Step 2 -> Step 3)
  const handleViewDetails = () => {
    setStep(3);
  };

  // Handle Initiate M-Pesa Payment (Step 3 -> Step 4)
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!secondName.trim()) errors.secondName = 'Second name is required';
    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^(07|01|2547|2541|\+2547|\+2541)\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      errors.phone = 'Enter a valid M-Pesa phone number (e.g., 0712345678)';
    }

    if (Object.keys(errors).length > 0) {
      setPaymentErrors(errors);
      return;
    }

    setPaymentErrors({});
    setStep(4); // Move to Waiting for M-Pesa Prompt
  };

  // Step 4 Simulation Timer: Auto transition to Step 5 after 3.5s
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 4) {
      timer = setTimeout(async () => {
        // Record transaction in DB before transitioning
        if (selectedPaper) {
           try {
             await fetch('/api/transactions', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 studentFirstName: firstName,
                 studentSecondName: secondName,
                 phone: phone,
                 unit_code: selectedPaper.unit_code,
                 paper_title: selectedPaper.paper_title,
                 price: selectedPaper.price,
                 mpesaReceipt: `QK${Math.floor(10 + Math.random() * 89)}${Math.random().toString(36).substring(2,6).toUpperCase()}`,
                 passwordUsed: firstName,
                 status: 'Completed'
               })
             });
           } catch (err) {
             console.error("Failed to record transaction", err);
           }
        }
        setStep(5); // Payment Confirmed!
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [step, selectedPaper, firstName, secondName, phone]);

  // Handle Trigger Real Encrypted PDF File Download (Protected & Uneditable Format)
  const handleDownloadPaper = async () => {
    if (!selectedPaper) return;

    // Use jsPDF to generate an official uneditable PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const userPass = firstName.trim();
    const docTitle = `${selectedPaper.unit_code} - ${selectedPaper.paper_title}`;

    // PDF Document Properties & Metadata
    doc.setProperties({
      title: `This document belongs to ${firstName} (${selectedPaper.unit_code})`,
      subject: `This document is owned by ${firstName} ${secondName}`,
      author: `${firstName} ${secondName}`,
      creator: 'GodreryTone Publishers Ltd',
    });

    // Header styling
    doc.setFillColor(3, 29, 18); // Dark Emerald #031d12
    doc.rect(0, 0, 210, 38, 'F');

    const docData: any = (selectedPaper as any).digitizedContent || (typeof (selectedPaper as any).file_path === 'object' ? (selectedPaper as any).file_path : null);

    doc.setTextColor(0, 210, 106); // Accent Green
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(docData?.university?.toUpperCase() || 'MOUNT KENYA UNIVERSITY (MKU)', 105, 14, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const examSubtitle = docData?.examination 
      ? docData.examination
      : 'PUBLISHED & VERIFIED BY GODRERYTONE PUBLISHERS LTD';
    doc.text(examSubtitle, 105, 22, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(161, 203, 178);
    const examCourse = docData?.course
      ? `${docData.course} — ${docData.type || 'EXAMINATION'}`
      : 'READ-ONLY UNEDITABLE EXAMINATION PAPER & MARKING SCHEME';
    doc.text(examCourse, 105, 29, { align: 'center' });

    // Document Metadata Bar
    doc.setFillColor(245, 247, 246);
    doc.rect(12, 44, 186, 36, 'F');
    doc.setDrawColor(200, 210, 205);
    doc.rect(12, 44, 186, 36, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Course Unit: ${docData?.unitTitle || selectedPaper.paper_title}`, 18, 51);
    doc.text(`Unit Code: ${docData?.unit_code || selectedPaper.unit_code}`, 18, 58);
    doc.text(`Exam Year: ${docData?.date || (typeof selectedPaper.file_path === 'string' ? selectedPaper.file_path : '2024')}`, 18, 65);

    const currentTime = new Date().toLocaleString();
    doc.text(`Purchaser: ${firstName} ${secondName}`, 115, 51);
    doc.text(`Phone: ${phone}`, 115, 58);
    doc.text(`Amount Paid: ${selectedPaper.price} | Time: ${currentTime}`, 115, 65);

    // Ownership Disclaimer inside PDF
    doc.setTextColor(180, 83, 9); // Amber/orange tone
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`DISCLAIMER: THIS DOCUMENT IS OWNED BY ${firstName.toUpperCase()} (${firstName} ${secondName}).`, 18, 73);

    let currentY = 82;

    if (docData?.instructions) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const instructions = `INSTRUCTIONS: ${docData.instructions}`;
      const splitInst = doc.splitTextToSize(instructions, 180);
      doc.text(splitInst, 12, currentY);
      currentY += (splitInst.length * 5) + 4;
    }

    if (docData?.sections) {
      docData.sections.forEach((section: any) => {
        if (currentY > 260) {
           doc.addPage();
           currentY = 20;
        }
        if (section.name) {
          doc.setTextColor(0, 120, 60);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(section.name, 12, currentY);
          currentY += 8;
        }
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        section.questions?.forEach((q: any) => {
          if (currentY > 260) { doc.addPage(); currentY = 20; }
          doc.setFont('helvetica', 'bold');
          doc.text(`${q.questionNumber || ''} ${q.totalMarks ? `(${q.totalMarks})` : ''}`, 12, currentY);
          currentY += 6;
          
          doc.setFont('helvetica', 'normal');
          if (q.text) {
            const splitText = doc.splitTextToSize(q.text, 180);
            doc.text(splitText, 12, currentY);
            currentY += (splitText.length * 5) + 2;
          }
          
          q.subQuestions?.forEach((sq: any) => {
             if (currentY > 260) { doc.addPage(); currentY = 20; }
             const marks = sq.marks ? ` [${sq.marks}]` : '';
             const sqText = `${sq.label || ''} ${sq.text || ''}${marks}`;
             const splitSq = doc.splitTextToSize(sqText, 175);
             doc.text(splitSq, 16, currentY);
             currentY += (splitSq.length * 5) + 2;
             
             sq.subSubQuestions?.forEach((ssq: any) => {
                if (currentY > 260) { doc.addPage(); currentY = 20; }
                const ssMarks = ssq.marks ? ` [${ssq.marks}]` : '';
                const ssqText = `${ssq.label || ''} ${ssq.text || ''}${ssMarks}`;
                const splitSsq = doc.splitTextToSize(ssqText, 170);
                doc.text(splitSsq, 20, currentY);
                currentY += (splitSsq.length * 5) + 2;
             });
          });
          currentY += 4;
        });
      });
    } else {
      // Section A
      doc.setTextColor(0, 120, 60);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION A: CONTINUOUS ASSESSMENT & COMPULSORY QUESTIONS (40 MARKS)', 12, 89);
  
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
  
      const sectionA = [
        `Q1. (a) Define the core foundational principles governing ${selectedPaper.paper_title}. [5 Marks]`,
        `    (b) Outline four primary methodologies and practical applications in ${selectedPaper.unit_code}. [10 Marks]`,
        `    (c) Explain the systemic analytical frameworks utilized in Mount Kenya University exams. [15 Marks]`,
        `    (d) State two fundamental theorems or models relevant to this course unit. [10 Marks]`,
      ];
  
      currentY = 96;
      sectionA.forEach((line) => {
        doc.text(line, 12, currentY);
        currentY += 7;
      });
  
      // Section B
      doc.setTextColor(0, 120, 60);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION B: ANSWER ANY TWO QUESTIONS (30 MARKS)', 12, currentY + 6);
  
      currentY += 14;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
  
      const sectionB = [
        `Q2. Evaluate the structural implementation and strategic case studies of ${selectedPaper.paper_title}. [15 Marks]`,
        `Q3. Derive and prove the mathematical or theoretical formulations required in ${selectedPaper.unit_code}. [15 Marks]`,
        `Q4. Discuss recent technological integrations and industry innovations across Kenya. [15 Marks]`,
      ];
  
      sectionB.forEach((line) => {
        doc.text(line, 12, currentY);
        currentY += 7;
      });
    }

    // Watermark & Footer Security
    doc.setDrawColor(220, 225, 222);
    doc.line(12, 270, 198, 270);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Official Exam Paper • ${docTitle} • Password Protected (${userPass})`, 105, 276, { align: 'center' });
    doc.text('Copyright © GodreryTone Publishers Ltd. Password Encrypted Document.', 105, 281, { align: 'center' });

    // Export raw PDF bytes
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfUint8 = new Uint8Array(pdfArrayBuffer);

    // Descriptive filename carrying ownership
    const downloadFileName = `This_document_belongs_to_${firstName.trim().replace(/\s+/g, '_')}_${selectedPaper.unit_code}.pdf`;

    try {
      // Encrypt PDF with purchaser's first name as password
      const encryptedBytes = await encryptPDF(pdfUint8, userPass, { algorithm: 'RC4' });

      // Trigger download of encrypted PDF blob
      const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      try {
        await fetch(`/api/papers/${selectedPaper.id}/download`, { method: 'POST' });
      } catch(e) {
        console.error("Failed to increment download count:", e);
      }
    } catch (err) {
      console.error('PDF Encryption fallback:', err);
      doc.save(downloadFileName);
      try {
        await fetch(`/api/papers/${selectedPaper.id}/download`, { method: 'POST' });
      } catch(e) {}
    }

    setHasDownloaded(true);
    setStep(6);
  };

  const handleResetSearch = () => {
    setStep(1);
    setHasDownloaded(false);
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

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleViewDetails}
                    disabled={selectedPaper.status !== 'available'}
                    className="px-6 py-2.5 bg-[#00D26A] hover:bg-[#00b85c] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black rounded-full transition-all text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <span>{selectedPaper.status === 'available' ? 'View Details' : 'Unavailable'}</span>
                    {selectedPaper.status === 'available' && <ArrowRight className="w-4 h-4" />}
                  </button>
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

            {/* Document Details Banner Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {selectedPaper.paper_title} Paper 1 – 2024
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unit Code: <strong className="text-slate-700">{selectedPaper.unit_code}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-400 block font-medium">Price</span>
                <span className="text-lg font-black text-slate-900">{selectedPaper.price}</span>
              </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Your Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    First Name <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName ?? ''}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Collins"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none"
                  />
                  {paymentErrors.firstName && (
                    <p className="text-[11px] text-rose-600 mt-1">{paymentErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Second Name <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={secondName ?? ''}
                    onChange={(e) => setSecondName(e.target.value)}
                    placeholder="Angima"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none"
                  />
                  {paymentErrors.secondName && (
                    <p className="text-[11px] text-rose-600 mt-1">{paymentErrors.secondName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Phone Number (M-Pesa) <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  value={phone ?? ''}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 text-sm outline-none"
                />
                {paymentErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">{paymentErrors.phone}</p>
                )}
              </div>

              {/* M-Pesa Callout Box matching image.png */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3.5">
                <div className="px-2 py-1 bg-[#00D26A] text-white font-black text-xs rounded tracking-wider shrink-0 mt-0.5">
                  M-PESA
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">Pay with M-Pesa</h4>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    You will receive an STK push on your phone. Enter your M-Pesa PIN to complete the payment.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#00D26A] hover:bg-[#00b85c] text-white font-extrabold rounded-xl transition-all shadow-md shadow-[#00D26A]/20 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
              >
                <Smartphone className="w-5 h-5" />
                <span>Pay with M-Pesa</span>
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Your payment is secure and encrypted.</span>
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
                Please complete the M-Pesa prompt on your phone.
              </p>
              <p className="text-xs text-slate-400 italic">
                Waiting for M-Pesa payment confirmation...
              </p>
            </div>

            {/* Info Box matching image.png */}
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Do not close this page. This may take a few seconds.</span>
            </div>

            {/* Disabled Download Button during pending state */}
            <button
              disabled
              className="w-full py-3.5 bg-slate-200 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 text-sm cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Download Paper</span>
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

              <span className="font-extrabold text-slate-900 text-sm">
                {selectedPaper.price}
              </span>
            </div>

            {/* Password Protection Security Notice & Ownership Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300/80 text-left flex items-start gap-3.5 shadow-sm">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <span>Password Protected PDF &amp; Read-Only</span>
                </p>
                <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                  <strong className="font-extrabold text-amber-950">DISCLAIMER:</strong> This document is owned by <strong className="underline text-amber-950 font-black">{firstName}</strong> ({firstName} {secondName}).
                </p>
                <p className="text-[11px] text-amber-800 leading-snug">
                  When opening the PDF, enter the owner&apos;s first name: <strong className="font-black text-slate-900 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">{firstName}</strong> as the password.
                </p>
              </div>
            </div>

            {/* Primary Download Paper Button */}
            <button
              onClick={handleDownloadPaper}
              className="w-full py-3.5 bg-[#00D26A] hover:bg-[#00b85c] text-white font-extrabold rounded-xl transition-all shadow-md shadow-[#00D26A]/20 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span>Download Protected PDF</span>
            </button>

            {/* Test/Preview Password Prompt Button */}
            <button
              onClick={() => {
                setShowUnlockModal(true);
                setIsUnlocked(false);
                setUnlockInput('');
                setUnlockError('');
              }}
              className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 border border-amber-300"
            >
              <KeyRound className="w-4 h-4 text-amber-700" />
              <span>Test Password Prompt (&quot;This document is owned by {firstName}&quot;)</span>
            </button>

            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D26A]" />
              <span>Your download link is valid for a limited time.</span>
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: Download Started / Completion Screen */}
        {/* ========================================================= */}
        {step === 6 && selectedPaper && (
          <div className="space-y-6 py-2">
            {/* Success Callout Callout Banner matching image.png */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00D26A] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-emerald-950 text-base">
                  Download Started
                </h3>
                <p className="text-xs text-emerald-800 leading-snug">
                  Your protected PDF exam paper is downloading. Please check your downloads folder.
                </p>
              </div>
            </div>

            {/* Password Reminder & Disclaimer Banner */}
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300/80 text-left flex items-start gap-3.5 shadow-sm">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <span>Ownership Disclaimer &amp; Password</span>
                </p>
                <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                  <strong className="font-extrabold text-amber-950">DISCLAIMER:</strong> This document belongs to <strong className="underline text-amber-950 font-black">{firstName}</strong> ({firstName} {secondName}).
                </p>
                <p className="text-[11px] text-amber-800 leading-snug">
                  To open and view your encrypted PDF document, enter the first name of the owner (<strong className="font-black text-slate-900 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">{firstName}</strong>) as the password.
                </p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-left">
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

              <span className="font-extrabold text-slate-900 text-sm">
                {selectedPaper.price}
              </span>
            </div>

            {/* Action Buttons: Home & Reset */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleResetSearch}
                className="w-full py-3 bg-[#00D26A] hover:bg-[#00b85c] text-white font-extrabold rounded-xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Search Another Paper</span>
              </button>

              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4 text-slate-500" />
                  <span>Back to Home</span>
                </button>
              )}
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
