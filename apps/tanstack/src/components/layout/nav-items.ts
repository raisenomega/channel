/**
 * HUB by Raisen — Items de navegación compartidos por el header (Shell) y el
 * BottomNav. Extraído de shell.tsx (H5) para mantener C4 ≤75.
 */
import type { NavItem } from "./bottom-nav";

export const LINKS: NavItem[] = [
  { to: "/inbox", label: "nav.dashboard" },
  { to: "/contacts", label: "nav.contacts" },
  { to: "/quotes", label: "nav.quotes" },
  { to: "/pdf-templates", label: "nav.pdfTemplates" },
  { to: "/orders", label: "nav.orders" },
  { to: "/payments", label: "nav.payments" },
  { to: "/automation", label: "nav.automation" },
  { to: "/reports", label: "nav.reports" },
  { to: "/agent", label: "nav.agent" },
  { to: "/channels", label: "nav.channels" },
  { to: "/templates", label: "nav.templates" },
  { to: "/settings", label: "nav.settings" },
];
