/**
 * HUB by Raisen — readBody acotado: rechaza body > 1MB (body_too_large) y resuelve el body normal. Blinda
 * el servidor contra OOM por cuerpo gigante / slow-loris.
 */
import { EventEmitter } from "node:events";
import { expect, test } from "vitest";
import { readBody } from "../../../src/server/server-helpers.ts";

test("RB-01 rechaza body mayor a 1MB", async () => {
  const req = new EventEmitter();
  const p = readBody(req as never);
  req.emit("data", Buffer.alloc(1_048_577)); // 1MB + 1
  await expect(p).rejects.toThrow("body_too_large");
});

test("RB-02 resuelve el body normal", async () => {
  const req = new EventEmitter();
  const p = readBody(req as never);
  req.emit("data", Buffer.from("hola"));
  req.emit("end");
  expect(await p).toBe("hola");
});

test("RB-03 rechaza si el request se aborta", async () => {
  const req = new EventEmitter();
  const p = readBody(req as never);
  req.emit("aborted");
  await expect(p).rejects.toThrow("body_aborted");
});
