/**
 * HUB by Raisen — Borradores (/borradores): cola supervisada de lo que generan los agentes, ahora como
 * item de nav propio (al lado de Pagos), con badge rojo del pendiente. Render = BorradoresPage. C4 <=75.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { BorradoresPage } from "@/components/dashboard/agents/borradores-page";

function BorradoresRoutePage() {
  const { language } = usePreferences();
  return <div className="view"><BorradoresPage lang={language} /></div>;
}

const BorradoresRoute = createRoute({ getParentRoute: () => rootRoute, path: "/borradores", component: BorradoresRoutePage });
export { BorradoresRoute };
