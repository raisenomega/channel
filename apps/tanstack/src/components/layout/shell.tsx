import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { BottomNav, type NavItem } from "./bottom-nav";

const LINKS: NavItem[] = [
  { to: "/inbox", label: "nav.inbox" },
  { to: "/agent", label: "nav.agent" },
  { to: "/channels", label: "nav.channels" },
  { to: "/settings", label: "nav.settings" },
];

export function Shell() {
  const { language, theme, toggleTheme, setLanguage } = usePreferences();
  const { pathname } = useLocation();
  const nextLang = language === "es" ? "en" : "es";

  return (
    <div id="shell">
      <header className="nav">
        <div className="nav-brand">
          <span className="nav-mark">HB</span>
          <strong className="nav-name">
            HUB <small>by Raisen</small>
          </strong>
        </div>

        <nav className="nav-links" aria-label="Principal">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              aria-selected={pathname.startsWith(l.to)}
              className="nav-item"
            >
              {t(language, l.label)}
            </Link>
          ))}
        </nav>

        <div className="nav-tools">
          <button
            type="button"
            className="nav-tool"
            onClick={() => setLanguage(nextLang)}
            title={theme === "dark" ? "Idioma" : "Language"}
          >
            {language === "es" ? "EN" : "ES"}
          </button>
          <button
            type="button"
            className="nav-tool"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? "L" : "D"}
          </button>
        </div>
      </header>

      <main className="app">
        <Outlet />
      </main>

      <BottomNav items={LINKS} />
    </div>
  );
}
