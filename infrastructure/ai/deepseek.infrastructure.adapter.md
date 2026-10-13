# Infraestructura — Adapter `DeepSeekAdapter`

## Proveedor
DeepSeek (BYOK). El cliente pega su propia API key en configuración.

## Responsabilidad
Implementar `AIProvider` con `provider = 'deepseek'`.

## Detalles
- API REST `https://api.deepseek.com/v1/chat/completions`.
- Compatible con formato OpenAI Chat Completions.
- `completar()` mapea `AICompletionParams` al body de DeepSeek.
- Modelo por defecto: `deepseek-chat` o `deepseek-reasoner`.

## Costo
Pass-through (el cliente paga a DeepSeek directamente).

## Configuración (UI)
| Parámetro | Default |
|---|---|
| Modelo | deepseek-chat |
| Max tokens | 4096 |
| Temperatura | 0.7 |
| API Key | (requerida, cifrada en `secrets_encrypted`) |