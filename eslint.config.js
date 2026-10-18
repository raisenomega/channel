// @ts-check
/**
 * ESLint 9 flat config for HUB by Raisen.
 * Lints TypeScript sources under src. Usa js.configs.recommended (objeto real
 * de @eslint/js), NO el string 'eslint:recommended' (invalido en flat config).
 * Globals de Deno/Node/Browser registrados para evitar no-undef.
 */
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import noRawLoginRedirect from "./scripts/eslint-rules/no-raw-login-redirect.js";
import noOrphanSessionCleanup from "./scripts/eslint-rules/no-orphan-session-cleanup.js";
import noServiceRoleBypass from "./scripts/eslint-rules/no-service-role-bypass.js";
import webhookSignatureFirst from "./scripts/eslint-rules/webhook-signature-first.js";
import p1HonestidadOauth from "./scripts/eslint-rules/p1-honestidad-oauth.js";
import oauthStateCorsAllowlist from "./scripts/eslint-rules/oauth-state-cors-allowlist.js";

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
    files: ["src/**/*.ts", "tests/**/*.ts"],
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
        "warn",
        {
          argsIgnorePattern: "^_[a-zA-Z0-9]+$",
          varsIgnorePattern: "^_[a-zA-Z0-9]+$",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-ignore": true,
        "ts-expect-error": true,
        "ts-nocheck": true,
      }],
    },
  },
  {
    // Compuerta #19 — fabless: los *-wrapper.ts RECIBEN dependencias reales y las cablean.
    // Un parametro sin uso (p.ej. `router`) es un bug de DI (los stubs inline disfrazan errores).
    // NO permite stubs silenciosos: cualquier variable/parametro sin uso es error.
    files: ["src/server/*-wrapper.ts"],
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
  // Compuerta #21 — dedicada: prohibe window.location.href = "/login" fuera del helper
  {
    files: ["apps/tanstack/src/**/*.{ts,tsx}"],
    plugins: { "custom": { rules: { "no-raw-login-redirect": noRawLoginRedirect, "no-orphan-session-cleanup": noOrphanSessionCleanup } } },
    rules: {
      "custom/no-raw-login-redirect": "error",
      "custom/no-orphan-session-cleanup": "error",
      // Permitir parametros _-prefix (ej. toggleCanal(_channelId, _active))
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  // Compuerta #23 (FORTRESS N) — no service_role/supabaseAdmin directo en rutas publicas
  {
    files: ["src/server/*-routes-*.ts"],
    plugins: { "fortress": { rules: { "no-service-role-bypass": noServiceRoleBypass } } },
    rules: { "fortress/no-service-role-bypass": "error" },
  },
  // Compuerta #24 (FORTRESS N) — firma del webhook como primer await
  {
    files: ["src/channels/**/routes/webhook*.ts"],
    plugins: { "fortress": { rules: { "webhook-signature-first": webhookSignatureFirst } } },
    rules: { "fortress/webhook-signature-first": "error" },
  },
  // Compuerta #40 (FORTRESS O) — callback OAuth revalida origin vs CORS allowlist tras HMAC
  {
    files: ["src/channels/presentation/routes/*.ts", "src/server/*callback*.ts"],
    plugins: { "fortress": { rules: { "oauth-state-cors-allowlist": oauthStateCorsAllowlist } } },
    rules: { "fortress/oauth-state-cors-allowlist": "error" },
  },
  // Compuerta #39 (FORTRESS O) — P1 honestidad: componentes de inicio de conexion no afirman conectado
  {
    files: ["apps/tanstack/src/routes/channels-ui/connect-cta.tsx", "apps/tanstack/src/components/dashboard/onboarding/channel-connect-button.tsx"],
    plugins: { "fortress": { rules: { "p1-honestidad-oauth": p1HonestidadOauth } } },
    rules: { "fortress/p1-honestidad-oauth": "error" },
  },
];