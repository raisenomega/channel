import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { SEGMENTOS } from "./contacts-data";

export function ContactsFilter({
  language, busqueda, onBusquedaChange,
  filtroSegmento, onFiltroChange, agendados, onAgendados,
}: {
  language: "es" | "en";
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  filtroSegmento: string | null;
  onFiltroChange: (v: string | null) => void;
  agendados: boolean;
  onAgendados: () => void;
}) {
  return (
    <>
      <Input
        placeholder={t(language, "contacts.search")}
        value={busqueda}
        onChange={(e) => onBusquedaChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        {SEGMENTOS.map((s) => (
          <Chip
            key={s}
            active={!agendados && filtroSegmento === s}
            onClick={() => onFiltroChange(filtroSegmento === s ? null : s)}
          >
            {t(language, "contacts.segment." + s)}
          </Chip>
        ))}
        <Chip active={agendados} onClick={onAgendados}>{t(language, "agenda.agendados")}</Chip>
      </div>
    </>
  );
}
