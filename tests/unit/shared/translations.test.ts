import { assertEquals, assert } from "jsr:@std/assert";
import { TRANSLATIONS } from "../../../src/shared/domain/translations.ts";
import { crearTranslationProvider } from "../../../src/shared/domain/translation-provider.ts";

Deno.test("translations — debe traducir key existente en español", () => {
  const tp = crearTranslationProvider("es", TRANSLATIONS);
  assertEquals(tp.translate("inbox.title"), "Bandeja de entrada");
  assertEquals(tp.translate("channel.whatsapp"), "WhatsApp");
  assertEquals(tp.translate("common.save"), "Guardar");
});

Deno.test("translations — debe traducir key existente en inglés", () => {
  const tp = crearTranslationProvider("en", TRANSLATIONS);
  assertEquals(tp.translate("inbox.title"), "Inbox");
  assertEquals(tp.translate("common.save"), "Save");
  assertEquals(tp.translate("auth.login"), "Log in");
});

Deno.test("translations — debe devolver la key si no existe traducción", () => {
  const tp = crearTranslationProvider("es", TRANSLATIONS);
  assertEquals(tp.translate("key.inexistente"), "key.inexistente");
});

Deno.test("translations — debe reemplazar parámetros en la traducción", () => {
  const tp = crearTranslationProvider("es", TRANSLATIONS);
  const result = tp.translate("conversation.assigned", { agent: "Ana" });
  assertEquals(result, "Asignada a Ana");
});

Deno.test("translations — debe tener todas las keys en ES y EN", () => {
  const esKeys = Object.keys(TRANSLATIONS.es).sort();
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  assertEquals(esKeys.length, enKeys.length, "ES y EN deben tener la misma cantidad de keys");
  for (let i = 0; i < esKeys.length; i++) {
    assertEquals(esKeys[i], enKeys[i], `Key '${esKeys[i]}' debe existir en ambos idiomas`);
  }
});