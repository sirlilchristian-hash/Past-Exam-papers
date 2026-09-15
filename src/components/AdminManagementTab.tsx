import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Edit2, Key, CheckCircle, XCircle } from 'lucide-react';

interface AdminUser {
  id: string;
  account_id: string;
  role: string;
  status: string;
  created_at: string;
}

export const AdminManagementTab: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showChangeRole, setShowChangeRole] = useState<string | null>(null);
  const [showResetPw, setShowResetPw] = useState<string | null>(null);

  // Form states
  const [newAccountId, setNewAccountId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('finance_admin');
  
  const [editRole, setEditRole] = useState('finance_admin');
  const [resetPw, setResetPw] = useState('');

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      if (res.ok) {
        setAdmins(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ accountId: newAccountId, password: newPassword, role: newRole })
      });
      if (res.ok) {
        setShowAdd(false);
        setNewAccountId('');
        setNewPassword('');
        fetchAdmins();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleChangeRole = async (accountId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ role: editRole })
      });
      if (res.ok) {
        setShowChangeRole(null);
        fetchAdmins();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (!window.confirm(`Are you sure you want to ${newStatus} administrator ${accountId}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAdmins();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleResetPassword = async (accountId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${accountId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ newPassword: resetPw })
      });
      if (res.ok) {
        setShowResetPw(null);
        setResetPw('');
        alert('Password reset successfully');
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      alert('Network error');
    }
  };

  if (loading) return <div className="text-white text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white">Admin Management</h2>
          <p className="text-sm text-slate-400 mt-1">Manage system administrators and roles.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#00D26A] hover:bg-[#00b55b] text-slate-950 px-4 py-2 rounded-lg font-bold transition-colors"
        >
          + Add Administrator
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Account ID</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${admin.role === 'super_admin' ? 'text-[#00D26A]' : 'text-slate-400'}`} />
                    <span className="font-bold text-white">{admin.account_id}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                    {admin.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  {admin.status === 'active' ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#00D26A]">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                      <XCircle className="w-3.5 h-3.5" /> Disabled
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm text-slate-400">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 flex items-center justify-end gap-2">
                  {admin.role !== 'super_admin' && (
                    <>
                      <button
                        onClick={() => { setShowChangeRole(admin.account_id); setEditRole(admin.role); }}
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                        title="Change Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowResetPw(admin.account_id)}
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(admin.account_id, admin.status)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                          admin.status === 'active'
                            ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                            : 'bg-[#00D26A]/10 text-[#00D26A] hover:bg-[#00D26A]/20'
                        }`}
                      >
                        {admin.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </>
                  )}
                  {admin.role === 'super_admin' && (
                     <span className="text-xs text-slate-500 italic">Protected</span>
                  )}
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No administrators found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-white mb-4">Add Administrator</h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Account ID</label>
                <input type="text" value={newAccountId} onChange={e => setNewAccountId(e.target.value)} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-white" required placeholder="e.g. jdoe_finance" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Temporary Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-white" required placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-white">
                  <option value="finance_admin">Finance Admin</option>
                  <option value="content_admin">Content Admin</option>
                  <option value="support_admin">Support Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#00D26A] hover:bg-[#00b55b] text-slate-950 font-bold py-2 rounded-lg mt-4">Create Admin</button>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showChangeRole && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowChangeRole(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-white mb-4">Change Role</h3>
            <p className="text-sm text-slate-400 mb-4">Modifying role for <strong className="text-white">{showChangeRole}</strong></p>
            <div className="space-y-4">
              <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-white">
                <option value="finance_admin">Finance Admin</option>
                <option value="content_admin">Content Admin</option>
                <option value="support_admin">Support Admin</option>
              </select>
              <button onClick={() => handleChangeRole(showChangeRole)} className="w-full bg-[#00D26A] hover:bg-[#00b55b] text-slate-950 font-bold py-2 rounded-lg">Save Role</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPw && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowResetPw(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-white mb-4">Reset Password</h3>
            <p className="text-sm text-slate-400 mb-4">Resetting password for <strong className="text-white">{showResetPw}</strong></p>
            <div className="space-y-4">
              <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} minLength={8} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-white" placeholder="New temporary password" />
              <button onClick={() => handleResetPassword(showResetPw)} className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-2 rounded-lg">Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
