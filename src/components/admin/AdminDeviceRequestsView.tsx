import React from 'react';
import { Smartphone, Check, X, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { DeviceRequest } from './adminTypes';

interface AdminDeviceRequestsViewProps {
  deviceRequests: DeviceRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const AdminDeviceRequestsView: React.FC<AdminDeviceRequestsViewProps> = ({
  deviceRequests,
  onApprove,
  onReject,
  onRefresh,
  isRefreshing,
}) => {
  const pendingRequests = deviceRequests.filter((r) => (r.status || '').toLowerCase() === 'pending');

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>Additional Device Limit Authorization Requests</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Students who reached their default 3-device limit requesting authorization for a new laptop or phone
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00D26A]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {deviceRequests.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Smartphone className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Device Requests</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No students have requested an increase to their device authorization limit.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Paper Title &amp; Unit</th>
                  <th className="py-3 px-4">Devices Used / Limit</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deviceRequests.map((req) => {
                  const studentName = req.Orders?.customers
                    ? `${req.Orders.customers.first_name} ${req.Orders.customers.second_name}`.trim()
                    : 'Customer';
                  const paperTitle = req.Orders?.Papers?.paper_title || 'Past Paper';
                  const unitCode = req.Orders?.Papers?.unit_code || 'UNIT';
                  const isPending = (req.status || '').toLowerCase() === 'pending';

                  return (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {studentName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {req.order_id ? req.order_id.slice(0, 8) : '—'}...
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        <span className="font-mono font-bold text-[#00D26A] mr-1">{unitCode}</span>
                        <span>{paperTitle}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-300">
                          {req.current_devices} / {req.device_limit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {req.created_at
                          ? new Date(req.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isPending
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : req.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onApprove(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve (+1)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onReject(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Processed</span>
                        )}
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
