import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

// Konfigurasi ESLint flat config — dipakai lewat `npm run lint`
export default tseslint.config(
  // Abaikan artefak build & data
  {
    ignores: ['dist/**', 'node_modules/**', 'data/**', 'coverage/**', '*.config.js', '*.config.ts'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Aturan khusus file TypeScript
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Kode legacy: unused vars ditandai sebagai warning dulu agar tidak
      // memblokir lint; bersihkan bertahap dengan `npm run lint:fix` + manual.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
      // Aturan React Compiler yang terlalu ketat untuk pola kode lama
      // (pemanggilan Date.now di useState, akses helper sebelum deklarasi,
      // setState di effect) — tetap terlihat sebagai warning.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },

  // Server & skrip boleh memakai console.log & require gaya Node
  {
    files: ['server.ts', 'server/**/*.ts', 'scripts/**/*.{ts,js}'],
    rules: {
      'no-console': 'off',
    },
  },

  // Test boleh memakai `any` untuk pembanding cepat
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Matikan aturan yang bentrok dengan Prettier (harus terakhir)
  prettier
);
