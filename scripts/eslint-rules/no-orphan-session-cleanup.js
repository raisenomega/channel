/**
 * ESLint custom rule — Compuerta #22 (M-10): limpieza de sesion coherente.
 * Supabase guarda el token en localStorage; limpiar solo sessionStorage deja la
 * sesion viva (causa raiz del logout que no revocaba, D-11). Si un archivo llama
 * sessionStorage.removeItem debe tambien llamar localStorage.removeItem.
 * @type {import('eslint').Rule.RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: { description: "sessionStorage.removeItem exige localStorage.removeItem paralelo (logout coherente)" },
    schema: [],
  },
  create(context) {
    let sessionNode = null;
    let hasLocal = false;
    function isRemoveItem(node, obj) {
      const c = node.callee;
      if (!c || c.type !== "MemberExpression" || c.property?.name !== "removeItem") return false;
      const o = c.object;
      if (o?.name === obj) return true;
      return o?.type === "MemberExpression" && o.object?.name === "window" && o.property?.name === obj;
    }
    return {
      CallExpression(node) {
        if (isRemoveItem(node, "sessionStorage") && !sessionNode) sessionNode = node;
        if (isRemoveItem(node, "localStorage")) hasLocal = true;
      },
      "Program:exit"() {
        if (sessionNode && !hasLocal) {
          context.report({
            node: sessionNode,
            message: "sessionStorage.removeItem sin localStorage.removeItem paralelo. Supabase guarda el token en localStorage; limpia ambos (Compuerta #22).",
          });
        }
      },
    };
  },
};
