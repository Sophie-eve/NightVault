import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
  HardDrive,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to sign in.');
        }
      } else if (mode === 'signup') {
        const res = await signUp(email, password, displayName);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to register account.');
        } else {
          setSuccessMsg('Account created successfully! Session restored.');
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.success) {
          setSuccessMsg(res.message);
        } else {
          setErrorMsg(res.error || 'Could not send reset link.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantLocalAccess = async () => {
    setLoading(true);
    await signIn('keeper@nightvault.app', 'nightvault-secure-pass');
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#0a0b10] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,50,220,0.18),rgba(255,255,255,0))]">
      <div className="w-full max-w-md bg-[#11131c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Logo & Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 p-0.5 mx-auto shadow-xl shadow-purple-900/30">
            <div className="w-full h-full bg-[#0d0e17] rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider">
            NIGHTVAULT
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'signin' && 'Sign in to access your personal digital sanctuary.'}
            {mode === 'signup' && 'Create your private personal knowledge vault.'}
            {mode === 'forgot' && 'Reset your authentication credentials.'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#161826] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#161826] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-300 font-medium">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#161826] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>
              {loading
                ? 'Authenticating...'
                : mode === 'signin'
                ? 'Sign In to Nightvault'
                : mode === 'signup'
                ? 'Create Personal Account'
                : 'Send Reset Link'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <p>
              First time setting up your vault?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer ml-1"
              >
                Register Here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Quick Instant Local Vault Access */}
        <div className="mt-4 pt-3 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={handleInstantLocalAccess}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Enter as Local Vault Keeper (Offline First)</span>
          </button>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Persistent Sessions &bull; Row Level Security &bull; Zero Telemetry</span>
        </div>
      </div>
    </div>
  );
};
