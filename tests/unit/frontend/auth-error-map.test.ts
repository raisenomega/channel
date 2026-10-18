/**
 * HUB by Raisen — M-4 (A-M-4): errores diferenciados signup vs login.
 */
import { expect, test } from "vitest";
import { mapSignupError, mapLoginError } from "../../../apps/tanstack/src/lib/auth-error-map";

test("A-M-4 signup con correo ya registrado -> mensaje de 'ya tiene cuenta'", () => {
  expect(mapSignupError("User already registered")).toBe("Este correo ya tiene cuenta. Prueba iniciar sesión.");
});

test("A-M-4 login con credenciales invalidas -> 'incorrectos'", () => {
  expect(mapLoginError("Invalid login credentials")).toBe("Correo o contraseña incorrectos.");
});

test("A-M-4 login y signup NO comparten el mismo mensaje generico", () => {
  const msg = "Invalid login credentials";
  expect(mapLoginError(msg)).not.toBe(mapSignupError(msg));
});
