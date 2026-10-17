/**
 * ESLint custom rule — Compuerta #21: prohibe `window.location.href = "/login"`
 * fuera del helper redirect-on-error.ts. Previene el bug J/K de raíz.
 * @type {import('eslint').Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "Prohibe window.location.href = '/login' directo (usar helper)" },
    schema: [],
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        const left = node.left;
        const right = node.right;
        if (!left || !right) return;
        // Chequear left = window.location.href
        if (left.object?.object?.name === "window" &&
            left.object?.property?.name === "location" &&
            left.property?.name === "href" &&
            right.value === "/login") {
          // Permitir SOLO si el archivo es el helper
          const filename = context.filename ?? "";
          if (!filename.includes("redirect-on-error")) {
            context.report({
              node,
              message: "No uses window.location.href = \"/login\" directo. Usa handleFetcherError de redirect-on-error.ts (Compuerta #21).",
            });
          }
        }
      },
    };
  },
};