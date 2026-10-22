/**
 * HUB by Raisen — Campos del cliente de la cotizacion: contacto (fijo del hilo, elegido, o uno recien
 * creado via preselect) + servicio/producto + telefono + email + direccion de entrega. Telefono/email
 * se autollenan del contacto y son editables; se guardan en la cotizacion. Reporta via onChange. C4 <=75.
 */
import { useEffect, useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { ContactListItem } from "@/lib/contacts-client";

export interface ClientData { cid: string; name: string; service: string; phone: string; email: string; address: string; }
const INP = "h-10 w-full rounded-xl border border-border/55 bg-card-soft px-3 text-sm text-foreground";

export function QuoteClientFields({ lang, contactId, contactName, contacts, preselect, onChange }: {
  lang: Idioma; contactId: string; contactName: string; contacts: ContactListItem[];
  preselect: string; onChange: (d: ClientData) => void;
}) {
  const [picked, setPicked] = useState("");
  const [service, setService] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  useEffect(() => { if (preselect) setPicked(preselect); }, [preselect]);
  const showPicker = !contactId || picked !== "";
  const cid = picked || contactId;
  const name = showPicker ? (contacts.find((c) => c.id === cid)?.displayName ?? "") : contactName;
  useEffect(() => {
    const c = contacts.find((x) => x.id === cid);
    setPhone(c?.phone ?? ""); setEmail(c?.email ?? "");
  }, [cid, contacts]);
  useEffect(() => { onChange({ cid, name, service, phone, email, address }); }, [cid, name, service, phone, email, address, onChange]);
  return (
    <div className="space-y-2">
      {!showPicker ? (
        <div className="rounded-xl border border-border/55 bg-card-soft px-3 py-2 text-sm"><span className="text-muted-foreground">{t(lang, "quotes.contact")}: </span><span className="font-bold text-foreground">{contactName}</span></div>
      ) : (
        <select value={picked} onChange={(e) => setPicked(e.target.value)} className={INP}>
          <option value="">{t(lang, "quotes.selectContact")}</option>
          {contacts.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
        </select>
      )}
      <input value={service} onChange={(e) => setService(e.target.value)} placeholder={t(lang, "quotes.serviceLabel")} className={INP} />
      <div className="grid grid-cols-2 gap-2">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t(lang, "quotes.tpl.phone")} className={INP} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t(lang, "quotes.tpl.email")} className={INP} />
      </div>
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t(lang, "quotes.deliveryAddr")} className={INP} />
    </div>
  );
}
