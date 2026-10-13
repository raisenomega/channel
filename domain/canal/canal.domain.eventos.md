# Dominio — Eventos de Canal

## Eventos (inmutables)
```ts
export interface ChannelConnected {
  readonly type: 'ChannelConnected';
  readonly inboxId: string;
  readonly channelType: ChannelType;
  readonly occurredAt: Date;
}

export interface ChannelDisabled {
  readonly type: 'ChannelDisabled';
  readonly inboxId: string;
  readonly occurredAt: Date;
}
```

## Reglas
- Se emiten tras la verificación exitosa del webhook en `infrastructure`.
- Son consumidos por `application` para actualizar proyecciones y notificar.

## Uso
`application/canal/` reacciona a `ChannelConnected` activando enrutamiento.
