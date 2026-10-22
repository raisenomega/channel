/**
 * HUB by Raisen — Banner honesto en Cotizaciones: si la Plantilla PDF no esta configurada, invita a
 * configurarla antes de cotizar. Desaparece una vez hay nombre o logo. Enlaza a /pdf-templates. C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchBusinessInfo } from "./pdf/pdf-business-info";

export function QuotesTemplateBanner({ lang }: { lang: Idioma }) {
  const q = useQuery({ queryKey: ["pdf-biz", "row"], queryFn: () => fetchBusinessInfo("row") });
  const configured = !!(q.data && (q.data.name || q.data.logoUrl));
  if (!q.data || configured) return null;
  return (
    <Link to="/pdf-templates" className="glass-card flex items-center gap-2 border-amber-500/40 px-4 py-3 text-sm font-semibold text-amber-600 dark:text-amber-400">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
      {t(lang, "quotes.tpl.configureFirst")}
    </Link>
  );
}
