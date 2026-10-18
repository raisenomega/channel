/**
 * ESLint custom rule — Compuerta #24: en handlers de webhook (src/channels (routes) 
 * webhook*.ts), el PRIMER await debe ser la verificacion de firma (verificarFirmaWebhook /
 * verifyWebhookSignature) antes de confiar en el body. Handlers sin await (GET challenge) ok.
 * @type {import('eslint').Rule.RuleModule}
 */
const SIG = /verificarFirmaWebhook|verifyWebhookSignature|verifySignature/;
function firstAwait(node, best) {
  if (!node || typeof node.type !== "string") return best;
  if (node.type === "AwaitExpression") return (!best || node.range[0] < best.range[0]) ? node : best;
  if (/FunctionExpression|ArrowFunctionExpression|FunctionDeclaration/.test(node.type)) return best;
  for (const k of Object.keys(node)) {
    if (k === "parent" || k === "range" || k === "loc") continue;
    const v = node[k];
    if (Array.isArray(v)) { for (const c of v) best = firstAwait(c, best); }
    else if (v && typeof v.type === "string") best = firstAwait(v, best);
  }
  return best;
}
export default {
  meta: {
    type: "problem",
    docs: { description: "El primer await de un handler de webhook debe ser la verificacion de firma" },
    schema: [],
  },
  create(context) {
    function check(fn) {
      const fa = firstAwait(fn.body, null);
      if (!fa) return;
      const callee = fa.argument && fa.argument.callee;
      const name = (callee && (callee.name || (callee.property && callee.property.name))) || "";
      if (!SIG.test(name)) context.report({ node: fa, message: "El primer await de un handler de webhook debe ser la verificacion de firma (Compuerta #24)." });
    }
    return {
      "Property[key.name='handler'] > ArrowFunctionExpression"(n) { check(n); },
      "Property[key.name='handler'] > FunctionExpression"(n) { check(n); },
    };
  },
};
