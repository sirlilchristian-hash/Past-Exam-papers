import React, { useState } from 'react';
import { FileText, ArrowRight, AlertTriangle, CheckCircle2, Loader2, ArrowLeft, Shield , MonitorSmartphone  } from 'lucide-react';

interface ViewYourDocumentViewProps {
  onBackToHome?: () => void;
  onSearchClick?: () => void;
}

interface FoundPaper {
  paper_title: string;
  unit_code: string;
  access_status: string;
}

export const ViewYourDocumentView: React.FC<ViewYourDocumentViewProps> = ({
  onBackToHome,
  onSearchClick,
}) => {
  const [mpesaCode, setMpesaCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [foundDoc, setFoundDoc] = useState<{
    paper: FoundPaper;
    accessToken: string;
    accessUrl: string;
    deviceStatus?: { count: number; limit: number; hasPendingRequest: boolean };
  } | null>(null);

  const handleFindDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaCode.trim() || !firstName.trim() || !secondName.trim()) {
      setError('Please provide the M-Pesa Transaction Code, First Name, and Second Name.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/document/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode: mpesaCode.trim(),
          firstName: firstName.trim(),
          secondName: secondName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No matching document purchase found.');
      }

      setFoundDoc({
        paper: data.paper,
        accessToken: data.accessToken,
        accessUrl: data.accessUrl,
        deviceStatus: data.deviceStatus,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching for your document.');
    } finally {
      setIsLoading(false);
    }
  };

    const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const handleRequestDevice = async () => {
    if (!foundDoc?.accessToken) return;
    setIsRequesting(true);
    setRequestMessage(null);
    try {
      const res = await fetch('/api/document/request-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: foundDoc.accessToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      
      setRequestMessage('Request submitted successfully. An administrator will review it shortly.');
      // Update local state to reflect pending
      if (foundDoc && foundDoc.deviceStatus) {
        setFoundDoc({
          ...foundDoc,
          deviceStatus: { ...foundDoc.deviceStatus, hasPendingRequest: true }
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenDocument = () => {
    if (foundDoc?.accessUrl) {
      window.location.href = foundDoc.accessUrl;
    }
  };

  const handleReset = () => {
    setFoundDoc(null);
    setError(null);
    setMpesaCode('');
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          VIEW YOUR <span className="text-[#00D26A]">DOCUMENT</span>
        </h1>
        <p className="text-sm text-[#a1cbb2]">
          Access a document you have already purchased.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-[#031d12]/90 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00D26A]/10 rounded-full blur-2xl pointer-events-none" />

        {/* State 1: Document Found */}
        {foundDoc ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00D26A]/20 border border-[#00D26A]/40 flex items-center justify-center mx-auto shadow-lg shadow-[#00D26A]/10">
              <CheckCircle2 className="w-8 h-8 text-[#00D26A]" />
            </div>

            <div className="space-y-2">
              <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-[#00D26A] bg-[#00D26A]/10 px-3 py-1 rounded-full border border-[#00D26A]/30">
                DOCUMENT FOUND
              </span>
              <h2 className="text-2xl font-black text-white leading-tight">
                {foundDoc.paper.paper_title}
              </h2>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                  Unit Code: {foundDoc.paper.unit_code}
                </span>
                <span className="text-xs font-bold text-[#00D26A] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Verified Purchase
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={handleOpenDocument}
                className="w-full py-4 bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-base rounded-xl transition-all shadow-xl shadow-[#00D26A]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>OPEN DOCUMENT</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>


              {foundDoc.deviceStatus && (
                <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                      <MonitorSmartphone className="w-4 h-4 text-[#00D26A]" />
                      Authorized Devices
                    </div>
                    <div className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-white">
                      {foundDoc.deviceStatus.count} / {foundDoc.deviceStatus.limit}
                    </div>
                  </div>
                  
                  {foundDoc.deviceStatus.count >= foundDoc.deviceStatus.limit && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      {foundDoc.deviceStatus.hasPendingRequest ? (
                        <div className="text-xs text-[#00D26A] bg-[#00D26A]/10 border border-[#00D26A]/20 p-2 rounded flex items-center justify-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Device Request Pending Approval
                        </div>
                      ) : (
                        <div>
                          <p className="text-[11px] text-rose-300 mb-2 leading-relaxed">
                            You have reached your maximum authorized devices limit. You can request an exception from our administrators.
                          </p>
                          <button
                            type="button"
                            onClick={handleRequestDevice}
                            disabled={isRequesting}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-2"
                          >
                            {isRequesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Request Additional Device
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {requestMessage && (
                    <div className="mt-2 text-xs text-[#00D26A] text-center font-medium">
                      {requestMessage}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Find Another Purchased Document
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Input Form */
          <form onSubmit={handleFindDocument} className="space-y-5 text-left">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide mb-1.5">
                M-Pesa Transaction Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                placeholder="e.g. QKT27X89LM"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-white font-mono text-sm placeholder-slate-500 outline-none transition-all uppercase"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The 10-character code received from M-Pesa when you made your payment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide mb-1.5">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-white text-sm placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide mb-1.5">
                  Second Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={secondName}
                  onChange={(e) => setSecondName(e.target.value)}
                  placeholder="e.g. Kamau"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-white text-sm placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !mpesaCode.trim() || !firstName.trim() || !secondName.trim()}
              className="w-full py-4 mt-2 bg-[#00D26A] hover:bg-[#00b85c] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold rounded-xl transition-all shadow-xl shadow-[#00D26A]/20 flex items-center justify-center gap-2 text-base cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching Purchase Records...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                  <span>FIND MY DOCUMENT</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#00D26A]" />
                <span>Protected by 3-device secure document access.</span>
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Navigation aid */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <button
          onClick={onBackToHome}
          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </button>

        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="hover:text-[#00D26A] transition-colors cursor-pointer"
          >
            Looking to purchase a new paper? Search Papers →
          </button>
        )}
      </div>
    </div>
  );
};
