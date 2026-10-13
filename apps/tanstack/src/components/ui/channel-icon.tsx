import type { SVGProps } from "react";

export type ChannelKind =
  | "whatsapp" | "email" | "instagram" | "facebook" | "telegram"
  | "sms" | "x" | "linkedin" | "webchat";

const PATHS: Record<ChannelKind, string> = {
  whatsapp: "M21 12a9 9 0 1 1-4.04-7.46",
  email: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  instagram: "M16 3H8a5 5 0 0 0-5 5v8a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5V8a5 5 0 0 0-5-5zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM17.5 6.5h.01",
  facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  telegram: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  sms: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  x: "M4 4l16 16M20 4 4 20",
  linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v1.5A6 6 0 0 1 16 8zM6 9H2v12h4zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  webchat: "M12 15a9 9 0 1 0-9-9c0 2.5 1 4.4 2.6 5.9L4 16l3-.8M19 15a4 4 0 1 0 .9-7.9",
};

export function ChannelIcon({
  kind,
  ...props
}: { kind: ChannelKind } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[kind]} />
    </svg>
  );
}