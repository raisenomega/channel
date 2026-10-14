/**
 * HUB by Raisen — CardGrid: cuadricula de tarjetas reutilizable para las
 * pestañas cotización, factura y pagos (datos del contacto del hilo).
 */
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";

export interface GridCardData {
  id: string;
  title: string;
  badge: string;
  tone: BadgeTone;
  rows: Array<{ label: string; value: string }>;
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function CardGrid({ title, empty, accent, cards }: {
  title: string;
  empty: string;
  accent: string;
  cards: readonly GridCardData[];
}) {
  return (
    <div className="space-y-3">
      <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})`, marginBottom: 10 }}>{title}</h4>
      {cards.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{empty}</p>
      ) : (
        <div className="grid gap-3">
          {cards.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-sm">{c.title}</CardTitle>
                <Badge tone={c.tone}>{c.badge}</Badge>
              </CardHeader>
              <CardBody>
                {c.rows.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}