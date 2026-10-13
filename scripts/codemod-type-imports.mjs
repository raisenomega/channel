// Codemod: convierte imports usados solo como tipo a "import type".
// Requisito: tsconfig con verbatimModuleSyntax (arroja TS1484 si no se hace).
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const tsconfigPath = path.join(ROOT, "tsconfig.json");
const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, ROOT);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();

function isUsedOnlyAsType(fileName, importName) {
  const sf = program.getSourceFile(fileName);
  if (!sf) return false;
  let typeUses = 0, valueUses = 0;
  const visit = (node) => {
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text === importName) typeUses++;
    else if (ts.isTypeQueryNode(node) && ts.isIdentifier(node.exprName) && node.exprName.text === importName) typeUses++;
    else if (ts.isIdentifier(node) && node.text === importName && node.parent && !ts.isImportSpecifier(node.parent)) {
      const sym = checker.getSymbolAtLocation(node);
      const decl = sym?.declarations?.[0];
      if (decl && decl.getSourceFile().fileName === fileName) valueUses++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return typeUses > 0 && valueUses === 0;
}

function transform(fileName, text) {
  const sf = program.getSourceFile(fileName);
  if (!sf) return text;
  let out = text;
  const edits = [];
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const clause = stmt.importClause;
    if (!clause || !stmt.moduleSpecifier) continue;
    const specifiers = clause.namedBindings && ts.isNamedImports(clause.namedBindings)
      ? clause.namedBindings.elements
      : [];
    const typeOnly = specifiers.filter((s) => isUsedOnlyAsType(fileName, s.name.text));
    if (typeOnly.length === 0) continue;
    // Convertir cada specifier a { type X } (o -- type)
    for (const s of typeOnly) {
      const start = s.getStart(sf);
      const end = s.getEnd();
      edits.push({ start, end, name: s.name.text });
    }
    // Si todos son tipo, marcar todo el import como import type
    if (specifiers.length === typeOnly.length) {
      const stmtStart = stmt.getStart(sf);
      const range = out.slice(0, stmt.getStart(sf));
      const after = out.slice(stmt.getStart(sf));
      out = range + after.replace(/^import(?!\s*type\b)/, "import type");
    }
  }
  // Aplicar sustituciones individuales (type X)
  for (const e of edits) {
    const before = out.slice(0, e.start);
    const after = out.slice(e.end);
    out = before + `type ${e.name}` + after;
  }
  return out;
}

let changed = 0;
for (const f of parsed.fileNames) {
  if (!f.endsWith(".ts")) continue;
  const text = fs.readFileSync(f, "utf8");
  const result = transform(f, text);
  if (result !== text) {
    fs.writeFileSync(f, result, "utf8");
    changed++;
    console.log(`codemod: ${path.relative(ROOT, f)}`);
  }
}
console.log(`\n[CODEmOD] ${changed} archivos actualizados.`);