/**
 * ESLint — Compuerta #40: todo handler que verifica el state OAuth (verifyState) DEBE
 * revalidar el origin firmado contra la CORS allowlist (originPermitido) como SEGUNDA
 * verificacion despues de la firma HMAC (anti open-redirect).
 * @type {import('eslint').Rule.RuleModule}
 */
export default {
  meta: { type: "problem", docs: { description: "Callback OAuth revalida origin vs CORS allowlist tras HMAC" }, schema: [] },
  create(context) {
    let hasVerify = false, hasOrigin = false, firstNode = null;
    return {
      "CallExpression[callee.name='verifyState']"(n) { hasVerify = true; firstNode = firstNode || n; },
      "CallExpression[callee.name='originPermitido']"() { hasOrigin = true; },
      "Program:exit"(node) {
        if (hasVerify && !hasOrigin) context.report({ node: firstNode || node, message: "Compuerta #40: un handler que verifica el state (verifyState) DEBE revalidar origin vs CORS allowlist (originPermitido)." });
      },
    };
  },
};
