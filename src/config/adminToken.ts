/**
 * Token admin bersama untuk API internal (/api/*).
 *
 * Sisi server membandingkan header `x-admin-token` dengan nilai ini
 * (dapat di-override lewat env `ADMIN_API_TOKEN`), sedangkan sisi klien
 * menyertakan header yang sama pada setiap panggilan endpoint admin.
 *
 * CATATAN KEAMANAN: token yang dikirim dari browser hanyalah lapisan
 * perlindungan pertama (memblokir bot/scanner & akses acak). Perlindungan
 * penuh memerlukan autentikasi sesi di server (mis. verifikasi Firebase ID
 * token) — lihat README bagian Keamanan.
 */

export const DEFAULT_ADMIN_TOKEN = 'kka-master-7f3c9a1e-2b4d';

type MaybeViteImportMeta = { env?: Record<string, string | undefined> };

/** Baca token admin di sisi browser (VITE_ADMIN_TOKEN), fallback ke default. */
export function getClientAdminToken(): string {
  const env = (import.meta as unknown as MaybeViteImportMeta).env;
  return env?.VITE_ADMIN_TOKEN?.trim() || DEFAULT_ADMIN_TOKEN;
}

/** Header siap pakai untuk fetch admin dari klien. */
export function adminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-admin-token': getClientAdminToken(),
  };
}

/** fetch yang otomatis menyertakan header admin. */
export function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...adminHeaders(),
    },
  });
}
