# Dominio — BC `cognition/`: Contexto

## Propósito
Cerebro autónomo de HUB (BC de primera clase, heredado de NÚCLEO).

## Principio rector
Attention Is All You Need: una corrección del cliente vale más que 100 aciertos.

## Componentes
- **Memoria**: agent_interactions, agent_knowledge, agent_episodes, graph memory.
- **Razonamiento**: Anthropic Claude + context + knowledge + history + Brand Voice.
- **Acción**: RPCs NÚCLEO/POS, Zernio API, Resend API, verticales.
- **Aprendizaje**: was_correct → actualiza knowledge → auto-regeneración semanal.

## Gobernanza
SAFE evalúa cada respuesta (pre-envío síncrono crítico, post-envío sampling 10%).
Indistinguibilidad medida (score + `contact_perceived_as_human`).

## Dependencias
Solo `domain` puro; Claude/Zernio/OMEGA se consumen vía `infrastructure`.
