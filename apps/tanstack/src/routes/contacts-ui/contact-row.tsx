/**
 * HUB by Raisen — Fila de contacto en CRM (mismo estilo/tamano que Agendados): nombre + telefono +
 * segmento. Se pinta dentro de RowList. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { ContactListItem } from "@/lib/contacts-client";

export function ContactRow({ lang, contact }: { lang: Idioma; contact: ContactListItem }) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-border/30 px-3 py-2">
      <span className="flex-1 truncate text-sm font-medium text-foreground">{contact.displayName}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{contact.phone ?? "—"}</span>
      <span className="shrink-0 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>{contact.segment ? t(lang, "contacts.segment." + contact.segment) : "—"}</span>
    </div>
  );
}
