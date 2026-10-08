import React, { useState } from 'react';
import { Sliders, Key, DollarSign, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AdminSettingsViewProps {
  currentPin: string;
  onUpdatePin: (newPin: string) => Promise<boolean>;
  defaultPrice: string;
  onUpdatePrice: (newPrice: string) => Promise<boolean>;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  currentPin,
  onUpdatePin,
  defaultPrice,
  onUpdatePrice,
}) => {
  // PIN State
  const [pinVal, setPinVal] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Price State
  const [priceVal, setPriceVal] = useState(defaultPrice || '50');
  const [priceMsg, setPriceMsg] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Password Change State
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpMsg, setCpMsg] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinVal || pinVal.length < 4) {
      setPinMsg('PIN must be at least 4 digits');
      return;
    }
    setIsUpdatingPin(true);
    setPinMsg('');
    const success = await onUpdatePin(pinVal);
    if (success) {
      setPinMsg('Security PIN updated successfully');
      setPinVal('');
    } else {
      setPinMsg('Failed to update PIN');
    }
    setIsUpdatingPin(false);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceVal) return;
    setIsUpdatingPrice(true);
    setPriceMsg('');
    const success = await onUpdatePrice(priceVal);
    if (success) {
      setPriceMsg('Default paper price updated successfully');
    } else {
      setPriceMsg('Failed to update default price');
    }
    setIsUpdatingPrice(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpMsg('');
    if (!cpCurrent || !cpNew || !cpConfirm) {
      setCpMsg('All password fields are required');
      return;
    }
    if (cpNew.length < 8) {
      setCpMsg('New password must be at least 8 characters');
      return;
    }
    if (cpNew !== cpConfirm) {
      setCpMsg('New passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCpMsg('Password changed successfully');
        setCpCurrent('');
        setCpNew('');
        setCpConfirm('');
      } else {
        setCpMsg(data.error || 'Failed to change password');
      }
    } catch (err) {
      setCpMsg('Network connection error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#00D26A]" />
          <span>System Settings &amp; Security Controls</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure operational security PINs, catalog baseline pricing, and self-service administrator credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security PIN Settings */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Admin Security PIN
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Emergency operational PIN used for protected administrative overrides.
          </p>

          <form onSubmit={handleSavePin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                New Security PIN
              </label>
              <input
                type="password"
                value={pinVal}
                onChange={(e) => setPinVal(e.target.value)}
                placeholder="Enter 4-6 digit PIN"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#00D26A]"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPin || !pinVal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors disabled:opacity-50"
            >
              {isUpdatingPin ? 'Saving...' : 'Update PIN'}
            </button>
          </form>

          {pinMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold ${
                pinMsg.includes('successfully')
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {pinMsg}
            </div>
          )}
        </div>

        {/* Pricing Settings */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-[#00D26A]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Default Paper Price
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Baseline price applied automatically when uploading new examination papers.
          </p>

          <form onSubmit={handleSavePrice} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Default Price (KSh)
              </label>
              <input
                type="number"
                value={priceVal}
                onChange={(e) => setPriceVal(e.target.value)}
                placeholder="50"
                min="1"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPrice}
              className="px-4 py-2 rounded-xl bg-[#00D26A] hover:bg-[#00b85c] text-slate-950 font-black text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {isUpdatingPrice ? 'Saving...' : 'Set Baseline Price'}
            </button>
          </form>

          {priceMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold ${
                priceMsg.includes('successfully')
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {priceMsg}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Self-Service */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Lock className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
            Change Your Password
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Update your administrator password. You will need your current password to confirm.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={cpCurrent}
              onChange={(e) => setCpCurrent(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              New Password (min 8 characters)
            </label>
            <input
              type="password"
              value={cpNew}
              onChange={(e) => setCpNew(e.target.value)}
              minLength={8}
              required
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={cpConfirm}
              onChange={(e) => setCpConfirm(e.target.value)}
              minLength={8}
              required
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#00D26A]"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>

        {cpMsg && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold max-w-md ${
              cpMsg.includes('successfully')
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}
          >
            {cpMsg}
          </div>
        )}
      </div>
    </div>
  );
};
