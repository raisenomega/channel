# LEY — Flujo CONSULTA DE AGENTE + ESCALADA A HUMANO (CONGELADO / FIRMADO)

> **INNEGOCIABLE.** Este flujo está **CONGELADO**. Nadie lo modifica —ni un refactor, ni FORTRESS,
> ni una "mejora" automática, ni ningún agente o colaborador— **sin autorización EXPLÍCITA y por
> escrito de Jorge Ibrain (dueño absoluto de Raisen Dev).** Si FORTRESS lo detecta, **lo deja pasar,
> NO lo toca.** Mismo estatus innegociable que el flujo de disparo de cotizaciones / ráfagas.

## Qué protege esta ley (el flujo completo, de punta a punta)

1. **Emisión determinística del marcador** por los agentes OPERATIVOS (`eco/zahra/thao/iris/angel/kelsy`):
   `[[CONSULTA: duda]]` (el agente pide ayuda de negocio) y `[[ESCALAR: motivo]]` (el cliente necesita
   un humano). Víctor queda FUERA (ya habla con el dueño). El parseo/limpieza es por regex
   (determinístico); el texto que ve el cliente SIEMPRE queda limpio del marcador.
2. **Aviso al dueño**: fila en la tarjeta **Actividad Reciente** ("Consulta de {agente}: …" /
   "Escalacion a humano: …") + WhatsApp al negocio. La palabra **ALERTA** parpadea (gris↔rojo) mientras
   exista una consulta/escalada SIN atender; se apaga cuando todo está atendido.
3. **Scope agente** (mismo layout, componentes y flujo que el cliente): Ficha 360 = el AGENTE; chat =
   hilo pregunta→respuesta; [Solucionado] → modal con firma (quién atendió) → [Guardar].
4. **Aterrizaje**: la consulta/escalada resuelta cae en **Tickets Resueltos** (mismo panel que el cliente).
5. **Conocimiento compartido**: la respuesta del dueño se guarda en **`agent_knowledge`** (tenant-wide):
   TODOS los agentes la leen y la citan ("aprenden todo de todo").
6. **Ver todas**: la lista completa de actividad vive en `/actividad` (la tarjeta solo muestra 5).

## Archivos bajo esta ley (no tocar sin autorización)

- Backend: `src/cognition/domain/prose-sanitizer.ts`, `src/cognition/application/agent-prompt.ts`,
  `src/cognition/application/agent-reasoner.ts`, `src/cognition/application/generate-draft.handler.ts`,
  `src/cognition/infrastructure/escalacion-activity.repo.ts`,
  `src/cognition/infrastructure/agent-consulta.repo.ts`,
  `src/cognition/infrastructure/conversation-resolve.repo.ts` (listarResueltos),
  `src/cognition/presentation/agent-consulta.routes.ts`,
  `src/cognition/presentation/resolve-conversation.routes.ts`,
  `src/notifications/presentation/activity.routes.ts`,
  `src/notifications/infrastructure/alertas-pendientes.repo.ts`,
  `src/cognition/infrastructure/owner-alert.repo.ts`.
- Frontend: `apps/tanstack/src/components/dashboard/bentobox/bento-actividad-reciente.tsx`,
  `apps/tanstack/src/routes/conversation/consulta-view.tsx`, `.../use-consulta.ts`, `.../consulta-data.ts`,
  `.../conversation-chat-panel.tsx`, `.../resueltos-panel.tsx`, `.../resueltos-fetch.ts`,
  `.../cliente-conversation.tsx`, `apps/tanstack/src/routes/inbox.$conversationId.tsx`,
  `apps/tanstack/src/routes/actividad.tsx`, `apps/tanstack/src/hooks/useRecentActivity.ts`.

## Firma

- **SHA firmado por Jorge Ibrain:** `__________________________________________`
- Fecha de congelación: 2026-10-28.
- Cualquier cambio futuro requiere su autorización explícita citada en el PR.
