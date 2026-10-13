/**
 * HUB by Raisen — Pagina de Cotizaciones (/quotes).
 * Lista de cotizaciones con estado, creacion via modal.
 * Boton "Generar PDF" placeholder honesto (P1).
 * Datos reales desde tabla quotes via Supabase REST.
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarQuotes, crearQuote, type QuoteListItem } from "@/lib/quotes-client";
import { listarContactos, type ContactListItem } from "@/lib/contacts-client";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const QuotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/quotes",
  component: QuotesPage,
});

const STATUS_TONE: Record<string, "warn" | "hub" | "success" | "danger" | "process"> = {
  draft: "warn", sent: "hub", accepted: "success", rejected: "danger", expired: "process",
};

function QuotesPage() {
  const { language } = usePreferences();
  const [showCreate, setShowCreate] = useState(false);
  const [formContact, setFormContact] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState("USD");

  const { data: quotes, isPending, refetch } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const r = await listarQuotes();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const r = await listarContactos();
      return r.ok ? r.value : [];
    },
    staleTime: 60_000,
  });

  async function handleCreate() {
    if (!formContact || !formAmount) return;
    const r = await crearQuote({
      contact_id: formContact,
      total_amount: parseFloat(formAmount),
      currency: formCurrency,
    });
    if (r.ok) {
      setShowCreate(false);
      setFormContact("");
      setFormAmount("");
      setFormCurrency("USD");
      void refetch();
    }
  }

  function handlePdf(quote: QuoteListItem) {
    alert(`PDF (P1) — ${t(language, "quotes.pdfPlaceholder")}: ${quote.id}`);
  }

  return (
    <div className="view space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t(language, "quotes.title")}</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          {t(language, "quotes.create")}
        </Button>
      </div>

      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "common.loading")}
        </div>
      ) : !quotes || quotes.length === 0 ? (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t(language, "quotes.empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {quotes.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-sm">{t(language, "quotes.total")}: {q.currency} {q.totalAmount.toFixed(2)}</CardTitle>
                <Badge tone={STATUS_TONE[q.status] ?? "warn"}>
                  {t(language, "quotes.status." + q.status)}
                </Badge>
              </CardHeader>
              <CardBody>
                <Row label={t(language, "quotes.contact")} value={q.contactId ?? "—"} />
                <Row label={t(language, "quotes.date")} value={new Date(q.createdAt).toLocaleDateString()} />
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => handlePdf(q)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  {t(language, "quotes.generatePdf")}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {showCreate ? (
        <CreateQuoteModal
          language={language}
          contacts={contacts ?? []}
          formContact={formContact} setFormContact={setFormContact}
          formAmount={formAmount} setFormAmount={setFormAmount}
          formCurrency={formCurrency} setFormCurrency={setFormCurrency}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function CreateQuoteModal({
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