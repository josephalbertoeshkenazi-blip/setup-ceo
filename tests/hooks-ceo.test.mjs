// Hooks de ceo-base: reinyectar tras resumir/limpiar, correcciones, guardia de delegación, sesión liviana,
// buscar en la memoria. Todos se corren de verdad, con un HOME vacío, y nunca deben romper si faltan archivos.
import { test as t } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

import { raiz, python, aPosix, BASH, baseWindows } from './ayuda.mjs';

const py = python();
const test = (n, f) => (py || !/correr\(|py\.sh/.test(f.toString())) ? t(n, f) : t(n, { skip: 'sin Python' }, f);
const S = join(raiz, 'plugins/ceo-base/scripts');
const leer = (r) => readFileSync(join(raiz, r), 'utf8');

function entorno(extra = {}) {
  const home = mkdtempSync(join(tmpdir(), 'hk-'));
  return { home, env: { HOME: home, USERPROFILE: home, PATH: process.env.PATH, ...extra } };
}
function correr(script, entrada, e, args = []) {
  const input = typeof entrada === 'string' ? entrada : JSON.stringify(entrada);
  return spawnSync(py.cmd, [...py.args, '-I', join(S, script), ...args], { input, env: e.env, encoding: 'utf8' });
}
function ctx(r) {
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput : null;
}
const cwd = '/tmp/mi proyecto-x';
const memDe = (home, c = cwd) => join(home, '.claude/projects', c.replace(/[^A-Za-z0-9]/g, '-'), 'memory');
function perfil(home, texto) {
  mkdirSync(join(home, '.claude/mi-perfil'), { recursive: true });
  writeFileSync(join(home, '.claude/mi-perfil/ceo.md'), texto);
}
function transcript(home, mensajes) {
  const f = join(home, 't.jsonl');
  const filas = [];
  for (const m of mensajes) filas.push(JSON.stringify({ type: 'user', timestamp: '2026-01-01T10:00:00Z', message: { content: m } }));
  writeFileSync(f, filas.join('\n') + '\n');
  return f;
}

test('todos los hooks salen 0 y callan con entrada basura o vacía, sin HOME preparado', () => {
  for (const s of ['reinyectar.py', 'guardar-ultimos.py', 'ceo-liviano.py', 'guardia-delegar.py', 'captura-correcciones.py', 'recordar.py', 'anotar-pedido.py']) {
    for (const basura of ['', 'no es json', '[]', 'null', '{"cwd": 5, "prompt": 7}']) {
      const r = correr(s, basura, entorno());
      assert.equal(r.status, 0, `${s} ${basura}: ${r.stderr}`);
      assert.equal(r.stdout.trim(), '', `${s} ${basura} no debe imprimir`);
    }
  }
  const r = correr('revisar-correcciones.py', '', entorno(), ['--aviso']);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), '');
});

test('hooks.json: JSON válido, cada script existe y están los matchers compact, clear y startup', () => {
  const h = JSON.parse(leer('plugins/ceo-base/hooks/hooks.json')).hooks;
  const cmds = JSON.stringify(h).match(/scripts\/[\w.-]+/g);
  for (const c of new Set(cmds)) assert.ok(existsSync(join(raiz, 'plugins/ceo-base', c)), c);
  const m = h.SessionStart.map((x) => x.matcher);
  assert.ok(m.includes('compact|clear') && m.includes('startup'));
  assert.ok(h.PreCompact && h.SessionEnd && h.UserPromptSubmit && h.PostToolUse);
});

test('py.sh corre un script y no falla con entrada basura', () => {
  const e = entorno();
  const r = spawnSync('bash', [join(S, 'py.sh'), join(S, 'reinyectar.py')], { input: 'x', env: e.env, encoding: 'utf8' });
  assert.equal(r.status, 0);
});

test('reinyectar: sin memoria no imprime; con source distinto de compact/clear tampoco', () => {
  const e = entorno();
  assert.equal(ctx(correr('reinyectar.py', { source: 'compact', cwd }, e)), null);
  mkdirSync(memDe(e.home), { recursive: true });
  writeFileSync(join(memDe(e.home), 'abiertos.md'), '- [2026-01-01] algo\n');
  assert.equal(ctx(correr('reinyectar.py', { source: 'startup', cwd }, e)), null);
});

