/**
 * HUB by Raisen — Ruta publica /q/$token: el cliente abre el link, ve la cotizacion y Acepta/Rechaza.
 * Sin login (anon). C4 <=75.
 */
import { useEffect, useState } from "react";
import { createRoute, useParams } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { getPublicQuote, type PublicQuote } from "@/lib/public-quote-client";
import { PublicQuoteView } from "./public/public-quote-view";

function ApprovalPage() {
  const { token } = useParams({ from: PublicQuoteRoute.id });
  const { language } = usePreferences();
  const [data, setData] = useState<PublicQuote | null>(null);
  useEffect(() => { void getPublicQuote(token).then(setData); }, [token]);
  if (!data) return <div className="p-10 text-center text-sm text-muted-foreground">...</div>;
  return <PublicQuoteView lang={language} token={token} data={data} />;
}

export const PublicQuoteRoute = createRoute({ getParentRoute: () => rootRoute, path: "/q/$token", component: ApprovalPage });
