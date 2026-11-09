// Docs for the 2.3.0 self-update: rule 11, risk lines, the one-time step for 2.0-2.2, no branch pins, versions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFileSync(join(raiz, r), 'utf8');

function mds(dir = raiz, salida = []) {
  for (const n of readdirSync(dir)) {
    if (n === '.git' || n === 'node_modules' || n === '.superpowers') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) mds(p, salida);
    else if (n.endsWith('.md')) salida.push(p);
  }
  return salida;
}

test('regla 11 nueva', () => {
  const r = leer('plugins/ceo-base/reglas/reglas-ceo.md');
  assert.match(r, /se actualiza solo/);
  assert.match(r, /no te actualices solo/);
  assert.ok(!r.includes('espera su sí antes de instalarlas'));
});

test('riesgo en una línea', () => {
  assert.match(leer('README.md'), /^Riesgo: /m);
  assert.match(leer('README.en.md'), /^Risk: /m);
});

test('paso para 2.0/2.1/2.2', () => {
  const cmd = 'claude plugin update actualizaciones@setup-ceo';
  assert.ok(leer('README.md').includes(cmd));
  assert.ok(leer('README.en.md').includes(cmd));
  const cl = leer('CHANGELOG.md');
  const seccion = cl.slice(cl.indexOf('## 2.3.0 ('), cl.indexOf('## 2.2.0 ('));
  assert.ok(seccion.includes(cmd));
});

test('ningún doc fija la instalación a una rama', () => {
  for (const f of mds()) assert.ok(!readFileSync(f, 'utf8').includes('setup-ceo#'), f);
});

test('catálogo sin "solo instala con tu sí"', () => {
  assert.ok(!leer('.claude-plugin/marketplace.json').includes('solo instala con tu sí'));
});

test('versiones 2.3.0', () => {
  const primera = leer('CHANGELOG.md').match(/^## ([0-9]+\.[0-9]+\.[0-9]+)/m)[1];
  assert.equal(primera, '2.3.0');
  for (const d of readdirSync(join(raiz, 'plugins'))) {
    const pj = JSON.parse(leer(`plugins/${d}/.claude-plugin/plugin.json`));
    assert.equal(pj.version, '2.3.0', d);
  }
});
