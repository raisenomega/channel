/**
 * HUB by Raisen — D: reconexion coherente tras resolver. El agente dispara UN borrador al cliente solo si
 * la consulta tiene cliente asociado y destinatario. Fire-and-forget: nunca lanza.
 */
import { expect, test, vi } from "vitest";
import { reconectarCliente, type ReconexionPorts } from "../../../src/cognition/application/reconnect-after-resolve.ts";

function ports(over: Partial<ReconexionPorts> = {}): { p: ReconexionPorts; disparos: unknown[] } {
  const disparos: unknown[] = [];
  const p: ReconexionPorts = {
    leerThread: async () => ({ conversationId: "cv1", agentSlug: "zahra", tipo: "consulta" }),
    datos: async () => ({ from: "+1787", channel: "whatsapp", contactId: "ct1", content: "se puede el mismo dia?" }),
    disparar: (ev) => { disparos.push(ev); },
    ...over,
  };
  return { p, disparos };
}

test("D-01 consulta con cliente + destinatario -> dispara borrador con persona del agente", async () => {
  const { p, disparos } = ports();
  await reconectarCliente(p, "t1", "c1");
  expect(disparos).toHaveLength(1);
  expect(disparos[0]).toMatchObject({ tenantId: "t1", conversationId: "cv1", from: "+1787", channel: "whatsapp", content: "se puede el mismo dia?", persona: "zahra", origen: "consulta" });
});

test("D-02 consulta SIN conversationId (duda general) -> NO dispara", async () => {
  const { p, disparos } = ports({ leerThread: async () => ({ conversationId: "", agentSlug: "iris", tipo: "escalada" }) });
  await reconectarCliente(p, "t1", "c1");
  expect(disparos).toHaveLength(0);
});

test("D-03 sin destinatario (from vacio) -> NO dispara", async () => {
  const { p, disparos } = ports({ datos: async () => ({ from: "", channel: "whatsapp", contactId: "ct1", content: "x" }) });
  await reconectarCliente(p, "t1", "c1");
  expect(disparos).toHaveLength(0);
});

test("D-04 content vacio -> fallback honesto (el cliente quedo esperando)", async () => {
  const { p, disparos } = ports({ datos: async () => ({ from: "+1", channel: "whatsapp", contactId: "ct1", content: "" }) });
  await reconectarCliente(p, "t1", "c1");
  expect((disparos[0] as { content: string }).content).toContain("esperando");
});

test("D-05 si datos lanza -> fire-and-forget, no propaga", async () => {
  const { p, disparos } = ports({ datos: async () => { throw new Error("db down"); } });
  await expect(reconectarCliente(p, "t1", "c1")).resolves.toBeUndefined();
  expect(disparos).toHaveLength(0);
});
