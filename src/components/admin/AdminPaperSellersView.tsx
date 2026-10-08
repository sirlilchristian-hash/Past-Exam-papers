import React, { useState } from 'react';
import {
  Users2,
  Search,
  MessageCircle,
  ExternalLink,
  Trash2,
  CheckCircle,
  Clock,
  Building,
  GraduationCap,
} from 'lucide-react';
import { AffiliateRecord } from './adminTypes';

interface AdminPaperSellersViewProps {
  affiliates: AffiliateRecord[];
  onUpdateStatus: (id: string, newStatus: string) => void;
  onDeleteAffiliate: (id: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminPaperSellersView: React.FC<AdminPaperSellersViewProps> = ({
  affiliates,
  onUpdateStatus,
  onDeleteAffiliate,
  onRefresh,
  isRefreshing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'contacted' | 'inactive'>('all');

  const filtered = affiliates.filter((aff) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (aff.fullName && aff.fullName.toLowerCase().includes(term)) ||
      (aff.phone && aff.phone.toLowerCase().includes(term)) ||
      (aff.email && aff.email.toLowerCase().includes(term)) ||
      (aff.university && aff.university.toLowerCase().includes(term)) ||
      (aff.campusCourse && aff.campusCourse.toLowerCase().includes(term)) ||
      (aff.unitsDescription && aff.unitsDescription.toLowerCase().includes(term)) ||
      (aff.referralCode && aff.referralCode.toLowerCase().includes(term));

    const s = aff.status || 'pending';
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && (s === 'pending' || s === 'under_review')) ||
      (statusFilter === 'approved' && s === 'approved') ||
      (statusFilter === 'contacted' && s === 'contacted') ||
      (statusFilter === 'inactive' && (s === 'inactive' || s === 'rejected'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Users2 className="w-4 h-4 text-[#00D26A]" />
            <span>Affiliate Paper Sellers &amp; Contributors</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Student and lecturer submissions to monetize past examination papers and class materials
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({affiliates.length})
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
            onClick={() => setStatusFilter('approved')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('contacted')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'contacted'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Contacted
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search seller by name, university, phone, or units..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00D26A]"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users2 className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Affiliate Sellers Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No affiliate submissions match your search.'
                : 'New student sellers who apply via the Sell Papers page will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Status &amp; Workflow</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Institution &amp; Course</th>
                  <th className="py-3 px-4">Offered Units Description</th>
                  <th className="py-3 px-4">Volume &amp; Years</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((aff) => {
                  const cleanPhone = aff.phone ? aff.phone.replace(/[^0-9]/g, '') : '';
                  const intlPhone = cleanPhone.startsWith('0') ? `254${cleanPhone.slice(1)}` : cleanPhone;
                  const waMsg = encodeURIComponent(
                    `Hello ${aff.fullName}, Godrery Publishers reviewed your past papers submission. We would love to discuss acquisition and compensation.`
                  );
                  const waLink = `https://wa.me/${intlPhone}?text=${waMsg}`;

                  return (
                    <tr key={aff.id || aff.referralCode} className="hover:bg-slate-800/40 transition-colors">
                      {/* Status Selector */}
                      <td className="py-3 px-4 align-top">
                        <select
                          value={aff.status || 'pending'}
                          onChange={(e) => onUpdateStatus(aff.id || aff.referralCode || '', e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-[#00D26A]"
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="contacted">Contacted</option>
                          <option value="inactive">Inactive</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Candidate Name & Contact */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-white text-xs">{aff.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{aff.phone}</div>
                        {aff.email && <div className="text-[11px] text-slate-400 font-mono">{aff.email}</div>}
                        {aff.linkedInUrl && (
                          <a
                            href={aff.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:underline mt-0.5"
                          >
                            <span>LinkedIn Profile</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Institution & Course */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-slate-200">{aff.university}</div>
                        <div className="text-[11px] text-slate-400">{aff.campusCourse || 'Campus unspecified'}</div>
                      </td>

                      {/* Units Description */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        <p className="text-slate-300 text-[11px] line-clamp-3">
                          {aff.unitsDescription || 'No description provided'}
                        </p>
                      </td>

                      {/* Volume & Years */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-bold text-white text-xs">
                          {aff.paperCount ? `${aff.paperCount} Papers` : 'Volume TBD'}
                        </div>
                        <div className="text-[11px] text-slate-400">{aff.academicYears || 'Years unspecified'}</div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 align-top text-slate-400 text-[11px] whitespace-nowrap">
                        {aff.created_at
                          ? new Date(aff.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {cleanPhone && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00D26A] border border-[#00D26A]/30 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                              title="Message Candidate on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteAffiliate(aff.id || aff.referralCode || '')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
