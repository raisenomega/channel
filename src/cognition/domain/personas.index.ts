/**
 * HUB by Raisen — Registro canónico central de las 7 personas (Slide 4.0).
 * Self-check al importar: 7 personas, slugs matchean keys. C4 ≤75.
 */
import { PERSONA_VICTOR } from "./personas/persona.victor.ts";
import { PERSONA_ZAHRA } from "./personas/persona.zahra.ts";
import { PERSONA_THAO } from "./personas/persona.thao.ts";
import { PERSONA_IRIS } from "./personas/persona.iris.ts";
import { PERSONA_ECO } from "./personas/persona.eco.ts";
import { PERSONA_ANGEL } from "./personas/persona.angel.ts";
import { PERSONA_KELSY } from "./personas/persona.kelsy.ts";

export const CANONICAL_PERSONAS = Object.freeze({
  victor: PERSONA_VICTOR,
  zahra: PERSONA_ZAHRA,
  thao: PERSONA_THAO,
  iris: PERSONA_IRIS,
  eco: PERSONA_ECO,
  angel: PERSONA_ANGEL,
  kelsy: PERSONA_KELSY,
} as const);

export type CanonicalPersonaSlug = keyof typeof CANONICAL_PERSONAS;

// Self-check al importar
const slugs = Object.keys(CANONICAL_PERSONAS) as CanonicalPersonaSlug[];
if (slugs.length !== 7) throw new Error(`Expected 7 personas, got ${slugs.length}`);
for (const slug of slugs) {
  if (CANONICAL_PERSONAS[slug].slug !== slug) throw new Error(`Persona ${slug} tiene slug mismatch`);
}

export function obtenerPersona(slug: CanonicalPersonaSlug) {
  return CANONICAL_PERSONAS[slug];
}