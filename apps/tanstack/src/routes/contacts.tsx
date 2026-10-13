/**
 * HUB by Raisen — Pagina de Contactos CRM Lite (/contacts).
 * Lista con busqueda, filtros de segmento, creacion manual.
 * Datos reales desde tabla contacts via Supabase REST.
 * Sin datos mock (N5). i18n completo.
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarContactos, crearContacto, type ContactListItem } from "@/lib/contacts-client";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export const ContactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: ContactsPage,
});

const SEGMENTOS = ["vip", "regular", "nuevo", "empresa"];

const TONE_SEGMENTO: Record<string, "hub" | "success" | "warn" | "process" | "danger"> = {
  vip: "hub", regular: "success", nuevo: "warn", empresa: "process",
};

function ContactsPage() {
  const { language } = usePreferences();
  const [busqueda, setBusqueda] = useState("");
  const [filtroSegmento, setFiltroSegmento] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSegment, setFormSegment] = useState("regular");
  const { data, isPending, refetch } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const r = await listarContactos();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

  const filtrados = (data ?? []).filter((c) => {
    if (filtroSegmento && c.segment !== filtroSegmento) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q)
    );
  });

  async function handleCreate() {
    if (!formName.trim()) return;
    const r = await crearContacto({
      display_name: formName.trim(),
      primary_phone: formPhone.trim() || undefined,
      primary_email: formEmail.trim() || undefined,
      segment: formSegment,
    });
    if (r.ok) {
      setShowCreate(false);
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormSegment("regular");
      void refetch();
    }
  }

  return (
    <div className="view space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t(language, "contacts.title")}</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          {t(language, "contacts.create")}
        </Button>
      </div>

      <Input
        placeholder={t(language, "contacts.search")}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="flex flex-wrap gap-1.5">
        {SEGMENTOS.map((s) => (
          <Chip
            key={s}
            active={filtroSegmento === s}
            onClick={() => setFiltroSegmento(filtroSegmento === s ? null : s)}
          >
            {t(language, "contacts.segment." + s)}
          </Chip>
        ))}
      </div>

      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "common.loading")}
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t(language, "contacts.empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtrados.map((c) => (
            <ContactCard key={c.id} contact={c} language={language} />
          ))}
        </div>
      )}

      {showCreate ? (
        <CreateModal
          language={language}
          formName={formName} setFormName={setFormName}
          formPhone={formPhone} setFormPhone={setFormPhone}
          formEmail={formEmail} setFormEmail={setFormEmail}
          formSegment={formSegment} setFormSegment={setFormSegment}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      ) : null}
    </div>
  );
}

function ContactCard({ contact, language }: { contact: ContactListItem; language: "es" | "en" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{contact.displayName}</CardTitle>
        <Badge tone={TONE_SEGMENTO[contact.segment ?? ""] ?? "warn"}>
          {contact.segment ? t(language, "contacts.segment." + contact.segment) : "—"}
        </Badge>
      </CardHeader>
      <CardBody>
        <Row label={t(language, "contacts.phone")} value={contact.phone ?? "—"} />
        <Row label={t(language, "contacts.email")} value={contact.email ?? "—"} />
        <Row label={t(language, "contacts.ltv")} value={`$${contact.ltvUsd.toFixed(2)}`} />
        <Row label={t(language, "contacts.orders")} value={String(contact.totalOrders)} />
      </CardBody>
    </Card>
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

function CreateModal({
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
      <Card className="w-full max-w-md">
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
              {["vip", "regular", "nuevo", "empresa"].map((s) => (
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