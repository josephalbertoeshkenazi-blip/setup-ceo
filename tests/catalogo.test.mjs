// Guards plugins/complementos/skills/instalar-complementos/catalogo.json (esquema 2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { raiz } from './ayuda.mjs';
const ruta = join(raiz, 'plugins/complementos/skills/instalar-complementos');
const cat = JSON.parse(readFileSync(join(ruta, 'catalogo.json'), 'utf8'));
const piezas = cat.piezas;
const TERCEROS = ['plugin-tercero', 'skill-git', 'pypi', 'brew'];
const terceros = piezas.filter((p) => TERCEROS.includes(p.tipo));
const ETIQUETAS = ['empleado', 'estudiante', 'fundador', 'creativo', 'personal', 'principiante', 'programa', 'ideas'];
const comandos = (p) => [...(p.instalar ?? []), ...(p.desinstalar ?? [])];

test('esquema 2, ids únicos y tipos conocidos', () => {
  assert.equal(cat.esquema, 2);
  const ids = piezas.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of piezas) {
    assert.ok(['plugin-propio', 'plugin-tercero', 'skill-git', 'pypi', 'brew', 'conector-guia'].includes(p.tipo), p.id);
    assert.ok(p.para_que?.es && p.para_que?.en, `${p.id} sin para_que es/en`);
  }
  for (const id of ['superpowers', 'gstack', 'graphify', 'impeccable', 'last30days', 'avoid-ai-writing', 'hyperframes', 'claude-video-vision', 'repo-eval'])
    assert.ok(ids.includes(id), id);
});

