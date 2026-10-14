/**
 * HUB by Raisen — barrel de diccionarios es/en + acceso traducido.
 * Los diccionarios viven en submódulos por idioma/dominio bajo ./i18n/.
 * API pública: tipo Idioma y funcion t (firmas preservadas).
 */
import { ES as ES_Shell } from "./i18n/es-shell.ts";
import { ES as ES_Ficha } from "./i18n/es-ficha.ts";
import { ES as ES_Agent } from "./i18n/es-agent.ts";
import { ES as ES_Settings } from "./i18n/es-settings.ts";
import { ES as ES_Misc } from "./i18n/es-misc.ts";
import { EN as EN_Shell } from "./i18n/en-shell.ts";
import { EN as EN_Ficha } from "./i18n/en-ficha.ts";
import { EN as EN_Agent } from "./i18n/en-agent.ts";
import { EN as EN_Settings } from "./i18n/en-settings.ts";
import { EN as EN_Misc } from "./i18n/en-misc.ts";

export type Idioma = "es" | "en";

type Dict = Record<string, string>;

const ES: Dict = Object.assign({}, ES_Shell, ES_Ficha, ES_Agent, ES_Settings, ES_Misc);
const EN: Dict = Object.assign({}, EN_Shell, EN_Ficha, EN_Agent, EN_Settings, EN_Misc);

const TABLAS: Record<Idioma, Dict> = { es: ES, en: EN };

export function t(idioma: Idioma, key: string): string {
  return TABLAS[idioma]?.[key] ?? key;
}