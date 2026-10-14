/**
 * HUB by Raisen — Markup del formulario de login/registro.
 */
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