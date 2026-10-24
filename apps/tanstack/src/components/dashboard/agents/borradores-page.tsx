/**
 * HUB by Raisen — Pagina Borradores: tarjetas (4 por linea) de lo que generan los agentes; el dueno
 * aprueba (envia) o deniega. Usa la cola supervisada real (/drafts/pending + approve/reject). C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import { useDraftsPending } from "@/hooks/useDraftsPending";
import { BorradorCard } from "./borrador-card";

export function BorradoresPage({ lang }: { lang: Idioma }) {
  const { drafts, reload } = useDraftsPending();
  const [busy, setBusy] = useState(false);
  const act = async (id: string, path: string, body: Record<string, unknown>) => {
    const tid = resolveTenantId();
    if (!tid || busy) return;
    setBusy(true);
    try { await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/${id}/${path}`, { method: "POST", body: JSON.stringify(body) }); reload(); } catch { /* */ }
    setBusy(false);
  };
  return (
    <div className="space-y-3">
      <header>
        <h3 className="text-lg font-bold text-foreground">{t(lang, "dr.title")}</h3>
        <p className="text-sm text-muted-foreground">{t(lang, "dr.subtitle")}</p>
      </header>
      {drafts.length === 0
        ? <p className="rounded-xl border border-border/40 bg-card-soft p-4 text-sm text-muted-foreground">{t(lang, "dr.empty")}</p>
        : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {drafts.map((d) => (
              <BorradorCard key={d.id} lang={lang} draft={d} busy={busy}
                onApprove={(id) => void act(id, "approve", {})}
                onReject={(id) => void act(id, "reject", { reason: "Denegado por el dueno desde Borradores" })} />
            ))}
          </div>
        )}
    </div>
  );
}
