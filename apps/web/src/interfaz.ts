/**
 * HUB by Raisen — Preferencias de interfaz (tema, idioma + white-label).
 * Funciones en submódulos (C4 ≤75).
 */
export type { Tema } from "./interfaz-tema.ts";
export { getTema, setTema, toggleTema } from "./interfaz-tema.ts";
export { getIdioma, toggleIdioma, suscribirAlCambio, iniciarControlesShell } from "./interfaz-idioma.ts";
export { getWhiteLabel, setWhiteLabel, toggleWhiteLabel } from "./interfaz-whitelabel.ts";