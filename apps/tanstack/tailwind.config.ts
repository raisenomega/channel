import type { Config } from "tailwindcss";

/**
 * HUB by Raisen — OMEGA config.
 * En Tailwind v4 la fuente de verdad son los tokens en src/styles/index.css
 * (bloque @theme). Este fichero queda como contrato tipado de la identidad:
 * gold #B8963D, navy #1B2A4A, dark #0E1420.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        gold: "#B8963D",
        navy: "#1B2A4A",
        dark: "#0E1420",
      },
    },
  },
} satisfies Config;
