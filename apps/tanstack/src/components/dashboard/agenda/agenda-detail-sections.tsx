/**
 * HUB by Raisen — Secciones relacionadas del modal de cita (estado del hilo + SLA,
 * cotizaciones/facturas, pagos, documentos, notas de seguimiento). Oro puro. C4 <=75.
 */
import type { ReactNode } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useApptDetail } from "./agenda-detail-hook";

type Detail = ReturnType<typeof useApptDetail>;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3 border-t border-border/40 pt-2">
      <h4 className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

const money = (n: number, c: string): string => `${c} ${Number(n ?? 0).toFixed(2)}`;

export function AgendaDetailSections({ lang, d }: { lang: Idioma; d: Detail }) {
  const conv = d.conversation;
  return (
    <>
      {conv && (
        <Section title={t(lang, "agenda.d.conversacion")}>
          <Row label={t(lang, "agenda.d.estadoHilo")} value={conv.status ? t(lang, "agenda.hs." + conv.status) : "-"} />
          <Row label="SLA" value={conv.sla_violated ? t(lang, "agenda.d.slaViol") : t(lang, "agenda.d.slaOk")} />
        </Section>
      )}
      {(d.quotes.length > 0 || d.orders.length > 0) && (
        <Section title={t(lang, "agenda.d.pedido")}>
          {d.quotes.map((q) => <Row key={q.id} label={t(lang, "cf.cotizacion") + " - " + q.status} value={money(q.total_amount, q.currency)} />)}
          {d.orders.map((o) => <Row key={o.id} label={t(lang, "cf.factura") + " - " + o.status} value={money(o.total_amount, o.currency)} />)}
        </Section>
      )}
      {d.payments.length > 0 && (
        <Section title={t(lang, "cf.pagos")}>
          {d.payments.map((p) => <Row key={p.id} label={p.status + (p.provider ? " - " + p.provider : "")} value={money(p.amount, p.currency)} />)}
        </Section>
      )}
      {d.docs.length > 0 && (
        <Section title={t(lang, "cf.documentos")}>
          {d.docs.map((x) => <Row key={x.id} label={x.file_type ?? "doc"} value={x.file_name ?? "-"} />)}
        </Section>
      )}
      {d.notes.length > 0 && (
        <Section title={t(lang, "agenda.d.notas")}>
          {d.notes.map((n) => <p key={n.id} className="mb-1 text-xs text-foreground">- {n.note}</p>)}
        </Section>
      )}
    </>
  );
}
