/**
 * HUB by Raisen — Encriptacion XChaCha20-Poly1305 para tokens de Meta.
 * Usa @noble/ciphers (auditable, sin dependencias nativas).
 * Clave maestra de 32 bytes desde META_TOKEN_ENCRYPTION_KEY (hex, 64 chars).
 * C4 ≤75 lineas.
 */
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { randomBytes, bytesToHex, hexToBytes } from "@noble/ciphers/utils.js";
import { Result, err, ok } from "../../shared/domain/result.ts";

const KEY_HEX_LENGTH = 64;

export type EncryptionError =
  | { readonly kind: "clave_no_configurada" }
  | { readonly kind: "clave_invalida"; readonly cause: string }
  | { readonly kind: "fallo_encriptacion"; readonly cause: string };

function obtenerClave(): Result<Uint8Array, EncryptionError> {
  const hex = process.env["META_TOKEN_ENCRYPTION_KEY"] ?? "";
  if (!hex) return err({ kind: "clave_no_configurada" });
  if (hex.length !== KEY_HEX_LENGTH) {
    return err({ kind: "clave_invalida", cause: `longitud_${hex.length}_esperado_${KEY_HEX_LENGTH}` });
  }
  try {
    return ok(hexToBytes(hex));
  } catch (e) {
    return err({ kind: "clave_invalida", cause: String(e) });
  }
}

export interface TokenEncriptado {
  readonly nonce: string;    // hex, 48 chars (24 bytes)
  readonly ciphertext: string; // hex
}

export function encriptarToken(token: string): Result<TokenEncriptado, EncryptionError> {
  const keyRes = obtenerClave();
  if (!keyRes.ok) return keyRes;

  try {
    const nonce = randomBytes(24);
    const aad = new TextEncoder().encode("hub-meta-token-v1");
    const cipher = xchacha20poly1305(keyRes.value, nonce, aad);
    const plaintext = new TextEncoder().encode(token);
    const encrypted = cipher.encrypt(plaintext);

    return ok({
      nonce: bytesToHex(nonce),
      ciphertext: bytesToHex(encrypted),
    });
  } catch (e) {
    return err({ kind: "fallo_encriptacion", cause: String(e) });
  }
}

export function desencriptarToken(encriptado: TokenEncriptado): Result<string, EncryptionError> {
  const keyRes = obtenerClave();
  if (!keyRes.ok) return keyRes;

  try {
    const nonce = hexToBytes(encriptado.nonce);
    const ciphertext = hexToBytes(encriptado.ciphertext);
    const aad = new TextEncoder().encode("hub-meta-token-v1");
    const cipher = xchacha20poly1305(keyRes.value, nonce, aad);
    const decrypted = cipher.decrypt(ciphertext);

    return ok(new TextDecoder().decode(decrypted));
  } catch (e) {
    return err({ kind: "fallo_encriptacion", cause: String(e) });
  }
}