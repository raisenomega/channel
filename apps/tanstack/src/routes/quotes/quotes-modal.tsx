/**
 * HUB by Raisen — Modal de creacion de Cotizacion.
 */
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import type { ContactListItem } from "@/lib/contacts-client";

export function CreateQuoteModal({
  language, contacts, formContact, setFormContact,
  formAmount, setFormAmount, formCurrency, setFormCurrency,
  onSave, onClose,
}: {
  language: "es" | "en";
  contacts: ContactListItem[];
  formContact: string; setFormContact: (v: string) => void;
  formAmount: string; setFormAmount: (v: string) => void;
  formCurrency: string; setFormCurrency: (v: string) => void;
  onSave: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t(language, "quotes.createTitle")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t(language, "quotes.selectContact")}</label>
            <select
              value={formContact}
              onChange={(e) => setFormContact(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-border/55 bg-card-soft px-3 text-sm text-foreground"
            >
              <option value="">—</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName}</option>
              ))}
            </select>
          </div>
          <Input label={t(language, "quotes.amount")} type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t(language, "quotes.selectCurrency")}</label>
            <select
              value={formCurrency}
              onChange={(e) => setFormCurrency(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-border/55 bg-card-soft px-3 text-sm text-foreground"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
              <option value="COP">COP</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" onClick={onSave}>{t(language, "quotes.save")}</Button>
            <Button variant="ghost" onClick={onClose}>{t(language, "quotes.cancel")}</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}