/**
 * HUB by Raisen — Acciones de cierre honesto de la cita (SOLO en el modal ya guardado, no en crear):
 * Reagendar (abre editar) + Completado / No atendio / Cancelar (cambian el status). C4 <=75.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { setApptStatus } from "./agenda-send";
import type { RowAppointment } from "./agenda-types";

const ST = [
  { st: "completed", key: "completado" },
  { st: "no_show", key: "noAsistio" },
  { st: "cancelled", key: "cancelar" },
];

export function AgendaCloseActions({ lang, accent, appt, onEdit, onDone }: {
  lang: Idioma;
  accent: string;
  appt: RowAppointment;
  onEdit: (a: RowAppointment) => void;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (st: string) => setApptStatus(appt.id, st),
    onSuccess: (r) => { if (r.ok) { void qc.invalidateQueries({ queryKey: ["agenda"] }); void qc.invalidateQueries({ queryKey: ["agendados"] }); onDone(); } },
  });
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-3">
      <button type="button" className="chip font-semibold" style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }} onClick={() => onEdit(appt)}>{t(lang, "agenda.reagendar")}</button>
      {ST.map((a) => (
        <button key={a.st} type="button" className="chip" disabled={m.isPending} onClick={() => m.mutate(a.st)}>{t(lang, "agenda.ca." + a.key)}</button>
      ))}
    </div>
  );
}
