import React, { useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Loader2,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Mail,
  Edit2,
  Check,
  X,
  FileText,
  User,
  Ban,
} from 'lucide-react';
import { PendingActivationOrder } from './adminTypes';

interface AdminActivateCodeViewProps {
  pendingActivations: PendingActivationOrder[] | any[];
  onActivate: (orderId: string) => void;
  activatingOrderId?: string | null;
  isActivatingId?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  manualCode?: string;
  setManualCode?: (val: string) => void;
  manualAmount?: string;
  setManualAmount?: (val: string) => void;
  onCreateManualCode?: (e: React.FormEvent) => void;
  isCreatingCode?: boolean;
  manualMsg?: string;
  onInspectOrder?: (orderId: string) => void;
}

export const AdminActivateCodeView: React.FC<AdminActivateCodeViewProps> = ({
  pendingActivations,
  onActivate,
  activatingOrderId = null,
  isActivatingId,
  onRefresh,
  isRefreshing = false,
  manualCode: extManualCode,
  setManualCode: extSetManualCode,
  manualAmount: extManualAmount,
  setManualAmount: extSetManualAmount,
  onCreateManualCode: extOnCreateManualCode,
  isCreatingCode: extIsCreatingCode = false,
  manualMsg: extManualMsg = '',
  onInspectOrder,
}) => {
  const currentActivatingId = isActivatingId !== undefined ? isActivatingId : activatingOrderId;
  const [internalManualCode, setInternalManualCode] = useState('');
  const [internalManualAmount, setInternalManualAmount] = useState('50');
  const [internalIsCreating, setInternalIsCreating] = useState(false);
  const [internalManualMsg, setInternalManualMsg] = useState('');

  // Editing M-Pesa code state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editedCode, setEditedCode] = useState<string>('');
  const [isSavingCode, setIsSavingCode] = useState(false);

  // Rejecting state
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const manualCode = extManualCode !== undefined ? extManualCode : internalManualCode;
  const setManualCode = extSetManualCode || setInternalManualCode;
  const manualAmount = extManualAmount !== undefined ? extManualAmount : internalManualAmount;
  const setManualAmount = extSetManualAmount || setInternalManualAmount;
  const isCreatingCode = extIsCreatingCode || internalIsCreating;
  const manualMsg = extManualMsg || internalManualMsg;

  const handleStartEditCode = (orderId: string, currentCode: string) => {
    setEditingOrderId(orderId);
    setEditedCode(currentCode || '');
  };

  const handleSaveEditedCode = async (orderId: string) => {
    if (!editedCode.trim()) return;
    try {
      setIsSavingCode(true);
      const res = await fetch(`/api/admin/orders/${orderId}/code`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ mpesaCode: editedCode.trim().toUpperCase() }),
      });
      if (res.ok) {
        setEditingOrderId(null);
        if (onRefresh) onRefresh();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update M-Pesa code');
      }
    } catch (err) {
      alert('Network error updating M-Pesa code');
    } finally {
      setIsSavingCode(false);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject this pending payment activation? This will mark the order as rejected.')) {
      return;
    }
    try {
      setIsRejecting(true);
      setRejectingOrderId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ reason: 'Administrative rejection' }),
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to reject order');
      }
    } catch (err) {
      alert('Network error rejecting order');
    } finally {
      setIsRejecting(false);
      setRejectingOrderId(null);
    }
  };

  const handleInternalCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (extOnCreateManualCode) {
      extOnCreateManualCode(e);
      return;
    }
    if (!manualCode.trim()) return;
    setInternalIsCreating(true);
    setInternalManualMsg('');
    try {
      const res = await fetch('/api/admin/manual-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          code: manualCode.trim().toUpperCase(),
          amount: parseInt(manualAmount, 10) || 50,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInternalManualMsg(`Success: Manual code ${manualCode.toUpperCase()} pre-authorized!`);
        setInternalManualCode('');
      } else {
        setInternalManualMsg(data.error || 'Failed to pre-authorize code.');
      }
    } catch (err) {
      setInternalManualMsg('Network error creating manual code.');
    } finally {
      setInternalIsCreating(false);
    }
  };

  const onCreateManualCode = extOnCreateManualCode || handleInternalCreate;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = pendingActivations.filter((order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const student = `${order.customers?.first_name || ''} ${order.customers?.second_name || ''}`.toLowerCase();
    const phone = (order.customers?.phone || '').toLowerCase();
    const unit = (order.Papers?.unit_code || '').toLowerCase();
    const paper = (order.Papers?.paper_title || '').toLowerCase();
    const code = (order.payments?.[0]?.mpesa_receipt || '').toLowerCase();
    const id = (order.id || '').toLowerCase();
    return (
      student.includes(term) ||
      phone.includes(term) ||
      unit.includes(term) ||
      paper.includes(term) ||
      code.includes(term) ||
      id.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-[#00D26A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00D26A]/20 text-[#00D26A] flex items-center justify-center shrink-0 mt-0.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">
              Central Manual M-Pesa Payment Activation Workspace
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Review, correct, or activate submitted M-Pesa transaction codes. Activating an order settles the payment, issues the official receipt, creates the secure Open Document link, and dispatches the customer email under the 3-device policy.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00D26A]' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Activation Queue Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              <span>Pending Manual Activation Requests</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingActivations.length} Pending
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review customer payment codes submitted through manual confirmation
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student, code, unit, order ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00D26A]"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-slate-500" />
            </div>
            <div className="text-sm font-bold text-slate-300">
              {searchTerm ? 'No matching activation requests' : 'No Pending Activations'}
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Try adjusting your search criteria or clear the input filter.'
                : 'All manual M-Pesa submissions are current. New requests submitted by students will appear in real time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px] bg-slate-950/40">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Email / Phone</th>
                  <th className="py-3 px-3">Unit Code</th>
                  <th className="py-3 px-3">Paper / Document</th>
                  <th className="py-3 px-3">M-Pesa Code</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const studentName = order.customers
                    ? `${order.customers.first_name} ${order.customers.second_name}`.trim()
                    : 'Customer';
                  const studentEmail = order.customers?.phone || '';
                  const unitCode = order.Papers?.unit_code || '—';
                  const paperTitle = order.Papers?.paper_title || 'Past Exam Paper';
                  const payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;
                  const mpesaCode = payment?.mpesa_receipt || 'PENDING';
                  const submittedDate = order.created_at
                    ? new Date(order.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';
                  const isActivating = currentActivatingId === order.id;
                  const isCurrentlyEditing = editingOrderId === order.id;
                  const isCurrentlyRejecting = rejectingOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Order ID */}
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {order.id ? `${order.id.slice(0, 8)}...` : '—'}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        {studentName}
                      </td>

                      {/* Customer Email / Contact */}
                      <td className="py-3 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {studentEmail}
                      </td>

                      {/* Unit Code */}
                      <td className="py-3 px-3 font-mono font-extrabold text-[#00D26A] whitespace-nowrap">
                        {unitCode}
                      </td>

                      {/* Paper Title */}
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={paperTitle}>
                        {paperTitle}
                      </td>

                      {/* Submitted M-Pesa Code (With inline edit capability) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isCurrentlyEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editedCode}
                              onChange={(e) => setEditedCode(e.target.value.toUpperCase())}
                              className="px-2 py-1 bg-slate-950 border border-[#00D26A] rounded text-white font-mono text-xs w-28 uppercase focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditedCode(order.id)}
                              disabled={isSavingCode}
                              className="p-1 rounded bg-[#00D26A] text-slate-950 hover:bg-[#00b85c]"
                              title="Save updated code"
                            >
                              {isSavingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingOrderId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-mono font-extrabold text-amber-300 text-xs">
                            <span>{mpesaCode}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditCode(order.id, mpesaCode)}
                              className="p-1 text-slate-500 hover:text-amber-300 transition-colors"
                              title="Edit/correct customer's submitted M-Pesa code"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        KSh {order.amount}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                        {submittedDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {order.status === 'waiting_for_activation' ? 'Waiting Review' : order.status}
                        </span>
                      </td>

                      {/* Admin Actions: Activate | Reject */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            id={`activate-btn-${order.id}`}
                            onClick={() => onActivate(order.id)}
                            disabled={isActivating || isCurrentlyRejecting}
                            className="px-3.5 py-1.5 rounded-lg bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                            title="Confirm payment, generate receipt, create access link, and dispatch email"
                          >
                            {isActivating ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Activating...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ACTIVATE</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectOrder(order.id)}
                            disabled={isActivating || isCurrentlyRejecting}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50"
                            title="Reject invalid transaction submission"
                          >
                            {isCurrentlyRejecting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual M-Pesa Code Pre-Creation Tool */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#00D26A]" />
          <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
            Manual M-Pesa Code Pre-Authorization
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Pre-register an offline or customer-care M-Pesa transaction code so the customer can enter it directly on checkout.
        </p>

        <form onSubmit={onCreateManualCode} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              M-Pesa Receipt Code
            </label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. QKH87129X"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Amount (KSh)
            </label>
            <input
              type="number"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="50"
              min="1"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isCreatingCode || !manualCode.trim() || !manualAmount.trim()}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreatingCode ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-[#00D26A]" />
                  <span>Save Manual Code</span>
                </>
              )}
            </button>
          </div>
        </form>

        {manualMsg && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold mt-2 ${
              manualMsg.toLowerCase().includes('success')
                ? 'bg-emerald-500/10 text-emerald-300 border border-[#00D26A]/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}
          >
            {manualMsg}
          </div>
        )}
      </div>
    </div>
  );
};
