# Infraestructura — Adapter `QwenAdapter`

## Proveedor
Qwen (Alibaba Cloud, BYOK). El cliente pega su propia API key.

## Responsabilidad
Implementar `AIProvider` con `provider = 'qwen'`.

## Detalles
- API REST `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`.
- Formato compatible con OpenAI Chat Completions.
- `completar()` mapea `AICompletionParams` al body de Qwen.
- Modelo por defecto: `qwen-72b-chat` o `qwen-max`.

## Costo
Pass-through (el cliente paga a Alibaba directamente).

## Configuración (UI)
| Parámetro | Default |
|---|---|
| Modelo | qwen-max |
| Max tokens | 4096 |
| Temperatura | 0.7 |
| API Key | (requerida, cifrada en `secrets_encrypted`) |