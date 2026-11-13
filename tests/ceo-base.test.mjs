import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

import { raiz } from './ayuda.mjs';
const leer = (r) => readFileSync(join(raiz, r), 'utf8');
test('regla 3: solo horarios sin envíos del perfil; Shabbat ya no existe (decisión del 23-oct)', () => {
  const r = leer('plugins/ceo-base/reglas/reglas-ceo.md');
  assert.match(r, /Horarios sin envíos: <\.\.\.>/);
  for (const f of ['plugins/ceo-base/reglas/reglas-ceo.md', 'plugins/ceo-base/skills/forma-de-trabajar/SKILL.md', 'plugins/ceo-base/skills/nueva-cabeza/SKILL.md']) {
    assert.doesNotMatch(leer(f), /shabbat|shabat|yom tov|kosher/i, f);
  }
  for (const f of ['plugins/ceo-base/skills/forma-de-trabajar/SKILL.md', 'plugins/ceo-base/skills/nueva-cabeza/SKILL.md']) {
    assert.match(leer(f), /Horarios sin envíos/, f);
  }
});

test('perfil-campos no pide preguntar por religión ni por horarios', () => {
  const p = leer('plugins/ceo-base/perfil-campos.md');
  assert.doesNotMatch(p, /shabbat|religi|yom tov|kosher/i);
  assert.match(p, /Horarios sin envíos\*\* \(no se pregunta\)/);
});

test('existe la regla 12 de seguridad', () => {
  assert.match(leer('plugins/ceo-base/reglas/reglas-ceo.md'), /^12\. \*\*Seguridad en una línea\.\*\*.*\/seguridad:revisar-mi-seguridad/m);
});

function correr(home, conPerfil) {
  if (conPerfil) {
    mkdirSync(join(home, '.claude/mi-perfil'), { recursive: true });
    writeFileSync(join(home, '.claude/mi-perfil/ceo.md'), 'PERFIL-DE-PRUEBA Guarda Shabbat: no\n');
  }
  return spawnSync('bash', [join(raiz, 'plugins/ceo-base/scripts/inyectar-reglas.sh')], {
    env: { HOME: home, PATH: process.env.PATH }, encoding: 'utf8',
  });
}

test('inyectar-reglas.sh imprime reglas y recetario, con y sin perfil', () => {
  const sin = correr(mkdtempSync(join(tmpdir(), 'cb-')), false);
  assert.equal(sin.status, 0, sin.stderr);
  assert.match(sin.stdout, /Seguridad en una línea/);
  assert.match(sin.stdout, /Recetario: qué cadena de skills usar/);
  assert.doesNotMatch(sin.stdout, /Perfil del dueño/);
  const con = correr(mkdtempSync(join(tmpdir(), 'cb-')), true);
  assert.equal(con.status, 0, con.stderr);
  assert.match(con.stdout, /Recetario: qué cadena/);
  assert.match(con.stdout, /Perfil del dueño[\s\S]*PERFIL-DE-PRUEBA/);
});

test('el recetario trae las filas nuevas', () => {
  const r = leer('plugins/ceo-base/recetario.md');
  for (const x of ['`seguridad:revisar-mi-seguridad`', '`rules-migrate`', '`bug-hunt`', '`office-hours`']) assert.ok(r.includes(x), x);
  assert.ok(!existsSync(join(raiz, 'scripts/exportar-publico/ceo-base')));
});

test('perfil-campos de ceo-base trae los campos nuevos', () => {
  const p = leer('plugins/ceo-base/perfil-campos.md');
  for (const c of ['Tipo de persona', 'Nivel con IA', 'Temas que no toco', 'Cómo aprende', 'Tips ya dados', 'Horarios sin envíos', 'Modo']) assert.ok(p.includes(c), c);
  assert.match(leer('plugins/negocios/perfil-campos.md'), /Solo se pregunta si la rama es fundador/);
});

