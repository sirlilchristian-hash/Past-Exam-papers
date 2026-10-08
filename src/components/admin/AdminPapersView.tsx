import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Sparkles,
  Download,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { Paper } from '../../types';

interface AdminPapersViewProps {
  papers: Paper[];
  onOpenAddPaperModal: () => void;
  onOpenBulkModal: () => void;
  onEditPaper: (paper: Paper) => void;
  onDeletePaper: (paper: Paper) => void;
  onToggleStatus: (paper: Paper) => void;
  onDownloadPaper: (paper: Paper) => void;
  onExportCsv?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading: boolean;
}

export const AdminPapersView: React.FC<AdminPapersViewProps> = ({
  papers,
  onOpenAddPaperModal,
  onOpenBulkModal,
  onEditPaper,
  onDeletePaper,
  onToggleStatus,
  onDownloadPaper,
  onExportCsv,
  onRefresh,
  isRefreshing = false,
  isLoading,
}) => {
  const handleDefaultExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    if (!papers || papers.length === 0) {
      alert('No papers to export.');
      return;
    }
    const headers = ['ID', 'Unit Code', 'Paper Title', 'Price', 'Status', 'File Path'];
    const rows = papers.map((p) => [
      `"${p.id || ''}"`,
      `"${(p.unit_code || (p as any).unitCode || '').replace(/"/g, '""')}"`,
      `"${(p.paper_title || (p as any).unitName || '').replace(/"/g, '""')}"`,
      `"${(typeof p.price === 'number' ? `KSh ${p.price}` : p.price || 'KSh 50').replace(/"/g, '""')}"`,
      `"${(p.status || 'available').replace(/"/g, '""')}"`,
      `"${(p.file_path || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Godrery_Exam_Papers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  const filtered = papers.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const title = (p.paper_title || (p as any).unitName || '').toLowerCase();
    const code = (p.unit_code || (p as any).unitCode || '').toLowerCase();
    const matchesSearch = !term || title.includes(term) || code.includes(term);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && p.status === 'available') ||
      (statusFilter === 'unavailable' && p.status !== 'available');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Action and Search Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search paper title or unit code..."
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
              All ({papers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('available')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'available'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unavailable')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'unavailable'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unpublished
            </button>
          </div>
        </div>

        {/* Action Buttons: Add, Bulk, Export */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDefaultExportCsv}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#00D26A]" />
            <span className="hidden md:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={onOpenBulkModal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            title="AI Bulk OCR Digitize"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Bulk OCR</span>
          </button>

          <button
            type="button"
            id="admin-add-paper-btn"
            onClick={onOpenAddPaperModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 text-xs font-black inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Paper</span>
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No Papers Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No papers match your search filter criteria.'
                : 'Your catalog is empty. Click "Add Paper" to upload a new past examination paper.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Unit Code</th>
                  <th className="py-3 px-4">Paper Title</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Catalog Status</th>
                  <th className="py-3 px-4">Storage File</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((paper) => {
                  const unitCode = paper.unit_code || (paper as any).unitCode || '—';
                  const paperTitle = paper.paper_title || (paper as any).unitName || 'Examination Paper';
                  const isAvailable = paper.status === 'available';
                  const displayPrice =
                    typeof paper.price === 'number' ? `KSh ${paper.price}` : paper.price || 'KSh 50';

                  return (
                    <tr key={paper.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-extrabold text-[#00D26A] text-xs whitespace-nowrap">
                        {unitCode}
                      </td>
                      <td className="py-3 px-4 font-bold text-white max-w-sm truncate" title={paperTitle}>
                        {paperTitle}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200 whitespace-nowrap">
                        {displayPrice}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(paper)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 border transition-colors ${
                            isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Click to toggle availability"
                        >
                          {isAvailable ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Available</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Unpublished</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                        {paper.file_path ? (
                          <span className="text-slate-300" title={paper.file_path}>
                            {paper.file_path.split('/').pop()}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No file bound</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {paper.created_at
                          ? new Date(paper.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download Paper with Admin Password */}
                          <button
                            type="button"
                            onClick={() => onDownloadPaper(paper)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Download Protected PDF"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-400" />
                          </button>

                          {/* Edit Paper */}
                          <button
                            type="button"
                            onClick={() => onEditPaper(paper)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Paper"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Delete Paper */}
                          <button
                            type="button"
                            onClick={() => onDeletePaper(paper)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Paper"
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
