# Agente IA — Métricas de Indistinguibilidad

## Objetivo
El cliente final no debe poder distinguir si le respondió una persona o IA.

## Métricas medibles
1. **`contact_perceived_as_human`** (boolean por interacción): mini-CSAT al cierre
   "¿Con quién crees que hablaste?" (a) persona, (b) IA, (c) no estoy seguro.
2. **`indistinguishability_score`** (0–1): evaluado por SAFE.
3. **Métricas indirectas:**
   - Tiempo de respuesta natural (30s–2min, no instantáneo).
   - Errores de tipeo controlados (< 3 % de mensajes en canales conversacionales).
   - Emojis y expresiones locales (heredados de Brand Voice OMEGA).
   - Continuidad conversacional (no repetir "como te dije antes").

## Umbrales
| Score | Estado | Acción |
|---|---|---|
| > 0.9 | Excelente | Sigue operando |
| 0.7–0.9 | Aceptable | Refina Brand Voice |
| 0.5–0.7 | Marginal | Pausa autonomía, reentrena |
| < 0.5 | Fallando | Kill switch, todo a humano