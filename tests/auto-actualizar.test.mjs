// ajustes.sh: deja el auto-update del setup-ceo prendido en settings.json sin tocar la fuente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, statSync, symlinkSync, lstatSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { raiz, esWindows, entornoCasa, fingirWindows, BASH, aPosix, carpetaConHerramientas } from './ayuda.mjs';

const scripts = join(raiz, 'plugins/actualizaciones/scripts');
const GIT = { source: 'git', url: 'https://github.com/josephalbertoeshkenazi-blip/setup-ceo.git' };

function mundo({ known, settings, crudo, env: extra = {} } = {}) {
  const { home, env } = entornoCasa();
  const conf = join(home, '.claude');
  mkdirSync(join(conf, 'plugins'), { recursive: true });
  if (known !== undefined) writeFileSync(join(conf, 'plugins/known_marketplaces.json'), JSON.stringify({ 'setup-ceo': known }));
  const sf = join(conf, 'settings.json');
  if (settings !== undefined) writeFileSync(sf, JSON.stringify(settings));
  if (crudo !== undefined) writeFileSync(sf, crudo);
  return { home, conf, sf, env: { ...env, ...extra } };
}
const correr = (w, fn, ...a) =>
  spawnSync(BASH, ['-c', `. "${aPosix(scripts)}/comun.sh"; . "${aPosix(scripts)}/ajustes.sh"; ${fn} "$@"`, '_', ...a], { encoding: 'utf8', env: w.env });
const leer = (f) => JSON.parse(readFileSync(f, 'utf8'));
const entrada = (w) => leer(w.sf).extraKnownMarketplaces['setup-ceo'];

test('crea la entrada copiando la fuente git', () => {
  const w = mundo({ known: { source: GIT } });
  const r = correr(w, 'asegurar_auto');
  assert.equal(r.stdout, 'CAMBIO: activado\n');
  assert.deepEqual(entrada(w), { source: GIT, autoUpdate: true });
  assert.equal('ref' in entrada(w).source, false);
});

test('fuente github con mayúsculas', () => {
  const src = { source: 'github', repo: 'JosephAlbertoEshkenazi-blip/setup-ceo' };
  const w = mundo({ known: { source: src } });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: activado\n');
  assert.deepEqual(entrada(w).source, src);
});

test('respeta autoUpdate false de known', () => {
  const w = mundo({ known: { source: GIT, autoUpdate: false } });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: copiado\n');
  assert.equal(entrada(w).autoUpdate, false);
});

test('conserva todo lo demás y guarda copia del original', () => {
  const orig = {
    permissions: { allow: ['Bash(ls)'] },
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'echo hola' }] }] },
    extraKnownMarketplaces: { otro: { source: { source: 'github', repo: 'a/b' } } },
    nota: 'José ñandú',
  };
  const texto = JSON.stringify(orig, null, 4);
  const w = mundo({ known: { source: GIT }, crudo: texto });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: activado\n');
  const d = leer(w.sf);
  const esperado = structuredClone(orig);
  esperado.extraKnownMarketplaces['setup-ceo'] = { source: GIT, autoUpdate: true };
  assert.deepEqual(d, esperado);
  assert.equal(readFileSync(w.sf + '.antes-de-setup-ceo', 'utf8'), texto);
});

test('segunda vez no cambia nada', () => {
  const w = mundo({ known: { source: GIT } });
  correr(w, 'asegurar_auto');
  const antes = statSync(w.sf).mtimeMs;
  const bytes = readFileSync(w.sf, 'utf8');
  assert.equal(correr(w, 'asegurar_auto').stdout, 'SIN-CAMBIO\n');
  assert.equal(statSync(w.sf).mtimeMs, antes);
  assert.equal(readFileSync(w.sf, 'utf8'), bytes);
});

test('entrada con autoUpdate false: SIN-CAMBIO', () => {
  const w = mundo({ known: { source: GIT }, settings: { extraKnownMarketplaces: { 'setup-ceo': { source: GIT, autoUpdate: false } } } });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'SIN-CAMBIO\n');
  assert.equal(entrada(w).autoUpdate, false);
});

test('entrada sin autoUpdate: se activa', () => {
  const w = mundo({ known: { source: GIT }, settings: { extraKnownMarketplaces: { 'setup-ceo': { source: GIT } } } });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: activado\n');
  assert.deepEqual(entrada(w), { source: GIT, autoUpdate: true });
});

test('fuente distinta no se toca', () => {
  const texto = JSON.stringify({ extraKnownMarketplaces: { 'setup-ceo': { source: { ...GIT, ref: 'estable' } } } });
  const w = mundo({ known: { source: GIT }, crudo: texto });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: fuente-distinta\n');
  assert.equal(readFileSync(w.sf, 'utf8'), texto);
  assert.equal(existsSync(w.sf + '.antes-de-setup-ceo'), false);
});