test('reinyectar compact: abiertos, últimos 5 mensajes y pendientes, en ese orden y bajo 9500', () => {
  const e = entorno();
  const mem = memDe(e.home);
  mkdirSync(mem, { recursive: true });
  writeFileSync(join(mem, 'abiertos.md'), '- [2026-01-01] PEDIDO-UNO\n');
  writeFileSync(join(mem, 'pendientes.md'), 'PENDIENTE-A\n' + 'x'.repeat(20000));
  const msgs = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'].map((m) => 'mensaje ' + m);
  msgs.splice(2, 0, '<system-reminder>ruido</system-reminder>');
  const t = transcript(e.home, msgs);
  const g = correr('guardar-ultimos.py', { hook_event_name: 'PreCompact', session_id: 's1', transcript_path: t, cwd }, e);
  assert.equal(g.status, 0, g.stderr);
  const o = ctx(correr('reinyectar.py', { source: 'compact', session_id: 's1', cwd }, e));
  assert.equal(o.hookEventName, 'SessionStart');
  const t2 = o.additionalContext;
  assert.ok(t2.length <= 9500);
  assert.ok(t2.indexOf('PEDIDO-UNO') < t2.indexOf('mensaje m7') && t2.indexOf('mensaje m7') < t2.indexOf('PENDIENTE-A'));
  assert.match(t2, /ÚLTIMOS 5 MENSAJES/);
  assert.doesNotMatch(t2, /mensaje m2|ruido/);
  assert.match(t2, /mensaje m3/);
});

test('reinyectar clear: toma los últimos mensajes de la sesión anterior en la misma carpeta (SessionEnd clear), no de otra', () => {
  const e = entorno();
  const t = transcript(e.home, ['hazme el informe de ventas', 'mi clave: Tigre99xx']);
  correr('guardar-ultimos.py', { hook_event_name: 'SessionEnd', reason: 'other', session_id: 'a', transcript_path: t, cwd }, e);
  assert.equal(ctx(correr('reinyectar.py', { source: 'clear', session_id: 'b', cwd }, e)), null, 'SessionEnd que no es clear no guarda');
  correr('guardar-ultimos.py', { hook_event_name: 'SessionEnd', reason: 'clear', session_id: 'a', transcript_path: t, cwd }, e);
  const o = ctx(correr('reinyectar.py', { source: 'clear', session_id: 'b', cwd }, e));
  assert.match(o.additionalContext, /informe de ventas/);
  assert.doesNotMatch(o.additionalContext, /Tigre99xx/);
  assert.equal(ctx(correr('reinyectar.py', { source: 'clear', session_id: 'b', cwd: '/tmp/otra' }, e)), null);
});

test('guardar-ultimos: transcript que no existe no rompe', () => {
  const e = entorno();
  const r = correr('guardar-ultimos.py', { hook_event_name: 'PreCompact', session_id: 's', transcript_path: '/no/existe', cwd }, e);
  assert.equal(r.status, 0);
  assert.ok(!existsSync(join(e.home, '.claude/ceo-estado/ultimos')));
});

const principal = (e) => perfil(e.home, `Sesión principal: ${cwd}\n`);

test('ceo-liviano: sin la línea de sesión principal no hace nada', () => {
  const e = entorno();
  for (let i = 0; i < 3; i++) assert.equal(ctx(correr('ceo-liviano.py', { source: 'compact', session_id: 's', cwd }, e)), null);
  const mem = memDe(e.home);
  mkdirSync(mem, { recursive: true });
  writeFileSync(join(mem, 'relevo.md'), 'RELEVO-X');
  assert.equal(ctx(correr('ceo-liviano.py', { source: 'clear', session_id: 's', cwd }, e)), null);
});

