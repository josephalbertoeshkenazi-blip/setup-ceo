// Delegar como lo hace de verdad la pestaña Code de Desktop (Mac y Windows).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { raiz } from './ayuda.mjs';

const leer = (...p) => readFileSync(join(raiz, ...p), 'utf8').replace(/\r\n/g, '\n');
const skill = leer('plugins/ceo-base/skills/forma-de-trabajar/SKILL.md');
const seccion = (md, n) => {
  const m = md.match(new RegExp(`^## ${n}\\. [^\\n]*\\n[\\s\\S]*?(?=^## \\d+\\. |(?![\\s\\S]))`, 'm'));
  assert.ok(m, `falta la sección ${n}`);
  return m[0];
};
const s4 = seccion(skill, 4);
const s9 = seccion(skill, 9);

test('sección 9: abrir sesiones en Desktop con la herramienta de sesiones', () => {
  const d = s9.slice(s9.indexOf('- **En Desktop:**'), s9.indexOf('- **En la Terminal:**'));
  assert.ok(d.length > 200, 'falta el punto de Desktop');
  for (const t of ['mcp__ccd_session__start_session', '`cwd`', 'SendMessage', 'local_', 'list_sessions', 'user_asked', 'offer', 'initiation'])
    assert.ok(d.includes(t), t);
  assert.match(d, /no revises la sesión a cada rato; espera la nota/);
  assert.match(d, /si el nombre es otro/);
  assert.match(d, /si tienes una herramienta para abrir sesiones/i);
});

test('sección 9: sin esa herramienta queda el "abre una sesión nueva" y la Terminal', () => {
  assert.match(s9, /abre una sesión nueva en la carpeta X y pega esto/);
  assert.ok(s9.includes('tasks/encargo-'));
  assert.ok(s9.includes('ListAgents'));
});

test('sección 9: osascript solo bajo la etiqueta Mac, y Windows sin osascript', () => {
  const i = s9.indexOf('osascript');
  assert.ok(i > 0);
  assert.match(s9.slice(Math.max(0, i - 400), i), /\*\*Mac/);
  const w = s9.match(/\*\*Windows[^\n]*\n?[\s\S]*?(?=\n- |\n\n\*\*Mac|(?![\s\S]))/);
  assert.ok(w, 'falta la línea de Windows');
  assert.doesNotMatch(w[0], /osascript/);
  assert.match(w[0], /command -v wt\.exe/);
  assert.match(w[0], /wt\.exe -d "<carpeta>" claude "Lee tasks\/encargo-<fecha>\.md y hazlo"/);
  assert.match(w[0], /`;`/);
  assert.match(w[0], /`\$`/);
  assert.match(w[0], /comilla invertida/);
  assert.match(w[0], /termina en `\\`/);
  assert.doesNotMatch(w[0], /--continue/);
  assert.match(w[0], /abre una terminal nueva/);
});

test('sección 4: panel de tareas y sin equipos de agentes en Desktop', () => {
  assert.match(s4, /panel de tareas/);
  assert.match(s4, /equipos de agentes/);
  assert.match(s4, /Desktop/);
});

test('reglas + recetario: el texto completo que se inyecta cabe en el límite del hook', () => {
  const r = spawnSync('bash', [join(raiz, 'plugins/ceo-base/scripts/inyectar-reglas.sh'), 'reglas'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.ok([...r.stdout].length < 9800, `caracteres: ${[...r.stdout].length}`);
  assert.match(r.stdout, /^# Forma de trabajar \(setup-ceo, capa base\)/);
});

function mds(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) mds(p, out);
    else if (n.endsWith('.md')) out.push(p);
  }
  return out;
}

test('ningún .md de los plugins (salvo avisos) dice "revisar tu Mac" fuera de un bloque Mac', () => {
  const malos = [];
  for (const f of mds(join(raiz, 'plugins'))) {
    if (f.split(sep).includes('avisos')) continue;
    const lineas = readFileSync(f, 'utf8').replace(/\r\n/g, '\n').split('\n');
    lineas.forEach((l, i) => { if (/revisar? tu Mac/.test(l) && !/\bMac:|\*\*Mac/.test(l)) malos.push(`${f}:${i + 1}`); });
  }
  assert.deepEqual(malos, []);
});

test('docs de Desktop (es y en): mismos puntos clave en los dos idiomas', () => {
  const claves = [['start_session'], ['2.1.309'], ['Windows'], ['wt.exe'], ['panel de tareas', 'tasks pane'], ['equipos de agentes', 'agent teams']];
  const es = leer('docs/claude-desktop.md'), en = leer('docs/claude-desktop.en.md');
  for (const [a, b = a] of claves) {
    assert.ok(es.includes(a), `es: ${a}`);
    assert.ok(en.includes(b), `en: ${b}`);
  }
});

test('regla 13 de reglas-ceo: abre la sesión tú si tienes la herramienta', () => {
  assert.match(leer('plugins/ceo-base/reglas/reglas-ceo.md'), /13\. \*\*Una sesión por proyecto\.\*\*[^\n]*ábrela tú si tienes la herramienta para abrir sesiones/);
});

test('adaptar: el saludo del arranque no dice "esta Mac"', () => {
  const md = leer('plugins/adaptar/skills/adaptar-a-mi/SKILL.md');
  assert.match(md, /Veo que ya hay cosas de Claude en esta computadora/);
  assert.doesNotMatch(md, /esta Mac/);
});

const usar = leer('plugins/ceo-base/skills/usar-la-app/SKILL.md');
const descUsar = usar.match(/^description: (.*)$/m)?.[1] ?? '';

test('usar-la-app: pasos de sesión nueva en Windows y Mac', () => {
  for (const t of ['Ctrl+N', 'Cmd+N', 'Local', 'Open folder', 'Mi CEO', 'un paso'])
    assert.ok(usar.includes(t), t);
  assert.ok(descUsar.includes('sesión'));
  assert.ok(descUsar.includes('esta carpeta es mi CEO'));
  assert.ok(descUsar.includes('enséñame a usar la app'));
  assert.ok(usar.split('\n').length <= 90);
});

test('usar-la-app: marcar mi CEO con respaldo', () => {
  for (const t of ['.respaldos', 'Sesión principal:', 'pwd -W', 'cuál gana', 'próxima sesión'])
    assert.ok(usar.includes(t), t);
  assert.ok(usar.indexOf('.respaldos') < usar.indexOf('pwd -W'), 'el respaldo va primero');
});
