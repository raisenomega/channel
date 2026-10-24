/**
 * HUB by Raisen — Panel de config de los agentes (S7): modo + umbral + capacidades (firma) + revision +
 * operacion (canales/horario/tope) + guardar. Por negocio. Minimalista. C4 <=75.
 */
import { useState, useEffect } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { useAgentConfig, type AgentsConfig } from "@/hooks/useAgentConfig";
import { ConfigToggle } from "./config-toggle";
import { ConfigHours } from "./config-hours";

const MODES = [{ id: "off", c: "" }, { id: "supervised", c: "35 90% 55%" }, { id: "autonomous", c: "150 65% 45%" }];
const CAN = ["reply", "quote", "invoice", "order", "charge", "appointment"] as const;
const REVIEW = ["opportunities", "complaints", "newContacts"] as const;
const CHANNELS = ["whatsapp", "instagram", "facebook"];

export function ConfigPanel({ lang }: { lang: Idioma }) {
  const { mode, config, busy, saved, save } = useAgentConfig();
  const [m, setM] = useState(mode);
  const [c, setC] = useState<AgentsConfig | null>(config);
  useEffect(() => { setM(mode); }, [mode]);
  useEffect(() => { setC(config); }, [config]);
  if (!c) return <p className="p-2 text-xs text-muted-foreground">{t(lang, "cfg.loading")}</p>;
  const can = (k: typeof CAN[number]) => setC({ ...c, can: { ...c.can, [k]: !c.can[k] } });
  const rev = (k: typeof REVIEW[number]) => setC({ ...c, review: { ...c.review, [k]: !c.review[k] } });
  const chan = (x: string) => setC({ ...c, channels: c.channels.includes(x) ? c.channels.filter((y) => y !== x) : [...c.channels, x] });
  return (
    <div className="max-h-[70vh] w-72 space-y-2 overflow-y-auto text-[11px]">
      <div className="flex gap-1">{MODES.map((x) => <button key={x.id} type="button" onClick={() => setM(x.id)} className={"flex-1 rounded-lg border px-1 py-1 font-bold" + (m === x.id ? "" : " opacity-50")} style={{ color: x.c ? `hsl(${x.c})` : undefined, borderColor: m === x.id && x.c ? `hsl(${x.c})` : "hsl(var(--border))" }}>{t(lang, "mode." + x.id)}</button>)}</div>
      <label className="block"><span className="text-muted-foreground">{t(lang, "cfg.confidence")}: {c.confidence}/10</span><input type="range" min={0} max={10} value={c.confidence} onChange={(e) => setC({ ...c, confidence: Number(e.target.value) })} className="w-full" /></label>
      <div><p className="font-bold uppercase text-muted-foreground">{t(lang, "cfg.can")}</p>{CAN.map((k) => <ConfigToggle key={k} label={t(lang, "cfg.can." + k)} on={c.can[k]} onToggle={() => can(k)} accent="150 65% 45%" />)}</div>
      <div><p className="font-bold uppercase text-muted-foreground">{t(lang, "cfg.review")}</p>{REVIEW.map((k) => <ConfigToggle key={k} label={t(lang, "cfg.review." + k)} on={c.review[k]} onToggle={() => rev(k)} accent="35 90% 55%" />)}</div>
      <div><p className="font-bold uppercase text-muted-foreground">{t(lang, "cfg.op")}</p>
        {CHANNELS.map((x) => <ConfigToggle key={x} label={x} on={c.channels.includes(x)} onToggle={() => chan(x)} />)}
        <ConfigHours lang={lang} hours={c.hours} onChange={(hh) => setC({ ...c, hours: hh })} />
        <label className="flex items-center justify-between pt-1"><span className="text-muted-foreground">{t(lang, "cfg.cap")}</span><input type="number" min={1} value={c.dailyCap} onChange={(e) => setC({ ...c, dailyCap: Number(e.target.value) })} className="w-14 rounded border border-border/55 bg-card-soft p-0.5 text-right text-foreground" /></label>
      </div>
      <div className="flex items-center gap-2 border-t border-border/40 pt-2">
        <button type="button" disabled={busy} onClick={() => void save(m, c)} className="chip font-bold text-white" style={{ background: "hsl(var(--success))" }}>{busy ? t(lang, "ctx.saving") : t(lang, "ctx.save")}</button>
        {saved ? <span className="font-semibold" style={{ color: "hsl(var(--success))" }}>{t(lang, "ctx.saved")}</span> : null}
      </div>
    </div>
  );
}
