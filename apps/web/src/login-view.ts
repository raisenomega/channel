/**
 * HUB by Raisen — Vista de Login / Registro (identidad OMEGA).
 * Markup y mensajes en submódulos (C4 ≤75).
 */
import { auth, type SessionUsuario } from "./auth-client.ts";
import { renderLogin } from "./login-view-html.ts";
import { mensajeDeError } from "./login-view-messages.ts";

export { renderLogin } from "./login-view-html.ts";

export interface LoginCallbacks {
  readonly onAutenticado: (session: SessionUsuario) => void;
}

export function montarLogin(container: HTMLElement, cb: LoginCallbacks): void {
  container.innerHTML = renderLogin();

  const form = container.querySelector<HTMLFormElement>("[data-login-form]");
  const errEl = container.querySelector<HTMLElement>("[data-login-error]");
  const submit = container.querySelector<HTMLButtonElement>("[data-login-submit]");
  if (!form || !errEl || !submit) return;

  let modo: "in" | "up" = "in";

  const passInput = container.querySelector<HTMLInputElement>("[data-password-input]");
  const passToggle = container.querySelector<HTMLButtonElement>("[data-password-toggle]");
  passToggle?.addEventListener("click", () => {
    if (!passInput) return;
    const esVisible = passInput.type === "text";
    passInput.type = esVisible ? "password" : "text";
    passToggle.title = esVisible ? "Mostrar contrasena" : "Ocultar contrasena";
    passInput.focus();
  });

  container.querySelectorAll<HTMLButtonElement>("[data-login-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      modo = btn.dataset.loginTab === "up" ? "up" : "in";
      container.querySelectorAll("[data-login-tab]").forEach((b) => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll("[data-login-up-show]").forEach((f) => {
        (f as HTMLElement).style.display = modo === "up" ? "flex" : "none";
      });
      submit.textContent = modo === "up" ? "Crear cuenta" : "Continuar";
      errEl.textContent = "";
    });
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    errEl.textContent = "";
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    if (!email || !password) {
      errEl.textContent = "Completa email y contrasena";
      return;
    }
    submit.disabled = true;
    submit.textContent = "Procesando...";
    const res = modo === "in" ? await auth.iniciar(email, password) : await auth.registrar(email, password);
    submit.disabled = false;
    submit.textContent = modo === "up" ? "Crear cuenta" : "Continuar";
    if (res.ok) {
      auth.guardar(res.value);
      cb.onAutenticado(res.value);
    } else {
      errEl.textContent = mensajeDeError(res.error);
    }
  });
}