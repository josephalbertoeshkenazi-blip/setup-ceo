// La integración continua: el flujo de trabajo y los dos guiones de prueba real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { raiz } from './ayuda.mjs';

const leer = (r) => readFileSync(join(raiz, r), 'utf8');
const flujo = () => leer('.github/workflows/pruebas.yml');

test('el flujo existe y corre en Windows y en Mac', () => {
  const y = flujo();
  assert.match(y, /windows-latest/);
  assert.match(y, /macos-latest/);
  assert.match(y, /matrix:/);
});

test('el flujo ignora las ramas temporales, baja todo el historial y puede escribir', () => {
  const y = flujo();
  assert.match(y, /branches-ignore:\s*\[\s*'ci-\*'\s*,\s*'prueba-\*'\s*\]/);
  assert.match(y, /fetch-depth:\s*0/);
  assert.match(y, /contents:\s*write/);
  assert.match(y, /shell:\s*bash/);
});

test('el flujo solo usa las dos acciones permitidas', () => {
  const usos = [...flujo().matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
  for (const u of usos) assert.ok(['actions/checkout@v4', 'actions/setup-node@v4'].includes(u), u);
});

test('la instalación y la actualización corren solo en push', () => {
  const y = flujo();
  assert.match(y, /probar-instalacion\.sh/);
  assert.match(y, /probar-actualizacion\.sh/);
  assert.match(y, /github\.event_name == 'push'/);
});

for (const s of ['scripts/probar-instalacion.sh', 'scripts/probar-actualizacion.sh']) {
  test(`${s} existe, es bash válido y borra su rama temporal con trap`, () => {
    assert.ok(existsSync(join(raiz, s)), 'falta el archivo');
    const r = spawnSync('bash', ['-n', join(raiz, s)], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const t = leer(s);
    assert.match(t, /trap\s+\S+\s+EXIT/);
    assert.match(t, /borrar_rama/);
    const todo = t + leer('scripts/probar-comun.sh');
    assert.match(todo, /push\s+-q\s+origin\s+--delete/);
    assert.match(todo, /export USERPROFILE/);
    assert.match(todo, /mktemp -d "\$\{TMPDIR:-\/tmp\}\/probar\.XXXXXX"/);
  });
}

// --- La limpieza corre de verdad (sin red: git y claude son de mentira) ---
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { delimiter } from 'node:path';

function escenario(claudeCuerpo) {
  const base = mkdtempSync(join(tmpdir(), 'ci-limpieza-'));
  const bin = join(base, 'bin');
  const tmp = join(base, 'tmp');
  mkdirSync(bin); mkdirSync(tmp);
  const log = join(base, 'git.log');
  const marca = join(base, 'claude-corre');
  const f = (n, c) => { writeFileSync(join(bin, n), `#!/bin/bash\n${c}\n`); chmodSync(join(bin, n), 0o755); };
  f('git', `echo "$@" >> "${log.replace(/\\/g, '/')}"\nexit 0`);
  f('claude', claudeCuerpo.replace('MARCA', marca.replace(/\\/g, '/')));
  const env = {
    ...process.env,
    PATH: `${bin}${delimiter}${process.env.PATH}`,
    TMPDIR: tmp,
    PROBAR_REPO: 'dueno/repo',
    PROBAR_ESPERA: '0',
  };
  return { base, tmp, log, marca, env };
}
const script = join(raiz, 'scripts/probar-instalacion.sh');
const sobras = (tmp) => readdirSync(tmp).filter((x) => x.startsWith('probar.'));

test('si la instalación falla, el trap borra la rama temporal y la casa temporal', () => {
  const e = escenario('exit 1');
  const r = spawnSync('bash', [script, 'HEAD', 'prueba-xyz'], { env: e.env, encoding: 'utf8' });
  assert.notEqual(r.status, 0, r.stdout + r.stderr);
  const log = readFileSync(e.log, 'utf8');
  assert.match(log, /push -q origin \+HEAD\^\{commit\}:refs\/heads\/prueba-xyz/);
  assert.match(log, /push -q origin --delete prueba-xyz/);
  assert.deepEqual(sobras(e.tmp), []);
});

test('si llega SIGTERM a media prueba, también se limpia', { skip: process.platform === 'win32' ? 'grupos de procesos no existen en Windows' : false }, async () => {
  const e = escenario('touch MARCA\nsleep 30');
  const hijo = spawn('bash', [script, 'HEAD', 'prueba-term'], { env: e.env, detached: true, stdio: 'ignore' });
  const cerro = new Promise((res) => hijo.on('exit', (code, sig) => res({ code, sig })));
  for (let i = 0; i < 100 && !existsSync(e.marca); i++) await new Promise((r) => setTimeout(r, 100));
  assert.ok(existsSync(e.marca), 'claude de mentira nunca arrancó');
  process.kill(-hijo.pid, 'SIGTERM');
  await cerro;
  const log = readFileSync(e.log, 'utf8');
  assert.match(log, /push -q origin --delete prueba-term/);
  assert.deepEqual(sobras(e.tmp), []);
});

test('el flujo agrega la ruta en forma de Windows y borra las ramas al final', () => {
  const y = flujo();
  assert.match(y, /cygpath -w "\$USERPROFILE\/\.local\/bin" >> "\$GITHUB_PATH"/);
  assert.match(y, /if: always\(\) && github\.event_name == 'push'/);
  for (const s of ['ci-inst-', 'ci-act-']) assert.ok(y.includes(`push origin --delete "${s}`), s);
});

// --- Publicar solo versiones con etiqueta ---
test('pruebas.yml prueba desde 2.2.0 y 2.0.0 con etiquetas', () => {
  const y = flujo();
  assert.match(y, /probar-actualizacion\.sh v2\.2\.0 "\$GITHUB_SHA"/);
  assert.match(y, /probar-actualizacion\.sh v2\.0\.0 "\$GITHUB_SHA"/);
  assert.match(y, /probar-actualizacion\.sh v2\.1\.0 "\$GITHUB_SHA"/);
  assert.doesNotMatch(y, /probar-actualizacion\.sh [0-9a-f]{7}\b/);
  assert.match(y, /fetch-tags:\s*true/);
  assert.match(y, /Actualización real desde 2\.2\.0/);
  assert.match(y, /Actualización real desde 2\.0\.0/);
  assert.ok(y.includes('push origin --delete "ci-act-$GITHUB_RUN_ID-$RUNNER_OS-220"'));
});

test('pruebas.yml corre en desarrollo', () => {
  const m = flujo().match(/branches-ignore:\s*\[([^\]]*)\]/);
  assert.ok(m, 'falta branches-ignore');
  const patrones = m[1].split(',').map((p) => p.trim().replace(/^'|'$/g, ''));
  for (const p of patrones) {
    const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    assert.ok(!re.test('desarrollo'), `desarrollo calza ${p}`);
  }
});

test('probar-actualizacion.sh espera el aviso nuevo, nunca "hay una versión nueva"', () => {
  const t = leer('scripts/probar-actualizacion.sh');
  assert.match(t, /grep -qi/);
  assert.match(t, /hay una versión nueva/);
  assert.match(t, /se actualizó solo/);
});

test('publicada.yml revisa la etiqueta', () => {
  assert.ok(existsSync(join(raiz, '.github/workflows/publicada.yml')), 'falta el archivo');
  const y = leer('.github/workflows/publicada.yml');
  assert.match(y, /branches:\s*\[\s*main\s*\]/);
  assert.match(y, /git tag --points-at HEAD/);
  assert.match(y, /fetch-depth:\s*0/);
  assert.match(y, /fetch-tags:\s*true/);
  const usos = [...y.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
  for (const u of usos) assert.equal(u, 'actions/checkout@v4');
});

test('publicar.sh exige la etiqueta, las pruebas y --volver', () => {
  const s = join(raiz, 'scripts/publicar.sh');
  assert.ok(existsSync(s), 'falta el archivo');
  assert.equal(spawnSync('bash', ['-n', s], { encoding: 'utf8' }).status, 0);
  const t = leer('scripts/publicar.sh');
  assert.match(t, /ls-remote --tags/);
  assert.match(t, /gh run list/);
  assert.match(t, /--volver/);
  assert.equal(spawnSync('bash', [s], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync('bash', [s, '1.2'], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync('bash', [s, '1.2.3', '--otra'], { encoding: 'utf8' }).status, 2);
});

// --- Fix round 1 ---
function gitEn(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

test('subir_rama sube a una rama el commit de una etiqueta anotada (repo bare local)', () => {
  const base = mkdtempSync(join(tmpdir(), 'ci-subir-'));
  const bare = join(base, 'origen.git');
  const trabajo = join(base, 'trabajo');
  mkdirSync(trabajo);
  gitEn(base, 'init', '-q', '--bare', bare);
  gitEn(trabajo, 'init', '-q');
  gitEn(trabajo, 'remote', 'add', 'origin', bare);
  writeFileSync(join(trabajo, 'a.txt'), 'uno\n');
  gitEn(trabajo, 'add', '.');
  gitEn(trabajo, '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'uno');
  gitEn(trabajo, '-c', 'tag.gpgsign=false', 'tag', '-a', 'v9.9.9', '-m', 'anotada');
  const commit = gitEn(trabajo, 'rev-parse', 'v9.9.9^{commit}');
  assert.notEqual(gitEn(trabajo, 'rev-parse', 'v9.9.9'), commit, 'la etiqueta debe ser anotada');
  const comun = join(raiz, 'scripts/probar-comun.sh').replace(/\\/g, '/');
  const r = spawnSync('bash', ['-c', `. "${comun}"; subir_rama v9.9.9 ci-prueba`], { cwd: trabajo, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(gitEn(base, '--git-dir', bare, 'rev-parse', 'refs/heads/ci-prueba'), commit);
});

test('publicada.yml mira todas las etiquetas del commit, no solo una', () => {
  const y = leer('.github/workflows/publicada.yml');
  assert.match(y, /git tag --points-at HEAD \| grep -qx "v\$v"/);
  assert.doesNotMatch(y, /git describe/);
});

test('publicar.sh solo cuenta pruebas de push y mueve main con force-with-lease', () => {
  const t = leer('scripts/publicar.sh');
  assert.match(t, /--event push/);
  assert.match(t, /--force-with-lease="refs\/heads\/main:\$ACTUAL_SHA"/);
  assert.doesNotMatch(t, /"\$\{FORZAR\}\$\{SHA\}/);
});

test('pruebas.yml prueba la actualización desde 1.0.0 y 1.1.0', () => {
  const y = flujo();
  assert.match(y, /probar-actualizacion\.sh v1\.0\.0 "\$GITHUB_SHA" "ci-act-\$GITHUB_RUN_ID-\$RUNNER_OS-100"/);
  assert.match(y, /probar-actualizacion\.sh v1\.1\.0 "\$GITHUB_SHA" "ci-act-\$GITHUB_RUN_ID-\$RUNNER_OS-110"/);
  assert.match(y, /Actualización real desde 1\.0\.0/);
  assert.match(y, /Actualización real desde 1\.1\.0/);
  assert.ok(y.includes('push origin --delete "ci-act-$GITHUB_RUN_ID-$RUNNER_OS-100"'));
  assert.ok(y.includes('push origin --delete "ci-act-$GITHUB_RUN_ID-$RUNNER_OS-110"'));
});

test('probar-actualizacion.sh instala solo los plugins que existían y protege mi-perfil', () => {
  const t = leer('scripts/probar-actualizacion.sh');
  const c = leer('scripts/probar-comun.sh');
  assert.match(t, /marketplace\.json/);
  assert.match(t, /mi-perfil\/ceo\.md/);
  assert.match(c, /require\("crypto"\)/);
  assert.doesNotMatch(t + c, /shasum|sha256sum|md5/);
  assert.match(t, /PLUGINS_BASE=/);
  assert.match(c, /PLUGINS_BASE/);
});
