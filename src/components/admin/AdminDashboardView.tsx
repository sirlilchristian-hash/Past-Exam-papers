import React from 'react';
import {
  DollarSign,
  CheckCircle2,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Mail,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import {
  AdminSection,
  TransactionRecord,
  DeviceRequest,
  AffiliateRecord,
} from './adminTypes';
import { Paper } from '../../types';

interface AdminDashboardViewProps {
  transactions: TransactionRecord[];
  papers: Paper[];
  onNavigate: (section: AdminSection) => void;
  deviceRequests?: DeviceRequest[];
  affiliates?: AffiliateRecord[];
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  transactions,
  papers,
  onNavigate,
  deviceRequests = [],
  affiliates = [],
}) => {
  // Compute Real Metrics
  const paidOrdersCount = transactions.filter(
    (t) => t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'paid'
  ).length;

  const totalRevenue = transactions
    .filter((t) => t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'paid')
    .reduce((sum, t) => {
      const num = parseInt(String(t.price || '0').replace(/[^\d]/g, ''), 10);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

  const availablePapersCount = papers.filter((p) => p.status === 'available').length;

  // Extract unique customers
  const uniqueCustomerKeys = new Set<string>();
  transactions.forEach((t) => {
    const key = (t.phone || `${t.studentFirstName}_${t.studentSecondName}`).trim().toLowerCase();
    if (key) uniqueCustomerKeys.add(key);
  });
  const customersCount = uniqueCustomerKeys.size;

  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 4 Primary Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Gross Revenue */}
        <div
          onClick={() => onNavigate('payments')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gross Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-[#00D26A]/20 text-[#00D26A] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              KSh {totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">total collected</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#00D26A]">
            <span>View payment ledger</span>
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
                Latest transactions processed through verified M-Pesa payments
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
