/**
 * HUB by Raisen — Compone el servicio de autodraft (S6/S7): flag+config + productor (Anthropic+contexto) +
 * clasificador. Si se pasa un ChannelRouter, habilita el AUTO-ENVIO del modo autonomo (aprobar+enviar) + el
 * contador del tope diario. Sin router -> solo genera borradores (seguro). C4 <=75.
 */
import { MaybeAutodraftService } from "../cognition/application/maybe-autodraft.service.ts";
import { IntentClassifier } from "../cognition/application/intent-classifier.ts";
import { GenerateDraftHandler } from "../cognition/application/generate-draft.handler.ts";
import { perfilContacto } from "../cognition/infrastructure/contact-profile.query.ts";
import { calificarContacto } from "../cognition/infrastructure/contact-qualify.repo.ts";
import { AgentContextService } from "../cognition/application/agent-context.ts";
import { AgentContextSourceSupabase } from "../cognition/infrastructure/agent-context-source.supabase.ts";
import { AgentReasoner } from "../cognition/application/agent-reasoner.ts";
import { PersistDraftHandler } from "../cognition/application/persist-draft.handler.ts";
import { AgentDraftsRepository } from "../cognition/infrastructure/agent-drafts.repository.ts";
import { AnthropicAdapter } from "../cognition/infrastructure/anthropic.adapter.ts";
import { AutodraftFlagSupabase, SentCounterSupabase } from "../cognition/infrastructure/autodraft-flag.repo.ts";
import { ApproveDraftHandler } from "../cognition/application/approve-draft.handler.ts";
import { SendApprovedDraftService } from "../cognition/application/send-approved-draft.service.ts";
import { ConversationRepositorySupabase } from "../inbox/infrastructure/conversation.repository.supabase.ts";
import type { ChannelRouter } from "../channels/application/channel.router.ts";
import type { AgentDraft } from "../cognition/domain/agent-draft.entity.ts";
import type { ChannelType } from "../shared/domain/types.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";
import { QuoteProposalProducer } from "../cognition/application/quote-proposal.producer.ts";
import { MaybeQuoteService } from "../cognition/application/maybe-quote.service.ts";
import { datosBaseCompletos } from "../cognition/infrastructure/contact-completeness.query.ts";
import { makeEnviarCotizacion } from "../cognition/infrastructure/cotizacion-sender.ts";
import { leerCatalogoSku } from "../cognition/infrastructure/sku-catalog.query.ts";
import { persistirPropuestaCotizacion, cotizacionPendiente } from "../cognition/infrastructure/quote-proposal-persist.ts";
import type { AutodraftEvent } from "../cognition/application/maybe-autodraft.service.ts";
import { ContactDataProducer } from "../cognition/application/contact-data.producer.ts";
import { MaybeCaptureService } from "../cognition/application/maybe-capture.service.ts";
import { leerHilo } from "../cognition/infrastructure/strategic-queries.ts";
import { guardarDatosContacto } from "../cognition/infrastructure/contact-data.persist.ts";
import { presenciaSaliente } from "../cognition/infrastructure/presencia-saliente.query.ts";

// approved_by es UUID (migr 039, sin FK); "autonomous" NO es UUID -> el PATCH daba 400 y el approve fallaba
// en silencio -> el draft quedaba en status=draft -> el send daba STATUS_NOT_APPROVED. Nil UUID = aprobador autonomo.
const AUTONOMOUS_APPROVER = "00000000-0000-0000-0000-000000000000";

export function buildAutodraft(router?: ChannelRouter): MaybeAutodraftService {
  const adapter = new AnthropicAdapter(getEnv("ANTHROPIC_API_KEY") ?? "");
  const repo = new AgentDraftsRepository();
  const generate = new GenerateDraftHandler(new AgentContextService(new AgentContextSourceSupabase()), new AgentReasoner(adapter), new PersistDraftHandler(repo));
  const autoSend = router ? {
    enviar: async (d: AgentDraft, to: string, ch: string): Promise<boolean> => {
      const ap = await new ApproveDraftHandler(repo).ejecutar(d.id, d.tenantId, AUTONOMOUS_APPROVER, undefined);
      if (!ap.ok) { console.error(`[autodraft-send] approve FALLO draft=${d.id}`, ap.error); return false; }
      const r = await new SendApprovedDraftService(repo, router, new ConversationRepositorySupabase()).ejecutar(d.id, to, ch as ChannelType);
      if (!r.ok) { console.error(`[autodraft-send] send FALLO draft=${d.id} to=${to} ch=${ch}`, r.error); return false; }
      console.error(`[autodraft-send] OK draft=${d.id} to=${to}`); return true;
    },
  } : undefined;
  const cap = (getEnv("AGENT_CAPTURE_ENABLED") ?? "") === "true" ? new MaybeCaptureService(new ContactDataProducer(adapter), leerHilo, guardarDatosContacto, datosBaseCompletos) : null;
  const q = (getEnv("QUOTE_PROPOSAL_ENABLED") ?? "") === "true" ? new MaybeQuoteService(new QuoteProposalProducer(adapter), leerCatalogoSku, cotizacionPendiente, persistirPropuestaCotizacion, leerHilo, datosBaseCompletos, router ? makeEnviarCotizacion(router) : undefined) : null;
  const postHook = (cap || q) ? async (ev: AutodraftEvent, opp: boolean, mode: string): Promise<string | null> => { if (cap) await cap.ejecutar(ev); return q ? await q.ejecutar(ev, opp, mode) : null; } : undefined;
  // B (coherencia): gate de presencia humana + debounce IA. Kill-switch por env (=off lo apaga sin redeploy). Fail-open en la query.
  const gateOn = (getEnv("AUTODRAFT_COHERENCE_GATE") ?? "on") !== "off";
  const vHum = Number(getEnv("AUTODRAFT_HUMAN_WINDOW_MIN") ?? "10") * 60000;
  const vIa = Number(getEnv("AUTODRAFT_IA_DEBOUNCE_SEC") ?? "45") * 1000;
  const presencia = gateOn && router ? (convId: string) => presenciaSaliente(convId, vHum, vIa) : undefined;
  return new MaybeAutodraftService(new AutodraftFlagSupabase(), generate, new IntentClassifier(adapter), autoSend, router ? new SentCounterSupabase() : undefined, perfilContacto, calificarContacto, postHook, presencia);
}
