import React, { useState, useEffect } from 'react';
import { UserCog, Shield, Key, Power, Plus, Loader2, AlertCircle } from 'lucide-react';
import { AdminUserRecord } from './adminTypes';

interface AdminUsersViewProps {
  onNavigateToAddAdmin: () => void;
  currentAdminRole: string;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  onNavigateToAddAdmin,
  currentAdminRole,
}) => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password reset modal
  const [resettingUser, setResettingUser] = useState<AdminUserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Role edit modal
  const [roleUser, setRoleUser] = useState<AdminUserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load administrator accounts');
      }
    } catch (err: any) {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: AdminUserRecord) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    if (!confirm(`Are you sure you want to ${nextStatus === 'disabled' ? 'disable' : 'activate'} account "${user.account_id}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update account status');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword) return;
    try {
      setIsResetting(true);
      const res = await fetch(`/api/admin/users/${resettingUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Password for ${resettingUser.account_id} has been reset successfully.`);
        setResettingUser(null);
        setNewPassword('');
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleUser || !selectedRole) return;
    try {
      setIsUpdatingRole(true);
      const res = await fetch(`/api/admin/users/${roleUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setRoleUser(null);
        fetchUsers();
      } else {
        alert(data.error || 'Failed to update role');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#00D26A]" />
            <span>System Administrators &amp; Security Roles</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based privilege management. Primary superadmin account cannot be altered or removed.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToAddAdmin}
          className="px-3.5 py-1.5 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Admin</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-8 h-8 text-[#00D26A] animate-spin mx-auto" />
            <div className="text-xs text-slate-400">Loading administrator accounts...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No administrator records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Account ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isSuperAdmin = u.account_id === 'superadmin' || u.role === 'super_admin';
                  const isActive = u.status === 'active';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {u.account_id}
                        {isSuperAdmin && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/40">
                            Root
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-200 border border-slate-700">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!isSuperAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Change Role */}
                            <button
                              type="button"
                              onClick={() => {
                                setRoleUser(u);
                                setSelectedRole(u.role);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Change Role"
                            >
                              <Shield className="w-3.5 h-3.5 text-sky-400" />
                              <span>Role</span>
                            </button>

                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => {
                                setResettingUser(u);
                                setNewPassword('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Reset Password"
                            >
                              <Key className="w-3.5 h-3.5 text-amber-400" />
                              <span>Reset</span>
                            </button>

                            {/* Enable/Disable */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                isActive
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={isActive ? 'Disable Account' : 'Activate Account'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Protected Root</span>
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

      {/* Password Reset Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white">
              Reset Password: {resettingUser.account_id}
            </h3>
            <form onSubmit={handleExecuteResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !newPassword}
                  className="px-4 py-1.5 rounded-xl bg-[#00D26A] text-slate-950 font-bold text-xs hover:bg-[#00b85c] disabled:opacity-50"
                >
                  {isResetting ? 'Saving...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white">
              Modify Role: {roleUser.account_id}
            </h3>
            <form onSubmit={handleExecuteUpdateRole} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Assigned Security Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
                >
                  <option value="finance_admin">Finance Admin (Sales, Orders, Payments)</option>
                  <option value="content_admin">Content Admin (Papers, Uploads)</option>
                  <option value="support_admin">Support Admin (Activations, Messages)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRole}
                  className="px-4 py-1.5 rounded-xl bg-[#00D26A] text-slate-950 font-bold text-xs hover:bg-[#00b85c] disabled:opacity-50"
                >
                  {isUpdatingRole ? 'Updating...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
