// El plugin diseno sale al público: sin nombres privados, con el foco siempre visible
// y con los agentes leyendo el gusto de la persona.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

import { raiz } from './ayuda.mjs';
const plugin = join(raiz, 'plugins/diseno');

function archivos(dir) {
  const salida = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) salida.push(...archivos(p));
    else if (/\.(md|css|html|json|js|mjs|sh|txt)$/.test(n)) salida.push(p);
  }
  return salida;
}
const todos = archivos(plugin);
const leer = (p) => readFileSync(p, 'utf8');
const nombre = (p) => relative(raiz, p);

// La lista de privacidad compartida, si existe en esta copia del repo.
// solo en el repo privado: la lista de privacidad no se publica; sin ella solo corren los términos propios del plugin.
const hayLista = existsSync(join(raiz, 'scripts/privacidad.txt'));
const lista = (hayLista ? leer(join(raiz, 'scripts/privacidad.txt')) : '')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => ({ flags: l[0] === 'i' ? 'i' : '', fuente: l.slice(2) }))
  .map((r) => new RegExp(r.fuente, r.flags));
// Términos de este plugin. plugin.json lleva el nombre del autor, que es atribución pública.
const extras = [/\bJoseph\b/i, /CEO\/investigacion/i];

test('el plugin tiene archivos que revisar', () => {
  assert.ok(todos.length > 15);
});

test('ningún nombre privado en plugins/diseno/', () => {
  const hallazgos = [];
  for (const p of todos) {
    const esManifiesto = p.replace(/\\/g, '/').endsWith('.claude-plugin/plugin.json');
    leer(p).split('\n').forEach((linea, i) => {
      for (const re of lista) if (re.test(linea)) hallazgos.push(`${nombre(p)}:${i + 1} ${re}`);
      if (!esManifiesto) for (const re of extras) if (re.test(linea)) hallazgos.push(`${nombre(p)}:${i + 1} ${re}`);
    });
  }
  assert.deepEqual(hallazgos, []);
});

test('todo outline: none / outline: 0 tiene un marcador de foco a 5 líneas o menos', () => {
  const quita = /outline\s*:\s*(none|0)\b/i;
  const marcador = /::before|::after|box-shadow|border(-color)?\s*:|text-decoration|outline\s*:\s*[1-9]|outline-color|forced-colors/i;
  const sin = [];
  for (const p of todos.filter((f) => /\.(css|html|md)$/.test(f))) {
    const ls = leer(p).split('\n');
    ls.forEach((l, i) => {
      if (!quita.test(l)) return;
      const ventana = ls.slice(Math.max(0, i - 5), i + 6).join('\n');
      // la propia línea de quitar no cuenta como marcador: se le quita esa parte
      const sinPropia = ventana.replace(l, l.replace(quita, ''));
      if (!marcador.test(sinPropia)) sin.push(`${nombre(p)}:${i + 1}`);
    });
  }
  assert.deepEqual(sin, []);
});

test('el PLAYBOOK dice "nunca dejes el foco sin señal" y trae forced-colors', () => {
  const pb = leer(join(plugin, 'design-kit/PLAYBOOK.md'));
  assert.match(pb, /nunca dejes el foco sin señal/i);
  assert.match(pb, /forced-colors/);
  assert.match(pb, /WCAG 2\.4\.7/);
  assert.match(pb, /Reglas que casi todos quieren/);
  assert.match(pb, /Equipo de sitios nivel premio/);
});

test('el CSS del estilo tiene el respaldo forced-colors', () => {
  assert.match(leer(join(plugin, 'design-kit/estilo-panel-dueno/componentes.css')), /forced-colors/);
});

test('apps-por-dentro/INDICE.md solo enlaza archivos que existen', () => {
  const dir = join(plugin, 'design-kit/apps-por-dentro');
  const texto = leer(join(dir, 'INDICE.md'));
  const enlaces = [...texto.matchAll(/`((?:\.\.\/)?[\w./-]+\.(?:md|css|html))`/g)].map((m) => m[1]);
  assert.ok(enlaces.length >= 8);
  const faltan = enlaces.filter((e) => !existsSync(resolve(dir, e)));
  assert.deepEqual(faltan, []);
});

test('apps-por-dentro: 05, 06, 07 y 09 existen, 04-figma y 08 no, y 05 trae su fecha de vencimiento', () => {
  const dir = join(plugin, 'design-kit/apps-por-dentro');
  for (const f of ['05-tendencias-2026-10.md', '06-ia-para-ui.md', '07-3d-y-animacion-avanzada.md', '09-salud-y-habitos-en-el-telefono.md', '04-apps-vistas-y-cara-de-ia.md']) {
    assert.ok(existsSync(join(dir, f)), f);
  }
  assert.ok(!existsSync(join(dir, '04-figma-y-mobbin.md')));
  assert.ok(!existsSync(join(dir, '08-sitios-vistos.md')));
  assert.match(leer(join(dir, '05-tendencias-2026-10.md')).split('\n').slice(0, 6).join('\n'), /revisar después de 2027-01/i);
});

const agentes = ['asesor-diseno', 'dev-creativo', 'critico-diseno'];
for (const a of agentes) {
  test(`${a} lee GUSTO.md y PLAYBOOK-notas.md`, () => {
    const t = leer(join(plugin, 'agents', `${a}.md`));
    assert.match(t, /mi-perfil\/diseno\/GUSTO\.md/);
    assert.match(t, /mi-perfil\/diseno\/PLAYBOOK-notas\.md/);
  });
}

test('asesor-diseno: 3 puertas y la sección de aprender de tu trabajo', () => {
  const t = leer(join(plugin, 'agents/asesor-diseno.md'));
  assert.match(t, /3 gates/);
  assert.match(t, /Equipo de sitios nivel premio/);
  assert.match(t, /## Aprender de tu trabajo/);
  assert.match(t, /Lo que me gusta/);
  assert.match(t, /Lo que la IA nunca hace por mí/);
  assert.match(t, /\.respaldos/);
  assert.match(t, /if `impeccable` is installed/);
});

test('el asesor y el dev-creativo ya no mandan a escribir en el PLAYBOOK del plugin', () => {
  for (const a of ['asesor-diseno', 'dev-creativo']) {
    const t = leer(join(plugin, 'agents', `${a}.md`));
    assert.match(t, /the plugin PLAYBOOK is read-only/);
    assert.doesNotMatch(t, /in the PLAYBOOK "Construcción" table/);
    assert.doesNotMatch(t, /in the PLAYBOOK with the reason/);
  }
});

test('perfil-campos.md: la rama creativa escribe GUSTO.md con sus 4 campos', () => {
  const t = leer(join(plugin, 'perfil-campos.md'));
  for (const c of ['Lo que me gusta', 'Lo que no', 'Referencias', 'Lo que la IA nunca hace por mí', 'GUSTO.md']) assert.ok(t.includes(c), c);
});
