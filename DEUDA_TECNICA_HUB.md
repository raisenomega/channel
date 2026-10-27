# DEUDA TÉCNICA — HUB by Raisen

> Documento de deuda del proyecto. Entrada mayor: **Auditoría profunda "responde pero NO dispara" + aislamiento + eco** (modo workflow, 11 agentes, solo lectura).

## Auditoría 2026-10-27 — "responde sin disparar" / aislamiento / eco

- **Hallazgos confirmados contra el código:** 38 (alta: 26, media: 10, baja: 2)
- **Método:** 5 dimensiones en paralelo (camino de disparo · aislamiento de contacto · eco/dedup · muletilla · gates de envío) → cada hallazgo re-verificado adversarialmente contra file:línea real → síntesis.
- **Regla:** solo lectura, cero cambios. Lo no confirmable en el repo queda marcado explícito.

---

## INFORME DE SÍNTESIS

Todos los hallazgos verificados contra el código real. A continuación el informe.

---

# INFORME DE AUDITORÍA — HUB by Raisen: "responde pero NO dispara" + aislamiento + eco

Verifiqué en código las ~30 afirmaciones. Todas las líneas citadas son exactas (ya venían con las correcciones de off-by-one: `tools: null` está en agent-reasoner.ts:60, el `err catalogo_vacio` en quote-proposal.producer.ts:26). No encontré ninguna contradicción. Lo que NO es confirmable en el repo lo marco explícito al final.

---

## 1) MAPA DE CAUSAS RAÍZ POR SISTEMA

### A. DISPARO (por qué el /q/ no sale) — cadena de compuertas AND, todas con `return` silencioso
Seis filtros en serie; si CUALQUIERA falla, no hay cotización y el chat igual responde:

| # | Compuerta | file:línea |
|---|-----------|-----------|
| 1 | Flag de env default-OFF: sin `QUOTE_PROPOSAL_ENABLED==='true'` → `q=null`, el quote ni se instancia | `src/server/autodraft-wrapper.ts:55` |
| 2 | Sin `router` → `this.enviar=undefined`, nunca manda aunque pase todo | `src/server/autodraft-wrapper.ts:55` |
| 3 | Trigger: `if (!opportunity && !QUOTE_RE.test(ev.content)) return` — el mensaje que completa el 4º dato NO trae intención de compra → nunca re-evalúa | `src/cognition/application/maybe-quote.service.ts:29` |
| 4 | **5º campo oculto**: `datosBaseCompletos` exige `product_interest` ADEMÁS de nombre/teléfono/email/dirección → con "los 4 datos" da `false` y corta | `src/cognition/infrastructure/contact-completeness.query.ts:13` |
| 5 | Catálogo SKU vacío → `return` SIN log | `src/cognition/application/maybe-quote.service.ts:32` |
| 6 | Gate LLM `worth=false` (prompt exige intención concreta + match exacto de catálogo) | `maybe-quote.service.ts:36` / `quote-proposal.producer.ts:13-15` |
| 7 | **Envío solo en autónomo**: `if (mode==='autonomous' && this.enviar)`; en supervisado/off persiste draft pero el /q/ NO sale, sin log de "no enviado" | `maybe-quote.service.ts:39` |

Agravantes estructurales: `razonAutoEnvio` (dailyCap/confidence/canal/horario) NO gobierna el quote, solo el chat (`maybe-autodraft.service.ts:45` corre el postHook antes e independiente). `can.quote` (firma del dueño) es **código muerto**: nunca se consulta (`autonomy-decision.ts:30` solo lee `can.reply`). `pendiente` (dedup "una por conversación") se inyecta pero **nunca se llama** (`maybe-quote.service.ts:19`, ausente en `ejecutar` 26-45).

### B. AISLAMIENTO de contacto (contaminación cruzada: "Rebecca ve datos de Jorge")
| Defecto | file:línea |
|---------|-----------|
| Llave de contacto con triple fallback peligroso: `participantId ?? sender.id ?? providerMessageId` | `src/inbox/application/zernio-message.parser.ts:58` |
| `contactId = ct:${tenantId}:${contactExternalId}` — SIN canal ni accountId | `src/inbox/application/ingest-zernio-message.use-case.ts:48` |
| `convId = cv:${tenantId}:${channel}:${contactExternalId}` — con canal pero SIN accountId | `ingest-zernio-message.use-case.ts:49` |
| `detId` = SHA-256 puro del seed → mismo seed = mismo id (merge determinista) | `det-uuid.ts:7-9` |
| `refreshContactName` pisa `display_name` por id en cada inbound | `zernio-ingest.queries.ts:51-53` (disparo en `use-case.ts:59`) |
| `setConvRefs` sobreescribe `provider_conversation_id` por id → entrega al hilo equivocado | `zernio-ingest.queries.ts:39-46`; enrutamiento por convId en `zernio.adapter.ts:27` |
| La captura pisa display_name/phone/email/address con OVERWRITE incondicional leyendo todo inbound como "cliente" | `contact-data.persist.ts:16-19` / `strategic-queries.ts:15` |

Consecuencia: si dos clientes colapsan en el mismo `contactId`, todas estas queries (bien scope-eadas por id) leen/escriben el contacto equivocado. El defecto de llave está **confirmado en código**; la materialización ("Jorge en el chat de Rebecca") es **condicional** al shape real del webhook.

### C. ECO / DEDUP (loop: el agente responde a su propio mensaje)
| Defecto | file:línea |
|---------|-----------|
| El parser acepta `message.sent` y la dirección se decide SOLO por `=== "outgoing"` → cualquier otro valor cae a `inbound` | `zernio-message.parser.ts:35,46` |
| No se lee `is_echo`/`recipient` en ningún punto (grep: cero hits en la ingesta) | `zernio-message.parser.ts:32-65` |
| `maybeAutodraft` dispara en TODO inbound, sin guard de "remitente == negocio" ni dedup por contenido | `ingest-zernio-message.use-case.ts:72` |
| **`provider_message_id` NUNCA se escribe** en el INSERT de `messages` → la dedup muere | `message.repository.supabase.ts:20-31` |
| Dedup filtra por `provider_message_id` (siempre NULL) y corta en vacío | `zernio-ingest.queries.ts:15-18` |
| Sin UNIQUE en la tabla sobre `provider_message_id` | `supabase/migrations/011_messages.sql:14` |
| El saliente NUNCA se inserta localmente → no hay con qué comparar el eco | `send-approved-draft.service.ts:33` / `cotizacion-sender.ts:36` |

### D. MULETILLA ("el equipo la prepara / se la enviaremos")
| Hecho | file:línea |
|-------|-----------|
| La frase NO está hardcodeada: grep solo matchea el prompt que la PROHÍBE. Es salida emergente del LLM | `agent-reasoner.ts:52` |
| El agente no tiene actuador: `tools: null` y prohibición explícita de herramientas | `agent-reasoner.ts:60` / `:51` |
| **Loop de verdad roto**: el resultado del postHook (¿disparó? ¿token? ¿url?) se descarta (`Promise<void>`) | `maybe-autodraft.service.ts:45` |
| `AgentContext` no tiene ningún campo `quoteSent/quoteToken/quoteUrl` | `agent-context.ts:13-20` |
| El link se manda como mensaje SEPARADO con texto propio; el LLM nunca lo ve | `cotizacion-sender.ts:35-36` |
| Las personas (Zahra/Thao/Iris/etc.) NO se inyectan en la respuesta al cliente; `personaSlug` solo elige el tier | `generate-draft.handler.ts:52` |

---

## 2) LA CAUSA RAÍZ ÚNICA MÁS PROBABLE DE "responde sin disparar"

Honestamente **no es una sola línea: es una cadena de compuertas AND**, y cualquiera basta para reproducir el síntoma. Pero la **desconexión arquitectónica es la raíz madre**: el camino que genera la respuesta (`generate.ejecutar`, siempre corre) y el camino que dispara el /q/ (`postHook → MaybeQuoteService`, ~6 gates silenciosos) son **independientes y el chat nunca sabe si el disparo ocurrió** (`maybe-autodraft.service.ts:45` + `agent-context.ts:13-20`). Por eso "parchamos y seguimos sin disparar": cada parche arregla UN gate de la cadena, no la cadena.