test('ceo-liviano: avisa al 3er resumen y cada 3; tras clear pasa el relevo; sin relevo calla', () => {
  const e = entorno();
  principal(e);
  const salidas = [];
  for (let i = 0; i < 6; i++) salidas.push(ctx(correr('ceo-liviano.py', { source: 'compact', session_id: 's', cwd }, e)));
  assert.deepEqual(salidas.map((x) => x !== null), [false, false, true, false, false, true]);
  assert.match(salidas[2].additionalContext, /relevo\.md/);
  assert.equal(ctx(correr('ceo-liviano.py', { source: 'clear', session_id: 's2', cwd }, e)), null);
  const mem = memDe(e.home);
  mkdirSync(mem, { recursive: true });
  writeFileSync(join(mem, 'relevo.md'), 'RELEVO-X en vuelo');
  assert.match(ctx(correr('ceo-liviano.py', { source: 'clear', session_id: 's2', cwd }, e)).additionalContext, /RELEVO-X en vuelo/);
});

test('guardia-delegar: apagada por defecto; encendida avisa cada 3, la memoria y los subagentes no cuentan, un mensaje reinicia', () => {
  const post = (e, extra) => ctx(correr('guardia-delegar.py', { hook_event_name: 'PostToolUse', session_id: 'g', cwd, tool_name: 'Bash', ...extra }, e));
  const sin = entorno();
  for (let i = 0; i < 4; i++) assert.equal(post(sin, {}), null);
  const e = entorno();
  principal(e);
  assert.equal(post(e, {}), null);
  assert.equal(post(e, {}), null);
  assert.equal(post(e, { tool_name: 'Read', tool_input: { file_path: join(memDe(e.home), 'abiertos.md') } }), null);
  assert.equal(post(e, { agent_id: 'sub' }), null);
  assert.match(post(e, {}).additionalContext, /delega/);
  correr('guardia-delegar.py', { hook_event_name: 'UserPromptSubmit', session_id: 'g', cwd, prompt: 'hola' }, e);
  assert.equal(post(e, {}), null);
  assert.equal(post(e, { tool_name: 'Agent' }), null);
});

const guardiaCon = (e, lineaPerfil, cwdHook, sid = 'p') => {
  perfil(e.home, `Sesión principal: ${lineaPerfil}\n`);
  let o = null;
  for (let i = 0; i < 3; i++) o = ctx(correr('guardia-delegar.py', { hook_event_name: 'PostToolUse', session_id: sid, cwd: cwdHook, tool_name: 'Bash' }, e));
  return o;
};

test('ruta_comparable: formas de Windows', () => {
  const llamar = (ruta, nt) => spawnSync(py.cmd, [...py.args, '-I', '-c',
    'import sys, json; sys.path.insert(0, sys.argv[1]); import comun; print(json.dumps(comun.ruta_comparable(sys.argv[2], nt=sys.argv[3] == "1")))', S, ruta, nt ? '1' : '0'],
  { encoding: 'utf8' });
  const nt = ['/c/Users/José/Mi CEO', 'C:\\Users\\josé\\mi ceo', 'C:/Users/José/Mi CEO/', '"C:\\Users\\JOSÉ\\Mi CEO"'].map((r) => {
    const x = llamar(r, true);
    assert.equal(x.status, 0, x.stderr);
    return JSON.parse(x.stdout);
  });
  assert.equal(new Set(nt).size, 1, nt.join(' | '));
  const posix = llamar('/Users/a/B/', false);
  assert.equal(JSON.parse(posix.stdout), '/Users/a/B');
  assert.notEqual(JSON.parse(llamar('/Users/a/b', false).stdout), JSON.parse(posix.stdout));
});

test('Sesión principal con espacios y tilde activa la guardia', () => {
  const e = entorno();
  const ruta = join(e.home, 'Mis Cosas', 'Mi CEO José');
  assert.match(guardiaCon(e, ruta, ruta).additionalContext, /Guardia:/);
});

test('Sesión principal en Windows: /c/..., mayúsculas y barras', { skip: process.platform !== 'win32' }, () => {
  for (const forma of [(h) => aPosix(h), (h) => h.toUpperCase()]) {
    const e = entorno();
    const ruta = join(e.home, 'Mis Cosas', 'Mi CEO José');
    assert.match(guardiaCon(e, forma(ruta), ruta).additionalContext, /Guardia:/);
  }
});

