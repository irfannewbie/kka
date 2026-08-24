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

  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return 'Domain web ini belum ditambahkan ke "Authorized Domains" di Firebase Console (Authentication > Settings > Authorized Domains). Namun Anda tetap dapat mengakses dan mengelola seluruh menu /master menggunakan profil admin offline.';
  }
  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return 'Jendela popup Google diblokir oleh browser. Silakan izinkan pop-up pada bilah URL browser Anda atau buka aplikasi di tab baru.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Login dibatalkan karena jendela pop-up ditutup.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Gagal menghubungi server autentikasi. Periksa koneksi internet atau ekstensi pemblokir skrip.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Metode Google Sign-In belum diaktifkan di Firebase Console > Authentication > Sign-in method.';
  }
  return error?.message || 'Terjadi kendala saat proses autentikasi Firebase.';
};

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory only
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      if (onAuthSuccess) onAuthSuccess(firebaseUser, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthSuccess) {
        onAuthSuccess(DEFAULT_ADMIN_USER, null);
      }
    }
  });
};

export const clearAuthToken = () => {
  cachedAccessToken = null;
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

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    // ignore
  }
  cachedAccessToken = null;
};



