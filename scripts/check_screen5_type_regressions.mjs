import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

// The repository-wide config also includes generated JS and unrelated projects.
// Check the changed entry points and their imports, comparing existing errors
// against the pre-change source without overwriting any working files.
const files=['components/editors/Msx2BitmapScreenEditor.tsx','handlers/useHistoryHandlers.tsx'];
const baseline=new Map(files.map(file=>[resolve(file).replaceAll('\\','/'),execFileSync('git',['show',`1f7c3cacb84eb70f5ac4ad8a5bc6d4fe24cebdac:${file}`],{encoding:'utf8'})]));
const config=ts.readConfigFile('tsconfig.json',ts.sys.readFile).config;
config.include=[];config.files=[...files,'utils/msx2BitmapStroke.ts'];config.compilerOptions.allowJs=false;
const parsed=ts.parseJsonConfigFileContent(config,ts.sys,process.cwd());
function diagnostics(old){
  const host=ts.createCompilerHost(parsed.options),read=host.readFile;
  if(old)host.readFile=file=>baseline.get(resolve(file).replaceAll('\\','/'))??read(file);
  const program=ts.createProgram(parsed.fileNames,parsed.options,host);
  return ts.getPreEmitDiagnostics(program).map(d=>`${d.file?.fileName.replaceAll('\\','/')} TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`).sort();
}
const before=diagnostics(true),after=diagnostics(false),remaining=[...before];
const added=after.filter(d=>{const i=remaining.indexOf(d);if(i<0)return true;remaining.splice(i,1);return false;});
assert.deepEqual(added,[],'No new TypeScript diagnostics in the changed entry points/dependencies');
console.log(`PASS: no new TypeScript diagnostics (${before.length} baseline, ${after.length} current)`);