Dentro de esa cadena, el eslabón **que mejor explica tu síntoma exacto** ("tiene los 4 datos y aun así no dispara") es:

> **`contact-completeness.query.ts:13` — `datosBaseCompletos` exige un 5º campo, `product_interest`, que solo se llena por vía BLANDA del LLM (`contact-data.persist.ts:24`) y NO tiene captura DURA (regex).**

Los 4 datos (nombre/teléfono/email/dirección) sí se capturan duro; `product_interest` casi siempre queda vacío → `maybe-quote.service.ts:30` aborta con un `console.error` invisible. Es la causa **más directa y verificable 100% en código**.

**PERO** antes de tocar código hay que confirmar en prod (NO visible desde el repo, lo digo explícito): `QUOTE_PROPOSAL_ENABLED==='true'`, `AGENT_CAPTURE_ENABLED==='true'`, que el `router` se inyecte, y el `mode` del tenant (`tenants.agents_autodraft`, default `'off'`). Si el flag está off → **nada dispara jamás** y el 5º campo es irrelevante. Ninguna de las dos env vars aparece en los 3 `.env` del repo.

---

## 3) PLAN DE FIX PRIORIZADO

**PASO 0 — Verificación de prod (ANTES de tocar código).** Confirmar en Railway/entorno: `QUOTE_PROPOSAL_ENABLED`, `AGENT_CAPTURE_ENABLED`, inyección de `router`, y `mode` del tenant. Es gratis y puede explicar todo sin un solo commit. **No confirmable desde el código.**

**PASO 1 — Observabilidad (destapar el fallo invisible).** Añadir `console.error` a los `return` mudos (`maybe-quote.service.ts:29` y `:32`) y un log explícito en supervisado (`:39`, "no enviado por modo"). Cambio de 5 líneas que elimina para siempre el "no dispara y nadie sabe por qué". **Hacer esto primero.**

**PASO 2 — DISPARO (el desbloqueo real).** Decisión de producto + código:
- **`product_interest`**: decidir si es parte del contrato de "datos base" (el doc-comment de `contact-completeness.query.ts` dice que sí). Si sí → agregar **captura DURA** de producto en `contact-data.persist.ts` (hoy los `DatosDuros` solo traen name/phone/email/address). Si no → sacarlo del gate de `:13` y dejarlo como enriquecimiento. Sin esto, el gate seguirá cortando.
- **Modo de envío** (`maybe-quote.service.ts:39`): decidir si en supervisado el cliente recibe el /q/. Si el negocio quiere auto-disparo, el envío no puede quedar `autonomous`-only sin alternativa; si no, el link debe salir al aprobar el draft el operador.
- **Dedup real** (`maybe-quote.service.ts:19`): cablear `this.pendiente` al inicio de `ejecutar` → si ya hay cotización pendiente, reenviar el link existente en vez de crear otro.

**PASO 3 — MULETILLA / loop de verdad (cerrar el lazo).** Threadear el resultado del quote de vuelta al chat: capturar el retorno del postHook (`maybe-autodraft.service.ts:45`) → agregar `quoteSent/quoteToken/quoteUrl` a `AgentContext` (`agent-context.ts:13-20`) → que `generate` lo use. Así el agente confirma el link real o calla, en vez de alucinar "el equipo la prepara". **NO tocar las personas** para esto: es el lugar equivocado (`generate-draft.handler.ts:52` confirma que no se inyectan al cliente).

**PASO 4 — ECO/DEDUP (matar el loop) + AISLAMIENTO (ver sección 4).** Van juntos porque se refuerzan.

### Qué NO tocar
- **El inbound de IG que ya funcionó**: el camino "inbound con `participantId`" es correcto. Todos los cambios de aislamiento deben ser **guards aditivos**, nunca reescribir la resolución que hoy sirve.
- **El gate de email obligatorio**: email sigue siendo innegociable (LEY ABSOLUTA). No sacarlo de `contact-completeness.query.ts`.
- **Las personas (Zahra/Victor/etc.)**: la muletilla NO vive ahí. Editarlas no cambia nada.

---

## 4) AISLAMIENTO "BLINDADO POR CONTACTO / RED / NÚMERO / EMAIL"

Tu pedido ("tratar cada contacto como nuevo, sin relación uno con otro") se resuelve en **tres capas**, todas aditivas:

### Capa 1 — Llave de identidad del contacto (dónde: `parser:58` + `ingest:48-49`)
Hoy el `contactId` colapsa redes/cuentas porque su seed es solo `ct:${tenantId}:${contactExternalId}`.
- **Blindar el seed**: incluir canal y cuenta → `ct:${tenantId}:${channel}:${accountId}:${contactExternalId}` (y el `convId` igual). Así el mismo "Jorge" en IG y en WhatsApp, o en dos páginas distintas, **nunca** colapsa en un id.
- **Eliminar el fallback peligroso** de `parser:58`: `contactExternalId` NO debe caer a `sender.id` (que en saliente es el NEGOCIO) ni a `providerMessageId`. Si no hay `participantId`, **no crear contacto** (skip del autodraft) en vez de inventar una llave que colapsa.
- Resultado: `leerHilo`/perfil ya filtran bien por id (`strategic-queries.ts:12`); con la llave correcta aguas arriba, el aislamiento es automático.

### Capa 2 — Idempotencia / dedup real (dónde: `message.repository.supabase.ts:20-31` + migración)
- **Escribir `provider_message_id` en el INSERT** (hoy falta, por eso toda fila queda NULL y la dedup es un no-op).
- **Agregar `UNIQUE(tenant_id, provider_message_id)`** en una migración nueva (la 011 no lo tiene). Esa es la red de seguridad que corta reentregas aunque el guard aplicativo falle.

### Capa 3 — Corte de eco (dónde: `parser:46` + `ingest:72`)
- En el parser: clasificar como **outbound** todo `message.sent`, y cuando `sender.id === account/page id`, aunque falte `direction`. Leer `is_echo`/`recipient` si Zernio los manda.
- En el ingest: **guard "remitente == negocio"** antes de `maybeAutodraft` (`:72`), y dedup por contenido en ventana corta contra salientes recientes.
- **Persistir los salientes localmente** (`send-approved-draft.service.ts`, `cotizacion-sender.ts` hoy no insertan en `messages`) para poder reconocer el eco cuando Zernio lo refleje.

---

## LO QUE NO PUDE CONFIRMAR (explícito, no inventado)
1. **Valores reales en prod** de `QUOTE_PROPOSAL_ENABLED`, `AGENT_CAPTURE_ENABLED`, inyección de `router` y `mode` del tenant. No accesibles desde el código. Es el PASO 0 obligatorio.
2. **Shape real del webhook de Zernio en `message.sent`/eco**: si llega sin `direction='outgoing'` o sin `participantId`. De esto depende que el loop y la colisión de `contactId` se materialicen. El mecanismo en código está confirmado; la manifestación es **plausible/condicional**, no verificable en el repo.
3. **La muletilla literal** ("el equipo la prepara"): es comportamiento emergente del LLM, no hay string hardcodeado (grep lo confirma). El desacople estructural que lo provoca sí está confirmado, pero el wording exacto no es comprobable en código.

---

## LOS 38 HALLAZGOS CONFIRMADOS (detalle, por severidad)

