import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) files.push(...walk(full));
    else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) files.push(full);
  }
  return files;
}

function resolveImport(fromFile, importPath) {
  if (!importPath.startsWith(".")) return importPath;
  if (/\.(js|json|ts)$/.test(importPath)) return importPath;

  const fromDir = dirname(fromFile);
  const targetTs = resolve(fromDir, importPath + ".ts");
  const targetIndexTs = resolve(fromDir, importPath, "index.ts");

  try {
    if (statSync(targetTs).isFile()) return importPath + ".js";
  } catch {}
  try {
    if (statSync(targetIndexTs).isFile()) return importPath + "/index.js";
  } catch {}
  return importPath;
}

const files = walk("src");
let edited = 0;
let totalReplacements = 0;

for (const file of files) {
  const original = readFileSync(file, "utf8");
  const updated = original
    .replace(/from\s+["'](\.[^"']+)["']/g, (match, path) => {
      const fixed = resolveImport(file, path);
      if (fixed !== path) totalReplacements++;
      return `from "${fixed}"`;
    })
    .replace(/import\(\s*["'](\.[^"']+)["']\s*\)/g, (match, path) => {
      const fixed = resolveImport(file, path);
      if (fixed !== path) totalReplacements++;
      return `import("${fixed}")`;
    });

  if (updated !== original) {
    writeFileSync(file, updated);
    edited++;
    console.log(`[fix] ${file}`);
  }
}

console.log(`\nEdited ${edited} files, ${totalReplacements} import paths updated.`);