test('carpeta hija de la Sesión principal también cuenta, carpeta hermana no', () => {
  const e = entorno();
  const ruta = join(e.home, 'Mi CEO');
  assert.match(guardiaCon(e, ruta, join(ruta, 'sub', 'carpeta')).additionalContext, /Guardia:/);
  const f = entorno();
  const rutaF = join(f.home, 'Mi CEO');
  assert.equal(guardiaCon(f, rutaF, `${rutaF}-otro`), null);
  assert.equal(guardiaCon(f, rutaF, join(f.home, 'Otro'), 'q'), null);
});

test('captura-correcciones: guarda una corrección con el secreto tapado; un mensaje normal no; se apaga por perfil', () => {
  const e = entorno();
  const cola = join(e.home, '.claude/ceo-estado/cola-correcciones.jsonl');
  const p = (prompt) => correr('captura-correcciones.py', { prompt, cwd, session_id: 'c' }, e);
  p('Hazme un resumen de la reunión de hoy');
  p('no, eso no es lo que te pedí');
  p("That's not what I asked for. mi password: hunter2xyz");
  p('no, mañana mejor');
  const filas = readFileSync(cola, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(filas.length, 2);
  assert.equal(filas[0].project, cwd);
  assert.doesNotMatch(JSON.stringify(filas), /hunter2xyz/);
  perfil(e.home, 'Capturar correcciones: no\n');
  p('no, eso no es lo que te pedí otra vez');
  assert.equal(readFileSync(cola, 'utf8').trim().split('\n').length, 2);
});

test('revisar-correcciones: agrupa por proyecto, marca señales en 2+ proyectos, avisa solo con 3+ y pasada una semana', () => {
  const e = entorno();
  const dir = join(e.home, '.claude/ceo-estado');
  mkdirSync(dir, { recursive: true });
  const fila = (proj, pat, dias) => JSON.stringify({ ts: new Date(Date.now() - dias * 86400000).toISOString(), project: proj, session_id: 's', pattern: pat, excerpt: 'texto ' + pat });
  writeFileSync(join(dir, 'cola-correcciones.jsonl'), [fila('/a/uno', 'te dije', 1), fila('/a/dos', 'te dije', 1), fila('/a/uno', 'así no', 1)].join('\n') + '\n');
  const r = correr('revisar-correcciones.py', '', e);
  assert.match(r.stdout, /## uno \(2\)/);
  assert.match(r.stdout, /- te dije: dos, uno/);
  assert.equal(ctx(correr('revisar-correcciones.py', '', e, ['--aviso'])).hookEventName, 'SessionStart');
  assert.match(correr('revisar-correcciones.py', '', e, ['--marcar']).stdout, /revisión anotada/);
  assert.equal(ctx(correr('revisar-correcciones.py', '', e, ['--aviso'])), null);
  assert.match(correr('revisar-correcciones.py', '', e).stdout, /0 correcciones/);
});

test('recordar: encuentra la línea de la memoria; sin memoria o sin palabras raras calla', () => {
  const e = entorno();
  assert.equal(ctx(correr('recordar.py', { prompt: 'dónde dejamos el presupuesto de la cocina', cwd }, e)), null);
  const mem = memDe(e.home);
  mkdirSync(mem, { recursive: true });
  writeFileSync(join(mem, 'cocina.md'), '---\nname: x\n---\nEl presupuesto de la cocina quedó en 4000, falta el plomero.\n');
  const o = ctx(correr('recordar.py', { prompt: '¿Cuánto era el presupuesto de la cocina?', cwd }, e));
  assert.match(o.additionalContext, /cocina\.md:4:.*plomero/);
  assert.equal(ctx(correr('recordar.py', { prompt: 'hazlo ahora por favor', cwd }, e)), null);
});

test('registro de mensajes: apagado por defecto; con la línea del perfil guarda tapando secretos y recordar lo usa', () => {
  const e = entorno();
  const m = (prompt) => correr('anotar-pedido.py', { prompt, cwd, session_id: 'p' }, e);
  m('te mando el contrato de la oficina nueva');
  assert.ok(!existsSync(join(e.home, '.claude/ceo-estado/pedidos')));
  perfil(e.home, 'Guardar mis mensajes: sí\n');
  m('te mando el contrato de la oficina nueva, clave: abc12345');
  m('/clear');
  const dir = join(e.home, '.claude/ceo-estado/pedidos');
  const f = readdirSync(dir)[0];
  const filas = readFileSync(join(dir, f), 'utf8').trim().split('\n');
  assert.equal(filas.length, 1);
  assert.doesNotMatch(filas[0], /abc12345/);
  // Lo recién escrito (menos de 30 s) se salta, porque puede ser el mensaje de ahora: se envejece la línea.
  writeFileSync(join(dir, f), filas[0].replace(/"ts": ?"[^"]+"/, '"ts": "2026-01-01T10:00:00+00:00"') + '\n');
  const o = ctx(correr('recordar.py', { prompt: 'ya te dije lo del contrato de la oficina', cwd }, e));
  assert.match(o.additionalContext, /contrato de la oficina nueva/);
  perfil(e.home, 'Guardar mis mensajes: no\n');
  assert.equal(ctx(correr('recordar.py', { prompt: 'ya te dije lo del contrato de la oficina', cwd }, e)), null);
});

test('nada personal en los hooks, las reglas nuevas ni buscar-skill; sin rutas fijas', () => {
  // solo en el repo privado: sin la lista de privacidad solo se revisa lo demás
  const priv = (existsSync(join(raiz, 'scripts/privacidad.txt')) ? leer('scripts/privacidad.txt') : '').split('\n').filter((l) => /^[is] /.test(l))
    .map((l) => new RegExp(l.slice(2), l[0] === 'i' ? 'i' : ''));
  const archivos = readdirSync(S).filter((f) => f !== '__pycache__').map((f) => `plugins/ceo-base/scripts/${f}`)
    .concat(['plugins/ceo-base/skills/forma-de-trabajar/decisiones-y-memoria.md', 'plugins/ceo-base/skills/forma-de-trabajar/abiertos-plantilla.md',
      'plugins/ceo-base/skills/revisar-correcciones/SKILL.md', 'plugins/ceo-base/hooks/hooks.json', 'plugins/complementos/skills/buscar-skill/SKILL.md']);
  for (const f of archivos) {
    const t = leer(f);
    assert.doesNotMatch(t, /\bJoseph\b|importante\/|Desktop\//, f);
    for (const re of priv) assert.doesNotMatch(t, re, `${f} ${re}`);
  }
});

test('reglas 14 a 20, recetario y buscar-skill: lo aprobado está escrito', () => {
  const r = leer('plugins/ceo-base/reglas/reglas-ceo.md');
  for (const [n, x] of [[14, /AskUserQuestion.*rétalo/s], [15, /Lo que aprendiste:/], [16, /corre la skill.*brainstorming/s], [17, /lotes/], [18, /Opus revisa[\s\S]*empieza con Opus/], [19, /abiertos\.md.*3 KB/s], [20, /no molestar/i]])
    assert.match(r, new RegExp(`^${n}\\. \\*\\*[^\\n]*${x.source}`, x.flags.replace('g', '') + 'm').source ? x : x, `regla ${n}`);
  const b = leer('plugins/complementos/skills/buscar-skill/SKILL.md');
  assert.match(b, /^disable-model-invocation: true$/m);
  for (const x of ['claude-plugins-official', 'anthropics/skills', 'skills.sh', 'máximo 3', 'repo-eval', 'hash', '2.1.179', 'Nunca por popularidad', '--all'])
    assert.ok(b.toLowerCase().includes(x.toLowerCase()), x);
  assert.doesNotMatch(b, /npx skills add [^\n]*\n```/);
});

test('buffer corriente: sin transcript, el UserPromptSubmit guarda los últimos 5 (secretos tapados) y reinyectar los usa; CLAUDE_PROJECT_DIR manda sobre cwd', () => {
  const e = entorno();
  for (let i = 1; i <= 7; i++)
    correr('guardar-ultimos.py', { hook_event_name: 'UserPromptSubmit', session_id: 'b', cwd: '/otro/lugar', prompt: `pedido numero ${i} mi clave del banco es Tigre Azul 99` }, e);
  correr('guardar-ultimos.py', { hook_event_name: 'UserPromptSubmit', session_id: 'b', cwd, prompt: '/clear' }, e);
  const e2 = { ...e, env: { ...e.env, CLAUDE_PROJECT_DIR: cwd } };
  mkdirSync(memDe(e.home), { recursive: true });
  writeFileSync(join(memDe(e.home), 'abiertos.md'), '- cosa\n');
  const o = ctx(correr('reinyectar.py', { source: 'compact', session_id: 'b', cwd: '/otro/lugar' }, e2)).additionalContext;
  assert.match(o, /cosa/);
  assert.match(o, /pedido numero 7/);
  assert.doesNotMatch(o, /pedido numero 2|Tigre Azul/);
});

test('clear: no toma el buffer de otra sesión si no se cerró por clear hace poco', () => {
  const e = entorno();
  correr('guardar-ultimos.py', { hook_event_name: 'UserPromptSubmit', session_id: 'a', cwd, prompt: 'algo de otra sesion' }, e);
  assert.equal(ctx(correr('reinyectar.py', { source: 'clear', session_id: 'z', cwd }, e)), null);
});

test('lo que imprime cada hook de arranque cabe bajo 10 000 caracteres, con perfil y lecciones grandes', () => {
  const e = entorno();
  perfil(e.home, 'x'.repeat(9000));
  mkdirSync(join(e.home, '.claude/mi-perfil'), { recursive: true });
  writeFileSync(join(e.home, '.claude/mi-perfil/lecciones-globales.md'), 'y'.repeat(5000));
  for (const modo of ['reglas', 'perfil']) {
    const r = spawnSync('bash', [join(S, 'inyectar-reglas.sh'), modo], { env: e.env, encoding: 'utf8' });
    assert.ok([...r.stdout].length < 10000 - (modo === 'perfil' ? 0 : 500), `${modo}: ${[...r.stdout].length}`);
  }
});

const AVISO = join(S, 'aviso-python.sh');
const PYSH = join(S, 'py.sh');
const bash = (script, args, extra = {}) => spawnSync(BASH, [script, ...args], { env: { ...baseWindows, ...entorno(extra).env }, encoding: 'utf8' });

t('sin Python: aviso-python avisa una vez y sale 0', () => {
  const r = bash(AVISO, [], { CEO_PY_FORZAR: 'ninguno' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.split('Aviso del setup: falta Python').length - 1, 1);
  assert.match(r.stdout, /cerrar la app del todo/);
});

t('con Python: no hay aviso', { skip: py ? false : 'sin Python' }, () => {
  const r = bash(AVISO, []);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '');
});

t('py.sh --hay: 1 si no hay Python, 0 si hay, y nunca imprime', () => {
  const sin = bash(PYSH, ['--hay'], { CEO_PY_FORZAR: 'ninguno' });
  assert.equal(sin.status, 1);
  assert.equal(sin.stdout + sin.stderr, '');
  if (py) {
    const con = bash(PYSH, ['--hay']);
    assert.equal(con.status, 0);
    assert.equal(con.stdout + con.stderr, '');
  }
});

t('hooks.json registra aviso-python en SessionStart', () => {
  const h = JSON.parse(leer('plugins/ceo-base/hooks/hooks.json')).hooks;
  const ok = h.SessionStart.some((x) => !x.matcher && x.hooks.some((k) => k.command.endsWith('aviso-python.sh"')));
  assert.ok(ok);
});

t('aviso-python: una sonda rota no ensucia stderr y el aviso sale por stdout', () => {
  // py.sh en Mac usa rutas fijas, así que el falso es el "bash" que aviso-python llama para la sonda: imprime en stderr y falla, como un Python roto.
  const rota = mkdtempSync(join(tmpdir(), 'rota-'));
  writeFileSync(join(rota, 'bash'), '#!/bin/sh\necho "Traceback: python roto" >&2\nexit 1\n', { mode: 0o755 });
  const r = bash(AVISO, [], { PATH: `${rota}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}` });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Aviso del setup: falta Python/);
  assert.equal(r.stderr, '');
});
