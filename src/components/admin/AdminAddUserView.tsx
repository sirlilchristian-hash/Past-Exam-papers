import React, { useState } from 'react';
import { UserPlus, Shield, Key, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { AdminSection } from './adminTypes';

interface AdminAddUserViewProps {
  onNavigate: (section: AdminSection) => void;
}

export const AdminAddUserView: React.FC<AdminAddUserViewProps> = ({ onNavigate }) => {
  const [accountId, setAccountId] = useState('');
  const [role, setRole] = useState('support_admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!accountId.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          account_id: accountId.trim().toLowerCase(),
          role,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Administrator account "${accountId.trim().toLowerCase()}" created successfully!`);
        setAccountId('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to create administrator account.');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <button
          type="button"
          onClick={() => onNavigate('admin_users')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Administrator Accounts</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00D26A]" />
            <span>Create New Administrator Account</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Provision access for department operators. Passwords are cryptographically salted and hashed using bcrypt (12 rounds).
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-[#00D26A]/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00D26A]" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account ID */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Account ID (Username)
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. finance_mary"
              required
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#00D26A]"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Unique lowercase identifier used for admin login.
            </span>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Security Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
            >
              <option value="support_admin">Support Admin (Orders, Manual Code Activation)</option>
              <option value="finance_admin">Finance Admin (Sales, Orders, Payments, Revenue)</option>
              <option value="content_admin">Content Admin (Examination Papers Catalog, OCR)</option>
            </select>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Temporary Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Minimum 8 characters.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('admin_users')}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs inline-flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
