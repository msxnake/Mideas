const { execSync } = require("child_process");
const fs = require("fs");

const versionFile = "changeLog.txt";

// Leer commits recientes (últimos 50)
let rawLog = execSync(`git log --pretty=format:"%s" -n 50`, { encoding: "utf8" });
let lines = rawLog.split("\n");

// Buscar si alguno indica versión explícita
let commitVersion = null;
for (let line of lines) {
  let match = line.match(/version\s*(?:to)?\s*([0-9]+(\.[0-9]+)?)/i);
  if (match) {
    commitVersion = match[1];
    break; // usamos la primera coincidencia
  }
}

// Si no hay versión en los commits, no hacemos nada
if (!commitVersion) {
  console.log("  No se encontró commit con 'version X.XX'. No se actualiza changeLog.txt");
  process.exit(0);
}

// Filtrar duplicados consecutivos, commits de versión y "Merge pull request"
let filtered = lines.filter((line, i, arr) => {
  if (/version\s*(?:to)?\s*[0-9]+(\.[0-9]+)?/i.test(line)) return false; // quitar commits de versión
  if (/^merge pull request/i.test(line)) return false; // quitar merges
  return line !== arr[i - 1]; // quitar duplicados seguidos
});

// Crear bloque de changelog (encabezado + lista) y PREPENDERLO arriba
const date = new Date().toLocaleDateString("es-ES");
const commitLines = filtered.map(l => `- ${l}`).join("\n");
const newBlock = `Versión ${commitVersion} - ${date}\n${commitLines}\n\n`;

let previous = "";
try {
  previous = fs.readFileSync(versionFile, "utf8");
} catch {}

const combined = newBlock + (previous || "");
fs.writeFileSync(versionFile, combined, "utf8");

console.log(` Actualizado ${versionFile} a versión ${commitVersion}`);

