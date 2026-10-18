/**
 * HUB by Raisen — R-5 (Compuertas #73/#74): el label de nav "Contactos"/"Contacts" se renombra a
 * "CRM" (solo label). La ruta /contacts NO cambia (deep-links viejos siguen 200) y el modal 2-pasos
 * (M-12) crea cliente SIN tocar el scope de sesion (user.tenantId) — Compuerta #66.
 */
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { t } from "../../../apps/tanstack/src/lib/i18n";
import { ContactsRoute } from "../../../apps/tanstack/src/routes/contacts";

test("A-R-5-rename: nav muestra 'CRM' en EN y ES (no 'Contactos'/'Contacts')", () => {
  expect(t("en", "nav.contacts")).toBe("CRM");
  expect(t("es", "nav.contacts")).toBe("CRM");
});

test("A-R-5-ruta: la ruta de la pagina sigue siendo /contacts (deep-link viejo intacto)", () => {
  expect(ContactsRoute.options.path).toBe("/contacts");
  // El titulo de pagina NO se renombra (solo el label de nav): se conserva.
  const esBiz = readFileSync("apps/tanstack/src/lib/i18n/es-biz.ts", "utf8");
  expect(esBiz).toContain('"contacts.title": "Contactos"');
});

test("A-R-5-scope: el modal 2-pasos de creacion NO muta el scope de sesion (user.tenantId)", () => {
  const modal = readFileSync("apps/tanstack/src/routes/contacts-ui/create-modal.tsx", "utf8");
  // Crear un contacto es una operacion scoped al tenant actual; jamas reescribe el tenant de sesion.
  expect(modal).not.toMatch(/tenantId\s*=/);
  expect(modal).not.toMatch(/setActiveTenant|setTenant\(/);
});
