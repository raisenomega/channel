export const SEGMENTOS = ["general", "nuevo", "regular", "vip"];

export const TONE_SEGMENTO: Record<string, "hub" | "success" | "warn" | "process" | "danger"> = {
  general: "warn", nuevo: "process", regular: "success", vip: "hub", empresa: "process",
};

export const CANAL: Record<string, { label: string; bg: string; fg: string }> = {
  whatsapp: { label: "WA", bg: "hsl(145 60% 45% / 0.18)", fg: "hsl(145 55% 42%)" },
  instagram: { label: "IG", bg: "hsl(320 60% 55% / 0.18)", fg: "hsl(320 55% 58%)" },
  facebook: { label: "FB", bg: "hsl(220 70% 55% / 0.18)", fg: "hsl(220 65% 60%)" },
  telegram: { label: "TG", bg: "hsl(200 70% 50% / 0.18)", fg: "hsl(200 65% 55%)" },
};
