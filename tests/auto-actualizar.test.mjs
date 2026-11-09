// ajustes.sh: deja el auto-update del setup-ceo prendido en settings.json sin tocar la fuente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, statSync, symlinkSync, lstatSync, chmodSync, readdirSync } from 'node:fs';
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
  const mapeada = mkdtempSync(join(tmpdir(), 'mapeado-'));
  mkdirSync(join(mapeada, 'plugins'), { recursive: true });
  writeFileSync(join(mapeada, 'plugins/known_marketplaces.json'), JSON.stringify({ 'setup-ceo': { source: GIT } }));
  const w = mundo({});
  w.env = fingirWindows({ ...w.env, CLAUDE_CONFIG_DIR: 'C:\\Users\\José Pérez\\.claude' });
  const cyg = mkdtempSync(join(tmpdir(), 'cyg-'));
  writeFileSync(join(cyg, 'cygpath'), `#!/bin/sh\ncase "$2" in 'C:\\'*) echo '${mapeada}' ;; *) echo "$2" ;; esac\n`, { mode: 0o755 });
  w.env.PATH = `${cyg}:${w.env.PATH}`;
  assert.equal(correr(w, 'archivo_ajustes').stdout, `${mapeada}/settings.json\n`);
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: activado\n');
  assert.deepEqual(leer(join(mapeada, 'settings.json')).extraKnownMarketplaces['setup-ceo'], { source: GIT, autoUpdate: true });
  assert.equal(existsSync(w.sf), false);
});

const sinTmp = (dir) => readdirSync(dir).filter((n) => n.includes('.setup-ceo-tmp.'));
const esRoot = typeof process.getuid === 'function' && process.getuid() === 0;

test('entrada sin autoUpdate y known en false: copiado y queda apagado', () => {
  const w = mundo({ known: { source: GIT, autoUpdate: false }, settings: { extraKnownMarketplaces: { 'setup-ceo': { source: GIT } } } });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: copiado\n');
  assert.equal(entrada(w).autoUpdate, false);
  assert.equal(correr(w, 'estado_auto').stdout.split('\n')[0], 'AUTO: no');
  assert.equal(correr(w, 'asegurar_auto').stdout, 'SIN-CAMBIO\n');
});

test('el respaldo conserva el modo 0600', { skip: esWindows ? 'modos en Windows' : false }, () => {
  const w = mundo({ known: { source: GIT }, crudo: '{"token":"x"}' });
  chmodSync(w.sf, 0o600);
  assert.equal(correr(w, 'asegurar_auto').stdout, 'CAMBIO: activado\n');
  assert.equal(statSync(w.sf + '.antes-de-setup-ceo').mode & 0o777, 0o600);
  assert.equal(statSync(w.sf).mode & 0o777, 0o600);
});

test('poner_auto rechaza valores que no son si/no', () => {
  const texto = JSON.stringify({ a: 1 });
  const w = mundo({ known: { source: GIT }, crudo: texto });
  assert.equal(correr(w, 'poner_auto', 'yes').stdout, 'OMITIDO: valor-invalido\n');
  assert.equal(correr(w, 'poner_auto', '').stdout, 'OMITIDO: valor-invalido\n');
  assert.equal(readFileSync(w.sf, 'utf8'), texto);
  assert.equal(existsSync(w.sf + '.antes-de-setup-ceo'), false);
});

test('enlace roto: no se reemplaza por un archivo', { skip: esWindows ? 'enlaces simbólicos en Windows' : false }, () => {
  const w = mundo({ known: { source: GIT } });
  symlinkSync(join(w.home, 'no-existe.json'), w.sf);
  assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: settings-invalido\n');
  assert.equal(lstatSync(w.sf).isSymbolicLink(), true);
  assert.equal(existsSync(join(w.home, 'no-existe.json')), false);
});

test('carpeta de solo lectura: no-se-pudo-escribir y sin restos', { skip: esWindows || esRoot ? 'Windows o root' : false }, () => {
  const texto = JSON.stringify({ a: 1 });
  const w = mundo({ known: { source: GIT }, crudo: texto });
  chmodSync(w.conf, 0o555);
  try {
    assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: no-se-pudo-escribir\n');
    assert.equal(readFileSync(w.sf, 'utf8'), texto);
    assert.deepEqual(sinTmp(w.conf), []);
  } finally { chmodSync(w.conf, 0o755); }
});

test('formato como Claude Code: "clave": valor y salto final', () => {
  const w = mundo({ known: { source: GIT } });
  correr(w, 'asegurar_auto');
  const t = readFileSync(w.sf, 'utf8');
  assert.ok(t.includes('"autoUpdate": true'), t);
  assert.ok(t.endsWith('\n'));
});

