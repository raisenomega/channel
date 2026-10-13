// @ts-check
/**
 * ESLint 9 flat config for HUB by Raisen.
 * Lints TypeScript sources under src. Usa js.configs.recommended (objeto real
 * de @eslint/js), NO el string 'eslint:recommended' (invalido en flat config).
 * Globals de Deno/Node/Browser registrados para evitar no-undef.
 */
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".vercel/**",
      "supabase/**",
      "*.config.*",
      "*.cjs",
      "*.mjs",
    ],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tseslint.parser,
      globals: {
        Deno: "readonly",
        addEventListener: "readonly",
        removeEventListener: "readonly",
        dispatchEvent: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        performance: "readonly",
        crypto: "readonly",
        globalThis: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];