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
  console.log("  No se encontró commit con 'new version X.XX'. No se actualiza version.txt");
  process.exit(0);
}

// Filtrar duplicados consecutivos, commits de versión y "Merge pull request"
let filtered = lines.filter((line, i, arr) => {
  if (/version\s*(?:to)?\s*[0-9]+(\.[0-9]+)?/i.test(line)) return false; // quitar commits de versión
  if (/^merge pull request/i.test(line)) return false; // quitar merges
  return line !== arr[i - 1]; // quitar duplicados seguidos
});

// Crear bloque de changelog
const date = new Date().toLocaleDateString("es-ES");
const commitLines = filtered.map(l => `- ${l}`).join("\n");
const newBlock = `\nVersión ${commitVersion} - ${date}\n${commitLines}\n`;

// Añadir al archivo
fs.appendFileSync(versionFile, newBlock);

console.log(` Actualizado ${versionFile} a versión ${commitVersion}`);
