/**
 * HUB by Raisen — Avatar redondo del agente (Fase 0: inicial + color de marca; Fase 0.1: foto real via
 * `src`). C4 <=75.
 */
export function AgentAvatar({ name, accent, src, size = 56 }: { name: string; accent: string; src?: string; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div className="flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${accent})` }}>
      {(name[0] ?? "A").toUpperCase()}
    </div>
  );
}