### 1. [ALTA] El disparo del /q/ exige intencion de compra EN EL MENSAJE ACTUAL; el mensaje que completa el 4o dato no la tiene -> nunca dispara
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:29`
- **Causa raíz:** CONFIRMADO. maybe-quote.service.ts:29 `if (!opportunity && !QUOTE_RE.test(ev.content)) return;`. `opportunity` llega como `intent.opportunity` desde maybe-autodraft.service.ts:43 (`this.classifier.clasificar(ev.content)`) -> :45 (`this.postHook(ev, intent.opportunity, mode)`), y el wrapper enruta el postHook a q.ejecutar (autodraft-wrapper.ts:56). IntentClassifier (intent-classifier.ts:18,32) pone opportunity=true SOLO ante intencion real de compra, evaluada sobre ev.content (el mensaje entrante, intent-classifier.ts:25). QUOTE_RE=maybe-quote.service.ts:13 (/cotiz|presupuest|precio|cuanto|crea|hazla|hagala|comprar|orden|quiero/i) no matchea 'mi correo es x@y.com' ni 'vivo en Calle 5'. No existe ningun trigger 'datos recien completados -> dispara' en el codigo. Causa raiz exacta.
- **Verificación:** Confirmado citando codigo: el guard de linea 29 aborta cuando ni opportunity ni QUOTE_RE se cumplen, y el mensaje que aporta el ultimo dato no cumple ninguno. No hay re-evaluacion al completarse los datos.

### 2. [ALTA] datosBaseCompletos exige un 5o campo (product_interest) tratado como 'los 4 datos' -> contacto 'completo' da falso -> LEY ABSOLUTA corta
- **Ubicación:** `src/cognition/infrastructure/contact-completeness.query.ts:13`
- **Causa raíz:** CONFIRMADO. contact-completeness.query.ts:13 `return Boolean(c.display_name && c.primary_phone && c.primary_email && c.address && c.product_interest)` -> CINCO campos. maybe-quote.service.ts:30 aborta con '[quote] LEY ABSOLUTA: datos base incompletos' si da false. product_interest solo se escribe por via BLANDA del LLM en contact-data.persist.ts:24 (`if (d.product && d.product.length > ...)`); el objeto DatosDuros (regex) NO tiene campo product (contact-data.persist.ts:16-19 duros = name/phone/email/address), es decir NO hay captura DURA de producto. maybe-capture.service.ts:22 usa el mismo guard de 5 campos (`this.completos`, inyectado como datosBaseCompletos en autodraft-wrapper.ts:54), por lo que re-escanea indefinidamente mientras falte product_interest. Causa raiz exacta.
- **Verificación:** Confirmado: contact-completeness.query.ts:13 incluye product_interest (5 campos) y es el guard que corta en maybe-quote.service.ts:30; product_interest solo se llena por LLM blando (contact-data.persist.ts:24), sin captura dura.

### 3. [ALTA] El link /q/ solo se AUTO-ENVIA en mode==='autonomous'; en supervisado se persiste borrador y el cliente nunca recibe el link
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:39`
- **Causa raíz:** CONFIRMADO. maybe-quote.service.ts:39 `if (mode === 'autonomous' && this.enviar)` envuelve la unica llamada a this.enviar (makeEnviarCotizacion, maybe-quote.service.ts:42). En supervisado se ejecuta persistir() (linea 37, crea agent_draft scope=quote con token /q/, quote-proposal-persist.ts:30) pero enviar NUNCA se invoca -> el /q/ no sale. El modo se lee de tenants.agents_autodraft con default 'off' (autodraft-flag.repo.ts:14 `row.agents_autodraft ?? 'off'`). El agente igual responde texto por la ruta del draft (maybe-autodraft.service.ts:53-60). Causa raiz exacta.
- **Verificación:** Confirmado: el envio del link esta condicionado a mode==='autonomous' en la linea 39; cualquier otro modo solo persiste el borrador (linea 37) sin disparar el /q/.

