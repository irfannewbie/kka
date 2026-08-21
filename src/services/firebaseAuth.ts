import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

export const ADMIN_EMAIL = 'irfannewbie7@gmail.com';

export const DEFAULT_ADMIN_USER: User = {
  uid: 'admin-irfannewbie7',
  email: ADMIN_EMAIL,
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
};

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory and local storage
const TOKEN_KEY = 'tugas_siswa_google_access_token';
let cachedAccessToken: string | null = localStorage.getItem(TOKEN_KEY);

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const activeToken = cachedAccessToken || localStorage.getItem(TOKEN_KEY);
      if (onAuthSuccess) onAuthSuccess(firebaseUser, activeToken);
    } else {
      // Default to persistent administrator session for irfannewbie7@gmail.com
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (onAuthSuccess) {
        onAuthSuccess(DEFAULT_ADMIN_USER, savedToken);
      }
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh token akses dari Google.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem(TOKEN_KEY, credential.accessToken);
    } catch (e) {
      // ignore
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || localStorage.getItem(TOKEN_KEY);
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    // ignore
  }
  cachedAccessToken = null;
  localStorage.removeItem(TOKEN_KEY);
};
