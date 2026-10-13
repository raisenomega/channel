# Dominio — Value Object `Role`

## Definición
```ts
export type Role = 'owner' | 'admin' | 'agent' | 'viewer';
```

## Matriz de permisos
| Permiso | owner | admin | agent | viewer |
|---|---|---|---|---|
| Gestionar canales | ✅ | ✅ | — | — |
| Gestionar equipo | ✅ | ✅ | — | — |
| Atender conversaciones | ✅ | ✅ | ✅ | — |
| Ver reportes | ✅ | ✅ | — | ✅ |
| Configurar IA | ✅ | — | — | — |

## Regla
`owner` es único por tenant y no se puede degradar a sí mismo.
