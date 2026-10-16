import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SEGMENTOS } from "./contacts-data";

export function CreateModal({
  language, formName, setFormName, formPhone, setFormPhone,
  formEmail, setFormEmail, formSegment, setFormSegment,
  onSave, onClose,
}: {
  language: "es" | "en";
  formName: string; setFormName: (v: string) => void;
  formPhone: string; setFormPhone: (v: string) => void;
  formEmail: string; setFormEmail: (v: string) => void;
  formSegment: string; setFormSegment: (v: string) => void;
  onSave: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{t(language, "contacts.createTitle")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Input label={t(language, "contacts.createName")} value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input label={t(language, "contacts.createPhone")} value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
          <Input label={t(language, "contacts.createEmail")} type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t(language, "contacts.createSegment")}</label>
            <div className="mt-1 flex gap-2">
              {SEGMENTOS.map((s) => (
                <Chip key={s} active={formSegment === s} onClick={() => setFormSegment(s)}>
                  {t(language, "contacts.segment." + s)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" onClick={onSave}>{t(language, "contacts.save")}</Button>
            <Button variant="ghost" onClick={onClose}>{t(language, "contacts.cancel")}</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}