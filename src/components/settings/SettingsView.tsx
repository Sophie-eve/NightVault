import React, { useState } from 'react';
import {
  User,
  Shield,
  Cloud,
  Database,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  Check,
  AlertCircle,
  HardDrive,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase';
import { formatFileSize } from '../../lib/storage';
import { parseVaultBackup } from '../../lib/export';
import { ConfirmModal } from '../common/ConfirmModal';
import type { SortOption } from '../../types';

export const SettingsView: React.FC = () => {
  const { user, updateProfile, changePassword, signOut, isSupabaseAuth } = useAuth();
  const {
    stats,
    sortOption,
    setSortOption,
    exportVaultBackupZip,
    importVaultBackup,
    resetVaultToDefault,
    triggerManualSync,
  } = useVault();

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Supabase cloud config state
  const storedConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(storedConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(storedConfig.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isCopiedSchema, setIsCopiedSchema] = useState(false);

  // Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    await updateProfile({ displayName: displayName.trim() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', isError: true });
      return;
    }

    const res = await changePassword(newPassword);
    if (res.success) {
      setPasswordMsg({ text: 'Password updated successfully.', isError: false });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ text: res.error || 'Failed to update password.', isError: true });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSaveSupabaseConfig = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setTestResult({ success: false, message: 'URL and Anon Key cannot be empty.' });
      return;
    }

    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    await triggerManualSync();
    setTestResult({ success: true, message: 'Configuration saved! Connected to Supabase.' });
  };

  const handleDisconnectSupabase = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setTestResult({ success: true, message: 'Supabase disconnected. Using Local Encrypted Vault.' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backup = parseVaultBackup(text);
        await importVaultBackup(backup);
        alert('Vault backup imported successfully!');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setImportError(message);
      }
    };
    reader.readAsText(file);
  };

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setIsCopiedSchema(true);
    setTimeout(() => setIsCopiedSchema(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0a0b10] text-slate-100 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        {/* Title */}
        <div className="pb-4 border-b border-white/10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Vault Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your personal profile, cloud synchronization, default preferences, and data backups.
          </p>
        </div>

        {/* 1. Profile Settings */}
        <div className="p-6 bg-[#12141f] border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Profile Information</h2>
              <p className="text-xs text-slate-400">Your personal identity in Nightvault</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'local-vault@nightvault.app'}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926]/50 border border-white/5 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {profileSaved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Profile updated successfully!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-900/30 cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* 2. Supabase Cloud Sync Configuration */}
        <div className="p-6 bg-[#12141f] border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Supabase Cloud Sync & Storage</h2>
                <p className="text-xs text-slate-400">
                  {isSupabaseAuth ? 'Connected to Supabase PostgreSQL & Cloud Storage' : 'Operating in Local Encrypted Vault mode'}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                isSupabaseAuth
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {isSupabaseAuth ? '● Cloud Connected' : '○ Local Vault'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your Supabase project credentials below to enable multi-device synchronization and persistent cloud image storage.
            You can find these in your Supabase dashboard under <strong>Settings → API</strong>.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Project URL</label>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Anon / Public API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !supabaseUrl.trim()}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleSaveSupabaseConfig}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-900/30 cursor-pointer"
              >
                Save & Connect
              </button>
              {storedConfig.isConfigured && (
                <button
                  type="button"
                  onClick={handleDisconnectSupabase}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* SQL Migration Script Notice */}
            <div className="mt-4 p-3 bg-[#0d0e17] border border-white/5 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>SQL Schema & RLS policies script: <code>supabase/schema.sql</code></span>
              </div>
              <button
                type="button"
                onClick={handleCopySchemaPath}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isCopiedSchema ? 'Copied!' : 'Copy Path'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Account Security */}
        <div className="p-6 bg-[#12141f] border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Account Security</h2>
              <p className="text-xs text-slate-400">Update account password and manage persistent sessions</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {passwordMsg && (
              <p className={`text-xs ${passwordMsg.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                {passwordMsg.text}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!newPassword}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* 4. Notebook Preferences & Default Sorting */}
        <div className="p-6 bg-[#12141f] border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Default Notebook Sorting</h2>
              <p className="text-xs text-slate-400">
                Default sorting across Nightvault is Alphabetical A–Z (case-insensitive)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Default Sorting Order</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="alphabetical-asc">Alphabetical A–Z (Default)</option>
                <option value="alphabetical-desc">Alphabetical Z–A</option>
                <option value="recently-modified">Recently Modified</option>
                <option value="date-created">Date Created</option>
                <option value="custom">Custom Order</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Storage Breakdown */}
        <div className="p-6 bg-[#12141f] border border-white/10 rounded-2xl space-y-4">
          <h2 className="text-base font-semibold text-white">Storage Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-[#171926] border border-white/5 rounded-xl">
              <span className="text-xs text-slate-400">Notebooks</span>
              <p className="text-lg font-bold text-white mt-1">{stats.totalNotebooks}</p>
            </div>
            <div className="p-3 bg-[#171926] border border-white/5 rounded-xl">
              <span className="text-xs text-slate-400">Pages</span>
              <p className="text-lg font-bold text-white mt-1">{stats.totalNotes}</p>
            </div>
            <div className="p-3 bg-[#171926] border border-white/5 rounded-xl">
              <span className="text-xs text-slate-400">Visual Media</span>
              <p className="text-lg font-bold text-white mt-1">{stats.totalImages}</p>
            </div>
            <div className="p-3 bg-[#171926] border border-white/5 rounded-xl">
              <span className="text-xs text-slate-400">Estimated Size</span>
              <p className="text-lg font-bold text-purple-400 mt-1 font-mono">{formatFileSize(stats.storageBytesUsed)}</p>
            </div>
          </div>
        </div>

        {/* 6. Backup & Export */}
        <div className="p-6 bg-[#12141f] border border-white/10 rounded-2xl space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Data Export & Backup</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Export your entire vault as a single ZIP archive containing all notebooks, Markdown pages, and metadata.
            </p>
          </div>

          {importError && (
            <p className="text-xs text-rose-400 p-2 bg-rose-500/10 rounded-lg">{importError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={exportVaultBackupZip}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-900/30 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Vault (.ZIP)</span>
            </button>

            <label className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import Vault Backup (.JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Starter Vault</span>
            </button>
          </div>
        </div>

        {/* 7. Sign Out */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            NIGHTVAULT v1.0.0 &bull; Private Knowledge Core
          </p>
          <button
            type="button"
            onClick={signOut}
            className="px-4 py-2 bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Nightvault</span>
          </button>
        </div>
      </div>

      {/* Reset Vault Modal */}
      {isResetModalOpen && (
        <ConfirmModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={async () => {
            await resetVaultToDefault();
            setIsResetModalOpen(false);
          }}
          title="Reset Vault to Starter Template?"
          message="This will overwrite current notebooks and notes with the original starter templates. Be sure to export a backup if you have custom notes you wish to keep."
          confirmText="Yes, Reset Vault"
          isDestructive={true}
        />
      )}
    </div>
  );
};
