/**
 * ESLint custom rule — Compuerta #23: prohibe el uso directo de service_role /
 * supabaseAdmin en handlers de rutas publicas (src/server/*-routes-*.ts). El acceso
 * a datos va por requireTenantAuth + handler de aplicacion (RLS/tenant scoping), nunca
 * por el cliente admin que bypasea RLS.
 * @type {import('eslint').Rule.RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: { description: "Prohibe service_role/supabaseAdmin directo en route handlers publicos" },
    schema: [],
  },
  create(context) {
    const msg = "No uses service_role/supabaseAdmin directo en un handler de ruta publica (Compuerta #23). Usa requireTenantAuth + handler de aplicacion.";
    return {
      Identifier(node) {
        if (/^(supabaseAdmin|supabaseServiceRole|serviceRoleClient)$/.test(node.name)) context.report({ node, message: msg });
      },
      Literal(node) {
        if (typeof node.value === "string" && node.value === "service_role") context.report({ node, message: msg });
      },
    };
  },
};
