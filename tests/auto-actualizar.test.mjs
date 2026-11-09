// ajustes.sh: deja el auto-update del setup-ceo prendido en settings.json sin tocar la fuente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, statSync, symlinkSync, lstatSync, chmodSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { raiz, esWindows, entornoCasa, fingirWindows, BASH, aPosix, carpetaConHerramientas, rutaDe, sepPath } from './ayuda.mjs';

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
  assert.ok(!r.stdout.includes(VIEJA));
  assert.ok(r.stdout.includes(TEXTO_230));
  assert.ok(!r.stdout.includes(TEXTO_220));
});

test('gancho: volvió atrás', () => {
  const w = mundoGancho({ visto: '2.4.0', ultimaRevision: fecha(0) });
  const r = correrGancho(w);
  assert.ok(r.stdout.includes('volvió a la versión 2.3.0'), r.stdout);
  assert.ok(!r.stdout.includes(VIEJA));
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

test('gancho: pendiente no se reinicia cuando sale otra versión; al igualar se borra', () => {
  // 2.3.0 instalada, pendiente desde hace 2 días por 2.3.1, y ahora la última es 2.3.2: la orden sigue saliendo.
  const w = mundoGancho({ propia: '2.3.0', visto: '2.3.0', remoto: ['2.3.2', '2.3.0'], ultimaRevision: fecha(0), pendiente: `${fecha(2)}|2.3.1` });
  const r = correrGancho(w);
  assert.ok(r.stdout.includes('Instálala ahora'), r.stdout);
  assert.equal(readFileSync(join(w.datos, 'pendiente-desde'), 'utf8').trim(), `${fecha(2)}|2.3.1`);
  const ok = mundoGancho({ ultimaRevision: fecha(0), visto: '2.3.0', pendiente: `${fecha(5)}|2.3.0` });
  correrGancho(ok);
  assert.equal(existsSync(join(ok.datos, 'pendiente-desde')), false);
});

const PENDIENTE_AYER = { propia: '2.2.0', visto: '2.2.0', remoto: ['2.4.0', '2.2.0'] };
const sinOrden = (r) => { assert.ok(!r.stdout.includes('Instálala ahora'), r.stdout); assert.ok(!r.stdout.includes(VIEJA)); };

test('gancho: control, fuente oficial y AUTO si ordena instalar', () => {
  const w = mundoGancho({ ...PENDIENTE_AYER, ultimaRevision: fecha(0), pendiente: `${fecha(1)}|2.4.0` });
  assert.ok(correrGancho(w).stdout.includes('Instálala ahora'));
});

test('gancho: sin perl y con autoUpdate:false conocido no ordena instalar', () => {
  const w = mundoGancho({ ...PENDIENTE_AYER, ultimaRevision: fecha(0), pendiente: `${fecha(1)}|2.4.0`, known: { source: GIT, autoUpdate: false } });
  w.env = { ...w.env, JSON_SIN_PERL: '1' };
  const r = correrGancho(w);
  sinOrden(r);
  assert.ok(r.stdout.includes('ofrécele instalarla con /actualizaciones:novedades'), r.stdout);
});

test('gancho: una fuente que no es la oficial no ordena instalar', () => {
  const w = mundoGancho({ ...PENDIENTE_AYER, ultimaRevision: fecha(0), pendiente: `${fecha(1)}|2.4.0`, known: { source: { source: 'git', url: 'https://github.com/otro/setup-ceo.git' } } });
  const r = correrGancho(w);
  sinOrden(r);
  assert.ok(r.stdout.includes('ofrécele instalarla con /actualizaciones:novedades'), r.stdout);
});

for (const variable of ['DISABLE_AUTOUPDATER', 'DISABLE_UPDATES', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC']) {
  test(`gancho: ${variable} no toca settings ni ordena instalar`, () => {
    const w = mundoGancho({ ...PENDIENTE_AYER, ultimaRevision: fecha(0), pendiente: `${fecha(1)}|2.4.0` });
    w.env = { ...w.env, [variable]: '1' };
    const r = correrGancho(w);
    assert.ok(!r.stdout.includes('Desde ahora el setup-ceo se actualiza solo'), r.stdout);
    sinOrden(r);
    assert.ok(r.stdout.includes('ofrécele instalarla con /actualizaciones:novedades'), r.stdout);
    assert.equal(existsSync(w.sf), false, 'settings.json no se crea');
  });
}

test('gancho: Windows con rutas C:\\ ordena instalar por el camino normal', { skip: esWindows && 'usa un cygpath falso' }, () => {
  const w = mundoGancho({ ...PENDIENTE_AYER, ultimaRevision: fecha(0), pendiente: `${fecha(1)}|2.4.0` });
  const bin = mkdtempSync(join(tmpdir(), 'cyg-'));
  const raizUnix = w.env.CLAUDE_PLUGIN_ROOT;
  const datosUnix = w.env.CLAUDE_PLUGIN_DATA;
  writeFileSync(join(bin, 'cygpath'), `#!/bin/sh\ncase "$2" in\n'C:\\Claude\\plugin') echo "${raizUnix}";;\n'C:\\Claude\\datos') echo "${datosUnix}";;\n*) echo "$2";;\nesac\n`);
  chmodSync(join(bin, 'cygpath'), 0o755);
  const e = fingirWindows({ ...w.env, CLAUDE_PLUGIN_ROOT: 'C:\\Claude\\plugin', CLAUDE_PLUGIN_DATA: 'C:\\Claude\\datos' });
  const r = spawnSync(BASH, [aPosix(gancho)], { encoding: 'utf8', env: { ...e, PATH: `${bin}:${e.PATH}` } });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('Instálala ahora'), r.stdout + r.stderr);
  assert.ok(existsSync(join(w.datos, 'pendiente-desde')));
});

test('gancho: fuente fijada no avisa', () => {
  const w = mundoGancho({ propia: '2.2.0', visto: '2.2.0', remoto: ['2.4.0', '2.2.0'], ultimaRevision: fecha(0), pendiente: `${fecha(2)}|2.4.0`, known: { source: { ...GIT, ref: 'v2.2.0' } } });
  const r = correrGancho(w);
  assert.ok(!r.stdout.includes('no se instaló sola'), r.stdout);
  assert.ok(!r.stdout.toLowerCase().includes('hay una versión nueva'), r.stdout);
  assert.ok(!r.stdout.includes(VIEJA));
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

// ---- ronda de arreglos 1: skills por sección, estado.sh, nombre del paso del gancho ----
const seccion = (t, inicio) => {
  const partes = t.split(/^(?=## )/m);
  const s = partes.find((p) => p.startsWith(`## ${inicio}`));
  assert.ok(s, `falta la sección "${inicio}"`);
  return s;
};
const cabecera = (t) => t.split(/^## /m)[0];
const SOLO = () => skill('actualizar-solo');
const NOV = () => skill('novedades');

test('volver atrás deja las actualizaciones prendidas', () => {
  const s = seccion(SOLO(), 'Vuelve a la versión anterior');
  assert.ok(s.includes('auto.sh prender'), 'debe prender');
  assert.ok(!s.includes('auto.sh apagar'), 'no debe apagar');
  assert.ok(s.includes('/sugerencias:sugerir-mejora'));
  assert.ok(s.includes('no te actualices solo'));
  assert.ok(s.includes('no llegará solo'));
  assert.ok(s.includes('actualízate'));
  assert.ok(s.includes('No intentes instalar una versión vieja con comandos'));
  for (const l of s.split('\n').filter((x) => x.includes('publicar.sh'))) assert.ok(l.includes('para ti, no se lo digas al dueño'), l);
});

test('apagar/prender omitido: dice que siguen prendidas y da dos salidas', () => {
  const s = seccion(SOLO(), 'Si no se pudo cambiar');
  assert.ok(s.includes('Siguen prendidas'));
  assert.ok(s.includes('/plugin') && s.includes('Marketplaces') && s.includes('setup-ceo'));
  assert.ok(s.includes('con su sí'));
  assert.ok(s.includes('Siguen apagadas'));
  assert.ok(s.includes('viene de otro lugar'));
});

test('sin-dato y FUENTE ninguna se explican como pide el contrato', () => {
  const s = seccion(SOLO(), 'Qué correr');
  assert.ok(s.includes('todavía no hay ninguna decisión guardada; el setup-ceo lo trata como prendido y la guarda al abrir una sesión nueva. Si tu archivo de ajustes tiene un error, no puede guardarla'));
  assert.ok(s.includes('FUENTE: ninguna'));
  assert.ok(s.includes('esta computadora no tiene agregado el mercado del setup-ceo; no se toca nada'));
});

test('actualizar-solo: la sesión nueva con las mismas palabras que novedades', () => {
  const s = seccion(SOLO(), 'Qué decirle');
  assert.ok(s.includes('cierre esta sesión y abra una nueva para que entre (sirve en Desktop y en Terminal). En Terminal, `/reload-plugins` es el atajo.'));
});

test('novedades: la línea vieja de su CLAUDE.md se ofrece cambiar', () => {
  const s = seccion(NOV(), 'Regla para su CLAUDE.md');
  assert.ok(s.includes('Cuando haya novedades del setup-ceo, muéstramelas en palabras simples y espera mi sí antes de instalarlas.'));
  assert.ok(s.includes('solo con su sí'));
  assert.ok(s.includes('mientras esa línea siga'));
  assert.ok(s.includes('te voy a preguntar antes de instalar'));
  assert.ok(s.includes('si dice que no'));
});

test('novedades: regla de oro con caso por defecto', () => {
  assert.ok(cabecera(NOV()).includes('En cualquier otro caso, se muestra y se ofrece.'));
});

test('novedades: Paso 2 cubre "el autor volvió a" y la ruta sin preguntar no repite el resumen', () => {
  const s = seccion(NOV(), 'Paso 2');
  assert.ok(s.includes('el autor volvió a'));
  assert.ok(s.includes('quien mantiene el setup-ceo'));
  assert.ok(s.includes('sin preguntar: salta esta explicación larga'));
  assert.ok(s.includes('Contarle qué cambió'));
});

test('novedades: Paso 1 con mercado no agregado dice una línea y para, sin agregarlo', () => {
  const s = seccion(NOV(), 'Paso 1');
  assert.ok(s.includes('ESTADO: el mercado'));
  assert.ok(s.includes('no está agregado'));
  assert.ok(s.includes('Nunca corras `claude plugin marketplace add`'));
});

test('las dos descripciones separan sus frases y cada cuerpo manda la otra a la otra skill', () => {
  const d = (t) => t.match(/^description: (.*)$/m)[1];
  const dn = d(NOV()), ds = d(SOLO());
  assert.ok(dn.includes('"actualízate"') && dn.includes('"actualiza el setup"'));
  assert.ok(!dn.includes('actualízate solo') || /no\b.*actualízate solo/.test(dn));
  assert.ok(ds.includes('"actualízate solo"') && ds.includes('"no te actualices solo"'));
  assert.ok(!/"actualízate"/.test(ds), 'actualizar-solo no debe reclamar "actualízate" a secas');
  assert.ok(cabecera(NOV()).includes('actualizar-solo'));
  assert.ok(cabecera(SOLO()).includes('novedades'));
});

test('mismo nombre para quien mantiene el setup en las dos skills', () => {
  for (const t of [NOV(), SOLO()]) {
    assert.ok(!/quien mantiene el setup(?!-ceo)/.test(t));
    assert.ok(!/(^|[^\w`])el autor(?! volvió a)/m.test(t), 'usa "quien mantiene el setup-ceo"');
  }
  assert.ok(SOLO().includes('quien mantiene el setup-ceo'));
});

test('el paso que cita el gancho existe como encabezado de novedades', () => {
  const g = readFileSync(gancho, 'utf8');
  const nombre = g.match(/paso \\"([^"\\]+)\\"/)[1];
  assert.match(NOV(), new RegExp(`^## ${nombre}$`, 'm'));
});

// ---- estado.sh: versión del repo más baja que la instalada ----
function mundoEstado({ instalada, repo }) {
  const w = mundo({ known: { source: GIT } });
  const mk = join(w.conf, 'plugins/marketplaces/setup-ceo');
  const bare = join(mkdtempSync(join(tmpdir(), 'bare-')), 'origin.git');
  mkdirSync(join(mk, '.claude-plugin'), { recursive: true });
  mkdirSync(join(mk, 'plugins/actualizaciones/.claude-plugin'), { recursive: true });
  gitq(mk, 'init', '-q', '-b', 'main');
  writeFileSync(join(mk, '.claude-plugin/marketplace.json'), JSON.stringify({ name: 'setup-ceo', plugins: [{ name: 'actualizaciones', source: './plugins/actualizaciones' }] }));
  writeFileSync(join(mk, 'plugins/actualizaciones/.claude-plugin/plugin.json'), JSON.stringify({ name: 'actualizaciones', version: repo }, null, 2));
  writeFileSync(join(mk, 'CHANGELOG.md'), PLANTILLA + SECCION(repo, 'algo'));
  gitq(mk, 'add', '.');
  gitq(mk, 'commit', '-q', '-m', 'x');
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', bare]);
  gitq(mk, 'remote', 'add', 'origin', bare);
  gitq(mk, 'push', '-q', '-u', 'origin', 'main');
  const k = leer(join(w.conf, 'plugins/known_marketplaces.json'));
  k['setup-ceo'].installLocation = mk;
  writeFileSync(join(w.conf, 'plugins/known_marketplaces.json'), JSON.stringify(k));
  writeFileSync(join(w.conf, 'plugins/installed_plugins.json'), JSON.stringify({ version: 2, plugins: { 'actualizaciones@setup-ceo': [{ installPath: '/y', version: instalada }] } }));
  return w;
}
const estadoSh = (w) => spawnSync(BASH, [`${aPosix(scripts)}/estado.sh`], { encoding: 'utf8', env: w.env });

test('estado.sh: repo más bajo que lo instalado es ACTUALIZAR (el autor volvió)', () => {
  const r = estadoSh(mundoEstado({ instalada: '2.3.0', repo: '2.2.0' }));
  assert.ok(r.stdout.includes('PLUGIN actualizaciones: instalado 2.3.0 -> el autor volvió a 2.2.0  [ACTUALIZAR]'), r.stdout);
});
test('estado.sh: repo más alto y repo igual', () => {
  assert.ok(estadoSh(mundoEstado({ instalada: '2.2.0', repo: '2.3.0' })).stdout.includes('PLUGIN actualizaciones: instalado 2.2.0 -> hay 2.3.0  [ACTUALIZAR]'));
  const r = estadoSh(mundoEstado({ instalada: '2.2.0', repo: '2.2.0' }));
  assert.ok(r.stdout.includes('PLUGIN actualizaciones: instalado 2.2.0 (al día)'), r.stdout);
});

// ---- ronda final de arreglos ----
const ORDEN_VOLVIO = 'El autor del setup-ceo volvió a la versión 2.3.0 (tienes 2.4.0). Instálala ahora sin preguntar con el paso \"Actualizar\" de /actualizaciones:novedades y después cuéntale al dueño en 1 línea qué pasó.';
const VOLVIO = { propia: '2.4.0', visto: '2.4.0', remoto: ['2.3.0', '2.2.0'], ultimaRevision: fecha(0) };

test('I1 gancho: el autor volvió atrás, fuente oficial y AUTO si: ordena instalar', () => {
  const w = mundoGancho({ ...VOLVIO, pendiente: `${fecha(1)}|2.3.0` });
  const r = correrGancho(w);
  assert.ok(r.stdout.includes(ORDEN_VOLVIO), r.stdout);
  assert.ok(!r.stdout.includes('hay una versión nueva'), r.stdout);
});

test('I1 gancho: el autor volvió atrás con AUTO no: ofrece, no ordena', () => {
  const w = mundoGancho({ ...VOLVIO, pendiente: `${fecha(1)}|2.3.0`, known: { source: GIT, autoUpdate: false } });
  const r = correrGancho(w);
  assert.ok(r.stdout.includes('Novedades del setup-ceo: el autor volvió a la versión 2.3.0 (el dueño tiene 2.4.0).'), r.stdout);
  assert.ok(r.stdout.includes('Las actualizaciones solas están apagadas: ofrécele instalarla con /actualizaciones:novedades.'), r.stdout);
  assert.ok(!r.stdout.includes('Instálala ahora'), r.stdout);
});

test('I1 gancho: el autor volvió atrás hoy: espera el día y guarda pendiente-desde', () => {
  const w = mundoGancho(VOLVIO);
  const r = correrGancho(w);
  assert.ok(!r.stdout.includes('Instálala ahora'), r.stdout);
  assert.equal(readFileSync(join(w.datos, 'pendiente-desde'), 'utf8').trim(), `${fecha(0)}|2.3.0`);
});

test('I1 gancho: instalada igual a la del repo: silencio y borra pendiente-desde y orden-dada', () => {
  const w = mundoGancho({ propia: '2.3.0', visto: '2.3.0', remoto: ['2.3.0', '2.2.0'], ultimaRevision: fecha(0), pendiente: `${fecha(3)}|2.3.0` });
  writeFileSync(join(w.datos, 'orden-dada'), '2.3.0\n');
  writeFileSync(w.sf, JSON.stringify({ extraKnownMarketplaces: { 'setup-ceo': { source: GIT, autoUpdate: true } } }));
  const r = correrGancho(w);
  assert.equal(r.stdout, '');
  assert.equal(existsSync(join(w.datos, 'pendiente-desde')), false);
  assert.equal(existsSync(join(w.datos, 'orden-dada')), false);
});

test('Minor 6 gancho: "Instálala ahora" una sola vez por versión; después ofrece', () => {
  const w = mundoGancho({ ...PENDIENTE_AYER, ultimaRevision: fecha(0), pendiente: `${fecha(1)}|2.4.0` });
  const r1 = correrGancho(w);
  assert.ok(r1.stdout.includes('Instálala ahora'), r1.stdout);
  assert.equal(readFileSync(join(w.datos, 'orden-dada'), 'utf8').trim(), '2.4.0');
  const r2 = correrGancho(w);
  assert.ok(!r2.stdout.includes('Instálala ahora'), r2.stdout);
  assert.ok(r2.stdout.includes('Novedades del setup-ceo: hay una versión nueva (2.4.0; el dueño tiene 2.2.0).'), r2.stdout);
  assert.ok(r2.stdout.includes('ofrécele instalarla con /actualizaciones:novedades'), r2.stdout);
  assert.ok(!r2.stdout.includes('Las actualizaciones solas están apagadas'), 'siguen prendidas: no decir apagadas');
});

test('Minor 6 gancho: sale otra versión después de la orden: se ordena de nuevo', () => {
  const w = mundoGancho({ ...PENDIENTE_AYER, ultimaRevision: fecha(0), pendiente: `${fecha(2)}|2.3.1` });
  writeFileSync(join(w.datos, 'orden-dada'), '2.3.1\n');
  const r = correrGancho(w);
  assert.ok(r.stdout.includes('Instálala ahora'), r.stdout);
  assert.equal(readFileSync(join(w.datos, 'orden-dada'), 'utf8').trim(), '2.4.0');
});

test('Minor 8 carpeta_datos: CLAUDE_PLUGIN_DATA o la carpeta de datos del plugin', () => {
  const w = mundo({});
  assert.ok(correr(w, 'carpeta_datos').stdout.endsWith('/.claude/plugins/data/actualizaciones-setup-ceo\n'));
  const otra = mkdtempSync(join(tmpdir(), 'datos-'));
  w.env = { ...w.env, CLAUDE_PLUGIN_DATA: aPosix(otra) };
  assert.equal(correr(w, 'carpeta_datos').stdout, `${aPosix(otra)}\n`);
});

test('Minor 8: apagado se queda apagado aunque se borre autoUpdate de settings', () => {
  const w = mundoGancho({ ultimaRevision: fecha(0), visto: '2.3.0' });
  assert.equal(autoSh(w, 'apagar').stdout, 'AUTO: no\n');
  assert.ok(existsSync(join(w.datos, 'auto-apagado')), 'falta la marca auto-apagado');
  const s = leer(w.sf);
  delete s.extraKnownMarketplaces['setup-ceo'].autoUpdate;
  writeFileSync(w.sf, JSON.stringify(s));
  const r = correrGancho(w);
  assert.ok(!r.stdout.includes('Desde ahora el setup-ceo se actualiza solo'), r.stdout);
  assert.equal(entrada(w).autoUpdate, false);
  delete s.extraKnownMarketplaces['setup-ceo'];
  writeFileSync(w.sf, JSON.stringify(s));
  assert.ok(!correrGancho(w).stdout.includes('Desde ahora'));
  assert.equal(entrada(w).autoUpdate, false);
});

test('Minor 8: prender borra la marca y vuelve a prender', () => {
  const w = mundoGancho({ ultimaRevision: fecha(0), visto: '2.3.0' });
  autoSh(w, 'apagar');
  assert.equal(autoSh(w, 'prender').stdout, 'AUTO: si\n');
  assert.equal(existsSync(join(w.datos, 'auto-apagado')), false);
  assert.equal(entrada(w).autoUpdate, true);
});

test('Minor 8: apagar que no se pudo no deja la marca', () => {
  const w = mundoGancho({ ultimaRevision: fecha(0), visto: '2.3.0', crudo: '{ "a": 1, }' });
  assert.equal(autoSh(w, 'apagar').stdout, 'OMITIDO: settings-invalido\n');
  assert.equal(existsSync(join(w.datos, 'auto-apagado')), false);
});

// Perl sin JSON::PP: un perl que falla solo cuando se le pide JSON::PP.
function perlSinJson() {
  const bin = mkdtempSync(join(tmpdir(), 'perl-'));
  const real = rutaDe('perl');
  writeFileSync(join(bin, 'perl'), `#!/bin/sh\ncase "$*" in *JSON::PP*) echo "Can't locate JSON/PP.pm in @INC" >&2; exit 2 ;; esac\nexec "${real}" "$@"\n`);
  chmodSync(join(bin, 'perl'), 0o755);
  return bin;
}

test('Minor 4: perl sin JSON::PP es sin-perl-json, no settings-invalido', () => {
  const w = mundo({ known: { source: GIT } });
  w.env = { ...w.env, PATH: `${perlSinJson()}${sepPath}${w.env.PATH}` };
  assert.equal(correr(w, 'asegurar_auto').stdout, 'OMITIDO: sin-perl-json\n');
  assert.equal(correr(w, 'poner_auto', 'no').stdout, 'OMITIDO: sin-perl-json\n');
  assert.equal(correr(w, 'estado_auto').stdout, 'AUTO: sin-dato\nREF: ninguno\nFUENTE: ninguna\n');
  assert.equal(existsSync(w.sf), false);
});

test('Minor 4 gancho: perl sin JSON::PP se trata como sin perl (ofrece)', () => {
  const w = mundoGancho({ ...PENDIENTE_AYER, ultimaRevision: fecha(0), pendiente: `${fecha(1)}|2.4.0` });
  w.env = { ...w.env, PATH: `${perlSinJson()}${sepPath}${w.env.PATH}` };
  const r = correrGancho(w);
  assert.equal(r.status, 0);
  sinOrden(r);
  assert.ok(r.stdout.includes('ofrécele instalarla con /actualizaciones:novedades'), r.stdout);
});

test('Minor 1 actualizar-solo: la nota del mantenedor muestra el uso real de publicar.sh', () => {
  assert.ok(SOLO().includes('publicar.sh X.Y.Z --volver'));
  assert.ok(!SOLO().includes('publicar.sh <plugin>'));
});

test('Minor 2 novedades: la regla de oro dice una sola vez el caso por defecto', () => {
  const c = cabecera(NOV());
  assert.ok(!c.includes('Si solo preguntó "¿hay novedades?", se muestra y se ofrece.'), c);
  assert.equal(c.split('se muestra y se ofrece').length - 1, 1, c);
});
