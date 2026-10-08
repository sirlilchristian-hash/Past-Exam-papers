import React, { useState, useMemo } from 'react';
import { Users, Search, ShoppingBag, DollarSign, Calendar, ShieldCheck } from 'lucide-react';
import { CustomerSummary, TransactionRecord, PendingActivationOrder } from './adminTypes';

interface AdminCustomersViewProps {
  transactions: TransactionRecord[];
  pendingActivations?: PendingActivationOrder[] | any[];
  onInspectCustomerOrders?: (phone: string) => void;
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({
  transactions,
  pendingActivations = [],
  onInspectCustomerOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregate unique customers from real database transactions and orders
  const customerList: CustomerSummary[] = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    // Process transactions
    transactions.forEach((tx) => {
      const key = (tx.phone || `${tx.studentFirstName}_${tx.studentSecondName}`).trim().toLowerCase();
      if (!key) return;

      const raw = (tx.price || '').replace(/[^\d.]/g, '');
      const priceNum = parseFloat(raw) || 0;
      const isCompleted =
        (tx.status || '').toLowerCase() === 'completed' || (tx.status || '').toLowerCase() === 'paid';

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          fullName: `${tx.studentFirstName || ''} ${tx.studentSecondName || ''}`.trim() || 'Verified Student',
          phoneOrEmail: tx.phone || '—',
          ordersCount: 1,
          totalSpent: isCompleted ? priceNum : 0,
          lastPurchaseDate: tx.timestamp || '',
          lastPaperTitle: tx.paper_title || tx.unitName,
        });
      } else {
        const existing = map.get(key)!;
        existing.ordersCount += 1;
        if (isCompleted) {
          existing.totalSpent += priceNum;
        }
        if (tx.timestamp && (!existing.lastPurchaseDate || new Date(tx.timestamp) > new Date(existing.lastPurchaseDate))) {
          existing.lastPurchaseDate = tx.timestamp;
          existing.lastPaperTitle = tx.paper_title || tx.unitName;
        }
      }
    });

    // Process pending activation orders
    pendingActivations.forEach((order) => {
      const phone = order.customers?.phone || '';
      const name = `${order.customers?.first_name || ''} ${order.customers?.second_name || ''}`.trim();
      const key = (phone || name).toLowerCase();
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          fullName: name || 'Student Customer',
          phoneOrEmail: phone || '—',
          ordersCount: 1,
          totalSpent: 0,
          lastPurchaseDate: order.created_at || '',
          lastPaperTitle: order.Papers?.paper_title,
        });
      } else {
        const existing = map.get(key)!;
        existing.ordersCount += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions, pendingActivations]);

  const filtered = customerList.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      c.fullName.toLowerCase().includes(term) ||
      c.phoneOrEmail.toLowerCase().includes(term) ||
      (c.lastPaperTitle && c.lastPaperTitle.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00D26A]" />
            <span>Customers Directory ({customerList.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated profile records of students who have placed orders or requested document access
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student by name or contact..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00D26A]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Customers Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'No customers match your search keyword.'
                : 'Customer records will populate automatically when transactions are initiated.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email / Phone</th>
                  <th className="py-3 px-4">Papers Purchased</th>
                  <th className="py-3 px-4">Total Amount Spent</th>
                  <th className="py-3 px-4">Latest Paper</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {customer.fullName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                      {customer.phoneOrEmail}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-200">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#00D26A]" />
                        <span>{customer.ordersCount} paper{customer.ordersCount > 1 ? 's' : ''}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-[#00D26A] whitespace-nowrap">
                      KSh {customer.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={customer.lastPaperTitle}>
                      {customer.lastPaperTitle || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {customer.lastPurchaseDate
                        ? new Date(customer.lastPurchaseDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
