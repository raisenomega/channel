# Agente IA — Protocolo SAFE detallado

## Evaluación pre-envío (síncrona, blocking)
Para acciones críticas (create_quote, send_payment_link, cancel_order):
1. SAFE recibe la acción decidida + contexto de la conversación.
2. Ensemble multi-proveedor evalúa: ¿es correcta? ¿es segura? ¿es ética?
3. Si **desacuerdo > 30 %** (INCERTIDUMBRE_DE_ENSEMBLE) → bloquea, escala a humano.
4. Si acuerdo > 70 % → ejecuta.

## Evaluación post-envío (asíncrona, sampling 10 %)
Para respuestas conversacionales normales:
1. Muestreo aleatorio del 10 % de interacciones.
2. SAFE evalúa calidad, tono, precisión, indistinguibilidad.
3. Si score < 0.5 → alerta al owner, pausa autonomía para ese canal.
4. Métricas trimestrales publicadas bajo RAISEN_ENSEMBLE_GOVERNANCE.

## Derecho de abstención
Si `confidence < 0.3` o SAFE detecta `INSUFFICIENT_EVIDENCE`:
- El agente NO responde, escala a humano con el contexto completo.