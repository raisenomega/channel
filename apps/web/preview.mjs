// HUB by Raisen — preview server (sin dependencias externas de runtime)
// Transpila los .ts del front y sirve las CSS OMEGA para verlo en el navegador.
// USO: node apps/web/preview.mjs  -> abre http://localhost:PORT
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const ROOT = fileURLToPath(new URL(".", import.meta.url)); // apps/web/
const REPO = normalize(join(ROOT, "../.."));                 // raiz del repo
const PORT = Number(process.env.PORT || 5174);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".ts": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// Resuelve /src/shared/... contra la carpeta compartida del repo (raiz).
function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  if (clean === "/" || clean === "") return join(ROOT, "index.html");
  const target = clean.replace(/^\/+/, "");
  // Dominio compartido del repo -> <repo>/src/shared/...
  if (target.startsWith("src/shared/")) {
    return normalize(join(REPO, target));
  }
  // assets de la carpeta public/ -> apps/web/public/...
  if (target.startsWith("manifest.json") || clean.endsWith(".svg") || clean.endsWith(".png")) {
    return normalize(join(ROOT, "public", target));
  }
  return normalize(join(ROOT, target));
}

function transpile(code, filename) {
  const out = ts.transpileModule(code, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.Preserve,
    },
  });
  // El CSS se carga ya via <link> en index.html; quitar los import de CSS
  // para que el navegador no intente importar .css como modulo (rompe el boot).
  return out.outputText
    .replace(/import\s+["'][^"']+\.css["'];\s*/g, "")
    .replace(/import\s+["'][^"']+\.css["']\s*;/g, "");
}

function cssVoid() {
  return "/* fuente omitida en preview: usa el fallback de sistema */";
}

const server = createServer((req, res) => {
  const url = req.url || "/";
  const path = safePath(url);

  // Intercepta imports @fontsource para no romper (no instaladas en apps/web)
  if (url.includes("@fontsource")) {
    res.writeHead(200, { "content-type": MIME[".css"] });
    res.end(cssVoid());
    return;
  }

  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("404 - no encontrado");
    return;
  }

  const ext = extname(path);
  let body = readFileSync(path, "utf8");
  if (ext === ".ts") body = transpile(body, path);
  res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`HUB preview OMEGA -> http://localhost:${PORT}`);
});