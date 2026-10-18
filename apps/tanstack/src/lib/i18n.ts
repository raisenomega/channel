import type { Idioma, Dict } from "./i18n/i18n-types";
import { esCore } from "./i18n/es-core";
import { esDash } from "./i18n/es-dash";
import { esChannels } from "./i18n/es-channels";
import { esSettings } from "./i18n/es-settings";
import { esMisc } from "./i18n/es-misc";
import { esAgent } from "./i18n/es-agent";
import { esBiz } from "./i18n/es-biz";
import { esBizOrders } from "./i18n/es-biz-orders";
import { esBizOps } from "./i18n/es-biz-ops";
import { esOnboarding } from "./i18n/es-onboarding";
import { esTemplates } from "./i18n/es-templates";
import { esRegistro } from "./i18n/es-registro";
import { enCore } from "./i18n/en-core";
import { enDash } from "./i18n/en-dash";
import { enChannels } from "./i18n/en-channels";
import { enSettings } from "./i18n/en-settings";
import { enMisc } from "./i18n/en-misc";
import { enAgent } from "./i18n/en-agent";
import { enBiz } from "./i18n/en-biz";
import { enBizOrders } from "./i18n/en-biz-orders";
import { enBizOps } from "./i18n/en-biz-ops";
import { enOnboarding } from "./i18n/en-onboarding";
import { enTemplates } from "./i18n/en-templates";
import { enRegistro } from "./i18n/en-registro";

const ES: Dict = {
  ...esCore,
  ...esDash,
  ...esChannels,
  ...esSettings,
  ...esMisc,
  ...esAgent,
  ...esBiz,
  ...esBizOrders,
  ...esBizOps,
  ...esOnboarding,
  ...esTemplates,
  ...esRegistro,
};

const EN: Dict = {
  ...enCore,
  ...enDash,
  ...enChannels,
  ...enSettings,
  ...enMisc,
  ...enAgent,
  ...enBiz,
  ...enBizOrders,
  ...enBizOps,
  ...enOnboarding,
  ...enTemplates,
  ...enRegistro,
};

const TABLAS: Record<Idioma, Dict> = { es: ES, en: EN };

export type { Idioma };

export function t(idioma: Idioma, key: string, params?: Record<string, string | number>): string {
  const val = TABLAS[idioma]?.[key] ?? key;
  if (!params) return val;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
    val,
  );
}