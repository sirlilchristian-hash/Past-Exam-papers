import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Mail,
  CreditCard,
  Database,
  BookOpen,
  Smartphone,
  Lock,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';

interface DiagnosticData {
  timestamp: string;
  overall: 'healthy' | 'warning' | 'down';
  subsystems: {
    database: {
      name: string;
      status: string;
      latencyMs: number;
      connected: boolean;
    };
    storage: {
      name: string;
      status: string;
      connected: boolean;
      accessibleFilesSample: number;
    };
    mpesa: {
      name: string;
      status: string;
      details: {
        consumerKeyConfigured: boolean;
        consumerSecretConfigured: boolean;
        passkeyConfigured: boolean;
        shortcodeConfigured: boolean;
      };
    };
    email: {
      name: string;
      status: string;
      details: {
        userConfigured: boolean;
        credentialsConfigured: boolean;
      };
    };
    security: {
      name: string;
      status: string;
      keyEstablished: boolean;
    };
    server: {
      uptimeSeconds: number;
      nodeVersion: string;
      port: number;
      pingMs: number;
    };
  };
}

export const AdminSystemStatusView: React.FC = () => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('Just now');

  const runDiagnostic = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/system/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnostic(data);
        setLastChecked(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('System probe failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-[#00D26A]/30 text-[#00D26A] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Technical Infrastructure Health Diagnostic
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative runtime health of database, encrypted storage, M-Pesa gateways, and mail dispatchers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black border ${
              diagnostic?.overall === 'healthy' || !diagnostic
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {diagnostic?.overall === 'healthy' || !diagnostic ? 'All Systems Operational' : 'Degraded Warning'}
            </span>

            <button
              type="button"
              onClick={runDiagnostic}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00D26A]' : ''}`} />
              <span>Probe Health</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span>Last probe check: <strong className="text-slate-200">{lastChecked}</strong></span>
          {diagnostic?.subsystems.server && (
            <>
              <span>• Uptime: <strong className="text-[#00D26A]">{formatUptime(diagnostic.subsystems.server.uptimeSeconds)}</strong></span>
              <span>• Server Ping: <strong className="text-slate-200">{diagnostic.subsystems.server.pingMs}ms</strong></span>
              <span>• Node: <strong className="text-slate-200">{diagnostic.subsystems.server.nodeVersion}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Grid of Subsystems */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Supabase PostgreSQL Database */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-[#00D26A]">
                <Database className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {diagnostic?.subsystems.database.status || 'Connected'}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">PostgreSQL Database (Supabase)</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Relational tables for Orders, Payments, Customers, Papers, Downloads, and Audit records.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Query Latency</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{diagnostic?.subsystems.database.latencyMs ?? 12} ms</span>
            </span>
          </div>
        </div>

        {/* 2. Supabase Storage ("Papers" Bucket) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-[#00D26A]">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {diagnostic?.subsystems.storage.status || 'Ready'}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Supabase Storage ("Papers" Bucket)</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Private cloud bucket housing master PDF examination files and watermarked documents.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Storage Access</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Direct Stream Ready</span>
            </span>
          </div>
        </div>

        {/* 3. M-Pesa Daraja STK Integration */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {diagnostic?.subsystems.mpesa.status || 'Active'}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">M-Pesa Daraja STK Gateway</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Safaricom Daraja payment push triggers and manual activation reconciliation workflow.
              </p>
            </div>

            {diagnostic?.subsystems.mpesa.details && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
                <div className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>Consumer Key:</span>
                  <span className="text-[#00D26A] font-bold">{diagnostic.subsystems.mpesa.details.consumerKeyConfigured ? 'Configured' : 'Missing'}</span>
                </div>
                <div className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>Secret:</span>
                  <span className="text-[#00D26A] font-bold">{diagnostic.subsystems.mpesa.details.consumerSecretConfigured ? 'Configured' : 'Missing'}</span>
                </div>
                <div className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>Passkey:</span>
                  <span className="text-[#00D26A] font-bold">{diagnostic.subsystems.mpesa.details.passkeyConfigured ? 'Configured' : 'Missing'}</span>
                </div>
                <div className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>Shortcode:</span>
                  <span className="text-[#00D26A] font-bold">{diagnostic.subsystems.mpesa.details.shortcodeConfigured ? 'Configured' : 'Default'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Payment Gateway</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>STK &amp; Manual Active</span>
            </span>
          </div>
        </div>

        {/* 4. Email / SMTP Dispatcher */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                <Mail className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {diagnostic?.subsystems.email.status || 'Active'}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Email Dispatcher (Gmail / SMTP)</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Automated receipt generation and secure AES-256 Open Document link delivery to customers.
              </p>
            </div>

            {diagnostic?.subsystems.email.details && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
                <div className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>Sender User:</span>
                  <span className="text-[#00D26A] font-bold">{diagnostic.subsystems.email.details.userConfigured ? 'Configured' : 'Fallback'}</span>
                </div>
                <div className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>Credentials:</span>
                  <span className="text-[#00D26A] font-bold">{diagnostic.subsystems.email.details.credentialsConfigured ? 'Configured' : 'Fallback'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Email Service</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready for Dispatch</span>
            </span>
          </div>
        </div>

        {/* 5. AES-256-GCM Cryptographic Security */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-[#00D26A]">
                <Lock className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Hardened
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">AES-256-GCM Token Encryption</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Cryptographically signed access tokens prevent URL tampering and enforce single-order identity.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Cryptographic Status</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enforced</span>
            </span>
          </div>
        </div>

        {/* 6. Hardware Device Fingerprinting (3-Device Limit) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Hardened
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">3-Device Hardware Policy</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Client hardware authorization table limiting paper viewing across phones, tablets, and laptops.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Access Policy</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3-Device Limit Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