test('known con ref: ref-propio', () => {
  const texto = JSON.stringify({ a: 1 });
  const w = mundo({ known: { source: { ...GIT, ref: 'ci-act-1-macOS-200' } }, crudo: texto });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: ref-propio\n');
  assert.equal(readFileSync(w.sf, 'utf8'), texto);
});

test('no toca forks', () => {
  const w = mundo({ known: { source: { source: 'git', url: 'https://github.com/otro/setup-ceo.git' } } });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: no-oficial\n');
  assert.equal(existsSync(w.sf), false);
});

test('sin fuente', () => {
  const w = mundo({});
  assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: sin-fuente\n');
});

test('settings inválido no se escribe', () => {
  const texto = '{ "a": 1, }';
  const w = mundo({ known: { source: GIT }, crudo: texto });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: settings-invalido\n');
  assert.equal(readFileSync(w.sf, 'utf8'), texto);
  assert.equal(correr(mundo({ known: { source: GIT }, crudo: '' }), 'asegurar_auto').stdout, 'OMITIDO: settings-invalido\n');
});

test('sin perl', () => {
  const w = mundo({ known: { source: GIT } });
  const bin = carpetaConHerramientas(['dirname', 'uname']);
  w.env = { ...w.env, PATH: bin };
  const r = spawnSync(BASH, ['-c', `. "${aPosix(scripts)}/comun.sh"; . "${aPosix(scripts)}/ajustes.sh"; asegurar_auto`], { encoding: 'utf8', env: w.env });
  assert.equal(r.stdout, 'OMITIDO: sin-perl\n');
  assert.equal(existsSync(w.sf), false);
});

test('enlace simbólico: se escribe en el archivo real', { skip: esWindows ? 'enlaces simbólicos en Windows' : false }, () => {
  const w = mundo({ known: { source: GIT } });
  const real = join(w.home, 'real.json');
  writeFileSync(real, JSON.stringify({ x: 1 }));
  symlinkSync(real, w.sf);
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: activado\n');
  assert.equal(lstatSync(w.sf).isSymbolicLink(), true);
  assert.deepEqual(leer(real).extraKnownMarketplaces['setup-ceo'], { source: GIT, autoUpdate: true });
  assert.equal(leer(real).x, 1);
});

test('poner_auto no y si', () => {
  const w = mundo({ known: { source: GIT } });
  assert.equal(correr(w, 'poner_auto', 'no').stdout, 'AUTO: no\n');
  assert.equal(entrada(w).autoUpdate, false);
  assert.equal(correr(w, 'asegurar_auto').stdout, 'SIN-CAMBIO\n');
  assert.equal(correr(w, 'poner_auto', 'si').stdout, 'AUTO: si\n');
  assert.equal(entrada(w).autoUpdate, true);
});

test('estado_auto', () => {
  const w = mundo({ known: { source: GIT } });
  assert.equal(correr(w, 'estado_auto').stdout, 'AUTO: sin-dato\nREF: ninguno\nFUENTE: oficial\n');
  correr(w, 'asegurar_auto');
  assert.equal(correr(w, 'estado_auto').stdout, 'AUTO: si\nREF: ninguno\nFUENTE: oficial\n');
  assert.equal(correr(mundo({}), 'estado_auto').stdout, 'AUTO: sin-dato\nREF: ninguno\nFUENTE: ninguna\n');
  const k = mundo({ known: { source: { ...GIT, ref: 'x' }, autoUpdate: false } });
  assert.equal(correr(k, 'estado_auto').stdout, 'AUTO: no\nREF: x\nFUENTE: oficial\n');
});

test('CLAUDE_CONFIG_DIR manda sobre HOME/.claude', () => {
  const otra = mkdtempSync(join(tmpdir(), 'conf-'));
  mkdirSync(join(otra, 'plugins'), { recursive: true });
  writeFileSync(join(otra, 'plugins/known_marketplaces.json'), JSON.stringify({ 'setup-ceo': { source: GIT } }));
  const w = mundo({ env: { CLAUDE_CONFIG_DIR: otra } });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: activado\n');
  assert.deepEqual(leer(join(otra, 'settings.json')).extraKnownMarketplaces['setup-ceo'], { source: GIT, autoUpdate: true });
  assert.equal(existsSync(w.sf), false);
});

test('CLAUDE_CONFIG_DIR con ruta C:\\ pasa por ruta_unix (Windows fingido)', { skip: esWindows ? 'solo con Windows fingido' : false }, () => {
  const w = mundo({});
  w.env = fingirWindows({ ...w.env, CLAUDE_CONFIG_DIR: 'C:\\Users\\José Pérez\\.claude' });
  const cyg = mkdtempSync(join(tmpdir(), 'cyg-'));
  writeFileSync(join(cyg, 'cygpath'), '#!/bin/sh\necho /conf-falso\n', { mode: 0o755 });
  w.env.PATH = `${cyg}:${w.env.PATH}`;
  const r = correr(w, 'archivo_ajustes');
  assert.equal(r.stdout, '/conf-falso/settings.json\n');
});
