# DASHBOARD /inbox (Panel) — FUENTE DE VERDAD NO NEGOCIABLE

> Estado: **CONGELADO** · Origen: confirmación directa del owner (Hotfix Z, 2026-10-18).
> Esta es la estructura **canónica** del Panel. Cualquier cambio de layout/orden/tarjetas
> requiere aprobación explícita del owner y una actualización de este archivo PRIMERO.
> Regla rectora del repo: **cero-mocks** (nada renderiza sin dato real; vacío honesto, nunca inventado).

## Orden vertical EXACTO (de arriba hacia abajo)

1. **Header principal** — chips de navegación (Panel, Contactos, Cotizaciones, Ordenes, Pagos,
   Automacion, Reportes, IA, Canales, Templates, Ajustes) + EN/idioma + tema + Salir.
   **PERMANENTES**: nunca desaparecen por loading/error/offline/500 (Z-3: visibilidad por ruta,
   no por estado de sesión). Se ocultan SOLO en `/login` y en las páginas-popup de OAuth.

2. **Barra de WhatsApp** (registro/edición de negocio) — **SE QUEDA** justo debajo del header.
   Es el acceso de alta/edición del negocio (abre el overlay de onboarding). NO se elimina.
   El CTA **"Crear mi negocio"** vive en el **lado DERECHO de la barra** (sin tenant → "Crear mi
   negocio"; con tenant → "Editar datos"). El alta de negocio NO vive en ninguna tarjeta del Panel.

3. **Línea 1 · 4 tarjetas** (una sola fila): **Tenant** (con Plan) · **Conversaciones abiertas** ·
   **Sin asignar** · **Total**.

4. **Línea 2 · 3 tarjetas** (una sola fila): **Distribución por canal** · **Cumplimiento SLA** ·
   **Pendientes**.

5. **Línea 3 · 4 tarjetas** (una sola fila): **Estado de agentes IA** · **Actividad reciente** ·
   **Peticiones** · **Búsqueda inteligente**.
   Las 2 nuevas (Peticiones, Búsqueda inteligente) siguen el **mismo patrón visual** de las 2
   anteriores de su línea (misma `bento-card`, título + icono + cuerpo). **NO** hay tarjeta
   "Agregar cliente" en el Panel (el alta vive en la barra de WhatsApp).

6. **Barra de canales**: WhatsApp · Email · Instagram · Abierta · Pendiente · Diferido · Resuelta ·
   SLA · Limpiar.

7. **Sección "Gráficas"** (antes "Conversaciones", **renombrada**) — **UN solo contenedor
   full-width** (NO se parte en 4 tarjetas). **Dentro**, las **4 gráficas en una misma línea**,
   cada una con su **leyenda debajo**:
   - **Rendimiento de ventas** → gráfica de **barras**
   - **Mensajes consumidos** → gráfica de **líneas**
   - **Rendimiento de agentes** → gráfica de **líneas**
   - **Uso por canal** → gráfica **circular** (pie/dona)
   - Paleta de colores **dinámica y futurista** (librería `recharts`).
   - La lista de conversaciones del dashboard queda **reemplazada** por esta sección.

## Reglas de estilo y datos (no negociables)

- **Tamaños y estilos de cada tarjeta = los ACTUALES.** Son los ideales. NO se cambian.
  Solo se optimiza la **rejilla** para que todo cuadre en pantalla (spans del grid de 12 col).
  Cero cambios de CSS/colores/tipografía en las tarjetas.
- **Cero-mocks:** cada gráfica y cada tarjeta nueva se alimenta de **dato real** donde exista.
  "Uso por canal" usa el dato real ya disponible (el mismo de "Distribución"). Donde **aún no
  hay endpoint** (ventas, mensajes, agentes, peticiones), se muestra el **estado vacío honesto**
  ("Sin datos aún"), **nunca** números/series inventados.
- "Búsqueda inteligente" = buscador real sobre datos ya cargados (conversaciones/contactos); no es mock.
- Grid 12 col: Línea 1 = 4×`col-3`; Línea 2 = 3×`col-4`; Línea 3 = 4×`col-3`; Gráficas = 1 contenedor
  `col-12` con 4 gráficas internas. En móvil, todo colapsa a 1 por fila (breakpoint existente).

## Trazabilidad
- Z-3 (header permanente): `shell.tsx` visibilidad por ruta. CERRADO/verde.
- Z-1 (restaurar/estructurar Panel) + Gráficas: EN CURSO (rama `hotfix/Z-ui-restore-form-chips`).