test('el respaldo se escribe una sola vez y no quedan temporales', () => {
  const orig = JSON.stringify({ a: 1 }, null, 2);
  const w = mundo({ known: { source: GIT }, crudo: orig });
  correr(w, 'asegurar_auto');
  correr(w, 'poner_auto', 'no');
  correr(w, 'poner_auto', 'si');
  assert.equal(readFileSync(w.sf + '.antes-de-setup-ceo', 'utf8'), orig);
  assert.deepEqual(sinTmp(w.conf), []);
});

test('forks en forma github y URL parecida: no-oficial', () => {
  for (const src of [
    { source: 'github', repo: 'otro/setup-ceo' },
    { source: 'git', url: 'https://github.com/josephalbertoeshkenazi-blip/setup-ceo-fork.git' },
  ]) {
    const w = mundo({ known: { source: src } });
    assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: no-oficial\n');
    assert.equal(existsSync(w.sf), false);
  }
});

test('poner_auto si respeta fuente distinta y ref propio', () => {
  const t1 = JSON.stringify({ extraKnownMarketplaces: { 'setup-ceo': { source: { ...GIT, ref: 'estable' }, autoUpdate: false } } });
  const a = mundo({ known: { source: GIT }, crudo: t1 });
  assert.equal(correr(a, 'poner_auto', 'si').stdout, 'OMITIDO: fuente-distinta\n');
  assert.equal(readFileSync(a.sf, 'utf8'), t1);
  assert.equal(existsSync(a.sf + '.antes-de-setup-ceo'), false);
  const t2 = JSON.stringify({ a: 1 });
  const b = mundo({ known: { source: { ...GIT, ref: 'x' } }, crudo: t2 });
  assert.equal(correr(b, 'poner_auto', 'si').stdout, 'OMITIDO: ref-propio\n');
  assert.equal(readFileSync(b.sf, 'utf8'), t2);
  assert.equal(existsSync(b.sf + '.antes-de-setup-ceo'), false);
});

test('settings con comentario //: settings-invalido', () => {
  const texto = '{\n  // hola\n  "a": 1\n}\n';
  const w = mundo({ known: { source: GIT }, crudo: texto });
  assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: settings-invalido\n');
  assert.equal(readFileSync(w.sf, 'utf8'), texto);
});

// ---- revisar-novedades.sh (gancho de inicio) ----
const gancho = join(scripts, 'revisar-novedades.sh');
const gitq = (dir, ...a) => {
  const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-C', dir, ...a], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
};
const PLANTILLA = '# Novedades\n\n```\n## X.Y.Z (AAAA-MM-DD)\nCambió: <plugins>\nAgentes que cambiaron: <agentes, o "ninguno">\n- Qué cambió, en palabras simples.\n```\n\n';
const SECCION = (v, texto, agentes = 'guardia') => `## ${v} (2026-11-0${v.endsWith('3.0') ? 9 : 8})\nCambió: todo\nAgentes que cambiaron: ${agentes}\n- ${texto}\n\n`;
const TEXTO_230 = 'Se actualiza solo con versiones revisadas.';
const TEXTO_220 = 'Funciona en Windows.';

