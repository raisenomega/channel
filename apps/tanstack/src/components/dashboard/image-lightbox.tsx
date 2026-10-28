/**
 * HUB by Raisen — Lightbox: modal centrado para ver la foto en grande con zoom (rueda + botones +/-) y
 * arrastrar para moverse y ver cada detalle. Cierra con X, clic afuera o Esc. Sin librerias, puro CSS
 * transform. Doble-clic = restablecer. touchAction none para zoom/pan en movil. C4 <=75. Sin any.
 */
import { useEffect, useRef, useState } from "react";

export function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const zoom = (d: number) => setScale((s) => Math.min(6, Math.max(1, +(s + d).toFixed(2))));
  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };
  const onWheel = (e: React.WheelEvent) => zoom(e.deltaY < 0 ? 0.3 : -0.3);
  const onDown = (e: React.PointerEvent) => { if (scale > 1) drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; };
  const onMove = (e: React.PointerEvent) => { if (drag.current) setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); };
  const onUp = () => { drag.current = null; };

  const btn: React.CSSProperties = { width: 40, height: 40, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.16)", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
        <button aria-label="alejar" style={btn} onClick={() => zoom(-0.5)}>−</button>
        <button aria-label="acercar" style={btn} onClick={() => zoom(0.5)}>+</button>
        <button aria-label="restablecer" style={btn} onClick={reset}>⟲</button>
        <button aria-label="cerrar" style={btn} onClick={onClose}>✕</button>
      </div>
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} onWheel={onWheel} onDoubleClick={reset}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        style={{ maxWidth: "92vw", maxHeight: "88vh", transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, cursor: scale > 1 ? "grab" : "zoom-in", touchAction: "none", userSelect: "none", borderRadius: 8 }} />
    </div>
  );
}
