import { expect, test } from "vitest";
import { TRANSLATIONS } from "../../../src/shared/domain/translations.ts";
import { crearTranslationProvider } from "../../../src/shared/domain/translation-provider.ts";

test("translations â€” debe traducir key existente en espaÃ±ol", () => {
  const tp = crearTranslationProvider("es", TRANSLATIONS);
  expect(tp.translate("inbox.title")).toBe("Bandeja de entrada");
  expect(tp.translate("channel.whatsapp")).toBe("WhatsApp");
  expect(tp.translate("common.save")).toBe("Guardar");
});

test("translations â€” debe traducir key existente en inglÃ©s", () => {
  const tp = crearTranslationProvider("en", TRANSLATIONS);
  expect(tp.translate("inbox.title")).toBe("Inbox");
  expect(tp.translate("common.save")).toBe("Save");
  expect(tp.translate("auth.login")).toBe("Log in");
});

test("translations â€” debe devolver la key si no existe traducciÃ³n", () => {
  const tp = crearTranslationProvider("es", TRANSLATIONS);
  expect(tp.translate("key.inexistente")).toBe("key.inexistente");
});

test("translations â€” debe reemplazar parÃ¡metros en la traducciÃ³n", () => {
  const tp = crearTranslationProvider("es", TRANSLATIONS);
  const result = tp.translate("conversation.assigned", { agent: "Ana" });
  expect(result).toBe("Asignada a Ana");
});

test("translations â€” debe tener todas las keys en ES y EN", () => {
  const esKeys = Object.keys(TRANSLATIONS.es).sort();
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  expect(esKeys.length).toBe(enKeys.length) // "ES y EN deben tener la misma cantidad de keys";
  for (let i = 0; i < esKeys.length; i++) {
    expect(esKeys[i]).toBe(enKeys[i]) // `Key '${esKeys[i]}' debe existir en ambos idiomas`;
  }
});
