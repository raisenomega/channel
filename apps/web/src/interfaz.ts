/**
 * HUB by Raisen — Controles de interfaz (tema claro/oscuro + idioma ES/EN)
 * Cablea los toggles del shell y persiste la preferencia.
 */
export type Idioma = "es" | "en";
export type Tema = "dark" | "light";

const KEY_TEMA = "hub.tema";
const KEY_IDIOMA = "hub.idioma";

function leerTema(): Tema {
  try {
    const v = localStorage.getItem(KEY_TEMA);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function leerIdioma(): Idioma {
  try {
    const v = localStorage.getItem(KEY_IDIOMA);
    return v === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

function aplicarTema(tema: Tema): void {
  const html = document.documentElement;
  html.setAttribute("data-theme", tema);
  try {
    localStorage.setItem(KEY_TEMA, tema);
  } catch {
    // ignora
  }
}

export function toggleTema(): Tema {
  const actual = leerTema();
  const nuevo = actual === "dark" ? "light" : "dark";
  aplicarTema(nuevo);
  return nuevo;
}

export function toggleIdioma(): Idioma {
  const actual = leerIdioma();
  const nuevo = actual === "es" ? "en" : "es";
  try {
    localStorage.setItem(KEY_IDIOMA, nuevo);
  } catch {
    // ignora
  }
  return nuevo;
}

export function iniciarControlesShell(): void {
  // Tema inicial
  aplicarTema(leerTema());

  const themeBtn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  themeBtn?.addEventListener("click", () => {
    toggleTema();
  });

  const langBtn = document.querySelector<HTMLButtonElement>("[data-lang-toggle]");
  const langLabel = document.querySelector<HTMLElement>("[data-lang-label]");
  langBtn?.addEventListener("click", () => {
    const idioma = toggleIdioma();
    if (langLabel) langLabel.textContent = idioma.toUpperCase();
  });
  if (langLabel) langLabel.textContent = leerIdioma().toUpperCase();
}