### 4. [ALTA] Gate silencioso worth=false del LLM: si el productor no juzga intencion concreta -> 'no-worth' y no hay cotizacion
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:36`
- **Causa raíz:** CONFIRMADO. maybe-quote.service.ts:36 `if (!prop.ok || !prop.value.worth) { console.error('[quote] no-worth ...'); return; }`. quote-proposal.producer.ts manda el hilo a un LLM sonnet (linea 30, tier:'sonnet') cuyo PROMPT exige intencion CONCRETA de compra y items que calcen con el catalogo, si no -> worth=false, lines=[] (quote-proposal.producer.ts:13-14). Gate no determinista en el camino critico que muere solo con console.error. Causa raiz exacta.
- **Verificación:** Confirmado: gate worth en linea 36 con prompt que fuerza worth=false salvo intencion concreta + match exacto de catalogo (quote-proposal.producer.ts:13-15).

### 5. [ALTA] Loop de eco y contaminacion cruzada: webhook ingiere message.sent, direccion defaultea a 'inbound', contactExternalId con fallback peligroso
- **Ubicación:** `src/inbox/application/zernio-message.parser.ts:46`
- **Causa raíz:** CONFIRMADO A NIVEL DE CODIGO (con el caveat que el propio hallazgo declara). zernio-message.parser.ts:35 acepta message.received Y message.sent. :46 `const direction = String(m['direction']) === 'outgoing' ? 'outbound' : 'inbound'` -> CUALQUIER valor distinto de 'outgoing' exacto (incl. ausente/'sent'/'out') cae a INBOUND. ingest-zernio-message.use-case.ts:72 dispara maybeAutodraft SOLO en inbound -> un eco saliente mal clasificado haria que el agente responda a su propio mensaje (loop). :58 contactExternalId = `conv['participantId'] ?? sender['id'] ?? providerMessageId`; convId determinista `cv:${tenantId}:${z.channel}:${z.contactExternalId}` (ingest:49). Si participantId falta en el saliente y cae a sender.id (= el NEGOCIO), multiples contactos colapsan en UN mismo convId -> leerHilo filtra SOLO por conversation_id (strategic-queries.ts:12) -> se mezclan datos de contactos distintos (Rebecca ve datos de Jorge). El disparo real en prod depende de los valores que Zernio manda en message.sent, que NO estan en el repo -> no verificable al 100% (el hallazgo lo admite).
- **Verificación:** Confirmados todos los hechos de codigo citados (parser:35,46,58; ingest:49,72; strategic-queries:12). El mecanismo de loop y de colision de convId es real en el codigo; su materializacion en prod depende del payload de Zernio, no presente en el repo (caveat ya declarado en el hallazgo).

### 6. [ALTA] provider_message_id NUNCA se escribe en messages -> dedup/idempotencia muerta -> loop de eco + pmid VACIO en DB
- **Ubicación:** `src/inbox/infrastructure/message.repository.supabase.ts:20-31`
- **Causa raíz:** El INSERT de MessageRepositorySupabase.guardar (message.repository.supabase.ts:20-31) enumera id, tenant_id, conversation_id, contact_id, direction, sender_type, channel, provider, content, content_type, media_url, media_mime, status, ai_agent_interaction_id, ai_confidence, ai_mode. NO incluye provider_message_id, pese a que el handler construye msg.providerMessageId = z.providerMessageId (ingest-zernio-message.use-case.ts:65). Por tanto toda fila de messages queda con provider_message_id NULL. La dedup mensajeYaExiste (zernio-ingest.queries.ts:17) filtra .eq('provider_message_id', providerMessageId) y nunca halla coincidencia; ademas corta en vacio en :16 (if(!providerMessageId) return false). Resultado: ingest-zernio-message.use-case.ts:47 ('idempotente') es un no-op y cada reentrega/eco se vuelve a persistir. message.mapper.ts:15 lee la columna al leer, pero nunca se escribio.
- **Verificación:** CONFIRMADO en codigo real. El objeto del INSERT (lineas 20-31) carece de provider_message_id mientras el dominio si lo trae (use-case:65). Dedup (queries.ts:15-18) y mapper (:15) citados exactos. La idempotencia queda rota -> explica pmid vacio y falta de tope al eco. Causa raiz exacta.

### 7. [ALTA] Clave de aislamiento debil: contactExternalId cae a sender.id/providerMessageId y el contactId ignora red/cuenta
- **Ubicación:** `src/inbox/application/zernio-message.parser.ts:58`
- **Causa raíz:** zernio-message.parser.ts:58 define contactExternalId = String(conv['participantId'] ?? sender['id'] ?? providerMessageId) (triple fallback) y :60 usa la misma cadena para telefono. ingest-zernio-message.use-case.ts:48 deriva contactId = detId(`ct:${tenantId}:${z.contactExternalId}`) SIN z.channel ni z.accountId; :49 deriva convId = detId(`cv:${tenantId}:${z.channel}:${z.contactExternalId}`) con channel pero SIN accountId. det-uuid.ts:7-9 confirma que el id es funcion pura (SHA-256) del seed, asi que mismo seed = mismo id. El fixture tests/unit/inbox/ingest-zernio-message.test.ts:110 muestra un payload message.sent con conversation:{id:'cv'} SIN participantId, forzando el fallback a sender.id='biz' (la pagina/negocio).
- **Verificación:** CONFIRMADO estructuralmente: la clave de aislamiento es un solo campo con dos fallbacks (parser:58) y el contactId NO incorpora red/cuenta (use-case:48). La CONTAMINACION por colision (Jorge en el chat de Rebecca) es PLAUSIBLE/condicional: requiere que el inbound real colapse en sender.id; el inbound principal del fixture si trae participantId, y maybeAutodraft solo dispara en inbound (use-case:72). El defecto de clave esta confirmado; el escenario exacto de contaminacion depende del shape real del webhook y no pude confirmarlo con un inbound de FB/IG sin participantId.

### 8. [ALTA] El nombre del contacto compartido se sobreescribe en cada inbound (refreshContactName) -> nombre de otro cliente en el chat
- **Ubicación:** `src/inbox/infrastructure/zernio-ingest.queries.ts:51-53`
- **Causa raíz:** refreshContactName (zernio-ingest.queries.ts:51-53) hace update de contacts.display_name POR id, disparado en ingest-zernio-message.use-case.ts:59 cuando z.contactName !== 'Cliente'. Si dos clientes colapsaran en el mismo contactId (ver hallazgo de clave debil), el display_name queda con el del ultimo. La respuesta del agente inyecta ese perfil: contact-profile.query.ts:13 selecciona display_name/primary_phone/primary_email/address y :24 los mete como 'DATOS EN ARCHIVO'; cotizacion-sender.ts:17-20 (datosCliente) lee lo mismo por id para el link. Las queries estan bien scope-eadas por id; el fallo esta aguas arriba (clave) + este overwrite sin mas discriminante.
- **Verificación:** CONFIRMADO el mecanismo de overwrite por id (queries:51-53, disparo en use-case:59) y la inyeccion del perfil al prompt (contact-profile.query.ts:13-24; datosCliente en cotizacion-sender.ts:17-21). Es PLAUSIBLE como causa de 'nombre/direccion de otro' porque DEPENDE de la colision de contactId del hallazgo anterior. El defecto de codigo esta confirmado; la manifestacion requiere la colision.

### 9. [ALTA] El disparo de /q/ esta detras de flags de entorno OFF por defecto y de un 5o dato (product_interest)
- **Ubicación:** `src/server/autodraft-wrapper.ts:54-55`
- **Causa raíz:** autodraft-wrapper.ts:54 instancia MaybeCaptureService solo si getEnv('AGENT_CAPTURE_ENABLED') === 'true'; :55 instancia MaybeQuoteService solo si getEnv('QUOTE_PROPOSAL_ENABLED') === 'true' (ambos con ?? '' -> default OFF). Verifique que NINGUNA de las dos variables aparece en .env.example, .env.development ni .env.local (grep: unica referencia es autodraft-wrapper.ts); si en prod no estan seteadas, q=null y el agente responde (autodraft) pero NUNCA intenta cotizar. Con el flag ON, datosBaseCompletos (contact-completeness.query.ts:13) exige display_name && primary_phone && primary_email && address && product_interest: un 5o dato ademas de los 4 del sintoma; si falta, maybe-quote.service.ts:30 aborta. Y aun completos, el link solo se ENVIA si mode === 'autonomous' (maybe-quote.service.ts:39); en supervisado la propuesta se persiste (:37) pero /q/ no sale.
- **Verificación:** CONFIRMADO en codigo: flags default-OFF (autodraft-wrapper.ts:54-55), ausencia de ambas vars en los 3 .env del repo (verificado por grep), 5o dato product_interest (contact-completeness.query.ts:7-13), aborto por incompleto (maybe-quote.service.ts:30) y envio solo-autonomo (:39). Cualquiera de las 3 compuertas produce 'responde pero no dispara'. No puedo confirmar el valor REAL de las env vars ni el modo en prod (no accesible desde el codigo), pero las compuertas existen tal como se describen. blocks_fire correcto.

### 10. [ALTA] Sin guardia anti-eco: salientes no se persisten localmente y el parser no lee is_echo/recipient
- **Ubicación:** `src/inbox/application/ingest-zernio-message.use-case.ts:72`
- **Causa raíz:** maybeAutodraft se dispara para todo inbound (ingest-zernio-message.use-case.ts:72: if (z.direction === 'inbound')). El parser no extrae is_echo ni recipient (zernio-message.parser.ts:32-65); la direccion se decide solo por igualdad estricta: direction = String(m['direction']) === 'outgoing' ? 'outbound' : 'inbound' (parser:46), asi que cualquier otro valor cae a inbound. El envio saliente NUNCA inserta en messages: SendApprovedDraftService.ejecutar solo llama router.enviar (send-approved-draft.service.ts:33) y makeEnviarCotizacion igual (cotizacion-sender.ts:36); el saliente solo queda en DB cuando Zernio lo refleja por webhook. Si ese reflejo/eco de Meta llega como message.received (direction != 'outgoing'), se persiste como 'contact' y vuelve a disparar al agente contra su propio texto. Sin la dedup (provider_message_id nulo, hallazgo 1) no hay red de seguridad -> loop.
- **Verificación:** CONFIRMADO estructuralmente: disparo en todo inbound (use-case:72), direccion por igualdad estricta sin lectura de is_echo (parser:46, :32-65), y cero INSERT del saliente en messages (send-approved-draft.service.ts:26-39, cotizacion-sender.ts:36). Que el eco de Meta llegue como message.received/inbound es PLAUSIBLE (depende del shape real de Zernio, no confirmable en el codigo). Combinado con la dedup rota, el loop sin tope esta habilitado por codigo.

### 11. [ALTA] No existe filtro de ECO/auto-mensaje: el parser acepta message.sent y clasifica como INBOUND todo lo que no traiga direction==='outgoing' -> realimenta al agente (LOOP)
- **Ubicación:** `src/inbox/application/zernio-message.parser.ts`
- **Causa raíz:** Clasificacion de direccion fragil (solo campo direction) + ausencia total de deteccion de eco/auto-mensaje antes de reinyectar al agente.
- **Verificación:** CONFIRMADO en codigo. parser:35 acepta ambos eventos: `if (p["event"] !== "message.received" && p["event"] !== "message.sent") return null;`. parser:46 deriva la direccion UNICAMENTE del campo: `const direction = String(m["direction"]) === "outgoing" ? "outbound" : "inbound";` -> cualquier payload sin direction exactamente 'outgoing' cae a inbound. grep -rniE 'is_echo|echo' src/ no encuentra ningun filtro de eco en la ingesta (unico hit: identity/oauth-state.ts, no relacionado). ingest:72 confirma que todo inbound invoca maybeAutodraft. El test tests/unit/inbox/ingest-zernio-message.test.ts:109 tiene que fijar EXPLICITAMENTE `direction:"outgoing"` para que un message.sent del negocio ('Zafacones Ramos') se clasifique outbound: sin ese campo seria inbound, lo que demuestra la fragilidad. CAVEAT (lo declaro): NO es confirmable en codigo que el eco real de IG/Zernio llegue sin direction='outgoing'; la realimentacion al agente es el mecanismo confirmado, el disparo exacto del loop depende de la forma del payload de prod que no esta en el repo.

### 12. [ALTA] maybeAutodraft se dispara en CADA inbound sin verificar que el remitente no sea el propio negocio -> cierra el loop de eco (solo en modo autonomo)
- **Ubicación:** `src/inbox/application/ingest-zernio-message.use-case.ts`
- **Causa raíz:** El postHook/autodraft no tiene guard de 'remitente == negocio' ni dedup por contenido; depende enteramente de la correcta clasificacion de direccion del parser.
- **Verificación:** CONFIRMADO. ingest:72 `if (z.direction === "inbound") this.d.maybeAutodraft?.({ ... from: z.contactExternalId, content: z.content ... })` se ejecuta para TODO inbound, sin comparar contenido/remitente contra outbound recientes ni descartar auto-mensajes. El envio real exige mode autonomo: maybe-autodraft.service.ts:50 `if (mode === "autonomous" && !dec.send) return no_send` y :60 `if (dec.send && this.autoSend) { ... enviar(...) }` (autoSend solo existe si se pasa router). Combinado con el finding 1, un eco mal clasificado como inbound re-invoca al agente.

### 13. [ALTA] Dedup solo por provider_message_id a nivel app: pmid vacio NUNCA deduplica y NO hay UNIQUE en la tabla -> no corta un loop cuyos ecos traen id nuevo
- **Ubicación:** `src/inbox/infrastructure/zernio-ingest.queries.ts`
- **Causa raíz:** Dedup basada solo en provider_message_id sin restriccion UNIQUE en BD ni fallback por contenido/ventana temporal.
- **Verificación:** CONFIRMADO. zernio-ingest.queries.ts:16 `if (!providerMessageId) return false;` (pmid vacio => 'no existe' => se inserta). message.entity.ts:68 crearMensaje fija `providerMessageId: null`. supabase/migrations/011_messages.sql:14 `provider_message_id text,` SIN UNIQUE, y verifique que NINGUNA otra migracion agrega unique/index sobre provider_message_id (grep en supabase/migrations sin resultados). La dedup es puramente aplicativa (ingest:47, por tenant+pmid), ciega al contenido y no idempotente ante concurrencia. CAVEAT: el parser rechaza pmid vacio (parser:42 `if (!providerMessageId || !profileId) return null;`), asi que un inbound de Zernio no entra con pmid vacio por esta via; y que 'cada eco trae id distinto' es asuncion de payload de prod, no confirmable en el repo. El defecto estructural (dedup ciega al contenido, sin UNIQUE) SI esta confirmado.

### 14. [ALTA] CONTAMINACION cruzada: contactId/conversationId deterministas con fallback a sender.id/pmid -> ecos sin participantId pueden colapsar a un contacto compartido
- **Ubicación:** `src/inbox/application/zernio-message.parser.ts`
- **Causa raíz:** Identidad del contacto derivada de una cadena de fallback (participantId -> sender.id -> pmid) sin garantizar que sender.id identifique al CLIENTE y no a la pagina; cualquier id compartido colapsa contactos distintos en uno via el detId determinista.
- **Verificación:** CONFIRMADO el mecanismo de codigo, PARCIALMENTE especulativa la causa. parser:58 `contactExternalId: String(conv["participantId"] ?? sender["id"] ?? providerMessageId)`; ingest:48 `detId(`ct:${tenantId}:${z.contactExternalId}`)` y :49 `detId(`cv:${tenantId}:${z.channel}:${z.contactExternalId}`)` son deterministas; ingest:59 refreshContactName/setPreferredChannel operan sobre el contacto resuelto. La cadena de fallback + merge determinista que HABILITA el colapso esta confirmada. NO es confirmable en el codigo que en message.sent/eco participantId venga ausente ni que sender.id sea un id de pagina compartido entre hilos -> esa parte (el colapso efectivo a UN contacto y 'Rebecca<-Jorge') es plausible pero depende del payload de prod, no verificable en el repo. Lo marco confirmed por el mecanismo real, con la causa raiz afinada.

### 15. [ALTA] /q/ NO dispara aunque esten los 4 datos: datosBaseCompletos exige un 5o campo (product_interest)
- **Ubicación:** `src/cognition/infrastructure/contact-completeness.query.ts`
- **Causa raíz:** El gate de completitud incluye product_interest como 5o campo obligatorio, no documentado como parte de los '4 datos', por lo que la cotizacion nunca pasa el guard.
- **Verificación:** CONFIRMADO, totalmente verificable en codigo y es la causa mas directa del sintoma 'no dispara con los 4 datos'. contact-completeness.query.ts:13 `return Boolean(c.display_name && c.primary_phone && c.primary_email && c.address && c.product_interest);` exige product_interest ademas de los 4 datos del sintoma (nombre/telefono/email/direccion). maybe-quote.service.ts:30 aborta si datosCompletos es false ('LEY ABSOLUTA: datos base incompletos ... no se crea cotizacion'). contact-profile.query.ts:30 inyecta al prompt 'FALTAN para cotizar: que producto/servicio quiere' y :31 'NUNCA digas que no puedes generar la cotizacion' -> el agente sigue conversando sin disparar. Con los 4 datos pero sin product_interest, /q/ jamas se evalua.

### 16. [ALTA] /q/ solo se auto-envia en modo autonomo; en supervisado/copilot queda como draft para FIRMA -> 'el equipo la prepara'
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts`
- **Causa raíz:** El envio del link esta condicionado a mode==='autonomous'; en supervisado/copilot la propuesta espera firma manual y el /q/ nunca llega al cliente.
- **Verificación:** CONFIRMADO. maybe-quote.service.ts:39 `if (mode === "autonomous" && this.enviar) { ... this.enviar(...) }`: el link /q/ solo se manda al cliente en modo autonomo. En cualquier otro modo la propuesta se persiste como agent_draft con status 'draft' (quote-proposal-persist.ts:36 `status: "draft"`, cabecera del archivo: 'va a FIRMA del operador. NO envia nada'). Reproduce el sintoma (c): el agente anuncia que el equipo prepara/envia la cotizacion en vez de disparar.

