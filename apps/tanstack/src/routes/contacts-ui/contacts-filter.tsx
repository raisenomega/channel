import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { SEGMENTOS } from "./contacts-data";

export function ContactsFilter({
  language, busqueda, onBusquedaChange,
  filtroSegmento, onFiltroChange,
}: {
  language: "es" | "en";
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  filtroSegmento: string | null;
  onFiltroChange: (v: string | null) => void;
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
            active={filtroSegmento === s}
            onClick={() => onFiltroChange(filtroSegmento === s ? null : s)}
          >
            {t(language, "contacts.segment." + s)}
          </Chip>
        ))}
      </div>
    </>
  );
}