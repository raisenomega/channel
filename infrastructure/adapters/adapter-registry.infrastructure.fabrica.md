# Infraestructura — `AdapterRegistry`

## Propósito
Resuelve el `CanalAdapter` correcto por `ChannelType` sin `switch` disperso.

## Implementación
```ts
export class AdapterRegistry {
  private readonly adapters = new Map<ChannelType, CanalAdapter>();

  registrar(a: CanalAdapter): void {
    this.adapters.set(a.channelType, a);
  }

  resolver(t: ChannelType): Result<CanalAdapter, AdapterError> {
    const a = this.adapters.get(t);
    return a ? ok(a) : err({ kind: 'adapter_no_registrado', channelType: t });
  }
}
```

## Reglas
- Único punto de registro (DRY).
- Si un canal no está registrado, se rechaza con error tipado.
