/**
 * HUB by Raisen — Vista de Login / Registro (identidad OMEGA)
 * Renderiza el formulario y delega al auth-client. Sin emojis.
 */
import { auth, SessionUsuario, AuthError } from "./auth-client.ts";

export interface LoginCallbacks {
  readonly onAutenticado: (session: SessionUsuario) => void;
}

export function renderLogin(cb: LoginCallbacks): string {
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
        <input class="login-input" name="password" type="password" required autocomplete="current-password" placeholder="••••••••" />
      </label>

      <p class="login-error text-danger" data-login-error role="alert"></p>

      <button type="submit" class="login-submit tap" data-login-submit>Continuar</button>

      <p class="login-hint">Con el correo y la contrasena del tenant. Sin emojis, solo SVG.</p>
    </form>
  </div>`;
}

export function montarLogin(container: HTMLElement, cb: LoginCallbacks): void {
  container.innerHTML = renderLogin(cb);

  const form = container.querySelector<HTMLFormElement>("[data-login-form]");
  const errEl = container.querySelector<HTMLElement>("[data-login-error]");
  const submit = container.querySelector<HTMLButtonElement>("[data-login-submit]");
  if (!form || !errEl || !submit) return;

  let modo: "in" | "up" = "in";

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