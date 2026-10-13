# Arquitectura — Design System

## Principio
Hereda el tema oficial NÚCLEO. UI moderna y white-label (N2: sin marca Raisen).

## Tokens (de `hub_app.html`)
| Token | Valor | Uso |
|---|---|---|
| `--hub` | `#0FB5A6` (teal) | Marca HUB, acentos |
| `--hub-deep` | `#0A8F84` | Hover/active |
| `--agent` | `#F5A623` (ámbar) | Agente IA activo |
| `--ink` | `#0E1B2A` | Texto principal |
| Canal | WA `#25D366` · IG `#E1306C` · MS `#0084FF` · TG `#29A9EB` · X `#0E1B2A` · LI `#0A66C2` | Badges de canal |
| Tipografía | `Sora` (system-ui fallback) | Todo |

## Componentes base
`Button`, `Input`, `Badge`, `Avatar`, `Card`, `Modal`, `Toast`, `Table`,
`Tabs`, `Sidebar`, `InboxList`, `ChatThread`, `Composer`, `Tag`, `Segment`,
`ModePill` (indicador de autonomía visible solo al equipo).

## Layout (3 paneles escritorio · 1 panel móvil)
Izquierda: lista de conversaciones. Centro: hilo unificado cross-canal.
Derecha: ficha 360 del cliente (Lite=CRM Lite · Ecosystem=NÚCLEO+POS+OMEGA).

## Reglas
- Cada componente es un archivo ≤75 líneas. Props tipadas `readonly`, sin `any`.
