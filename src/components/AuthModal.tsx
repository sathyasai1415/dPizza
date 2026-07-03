import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Store, User, Mail, Lock, Eye, EyeOff, Ghost } from 'lucide-react';
import { auth } from '../lib/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'customer' | 'partner'>('customer');
  const [mode, setMode] = useState<'options' | 'email'>('options');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applyPartnerFlag = () => {
    if (tab === 'partner') {
      localStorage.setItem('miSlice_isPartner', 'true');
    } else {
      localStorage.removeItem('miSlice_isPartner');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      applyPartnerFlag();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Try another method below.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
      applyPartnerFlag();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Anonymous sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      applyPartnerFlag();
      onClose();
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Incorrect email or password.'
        : err.code === 'auth/email-already-in-use'
        ? 'Account already exists. Try signing in.'
        : err.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters.'
        : err.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetToOptions = () => {
    setMode('options');
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 bg-stone-100 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black text-stone-900 mb-6 tracking-tight">
              {mode === 'email' ? (isSignUp ? 'Create Account' : 'Sign In') : 'Sign In'}
            </h2>

            {/* Role tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTab('customer')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'customer' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
              >
                <User className="w-4 h-4" /> Customer
              </button>
              <button
                onClick={() => setTab('partner')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'partner' ? 'bg-red-600 text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
              >
                <Store className="w-4 h-4" /> Partner
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            {mode === 'options' && (
              <div className="space-y-3">
                {/* Google */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold shadow-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 transition-colors flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {/* Email */}
                <button
                  onClick={() => setMode('email')}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-stone-900 hover:bg-black text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Continue with Email
                </button>

                {/* Anonymous */}
                <button
                  onClick={handleAnonymous}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ghost className="w-4 h-4" />}
                  Continue Anonymously
                </button>

                <p className="text-[10px] text-stone-400 text-center pt-1">
                  Anonymous accounts are temporary. Use email or Google to keep your data.
                </p>
              </div>
            )}

            {mode === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-stone-900 hover:bg-black text-white transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="font-bold text-stone-500 hover:text-stone-900 transition-colors">
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>

                <button type="button" onClick={resetToOptions} className="w-full text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors pt-1">
                  ← Back to options
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
