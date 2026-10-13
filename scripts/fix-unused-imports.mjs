// Autofix: elimina importaciones no usadas de cada archivo TypeScript.
// Usa la API de ESLint para detectar y editar. Preserva imports usados.
import { ESLint } from "eslint";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "build"].includes(entry.name)) continue;
      out.push(...walk(full));
    } else if (entry.name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(path.join(ROOT, "src"));
const eslint = new ESLint({ cwd: ROOT, fix: false });

(async () => {
  let changedFiles = 0;
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const results = await eslint.lintText(source, { filePath: file });
    const result = results[0];
    if (result.errorCount === 0) continue;

    // Identificar los identificadores no usados (de los mensajes).
    const unused = new Set();
    for (const m of result.messages) {
      if (m.ruleId && m.ruleId.includes("no-unused-vars")) {
        const match = m.message.match(/'([^']+)'/);
        if (match) unused.add(match[1]);
      }
    }
    if (unused.size === 0) continue;

    // Eliminar el identificador de la declaracion de import.
    let modified = false;
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/^import/.test(line.trim())) continue;
      for (const name of unused) {
        // Caso: import { a, b } from -> quitar b, aislado por comas.
        if (new RegExp(`\\b${name}\\b`).test(line)) {
          const updated = removeFromNamedImport(line, name);
          if (updated !== line) { lines[i] = updated; modified = true; }
        }
        // Caso: import Nombre from -> quitar toda la linea si solo es ese.
        if (new RegExp(`^import\\s+${name}\\s+from`).test(line.trim()) && line.trim().includes(" from ")) {
          lines[i] = ""; modified = true;
        }
      }
    }
    if (!modified) continue;

    const updatedSource = lines.filter((l) => l.trim() !== "").join("\n");
    fs.writeFileSync(file, updatedSource, "utf8");
    changedFiles++;
    console.log(`fix: ${path.relative(ROOT, file)}`);
  }
  console.log(`\n[FIX] ${changedFiles} archivos limpiados.`);
})();

function removeFromNamedImport(line, name) {
  const m = line.match(/^import\s*\{([^}]*)\}\s*from(.*)$/);
  if (!m) return line;
  const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  if (!names.includes(name)) return line;
  const rest = names.filter((n) => n !== name);
  if (rest.length === 0) {
    return `import type { ${name} } from${m[2]}`.replace(/^import type/, "// import eliminado"); // no-op seguro
  }
  return `import { ${rest.join(", ")} } from${m[2]}`;
}