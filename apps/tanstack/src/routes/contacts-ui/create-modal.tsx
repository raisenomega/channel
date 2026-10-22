/**
 * HUB by Raisen — M-12 (D-45): alta de contacto como wizard 2-pasos OMEGA
 * (max-w-xl, mismo framework visual que TenantWizardShell). Paso 1 datos +
 * chips SEGMENTO (vip/regular/nuevo/empresa, NO plan); Paso 2 confirmar + crear.
 * Mantiene los props controlados (contacts.tsx no cambia). C4 <=75.
 */
import { useState } from "react";
import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SEGMENTOS } from "./contacts-data";

const E164 = /^\+[1-9]\d{6,14}$/;

export function CreateModal({
  language, formName, setFormName, formPhone, setFormPhone, formEmail, setFormEmail,
  formAddress, setFormAddress, formSegment, setFormSegment, onSave, onClose,
}: {
  language: "es" | "en";
  formName: string; setFormName: (v: string) => void;
  formPhone: string; setFormPhone: (v: string) => void;
  formEmail: string; setFormEmail: (v: string) => void;
  formAddress: string; setFormAddress: (v: string) => void;
  formSegment: string; setFormSegment: (v: string) => void;
  onSave: () => void; onClose: () => void;
}) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const phoneBad = formPhone !== "" && !E164.test(formPhone);
  const canNext = formName.trim() !== "" && !phoneBad;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <CardHeader><CardTitle>{t(language, paso === 1 ? "contacts.step1" : "contacts.step2")}</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {paso === 1 ? (
            <>
              <Input label={t(language, "contacts.createName")} value={formName} onChange={(e) => setFormName(e.target.value)} />
              <Input label={t(language, "contacts.createPhone")} value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              <Input label={t(language, "contacts.createEmail")} type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              <Input label={t(language, "contacts.createAddress")} value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t(language, "contacts.createSegment")}</label>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {SEGMENTOS.map((s) => (
                    <Chip key={s} active={formSegment === s} onClick={() => setFormSegment(s)}>{t(language, "contacts.segment." + s)}</Chip>
                  ))}
                </div>
              </div>
              {phoneBad ? <p className="text-xs text-critical">E.164: +17871234567</p> : null}
              <div className="flex gap-2 pt-2">
                <Button variant="primary" disabled={!canNext} onClick={() => setPaso(2)}>{t(language, "common.next")}</Button>
                <Button variant="ghost" onClick={onClose}>{t(language, "contacts.cancel")}</Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl glass-card p-3 text-sm space-y-1">
                <div><strong>{formName}</strong></div>
                <div className="text-muted-foreground">{formPhone || "—"} · {formEmail || "—"}</div>
                <div className="text-muted-foreground">{t(language, "contacts.segment." + formSegment)}</div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setPaso(1)}>{t(language, "common.back")}</Button>
                <Button variant="primary" onClick={onSave}>{t(language, "contacts.save")}</Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
