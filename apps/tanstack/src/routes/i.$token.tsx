/**
 * HUB by Raisen — Ruta publica /i/$token: el cliente abre el link, ve la factura y puede Pagar
 * (solicitar pago). Sin login (anon). C4 <=75.
 */
import { useEffect, useState } from "react";
import { createRoute, useParams } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { getPublicInvoice, type PublicInvoice } from "@/lib/public-invoice-client";
import { PublicInvoiceView } from "./public/public-invoice-view";

function InvoicePage() {
  const { token } = useParams({ from: PublicInvoiceRoute.id });
  const { language } = usePreferences();
  const [data, setData] = useState<PublicInvoice | null>(null);
  useEffect(() => { void getPublicInvoice(token).then(setData); }, [token]);
  if (!data) return <div className="p-10 text-center text-sm text-muted-foreground">...</div>;
  return <PublicInvoiceView lang={language} token={token} data={data} />;
}

export const PublicInvoiceRoute = createRoute({ getParentRoute: () => rootRoute, path: "/i/$token", component: InvoicePage });
