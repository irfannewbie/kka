import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck, AlertTriangle } from 'lucide-react';
import { signInWithCustomEmail, ADMIN_EMAILS, getAuthErrorMessage } from '../services/firebaseAuth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

/**
 * Login admin dengan email + password (Firebase Email/Password).
 * Dipakai sebagai lapisan pengaman tambahan di samping LOGIN GOOGLE.
 */
export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState<string>('admin@ifkka.com');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await signInWithCustomEmail(email, password);
      onSuccess(user.email || email.trim().toLowerCase());
      setPassword('');
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Password salah. Periksa kembali password akun admin Anda.');
      } else if (code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.');
      } else if (code === 'auth/network-request-failed') {
        setError('Tidak dapat menghubungi server Firebase. Periksa koneksi internet.');
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Login Admin dengan Email"
    >
      <div className="w-full max-w-md bg-[#F2EFEB] border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a]">
        <div className="flex items-center justify-between bg-[#1a1a1a] text-white px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="font-mono-code text-xs font-black uppercase tracking-wider">
              Login Admin · Email &amp; Password
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 hover:bg-white/20 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-mono-code">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-[#1a1a1a]">
              Email Admin
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                list="admin-email-options"
                autoComplete="username"
                placeholder="nama@email.com"
                className="w-full bg-white border-2 border-[#1a1a1a] pl-8 pr-2.5 py-2 text-xs font-bold text-[#1a1a1a]"
              />
              <datalist id="admin-email-options">
                {ADMIN_EMAILS.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            </div>
            <p className="text-[9px] text-slate-500 leading-snug">
              Hanya email yang terdaftar sebagai admin yang dapat masuk.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-[#1a1a1a]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white border-2 border-[#1a1a1a] pl-8 pr-2.5 py-2 text-xs font-bold text-[#1a1a1a]"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-100 border-2 border-rose-700 p-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-700 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-rose-900 leading-snug">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#2e59e6] hover:bg-blue-700 text-white text-xs font-black border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'MEMPROSES...' : 'MASUK'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-[#E5E0D8] text-[#1a1a1a] text-xs font-black border-2 border-[#1a1a1a] cursor-pointer"
            >
              BATAL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