### 17. [ALTA] /q/ y la captura estan detras de feature flags apagados por defecto; sin captura los 4 datos no se persisten y /q/ nunca cumple el gate
- **Ubicación:** `src/server/autodraft-wrapper.ts`
- **Causa raíz:** Ambas piezas del flujo de cotizacion (captura y propuesta) requieren env flags en 'true'; por defecto quedan null y el pipeline de datos->/q/ no existe en runtime.
- **Verificación:** CONFIRMADO. autodraft-wrapper.ts:54 `const cap = (getEnv("AGENT_CAPTURE_ENABLED") ?? "") === "true" ? new MaybeCaptureService(...) : null;` y :55 `const q = (getEnv("QUOTE_PROPOSAL_ENABLED") ?? "") === "true" ? new MaybeQuoteService(...) : null;` -> ausente/distinto de 'true' => null (desactivado). :56 `const postHook = (cap || q) ? async (...) => { if (cap) ...; if (q) ... } : undefined;` -> sin ningun flag no hay postHook. Si la captura esta apagada, guardarDatosContacto no corre y display_name/phone/email/address/product_interest no se escriben -> datosBaseCompletos siempre false -> /q/ no dispara. Si el flag de quote esta apagado, MaybeQuoteService ni se invoca.

### 18. [ALTA] La muletilla de diferir NO existe como texto en el código: es salida libre del LLM. El prompt le prohíbe tools y no le da el link, así que difiere.
- **Ubicación:** `src/cognition/application/agent-reasoner.ts`
- **Causa raíz:** Confirmado. grep en src/ sobre 'enviarem|la prepara|no puedo generar|el equipo (te|la|se)|se la enviar' (case-insensitive) SOLO matchea agent-reasoner.ts:52, que es la orden del prompt ('dile que se la envias por AQUI MISMO'), NUNCA la frase de diferimiento ('el equipo la prepara / no puedo generar'). Por tanto la muletilla no esta hardcodeada: es texto emergente del modelo. Confirmado tambien que razonar() pasa tools sin actuador: agent-reasoner.ts:60 `tools: null` (la constructora del LLM va de la linea 56 a 64). El agente recibe en el systemPrompt la ORDEN de 'enviar la cotizacion por aqui mismo' (linea 52) pero NO recibe token/link ni herramienta para disparar; sin forma de ejecutar, racionaliza difiriendo.
- **Verificación:** Confirmado citando codigo: agent-reasoner.ts:52 contiene la LEY ABSOLUTA DE DATOS con 'dile que se la envias por AQUI MISMO'; agent-reasoner.ts:60 `tools: null`. grep demuestra que la muletilla de diferir no aparece literal en ningun archivo de src/. CORRECCION DE LINEA: el `tools: null` esta en la linea 60, no 61 como citaba el hallazgo (off-by-one); la sustancia se mantiene.

