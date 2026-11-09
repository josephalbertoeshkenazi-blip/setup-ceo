// ceo-base en Windows: lanzador de Python, UTF-8, candado de archivo y reglas sin iconv.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';

import { raiz, python, entornoCasa, fingirWindows, soloMac, BASH, carpetaConHerramientas } from './ayuda.mjs';

const scripts = join(raiz, 'plugins/ceo-base/scripts');
const pySh = join(scripts, 'py.sh');
const py = python();

function falso(dir, nombre, cuerpo) {
  const f = join(dir, nombre);
  writeFileSync(f, `#!/bin/sh\n${cuerpo}\n`);
  chmodSync(f, 0o755);
}
const dirTemp = () => mkdtempSync(join(tmpdir(), 'falso-'));
const conPath = (env, dir) => ({ ...env, PATH: `${dir}${delimiter}${env.PATH}` });

test('py.sh en Windows usa py -3 si existe', () => {
  const d = dirTemp();
  falso(d, 'py', 'echo "PY:$*"');
  const env = conPath(fingirWindows(entornoCasa().env), d);
  const r = spawnSync(BASH, [pySh, 'x.py', 'a'], { encoding: 'utf8', env });
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), 'PY:-3 -X utf8 -I x.py a');
});

test('py.sh en Windows salta el python3 de la Tienda', () => {
  const d = dirTemp();
  falso(d, 'python3', 'echo "Python was not found; run without arguments to install from the Microsoft Store" >&2; exit 9009');
  falso(d, 'python', 'case "$1" in -c) exit 0;; esac; echo "OK:$*"');
  // PATH sin ningún "py" real: solo los falsos y las herramientas básicas.
  const env = fingirWindows({ ...entornoCasa().env, PATH: `${d}${delimiter}${herramientas()}` });
  const r = spawnSync(BASH, [pySh, 'x.py'], { encoding: 'utf8', env });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.startsWith('OK:-X utf8 -I'), r.stdout + r.stderr);
});

// Un solo directorio con cat, head y dirname: nada de /usr/bin, así no hay Python.
const herramientas = () => carpetaConHerramientas(['cat', 'head', 'dirname']);

test('py.sh sin ningún Python sale 0 y no imprime nada', () => {
  const base = entornoCasa().env;
  const env = fingirWindows({ ...base, PATH: herramientas() });
  const r = spawnSync(BASH, [pySh, 'x.py'], { encoding: 'utf8', env });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, '');
});

test('py.sh en Mac sigue igual', soloMac, () => {
  const s = readFileSync(pySh, 'utf8');
  for (const l of [
    'for p in /opt/homebrew/bin/python3 /usr/local/bin/python3; do',
    '[ -x "$p" ] && exec "$p" -I "$@"',
    'if [ -x /usr/bin/python3 ] && /usr/bin/xcode-select -p >/dev/null 2>&1; then',
    'exec /usr/bin/python3 -I "$@"',
  ]) assert.ok(s.includes(l), l);
});

test('inyectar-reglas perfil con iconv roto', () => {
  const { home, env } = entornoCasa();
  mkdirSync(join(home, '.claude/mi-perfil'), { recursive: true });
  writeFileSync(join(home, '.claude/mi-perfil/ceo.md'), Buffer.concat([Buffer.from('Me llamo José '), Buffer.from([0xff]), Buffer.from(' fin\n')]));
  const d = dirTemp();
  falso(d, 'iconv', 'exit 127');
  const r = spawnSync(BASH, [join(scripts, 'inyectar-reglas.sh'), 'perfil'], { env: conPath(env, d) });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.toString('utf8').includes('José'));
  assert.ok(r.stdout.includes(0xff), 'sin iconv el texto pasa tal cual');
});

test('captura-correcciones sin fcntl', { skip: !py }, () => {
  const { env } = entornoCasa();
  const cola = join(mkdtempSync(join(tmpdir(), 'cola-')), 'cola.jsonl');
  const prog = `import sys, runpy\nsys.modules['fcntl']=None\nrunpy.run_path(${JSON.stringify(join(scripts, 'captura-correcciones.py'))}, run_name='__main__')`;
  const entrada = JSON.stringify({ prompt: 'no, así no, ya te dije que lo hagas de otra forma', session_id: 's1', cwd: '/tmp/x' });
  const r = spawnSync(py.cmd, [...py.args, '-c', prog], { input: entrada, encoding: 'utf8', env: { ...env, COLA_CORRECCIONES: cola } });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(cola), 'la cola debe existir');
  assert.ok(readFileSync(cola, 'utf8').includes('"session_id"'));
});

test('los hooks de ceo-base con HOME "José Pérez" escriben y leen en UTF-8', { skip: !py }, () => {
  const { home, env } = entornoCasa('José Pérez');
  const e = { ...env, PYTHONUTF8: '0' };
  delete e.PYTHONIOENCODING;
  const correr = (script, obj) => spawnSync(py.cmd, [...py.args, join(scripts, script)], { input: JSON.stringify(obj), encoding: 'utf8', env: e });
  const texto = 'Quiero ñandú, canción y acción — José';
  const g = correr('guardar-ultimos.py', { hook_event_name: 'UserPromptSubmit', session_id: 'abc', cwd: home, prompt: texto });
  assert.equal(g.status, 0, g.stderr);
  const arch = join(home, '.claude/ceo-estado/ultimos/ultimos-abc.json');
  assert.ok(existsSync(arch), 'debe guardar los últimos');
  assert.ok(readFileSync(arch, 'utf8').includes('ñandú'));
  const r = correr('reinyectar.py', { hook_event_name: 'SessionStart', source: 'compact', session_id: 'abc', cwd: home });
  assert.equal(r.status, 0, r.stderr);
  const ctx = JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
  assert.ok(ctx.includes('ñandú'), ctx);
});
