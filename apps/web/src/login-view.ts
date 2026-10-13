/**
 * HUB by Raisen — Vista de Login / Registro (identidad OMEGA)
 * Renderiza el formulario y delega al auth-client. Sin emojis.
 */
import { auth, SessionUsuario, AuthError } from "./auth-client.ts";

export interface LoginCallbacks {
  readonly onAutenticado: (session: SessionUsuario) => void;
}

export function renderLogin(): string {
  return `<div class="login-wrap">
    <form class="login-card glass" data-login-form novalidate>
      <div class="login-brand">
        <span class="nav-mark" aria-hidden="true">HB</span>
        <div>
          <h1 class="login-title">HUB<small>by Raisen</small></h1>
          <p class="login-sub">FORTRESS. by Raisen</p>
        </div>
      </div>

      <div class="login-tabs" role="tablist">
        <button type="button" class="login-tab is-active" data-login-tab="in">Entrar</button>
        <button type="button" class="login-tab" data-login-tab="up">Registrarse</button>
      </div>

      <label class="login-field">
        <span class="login-label">Email</span>
        <input class="login-input" name="email" type="email" required autocomplete="email" placeholder="tucorreo@empresa.com" />
      </label>

      <label class="login-field" data-login-up-show>
        <span class="login-label">Nombre</span>
        <input class="login-input" name="fullName" type="text" autocomplete="name" placeholder="Tu nombre" />
      </label>

      <label class="login-field">
        <span class="login-label">Contrasena</span>
        <div class="password-wrap">
          <input class="login-input password-input" name="password" type="password" required autocomplete="current-password" placeholder="••••••••" data-password-input />
          <button type="button" class="password-toggle" data-password-toggle aria-label="Mostrar contrasena" title="Mostrar contrasena">
            <svg viewBox="0 0 24 12" width="18" height="9" fill="currentColor">
              <circle cx="6" cy="6" r="3.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
              <circle cx="18" cy="6" r="3.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
              <line x1="7" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
        </div>
      </label>

      <p class="login-error text-danger" data-login-error role="alert"></p>

      <button type="submit" class="login-submit tap" data-login-submit>Continuar</button>

      <p class="login-hint">Con el correo y la contrasena del tenant. Sin emojis, solo SVG.</p>
    </form>
    <footer class="login-footer">FORTRESS. by Raisen</footer>
  </div>`;
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

function mensajeDeError(e: AuthError): string {
  switch (e.kind) {
    case "correo_no_confirmado":
      return "Revisa tu correo y confirma la cuenta antes de entrar.";
    case "email_existe":
      return "Ese email ya esta registrado. Inicia sesion.";
    case "credenciales_invalidas":
      return "Credenciales invalidas. Verifica email y contrasena.";
    case "config_incompleta":
      return "Configuracion de autenticacion incompleta.";
    case "red":
      return "Error de conexion. Intenta de nuevo.";
    default:
      return "Error al autenticar. Intenta de nuevo.";
  }
}