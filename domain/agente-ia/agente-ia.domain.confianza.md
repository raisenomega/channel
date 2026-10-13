# Dominio — Value Object `Confidence`

## Responsabilidad
Confianza de la decisión del agente, en [0,1].

## Escala de acción
| Score | Significado | Comportamiento |
|---|---|---|
| 0.0 | "no sé" | escalar a humano |
| 0.3 | "creo que..." | sugerir con disclaimer, pedir confirmación |
| 0.7 | "probablemente..." | actuar pero pedir confirmación |
| 0.9 | "seguro" | actuar sin preguntar |
| 1.0 | "certeza" | regla del sistema, no aprendida |

## Dinámica was_correct
- Confirmación → confidence += 0.05
- Corrección → confidence -= 0.15

## Auto-regeneración semanal (cron dom 11PM)
- score < 0.2 → eliminar regla
- score > 0.9 + 5 confirmaciones → promover a certeza
- contradicción entre reglas → mantener la más reciente
- sin uso 30 días → archivar
