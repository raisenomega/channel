# Infraestructura — Contrato `ChannelAdapter`

## Interfaz base (en `channels/domain/`)
```ts
export interface ChannelAdapter {
  readonly provider: 'zernio' | 'meta_direct' | 'resend' | '360dialog' | 'twilio';
  readonly supportedChannels: readonly ChannelType[];

  sendMessage(params: SendMessageParams): Promise<Result<SendResult, SendError>>;
  sendTemplate(params: SendTemplateParams): Promise<Result<SendResult, SendError>>;
  parseInboundWebhook(payload: unknown): Result<readonly NormalizedMessage[], ParseError>;
  verifyWebhook(signature: string, body: string): boolean;
  ping(): Promise<Result<HealthStatus, HealthError>>;
}
```

## Implementaciones v1 (día 1)
- `ZernioAdapter` — WhatsApp, IG, FB, Telegram, SMS, X, LinkedIn.
- `ResendAdapter` — email send+receive.
- `NativeWebchatAdapter` — widget web.

## Implementaciones v2 (feature flag)
- `MetaDirectAdapter` — se activa cuando Raisen pase App Review de Meta.
- `Dialog360Adapter` — WhatsApp Commerce que Zernio no cubre.
- `TwilioAdapter` — SMS directo si el cliente no quiere Zernio.

## Reglas
- `Result<T,E>` y `readonly` obligatorios (reglas A5/A6).
- Solo `infrastructure` conoce el formato del proveedor; errores tipados.
- Router (`ChannelRouter`) resuelve el adapter por conversación/tenant.
