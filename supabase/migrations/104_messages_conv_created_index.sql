-- 104 — Indice para abrir hilos SIN seq-scan (performance a escala). Las lecturas calientes del inbox y del
-- agente filtran messages por conversation_id + ORDER BY created_at DESC (buscarPorConversacion, leerHilo),
-- pero el unico indice era idx_messages_conv (tenant_id, conversation_id, created_at): con tenant_id como
-- columna LIDER, una consulta que NO fija tenant_id no puede usarlo -> seq-scan sobre la particion gigante.
-- A escala eso lleva abrir un hilo de ~1ms a cientos de ms/segundos, por cada apertura y cada draft.
-- Este indice (conversation_id, created_at DESC) sirve esas consultas directo (index range scan + orden).
-- NOTA: el aislamiento por tenant (RLS / tenant_id en el WHERE) es trabajo aparte (audit #9); esto es SOLO perf.
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON public.messages (conversation_id, created_at DESC);
