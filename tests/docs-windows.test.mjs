// Documentos de Windows: requisitos, pasos para Claude, lista de prueba en una PC real y problemas comunes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { raiz } from './ayuda.mjs';
const leer = (f) => readFileSync(join(raiz, f), 'utf8');

for (const [idioma, f] of [['ES', 'README.md'], ['EN', 'README.en.md']]) {
  test(`${f}: requisitos de Windows con Git for Windows, y la línea de Mac intacta`, () => {
    const t = leer(f);
    assert.match(t, /Windows 10/);
    assert.match(t, /Git for Windows/);
    assert.ok(t.includes('irm https://claude.ai/install.ps1 | iex'));
    assert.ok(t.includes('winget install --id Git.Git -e'));
    assert.ok(t.includes('curl -fsSL https://claude.ai/install.sh | bash'));
  });

  test(`${f}: los pasos para Claude cubren Git, reabrir y la ruta de claude.exe`, () => {
    const t = leer(f);
    const i = t.indexOf(idioma === 'ES' ? '## Para tu Claude' : '## For your Claude');
    assert.ok(i > 0);
    const seccion = t.slice(i, t.indexOf('\n## ', i + 5));
    assert.ok(seccion.includes('git --version'));
    assert.ok(seccion.includes('winget install --id Git.Git -e'));
    assert.match(seccion, idioma === 'ES' ? /cierre y vuelva a abrir|cierre y abra/ : /close and reopen/i);
    assert.ok(seccion.includes('"$HOME/.local/bin/claude.exe"'));
  });

  test(`${f}: ya no dice "tu Mac" donde aplica a las dos computadoras`, () => {
    const t = leer(f);
    assert.doesNotMatch(t, /revisa tu Mac|reviews your Mac|check of your Mac/);
  });

  test(`${f}: Actualizar avisa a quien ya está en Windows con 2.0 o 2.1`, () => {
    const t = leer(f);
    assert.ok(t.includes('claude plugin marketplace update setup-ceo'));
    assert.match(t, /2\.0/);
    assert.match(t, /2\.1/);
  });
}

for (const f of ['docs/problemas.md', 'docs/problemas.en.md']) {
  test(`${f}: sección de Windows`, () => {
    const t = leer(f);
    assert.match(t, /Git for Windows/);
    assert.ok(t.includes('py -3'));
    assert.match(t, /Microsoft Store/);
    assert.match(t, /Avisos/);
    assert.match(t, /Mac/);
    assert.ok(t.includes('claude plugin marketplace update setup-ceo'));
    assert.match(t, /2\.0/);
  });
}

test('docs/probar-en-windows.md: máximo 15 pasos y lo que hay que mandar de vuelta', () => {
  const f = 'docs/probar-en-windows.md';
  assert.ok(existsSync(join(raiz, f)));
  const t = leer(f);
  const pasos = t.match(/^\d+\. /gm) || [];
  assert.ok(pasos.length >= 8 && pasos.length <= 15, `pasos: ${pasos.length}`);
  for (const x of ['/adaptar:adaptar-a-mi', '/seguridad:revisar-mi-seguridad', '/actualizaciones:novedades']) assert.ok(t.includes(x), x);
  assert.match(t, /espacio/i);
  assert.match(t, /captura de pantalla/i);
  assert.doesNotMatch(t, /[\u{1F300}-\u{1FAFF}☀-➿]/u);
});

test('docs/probar-en-windows.en.md: el espejo en inglés tiene los mismos pasos y comandos', () => {
  const es = leer('docs/probar-en-windows.md').match(/^\d+\. /gm) || [];
  const t = leer('docs/probar-en-windows.en.md');
  const pasos = t.match(/^\d+\. /gm) || [];
  assert.equal(pasos.length, es.length);
  for (const x of ['/adaptar:adaptar-a-mi', '/seguridad:revisar-mi-seguridad', '/actualizaciones:novedades']) assert.ok(t.includes(x), x);
  assert.doesNotMatch(t, /[\u{1F300}-\u{1FAFF}☀-➿]/u);
});

test('avisos: la skill de instalar se niega en Windows en una línea', () => {
  const t = leer('plugins/avisos/skills/instalar/SKILL.md');
  assert.match(t, /Windows/);
  assert.match(t, /Avisos es solo para Mac; en Windows no se instala\./);
  assert.match(t, /detente sin cambiar nada/);
});

test('la tienda de plugins y la tabla de conectores no dicen "tu Mac" donde vale para las dos', () => {
  const m = JSON.parse(leer('.claude-plugin/marketplace.json'));
  const seg = m.plugins.find((p) => p.name === 'seguridad').description;
  assert.doesNotMatch(seg, /tu Mac/);
  assert.match(seg, /Mac o Windows/);
  assert.match(leer('README.md'), /\| Archivos de tu computadora \|/);
  assert.match(leer('README.en.md'), /\| Files on your computer \|/);
});
