import React, { useState, useEffect } from 'react';
import { Shield, Loader2, KeyRound, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';

export function DocumentAccessView() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [requireNames, setRequireNames] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Extract token from path: /document/access/<token>
    const path = window.location.pathname;
    const match = path.match(/\/document\/access\/(.+)/);
    if (match && match[1]) {
      const t = match[1];
      setToken(t);
      verifyToken(t);
    } else {
      setError("Invalid or missing access link.");
      setLoading(false);
    }
  }, []);

  const verifyToken = async (t: string) => {
    try {
      const res = await fetch('/api/document/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t })
      });
      const data = await res.json();
      if (data.success) {
        setVerified(true);
      } else if (data.requireNames) {
        setRequireNames(true);
      } else {
        setError(data.error || 'Access denied');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNames = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/document/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, firstName, secondName })
      });
      const data = await res.json();
      if (data.success) {
        setRequireNames(false);
        setVerified(true);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#052b1b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D26A]" />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="w-full h-screen bg-[#052b1b] flex flex-col">
        <div className="w-full bg-[#031d12] border-b border-slate-800 p-3 sm:px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-sm font-bold text-white tracking-wide">Secure Document Access</h1>
          </div>
          <button onClick={() => window.location.href = '/'} className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        </div>
        <div className="flex-grow w-full relative bg-slate-900/50">
           <iframe 
             src={`/api/document/stream/${token}`} 
             className="w-full h-full border-none"
             title="Secure PDF Viewer"
           />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#052b1b] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
            {error ? <AlertTriangle className="w-8 h-8 text-rose-500" /> : <Shield className="w-8 h-8 text-[#00D26A]" />}
          </div>
          
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {error ? "Access Denied" : "Verify Identity"}
            </h2>
            <p className="text-sm text-slate-500 leading-snug">
              {error ? error : "Please confirm the names used during purchase to register this device for access."}
            </p>
            {!error && requireNames && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-left">
                <p className="text-xs text-amber-800 font-medium flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span><strong>Important:</strong> This document can only be opened on up to 3 devices. Once a device is registered, it counts toward your 3-device limit.</span>
                </p>
              </div>
            )}
          </div>

          {!error && requireNames && (
            <form onSubmit={handleVerifyNames} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 outline-none transition-all"
                  placeholder="e.g. John"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Second Name
                </label>
                <input
                  type="text"
                  required
                  value={secondName}
                  onChange={e => setSecondName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#00D26A] focus:ring-2 focus:ring-[#00D26A]/20 text-slate-900 outline-none transition-all"
                  placeholder="e.g. Kamau"
                />
              </div>
              
              <button
                type="submit"
                disabled={isVerifying || !firstName.trim() || !secondName.trim()}
                className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    <span>OPEN DOCUMENT</span>
                  </>
                )}
              </button>
            </form>
          )}

          {error && (
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all"
            >
              Return Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
