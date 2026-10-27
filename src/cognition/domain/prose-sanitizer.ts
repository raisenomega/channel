/**
 * HUB by Raisen — Saneador de la salida del agente hacia el CLIENTE: elimina tags de tool y las
 * instrucciones INTERNAS que el LLM a veces escupe como texto (nota interna, escalar_a_humano,
 * "aprobacion humana", "no se debe crear la cotizacion") para que NUNCA lleguen al cliente final.
 * Puro, sin IO. C4 <=75. Sin any.
 */
const TAG_INVOKE = /<invoke[\s\S]*?<\/invoke>/gi;
const TAG_SUELTO = /<\/?(invoke|function_calls|parameter|antml)[^>]*>/gi;
// La "nota interna" suele venir al final, a veces precedida por un separador (--- / ***) y/o en italica.
const NOTA_INTERNA = /(?:\n|^)\s*(?:[-*_]{2,}\s*)?\*{0,2}\s*nota\s+interna\b[\s\S]*$/i;
// Frases sueltas que delatan instruccion interna (se borra la oracion completa que las contiene).
const FRASE_INTERNA = /[^.!?\n]*\b(?:escalar_a_humano|escalate_to_human|aprobaci[oó]n humana|no se debe crear la cotizaci[oó]n|no est[aá] definido en el cat[aá]logo)\b[^.!?\n]*[.!?]?/gi;

export function sanitizarProsa(texto: string): string {
  return texto
    .replace(TAG_INVOKE, "")
    .replace(TAG_SUELTO, "")
    .replace(NOTA_INTERNA, "")
    .replace(FRASE_INTERNA, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Detecta (sin borrar) si la salida CRUDA del LLM traia una escalacion/instruccion interna,
// para alertar al dueno. Regex SIN flag global (test() seguro sin lastIndex).
const ESCALACION = /escalar_a_humano|escalate_to_human|aprobaci[oó]n humana|no se debe crear la cotizaci[oó]n|no est[aá] definido en el cat[aá]logo|nota\s+interna/i;

export function detectarEscalacion(texto: string): boolean {
  return ESCALACION.test(texto);
}
