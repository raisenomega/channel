/**
 * HUB by Raisen — Hotfix P bloque 3: fetchers del inbox del canal.
 * Bug 2: messages usa content_type + sender_user_id (no message_type/sender_id) -> no 400 -> trae filas.
 * Bug 1: conversations embebe contacts(display_name) -> nombre REAL en la lista (no "Cliente <id>").
 */
import { afterEach, expect, test, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabaseRestBase: () => "https://x.supabase.co/rest/v1",
  supabaseAuthHeaders: () => ({ authorization: "Bearer t" }),
}));
import { fetchChannelConversations, fetchMessagesForConversation } from "@/components/dashboard/channel/channel-fetchers";

const ORIG = globalThis.fetch;
afterEach(() => { globalThis.fetch = ORIG; });

test("Bug 2: messages pide content_type + sender_user_id (no message_type) y mapea content/messageType", async () => {
  const urls: string[] = [];
  globalThis.fetch = vi.fn(async (u: string) => { urls.push(u); return new Response(JSON.stringify([
    { id: "m1", conversation_id: "c1", sender_type: "contact", sender_user_id: null, direction: "inbound", content: "Hola", content_type: "text", created_at: "2026-01-01" },
  ]), { status: 200 }); }) as never;
  const r = await fetchMessagesForConversation("c1");
  expect(urls[0]).toContain("content_type");
  expect(urls[0]).toContain("sender_user_id");
  expect(urls[0]).not.toContain("message_type");
  expect(r[0]).toMatchObject({ id: "m1", content: "Hola", messageType: "text" });
});

test("Bug 1: conversations embebe contacts(display_name) -> nombre real disponible", async () => {
  const urls: string[] = [];
  globalThis.fetch = vi.fn(async (u: string) => { urls.push(u); return new Response(JSON.stringify([
    { id: "c1", contact_id: "ct1", primary_channel: "instagram", subject: "hi", last_message_at: "2026-01-01", contacts: { display_name: "Johanny" } },
  ]), { status: 200 }); }) as never;
  const r = await fetchChannelConversations("instagram");
  expect(urls[0]).toContain("contacts(display_name)");
  expect(r[0].contacts?.display_name).toBe("Johanny");
});
