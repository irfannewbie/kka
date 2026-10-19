import crypto from 'crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { DEFAULT_ADMIN_TOKEN } from '../src/config/adminToken';

/** Token admin efektif: env ADMIN_API_TOKEN meng-override nilai default. */
export const ADMIN_TOKEN: string = process.env.ADMIN_API_TOKEN?.trim() || DEFAULT_ADMIN_TOKEN;

/**
 * Perbandingan token yang tahan timing attack (panjang dicek secara konstan).
 */
export function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    // Tetap lakukan perbandingan agar durasi tidak bocor via panjang.
    crypto.timingSafeEqual(a, a);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/** Middleware: tolak permintaan tanpa header `x-admin-token` yang valid. */
export const requireAdminToken: RequestHandler = (req, res, next) => {
  const provided = req.header('x-admin-token') || '';
  if (!tokensMatch(provided, ADMIN_TOKEN)) {
    res.status(401).json({
      success: false,
      message: 'Token admin tidak valid. Sertakan header x-admin-token.',
    });
    return;
  }
  next();
};

export function getClientIp(req: Request): string {
  const forwarded = req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export interface RateLimiterOptions {
  /** Jendela waktu dalam milidetik. */
  windowMs: number;
  /** Jumlah maksimum permintaan dalam satu jendela. */
  max: number;
  /** Prefix kunci internal (mencegah tabrakan antar limiter). */
  keyPrefix?: string;
  /** Sumber waktu, dapat di-inject untuk pengujian. */
  now?: () => number;
}

export interface RateLimiter {
  (req: Request, res: Response, next: NextFunction): void;
  /** Uji batas dengan kunci arbitrer (dipakai unit test). */
  hit(key: string, at?: number): { allowed: boolean; remaining: number; resetAt: number };
  /** Hapus seluruh pencatatan (dipakai unit test). */
  reset(): void;
}

/**
 * Rate limiter in-memory sederhana (sliding window per kunci).
 * Cukup untuk satu proses server; untuk multi-instance gunakan Redis dsb.
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, max, keyPrefix = 'rl', now = () => Date.now() } = options;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  // Bersihkan bucket yang kedaluwarsa agar memori tidak membengkak.
  const cleanupTimer = setInterval(
    () => {
      const t = now();
      buckets.forEach((bucket, key) => {
        if (bucket.resetAt <= t) buckets.delete(key);
      });
    },
    Math.max(windowMs, 30_000)
  );
  // Jangan menahan proses Node tetap hidup hanya karena timer ini.
  cleanupTimer.unref?.();

  const limiter = ((req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const result = limiter.hit(key);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    if (!result.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - now()) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        success: false,
        message: 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.',
      });
      return;
    }
    next();
  }) as RateLimiter;

  limiter.hit = (key: string, at: number = now()) => {
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= at) {
      bucket = { count: 0, resetAt: at + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    return {
      allowed: bucket.count <= max,
      remaining: Math.max(0, max - bucket.count),
      resetAt: bucket.resetAt,
    };
  };

  limiter.reset = () => buckets.clear();

  return limiter;
}

/** Bungkus handler async agar error menuju error handler global Express. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ---------------------------------------------------------------------------
// Validator payload ringkas (tanpa dependensi eksternal)
// ---------------------------------------------------------------------------

/** Kembalikan string yang sudah di-trim, atau null bila bukan string non-kosong. */
export function asNonEmptyString(value: unknown, maxLen = 500): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

/** Kembalikan string apa pun (boleh kosong) dengan panjang maksimum, atau null bila bukan string. */
export function asBoundedString(value: unknown, maxLen = 2000): string | null {
  if (typeof value !== 'string') return null;
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

/** Kembalikan angka finit, atau null. */
export function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Validasi minimum sebuah payload; kembalikan daftar nama field yang bermasalah. */
export function missingFields(body: unknown, fields: string[]): string[] {
  if (!body || typeof body !== 'object') return [...fields];
  const record = body as Record<string, unknown>;
  return fields.filter((field) => {
    const value = record[field];
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && !value.trim()) return true;
    return false;
  });
}
