/**
 * HUB by Raisen — Sidebar de contacto del mockup de WhatsApp.
 * Ficha del contacto con datos, medios y configuración.
 */
import { waIcon } from "./wa-icons";
import { colorFor, initials, type WaContact } from "./wa-types";

export function WaContactBar({ open, contact, onClose }: {
  open: boolean; contact: WaContact | null; onClose: () => void;
}) {
  return (
    <div className={"wa-contact-bar" + (open ? " open" : "")}>
      <div className="wa-contact-head">
        <span className="wa-ico" style={{ cursor: "pointer" }} onClick={onClose} dangerouslySetInnerHTML={{ __html: waIcon.back }} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>Información del contacto</span>
      </div>
      <div className="wa-contact-body">
        {contact ? (
          <>
            <div className="wa-contact-hero">
              <span className="wa-avatar" style={{ background: colorFor(contact.name) }}>{initials(contact.name)}</span>
              <div className="wa-name">{contact.name}</div>
              <div className="wa-sub">{contact.lastSeen}</div>
            </div>
            <div className="wa-contact-sec">
              <h4>Teléfono</h4>
              <p><span dangerouslySetInnerHTML={{ __html: waIcon.phone }} /><b>{contact.phone}</b></p>
            </div>
            <div className="wa-contact-sec">
              <h4>Usuario</h4>
              <p>{contact.name.toLowerCase().replace(/\s+/g, "_")}</p>
            </div>
            <div className="wa-contact-sec">
              <h4>Medios, enlaces y docs</h4>
              <p><span dangerouslySetInnerHTML={{ __html: waIcon.media }} /> 2 fotos</p>
              <p><span dangerouslySetInnerHTML={{ __html: waIcon.doc }} /> 1 PDF</p>
              <p><span dangerouslySetInnerHTML={{ __html: waIcon.link }} /> raisen.agency</p>
            </div>
            <div className="wa-contact-sec">
              <h4>Configuración</h4>
              <p style={{ color: "#e55" }}>Bloquear</p>
              <p style={{ color: "#e55" }}>Silenciar notificaciones</p>
              <p>Exportar chat</p>
            </div>
          </>
        ) : (
          <div className="p-4 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Selecciona un contacto</div>
        )}
      </div>
    </div>
  );
}