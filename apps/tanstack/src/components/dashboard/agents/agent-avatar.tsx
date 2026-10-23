/**
 * HUB by Raisen — Avatar redondo del agente: foto real (`src`) con fallback a inicial + color de marca
 * si la imagen no carga. C4 <=75.
 */
import { useState } from "react";

export function AgentAvatar({ name, accent, src, size = 56 }: { name: string; accent: string; src?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={name} onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${accent})` }}>
      {(name[0] ?? "A").toUpperCase()}
    </div>
  );
}