### 19. [ALTA] DESCONEXION RAIZ: el camino que genera la respuesta de chat NO sabe si la cotización se disparó. No recibe token, ni señal, ni resultado del postHook.
- **Ubicación:** `src/cognition/application/maybe-autodraft.service.ts`
- **Causa raíz:** Confirmado. maybe-autodraft.service.ts:45 `if (this.postHook) await this.postHook(ev, intent.opportunity, mode);` — el postHook (que contiene MaybeQuoteService.ejecutar, el disparador del /q/) es tipo Promise<void> (definido en linea 35 del mismo archivo y en autodraft-wrapper.ts:56) y su resultado se descarta por completo. Acto seguido, linea 53 `const draft = await this.generate.ejecutar({...})` genera la respuesta de forma totalmente independiente, sin recibir si el quote se creo, con que token, o si fallo. El AgentContext (agent-context.ts:13-20) no tiene ningun campo quoteSent/quoteToken/quoteUrl. El agente redacta a ciegas respecto a la cotizacion.
- **Verificación:** Confirmado citando codigo: maybe-autodraft.service.ts:45 (postHook void, descartado), linea 53 (generate.ejecutar sin dato del quote), agent-context.ts:13-20 (interface AgentContext sin ningun campo de cotizacion). Lineas exactas.

### 20. [ALTA] El link /q/ se envía como mensaje SEPARADO por otro camino (router.enviar) con texto propio; nunca pasa por el LLM ni se le informa al agente.
- **Ubicación:** `src/cognition/infrastructure/cotizacion-sender.ts`
- **Causa raíz:** Confirmado. makeEnviarCotizacion construye su PROPIO texto literal en cotizacion-sender.ts:35 (`const content = \`Tu cotizacion por $${total.toFixed(2)}. Revisa y acepta aqui:\n${appUrl()}/q/${token}\``) y lo manda directo con router.enviar en la linea 36 (`const r = await router.enviar({ to: ev.from, content, channel: ..., ...refs })`). Es un segundo mensaje saliente, desacoplado de la respuesta conversacional del agente (razonar). El agente nunca ve ese contenido ni ese token, por lo que no puede coordinar 'ya te la envie aqui' con el hecho real.
- **Verificación:** Confirmado citando codigo: cotizacion-sender.ts:35 (texto literal del link /q/) y cotizacion-sender.ts:36 (envio directo via router.enviar). Lineas exactas.

### 21. [ALTA] El envío real del /q/ solo ocurre en mode==='autonomous' y tras varios gates; la respuesta SIEMPRE se genera igual. En supervisado o con un gate que falla, no dispara pero el agente responde (y difiere).
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts`
- **Causa raíz:** Confirmado y REFORZADO. MaybeQuoteService.ejecutar solo llama a this.enviar (disparo del /q/) si `mode === 'autonomous' && this.enviar` (maybe-quote.service.ts:39). Antes exige, cualquiera de los cuales corta con return silencioso: conversationId+contactId (linea 28), opportunity O QUOTE_RE (linea 29), datosCompletos (linea 30 -> console.error + return), catalogo no vacio (linea 32 -> return SIN log), prop.ok && worth (linea 36 -> console.error 'no-worth' + return). Mientras tanto generate.ejecutar (maybe-autodraft.service.ts:53) corre siempre. MATIZ CLAVE PARA EL SINTOMA: datosBaseCompletos (contact-completeness.query.ts:7-14) exige CINCO campos — display_name, primary_phone, primary_email, address Y product_interest — no los 4 que dice el reporte. Si el contacto tiene nombre/telefono/email/direccion pero product_interest es null, el gate de la linea 30 bloquea el disparo en silencio aunque 'los 4 datos' esten completos. Esto explica directamente 'tiene los 4 datos pero no dispara'.
- **Verificación:** Confirmado citando codigo: maybe-quote.service.ts:39 (`if (mode === 'autonomous' && this.enviar)`), linea 36 (no-worth return), linea 30 (datosCompletos return), linea 32 (catalogo vacio return). Ademas contact-completeness.query.ts:13 revela un 5o requisito (product_interest) que afina la causa raiz del sintoma reportado.

### 22. [ALTA] enviar (disparo del /q/) queda undefined salvo que QUOTE_PROPOSAL_ENABLED==='true' Y exista router. Si falta la flag o el router, la cotización NUNCA se dispara y nadie lo nota.
- **Ubicación:** `src/server/autodraft-wrapper.ts`
- **Causa raíz:** Confirmado. autodraft-wrapper.ts:55 construye MaybeQuoteService solo si `(getEnv('QUOTE_PROPOSAL_ENABLED') ?? '') === 'true'`, y el 7o argumento (enviar) es `router ? makeEnviarCotizacion(router) : undefined`. Si la flag no es 'true', q=null y el postHook (linea 56: `if (q) await q.ejecutar(ev, opp, mode)`) ni siquiera ejecuta el quote. Si q existe pero router es undefined, enviar=undefined y aunque pasen todos los gates, maybe-quote.service.ts:39 nunca envia. En ambos casos NO hay log de 'no disparo por flag/router': el fallo es invisible y el agente sigue respondiendo. Verificar en prod el valor real de QUOTE_PROPOSAL_ENABLED y la inyeccion del router es el primer check.
- **Verificación:** Confirmado citando codigo: autodraft-wrapper.ts:55 (ternario con QUOTE_PROPOSAL_ENABLED y router ? makeEnviarCotizacion(router) : undefined) y autodraft-wrapper.ts:56 (postHook ejecuta q solo si q existe). Lineas exactas.

### 23. [ALTA] El disparo NO pasa por razonAutoEnvio: dailyCap/confidence/canal/horario solo bloquean el chat, no la cotizacion
- **Ubicación:** `src/cognition/application/maybe-autodraft.service.ts:45`
- **Causa raíz:** postHook se ejecuta antes e independiente de razonAutoEnvio; la cotizacion solo recibe 'mode', nunca los demas gates
- **Verificación:** CONFIRMADO. maybe-autodraft.service.ts:45 `if (this.postHook) await this.postHook(ev, intent.opportunity, mode)` corre ANTES de la decision de chat en :49 `const dec = razonAutoEnvio(mode, config, signals, new Date(), timeZone)`, y :50 solo usa `dec` para abortar el chat. La firma del postHook (:35 y :56) pasa unicamente (ev, opportunity, mode): confidence/canal/horario/dailyCap (autonomy-decision.ts:34-37) NO llegan al quote. MaybeQuoteService.ejecutar solo consume 'mode' (maybe-quote.service.ts:26,39). Correcto que blocks_fire=false: estos gates no bloquean el disparo, solo el chat.

### 24. [ALTA] Gate de modo: en 'supervised' la cotizacion se persiste pero NUNCA se envia, sin log de 'no enviado'
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:39`
- **Causa raíz:** El envio del link solo ocurre en el bloque `if (mode === 'autonomous' && this.enviar)`; en supervised persiste draft pero no hay log ni disparo
- **Verificación:** CONFIRMADO. maybe-quote.service.ts:39 `if (mode === "autonomous" && this.enviar)` envuelve el unico envio (:40-42). En supervised, :37 persiste y :38 loguea `[quote] propuesta`, pero el bloque 39-43 se salta sin ningun log de 'no enviado'. mode viene de tenants.agents_autodraft leido en autodraft-flag.repo.ts:12 y mapeado :14 (default 'off' en :14 y agents-config.ts via mergeConfig). blocks_fire=true correcto para el auto-disparo (en supervised queda como draft que debe firmar el operador; persist guarda 'to' para envio al aprobar, quote-proposal-persist.ts:31).

### 25. [ALTA] datosBaseCompletos exige un 5o campo (product_interest) ademas de los 4 datos: con nombre/telefono/email/direccion igual bloquea
- **Ubicación:** `src/cognition/infrastructure/contact-completeness.query.ts:13`
- **Causa raíz:** La validacion exige 5 campos (incluye product_interest); si ese campo esta vacio, datosBaseCompletos=false y maybe-quote.service.ts:30 aborta
- **Verificación:** CONFIRMADO y es la causa raiz mas probable del sintoma reportado. contact-completeness.query.ts:9 selecciona product_interest y :13 `Boolean(c.display_name && c.primary_phone && c.primary_email && c.address && c.product_interest)` exige los CINCO. Con los 4 datos del sintoma pero product_interest vacio -> false -> maybe-quote.service.ts:30 hace `return` con solo `console.error('[quote] LEY ABSOLUTA...')`, invisible para el operador. Nota contaminacion CONFIRMADA: contact-completeness.query.ts:10 y cotizacion-sender.ts:18 filtran por `.eq("id", contactId)`; si contactId viene cruzado, leen datos de otro contacto. blocks_fire=true.