test('licencias de terceros permitidas', () => {
  for (const p of terceros) assert.ok(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'].includes(p.licencia), `${p.id}: ${p.licencia}`);
});

test('repo_eval GREEN y de menos de 90 días (usa la fecha de hoy)', () => {
  for (const p of terceros) {
    assert.equal(p.repo_eval?.veredicto, 'GREEN', p.id);
    assert.ok(p.repo_eval.evidencia, `${p.id} sin evidencia`);
    const dias = (Date.now() - new Date(p.repo_eval.fecha).getTime()) / 86400000;
    assert.ok(dias >= 0 && dias < 90, `${p.id}: repo_eval de hace ${Math.round(dias)} días`);
  }
});

test('pin: commit de 40 hex, o ==versión en pypi', () => {
  for (const p of terceros) {
    if (p.tipo === 'pypi') assert.match(p.pin.commit, /^==\d+(\.\d+)+$/, p.id);
    else assert.match(p.pin.commit, /^[0-9a-f]{40}$/, p.id);
  }
  const g = piezas.find((p) => p.tipo === 'pypi');
  assert.ok(comandos(g).some((c) => c.includes(`graphifyy${g.pin.commit}`)));
});

test('fuente: https de github.com', () => {
  for (const p of terceros) assert.match(p.fuente, /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/, p.id);
});

test('marketplace add de terceros termina en #etiqueta (excepción: marketplace oficial de Anthropic)', () => {
  // Excepción documentada: superpowers se instala del marketplace oficial (anthropics/claude-plugins-official),
  // que ya fija el commit revisado; ese marketplace no admite #etiqueta.
  let vistos = 0;
  for (const p of piezas) for (const c of comandos(p)) {
    const m = c.match(/claude plugin marketplace add (\S+)/);
    if (!m) continue;
    vistos++;
    if (m[1].startsWith('anthropics/')) { assert.equal(p.id, 'superpowers'); continue; }
    assert.match(m[1], /#[\w.\-]+$/, `${p.id}: ${m[1]}`);
    assert.equal(m[1].split('#')[1], p.pin.etiqueta, `${p.id}: la etiqueta no coincide con el pin`);
  }
  assert.ok(vistos >= 6);
});

test('ningún comando con sudo, curl|sh, npx ni eval', () => {
  for (const p of piezas) for (const c of comandos(p)) {
    assert.doesNotMatch(c, /\bsudo\b|curl[^\n]*\|\s*(ba|z)?sh|\bnpx\b|\beval\b/, `${p.id}: ${c}`);
  }
});

test('perfiles dentro de las 8 etiquetas y cada perfil con ≥ 2 piezas (personal ≥ 1 + conector)', () => {
  for (const p of piezas) for (const e of p.perfiles) assert.ok(ETIQUETAS.includes(e), `${p.id}: ${e}`);
  const por = (e) => piezas.filter((p) => p.perfiles.includes(e));
  for (const e of ETIQUETAS) {
    if (e === 'personal') {
      assert.ok(por(e).length >= 1);
      assert.ok(por(e).some((p) => p.tipo === 'conector-guia'), 'personal sin conector');
    } else assert.ok(por(e).length >= 2, `${e}: ${por(e).length} piezas`);
  }
  const gs = piezas.find((p) => p.id === 'gstack');
  assert.deepEqual(gs.perfiles, ['programa', 'fundador', 'ideas']);
  assert.equal(gs.peso, 'pesado');
});

test('nivel_minimo y peso con valores conocidos', () => {
  for (const p of piezas) {
    assert.ok(['principiante', 'intermedio', 'avanzado'].includes(p.nivel_minimo), p.id);
    assert.ok(['liviano', 'medio', 'pesado'].includes(p.peso), p.id);
    assert.ok(Array.isArray(p.senales) && p.senales.length > 0, `${p.id} sin señales`);
    assert.ok(p.verificar, `${p.id} sin verificar`);
  }
});

test('lo que toca fuera está declarado (graphify, gstack, last30days, impeccable, video-vision)', () => {
  const t = (id) => piezas.find((p) => p.id === id).toca_fuera.join(' ');
  assert.match(t('graphify'), /graphify agrega un bloque a tu CLAUDE\.md/);
  assert.match(t('gstack'), /brew install oven-sh\/bun\/bun/);
  assert.match(t('gstack'), /Chromium/);
  assert.match(t('last30days'), /yt-dlp/);
  assert.match(t('last30days'), /cookies/);
  assert.match(t('impeccable'), /~\/\.impeccable\/bin\//);
  assert.match(t('claude-video-vision'), /Gemini u OpenAI/);
  assert.match(t('superpowers'), /ya existe/);
});

test('conector-guia: abre la página de conectores, no instala', () => {
  const cs = piezas.filter((p) => p.tipo === 'conector-guia');
  assert.equal(cs.length, 3);
  for (const c of cs) { assert.deepEqual(c.instalar, []); assert.match(c.abrir, /^https:\/\/claude\.ai\//); }
});

test('SKILL.md: sin sí no hay instalación, lee catalogo.json y no instala desde sus bloques', () => {
  const sk = readFileSync(join(ruta, 'SKILL.md'), 'utf8');
  assert.match(sk.split('---')[1], /^disable-model-invocation: true$/m);
  assert.ok(existsSync(join(ruta, 'catalogo.json')) && !existsSync(join(ruta, 'catalogo.md')));
  assert.match(sk, /catalogo\.json/);
  assert.match(sk, /Nada se instala sin el sí del dueño/);
  const [a, b, c] = ['## Paso 3: puerta 1', '## Paso 5: puerta 2', '## Paso 6: instala'].map((x) => sk.indexOf(x));
  assert.ok(a > 0 && a < b && b < c);
  assert.match(sk, /Sin un "sí" claro, no instalas/);
  assert.match(sk, /no instalé nada/);
  assert.match(sk, /No uses `sudo`/);
  assert.match(sk, /\$ARGUMENTS/);
  assert.match(sk, /\/reload-plugins/);
  for (const [, b2] of sk.matchAll(/```[a-z]*\n(.*?)```/gs))
    assert.doesNotMatch(b2, /plugin (install|marketplace add)|git clone|pip install|pipx install|uv tool|npm |npx |curl|sudo|brew install|\.\/setup/);
});

test('el plugin complementos no trae hooks ni scripts', () => {
  const base = join(raiz, 'plugins/complementos');
  assert.ok(!existsSync(join(base, 'hooks')));
  const todos = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? todos(join(d, e.name)) : [join(d, e.name)]));
  assert.deepEqual(todos(base).filter((f) => /\.(sh|py|js|mjs|command)$/.test(f)), []);
});

test('cada skill nombrada en el recetario existe en el catálogo o en los plugins', () => {
  const nuevo = join(raiz, 'plugins/ceo-base/recetario.md');
  const viejo = join(raiz, 'scripts/exportar-publico/ceo-base/recetario.md');
  const rec = readFileSync(existsSync(nuevo) ? nuevo : viejo, 'utf8');
  const usadas = new Set([...rec.matchAll(/`([a-z][a-z0-9-]+(?::[a-z0-9-]+)?)`/g)].map((m) => m[1]));
  const existentes = new Set();
  for (const p of piezas) { existentes.add(p.id); for (const s of p.skills ?? []) existentes.add(s); }
  const plugins = join(raiz, 'plugins');
  for (const pl of readdirSync(plugins)) {
    const sd = join(plugins, pl, 'skills');
    if (!existsSync(sd)) continue;
    for (const s of readdirSync(sd)) { existentes.add(s); existentes.add(`${pl}:${s}`); }
  }
  // Hoy el recetario viejo aún cita bug-hunt: lo cubre el plugin programar del catálogo.
  assert.deepEqual([...usadas].filter((u) => !existentes.has(u)), []);
  assert.ok(usadas.has('claude-video-vision:watch-video'));
});
