import { useEffect } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/use-session";
import { AlertBadge } from "@/components/ui/alert-badge";
import { useMarkRead } from "@/lib/alerts/alerts-context";
import { BottomNav } from "./bottom-nav";
import { LINKS } from "./nav-items";
import { LogoutButton } from "./logout-button";

// Header CRM: ruta -> clave de alerta. Al entrar a la ruta se marca visto (badge a 0).
const CRM_KEY: Record<string, string> = { "/orders": "crm:orders", "/payments": "crm:payments", "/quotes": "crm:quotes" };

// Z-3: el nav del header es PERMANENTE en toda ruta de app. Solo se oculta en /login y en las
// paginas-popup de OAuth (return/callback). NO depende de la sesion (useSession es reactivo y flaky:
// onAuthStateChange podia emitir null en un refresh de token/offline -> el nav desaparecia = "header
// blanco, user atrapado"). La ruta es estable y siempre existe -> chips nunca desaparecen.
const SIN_NAV = ["/login", "/zernio/return", "/channels/zernio/callback", "/q", "/i"];

export function Shell() {
  const { language, theme, toggleTheme, setLanguage } = usePreferences();
  const { pathname } = useLocation();
  const nextLang = language === "es" ? "en" : "es";
  useSession(); // D-51: efecto lateral — mantiene hub.session sincronizada (mirror onAuthStateChange) para apiFetch
  const markRead = useMarkRead();
  useEffect(() => { const k = CRM_KEY[pathname]; if (k) markRead(k); }, [pathname, markRead]);
  const showChrome = !SIN_NAV.some((p) => pathname === p || pathname.startsWith(p + "/"));

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

        {showChrome ? (
          <>
            <nav className="nav-links" aria-label="Principal">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} aria-selected={pathname.startsWith(l.to)} className="nav-item">
                  {t(language, l.label)}
                  <AlertBadge keyName={CRM_KEY[l.to]} />
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

      {showChrome ? <BottomNav items={LINKS} /> : null}
    </div>
  );
}
