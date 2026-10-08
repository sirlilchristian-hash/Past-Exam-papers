import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Search,
  Key,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  RotateCcw,
  Loader2,
  Mail,
} from 'lucide-react';
import { TransactionRecord, DeviceRequest } from './adminTypes';

interface DocumentAccessItem {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  paperTitle: string;
  unitCode: string;
  mpesaReceipt: string;
  activationStatus: string;
  documentAccessStatus: string;
  devicesUsed: number;
  maxDevices: number;
  lastAccessedAt: string | null;
  openDocumentUrl: string;
  deviceDetails: Array<{ id: string; downloadedAt: string }>;
}

interface AdminDocumentAccessViewProps {
  transactions: TransactionRecord[];
  deviceRequests?: DeviceRequest[];
  onNavigateToDeviceRequests?: () => void;
  onNavigateToOrder?: (orderId: string) => void;
}

export const AdminDocumentAccessView: React.FC<AdminDocumentAccessViewProps> = ({
  transactions,
  deviceRequests = [],
  onNavigateToDeviceRequests,
  onNavigateToOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accessList, setAccessList] = useState<DocumentAccessItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDocumentAccess = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/document-access', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAccessList(data);
      }
    } catch (err) {
      console.error('Failed to load document access entitlements', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentAccess();
  }, []);

  const handleCopyLink = (orderId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleResetDevices = async (orderId: string) => {
    if (!confirm('Are you sure you want to reset all registered hardware devices for this purchase? The customer will be able to re-register up to 3 new devices.')) {
      return;
    }
    try {
      setResettingId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}/reset-devices`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Registered devices for order ${orderId.slice(0, 8)} successfully reset!` });
        await fetchDocumentAccess();
      } else {
        const d = await res.json();
        setStatusMsg({ type: 'error', text: d.error || 'Failed to reset devices' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection error' });
    } finally {
      setResettingId(null);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  // If server items loaded, filter them; otherwise fallback to completed transactions
  const displayItems = accessList.length > 0
    ? accessList.filter((item) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return (
          item.customerName.toLowerCase().includes(term) ||
          item.customerPhone.toLowerCase().includes(term) ||
          item.unitCode.toLowerCase().includes(term) ||
          item.paperTitle.toLowerCase().includes(term) ||
          item.orderId.toLowerCase().includes(term) ||
          item.mpesaReceipt.toLowerCase().includes(term)
        );
      })
    : transactions
        .filter((t) => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'paid')
        .map((tx) => ({
          orderId: tx.id,
          createdAt: tx.timestamp || new Date().toISOString(),
          customerName: `${tx.studentFirstName || ''} ${tx.studentSecondName || ''}`.trim() || 'Customer',
          customerPhone: tx.phone || '—',
          paperTitle: tx.paper_title || tx.unitName || 'Examination Paper',
          unitCode: tx.unit_code || tx.unitCode || 'UNIT',
          mpesaReceipt: tx.mpesaReceipt || 'PAID',
          activationStatus: 'paid',
          documentAccessStatus: 'ACTIVE',
          devicesUsed: 1,
          maxDevices: 3,
          lastAccessedAt: tx.timestamp || null,
          openDocumentUrl: `${window.location.origin}/document/access/${tx.id}`,
          deviceDetails: [],
        }))
        .filter((item) => {
          const term = searchTerm.toLowerCase().trim();
          if (!term) return true;
          return (
            item.customerName.toLowerCase().includes(term) ||
            item.customerPhone.toLowerCase().includes(term) ||
            item.unitCode.toLowerCase().includes(term) ||
            item.paperTitle.toLowerCase().includes(term) ||
            item.orderId.toLowerCase().includes(term)
          );
        });

  return (
    <div className="space-y-6">
      {/* Security Architecture Explainer Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-[#00D26A]/30 text-[#00D26A] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-white">
              AES-256-GCM Protected Document Delivery &amp; 3-Device Enforcement
            </h2>
          </div>

          <button
            type="button"
            onClick={fetchDocumentAccess}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00D26A]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Godrery Publishers secures copyrighted past examination papers using authenticated AES-256-GCM tokenized links. Each purchase is cryptographically bound to a maximum of 3 authorized hardware devices. Direct PDF download links are never exposed to clients; rendering occurs strictly through the secure in-browser viewer.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#00D26A] shrink-0" />
            <div>
              <div className="font-bold text-white">AES-256-GCM Tokens</div>
              <div className="text-[10px] text-slate-400">Cryptographic payload authentication</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="font-bold text-white">3-Device Hard Cap</div>
              <div className="text-[10px] text-slate-400">Fingerprinted device binding</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Password Key System</div>
              <div className="text-[10px] text-slate-400">6-character unique unlocking key</div>
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-[#00D26A]/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Access Directory Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              <span>Authorized Document Access Entitlements</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00D26A]/20 text-[#00D26A] border border-[#00D26A]/30">
                {displayItems.length} Active Entitlements
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Post-purchase document authorization records, device binding limits, and secure links
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student, unit code, or order ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00D26A]"
            />
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {isLoading ? 'Loading active document entitlements...' : 'No active document access entitlements found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Unit Code</th>
                  <th className="py-3 px-3">Paper Title</th>
                  <th className="py-3 px-3">Receipt</th>
                  <th className="py-3 px-3">Authorized Devices</th>
                  <th className="py-3 px-3">Access Link</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayItems.map((item) => {
                  const isNearCap = item.devicesUsed >= item.maxDevices;
                  const isResetting = resettingId === item.orderId;
                  const isCopied = copiedId === item.orderId;

                  return (
                    <tr key={item.orderId} className="hover:bg-slate-800/40 transition-colors">
                      {/* Order ID */}
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {item.orderId ? `${item.orderId.slice(0, 8)}...` : '—'}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        {item.customerName}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {item.customerPhone}
                      </td>

                      {/* Unit Code */}
                      <td className="py-3 px-3 font-mono font-extrabold text-[#00D26A] whitespace-nowrap">
                        {item.unitCode}
                      </td>

                      {/* Paper Title */}
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={item.paperTitle}>
                        {item.paperTitle}
                      </td>

                      {/* Receipt */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                        {item.mpesaReceipt || '—'}
                      </td>

                      {/* Device Bound Limit */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className={`w-3.5 h-3.5 ${isNearCap ? 'text-amber-400' : 'text-sky-400'}`} />
                          <span className={`font-mono font-extrabold text-xs ${isNearCap ? 'text-amber-400' : 'text-slate-200'}`}>
                            {item.devicesUsed} / {item.maxDevices}
                          </span>
                          {isNearCap && onNavigateToDeviceRequests && (
                            <button
                              type="button"
                              onClick={onNavigateToDeviceRequests}
                              className="ml-1 text-[10px] text-amber-400 underline hover:text-amber-300"
                              title="View pending device requests"
                            >
                              Requests
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Secure Open Document Link */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item.orderId, item.openDocumentUrl)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                            title="Copy customer's secure access link"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#00D26A]" />
                                <span className="text-[#00D26A] font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={item.openDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-[#00D26A] border border-slate-700 transition-colors"
                            title="Open document in secure viewer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Actions: Reset Devices */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleResetDevices(item.orderId)}
                          disabled={isResetting}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          title="Clear registered hardware devices for customer re-registration"
                        >
                          {isResetting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                          )}
                          <span>Reset Devices</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