// propia: versión del plugin cargado. instalada: la del registro. remoto: secciones del CHANGELOG publicado.
function mundoGancho({ propia = '2.3.0', instalada = propia, remoto = ['2.3.0', '2.2.0'], known = { source: GIT }, settings, crudo, visto, ultimaRevision, pendiente } = {}) {
  const w = mundo({ known, settings, crudo });
  const mk = join(w.conf, 'plugins/marketplaces/setup-ceo');
  const bare = join(mkdtempSync(join(tmpdir(), 'bare-')), 'origin.git');
  mkdirSync(mk, { recursive: true });
  gitq(mk, 'init', '-q', '-b', 'main');
  writeFileSync(join(mk, 'CHANGELOG.md'), PLANTILLA + remoto.map((v) => SECCION(v, v === '2.3.0' ? TEXTO_230 : v === '2.2.0' ? TEXTO_220 : 'otra cosa')).join(''));
  gitq(mk, 'add', '.');
  gitq(mk, 'commit', '-q', '-m', 'x');
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', bare]);
  gitq(mk, 'remote', 'add', 'origin', bare);
  gitq(mk, 'push', '-q', '-u', 'origin', 'main');
  const k = leer(join(w.conf, 'plugins/known_marketplaces.json'));
  k['setup-ceo'].installLocation = mk;
  writeFileSync(join(w.conf, 'plugins/known_marketplaces.json'), JSON.stringify(k));
  writeFileSync(join(w.conf, 'plugins/installed_plugins.json'), JSON.stringify({ version: 2, plugins: { 'actualizaciones@setup-ceo': [{ installPath: '/y', version: instalada }] } }));
  const raizPlugin = join(mkdtempSync(join(tmpdir(), 'plug-')), 'actualizaciones');
  mkdirSync(join(raizPlugin, '.claude-plugin'), { recursive: true });
  writeFileSync(join(raizPlugin, '.claude-plugin/plugin.json'), JSON.stringify({ name: 'actualizaciones', version: propia }));
  const datos = mkdtempSync(join(tmpdir(), 'datos-'));
  if (visto) writeFileSync(join(datos, 'version-vista'), visto + '\n');
  if (ultimaRevision) writeFileSync(join(datos, 'ultima-revision'), ultimaRevision + '\n');
  if (pendiente) writeFileSync(join(datos, 'pendiente-desde'), pendiente + '\n');
  w.datos = datos;
  w.env = { ...w.env, CLAUDE_PLUGIN_ROOT: aPosix(raizPlugin), CLAUDE_PLUGIN_DATA: aPosix(datos) };
  return w;
}
const correrGancho = (w) => spawnSync(BASH, [aPosix(gancho)], { encoding: 'utf8', env: w.env });
const fecha = (dias) => { const d = new Date(Date.now() - dias * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const VIEJA = 'No instales nada sin su sí';

test('gancho: primera vez en instalación nueva', () => {
  const w = mundoGancho();
  const r = correrGancho(w);
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('Desde ahora el setup-ceo se actualiza solo, solo con versiones revisadas.'), r.stdout);
  assert.ok(!r.stdout.includes('se actualizó solo'), r.stdout);
  assert.ok(!r.stdout.includes(VIEJA));
  assert.equal(readFileSync(join(w.datos, 'version-vista'), 'utf8').trim(), '2.3.0');
});

test('gancho: después de actualizar resume y no repite', () => {
  const w = mundoGancho({ visto: '2.2.0', ultimaRevision: fecha(0) });
  const r = correrGancho(w);
  assert.ok(r.stdout.includes('El setup-ceo se actualizó solo (de 2.2.0 a 2.3.0).'), r.stdout);
  assert.ok(r.stdout.includes(TEXTO_230));
  assert.ok(!r.stdout.includes(TEXTO_220));
  assert.ok(!r.stdout.includes('AAAA-MM-DD'));
  assert.ok(!r.stdout.includes(VIEJA));
  assert.ok(!correrGancho(w).stdout.includes('se actualizó'));
});

test('gancho: viene de 2.0 sin version-vista', () => {
  const w = mundoGancho({ ultimaRevision: fecha(3) });
  const r = correrGancho(w);
  assert.ok(r.stdout.includes('se actualizó solo (de la anterior a 2.3.0)'), r.stdout);
  assert.ok(r.stdout.includes(TEXTO_230));
  assert.ok(!r.stdout.includes(TEXTO_220));
});

test('gancho: volvió atrás', () => {
  const w = mundoGancho({ visto: '2.4.0', ultimaRevision: fecha(0) });
  const r = correrGancho(w);
  assert.ok(r.stdout.includes('volvió a la versión 2.3.0'), r.stdout);
  assert.ok(!r.stdout.includes('se actualizó solo'));
});

test('gancho: respaldo después de un día, no antes', () => {
  const frase = 'Hay una versión nueva del setup-ceo (2.4.0; el dueño tiene 2.2.0) que no se instaló sola.';
  const base = { propia: '2.2.0', visto: '2.2.0', remoto: ['2.4.0', '2.2.0'], ultimaRevision: fecha(0) };
  const ayer = mundoGancho({ ...base, pendiente: `${fecha(1)}|2.4.0` });
  const r = correrGancho(ayer);
  assert.ok(r.stdout.includes(frase), r.stdout);
  assert.ok(r.stdout.includes('Instálala ahora'));
  assert.ok(!r.stdout.includes(VIEJA));
  const hoy = mundoGancho({ ...base, pendiente: `${fecha(0)}|2.4.0` });
  assert.ok(!correrGancho(hoy).stdout.includes(frase));
  const nuevo = mundoGancho(base);
  assert.ok(!correrGancho(nuevo).stdout.includes(frase));
  assert.equal(readFileSync(join(nuevo.datos, 'pendiente-desde'), 'utf8').trim(), `${fecha(0)}|2.4.0`);
});

test('gancho: pendiente de otra versión se reinicia; al igualar se borra', () => {
  const w = mundoGancho({ propia: '2.2.0', visto: '2.2.0', remoto: ['2.4.0', '2.2.0'], ultimaRevision: fecha(0), pendiente: `${fecha(5)}|2.3.0` });
  const r = correrGancho(w);
  assert.ok(!r.stdout.includes('no se instaló sola'), r.stdout);
  assert.equal(readFileSync(join(w.datos, 'pendiente-desde'), 'utf8').trim(), `${fecha(0)}|2.4.0`);
  const ok = mundoGancho({ ultimaRevision: fecha(0), visto: '2.3.0', pendiente: `${fecha(5)}|2.3.0` });
  correrGancho(ok);
  assert.equal(existsSync(join(ok.datos, 'pendiente-desde')), false);
});

test('gancho: fuente fijada no avisa', () => {
  const w = mundoGancho({ propia: '2.2.0', visto: '2.2.0', remoto: ['2.4.0', '2.2.0'], ultimaRevision: fecha(0), pendiente: `${fecha(2)}|2.4.0`, known: { source: { ...GIT, ref: 'v2.2.0' } } });
  const r = correrGancho(w);
  assert.ok(!r.stdout.includes('no se instaló sola'), r.stdout);
  assert.ok(!r.stdout.toLowerCase().includes('hay una versión nueva'), r.stdout);
});

test('gancho: apagado avisa sin instalar', () => {
  const w = mundoGancho({ propia: '2.2.0', visto: '2.2.0', remoto: ['2.4.0', '2.2.0'], ultimaRevision: fecha(0), known: { source: GIT, autoUpdate: false } });
  const r = correrGancho(w);
  assert.ok(r.stdout.includes('Novedades del setup-ceo: hay una versión nueva (2.4.0; el dueño tiene 2.2.0).'), r.stdout);
  assert.ok(r.stdout.includes('Las actualizaciones solas están apagadas'), r.stdout);
  assert.ok(!r.stdout.includes('Instálala ahora'));
  assert.ok(!r.stdout.includes(VIEJA));
  assert.ok(!r.stdout.includes('Desde ahora'), 'no lo vuelve a prender');
  assert.equal(readFileSync(join(w.conf, 'settings.json'), 'utf8').includes('"autoUpdate": true'), false);
});

test('gancho: nada por stderr y exit 0 con settings inválido', () => {
  const w = mundoGancho({ crudo: '{ "a": 1, }' });
  const r = correrGancho(w);
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
});

test('gancho: sin catálogo ni known sale 0 en silencio', () => {
  const w = mundo({});
  w.env = { ...w.env, CLAUDE_PLUGIN_DATA: aPosix(mkdtempSync(join(tmpdir(), 'datos-'))) };
  const r = correrGancho(w);
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
});

// auto.sh y las skills con las frases del dueño
const autoSh = (w, ...a) => spawnSync(BASH, [`${aPosix(scripts)}/auto.sh`, ...a], { encoding: 'utf8', env: w.env });
const skill = (n) => readFileSync(join(raiz, 'plugins/actualizaciones/skills', n, 'SKILL.md'), 'utf8');

test('auto.sh apagar, estado, prender', () => {
  const w = mundo({ known: { source: GIT } });
  assert.equal(autoSh(w, 'apagar').stdout, 'AUTO: no\n');
  assert.equal(autoSh(w, 'estado').stdout, 'AUTO: no\nREF: ninguno\nFUENTE: oficial\n');
  assert.equal(autoSh(w, 'prender').stdout, 'AUTO: si\n');
  assert.equal(entrada(w).autoUpdate, true);
});

test('auto.sh otra-cosa sale con 2 y no cambia nada', () => {
  const w = mundo({ known: { source: GIT } });
  const r = autoSh(w, 'otra-cosa');
  assert.equal(r.status, 2);
  assert.equal(existsSync(w.sf), false);
  assert.equal(autoSh(w).status, 2);
});

test('skill actualizar-solo menciona las frases', () => {
  const t = skill('actualizar-solo');
  for (const f of ['no te actualices solo', 'apaga las actualizaciones', 'actualízate solo', 'prende las actualizaciones', '¿te actualizas solo?', 'vuelve a la versión anterior', 'auto.sh', '--volver']) {
    assert.ok(t.includes(f), f);
  }
  assert.ok(!t.includes('marketplace add'));
});

test('novedades: actualízate no pregunta', () => {
  const t = skill('novedades');
  assert.ok(t.includes('actualízate'));
  assert.match(t, /^## Actualizar$/m);
  assert.match(t, /^## Cuando solo pregunta$/m);
  assert.ok(!t.includes('nada se instala ni se actualiza sin un sí claro'));
  assert.ok(t.includes('Instálala ahora'));
  assert.ok(t.includes('buscar-claude.sh'));
});
