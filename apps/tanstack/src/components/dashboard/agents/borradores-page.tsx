/**
 * HUB by Raisen — Pagina Borradores: tarjetas (4 por linea) de lo que generan los agentes; clic abre el
 * modal con el texto COMPLETO + a quien responde. Aprobar (envia) / Denegar. Cola supervisada real. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import { useDraftsPending, type DraftItem } from "@/hooks/useDraftsPending";
import { BorradorCard } from "./borrador-card";
import { BorradorModal } from "./borrador-modal";
import { firmarCotizacion } from "./firmar-cotizacion";

export function BorradoresPage({ lang }: { lang: Idioma }) {
  const { drafts: todos, reload } = useDraftsPending();
  const drafts = todos.filter((d) => d.scope !== "quote"); // las cotizaciones viven en el chip Cotizacion del Inbox
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<DraftItem | null>(null);
  const [note, setNote] = useState("");
  const act = async (id: string, path: string, body: Record<string, unknown>) => {
    const tid = resolveTenantId();
    if (!tid || busy) return;
    setBusy(true); setNote("");
    try {
      const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/${id}/${path}`, { method: "POST", body: JSON.stringify(body) });
      if (path === "approve" && r.ok) { const j = (await r.json()) as { sent?: boolean; sendError?: string }; setNote(j.sent ? t(lang, "dr.sent") : j.sendError ? `${t(lang, "dr.sendfail")}: ${j.sendError}` : t(lang, "dr.approvednosend")); }
      setSel(null); reload();
    } catch { /* */ }
    setBusy(false);
  };
  const aprobar = (id: string) => void (async () => {
    const d = drafts.find((x) => x.id === id);
    if (d?.scope === "quote") { // FIRMA: crea la cotizacion real primero, luego marca el draft aprobado
      if (busy) return;
      if (!(await firmarCotizacion(d))) { setNote(t(lang, "dr.quotefail")); return; }
      await act(id, "approve", {}); setNote(t(lang, "dr.quotedone")); return;
    }
    void act(id, "approve", {});
  })();
  const denegar = (id: string) => void act(id, "reject", { reason: "Denegado por el dueno desde Borradores" });
  return (
    <div className="space-y-3">
      <header>
        <h3 className="text-lg font-bold text-foreground">{t(lang, "dr.title")}</h3>
        <p className="text-sm text-muted-foreground">{t(lang, "dr.subtitle")}</p>
      </header>
      {note ? <p className="rounded-lg border border-border/60 bg-card-soft px-3 py-1.5 text-xs font-semibold text-foreground">{note}</p> : null}
      {drafts.length === 0
        ? <p className="rounded-xl border border-border/40 bg-card-soft p-4 text-sm text-muted-foreground">{t(lang, "dr.empty")}</p>
        : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {drafts.map((d) => <BorradorCard key={d.id} lang={lang} draft={d} busy={busy} onOpen={setSel} onApprove={aprobar} onReject={denegar} />)}
          </div>
        )}
      {sel ? <BorradorModal lang={lang} draft={sel} busy={busy} onClose={() => setSel(null)} onApprove={aprobar} onReject={denegar} /> : null}
    </div>
  );
}
