// Ayudas compartidas por las pruebas: rutas, Python y Windows fingido.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

export const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
export const esWindows = process.platform === 'win32';

let pythonCache;
export function python() {
  if (pythonCache !== undefined) return pythonCache;
  const candidatos = [['py', ['-3']], ['python3', []], ['python', []]];
  for (const [cmd, args] of candidatos) {
    const r = spawnSync(cmd, [...args, '-c', 'import sys'], { encoding: 'utf8' });
    if (!r.error && r.status === 0) return (pythonCache = { cmd, args });
  }
  return (pythonCache = null);
}

export function entornoCasa(nombre = 'José Pérez') {
  const home = join(mkdtempSync(join(tmpdir(), 'casa-')), nombre);
  mkdirSync(home, { recursive: true });
  const env = { HOME: home, USERPROFILE: home };
  for (const k of ['PATH', 'SystemRoot', 'ComSpec', 'PATHEXT', 'TEMP', 'TMP']) if (process.env[k] !== undefined) env[k] = process.env[k];
  return { home, env };
}

export function fingirWindows(env) {
  const dir = mkdtempSync(join(tmpdir(), 'uname-'));
  const f = join(dir, 'uname');
  writeFileSync(f, '#!/bin/sh\necho MINGW64_NT-10.0-26100\n');
  chmodSync(f, 0o755);
  return { ...env, PATH: `${dir}${esWindows ? ';' : ':'}${env.PATH ?? process.env.PATH}` };
}

export const soloMac = { skip: process.platform === 'darwin' ? false : 'solo en macOS' };

export const sepPath = esWindows ? ';' : ':';

// El bash con el que corren los scripts. En Mac es /bin/bash. En Windows es el de Git (nunca el bash.exe de WSL en System32),
// con ruta completa: Node no encuentra "bash" si el PATH de la prueba está recortado.
let bashCache;
export function bashReal() {
  if (bashCache) return bashCache;
  if (!esWindows) return (bashCache = '/bin/bash');
  const r = spawnSync('where', ['bash'], { encoding: 'utf8' });
  const todos = (r.stdout || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // Solo el bash de Git para Windows: nunca el de WSL (System32) ni el atajo de WindowsApps.
  const git = todos.find((l) => /\\Git\\/i.test(l) && !/system32|windowsapps/i.test(l));
  if (!git) throw new Error('no encontré el bash de Git para Windows (encontré: ' + (todos.join(', ') || 'nada') + ')');
  return (bashCache = git);
}
export const BASH = bashReal();

// Lo que imprime un script (siempre en forma de Git Bash: /d/a/..., /tmp/...) comparado con una ruta de Node.
export function aPosix(ruta) {
  if (!esWindows) return ruta;
  const r = spawnSync(BASH, ['-c', 'cygpath -u "$1"', '_', ruta], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : ruta;
}

// Ruta absoluta (forma de bash) de un programa, tal como la ve bash.
export function rutaDe(programa) {
  return spawnSync(BASH, ['-c', `command -v ${programa}`], { encoding: 'utf8' }).stdout.trim();
}

// Un directorio con solo estos programas, para probar "sin X". Cada programa es un envoltorio de una línea que llama al de verdad:
// en Windows no se pueden crear enlaces simbólicos sin permisos especiales, y en los dos sistemas así se ve igual.
export function carpetaConHerramientas(nombres, dir = mkdtempSync(join(tmpdir(), 'herr-'))) {
  for (const n of nombres) {
    const ruta = rutaDe(n);
    if (!ruta) throw new Error(`carpetaConHerramientas: no encontré "${n}" en este sistema`);
    writeFileSync(join(dir, n), `#!/bin/sh\nexec "${ruta}" "$@"\n`);
    chmodSync(join(dir, n), 0o755);
  }
  return dir;
}

// Variables que Windows necesita para arrancar cualquier programa aunque el PATH esté recortado.
export const baseWindows = esWindows && process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {};