test('programar: plugin.json y sus 2 skills, sin nombres privados ni Joseph', () => {
  // solo en el repo privado: sin la lista de privacidad solo se revisa lo demás
  const pj = JSON.parse(leer('plugins/programar/.claude-plugin/plugin.json'));
  assert.equal(pj.name, 'programar');
  assert.equal(pj.version, leer('CHANGELOG.md').match(/^## (\d+\.\d+\.\d+)/m)[1]);
  const priv = (existsSync(join(raiz, 'scripts/privacidad.txt')) ? leer('scripts/privacidad.txt') : '').split('\n').filter((l) => /^[is] /.test(l))
    .map((l) => new RegExp(l.slice(2), l[0] === 'i' ? 'i' : ''));
  const archivos = ['plugins/programar/README.md']; // plugin.json lleva el autor por contrato
  for (const s of ['bug-hunt', 'rules-migrate']) {
    const f = `plugins/programar/skills/${s}/SKILL.md`;
    archivos.push(f);
    const m = leer(f).match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
    assert.ok(m, `${f}: frontmatter`);
    assert.equal(m[1], s);
    assert.ok(m[2].length >= 20);
  }
  for (const f of archivos) {
    const t = leer(f);
    assert.doesNotMatch(t, /\bJoseph\b/, f);
    for (const re of priv) assert.doesNotMatch(t, re, `${f} ${re}`);
    assert.doesNotMatch(t, /mcp__|chrome-devtools|\/bootstrap|CLAUDE\.md Hard rule/, f);
  }
  assert.ok(readdirSync(join(raiz, 'plugins/programar/skills')).length === 2);
});

test('regla 4: Opus solo plata, clientes y revisión final', () => {
  assert.match(leer('plugins/ceo-base/reglas/reglas-ceo.md'), /^4\. \*\*Delegar\.\*\*.*Sonnet para lo normal.*Opus solo para plata.*revisión final/m);
});

test('reglas 21 y 22', () => {
  const r = leer('plugins/ceo-base/reglas/reglas-ceo.md');
  assert.match(r, /^21\. \*\*Nivel técnico\.\*\*.*accesos, códigos y decisiones.*pregúntalo una vez/m);
  assert.match(r, /^22\. .*ceo-base:auditor/m);
});

test('glosario: palabras clave con ejemplo, sin emojis', () => {
  const g = leer('plugins/ceo-base/skills/forma-de-trabajar/glosario.md');
  for (const x of ['Sesión', 'Agente', 'Skill', 'MCP', 'API', 'GitHub', 'Terminal', 'Límite de uso']) assert.ok(g.includes(`**${x}**:`), x);
  assert.doesNotMatch(g, /\p{Extended_Pictographic}/u);
  const n = g.split('\n').filter((l) => /^\*\*[^*]+\*\*: /.test(l)).length;
  assert.ok(n >= 12 && n <= 16, `entradas: ${n}`);
});

test('SKILL §10: nivel 4 no es solo haber usado Claude Code; "(por definir)" cuenta como falta; respaldo con lugar', () => {
  const s = leer('plugins/ceo-base/skills/forma-de-trabajar/SKILL.md');
  const sec = s.slice(s.indexOf('## 10. Nivel técnico'), s.indexOf('## 11.'));
  assert.match(sec, /Haber usado Claude Code NO la sube a nivel 4/);
  assert.match(sec, /dice `\(por definir\)`, cuenta como que falta/);
  assert.match(sec, /~\/\.claude\/mi-perfil\/\.respaldos\//);
});

test('auditor: existe, modelo sonnet, no edita, sin rutas de nadie', () => {
  const a = leer('plugins/ceo-base/agents/auditor.md');
  const m = a.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(m, 'frontmatter');
  assert.match(m[1], /^name: auditor$/m);
  assert.match(m[1], /^model: sonnet$/m);
  const cuerpo = m[2];
  assert.match(m[1], /^description:.*model: opus/m, 'la descripción pide Opus para plata, clientes y contratos');
  assert.match(m[1], /^description:.*sin tu opinión/m);
  assert.match(m[1], /^disallowedTools:.*\bEdit\b.*\bWrite\b.*\bNotebookEdit\b/m);
  assert.doesNotMatch(m[1], /^tools:/m);
  for (const v of ['PASA', 'NO PASA', 'NO APLICA']) assert.match(cuerpo, new RegExp(`^- \\*\\*${v}\\*\\*:`, 'm'), v);
  assert.match(cuerpo, /primera línea/);
  assert.match(cuerpo, /nunca edita/i);
  assert.match(cuerpo, /sk-\[tapado\]/);
  assert.match(cuerpo, /no manda, cobra, publica ni cambia nada/);
  assert.match(cuerpo, /no se puede comprobar[^\n]*NO PASA/);
  assert.match(cuerpo, /model: opus/);
  assert.ok(cuerpo.split('\n').length <= 60, 'máximo 60 líneas');
  assert.doesNotMatch(a, /\/Users\/|josepheshkenazi|veredictos/);
  assert.doesNotMatch(a, /\p{Extended_Pictographic}/u);
});
