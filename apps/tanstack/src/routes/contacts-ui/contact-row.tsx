/**
 * HUB by Raisen — Fila de contacto en CRM (mismo estilo/tamano que Agendados): nombre + telefono +
 * segmento. Se pinta dentro de RowList. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { ContactListItem } from "@/lib/contacts-client";
import { CANAL } from "./contacts-data";

export function ContactRow({ lang, contact }: { lang: Idioma; contact: ContactListItem }) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-border/30 px-3 py-2">
      <span className="flex-1 truncate text-sm font-medium text-foreground">{contact.displayName}</span>
      {contact.channel && CANAL[contact.channel] ? <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: CANAL[contact.channel]!.bg, color: CANAL[contact.channel]!.fg }}>{CANAL[contact.channel]!.label}</span> : null}
      {contact.type === "empresa" ? <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: "hsl(265 60% 55% / 0.18)", color: "hsl(265 55% 62%)" }}>{t(lang, "contacts.type.empresa")}</span> : null}
      <span className="shrink-0 text-xs text-muted-foreground">{contact.phone ?? "—"}</span>
      <span className="shrink-0 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>{t(lang, "contacts.segment." + (contact.segment || "general"))}</span>
    </div>
  );
}
