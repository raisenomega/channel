/**
 * HUB by Raisen — Conversacion del CLIENTE (scope cliente, ya funcionando): chat + ficha 360 +
 * tickets resueltos + dialogo de resolucion. Extraido de la ruta para que el dispatcher elija scope
 * sin romper hooks. C4 <=75.
 */
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import type { Contact360 } from "@/lib/types";
import { fetchMessages } from "./conversation-messages";
import { resolveContact360 } from "./conversation-resolver";
import { enviarMensajeConversacion } from "./conversation-send";
import { useResolve } from "./use-resolve";
import { ChatPanel } from "./conversation-chat-panel";
import { ContactPanel } from "./conversation-contact-panel";
import { ResueltosPanel } from "./resueltos-panel";
import { ResolveDialog } from "./resolve-dialog";

export function ClienteConversation({ conversationId, language, onBack, onOpen }: {
  conversationId: string;
  language: Idioma;
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const enviandoRef = useRef(false); // guard SINCRONO: dos Enter rapidos no pasan el estado async -> no duplica
  const [contact360, setContact360] = useState<Contact360 | null | "loading">("loading");
  const { dialogOpen, setDialogOpen, saving, onEstado, guardar } = useResolve(conversationId);
  const { data: messages, refetch: refetchMessages } = useQuery({ queryKey: ["messages", conversationId], queryFn: () => fetchMessages(conversationId), staleTime: 10_000 });

  useEffect(() => { setContact360("loading"); void resolveContact360(conversationId).then((c) => setContact360(c ?? null)); }, [conversationId]);

  async function handleSend() {
    const text = composerText.trim();
    if (!text || enviandoRef.current) return;
    enviandoRef.current = true; setSending(true);
    const ok = await enviarMensajeConversacion(conversationId, text);
    if (ok) { setComposerText(""); void refetchMessages(); }
    setSending(false); enviandoRef.current = false;
  }

  const c360 = contact360 !== "loading" && contact360 ? contact360 : null;
  return (
    <>
      <div className="grid gap-4 mt-4 lg:grid-cols-3">
        <ChatPanel conversationId={conversationId} contactName={c360?.displayName} contactPhone={c360?.primaryPhone}
          messages={messages ?? []} language={language} onBack={onBack}
          composerText={composerText} setComposerText={setComposerText} onSend={handleSend} sending={sending}
          onEstado={onEstado} resolving={saving} />
        <ContactPanel contact={contact360} language={language} />
        <ResueltosPanel language={language} onOpen={onOpen} />
      </div>
      <ResolveDialog open={dialogOpen} language={language} saving={saving} onGuardar={guardar} onClose={() => setDialogOpen(false)} />
    </>
  );
}
