import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Idioma } from "@/lib/i18n";

export type Theme = "dark" | "light";

interface Preferences {
  theme: Theme;
  language: Idioma;
  toggleTheme: () => void;
  setLanguage: (l: Idioma) => void;
}

const Ctx = createContext<Preferences | null>(null);

function initialTheme(): Theme {
  return (localStorage.getItem("hub.theme") as Theme) || "dark";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [language, setLanguage] = useState<Idioma>((localStorage.getItem("hub.lang") as Idioma) || "es");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("hub.theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("hub.lang", language);
  }, [language]);

  const value: Preferences = {
    theme,
    language,
    toggleTheme: () => setTheme((p) => (p === "dark" ? "light" : "dark")),
    setLanguage,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePreferences(): Preferences {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePreferences must be inside PreferencesProvider");
  return ctx;
}
