/**
 * ESLint — Compuerta #39: P1 honestidad OAuth. Un componente de INICIO de conexion
 * (connect-cta / channel-connect-button) jamas afirma 'conectado'/connected por el popup;
 * el verde solo llega del fetch real de /channels. Previene regresion del P1 OMEGA.
 * @type {import('eslint').Rule.RuleModule}
 */
const MSG = "P1 (Compuerta #39): un componente de inicio de conexion OAuth no puede afirmar 'conectado'/connected; el verde solo viene del fetch real de /channels.";
export default {
  meta: { type: "problem", docs: { description: "P1 honestidad: no afirmar conectado por el popup" }, schema: [] },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === "string" && (node.value === "conectado" || node.value === "connected")) context.report({ node, message: MSG });
      },
      Property(node) {
        const k = node.key && (node.key.name || node.key.value);
        if (k === "connected" && node.value && node.value.type === "Literal" && node.value.value === true) context.report({ node, message: MSG });
      },
    };
  },
};
