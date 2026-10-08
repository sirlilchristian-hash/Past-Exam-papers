import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { TransactionRecord } from './adminTypes';

interface AdminOrdersViewProps {
  transactions: TransactionRecord[];
  onInspectOrder: (tx: TransactionRecord) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  transactions,
  onInspectOrder,
  onRefresh,
  isRefreshing,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const filtered = transactions.filter((tx) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      `${tx.studentFirstName} ${tx.studentSecondName}`.toLowerCase().includes(term) ||
      (tx.phone && tx.phone.toLowerCase().includes(term)) ||
      (tx.mpesaReceipt && tx.mpesaReceipt.toLowerCase().includes(term)) ||
      (tx.unit_code && tx.unit_code.toLowerCase().includes(term)) ||
      (tx.unitCode && tx.unitCode.toLowerCase().includes(term)) ||
      (tx.paper_title && tx.paper_title.toLowerCase().includes(term)) ||
      (tx.unitName && tx.unitName.toLowerCase().includes(term)) ||
      (tx.id && tx.id.toLowerCase().includes(term));

    const statusLower = (tx.status || '').toLowerCase();
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && (statusLower === 'completed' || statusLower === 'paid')) ||
      (statusFilter === 'pending' && statusLower === 'pending') ||
      (statusFilter === 'failed' && statusLower === 'failed');

    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    if (filtered.length === 0) {
      alert('No orders to export.');
      return;
    }
    const headers = ['Order ID', 'Student First Name', 'Student Second Name', 'Phone', 'Unit Code', 'Paper Title', 'Amount', 'M-Pesa Receipt', 'Status', 'Date'];
    const rows = filtered.map((tx) => [
      `"${tx.id || ''}"`,
      `"${tx.studentFirstName || ''}"`,
      `"${tx.studentSecondName || ''}"`,
      `"${tx.phone || ''}"`,
      `"${tx.unit_code || tx.unitCode || ''}"`,
      `"${(tx.paper_title || tx.unitName || '').replace(/"/g, '""')}"`,
      `"${tx.price || ''}"`,
      `"${tx.mpesaReceipt || ''}"`,
      `"${tx.status || ''}"`,
      `"${tx.timestamp || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Godrery_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, receipt, unit code, or order ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({transactions.length})
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
              Paid
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

        {/* Export Button */}
        <button
          type="button"
          onClick={exportCsv}
          className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#00D26A]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Orders Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'No purchase records match your search or filter parameters.'
                : 'Purchases completed via automated Daraja or manual activation will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Unit Code</th>
                  <th className="py-3 px-4">Paper Title</th>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((tx) => {
                  const statusLower = (tx.status || '').toLowerCase();
                  const isPaid = statusLower === 'completed' || statusLower === 'paid';
                  const isPending = statusLower === 'pending';
                  const unitCode = tx.unit_code || tx.unitCode || '—';
                  const paperTitle = tx.paper_title || tx.unitName || 'Past Paper';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {tx.studentFirstName} {tx.studentSecondName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {tx.phone}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-[#00D26A] whitespace-nowrap">
                        {unitCode}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={paperTitle}>
                        {paperTitle}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200 whitespace-nowrap">
                        {tx.mpesaReceipt || '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {tx.price}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {tx.timestamp
                          ? new Date(tx.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onInspectOrder(tx)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#00D26A]" />
                          <span>Inspect</span>
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
