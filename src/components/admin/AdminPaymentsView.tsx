import React, { useState } from 'react';
import { CreditCard, DollarSign, Search, CheckCircle, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { TransactionRecord } from './adminTypes';

interface AdminPaymentsViewProps {
  transactions: TransactionRecord[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminPaymentsView: React.FC<AdminPaymentsViewProps> = ({
  transactions,
  onRefresh,
  isRefreshing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const completedList = transactions.filter(
    (t) => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'paid'
  );

  const totalRevenue = completedList.reduce((acc, t) => {
    const raw = (t.price || '').replace(/[^\d.]/g, '');
    const num = parseFloat(raw);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const avgValue = completedList.length > 0 ? Math.round(totalRevenue / completedList.length) : 0;

  const filtered = transactions.filter((t) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (t.mpesaReceipt && t.mpesaReceipt.toLowerCase().includes(term)) ||
      (t.phone && t.phone.toLowerCase().includes(term)) ||
      `${t.studentFirstName} ${t.studentSecondName}`.toLowerCase().includes(term);

    const s = (t.status || '').toLowerCase();
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && (s === 'completed' || s === 'paid')) ||
      (statusFilter === 'pending' && s === 'pending') ||
      (statusFilter === 'failed' && s === 'failed');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue Settled
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-[#00D26A]/20 text-[#00D26A] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            KSh {totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">Total verified incoming M-Pesa payments</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Completed Payments
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {completedList.length}
          </div>
          <p className="text-[11px] text-slate-400">Out of {transactions.length} total transaction records</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Average Order Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            KSh {avgValue}
          </div>
          <p className="text-[11px] text-slate-400">Standard rate per past examination paper</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by M-Pesa receipt, phone number, or student..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00D26A]"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'failed'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Payment Records Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No payments match your filter settings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">M-Pesa Receipt</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((t) => {
                  const s = (t.status || '').toLowerCase();
                  const isCompleted = s === 'completed' || s === 'paid';
                  const isPending = s === 'pending';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {t.id ? t.id.slice(0, 8) : '—'}...
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-white whitespace-nowrap">
                        {t.mpesaReceipt || 'PENDING'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                        {t.studentFirstName} {t.studentSecondName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {t.phone}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-white whitespace-nowrap">
                        {t.price}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {t.timestamp
                          ? new Date(t.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
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
