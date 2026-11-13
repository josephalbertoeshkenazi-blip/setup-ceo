// Hojas del equipo: instalar en Windows y Mac, y actualizar. Una página cada una al imprimir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { raiz } from './ayuda.mjs';
const leer = (f) => readFileSync(join(raiz, f), 'utf8');

// Filas de tabla (sin el encabezado ni la línea de guiones) bajo el primer título que contiene "Errores".
function filasDeErrores(t) {
  const i = t.search(/^#+ .*Errores/m);
  assert.ok(i >= 0, 'falta un título con "Errores"');
  const resto = t.slice(i).split('\n').slice(1);
  const fin = resto.findIndex((l, k) => k > 0 && /^#+ /.test(l));
  const bloque = (fin < 0 ? resto : resto.slice(0, fin)).filter((l) => l.trim().startsWith('|'));
  return bloque.slice(2);
}

// Texto dentro de bloques ``` ``` (se imprime en una sola línea, sin partirse).
function bloques(t) {
  return [...t.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
}
const enBloque = (t, s) => bloques(t).some((b) => b.includes(s));

test('hoja Windows: Git, Python, CLI, carpeta Mi CEO, prueba positiva, errores', () => {
  const t = leer('docs/equipo/instalar-windows.md');
  for (const s of [
    'winget install -e --id Git.Git',
    'winget install -e --id Python.Python.3.12',
    'irm https://claude.ai/install.ps1 | iex',
    'Add plugins',
    'Mi CEO',
    'Ctrl+N',
    'regla 20',
    'Modo no molestar',
    '/adaptar:adaptar-a-mi',
    'falta Python',
  ]) assert.ok(t.includes(s), `falta: ${s}`);
  assert.ok(filasDeErrores(t).length >= 6);
});

test('hoja Mac', () => {
  const t = leer('docs/equipo/instalar-mac.md');
  for (const s of ['xcode-select --install', 'install.sh', 'Cmd+N', 'Mi CEO', 'regla 20', '/adaptar:adaptar-a-mi'])
    assert.ok(t.includes(s), `falta: ${s}`);
  assert.ok(filasDeErrores(t).length >= 4);
});

test('actualizar: una sola frase, mi-perfil intacto', () => {
  const t = leer('docs/equipo/actualizar.md');
  assert.ok(t.includes('actualízate'));
  assert.ok(t.includes('marketplace update setup-ceo'));
  assert.ok(t.includes('mi-perfil'));
});

test('el README enlaza a las hojas del equipo', () => {
  assert.ok(leer('README.md').includes('docs/equipo/instalar-windows.md'));
});

test('PDFs existen y son de 1 página', () => {
  for (const n of ['instalar-windows', 'instalar-mac']) {
    const p = join(raiz, 'docs/equipo/pdf', `${n}.pdf`);
    assert.ok(existsSync(p), `falta ${n}.pdf`);
    const paginas = (readFileSync(p, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    assert.equal(paginas, 1, `${n}.pdf tiene ${paginas} páginas`);
  }
});

test('sin nombres de empresa ni datos personales', () => {
  const base = join(raiz, 'docs/equipo');
  for (const f of readdirSync(base, { recursive: true })) {
    if (!/\.(md|txt)$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(join(base, f), 'utf8'), /Benny|josepheshkenazi|@gmail/i, f);
  }
});

test('CI de Windows: buscar-claude.sh debe encontrar el instalador oficial', () => {
  const y = leer('.github/workflows/pruebas.yml');
  assert.ok(y.includes('plugins/actualizaciones/scripts/buscar-claude.sh'));
});

test('Windows: cada comando va en su bloque, con PowerShell explicado y sin preguntas de winget', () => {
  const t = leer('docs/equipo/instalar-windows.md');
  for (const s of [
    'winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements',
    'winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements',
    'irm https://claude.ai/install.ps1 | iex',
    'josephalbertoeshkenazi-blip/setup-ceo',
  ]) assert.ok(enBloque(t, s), `no está en un bloque: ${s}`);
  assert.ok(t.includes('Windows PowerShell'));
  assert.match(t, /escribe Y/);
  assert.match(t, /sin buscar archivos/);
  assert.match(t, /clic derecho en el ícono de Claude junto al reloj/);
  assert.match(t, /App Installer/);
  assert.match(t, /Tu CEO dice que falta Python/);
  assert.doesNotMatch(t, /pide al dueño|WSL: sin plugins/);
});

test('Mac: cada comando va en su bloque, con licencia, .dmg y Gatekeeper al día', () => {
  const t = leer('docs/equipo/instalar-mac.md');
  for (const s of ['xcode-select --install', 'curl -fsSL https://claude.ai/install.sh | bash', 'josephalbertoeshkenazi-blip/setup-ceo'])
    assert.ok(enBloque(t, s), `no está en un bloque: ${s}`);
  assert.match(t, /Aceptar/);
  assert.match(t, /arrastra Claude a Aplicaciones/);
  assert.match(t, /Privacidad y seguridad/);
  assert.match(t, /sin buscar archivos/);
  assert.match(t, /Tu CEO dice que falta Python/);
  assert.doesNotMatch(t, /pide al dueño/);
});

test('las tres hojas explican "enséñame a usar la app"', () => {
  for (const f of ['instalar-windows', 'instalar-mac', 'actualizar'])
    assert.ok(leer(`docs/equipo/${f}.md`).includes('enséñame a usar la app'), f);
});

test('CI: el respaldo de Windows se prueba sin el PATH del instalador', () => {
  const y = leer('.github/workflows/pruebas.yml');
  assert.ok(y.includes('PATH=/usr/bin:/bin bash plugins/actualizaciones/scripts/buscar-claude.sh'));
  assert.ok(y.includes('*/.local/bin/claude.exe'));
});
