/**
 * HUB by Raisen — Pagina de Contactos CRM Lite (/contacts).
 * Lista con busqueda, filtros de segmento, creacion manual.
 * Datos reales desde tabla contacts via Supabase REST.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { crearContacto } from "@/lib/contacts-client";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useContactos } from "./contacts-ui/contacts-fetchers";
import { useContactsFilter, useCreateFormState } from "./contacts-ui/contacts-hooks";
import { ContactsFilter } from "./contacts-ui/contacts-filter";
import { ContactCard } from "./contacts-ui/contact-card";
import { CreateModal } from "./contacts-ui/create-modal";

export const ContactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: ContactsPage,
});

function ContactsPage() {
  const { language } = usePreferences();
  const { data, isPending, refetch } = useContactos();
  const { busqueda, setBusqueda, filtroSegmento, setFiltroSegmento, filtrados } = useContactsFilter(data);
  const create = useCreateFormState();

  async function handleCreate() {
    if (!create.formName.trim()) return;
    const r = await crearContacto({ display_name: create.formName.trim(), primary_phone: create.formPhone.trim() || undefined, primary_email: create.formEmail.trim() || undefined, segment: create.formSegment });
    if (r.ok) { create.setShowCreate(false); create.reset(); void refetch(); }
  }

  return (
    <div className="view space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t(language, "contacts.title")}</h2>
        <Button variant="primary" size="sm" onClick={() => create.setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          {t(language, "contacts.create")}
        </Button>
      </div>
      <ContactsFilter language={language} busqueda={busqueda} onBusquedaChange={setBusqueda} filtroSegmento={filtroSegmento} onFiltroChange={setFiltroSegmento} />
      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">{t(language, "common.loading")}</div>
      ) : filtrados.length === 0 ? (
        <Card><CardBody className="py-8 text-center"><p className="text-sm text-muted-foreground">{t(language, "contacts.empty")}</p></CardBody></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{filtrados.map((c) => <ContactCard key={c.id} contact={c} language={language} />)}</div>
      )}
      {create.showCreate ? <CreateModal language={language} formName={create.formName} setFormName={create.setFormName} formPhone={create.formPhone} setFormPhone={create.setFormPhone} formEmail={create.formEmail} setFormEmail={create.setFormEmail} formSegment={create.formSegment} setFormSegment={create.setFormSegment} onSave={handleCreate} onClose={() => create.setShowCreate(false)} /> : null}
    </div>
  );
}