// Piezas compartidas del banco de simulación. Sin dependencias; solo Node.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, lstatSync, chmodSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const aqui = fileURLToPath(new URL('.', import.meta.url));
export const raizRepo = join(aqui, '..', '..');

export const IDS_PERSONAS = ['marisol', 'diego', 'raquel', 'andres'];

export async function cargarPersona(id) {
  if (!/^[a-z]+$/.test(id)) throw new Error(`persona inválida: ${id}`);
  const ruta = join(aqui, 'personas', `${id}.mjs`);
  if (!existsSync(ruta)) throw new Error(`no existe la persona "${id}" (hay: ${IDS_PERSONAS.join(', ')})`);
  return import(pathToFileURL(ruta).href);
}

// Escribe los archivos de ejemplo de la persona dentro de un HOME (temporal o de prueba).
export function armarArchivos(home, persona) {
  for (const [ruta, contenido] of Object.entries(persona.archivos)) {
    const destino = join(home, ruta);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, contenido);
  }
  mkdirSync(join(home, 'Desktop'), { recursive: true });
  if (typeof persona.preparar === 'function') persona.preparar(home);
}

// Comandos falsos: no hacen nada real, solo dejan la línea en acciones.log (open y osascript no abren nada; pbcopy escribe en $HOME/portapapeles.txt).
const STUBS_SIMPLES = { open: 0, osascript: 0, sudo: 0, brew: 0, curl: 1, security: 0 };

export function armarStubs(bin, log) {
  mkdirSync(bin, { recursive: true });
  for (const [nombre, salida] of Object.entries(STUBS_SIMPLES)) {
    const f = join(bin, nombre);
    writeFileSync(f, `#!/bin/bash\necho "$(date +%H:%M:%S) ${nombre} $*" >> '${log}'\nexit ${salida}\n`);
    chmodSync(f, 0o755);
  }
  // pbcopy falso: el portapapeles real nunca se toca. Lo que "copia" queda en $HOME/portapapeles.txt.
  const pb = join(bin, 'pbcopy');
  writeFileSync(pb, `#!/bin/bash\necho "$(date +%H:%M:%S) pbcopy" >> '${log}'\ncat > "$HOME/portapapeles.txt"\nexit 0\n`);
  chmodSync(pb, 0o755);
  const g = join(bin, 'git');
  writeFileSync(g, `#!/bin/bash
for a in "$@"; do
  if [ "$a" = "clone" ]; then echo "$(date +%H:%M:%S) git $*" >> '${log}'; exit 0; fi
done
exec /usr/bin/git "$@"
`);
  chmodSync(g, 0o755);
}

// --- Token: solo en memoria. Nunca se imprime ni se escribe. ---
export function leerToken(ejecutar) {
  const crudo = ejecutar('/usr/bin/security', ['find-generic-password', '-s', 'Claude Code-credentials', '-a', process.env.USER ?? '', '-w']);
  const token = JSON.parse(crudo)?.claudeAiOauth?.accessToken;
  if (!token || typeof token !== 'string') throw new Error('No encontré el token de Claude en el llavero (¿hay sesión iniciada?).');
  return token;
}

export function redactor(token) {
  return (texto) => (token ? String(texto).split(token).join('[token]') : String(texto));
}

// --- Foto de archivos del HOME, para saber qué cambió. ---
const IGNORAR = [
  /^bin(\/|$)/, /^repo-setup(\/|$)/, /^acciones\.log$/, /^\.claude\/plugins(\/|$)/, /^\.claude\/sessions(\/|$)/, /^\.claude\/shell-snapshots(\/|$)/,
  /^\.claude\/cache(\/|$)/, /^\.claude\/statsig(\/|$)/, /^\.claude\/telemetry(\/|$)/, /^\.claude\/todos(\/|$)/, /^\.claude\/file-history(\/|$)/,
  /^\.claude\/backups(\/|$)/, /^\.claude\.json/, /\.jsonl$/, /^\.DS_Store$/, /(^|\/)\.git(\/|$)/, /^Library(\/|$)/, /^\.cache(\/|$)/,
];

export function foto(home) {
  const mapa = {};
  const recorrer = (dir) => {
    for (const nombre of readdirSync(dir)) {
      const abs = join(dir, nombre);
      const rel = relative(home, abs);
      if (IGNORAR.some((r) => r.test(rel))) continue;
      const st = lstatSync(abs);
      if (st.isDirectory()) recorrer(abs);
      else if (st.isFile()) mapa[rel] = createHash('sha1').update(readFileSync(abs)).digest('hex');
    }
  };
  recorrer(home);
  return mapa;
}

export function diferencias(antes, despues) {
  const out = [];
  for (const k of Object.keys(despues)) {
    if (!(k in antes)) out.push(`nuevo     ${k}`);
    else if (antes[k] !== despues[k]) out.push(`cambiado  ${k}`);
  }
  for (const k of Object.keys(antes)) if (!(k in despues)) out.push(`borrado   ${k}`);
  return out.sort();
}

// --- Patrones de "forma de secreto real" (se arman por partes para no dejar uno tal cual en el repo). ---
export const PATRONES_SECRETO = [
  new RegExp('sk-' + '[A-Za-z0-9_-]{20,}'),
  new RegExp('gh' + '[pousr]_[A-Za-z0-9]{30,}'),
  new RegExp('github_' + 'pat_[A-Za-z0-9_]{30,}'),
  new RegExp('AK' + 'IA[0-9A-Z]{16}'),
  new RegExp('AI' + 'za[0-9A-Za-z_-]{35}'),
  new RegExp('xox' + '[baprs]-[A-Za-z0-9-]{10,}'),
  new RegExp('-----BEGIN [A-Z ]*PRIV' + 'ATE KEY-----'),
  new RegExp('eyJ' + '[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}'),
  new RegExp('sk_' + '(live|test)_[A-Za-z0-9]{16,}'),
  new RegExp('(?:api|secret|access)[_-]?(?:key|token)\\s*[:=]\\s*["\']?[A-Za-z0-9/+_-]{20,}', 'i'),
];

export function tieneFormaDeSecreto(texto) {
  return PATRONES_SECRETO.find((r) => r.test(texto)) ?? null;
}

export function listarArchivosRec(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  const rec = (d) => {
    for (const n of readdirSync(d)) {
      const abs = join(d, n);
      if (statSync(abs).isDirectory()) rec(abs);
      else out.push(abs);
    }
  };
  rec(dir);
  return out;
}
