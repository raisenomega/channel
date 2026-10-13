/**
 * HUB by Raisen — Vista de onboarding (crear tu tenant)
 * Formulario OMEGA para que el usuario cree su empresa.
 */
import { OnboardingData } from "./onboarding-client.ts";

export interface OnboardingCallbacks {
  readonly onCompletado: () => void;
}

export function renderOnboarding(): string {
  return `<div class="login-wrap">
    <form class="login-card glass" data-onboarding-form novalidate>
      <div class="login-brand">
        <span class="nav-mark" aria-hidden="true">HB</span>
        <div>
          <h1 class="login-title">Bienvenido</h1>
          <p class="login-sub">Crea tu espacio en HUB</p>
        </div>
      </div>

      <label class="login-field">
        <span class="login-label">Nombre de tu empresa</span>
        <input class="login-input" name="tenantName" type="text" required autocomplete="organization" placeholder="Sabor Criollo" />
      </label>

      <label class="login-field">
        <span class="login-label">Identificador (slug)</span>
        <input class="login-input" name="slug" type="text" required placeholder="sabor-criollo" />
      </label>

      <p class="login-error text-danger" data-onboarding-error role="alert"></p>

      <button type="submit" class="login-submit tap" data-onboarding-submit>Crear mi espacio</button>
      <p class="login-hint">Quedarás como owner del tenant y podrás invitar a tu equipo luego.</p>
    </form>
  </div>`;
}

export function montarOnboarding(root: HTMLElement, submit: (d: OnboardingData) => Promise<string | null>): void {
  root.innerHTML = renderOnboarding();
  const form = root.querySelector<HTMLFormElement>("[data-onboarding-form]");
  const errEl = root.querySelector<HTMLElement>("[data-onboarding-error]");
  const btn = root.querySelector<HTMLButtonElement>("[data-onboarding-submit]");
  if (!form || !errEl || !btn) return;

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    errEl.textContent = "";
    const fd = new FormData(form);
    const tenantName = String(fd.get("tenantName") ?? "").trim();
    const slug = String(fd.get("slug") ?? "").trim()
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!tenantName || !slug) {
      errEl.textContent = "Completa nombre e identificador";
      return;
    }
    btn.disabled = true;
    btn.textContent = "Creando...";
    const error = await submit({ tenantName, slug, plan: "lite_starter" });
    btn.disabled = false;
    btn.textContent = "Crear mi espacio";
    if (error) {
      errEl.textContent = error;
    }
  });
}