/**
 * HUB by Raisen — Fabrica de DraftsDeps para el servidor (Hotfix H-2).
 * Centraliza instanciacion de handlers de drafts. C4 <=75.
 */
import { ApproveDraftHandler } from "../cognition/application/approve-draft.handler.ts";
import { RejectDraftHandler } from "../cognition/application/reject-draft.handler.ts";
import { SendApprovedDraftService } from "../cognition/application/send-approved-draft.service.ts";
import { WasCorrectFeedbackHandler } from "../cognition/application/was-correct-feedback.handler.ts";
import { AgentDraftsRepository } from "../cognition/infrastructure/agent-drafts.repository.ts";
import { ChannelRouter } from "../channels/application/channel.router.ts";
import type { ChannelAdapter } from "../channels/domain/channel.adapter.ts";
import type { DraftsDeps } from "../cognition/presentation/drafts.routes.ts";

export function buildDraftsDeps(router: ChannelRouter): DraftsDeps {
  const repo = new AgentDraftsRepository();
  return {
    approve: new ApproveDraftHandler(repo),
    reject: new RejectDraftHandler(repo),
    send: new SendApprovedDraftService(repo, {
      provider: "dev", supportedChannels: [], sendMessage: async () => ({ ok: true as const, value: undefined }),
      sendTemplate: async () => ({ ok: true as const, value: undefined }), parseInboundWebhook: () => ({ ok: true as const, value: Object.freeze([]) }),
      verifyWebhook: async () => true, ping: async () => ({ ok: true as const, value: true }),
    } as ChannelAdapter),
    feedback: new WasCorrectFeedbackHandler(repo),
    repo,
  };
}