### 26. [ALTA] Gate de env: si QUOTE_PROPOSAL_ENABLED != 'true' el servicio de cotizacion ni se instancia (q=null); sin router no hay enviar
- **Ubicación:** `src/server/autodraft-wrapper.ts:55`
- **Causa raíz:** q=null cuando el env no es exactamente 'true', el postHook nunca llama al quote; y enviar solo existe si hay router
- **Verificación:** CONFIRMADO. autodraft-wrapper.ts:55 `const q = (getEnv("QUOTE_PROPOSAL_ENABLED") ?? "") === "true" ? new MaybeQuoteService(...) : null`; si no es 'true', q=null y el postHook en :56 `(cap || q) ? ... if (q) await q.ejecutar(...)` nunca dispara el quote, sin log. Ademas en :55 `router ? makeEnviarCotizacion(router) : undefined`: sin router this.enviar=undefined y el gate de maybe-quote.service.ts:39 (`&& this.enviar`) nunca envia aunque mode sea autonomous. blocks_fire=true.

### 27. [MEDIA] La respuesta de chat y el disparo del /q/ son dos caminos INDEPENDIENTES; el agente no puede cotizar por si mismo (tools deshabilitadas) -> promete pero no entrega
- **Ubicación:** `src/cognition/application/agent-reasoner.ts:60`
- **Causa raíz:** CONFIRMADO con matiz. agent-reasoner.ts:60 `tools: null` y :51 prohibe herramientas/<invoke>; el texto del cliente es solo texto. El disparo real depende del hook MaybeQuoteService fuera de banda (autodraft-wrapper.ts:56 postHook corre cap+q aparte de la generacion del draft; maybe-autodraft.service.ts:45 vs 53-60), con ~6 gates que fallan en silencio (maybe-quote.service.ts:28,29,30,32,36,39, todos return/console.error). MATIZ: la frase citada en el sintoma ('el equipo la prepara / se la enviaremos') NO la ordena el prompt; al contrario, agent-reasoner.ts:52 PROHIBE explicitamente decir 'el equipo te contactara' y manda decir que se envia 'por AQUI MISMO'. Por tanto ese wording concreto es desobediencia del LLM o conducta previa a este prompt, no lo que el prompt pide. La desconexion estructural (texto promete / hook dispara) si es la causa de 'responde pero no dispara'.
- **Verificación:** Confirmado el nucleo (tools:null linea 60; prompt anti-tools linea 51; caminos independientes via postHook en autodraft-wrapper.ts:56). Matiz: el prompt (agent-reasoner.ts:52) PROHIBE 'el equipo te contactara', asi que ese sintoma textual contradice el prompt actual.

### 28. [MEDIA] Catalogo SKU vacio -> disparo abortado en silencio
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:32`
- **Causa raíz:** CONFIRMADO. maybe-quote.service.ts:31-32 `const catalogo = await this.leerCatalogo(ev.tenantId); if (catalogo.length === 0) return;` (leerCatalogo = leerCatalogoSku, autodraft-wrapper.ts:55). Corte adicional sin log util. Ademas quote-proposal.producer.ts:26 (la evidencia citaba :25; la linea real del check es 26) `if (catalogo.length === 0) return err({ kind: 'catalogo_vacio' })`. Causa raiz correcta; unica correccion: la linea del return catalogo_vacio es 26, no 25.
- **Verificación:** Confirmado el corte en maybe-quote.service.ts:32. Nota menor: el err catalogo_vacio esta en quote-proposal.producer.ts:26, no :25.

### 29. [MEDIA] Dependencia 'pendiente' (cotizacionPendiente) inyectada pero NUNCA usada: no hay re-disparo ni dedup del link
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:19`
- **Causa raíz:** CONFIRMADO. maybe-quote.service.ts:19 declara `private readonly pendiente: (conversationId: string) => Promise<string | null>` y el wrapper le pasa cotizacionPendiente (autodraft-wrapper.ts:55, 3er arg). El cuerpo de ejecutar() (lineas 26-45) NUNCA referencia this.pendiente: no hay ruta 'ya hay cotizacion pendiente -> reenvia el /q/ existente'. quote-proposal-persist.ts:43-49 define cotizacionPendiente cuyo proposito documentado es 'RE-ENVIAR su link sin duplicar'. Consecuencia confirmada: no hay dedup ni rescate del contacto ya completo que no vuelve a escribir con intencion. Causa raiz exacta.
- **Verificación:** Confirmado: la dep se declara (linea 19) y se inyecta (autodraft-wrapper.ts:55) pero no se usa en ningun punto del metodo ejecutar (lineas 26-45).

### 30. [MEDIA] setConvRefs sobreescribe provider_conversation_id de una conversacion compartida (refs de envio mezcladas)
- **Ubicación:** `src/inbox/infrastructure/zernio-ingest.queries.ts:39-46`
- **Causa raíz:** ingest-zernio-message.use-case.ts:58 llama setConvRefs(convId, participant, providerConversationId, providerAccountId) en conversaciones ya existentes; setConvRefs (zernio-ingest.queries.ts:39-46) hace UPDATE directo por id de participant_external_id/provider_conversation_id/provider_account_id (escribe siempre que el valor no sea vacio). Si por el fallback de clave varios hilos colapsan en una conv 'de negocio' compartida, cada mensaje reescribe esos refs con los del ultimo hilo. ZernioAdapter.sendMessage enruta la entrega por provider_conversation_id (zernio.adapter.ts:27: POST /v1/inbox/conversations/{conversationId}/messages), no por 'to', asi que una conv con refs sobreescritas entregaria al hilo equivocado.
- **Verificación:** CONFIRMADO: update por id sin mas discriminante (queries:39-46, disparo en use-case:58) y enrutamiento de entrega por conversationId del proveedor (zernio.adapter.ts:25-27). Es PLAUSIBLE como causa de contaminacion de ENTREGA porque DEPENDE de la colision de convId del hallazgo de clave debil (convId incorpora channel pero no accountId). El comportamiento de codigo esta confirmado; la manifestacion requiere la colision.

### 31. [MEDIA] El prompt ordena prometer 'te la envio por aqui' pero el disparo real es otro camino; si no dispara, el modelo alucina 'el equipo la prepara'
- **Ubicación:** `src/cognition/application/agent-reasoner.ts:52`
- **Causa raíz:** La 'LEY ABSOLUTA DE DATOS' del system prompt (agent-reasoner.ts:52) instruye: cuando los datos esten completos y pidan cotizacion 'dile que se la envias por AQUI MISMO (por este chat)' y 'NO prometas... el equipo te contactara'. Pero el envio real de /q/ es un camino determinista SEPARADO del LLM: MaybeQuoteService (maybe-quote.service.ts:37-42) + makeEnviarCotizacion (cotizacion-sender.ts:25-39), gobernado por los flags y compuertas del hallazgo 4. Cuando ese camino no dispara (flag off, falta product_interest o modo no autonomo), el LLM queda sin accion real y tiende a producir justo lo prohibido ('se la enviaremos / el equipo la prepara'). Acoplamiento fragil entre la instruccion textual y un disparador externo al LLM.
- **Verificación:** CONFIRMADO: el prompt que ordena prometer envio por el chat y prohibe 'el equipo te contactara' esta en agent-reasoner.ts:52; el disparo real vive desacoplado en maybe-quote.service.ts:37-42 y cotizacion-sender.ts:25-39. El vinculo causal 'si no dispara, el modelo alucina' es un comportamiento de LLM (no determinista y no comprobable en el codigo), pero el desacople estructural que lo provoca esta confirmado por codigo.

