import { defineConfig } from 'vitest/config';

// Konfigurasi Vitest — unit test murni (tanpa DOM), env node
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    globals: false,
  },
});
