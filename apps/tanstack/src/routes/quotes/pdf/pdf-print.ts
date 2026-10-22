/**
 * HUB by Raisen — Imprime un nodo HTML (documento con estilos inline) en una ventana nueva y
 * dispara el dialogo de impresion del navegador -> "Guardar como PDF". Sin dependencias. C4 <=75.
 */
export function printHtml(html: string, title: string): void {
  if (!html) return;
  const w = window.open("", "_blank", "width=820,height=1060");
  if (!w) return;
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>` +
    `<style>@page{margin:16mm}html,body{margin:0;padding:0;background:#fff}</style></head>` +
    `<body>${html}</body></html>`,
  );
  w.document.close();
  w.focus();
  // pequeño respiro para que el layout pinte antes de imprimir
  window.setTimeout(() => { w.print(); }, 300);
}
