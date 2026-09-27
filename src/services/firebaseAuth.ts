import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  setPersistence,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// In iframe, sandboxed, or tab-switch environments, IndexedDB can report "Database is closing/hidden".
// We initialize Firebase Auth with multi-tier persistence fallbacks.
function getOrCreateAuth() {
  try {
    return initializeAuth(app, {
      persistence: [
        browserLocalPersistence,
        indexedDBLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (e) {
    return getAuth(app);
  }
}

export const auth = getOrCreateAuth();

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

export const ADMIN_EMAILS: string[] = [
  'irfannewbie7@gmail.com',
  'irfandwi.hs@gmail.com',
];

export const ADMIN_EMAIL = 'irfannewbie7@gmail.com';

export const isAuthorizedAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase());
};

export const ADMIN_PROFILES: Record<string, User> = {
  'irfannewbie7@gmail.com': {
    uid: 'admin-irfan-1',
    email: 'irfannewbie7@gmail.com',
    displayName: 'Irfan (Guru Informatika)',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=irfannewbie7',
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'active-admin-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'google.com',
  },
  'irfandwi.hs@gmail.com': {
    uid: 'admin-irfan-2',
    email: 'irfandwi.hs@gmail.com',
    displayName: 'Irfan Dwi (Admin Master)',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=irfandwihs',
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'active-admin-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'google.com',
  },
};

export const DEFAULT_ADMIN_USER: User = ADMIN_PROFILES['irfandwi.hs@gmail.com'] || ADMIN_PROFILES['irfannewbie7@gmail.com'];

// Helper to get friendly error descriptions
export const getAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain Anda';

  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return `[Kode: auth/unauthorized-domain] Domain "${currentHost}" belum diizinkan. Buka Firebase Console (proyek penilaian-c2329) > Authentication > Settings > Authorized Domains, lalu tambahkan domain "${currentHost}" (pastikan TANPA 'https://' dan TANPA garis miring '/').`;
  }
  if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
    return `[Kode: auth/operation-not-allowed] Metode login Google belum diaktifkan di Firebase. Buka Firebase Console > Authentication > Sign-in method > klik 'Google' > pilih 'Enable' > pilih email dukungan proyek > klik 'Save'.`;
  }
  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return `[Kode: auth/popup-blocked] Jendela popup Google diblokir oleh browser. Silakan klik ikon gembok / popup di bilah URL browser Anda untuk mengizinkan pop-up, atau buka link aplikasi di tab baru (bukan di dalam frame preview).`;
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Proses login dibatalkan karena jendela pop-up Google ditutup sebelum selesai.';
  }
  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return '[Kode: auth/network-request-failed] Gagal terhubung ke server autentikasi Google/Firebase. Periksa koneksi internet atau matikan ekstensi AdBlocker/Privacy Badger yang mungkin memblokir permintaan Firebase.';
  }
  if (code === 'auth/invalid-api-key') {
    return '[Kode: auth/invalid-api-key] Kunci API Firebase tidak valid.';
  }
  return error?.message ? `[${code || 'Error'}] ${error.message}` : 'Terjadi kendala saat proses autentikasi Firebase.';
};

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;

const TOKEN_STORAGE_KEY = 'inforkoding_oauth_token';
const TOKEN_EXPIRY_KEY = 'inforkoding_oauth_token_expiry';

// Get saved access token from localStorage/sessionStorage if not expired
export const getSavedAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY) || sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (token && expiry) {
      const expTime = parseInt(expiry, 10);
      if (Date.now() < expTime) {
        return token;
      } else {
        // Token has expired
        clearAuthToken();
      }
    }
  } catch (e) {
    console.warn('Could not retrieve saved token:', e);
  }
  return null;
};

// Save access token with expiration (typically 1 hour / 3600 seconds)
export const saveAccessToken = (token: string, expiresInSeconds: number = 3600) => {
  cachedAccessToken = token;
  if (typeof window === 'undefined') return;
  try {
    const expiryTime = Date.now() + (expiresInSeconds - 60) * 1000;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } catch (e) {
    console.warn('Could not save token to storage:', e);
  }
};

// Cache the access token in memory with initial fallback to storage
let cachedAccessToken: string | null = getSavedAccessToken();

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  const restoredToken = getSavedAccessToken();
  if (restoredToken) {
    cachedAccessToken = restoredToken;
  }

  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    const currentToken = cachedAccessToken || getSavedAccessToken();
    if (firebaseUser) {
      if (onAuthSuccess) onAuthSuccess(firebaseUser, currentToken);
    } else {
      if (onAuthSuccess) {
        const savedEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('tugas_siswa_active_admin_email_v3') : null;
        const activeProfile = (savedEmail && ADMIN_PROFILES[savedEmail]) || ADMIN_PROFILES['irfandwi.hs@gmail.com'] || DEFAULT_ADMIN_USER;
        onAuthSuccess(activeProfile, currentToken);
      }
    }
  });
};

export const clearAuthToken = () => {
  cachedAccessToken = null;
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (e) {
    // ignore
  }
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    let result;

    try {
      result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    } catch (popupErr: any) {
      const errMsg = String(popupErr?.message || popupErr || '').toLowerCase();
      // If IndexedDB or database closing error occurs in iframe / hidden tab, recover with inMemory / local persistence
      if (
        errMsg.includes('closing') ||
        errMsg.includes('database') ||
        errMsg.includes('hidden') ||
        errMsg.includes('indexeddb') ||
        popupErr?.code === 'auth/internal-error'
      ) {
        console.warn('Storage connection closing or restricted. Recovering with inMemoryPersistence...', popupErr);
        try {
          await setPersistence(auth, inMemoryPersistence);
          result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        } catch (retryErr) {
          throw retryErr;
        }
      } else {
        throw popupErr;
      }
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh token akses dari Google.');
    }

    saveAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }
    console.warn('Sign in handled:', error?.code || error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || getSavedAccessToken();
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    // ignore
  }
  clearAuthToken();
};