### 32. [MEDIA] La captura trata el texto del agente (eco mal clasificado inbound) como DATO DURO del cliente y PISA display_name/phone/email/address
- **Ubicación:** `src/cognition/infrastructure/contact-data.persist.ts`
- **Causa raíz:** guardarDatosContacto confia ciegamente en que los DUROS provienen del cliente (overwrite incondicional) y leerHilo deriva autor por direction, sin validar que el mensaje no sea un eco de salida del propio agente.
- **Verificación:** CONFIRMADO el motor de overwrite; la activacion depende de findings 1/4. contact-data.persist.ts:16-19 aplican los DUROS con OVERWRITE incondicional: `if (duros.name) patch["display_name"]=duros.name` (16), phone (17), email (18), address (19) -> pisan el valor previo sin comparar. strategic-queries.ts:15 clasifica `from: (r.direction === "inbound" ? "cliente" : "negocio")`, es decir todo inbound se lee como 'cliente'. Por tanto un outbound del agente que regrese como eco mal clasificado inbound (finding 1) seria leido como declaracion del cliente y podria pisar campos; si cayo en la conversacion colapsada (finding 4) escribe datos de otro contacto. CAVEAT: la contaminacion efectiva es CONDICIONAL a que los findings 1 y 4 se materialicen con el payload real; el overwrite y la clasificacion por direction estan confirmados en codigo.

### 33. [MEDIA] Las personas (Zahra/Victor/etc.) NO se inyectan en la respuesta de chat: razonar() usa un prompt 'estatico' propio + context.brandVoice. Editar las personas NO cambia la muletilla.
- **Ubicación:** `src/cognition/application/generate-draft.handler.ts`
- **Causa raíz:** Confirmado. generate-draft.handler.ts:52 llama a reasoner.razonar() pasando solo AgentContext extendido: `{ ...contexto.value, contactProfile: cmd.contactProfile, tier: RESPONSE_TIER[cmd.personaSlug] ?? 'sonnet' }`. El personaSlug se usa UNICAMENTE para elegir el tier del modelo (RESPONSE_TIER[cmd.personaSlug]) y para persistir/clasificar (lineas 55-61), NO para cargar persona.*.systemPrompt. El texto del agente nace del bloque 'estatico' hardcodeado en agent-reasoner.ts:42-54 + context.brandVoice (fallback en agent-context.ts:30 'Profesional, cercano y honesto.'). Verificado por grep: los systemPrompt de las personas de cliente (persona.zahra.ts:40, thao, iris, eco, angel, kelsy) NO se referencian en el camino razonar->reply; el UNICO consumidor de un persona.systemPrompt via provider.completar es victor-chat.handler.ts:8,15 (PERSONA_VICTOR), que es el chat del DUENO, no la respuesta al cliente final. Buscar la muletilla en las personas seria parchar el lugar equivocado.
- **Verificación:** Confirmado citando codigo: generate-draft.handler.ts:52 (razonar recibe solo AgentContext+tier; personaSlug solo para RESPONSE_TIER); agent-reasoner.ts:42-54 (bloque estatico hardcodeado); agent-context.ts:30 (fallback brandVoice). grep confirma que persona.*.systemPrompt de clientes no se usa en razonar->reply; solo PERSONA_VICTOR se inyecta y es un camino separado (owner chat).

### 34. [MEDIA] can.quote (firma del dueno para cotizar) NUNCA se verifica: ni bloquea ni habilita el disparo (codigo muerto)
- **Ubicación:** `src/cognition/domain/autonomy-decision.ts:30`
- **Causa raíz:** razonAutoEnvio solo consulta c.can.reply; can.quote no esta cableado en ningun punto del flujo
- **Verificación:** CONFIRMADO. autonomy-decision.ts:30 `if (!c.can.reply)` es el unico uso de `can`; nunca lee c.can.quote. agents-config.ts:8 define quote y :22 lo defaultea a false. Grep de `can.quote` en todo src: SIN coincidencias, luego MaybeQuoteService no lo consulta. Es codigo muerto para el disparo: no bloquea (blocks_fire=false) pero tampoco respeta la firma del dueno.

### 35. [MEDIA] cotizacionPendiente (dedup 'una por conversacion') se inyecta pero NUNCA se llama: no gatea
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:19`
- **Causa raíz:** this.pendiente se inyecta en el constructor pero nunca se invoca en ejecutar; no hay dedup efectivo
- **Verificación:** CONFIRMADO. maybe-quote.service.ts:19 inyecta `private readonly pendiente`; grep de `this.pendiente` en todo src: SIN coincidencias, y ejecutar (26-45) no lo usa. El encabezado (:4) promete 'Una por conversacion (dedup)' pero no se cumple. cotizacionPendiente existe en quote-proposal-persist.ts:44 sin consumidor. blocks_fire=false. Consecuencia plausible: sin dedup, cada entrada que pase los gates re-crea/re-dispara (relevante para duplicados/loop).

### 36. [MEDIA] Gate de trigger: si intent.opportunity=false y el texto no matchea QUOTE_RE, el disparo se aborta SIN log (posible 'se la enviaremos')
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:29`
- **Causa raíz:** `if (!opportunity && !QUOTE_RE.test(ev.content)) return;` aborta en silencio cuando el follow-up no contiene palabras de cotizar y el clasificador no marco opportunity
- **Verificación:** CONFIRMADO. maybe-quote.service.ts:29 `if (!opportunity && !QUOTE_RE.test(ev.content)) return;` sin console.error. opportunity=intent.opportunity, pasado desde maybe-autodraft.service.ts:43 (clasificar) y :45 (postHook). QUOTE_RE en :13. Encaja con el sintoma 'el agente dice se la enviaremos': el LLM del chat promete cotizar pero este gate deterministico no se activa. blocks_fire=true. Nota: no estaba en la lista textual de la tarea pero es un gate propio del quote.

### 37. [BAJA] maybe-quote nunca llama al dedup `pendiente`: si /q/ llega a disparar, crea cotizacion+link NUEVO en cada inbound que matchee
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts`
- **Causa raíz:** Dependencia `pendiente` inyectada pero muerta: falta el guard `if (await this.pendiente(convId)) return/reenviar` al inicio de ejecutar.
- **Verificación:** CONFIRMADO. El puerto se inyecta en el constructor (maybe-quote.service.ts:19 `private readonly pendiente: (conversationId: string) => Promise<string | null>`) pero en el metodo ejecutar (lineas 26-45) NO hay ninguna llamada a this.pendiente: verifique el cuerpo completo y no existe comprobacion de cotizacion pendiente antes de producir+persistir+enviar. La cabecera promete 'Una por conversacion (dedup)' pero no se cumple; cotizacionPendiente SI existe (quote-proposal-persist.ts:44) pero queda sin usar. No es la causa del 'no dispara', es un defecto real del mismo flujo que duplicaria links.

### 38. [BAJA] catalogo vacio y prop no-worth abortan el disparo (uno en silencio), dependientes de datos del tenant
- **Ubicación:** `src/cognition/application/maybe-quote.service.ts:32`
- **Causa raíz:** catalogo.length===0 aborta sin log; !prop.ok||!prop.value.worth aborta (este con log)
- **Verificación:** CONFIRMADO. maybe-quote.service.ts:31 `const catalogo = await this.leerCatalogo(ev.tenantId)` y :32 `if (catalogo.length === 0) return;` SIN log (silencioso) si leerCatalogoSku no devuelve SKUs del tenant. :36 `if (!prop.ok || !prop.value.worth) { console.error('[quote] no-worth...'); return; }` aborta CON log si el productor LLM decide no-worth. Ambos impiden el disparo pese a que el chat ya respondio. blocks_fire=true.

---

## PENDIENTE DE VERIFICAR EN PROD (no accesible desde el repo)
- `QUOTE_PROPOSAL_ENABLED`, `AGENT_CAPTURE_ENABLED` (env Railway), inyección de `router`, `mode` del tenant (`tenants.agents_autodraft`, default `off`).
- Shape real del webhook Zernio en `message.sent`/eco (si llega sin `direction='outgoing'` o sin `participantId`).

## NO TOCAR (ley del dueño)
- El inbound de IG que ya funcionó (camino `participantId`). Los fixes de aislamiento son **guards aditivos**, no reescritura.
- El gate de **email obligatorio** (LEY ABSOLUTA).
- Las personas (Zahra/Victor/etc.) — la muletilla no vive ahí.
