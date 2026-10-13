# Dominio — Value Object `ChannelType`

## Definición (9 canales v1)
```ts
export type ChannelType =
  | 'whatsapp' | 'email' | 'instagram' | 'facebook'
  | 'telegram' | 'sms' | 'x' | 'linkedin' | 'webchat';
```

## Proveedor por tipo (v1)
| Tipo | Proveedor v1 |
|---|---|
| whatsapp / instagram / facebook / telegram / sms / x / linkedin | Zernio |
| email | Resend |
| webchat | HUB nativo |

## Validación
`ChannelType.crear(valor)` retorna `Result<ChannelType, TipoError>` y rechaza
valores fuera del union.
