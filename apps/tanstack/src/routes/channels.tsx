import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export const ChannelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels",
  component: ChannelsPage,
});

const CHANNELS = ["WhatsApp", "Email", "Instagram", "Webchat"];

function ChannelsPage() {
  const { language } = usePreferences();
  const [state, setState] = useState<Record<string, boolean>>({
    WhatsApp: true,
    Email: true,
    Instagram: false,
    Webchat: false,
  });

  return (
    <div className="view">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "channels.connected")}
      </h2>

      <div className="grid gap-3 md:grid-cols-2">
        {CHANNELS.map((name) => {
          const on = state[name] ?? false;
          return (
            <Card key={name}>
              <CardHeader>
                <CardTitle>{name}</CardTitle>
                <Badge tone={on ? "success" : "warn"}>
                  {t(language, on ? "channels.active" : "channels.inactive")}
                </Badge>
              </CardHeader>
              <CardBody className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  {t(language, "inbox.channels")}
                </span>
                <Switch
                  checked={on}
                  onChange={(v) => setState((p) => ({ ...p, [name]: v }))}
                />
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
