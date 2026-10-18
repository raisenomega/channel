import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { readLocalSession } from "@/lib/auth";
import { BottomNav } from "./bottom-nav";
import { LINKS } from "./nav-items";
import { LogoutButton } from "./logout-button";

export function Shell() {
  const { language, theme, toggleTheme, setLanguage } = usePreferences();
  const { pathname } = useLocation();
  const nextLang = language === "es" ? "en" : "es";
  const loggedIn = readLocalSession() !== null; // M-2: sin sesion (ej. /login) solo logo

  return (
    <div id="shell">
      <div className="bg-orb" aria-hidden="true" />
      <header className="nav">
        <div className="nav-brand">
          <span className="nav-mark">HB</span>
          <strong className="nav-name">
            HUB <small>by Raisen</small>
          </strong>
        </div>

        {loggedIn ? (
          <>
            <nav className="nav-links" aria-label="Principal">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} aria-selected={pathname.startsWith(l.to)} className="nav-item">
                  {t(language, l.label)}
                </Link>
              ))}
            </nav>
            <div className="nav-tools">
              <button type="button" className="nav-tool" onClick={() => setLanguage(nextLang)}
                title={theme === "dark" ? "Idioma" : "Language"}>
                {language === "es" ? "EN" : "ES"}
              </button>
              <button type="button" className="nav-tool" onClick={toggleTheme}
                aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}>
                {theme === "dark" ? "L" : "D"}
              </button>
              <LogoutButton label={t(language, "nav.logout")} />
            </div>
          </>
        ) : null}
      </header>

      <main className="app">
        <Outlet />
      </main>

      {loggedIn ? <BottomNav items={LINKS} /> : null}
    </div>
  );
}
