/**
 * HUB by Raisen — Overlay "Nuevo Contacto" dentro del modal de cotizacion: reusa el wizard 2-pasos de
 * CRM (CreateModal). Al crear, invalida la lista de contactos (para que aparezca en CRM y en el
 * selector) y devuelve el id para precargarlo en la cotizacion. C4 <=75.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { crearContacto } from "@/lib/contacts-client";
import { CreateModal } from "@/routes/contacts-ui/create-modal";

export function QuoteNewContact({ lang, onClose, onCreated }: {
  lang: "es" | "en"; onClose: () => void; onCreated: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [segment, setSegment] = useState("nuevo");
  const onSave = async () => {
    if (!name.trim()) return;
    const r = await crearContacto({ display_name: name.trim(), primary_phone: phone.trim() || undefined, primary_email: email.trim() || undefined, segment, address: address.trim() || undefined });
    if (r.ok) { await qc.invalidateQueries({ queryKey: ["contacts"] }); onCreated(r.value.id); }
  };
  return (
    <CreateModal language={lang} formName={name} setFormName={setName} formPhone={phone} setFormPhone={setPhone}
      formEmail={email} setFormEmail={setEmail} formAddress={address} setFormAddress={setAddress} formSegment={segment} setFormSegment={setSegment}
      onSave={() => void onSave()} onClose={onClose} />
  );
}
