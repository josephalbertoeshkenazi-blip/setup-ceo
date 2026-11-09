// actualizaciones y adaptar sin plutil: json.sh, comun.sh, buscar-claude.sh, listar-agentes.sh, copiar-prompt-memoria.sh.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { raiz, esWindows, entornoCasa, fingirWindows, BASH, aPosix, carpetaConHerramientas, baseWindows, sepPath } from './ayuda.mjs';

const act = join(raiz, 'plugins/actualizaciones/scripts');
const ada = join(raiz, 'plugins/adaptar/scripts');
const sep = sepPath;

const tmp = (p) => mkdtempSync(join(tmpdir(), p));
function ejecutable(ruta, texto) { writeFileSync(ruta, texto); chmodSync(ruta, 0o755); }
function conPath(env, dir) { return { ...env, PATH: `${dir}${sep}${env.PATH}` }; }
function bash(args, env, extra = {}) {
  return spawnSync(BASH, args, { encoding: 'utf8', env, ...extra });
}
function json(ruta, obj) { mkdirSync(join(ruta, '..'), { recursive: true }); writeFileSync(ruta, JSON.stringify(obj)); }
function git(dir, ...a) {
  const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-C', dir, ...a], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}

const WIN_PATH = 'C:\\Users\\José Pérez\\.claude\\plugins\\cache\\setup-ceo\\ceo-base\\2.1.0';
const registro = (extra = {}) => ({
  version: 2,
  plugins: {
    'ceo-base@setup-ceo': [{ scope: 'user', installPath: WIN_PATH, version: '2.1.0' }],
    'adaptar@setup-ceo': [{ scope: 'user', installPath: '/x/adaptar', version: '2.1.0' }],
    ...extra,
  },
});

const leerJson = (env, archivo, ruta, fn = 'json_get') =>
  bash(['-c', `. "${act}/json.sh"; ${fn} "$1" "$2"`, '_', archivo, ruta], env);

test('json_get lee installed_plugins sin plutil', () => {
  const { home, env } = entornoCasa();
  const f = join(home, 'installed_plugins.json');
  json(f, registro());
  const e = { ...env, JSON_SIN_PLUTIL: '1' };
  for (const extra of [{}, { JSON_SIN_PERL: '1' }]) {
    const x = { ...e, ...extra };
    const v = leerJson(x, f, 'plugins.ceo-base@setup-ceo.0.version');
    assert.equal(v.status, 0);
    assert.equal(v.stdout, '2.1.0\n');
    assert.equal(leerJson(x, f, 'plugins.ceo-base@setup-ceo.0.installPath').stdout, WIN_PATH + '\n');
    assert.equal(leerJson(x, f, 'plugins.nada@setup-ceo.0.version').stdout, '');
    assert.equal(leerJson(x, f, 'plugins.nada@setup-ceo.0.version').status, 0);
  }
});

test('json_get sin plutil, sin perl y sin python: no imprime nada y sale 0', () => {
  const { home, env } = entornoCasa();
  const f = join(home, 'installed_plugins.json');
  json(f, registro());
  const bin = tmp('solo-bash-');
  const r = spawnSync(BASH, ['-c', `. "${act}/json.sh"; json_get "$1" "$2"`, '_', f, 'plugins.ceo-base@setup-ceo.0.version'],
    { encoding: 'utf8', env: { ...env, PATH: bin, JSON_SIN_PLUTIL: '1', JSON_SIN_PERL: '1' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('json.sh con solo perl (sin plutil ni python) lee valores y llaves, en las dos copias', () => {
  const { home, env } = entornoCasa();
  const f = join(home, 'installed_plugins.json');
  json(f, registro());
  const bin = carpetaConHerramientas(['perl']);
  const e = { ...env, PATH: bin, JSON_SIN_PLUTIL: '1' };
  for (const dir of [act, ada]) {
    const run = (fn, ruta) => spawnSync(BASH, ['-c', `. "${dir}/json.sh"; ${fn} "$1" "$2"`, '_', f, ruta], { encoding: 'utf8', env: e });
    assert.equal(run('json_get', 'plugins.ceo-base@setup-ceo.0.version').stdout, '2.1.0\n', dir);
    assert.equal(run('json_get', 'plugins.ceo-base@setup-ceo.0.installPath').stdout, WIN_PATH + '\n', dir);
    assert.deepEqual(run('json_keys', 'plugins').stdout.split('\n').filter(Boolean), ['adaptar@setup-ceo', 'ceo-base@setup-ceo'], dir);
  }
});

test('json_keys devuelve las dos llaves de plugins', () => {
  const { home, env } = entornoCasa();
  const f = join(home, 'installed_plugins.json');
  json(f, registro());
  for (const extra of [{}, { JSON_SIN_PLUTIL: '1' }, { JSON_SIN_PLUTIL: '1', JSON_SIN_PERL: '1' }]) {
    const r = leerJson({ ...env, ...extra }, f, 'plugins', 'json_keys');
    assert.deepEqual(r.stdout.split('\n').filter(Boolean).sort(), ['adaptar@setup-ceo', 'ceo-base@setup-ceo']);
  }
});

test('las tres copias de json.sh son idénticas', () => {
  const rutas = ['actualizaciones', 'adaptar', 'seguridad'].map((p) => join(raiz, 'plugins', p, 'scripts/json.sh')).filter(existsSync);
  assert.ok(rutas.length >= 2);
  const base = readFileSync(rutas[0], 'utf8');
  for (const r of rutas) assert.equal(readFileSync(r, 'utf8'), base, r);
  assert.ok(!base.includes('\r'));
});

test('version_instalada y carpeta_mercado funcionan en Windows', () => {
  const { home, env } = entornoCasa();
  const mk = join(tmp('mercado-'), 'con espacio');
  mkdirSync(mk, { recursive: true });
  json(join(home, '.claude/plugins/known_marketplaces.json'), { 'setup-ceo': { installLocation: mk } });
  json(join(home, '.claude/plugins/installed_plugins.json'), registro({
    'actualizaciones@setup-ceo': [{ installPath: '/y', version: '2.1.0' }] }));
  const e = fingirWindows({ ...env, JSON_SIN_PLUTIL: '1' });
  const r = bash(['-c', `. "${act}/comun.sh"; carpeta_mercado; version_instalada actualizaciones`], e);
  assert.equal(r.stdout, `${aPosix(mk)}\n2.1.0\n`);
});

test('traer_ultimo usa timeout en Windows', () => {
  const { home, env } = entornoCasa();
  const mk = join(home, '.claude/plugins/marketplaces/setup-ceo');
  mkdirSync(join(mk, '.git'), { recursive: true });
  const bin = tmp('falsos-');
  ejecutable(join(bin, 'timeout'), '#!/bin/sh\necho "T:$*"\n');
  const e = { ...fingirWindows(env), SETUP_CEO_TIMEOUT_BIN: join(bin, 'timeout') };
  const r = bash(['-c', `. "${act}/comun.sh"; traer_ultimo 20`], e);
  assert.equal(r.stdout.trim(), `T:20 git -c credential.helper= -C ${aPosix(mk)} fetch --quiet origin`);
});

test('traer_ultimo en Windows ignora un timeout de System32 que no sirve', () => {
  const { home, env } = entornoCasa();
  const mk = join(home, '.claude/plugins/marketplaces/setup-ceo');
  mkdirSync(join(mk, '.git'), { recursive: true });
  const bin = tmp('falsos-');
  ejecutable(join(bin, 'timeout'), '#!/bin/sh\necho "ERROR: Invalid syntax"\nexit 1\n');
  const registroGit = join(bin, 'git.log');
  ejecutable(join(bin, 'git'), `#!/bin/sh\necho "$*" > "${registroGit}"\n`);
  const e = { ...conPath(fingirWindows(env), bin), SETUP_CEO_TIMEOUT_BIN: join(bin, 'no-existe') };
  const r = bash(['-c', `. "${act}/comun.sh"; traer_ultimo 20`], e);
  assert.ok(!r.stdout.includes('Invalid syntax'));
  assert.equal(readFileSync(registroGit, 'utf8').trim(), `-c credential.helper= -C ${aPosix(mk)} fetch --quiet origin`);
});

test('revisar-novedades avisa en Windows', () => {
  const { home, env } = entornoCasa();
  const mk = join(home, '.claude/plugins/marketplaces/setup-ceo');
  mkdirSync(mk, { recursive: true });
  git(mk, 'init', '-q');
  writeFileSync(join(mk, 'CHANGELOG.md'), '# Cambios\n\n## 2.2.0\n- algo\n');
  git(mk, 'add', '.');
  git(mk, 'commit', '-q', '-m', 'x');
  json(join(home, '.claude/plugins/installed_plugins.json'), registro({
    'actualizaciones@setup-ceo': [{ installPath: '/y', version: '2.1.0' }] }));
  // Con las actualizaciones solas apagadas el aviso sale de inmediato (con ellas prendidas espera un día).
  json(join(home, '.claude/plugins/known_marketplaces.json'), { 'setup-ceo': { autoUpdate: false, installLocation: mk,
    source: { source: 'git', url: 'https://github.com/josephalbertoeshkenazi-blip/setup-ceo.git' } } });
  const e = fingirWindows({ ...env, JSON_SIN_PLUTIL: '1' });
  const r = bash([join(act, 'revisar-novedades.sh')], e);
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('Novedades del setup-ceo: hay una versión nueva (2.2.0; el dueño tiene 2.1.0)'), r.stdout + r.stderr);
  assert.ok(r.stdout.includes('Las actualizaciones solas están apagadas'), r.stdout);
});

test('buscar-claude sin claude en PATH', () => {
  // En Windows el "sistema" son solo las dos herramientas que usa el script: así no hay ningún claude de verdad en el PATH.
  const sistema = esWindows ? carpetaConHerramientas(['ls', 'head']) : '/usr/bin:/bin';
  const fingirUname = (nombre) => {
    const d = tmp('uname-');
    ejecutable(join(d, 'uname'), `#!/bin/sh\necho ${nombre}\n`);
    return d;
  };
  // Mac con el programa que trae Claude Desktop
  {
    const { home, env } = entornoCasa();
    const exe = join(home, 'Library/Application Support/Claude/claude-code/2.1.309/abc/claude.app/Contents/MacOS/claude');
    mkdirSync(join(exe, '..'), { recursive: true });
    ejecutable(exe, '#!/bin/sh\n');
    const r = bash([join(act, 'buscar-claude.sh')], { ...env, PATH: `${fingirUname('Darwin')}${sep}${sistema}`, ...baseWindows });
    assert.equal(r.status, 0);
    assert.equal(aPosix(r.stdout.trim()), aPosix(exe));
  }
  // Windows con el instalado por el instalador oficial
  {
    const { home, env } = entornoCasa();
    const exe = join(home, '.local/bin/claude.exe');
    mkdirSync(join(exe, '..'), { recursive: true });
    ejecutable(exe, '#!/bin/sh\n');
    const r = bash([join(act, 'buscar-claude.sh')], { ...env, PATH: `${fingirUname('MINGW64_NT-10.0-26100')}${sep}${sistema}`, ...baseWindows });
    assert.equal(r.status, 0);
    assert.equal(aPosix(r.stdout.trim()), aPosix(exe));
  }
  // Ninguno
  {
    const { env } = entornoCasa();
    const r = bash([join(act, 'buscar-claude.sh')], { ...env, PATH: `${fingirUname('MINGW64_NT-10.0-26100')}${sep}${sistema}`, ...baseWindows });
    assert.equal(r.status, 1);
    assert.equal(r.stdout, '');
  }
});

test('listar-agentes en Windows', () => {
  const { home, env } = entornoCasa();
  const base = join(tmp('cache-'), 'ceo-base');
  mkdirSync(join(base, 'agents'), { recursive: true });
  writeFileSync(join(base, 'agents/x.md'), 'x');
  json(join(home, '.claude/plugins/installed_plugins.json'), {
    version: 2,
    plugins: { 'ceo-base@setup-ceo': [{ installPath: base, version: '2.1.0' }] } });
  const e = fingirWindows({ ...env, JSON_SIN_PLUTIL: '1' });
  const r = bash([join(ada, 'listar-agentes.sh')], e);
  assert.ok(r.stdout.includes('== PLUGIN ceo-base@setup-ceo (versión 2.1.0)'), r.stdout);
  assert.ok(r.stdout.includes('AGENTE x'), r.stdout);
});

test('listar-agentes convierte rutas con barra invertida con cygpath', () => {
  const { home, env } = entornoCasa();
  const base = join(tmp('cache-'), 'ceo-base');
  mkdirSync(join(base, 'agents'), { recursive: true });
  writeFileSync(join(base, 'agents/y.md'), 'y');
  json(join(home, '.claude/plugins/installed_plugins.json'), {
    version: 2,
    plugins: { 'ceo-base@setup-ceo': [{ installPath: WIN_PATH, version: '2.1.0' }] } });
  const bin = tmp('falsos-');
  ejecutable(join(bin, 'cygpath'), `#!/bin/sh\necho "${base}"\n`);
  const e = conPath(fingirWindows({ ...env, JSON_SIN_PLUTIL: '1' }), bin);
  const r = bash([join(ada, 'listar-agentes.sh')], e);
  assert.ok(r.stdout.includes('AGENTE y'), r.stdout);
});

const FONT = (fallaAbrir = false) => {
  const bin = tmp('ps-');
  const reg = join(bin, 'args.log');
  const copia = join(bin, 'texto.txt');
  // Registra los argumentos y copia el archivo que le pasan entre comillas simples.
  ejecutable(join(bin, 'powershell.exe'),
    `#!/bin/sh\nprintf '%s\\n' "$*" >> "${reg}"\n` +
    `f=$(printf '%s' "$*" | sed -n "s/.*-LiteralPath '\\([^']*\\)'.*/\\1/p")\n` +
    (fallaAbrir ? `case "$*" in *Start-Process*) exit 1;; esac\n` : '') +
    `[ -n "$f" ] && [ -f "$f" ] && cat "$f" > "${copia}"\nexit 0\n`);
  return { bin, reg, copia };
};

test('copiar-prompt-memoria en Windows usa powershell', () => {
  const { env } = entornoCasa();
  const { bin, reg, copia } = FONT();
  const e = conPath(fingirWindows(env), bin);
  const r = bash([join(ada, 'copiar-prompt-memoria.sh'), 'chatgpt', 'es'], e);
  assert.equal(r.status, 0, r.stderr);
  const llamadas = readFileSync(reg, 'utf8');
  assert.ok(llamadas.includes('-NoProfile -Command'), llamadas);
  assert.ok(llamadas.includes("Start-Process 'https://chatgpt.com/'"), llamadas);
  assert.equal(readFileSync(copia, 'utf8'), readFileSync(join(raiz, 'plugins/adaptar/prompts/memoria-es.txt'), 'utf8'));
});

test("copiar-prompt-memoria en Windows: HOME con comilla (O'Brien José) y ruta de Windows", () => {
  const { home, env } = entornoCasa("O'Brien José");
  const { bin, reg } = FONT();
  const regCyg = join(bin, 'cygpath.log');
  ejecutable(join(bin, 'cygpath'), `#!/bin/sh\necho "$*" > "${regCyg}"\necho "C:\\\\Users\\\\O'Brien José\\\\memoria.txt"\n`);
  const e = conPath(fingirWindows({ ...env, TMPDIR: home }), bin);
  const r = bash([join(ada, 'copiar-prompt-memoria.sh'), 'claude', 'es'], e);
  assert.equal(r.status, 0, r.stderr);
  const cyg = readFileSync(regCyg, 'utf8').trim();
  assert.ok(cyg.startsWith('-w '), cyg);
  assert.ok(cyg.includes(aPosix(home)), cyg);
  const llamadas = readFileSync(reg, 'utf8');
  assert.ok(llamadas.includes("-LiteralPath 'C:\\Users\\O''Brien José\\memoria.txt'"), llamadas);
});

test('copiar-prompt-memoria en Windows sin powershell imprime el texto para copiar a mano', () => {
  const { env } = entornoCasa();
  // PATH recortado: en un Windows de verdad powershell.exe sí existe, y aquí hay que probar que falta.
  const e = fingirWindows({ ...env, PATH: carpetaConHerramientas(['cat', 'dirname']) });
  const r = bash([join(ada, 'copiar-prompt-memoria.sh'), 'otra', 'es'], e);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('----- COPIA DESDE AQUI -----'));
  assert.ok(r.stdout.includes('----- COPIA HASTA AQUI -----'));
});

const prompt = (idioma) => readFileSync(join(raiz, `plugins/adaptar/prompts/memoria-${idioma}.txt`), 'utf8');
const URLS = [['chatgpt', 'https://chatgpt.com/'], ['claude', 'https://claude.ai/new'], ['gemini', 'https://gemini.google.com/']];
for (const [ia, url] of URLS) {
  for (const idioma of ['es', 'en']) {
    test(`copiar-prompt-memoria en Windows: ${ia} ${idioma} copia el texto exacto y abre ${url}`, () => {
      const { env } = entornoCasa();
      const { bin, reg, copia } = FONT();
      const r = bash([join(ada, 'copiar-prompt-memoria.sh'), ia, idioma], conPath(fingirWindows(env), bin));
      assert.equal(r.status, 0, r.stderr);
      assert.equal(readFileSync(copia, 'utf8'), prompt(idioma));
      assert.ok(readFileSync(reg, 'utf8').includes(`Start-Process '${url}'`));
      assert.equal(r.stdout.trim().split('\n').length, 1, 'imprime una sola línea');
    });
  }
}

test('copiar-prompt-memoria en Windows: otra copia pero no abre nada', () => {
  const { env } = entornoCasa();
  const { bin, reg, copia } = FONT();
  const r = bash([join(ada, 'copiar-prompt-memoria.sh'), 'otra', 'es'], conPath(fingirWindows(env), bin));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(copia, 'utf8'), prompt('es'));
  assert.ok(!readFileSync(reg, 'utf8').includes('Start-Process'));
});

test('copiar-prompt-memoria en Windows: si no abre el navegador, da el enlace y avisa que ya está copiado', () => {
  const { env } = entornoCasa();
  const { bin, copia } = FONT(true);
  const r = bash([join(ada, 'copiar-prompt-memoria.sh'), 'chatgpt', 'es'], conPath(fingirWindows(env), bin));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(copia, 'utf8'), prompt('es'));
  assert.match(r.stdout, /No pude abrir el navegador/);
  assert.match(r.stdout, /https:\/\/chatgpt\.com\//);
  assert.match(r.stdout, /ya está copiado/);
});

test('listar-agentes en Windows imprime la ruta del catálogo en forma de Windows (D:/...)', () => {
  const { home, env } = entornoCasa();
  const plug = join(tmp('cache-'), 'complementos');
  mkdirSync(join(plug, 'skills/instalar-complementos'), { recursive: true });
  writeFileSync(join(plug, 'skills/instalar-complementos/catalogo.json'), '{}');
  json(join(home, '.claude/plugins/installed_plugins.json'), {
    version: 2, plugins: { 'complementos@setup-ceo': [{ installPath: plug, version: '1.0.0' }] } });
  const bin = tmp('falsos-');
  // cygpath falso: -u devuelve la ruta tal cual; -m la entrega con barras normales como lo haría el de verdad.
  ejecutable(join(bin, 'cygpath'), '#!/bin/sh\nif [ "$1" = "-m" ]; then echo "W:/${2#/}"; else echo "$2"; fi\n');
  const r = bash([join(ada, 'listar-agentes.sh')], conPath(fingirWindows({ ...env, JSON_SIN_PLUTIL: '1' }), bin));
  const l = r.stdout.split('\n').find((x) => x.startsWith('CATALOGO:'));
  assert.match(l, /^CATALOGO: W:\/.*\/skills\/instalar-complementos\/catalogo\.json$/, r.stdout);
});

test('el paso 3 de novedades usa buscar-claude y no dice "tu Mac"', () => {
  const t = readFileSync(join(raiz, 'plugins/actualizaciones/skills/novedades/SKILL.md'), 'utf8');
  assert.ok(t.includes('buscar-claude.sh'));
  assert.ok(!/revisa tu Mac/.test(t));
});
