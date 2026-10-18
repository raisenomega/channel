/**
 * ESLint custom rule — Compuerta #58 (FORTRESS Q): la verificacion de JWT debe pasar por
 * jwt-jwks-verify (ES256 JWKS + fallback HS256 controlado). Por eso:
 *   (a) SUPABASE_JWT_SECRET solo puede referenciarse en src/identity/infrastructure/jwt-jwks-verify.ts
 *   (b) prohibido importar 'jsonwebtoken' (usa jose a traves del modulo sancionado).
 * Evita que un handler nuevo re-implemente verificacion HS256-only y se quede ciego a ES256.
 * @type {import('eslint').Rule.RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: { description: "SUPABASE_JWT_SECRET solo via jwt-jwks-verify; prohibido jsonwebtoken (Compuerta #58)" },
    schema: [],
  },
  create(context) {
    const file = String(context.filename || context.getFilename() || "").replace(/\\/g, "/");
    const sanctioned = file.endsWith("src/identity/infrastructure/jwt-jwks-verify.ts");
    return {
      ImportDeclaration(node) {
        if (node.source.value === "jsonwebtoken") {
          context.report({ node, message: "Prohibido 'jsonwebtoken': verifica JWT via jwt-jwks-verify (Compuerta #58)." });
        }
      },
      Literal(node) {
        if (node.value === "SUPABASE_JWT_SECRET" && !sanctioned) {
          context.report({ node, message: "SUPABASE_JWT_SECRET solo puede referenciarse en jwt-jwks-verify.ts (Compuerta #58)." });
        }
      },
    };
  },
};
