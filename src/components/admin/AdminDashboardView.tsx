import React from 'react';
import {
  Clock,
  CheckCircle2,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  Smartphone,
  CreditCard,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  AdminSection,
  PendingActivationOrder,
  TransactionRecord,
  DeviceRequest,
  AffiliateRecord,
} from './adminTypes';
import { Paper } from '../../types';

interface AdminDashboardViewProps {
  pendingActivations: PendingActivationOrder[] | any[];
  transactions: TransactionRecord[];
  papers: Paper[];
  onNavigate: (section: AdminSection) => void;
  onActivate?: (orderId: string) => void;
  activatingOrderId?: string | null;
  deviceRequests?: DeviceRequest[];
  affiliates?: AffiliateRecord[];
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  pendingActivations,
  transactions,
  papers,
  onNavigate,
  onActivate,
  activatingOrderId = null,
  deviceRequests = [],
  affiliates = [],
}) => {
  // Compute Real Metrics
  const pendingCount = pendingActivations.length;
  const paidOrdersCount = transactions.filter(
    (t) => t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'paid'
  ).length;
  const availablePapersCount = papers.filter((p) => p.status === 'available').length;

  // Extract unique customers
  const uniqueCustomerKeys = new Set<string>();
  transactions.forEach((t) => {
    const key = (t.phone || `${t.studentFirstName}_${t.studentSecondName}`).trim().toLowerCase();
    if (key) uniqueCustomerKeys.add(key);
  });
  pendingActivations.forEach((o) => {
    const phone = o.customers?.phone || '';
    if (phone) uniqueCustomerKeys.add(phone.trim().toLowerCase());
  });
  const customersCount = uniqueCustomerKeys.size;

  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 4 Primary Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Activations */}
        <div
          onClick={() => onNavigate('activate_code')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            pendingCount > 0
              ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70 hover:bg-amber-950/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Activations
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                pendingCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black ${
                pendingCount > 0 ? 'text-amber-300' : 'text-white'
              }`}
            >
              {pendingCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {pendingCount === 1 ? 'order waiting' : 'orders waiting'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#00D26A]">
            <span>Process activations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 2: Paid Orders */}
        <div
          onClick={() => onNavigate('orders')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Paid Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-[#00D26A]/20 text-[#00D26A] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{paidOrdersCount}</span>
            <span className="text-xs font-semibold text-slate-400">settled orders</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200">
            <span>View order history</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 3: Customers */}
        <div
          onClick={() => onNavigate('customers')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{customersCount}</span>
            <span className="text-xs font-semibold text-slate-400">registered students</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200">
            <span>View directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metric 4: Available Papers */}
        <div
          onClick={() => onNavigate('papers')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available Papers
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{availablePapersCount}</span>
            <span className="text-xs font-semibold text-slate-400">
              of {papers.length} in catalog
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200">
            <span>Manage repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Primary Section: Pending Activations Action Queue */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Pending Manual Activation Queue
              </h2>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {pendingCount} action required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer manual M-Pesa submissions awaiting administrative approval &amp; document link dispatch
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('activate_code')}
            className="text-xs font-bold text-[#00D26A] hover:text-[#00b85c] flex items-center gap-1 shrink-0"
          >
            <span>Full Activation View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingActivations.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-[#00D26A]/30 text-[#00D26A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-200">No Pending Activations</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All manual M-Pesa requests have been verified. New customer submissions will immediately appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Email / Contact</th>
                  <th className="py-2.5 px-3">Paper &amp; Unit</th>
                  <th className="py-2.5 px-3">M-Pesa Code</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Submitted</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingActivations.map((order) => {
                  const studentName = order.customers
                    ? `${order.customers.first_name} ${order.customers.second_name}`.trim()
                    : 'Customer';
                  const studentEmail = order.customers?.phone || '';
                  const paperTitle = order.Papers?.paper_title || 'Past Exam Paper';
                  const unitCode = order.Papers?.unit_code || 'UNIT';
                  const payment = order.payments && order.payments.length > 0 ? order.payments[0] : null;
                  const mpesaCode = payment?.mpesa_receipt || 'PENDING';
                  const submittedAt = order.created_at
                    ? new Date(order.created_at).toLocaleDateString()
                    : 'Recent';
                  const isActivating = activatingOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        {studentName}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {studentEmail}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        <span className="font-bold text-[#00D26A] font-mono mr-1.5">{unitCode}</span>
                        <span className="text-slate-300">{paperTitle}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-amber-300 whitespace-nowrap">
                        {mpesaCode}
                      </td>
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        KSh {order.amount}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {submittedAt}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onActivate && onActivate(order.id)}
                          disabled={isActivating}
                          className="px-3.5 py-1.5 rounded-lg bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-Column Grid: Recent Orders & System Operational Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Recent Orders Ledger */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Recent Orders &amp; Activity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest transactions processed through automated Daraja and manual verification
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No orders recorded yet. Completed purchases will be displayed here in real time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Unit &amp; Paper</th>
                    <th className="py-2.5 px-3">Receipt</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentTransactions.map((tx) => {
                    const isCompleted =
                      tx.status?.toLowerCase() === 'completed' || tx.status?.toLowerCase() === 'paid';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                          {tx.studentFirstName} {tx.studentSecondName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs">
                          <span className="font-mono text-[#00D26A] font-bold mr-1">
                            {tx.unit_code || tx.unitCode}
                          </span>
                          <span>{tx.paper_title || tx.unitName}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                          {tx.mpesaReceipt || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                          {tx.price}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              isCompleted
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right (1 col): System Infrastructure Status */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
              Operational Status
            </h3>
            <span className="text-[11px] font-bold text-emerald-400">All Systems Nominal</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Database Service */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">PostgreSQL Database</div>
                  <div className="text-[10px] text-slate-400">Supabase connected</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>

            {/* Storage Service */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Private Storage Bucket</div>
                  <div className="text-[10px] text-slate-400">"Papers" repository</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ready
              </span>
            </div>

            {/* Email Dispatcher */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#00D26A] shrink-0" />
                <div>
                  <div className="font-bold text-white">Gmail Dispatcher</div>
                  <div className="text-[10px] text-slate-400">Activation email service</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-[#00D26A] border border-[#00D26A]/20">
                Configured
              </span>
            </div>

            {/* M-Pesa Gateway */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[#00D26A] shrink-0" />
                <div>
                  <div className="font-bold text-white">M-Pesa Daraja Gateway</div>
                  <div className="text-[10px] text-slate-400">STK Push &amp; Callbacks</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-[#00D26A] border border-[#00D26A]/20">
                Active
              </span>
            </div>

            {/* 3-Device Authorization */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">3-Device Enforcement</div>
                  <div className="text-[10px] text-slate-400">Hardware token binding</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Enforced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
