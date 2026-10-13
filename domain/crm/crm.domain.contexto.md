# Dominio — CRM: Contexto

## Propósito
Contacto 360 + pipeline de ventas (cotizaciones, órdenes, pagos).

## Lenguaje ubicuo
- **Contacto**: persona/empresa con uno o más canales.
- **Cotización**: oferta con ítems (Lite o sincronizada con NÚCLEO).
- **Orden**: cotización aceptada convertida en pedido.
- **Pago**: transacción asociada a una orden.

## Invariantes
1. Todo contacto pertenece a un tenant.
2. Una cotización aceptada puede convertirse en orden (1:1 o 1:N según regla).
3. Los montos usan `Money` (cantidad + moneda), nunca `number` suelto.
4. Toda entidad creada por IA registra `created_by_type` + `ai_interaction_id`.

## Dependencias
Solo `shared-kernel`; sync NÚCLEO vía eventos en `application`.
