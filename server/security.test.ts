import { describe, expect, it, vi } from 'vitest';
import {
  ADMIN_TOKEN,
  asBoundedString,
  asFiniteNumber,
  asNonEmptyString,
  createRateLimiter,
  missingFields,
  tokensMatch,
} from './security';

describe('tokensMatch', () => {
  it('token identik diterima', () => {
    expect(tokensMatch('rahasia-123', 'rahasia-123')).toBe(true);
  });

  it('token berbeda ditolak', () => {
    expect(tokensMatch('salah', 'rahasia-123')).toBe(false);
  });

  it('panjang berbeda ditolak tanpa error', () => {
    expect(tokensMatch('pendek', 'yang-jauh-lebih-panjang')).toBe(false);
    expect(tokensMatch('', ADMIN_TOKEN)).toBe(ADMIN_TOKEN === '');
  });

  it('ADMIN_TOKEN tidak kosong', () => {
    expect(ADMIN_TOKEN.length).toBeGreaterThan(0);
  });
});

describe('createRateLimiter', () => {
  it('mengizinkan sampai batas lalu menolak', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 3, now: () => 0 });

    expect(limiter.hit('ip:1')).toEqual({ allowed: true, remaining: 2, resetAt: 1000 });
    expect(limiter.hit('ip:1').allowed).toBe(true);
    expect(limiter.hit('ip:1').allowed).toBe(true);
    const fourth = limiter.hit('ip:1');
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it('jendela waktu di-reset setelah windowMs', () => {
    const currentTime = { t: 0 };
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => currentTime.t });

    expect(limiter.hit('k').allowed).toBe(true);
    expect(limiter.hit('k').allowed).toBe(false);

    currentTime.t = 1001;
    expect(limiter.hit('k').allowed).toBe(true);
  });

  it('kunci berbeda tidak saling mengganggu', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => 0 });
    expect(limiter.hit('a').allowed).toBe(true);
    expect(limiter.hit('b').allowed).toBe(true);
    expect(limiter.hit('a').allowed).toBe(false);
  });

  it('reset() menghapus seluruh pencatatan', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => 0 });
    limiter.hit('a');
    expect(limiter.hit('a').allowed).toBe(false);
    limiter.reset();
    expect(limiter.hit('a').allowed).toBe(true);
  });
});

describe('validator payload', () => {
  it('asNonEmptyString', () => {
    expect(asNonEmptyString('  halo  ')).toBe('halo');
    expect(asNonEmptyString('')).toBeNull();
    expect(asNonEmptyString('   ')).toBeNull();
    expect(asNonEmptyString(42)).toBeNull();
    expect(asNonEmptyString(null)).toBeNull();
    // dipotong sesuai maxLen
    expect(asNonEmptyString('x'.repeat(20), 10)).toHaveLength(10);
  });

  it('asBoundedString mengizinkan string kosong', () => {
    expect(asBoundedString('')).toBe('');
    expect(asBoundedString('bebas')).toBe('bebas');
    expect(asBoundedString(123)).toBeNull();
    expect(asBoundedString('x'.repeat(10), 5)).toHaveLength(5);
  });

  it('asFiniteNumber', () => {
    expect(asFiniteNumber(7)).toBe(7);
    expect(asFiniteNumber('7.5')).toBe(7.5);
    expect(asFiniteNumber('')).toBeNull();
    expect(asFiniteNumber('abc')).toBeNull();
    expect(asFiniteNumber(Infinity)).toBeNull();
    expect(asFiniteNumber(NaN)).toBeNull();
    expect(asFiniteNumber(true)).toBeNull();
  });

  it('missingFields menandai field yang kosong/hilang', () => {
    expect(missingFields({ a: 'x', b: 'y' }, ['a', 'b'])).toEqual([]);
    expect(missingFields({ a: 'x' }, ['a', 'b'])).toEqual(['b']);
    expect(missingFields({ a: '   ' }, ['a'])).toEqual(['a']);
    expect(missingFields({ a: null }, ['a'])).toEqual(['a']);
    expect(missingFields(null, ['a'])).toEqual(['a']);
    expect(missingFields('string', ['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('asyncHandler', () => {
  it('meneruskan rejection ke next()', async () => {
    const { asyncHandler } = await import('./security');
    const next = vi.fn();
    const boom = asyncHandler(async () => {
      throw new Error('gagal');
    });
    boom({} as never, {} as never, next);
    // beri satu tick agar promise rejection terproses
    await new Promise((r) => setTimeout(r, 0));
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
