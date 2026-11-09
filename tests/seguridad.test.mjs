// Pruebas del plugin seguridad (T4, T8). Todo corre con un HOME falso y un PATH que solo
// tiene comandos simulados: nunca toca la Mac real ni pide clave.
import { test as testBase } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync,
  symlinkSync, chmodSync, statSync, rmSync, cpSync, utimesSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

import { raiz, entornoCasa } from './ayuda.mjs';
const S = join(raiz, 'plugins/seguridad/scripts');
const BASH = '/bin/bash';

// testMac marca a mano las pruebas que necesitan el entorno de Mac de este archivo (herramientas falsas osascript, plutil,
// stat -f, socketfilterfw, enlaces simbólicos en un PATH propio, /bin/bash). En Windows se saltan solo esas; lo que recibe
// un dueño de Windows lo cubre tests/windows-seguridad.test.mjs. Las demás pruebas corren en las dos plataformas.
function testMac(nombre, fn) {
  if (process.platform === 'win32') return testBase(nombre, { skip: 'necesita el entorno de macOS (herramientas falsas de Mac); en Windows lo cubre windows-seguridad.test.mjs' }, fn);
  return testBase(nombre, fn);
}
const test = testBase;

// El secreto falso se arma en memoria: nunca queda escrito tal cual en el repo.
const SECRETO = 'gh' + 'p_' + 'Zq8Wm3Xk9TrB5nLc2VdY7HsFj4PgA6EuKo1N'.slice(0, 36);

const IDS = ['secretos-disco', 'secretos-historial', 'env-archivos', 'env-en-git', 'filevault', 'actualizaciones',
  'copias', 'bloqueo', 'firewall', 'admins', 'env-permisos', 'ssh-permisos', 'claude-deny', 'claude-extras',
  'invitado', 'mdm', 'sistema', 'transcripciones'];

const SISTEMA = ['awk', 'basename', 'cat', 'chmod', 'cmp', 'cp', 'cut', 'date', 'dirname', 'du', 'find', 'git', 'grep',
  'head', 'ls', 'mkdir', 'mktemp', 'mv', 'od', 'paste', 'perl', 'plutil', 'rm', 'sed', 'sort', 'stat', 'tail', 'tr',
  'wc', 'bash', 'sh', 'touch', 'uniq', 'xargs', 'env', 'id'];

function buscar(nombre) {
  for (const d of (process.env.PATH || '').split(':')) {
    const p = join(d, nombre);
    if (existsSync(p)) return p;
  }
  return null;
}

const FALSOS = {
  fdesetup: 'echo "FileVault is On."',
  tmutil: 'echo "tmutil: No destinations configured."',
  sysadminctl: 'echo "2026-01-01 10:00:00.000 sysadminctl[1:2] screenLock delay is 300 seconds" >&2',
  softwareupdate: 'case "$1" in --schedule) echo "Automatic checking for updates is turned on";; esac',
  defaults: `case "$*" in
  *"write"*|*"delete"*) echo "defaults $*" >>"$FAKE_LOG"; mkdir -p "$FAKE_LOG.def"
    case "$*" in *"-bool true"*) echo 1 >"$FAKE_LOG.def/$3";; *"-bool false"*) echo 0 >"$FAKE_LOG.def/$3";; esac;;
  *read*) k=""; for a in "$@"; do k="$a"; done
    if [ -f "$FAKE_LOG.def/$k" ]; then cat "$FAKE_LOG.def/$k"; exit 0; fi
    case "$*" in
  *CriticalUpdateInstall*) echo 0;;
  *com.apple.SoftwareUpdate*) echo 1;;
  *GuestEnabled*) echo 0;;
  *) exit 1;;
    esac;;
  *) exit 1;;
esac`,
  dscl: 'echo "GroupMembership: root fakeuser _mbsetupuser"',
  profiles: `echo "There are no configuration profiles installed for user 'fakeuser'"`,
  csrutil: 'echo "System Integrity Protection status: enabled."',
  spctl: 'echo "assessments enabled"',
  sw_vers: 'echo 26.0',
  'xcode-select': 'echo /Library/Developer/CommandLineTools',
  nc: 'exit 1',
  osascript: `echo "$*" >>"$FAKE_LOG_OSA"
[ -z "\${FAKE_OSA_ERR:-}" ] || echo "$FAKE_OSA_ERR" >&2
[ "\${FAKE_OSA_RC:-0}" = 0 ] || exit "$FAKE_OSA_RC"
if [ -z "\${FAKE_OSA_NOOP:-}" ]; then
  c=\${2#do shell script \\\"}; c=\${c%\\\" with administrator privileges}
  # El script siempre manda la ruta fija del firewall; en las pruebas se cambia por el firewall falso.
  [ -n "\${FAKE_FW:-}" ] && c=$(printf %s "$c" | sed "s#/usr/libexec/ApplicationFirewall/socketfilterfw#$FAKE_FW#g")
  sh -c "$c" >/dev/null 2>&1; exit $?
fi
exit 0`,
  systemsetup: 'exit 0',
  gitleaks: `target=""; rep=""
for a in "$@"; do
  if [ "$prev" = "--report-path" ]; then rep="$a"; fi
  case "$a" in -*) ;; *) [ -z "$target" ] && [ "$prev" != "--report-path" ] && [ "$prev" != "--config" ] && [ "$prev" != "--report-format" ] && [ "$prev" != "--exit-code" ] && [ "$a" != dir ] && [ "$a" != git ] && target="$a";; esac
  prev="$a"
done
if [ -n "$rep" ]; then
  printf '[\\n {\\n  "RuleID": "github-pat",\\n  "Secret": "%s",\\n  "Match": "token=%s",\\n  "File": "%s",\\n  "Fingerprint": "x"\\n }\\n]\\n' "$FAKE_SECRET" "$FAKE_SECRET" "$target/aqui.txt" >"$rep"
fi
exit 0`,
  brew: 'echo "brew $*" >>"$FAKE_LOG"',
  claude: `case "$1 $2" in
  "plugin uninstall") echo "claude $*" >>"$FAKE_LOG"; [ -n "$FAKE_NOOP_QUITAR" ] || echo "$3" >>"$FAKE_LOG.gone";;
  "mcp remove") echo "claude $*" >>"$FAKE_LOG"; [ -n "$FAKE_NOOP_QUITAR" ] || echo "$3" >>"$FAKE_LOG.gone";;
  "plugin list") printf 'Installed plugins:\\n\\n'; grep -qx 'uno@mercado' "$FAKE_LOG.gone" 2>/dev/null || printf '  > uno@mercado\\n    Version: 1.0.0\\n    Scope: user\\n\\n'; printf '  > dos@mercado\\n    Version: 1.0.0\\n';;
  "mcp list") printf 'Checking MCP server health...\\n\\n'; grep -qx 'miconector' "$FAKE_LOG.gone" 2>/dev/null || printf 'miconector: https://example.invalid/mcp - Connected\\n';;
  "mcp get") printf '%s:\\n  Scope: User config\\n  Type: http\\n  URL: https://example.invalid/mcp\\n' "$3";;
  *) echo "claude $*" >>"$FAKE_LOG";;
esac`,
  socketfilterfw: `case "$1" in
  --getglobalstate) if [ "$(cat "$FAKE_LOG.fw" 2>/dev/null)" = on ]; then echo "Firewall is enabled. (State = 1)"; else echo "Firewall is disabled. (State = 0)"; fi;;
  --setglobalstate) echo "socketfilterfw $*" >>"$FAKE_LOG"; echo "$2" >"$FAKE_LOG.fw";;
  *) echo "socketfilterfw $*" >>"$FAKE_LOG";; esac`,
};

function entorno({ sin = [], con = [], extra = {} } = {}) {
  const raizT = mkdtempSync(join(tmpdir(), 'seg-test-'));
  const home = join(raizT, 'home');
  const bin = join(raizT, 'bin');
  const tmp = join(raizT, 'tmp');
  for (const d of [home, bin, tmp]) mkdirSync(d);
  for (const c of SISTEMA) {
    if (sin.includes(c)) continue;
    const p = buscar(c);
    if (p) symlinkSync(p, join(bin, c));
  }
  if (!sin.includes('jq') && buscar('jq')) symlinkSync(buscar('jq'), join(bin, 'jq'));
  for (const [n, cuerpo] of Object.entries(FALSOS)) {
    if (sin.includes(n)) continue;
    if (n === 'socketfilterfw') continue;
    writeFileSync(join(bin, n), `#!/bin/sh\n${cuerpo}\n`);
    chmodSync(join(bin, n), 0o755);
  }
  writeFileSync(join(raizT, 'sfw'), `#!/bin/sh\n${FALSOS.socketfilterfw}\n`);
  chmodSync(join(raizT, 'sfw'), 0o755);
  const log = join(raizT, 'log.txt'); const logOsa = join(raizT, 'osa.txt');
  writeFileSync(log, ''); writeFileSync(logOsa, '');
  const env = {
    HOME: home, PATH: bin, TMPDIR: tmp, FAKE_LOG: log, FAKE_LOG_OSA: logOsa, FAKE_SECRET: SECRETO,
    SOCKETFILTERFW: join(raizT, 'sfw'), FAKE_FW: join(raizT, 'sfw'), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', LC_ALL: 'C', ...extra,
  };
  const correr = (script, args = [], more = {}) => {
    const { __cwd, ...resto } = more;
    const envR = { ...env, ...resto };
    if (script === 'admin.sh' && !('ADMIN_PRUEBA' in resto) && !('SOCKETFILTERFW' in resto)) delete envR.SOCKETFILTERFW;
    const r = spawnSync(BASH, [join(S, script), ...args], { env: envR, cwd: __cwd, encoding: 'utf8', timeout: 60000 });
    // Si el script se pasó del tiempo (carga alta) spawnSync lo mata y la salida queda cortada: se dice en el mensaje.
    const cortado = r.error || r.signal ? `\n[el script no terminó: ${r.error?.code ?? r.signal} tras ${60}s máx.]` : '';
    return { out: r.stdout, err: r.stderr, rc: r.status, todo: r.stdout + r.stderr + cortado };
  };
  const git = (dir, ...a) => spawnSync('git', ['-C', dir, ...a], { env, encoding: 'utf8' });
  return { raizT, home, bin, tmp, env, log, logOsa, correr, git, limpiar: () => rmSync(raizT, { recursive: true, force: true }) };
}

const escribir = (p, c, modo) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c); if (modo) chmodSync(p, modo); };
const modo = (p) => (statSync(p).mode & 0o777).toString(8);
const leer = (p) => readFileSync(p);
const arbol = (d) => readdirSync(d, { recursive: true }).sort().join('\n');

// ---------- (1) revisión estática de revisar.sh ----------
test('revisar.sh es de solo lectura (revisión estática)', () => {
  const src = readFileSync(join(S, 'revisar.sh'), 'utf8').split('\n');
  const codigo = src.filter((l) => !/^\s*#/.test(l));
  for (const l of codigo) {
    assert.doesNotMatch(l, /\bsudo\b/, `sudo: ${l}`);
    assert.doesNotMatch(l, /\bchmod\b/.test(l) && !/chmod 700 "\$TMP"/.test(l) ? /./ : /^\b$/, `chmod: ${l}`);
    assert.doesNotMatch(l, /defaults\s+write|defaults\s+delete/, l);
    assert.doesNotMatch(l, /\btee\b/, l);
    assert.doesNotMatch(l, /\b(mv|cp|ln|touch|osascript|launchctl|networksetup|systemsetup)\b/, l);
    if (/\brm\b/.test(l)) assert.match(l, /^trap 'rm -rf "\$TMP"' EXIT$/, `rm fuera del trap: ${l}`);
    const sinPermitidos = l
      .replace(/2>&1/g, '').replace(/>&2/g, '')
      .replace(/>\s*\/dev\/null/g, '').replace(/2>\s*\/dev\/null/g, '')
      .replace(/>>?\s*"\$TMP[^"]*"/g, '').replace(/2>>?\s*"\$TMP[^"]*"/g, '');
    // los ">" que quedan deben ser solo de texto entre comillas de mensajes (p. ej. "Ajustes > Privacidad")
    const sinTexto = sinPermitidos.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");
    assert.doesNotMatch(sinTexto, />/, `redirección no permitida: ${l}`);
  }
  assert.ok(codigo.some((l) => /mktemp -d/.test(l)));
  assert.ok(codigo.some((l) => /chmod 700 "\$TMP"/.test(l)));
});

// ---------- (2) revisar.sh con HOME falso ----------
function prepararHome(e) {
  const d = join(e.home, 'Desktop', 'proy');
  mkdirSync(d, { recursive: true });
  e.git(d, 'init', '-q');
  escribir(join(d, '.env'), 'CONTENIDO_PRIVADO=1\n', 0o644);
  escribir(join(e.home, 'Documents', 'otro', '.env.local'), 'CONTENIDO_PRIVADO=2\n', 0o600);
  escribir(join(e.home, '.zsh_history'), 'ls\n');
  escribir(join(e.home, '.ssh', 'id_ed25519'), 'x', 0o644);
  chmodSync(join(e.home, '.ssh'), 0o755);
  escribir(join(e.home, '.claude', 'projects', 'p', 'a.jsonl'), '{}\n');
}

for (const variante of ['con jq', 'sin jq']) {
  testMac(`revisar.sh: un CHEQUEO por id y el secreto falso nunca sale (${variante})`, () => {
    if (variante === 'con jq' && !buscar('jq')) return;
    const e = entorno({ sin: variante === 'sin jq' ? ['jq'] : [] });
    try {
      prepararHome(e);
      const antes = arbol(e.home);
      const r = e.correr('revisar.sh');
      assert.equal(r.rc, 0, r.todo);
      const lineas = r.out.trim().split('\n');
      assert.deepEqual(lineas.map((l) => l.match(/^CHEQUEO id=(\S+) estado=(bien|mal|no-se) detalle=.+$/)?.[1]), IDS, r.out);
      assert.ok(!r.todo.includes(SECRETO), 'el secreto falso apareció en la salida');
      assert.ok(!r.todo.includes('CONTENIDO_PRIVADO'), 'se abrió un .env');
      const estado = Object.fromEntries(lineas.map((l) => [l.match(/id=(\S+)/)[1], l.match(/estado=(\S+)/)[1]]));
      assert.equal(estado['secretos-disco'], 'mal');
      assert.equal(estado['secretos-historial'], 'mal');
      assert.equal(estado['filevault'], 'bien');
      assert.equal(estado['copias'], 'mal');
      assert.equal(estado['firewall'], 'mal');
      assert.equal(estado['actualizaciones'], 'mal');
      assert.equal(estado['env-permisos'], 'mal');
      assert.equal(estado['ssh-permisos'], 'mal');
      assert.equal(estado['claude-deny'], 'mal');
      assert.equal(estado['bloqueo'], 'no-se');
      assert.equal(estado['invitado'], 'bien');
      assert.equal(estado['sistema'], 'bien');
      assert.match(lineas.find((l) => l.includes('id=env-archivos')), /Desktop\/proy\/\.env/);
      assert.match(lineas.find((l) => l.includes('id=secretos-disco')), /github-pat/);
      assert.doesNotMatch(r.out, new RegExp(e.home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/'), 'rutas absolutas del HOME');
      assert.equal(arbol(e.home), antes, 'revisar.sh cambió archivos');
      assert.deepEqual(readdirSync(e.tmp), [], 'la carpeta temporal no se borró');
      assert.equal(modo(join(e.home, '.ssh')), '755');
    } finally { e.limpiar(); }
  });
}

testMac('revisar.sh sin gitleaks dice no-se, --solo y errores', () => {
  const e = entorno({ sin: ['gitleaks'] });
  try {
    prepararHome(e);
    const r = e.correr('revisar.sh', ['--solo', 'secretos-disco']);
    assert.equal(r.out.trim(), 'CHEQUEO id=secretos-disco estado=no-se detalle=gitleaks no está instalado');
    const s = e.correr('revisar.sh', ['--solo', 'filevault']);
    assert.equal(s.out.trim().split('\n').length, 1);
    const x = e.correr('revisar.sh', ['--solo', 'nada']);
    assert.equal(x.rc, 2);
  } finally { e.limpiar(); }
});

testMac('revisar.sh: .env en git sin ignorar y ya subido se marcan', () => {
  const e = entorno();
  try {
    prepararHome(e);
    const r = e.correr('revisar.sh', ['--solo', 'env-en-git']);
    assert.match(r.out, /estado=mal/);
    const d = join(e.home, 'Desktop', 'proy');
    e.git(d, 'add', '-f', '.env');
    const r2 = e.correr('revisar.sh', ['--solo', 'env-en-git']);
    assert.match(r2.out, /ya subidos a git.*Desktop\/proy\/\.env/);
    assert.ok(!r2.todo.includes('CONTENIDO_PRIVADO'));
  } finally { e.limpiar(); }
});

// ---------- (3) arreglar.sh: hacer -> registro -> deshacer ----------
const COMO_DESHACER_ARREGLAR = /Cómo deshacer: `bash "\$\(ls -dt ~\/\.claude\/plugins\/cache\/\*\/seguridad\/\*\/scripts 2>\/dev\/null \| head -1\)\/arreglar\.sh" \S+ deshacer/;
const haceYRegistra = (e, id, ...extra) => {
  const r = e.correr('arreglar.sh', [id, 'hacer', ...extra]);
  assert.equal(r.rc, 0, r.todo);
  const reg = readFileSync(join(e.home, '.claude/mi-perfil/seguridad/cambios.md'), 'utf8');
  assert.match(reg, COMO_DESHACER_ARREGLAR);
  assert.match(reg, /o pídele a Claude: deshaz /);
  return { r, reg };
};

testMac('arreglar.sh env-gitignore: hacer y deshacer dejan los .gitignore byte por byte', () => {
  const e = entorno();
  try {
    const p1 = join(e.home, 'Desktop', 'uno'); const p2 = join(e.home, 'Desktop', 'dos');
    for (const p of [p1, p2]) { mkdirSync(p, { recursive: true }); e.git(p, 'init', '-q'); escribir(join(p, '.env'), 'A=1\n'); }
    const orig = 'node_modules\n*.log'; // sin salto de línea final
    escribir(join(p1, '.gitignore'), orig);
    const { r } = haceYRegistra(e, 'env-gitignore');
    const g1 = readFileSync(join(p1, '.gitignore'), 'utf8');
    assert.equal(g1, orig + '\n.env*\n!.env.example\n');
    assert.equal(readFileSync(join(p2, '.gitignore'), 'utf8'), '.env*\n!.env.example\n');
    assert.match(r.out, /CHEQUEO id=env-en-git estado=bien/);
    // idempotente
    assert.match(e.correr('arreglar.sh', ['env-gitignore', 'hacer']).out, /ya está aplicado/);
    assert.equal(readFileSync(join(p1, '.gitignore'), 'utf8'), g1);
    const d = e.correr('arreglar.sh', ['env-gitignore', 'deshacer']);
    assert.equal(d.rc, 0, d.todo);
    assert.ok(leer(join(p1, '.gitignore')).equals(Buffer.from(orig)));
    assert.ok(!existsSync(join(p2, '.gitignore')));
    assert.equal(readFileSync(join(p1, '.env'), 'utf8'), 'A=1\n');
    assert.match(e.correr('arreglar.sh', ['env-gitignore', 'deshacer']).out, /nada que deshacer/);
  } finally { e.limpiar(); }
});

testMac('arreglar.sh env-gitignore: si el archivo cambió después, solo quita las 2 líneas', () => {
  const e = entorno();
  try {
    const p = join(e.home, 'Desktop', 'uno'); mkdirSync(p, { recursive: true }); e.git(p, 'init', '-q');
    escribir(join(p, '.env'), 'A=1\n'); escribir(join(p, '.gitignore'), 'dist\n');
    haceYRegistra(e, 'env-gitignore');
    writeFileSync(join(p, '.gitignore'), readFileSync(join(p, '.gitignore'), 'utf8') + 'build\n');
    e.correr('arreglar.sh', ['env-gitignore', 'deshacer']);
    assert.equal(readFileSync(join(p, '.gitignore'), 'utf8'), 'dist\nbuild\n');
  } finally { e.limpiar(); }
});

testMac('arreglar.sh env-permisos y ssh-permisos: chmod y deshacer', () => {
  const e = entorno();
  try {
    const a = join(e.home, 'Desktop', 'p', '.env'); const b = join(e.home, 'Documents', 'q', '.env.local'); const c = join(e.home, 'Desktop', 'ok', '.env');
    escribir(a, 'A=1', 0o644); escribir(b, 'B=2', 0o664); escribir(c, 'C=3', 0o600);
    haceYRegistra(e, 'env-permisos');
    assert.deepEqual([a, b, c].map(modo), ['600', '600', '600']);
    e.correr('arreglar.sh', ['env-permisos', 'deshacer']);
    assert.deepEqual([a, b, c].map(modo), ['644', '664', '600']);

    const ssh = join(e.home, '.ssh'); mkdirSync(ssh);
    escribir(join(ssh, 'id_rsa'), 'k', 0o644); escribir(join(ssh, 'id_rsa.pub'), 'p', 0o644); chmodSync(ssh, 0o755);
    haceYRegistra(e, 'ssh-permisos');
    assert.deepEqual([ssh, join(ssh, 'id_rsa'), join(ssh, 'id_rsa.pub')].map(modo), ['700', '600', '644']);
    e.correr('arreglar.sh', ['ssh-permisos', 'deshacer']);
    assert.deepEqual([ssh, join(ssh, 'id_rsa'), join(ssh, 'id_rsa.pub')].map(modo), ['755', '644', '644']);
  } finally { e.limpiar(); }
});

testMac('arreglar.sh claude-deny: settings.json vuelve byte por byte', () => {
  const casos = [
    '{ "model" :  "x",\n\t"permissions": { "allow": ["Bash(ls)"] } ,\n "zeta":[1,2] }\n',
    '{"permissions":{"deny":["Read(otra)"],"allow":[]}}',
    '{}',
    null,
  ];
  for (const original of casos) {
    const e = entorno();
    try {
      const s = join(e.home, '.claude', 'settings.json');
      if (original !== null) escribir(s, original);
      const { r } = haceYRegistra(e, 'claude-deny');
      const txt = readFileSync(s, 'utf8');
      for (const regla of ['Read(//**/.env)', 'Read(~/.ssh/**)', 'Read(~/.aws/**)']) assert.ok(txt.replace(/\\/g, '').includes(regla), `${regla} en ${txt}`);
      JSON.parse(txt);
      if (original && original.includes('Read(otra)')) assert.ok(txt.includes('Read(otra)'));
      assert.match(r.out, /CHEQUEO id=claude-deny estado=bien/);
      const d = e.correr('arreglar.sh', ['claude-deny', 'deshacer']);
      assert.equal(d.rc, 0, d.todo);
      if (original === null) assert.ok(!existsSync(s));
      else assert.ok(leer(s).equals(Buffer.from(original)), 'no quedó igual');
    } finally { e.limpiar(); }
  }
});

testMac('arreglar.sh claude-deny: un settings.json roto no se toca', () => {
  const e = entorno();
  try {
    const s = join(e.home, '.claude', 'settings.json'); escribir(s, '{ esto no es json');
    const r = e.correr('arreglar.sh', ['claude-deny', 'hacer']);
    assert.notEqual(r.rc, 0);
    assert.equal(readFileSync(s, 'utf8'), '{ esto no es json');
  } finally { e.limpiar(); }
});

testMac('arreglar.sh sandbox (4): deshacer usa el valor de antes', () => {
  // [settings original, qué queda después de deshacer con un cambio ajeno agregado entre medias]
  const casos = [
    ['{"model":"x"}', { model: 'x', extra: 1 }],
    ['{}', { extra: 1 }],
    [null, { extra: 1 }],
    ['{"model":"x","sandbox":{"enabled":true}}', { model: 'x', sandbox: { enabled: true }, extra: 1 }],
    ['{"model":"x","sandbox":{"enabled":false,"otra":1}}', { model: 'x', sandbox: { enabled: false, otra: 1 }, extra: 1 }],
  ];
  for (const [original, esperado] of casos) {
    const e = entorno();
    try {
      const s = join(e.home, '.claude', 'settings.json');
      if (original !== null) escribir(s, original);
      haceYRegistra(e, 'sandbox');
      assert.equal(JSON.parse(readFileSync(s, 'utf8')).sandbox.enabled, true);
      const j = JSON.parse(readFileSync(s, 'utf8')); j.extra = 1; writeFileSync(s, JSON.stringify(j));
      const d = e.correr('arreglar.sh', ['sandbox', 'deshacer']);
      assert.equal(d.rc, 0, d.todo);
      assert.deepEqual(JSON.parse(readFileSync(s, 'utf8')), esperado, `original ${original}`);
    } finally { e.limpiar(); }
  }
  // sin cambios ajenos: vuelve byte por byte
  for (const original of ['{"model":"x"}', '{ "sandbox" : { "enabled" : true } }\n', null]) {
    const e = entorno();
    try {
      const s = join(e.home, '.claude', 'settings.json');
      if (original !== null) escribir(s, original);
      haceYRegistra(e, 'sandbox');
      e.correr('arreglar.sh', ['sandbox', 'deshacer']);
      if (original === null) assert.ok(!existsSync(s)); else assert.ok(leer(s).equals(Buffer.from(original)));
    } finally { e.limpiar(); }
  }
});

testMac('arreglar.sh claude-deny (3): si settings.json cambió después, solo quita las reglas del arreglo', () => {
  const casos = [
    ['{"permissions":{"deny":["Read(otra)"],"allow":["Bash(ls)"]},"model":"x"}', ['Read(otra)']],
    ['{"model":"x"}', []],
    ['{}', []],
    [null, []],
  ];
  for (const [original, quedan] of casos) {
    const e = entorno();
    try {
      const s = join(e.home, '.claude', 'settings.json');
      if (original !== null) escribir(s, original);
      haceYRegistra(e, 'claude-deny');
      const j = JSON.parse(readFileSync(s, 'utf8')); j.enabledPlugins = { 'uno@mercado': true }; writeFileSync(s, JSON.stringify(j));
      const d = e.correr('arreglar.sh', ['claude-deny', 'deshacer']);
      assert.equal(d.rc, 0, d.todo);
      const f = JSON.parse(readFileSync(s, 'utf8'));
      assert.deepEqual(f.enabledPlugins, { 'uno@mercado': true }, 'se perdió lo agregado después');
      assert.deepEqual(f.permissions?.deny ?? [], quedan, `original ${original}`);
      if (original?.includes('"allow"')) assert.deepEqual(f.permissions.allow, ['Bash(ls)']);
      if (original?.includes('"model"')) assert.equal(f.model, 'x');
      assert.match(d.out, /cambió después/);
    } finally { e.limpiar(); }
  }
});

testMac('arreglar.sh gitleaks: hook en el proyecto, deshacer lo quita; sin brew explica', () => {
  const e = entorno();
  try {
    const repo = join(e.home, 'Desktop', 'r'); mkdirSync(repo, { recursive: true }); e.git(repo, 'init', '-q');
    const h = join(repo, '.git', 'hooks', 'pre-commit');
    escribir(h, '#!/bin/sh\necho propio\n', 0o755);
    const r0 = e.correr('arreglar.sh', ['gitleaks', 'hacer', repo]);
    assert.match(r0.out, /ya tiene su propio pre-commit/);
    assert.equal(readFileSync(h, 'utf8'), '#!/bin/sh\necho propio\n');
    e.correr('arreglar.sh', ['gitleaks', 'deshacer']);
    rmSync(h);
    haceYRegistra(e, 'gitleaks', repo);
    assert.match(readFileSync(h, 'utf8'), /seguridad-hook[\s\S]*gitleaks git --pre-commit --staged/);
    assert.equal(modo(h), '755');
    e.correr('arreglar.sh', ['gitleaks', 'deshacer']);
    assert.ok(!existsSync(h));
    assert.equal(readFileSync(e.log, 'utf8'), '', 'no debía llamar a brew: gitleaks ya estaba');
  } finally { e.limpiar(); }
  const e2 = entorno({ sin: ['gitleaks', 'brew'] });
  try {
    const r = e2.correr('arreglar.sh', ['gitleaks', 'hacer']);
    assert.equal(r.rc, 0);
    assert.match(r.out, /No tienes Homebrew/);
    assert.ok(!existsSync(join(e2.home, '.claude/mi-perfil/seguridad/cambios.md')));
  } finally { e2.limpiar(); }
  const e3 = entorno({ sin: ['gitleaks'] });
  try {
    e3.correr('arreglar.sh', ['gitleaks', 'hacer']);
    assert.match(readFileSync(e3.log, 'utf8'), /brew install gitleaks/);
    e3.correr('arreglar.sh', ['gitleaks', 'deshacer']);
    assert.match(readFileSync(e3.log, 'utf8'), /brew uninstall gitleaks/);
  } finally { e3.limpiar(); }
});

testMac('arreglar.sh quitar-plugin y quitar-mcp anotan cómo volver', () => {
  const e = entorno();
  try {
    const { reg } = haceYRegistra(e, 'quitar-plugin', 'uno@mercado');
    assert.match(reg, /claude plugin install uno@mercado/);
    assert.match(readFileSync(e.log, 'utf8'), /claude plugin uninstall uno@mercado/);
    e.correr('arreglar.sh', ['quitar-plugin', 'deshacer', 'uno@mercado']);
    assert.match(readFileSync(e.log, 'utf8'), /claude plugin install uno@mercado/);

    haceYRegistra(e, 'quitar-mcp', 'miconector');
    assert.match(readFileSync(e.log, 'utf8'), /claude mcp remove miconector/);
    const cfg = join(e.home, '.claude/mi-perfil/seguridad/respaldos/quitar-mcp--miconector/config.txt');
    assert.equal(modo(cfg), '600');
    e.correr('arreglar.sh', ['quitar-mcp', 'deshacer', 'miconector']);
    // vuelve al mismo alcance que tenía ("Scope: User config" -> -s user)
    assert.match(readFileSync(e.log, 'utf8'), /claude mcp add -s user --transport http miconector https:\/\/example\.invalid\/mcp/);
  } finally { e.limpiar(); }
});

testMac('arreglar.sh reglas-ia: pega las 8 reglas una vez y deshacer deja CLAUDE.md byte por byte', () => {
  const e = entorno();
  try {
    const md = join(e.home, '.claude', 'CLAUDE.md');
    const orig = '# Mis reglas\nhola'; // sin salto de línea final
    escribir(md, orig);
    const { r, reg } = haceYRegistra(e, 'reglas-ia');
    assert.match(r.out, /8 reglas/);
    assert.match(reg, /arreglar\.sh" reglas-ia deshacer/);
    const pegado = readFileSync(md, 'utf8');
    assert.ok(pegado.startsWith(orig + '\n\n<!-- reglas-ia-seguridad: inicio -->\n'), pegado.slice(0, 80));
    assert.equal(pegado.split('\n').filter((l) => /^[1-8]\. /.test(l)).length, 8);
    assert.match(e.correr('arreglar.sh', ['reglas-ia', 'hacer']).out, /ya está aplicado/);
    assert.equal(readFileSync(md, 'utf8'), pegado);
    e.correr('arreglar.sh', ['reglas-ia', 'deshacer']);
    assert.ok(leer(md).equals(Buffer.from(orig)));
    assert.match(e.correr('arreglar.sh', ['reglas-ia', 'deshacer']).out, /nada que deshacer/);

    // si CLAUDE.md cambió después, solo se quita el bloque
    haceYRegistra(e, 'reglas-ia');
    writeFileSync(md, readFileSync(md, 'utf8') + '\nlinea nueva\n');
    e.correr('arreglar.sh', ['reglas-ia', 'deshacer']);
    const final = readFileSync(md, 'utf8');
    assert.doesNotMatch(final, /reglas-ia-seguridad/);
    assert.match(final, /^# Mis reglas\nhola/);
    assert.match(final, /linea nueva/);

    // sin CLAUDE.md: lo crea y deshacer lo borra
    rmSync(md);
    haceYRegistra(e, 'reglas-ia');
    assert.ok(readFileSync(md, 'utf8').startsWith('<!-- reglas-ia-seguridad: inicio -->\n'));
    e.correr('arreglar.sh', ['reglas-ia', 'deshacer']);
    assert.ok(!existsSync(md));
  } finally { e.limpiar(); }
});

test('arreglar.sh no tiene comandos para lo que nunca se hace', () => {
  const { env } = entornoCasa();
  for (const id of ['sip', 'gatekeeper', 'borrar-env', 'reescribir-historial', 'leer-claves', 'filevault']) {
    const r = spawnSync('bash', [join(S, 'arreglar.sh'), id, 'hacer'], { env, encoding: 'utf8' });
    assert.equal(r.status, 2, id);
  }
  const src = readFileSync(join(S, 'arreglar.sh'), 'utf8') + readFileSync(join(S, 'admin.sh'), 'utf8') + readFileSync(join(S, 'comun.sh'), 'utf8');
  for (const malo of [/csrutil\s+disable/, /spctl\s+--master-disable/, /filter-branch|filter-repo|push\s+--force|reset\s+--hard/, /fdesetup\s+(disable|enable|changerecovery)/, /\bsudo\b/])
    assert.doesNotMatch(src, malo);
  assert.doesNotMatch(src, /rm\s+(-\w+\s+)*["$]*[^\n]*\.env["\s]/);
});

// ---------- (4) admin.sh ----------
testMac('admin.sh en modo de prueba solo imprime el osascript', () => {
  const e = entorno();
  try {
    prepararHome(e);
    const antes = arbol(e.home);
    for (const id of ['actualizaciones', 'firewall', 'ssh-remoto', 'invitado']) {
      for (const accion of ['hacer', 'deshacer']) {
        const r = e.correr('admin.sh', [id, accion], { ADMIN_PRUEBA: '1' });
        assert.equal(r.rc, 0, r.todo);
        const l = r.out.trim().split('\n');
        assert.equal(l.length, 1, r.out);
        assert.match(l[0], /^PRUEBA osascript -e 'do shell script ".+" with administrator privileges'$/);
      }
    }
    assert.equal(readFileSync(e.logOsa, 'utf8'), '', 'osascript se llamó');
    assert.equal(readFileSync(e.log, 'utf8'), '', 'se escribió algo del sistema');
    assert.equal(arbol(e.home), antes, 'el modo de prueba escribió archivos');
    const act = e.correr('admin.sh', ['actualizaciones', 'hacer'], { ADMIN_PRUEBA: '1' }).out;
    for (const k of ['AutomaticDownload', 'AutomaticallyInstallMacOSUpdates', 'CriticalUpdateInstall', 'ConfigDataInstall']) assert.ok(act.includes(`${k} -bool true`));
    assert.ok(act.includes('softwareupdate --schedule on'));
    assert.ok(e.correr('admin.sh', ['firewall', 'hacer'], { ADMIN_PRUEBA: '1' }).out.includes('--setglobalstate on'));
    assert.equal(e.correr('admin.sh', ['sip', 'hacer'], { ADMIN_PRUEBA: '1' }).rc, 2);
  } finally { e.limpiar(); }
});

testMac('admin.sh con osascript simulado: registra, guarda lo de antes y deshace', () => {
  const e = entorno();
  try {
    const r = e.correr('admin.sh', ['actualizaciones', 'hacer']);
    assert.equal(r.rc, 0, r.todo);
    const osa = readFileSync(e.logOsa, 'utf8');
    assert.match(osa, /with administrator privileges/);
    assert.match(osa, /CriticalUpdateInstall -bool true/);
    const reg = readFileSync(join(e.home, '.claude/mi-perfil/seguridad/cambios.md'), 'utf8');
    assert.match(reg, /Estado anterior: .*CriticalUpdateInstall=0/);
    assert.match(reg, /Cómo deshacer: `bash "\$\(ls -dt ~\/\.claude\/plugins\/cache\/\*\/seguridad\/\*\/scripts 2>\/dev\/null \| head -1\)\/admin\.sh" actualizaciones deshacer`/);
    assert.match(reg, /o pídele a Claude: deshaz actualizaciones/);
    assert.ok(!reg.includes(S), 'la nota lleva la ruta con la versión');
    writeFileSync(e.logOsa, '');
    e.correr('admin.sh', ['actualizaciones', 'deshacer']);
    const osa2 = readFileSync(e.logOsa, 'utf8');
    assert.match(osa2, /CriticalUpdateInstall -bool false/);
    assert.match(osa2, /AutomaticDownload -bool true/);
    assert.match(osa2, /softwareupdate --schedule on/);

    const f = e.correr('admin.sh', ['firewall', 'hacer'], { ADMIN_PRUEBA: 'osa' });
    assert.match(readFileSync(e.logOsa, 'utf8'), /--setglobalstate on/);
    e.correr('admin.sh', ['firewall', 'deshacer'], { ADMIN_PRUEBA: 'osa' });
    assert.match(readFileSync(e.logOsa, 'utf8'), /--setglobalstate off/);

    e.correr('admin.sh', ['invitado', 'hacer']); e.correr('admin.sh', ['invitado', 'deshacer']);
    e.correr('admin.sh', ['ssh-remoto', 'hacer']);
    assert.match(readFileSync(e.logOsa, 'utf8'), /setremotelogin off/);
    assert.ok(f.out.length > 0);
  } finally { e.limpiar(); }
});

testMac('admin.sh ssh-remoto: deshacer devuelve el estado de antes (no prende lo que estaba apagado)', () => {
  const e = entorno();
  try {
    // nc simulado sale con 1: la sesión remota estaba apagada
    e.correr('admin.sh', ['ssh-remoto', 'hacer']);
    writeFileSync(e.logOsa, '');
    const d = e.correr('admin.sh', ['ssh-remoto', 'deshacer']);
    assert.equal(d.rc, 0, d.todo);
    assert.doesNotMatch(readFileSync(e.logOsa, 'utf8'), /setremotelogin on/);
    assert.match(d.out, /apagada/);
    assert.match(e.correr('admin.sh', ['ssh-remoto', 'deshacer']).out, /nada que deshacer/);
    // ahora estaba prendida (1a consulta) y después del cambio ya no responde (2a): deshacer la vuelve a prender
    writeFileSync(join(e.bin, 'nc'), '#!/bin/sh\nn=$(cat "$FAKE_LOG.n" 2>/dev/null || echo 0); echo $((n+1)) >"$FAKE_LOG.n"; [ "$n" = 0 ]\n');
    const h2 = e.correr('admin.sh', ['ssh-remoto', 'hacer']);
    assert.match(h2.out, /Comprobado: el puerto 22 ya no responde/);
    e.correr('admin.sh', ['ssh-remoto', 'deshacer']);
    assert.match(readFileSync(e.logOsa, 'utf8'), /setremotelogin on/);
  } finally { e.limpiar(); }
});

testMac('admin.sh: si se cancela la ventana no se registra nada', () => {
  const e = entorno();
  try {
    const r = e.correr('admin.sh', ['firewall', 'hacer'], { FAKE_OSA_RC: '1', ADMIN_PRUEBA: 'osa' });
    assert.match(r.out, /No se hizo el cambio/);
    assert.ok(!existsSync(join(e.home, '.claude/mi-perfil/seguridad/cambios.md')));
    assert.match(e.correr('admin.sh', ['firewall', 'deshacer'], { FAKE_OSA_RC: '1', ADMIN_PRUEBA: 'osa' }).out, /nada que deshacer/);
  } finally { e.limpiar(); }
});

// ---------- "Listo" solo si el cambio quedó de verdad ----------
const CAMBIOS_DE = (e) => join(e.home, '.claude/mi-perfil/seguridad/cambios.md');
const sinEntrada = (e) => !existsSync(CAMBIOS_DE(e)) || !/^## .* - (?!Deshecho)/m.test(readFileSync(CAMBIOS_DE(e), 'utf8'));

testMac('admin.sh: osascript que devuelve 0 sin hacer nada no es "Listo" ni queda en cambios.md', () => {
  const casos = [
    ['firewall', {}],
    ['actualizaciones', {}],
    ['invitado', { previo: ['GuestEnabled', '1'] }],
  ];
  for (const [id, { previo } = {}] of casos) {
    const e = entorno();
    try {
      if (previo) { mkdirSync(e.log + '.def', { recursive: true }); writeFileSync(join(e.log + '.def', previo[0]), previo[1] + '\n'); }
      const r = e.correr('admin.sh', [id, 'hacer'], { ADMIN_PRUEBA: 'osa', FAKE_OSA_NOOP: '1' });
      assert.match(r.todo, /No quedó aplicado/, `${id}: ${r.todo}`);
      assert.match(r.todo, /No cambié nada/, id);
      assert.doesNotMatch(r.todo, /^Listo/m, id);
      assert.notEqual(r.rc, 0, id);
      assert.ok(sinEntrada(e), `${id}: quedó en cambios.md`);
      assert.match(e.correr('admin.sh', [id, 'deshacer'], { ADMIN_PRUEBA: 'osa' }).out, /nada que deshacer/, id);
    } finally { e.limpiar(); }
  }
});

testMac('admin.sh: camino feliz (osascript que sí aplica) dice Listo, registra y sale 0', () => {
  for (const id of ['firewall', 'actualizaciones', 'invitado']) {
    const e = entorno();
    try {
      if (id === 'invitado') { mkdirSync(e.log + '.def', { recursive: true }); writeFileSync(join(e.log + '.def', 'GuestEnabled'), '1\n'); }
      const r = e.correr('admin.sh', [id, 'hacer'], { ADMIN_PRUEBA: 'osa' });
      assert.equal(r.rc, 0, r.todo);
      assert.match(r.out, /^Listo/m, id);
      assert.ok(!sinEntrada(e), `${id}: no quedó en cambios.md`);
    } finally { e.limpiar(); }
  }
});

testMac('admin.sh ssh-remoto: puerto 22 abierto después = no quedó aplicado, sin entrada y rc distinto de 0', () => {
  const e = entorno();
  try {
    writeFileSync(join(e.bin, 'nc'), '#!/bin/sh\nexit 0\n');
    const r = e.correr('admin.sh', ['ssh-remoto', 'hacer']);
    assert.match(r.todo, /No quedó aplicado/);
    assert.notEqual(r.rc, 0);
    assert.ok(sinEntrada(e));
  } finally { e.limpiar(); }
});

testMac('arreglar.sh claude-deny y sandbox: settings.json que no se deja escribir no es "Listo" ni se registra', () => {
  for (const id of ['claude-deny', 'sandbox']) {
    const e = entorno();
    const dir = join(e.home, '.claude'); const s = join(dir, 'settings.json');
    try {
      const original = '{"permissions":{"deny":["Read(otra)"]},"sandbox":{"enabled":false}}\n';
      escribir(s, original); chmodSync(s, 0o444); chmodSync(dir, 0o555);
      const r = e.correr('arreglar.sh', [id, 'hacer']);
      assert.match(r.todo, /No quedó aplicado/, `${id}: ${r.todo}`);
      assert.doesNotMatch(r.todo, /^Listo/m, id);
      assert.notEqual(r.rc, 0, id);
      assert.ok(sinEntrada(e), `${id}: quedó en cambios.md`);
      assert.equal(readFileSync(s, 'utf8'), original, `${id}: tocó el archivo`);
      assert.match(e.correr('arreglar.sh', [id, 'deshacer']).out, /nada que deshacer/, id);
    } finally { chmodSync(dir, 0o755); chmodSync(s, 0o644); e.limpiar(); }
  }
});

testMac('arreglar.sh quitar-plugin y quitar-mcp: si sigue instalado no se dice Listo ni se registra', () => {
  for (const [id, nombre] of [['quitar-plugin', 'uno@mercado'], ['quitar-mcp', 'miconector']]) {
    const e = entorno();
    try {
      const r = e.correr('arreglar.sh', [id, 'hacer', nombre], { FAKE_NOOP_QUITAR: '1' });
      assert.match(r.todo, /No quedó aplicado/, `${id}: ${r.todo}`);
      assert.doesNotMatch(r.todo, /^Listo/m, id);
      assert.notEqual(r.rc, 0, id);
      assert.ok(sinEntrada(e), id);
    } finally { e.limpiar(); }
  }
});

// ---------- (6) el plugin no tiene cosas que el exportador rechaza ----------
test('el plugin seguridad no tiene ghp_, api key, rutas privadas ni emojis', () => {
  const base = join(raiz, 'plugins/seguridad');
  const archivos = readdirSync(base, { recursive: true }).map((f) => join(base, f)).filter((f) => statSync(f).isFile());
  assert.ok(archivos.length >= 4);
  // solo en el repo privado: sin la lista de privacidad solo se revisa lo demás
  const reglas = (existsSync(join(raiz, 'scripts/privacidad.txt')) ? readFileSync(join(raiz, 'scripts/privacidad.txt'), 'utf8') : '').split('\n').filter((l) => l && !l.startsWith('#'))
    .map((l) => new RegExp(l.slice(2), l[0] === 'i' ? 'i' : ''));
  for (const f of archivos) {
    const t = readFileSync(f, 'utf8');
    assert.doesNotMatch(t, /ghp_/, f);
    assert.doesNotMatch(t, /api[_-]?key/i, f);
    assert.doesNotMatch(t, /\p{Extended_Pictographic}/u, `emoji en ${f}`);
    for (const re of reglas) assert.doesNotMatch(t, re, `${f}: ${re}`);
  }
  const pj = JSON.parse(readFileSync(join(base, '.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(pj.name, 'seguridad'); assert.equal(pj.version, readFileSync(join(raiz, 'CHANGELOG.md'), 'utf8').match(/^## (\d+\.\d+\.\d+)/m)[1]);
});

// ---------- (5) agente guardia, skill, reglas, pantallas y guía T15 (T9) ----------
const P = join(raiz, 'plugins/seguridad');
const frente = (t) => (t.match(/^---\n([\s\S]*?)\n---/) ?? [, ''])[1];
const leerP = (r) => readFileSync(join(P, r), 'utf8');

test('el agente guardia tiene name, description, model y tools sin Write ni Edit', () => {
  const t = leerP('agents/guardia.md');
  const f = frente(t);
  assert.match(f, /^name: guardia$/m);
  assert.match(f, /^description: .{40,}/m);
  assert.match(f, /^model: (haiku|sonnet|opus)$/m);
  const tools = f.match(/^tools: (.+)$/m)?.[1];
  assert.ok(tools, 'sin tools');
  const lista = tools.split(',').map((s) => s.trim());
  assert.deepEqual([...lista].sort(), ['Bash', 'Glob', 'Grep', 'Read']);
  for (const malo of ['Write', 'Edit', 'NotebookEdit', 'MultiEdit']) assert.ok(!lista.includes(malo), malo);
  for (const s of ['revisar.sh', 'arreglar.sh', 'admin.sh', 'estado.md', '4 caracteres']) assert.ok(t.includes(s), `el agente no nombra ${s}`);
  assert.match(t, /nunca/i);
});

test('la skill revisar-mi-seguridad nombra los 3 scripts, el orden y lo que nunca hace', () => {
  const t = leerP('skills/revisar-mi-seguridad/SKILL.md');
  const f = frente(t);
  assert.match(f, /^name: revisar-mi-seguridad$/m);
  assert.match(f, /^description: .{40,}/m);
  for (const s of ['revisar.sh', 'arreglar.sh', 'admin.sh', '--solo', 'nunca', 'estado.md', 'cambios.md',
    'checklist-cuentas.md', 'reglas-ia.md', 'pantallas.md', 'rotar']) assert.ok(t.includes(s), `la skill no nombra ${s}`);
  // el orden: permiso -> revisar -> reporte -> arreglos -> cuentas -> reglas de IA
  const pos = ['Permiso', 'Revisar', 'Reporte', 'Arreglos', 'Cuentas', 'Reglas de IA']
    .map((h) => t.search(new RegExp(`^## Paso \\d+\\. ${h}`, 'm')));
  assert.ok(pos.every((p) => p >= 0), `faltan pasos: ${pos}`);
  assert.deepEqual([...pos].sort((a, b) => a - b), pos, 'los pasos no van en orden');
  // cada id que la skill manda a arreglar.sh o admin.sh existe en el script
  const arreglar = readFileSync(join(S, 'arreglar.sh'), 'utf8');
  const admin = readFileSync(join(S, 'admin.sh'), 'utf8');
  for (const [, id] of t.matchAll(/arreglar\.sh"? ([a-z-]+) hacer/g)) assert.match(arreglar, new RegExp(`^  ${id}\\)`, 'm'), id);
  for (const [, id] of t.matchAll(/admin\.sh"? ([a-z-]+) hacer/g)) assert.match(admin, new RegExp(`\\b${id}\\b`), id);
  for (const id of ['env-gitignore', 'env-permisos', 'ssh-permisos', 'claude-deny', 'sandbox', 'gitleaks', 'quitar-plugin', 'quitar-mcp', 'reglas-ia'])
    assert.ok(t.includes(id), `la skill no ofrece ${id}`);
  for (const id of ['actualizaciones', 'firewall', 'ssh-remoto', 'invitado']) assert.match(t, new RegExp(`admin\\.sh"? ${id}`), id);
});

test('reglas-ia.md tiene exactamente 8 reglas cortas', () => {
  const t = leerP('reglas-ia.md');
  const reglas = t.split('\n').filter((l) => /^\d+\. /.test(l));
  assert.equal(reglas.length, 8, reglas.join('\n'));
  reglas.forEach((l, i) => assert.ok(l.startsWith(`${i + 1}. `), l));
  for (const l of reglas) assert.ok(l.length <= 260, `regla larga: ${l}`);
  assert.match(t, /dangerously-skip-permissions/);
  assert.match(t, /\/feedback/);
});

test('checklist-cuentas.md: 2FA, gestor, WhatsApp y códigos de respaldo, con links https', () => {
  const t = leerP('checklist-cuentas.md');
  for (const s of ['correo', 'Apple', 'GitHub', 'banco', 'gestor de contraseñas', 'WhatsApp', 'códigos de respaldo', 'nunca se envía'])
    assert.ok(t.toLowerCase().includes(s.toLowerCase()), `falta ${s}`);
  assert.ok((t.match(/- \[ \]/g) ?? []).length >= 6, 'pocas casillas para marcar');
  for (const dom of ['myaccount.google.com', 'account.apple.com', 'github.com/settings/security']) assert.ok(t.includes(`https://${dom}`), dom);
  assert.doesNotMatch(t, /brew install|npm |pip install/, 'la lista no instala nada');
});

test('perfil-campos.md dice qué se guarda y que nunca hay secretos', () => {
  const t = leerP('perfil-campos.md');
  for (const s of ['~/.claude/mi-perfil/seguridad/', 'cambios.md', 'estado.md', 'No quiero esto', 'secretos']) assert.ok(t.includes(s), s);
});

test('pantallas.md: lo marcado sí está en la skill y lo no verificado tiene plan B en la skill', () => {
  const skill = leerP('skills/revisar-mi-seguridad/SKILL.md');
  const filas = leerP('pantallas.md').split('\n').filter((l) => /^\| [a-z-]+ \| `/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  assert.ok(filas.length >= 8, `pocas filas: ${filas.length}`);
  const ids = new Set();
  for (const [id, url, ver, planB] of filas) {
    assert.ok(!ids.has(id), `id repetido ${id}`); ids.add(id);
    assert.match(ver, /^(sí|parcial|no)$/, `${id}: verificada debe ser sí, parcial o no`);
    const u = url.replace(/`/g, '');
    if (ver !== 'no') {
      assert.match(u, /^x-apple\.systempreferences:com\.apple\./, id);
      assert.ok(skill.includes(u), `${id}: la URL marcada ${ver} no está en la skill`);
    }
    if (ver !== 'sí') assert.ok(skill.includes(planB), `${id}: la skill no tiene el plan B "${planB}"`);
    assert.match(planB, /^Ajustes del Sistema > /, id);
  }
  for (const id of ['filevault', 'firewall', 'actualizaciones', 'copias', 'bloqueo', 'compartir', 'invitado', 'privacidad'])
    assert.ok(ids.has(id), `falta la pantalla ${id}`);
  const verificadas = new Set(filas.filter((f) => f[2] !== 'no').map((f) => f[1].replace(/`/g, '')));
  for (const [u] of skill.matchAll(/x-apple\.systempreferences:[^\s"`)]+/g))
    assert.ok(verificadas.has(u), `la skill usa una URL de Ajustes que no está verificada en pantallas.md: ${u}`);
});

test('la guía T15 vive fuera del plugin y cubre cada arreglo con su deshacer', () => {
  assert.ok(!existsSync(join(P, 'tests')), 'plugins/seguridad/tests no debe existir (sale al público)');
  const g = readFileSync(join(raiz, 'tests/manual/T15-usuario-prueba.md'), 'utf8');
  for (const id of ['env-gitignore', 'env-permisos', 'ssh-permisos', 'claude-deny', 'sandbox', 'gitleaks', 'quitar-plugin', 'quitar-mcp', 'reglas-ia']) {
    assert.match(g, new RegExp(`arreglar\\.sh" ${id} hacer`), `${id} hacer`);
    assert.match(g, new RegExp(`arreglar\\.sh" ${id} deshacer`), `${id} deshacer`);
  }
  for (const id of ['actualizaciones', 'firewall', 'ssh-remoto', 'invitado']) {
    assert.match(g, new RegExp(`admin\\.sh" ${id} hacer`), `${id} hacer`);
    assert.match(g, new RegExp(`admin\\.sh" ${id} deshacer`), `${id} deshacer`);
  }
  assert.match(g, /--plugin-dir/);
  assert.match(g, /revisar-mi-seguridad/);
  assert.match(g, /\| OK \| Falla \|/);
});

// ---------- Fixes de la revisión final: admin.sh ----------
const RESP_DE = (e) => join(e.home, '.claude/mi-perfil/seguridad/respaldos');
const sinVentana = (e, r, nombre) => {
  assert.notEqual(r.rc, 0, `${nombre}: debía negarse\n${r.todo}`);
  assert.equal(readFileSync(e.logOsa, 'utf8'), '', `${nombre}: se abrió la ventana (osascript)`);
  assert.doesNotMatch(r.out, /osascript/, `${nombre}: imprimió un osascript`);
  assert.match(r.todo, /No sigo:/, nombre);
};

testMac('admin.sh (1): un respaldo alterado (;, comillas, $(...)) se niega y no abre la ventana', () => {
  const casos = [
    ['actualizaciones', 'valores', 'AutomaticDownload=1;touch /tmp/pwn\nCriticalUpdateInstall=0\n'],
    ['actualizaciones', 'valores', 'AutomaticDownload=0"; touch /tmp/pwn; "\n'],
    ['actualizaciones', 'valores', 'AutomaticDownload=$(touch /tmp/pwn)\n'],
    ['actualizaciones', 'valores', 'Evil;touch /tmp/pwn=1\n'],
    ['actualizaciones', 'valores', 'NoEsClave=1\n'],
    ['actualizaciones', 'schedule', 'on; touch /tmp/pwn\n'],
    ['actualizaciones', 'schedule', '`touch /tmp/pwn`\n'],
    ['firewall', 'anterior', 'on; touch /tmp/pwn\n'],
    ['firewall', 'anterior', '$(touch /tmp/pwn)\n'],
    ['firewall', 'anterior', 'on" ; touch /tmp/pwn ; "\n'],
  ];
  for (const [id, archivo, malo] of casos) {
    const e = entorno();
    try {
      const h = e.correr('admin.sh', [id, 'hacer'], { ADMIN_PRUEBA: 'osa' });
      assert.equal(h.rc, 0, h.todo);
      writeFileSync(e.logOsa, '');
      writeFileSync(join(RESP_DE(e), id, archivo), malo);
      const d = e.correr('admin.sh', [id, 'deshacer'], { ADMIN_PRUEBA: 'osa' });
      sinVentana(e, d, `${id}/${archivo}: ${JSON.stringify(malo)}`);
      assert.ok(!existsSync('/tmp/pwn'), 'se ejecutó la inyección');
      assert.ok(existsSync(join(RESP_DE(e), id, 'activo')), 'no debe cerrar el respaldo si se negó');
    } finally { e.limpiar(); }
  }
});

testMac('admin.sh (1): SOCKETFILTERFW sin ADMIN_PRUEBA se niega y no imprime ningún osascript', () => {
  const e = entorno();
  try {
    for (const accion of ['hacer', 'deshacer']) {
      for (const id of ['firewall', 'actualizaciones']) {
        const r = e.correr('admin.sh', [id, accion], { SOCKETFILTERFW: '/bin/echo"; touch /tmp/pwn; "' });
        sinVentana(e, r, `${id} ${accion}`);
      }
    }
    // con una ruta falsa pero sin ADMIN_PRUEBA tampoco
    const r2 = e.correr('admin.sh', ['firewall', 'hacer'], { SOCKETFILTERFW: join(e.raizT, 'sfw') });
    sinVentana(e, r2, 'ruta falsa sin prueba');
    // aun en modo de prueba, una ruta con comillas o ; se niega
    const r3 = e.correr('admin.sh', ['firewall', 'hacer'], { ADMIN_PRUEBA: '1', SOCKETFILTERFW: '/x";touch /tmp/pwn;"' });
    sinVentana(e, r3, 'ruta con comillas en modo de prueba');
    assert.ok(!existsSync('/tmp/pwn'));
    // la ruta fija sigue funcionando en prueba
    const ok = e.correr('admin.sh', ['firewall', 'hacer'], { ADMIN_PRUEBA: '1', SOCKETFILTERFW: '' });
    assert.equal(ok.rc, 0, ok.todo);
    assert.match(ok.out, /\/usr\/libexec\/ApplicationFirewall\/socketfilterfw --setglobalstate on/);
  } finally { e.limpiar(); }
});

testMac('admin.sh (10): el estado 2 del firewall (bloquear todo) se guarda y se devuelve', () => {
  const e = entorno();
  try {
    const sfw = join(e.raizT, 'sfw2');
    writeFileSync(sfw, '#!/bin/sh\ncase "$1" in --getglobalstate) echo "Firewall is enabled. (State = 2)";; esac\n'); chmodSync(sfw, 0o755);
    const h = e.correr('admin.sh', ['firewall', 'hacer'], { ADMIN_PRUEBA: 'osa', SOCKETFILTERFW: sfw });
    assert.equal(h.rc, 0, h.todo);
    assert.equal(readFileSync(join(RESP_DE(e), 'firewall/anterior'), 'utf8').trim(), 'block');
    writeFileSync(e.logOsa, '');
    const d = e.correr('admin.sh', ['firewall', 'deshacer'], { ADMIN_PRUEBA: 'osa', SOCKETFILTERFW: sfw });
    assert.equal(d.rc, 0, d.todo);
    const osa = readFileSync(e.logOsa, 'utf8');
    assert.match(osa, /--setglobalstate on/); assert.match(osa, /--setblockall on/);
  } finally { e.limpiar(); }
});

testMac('admin.sh (9): ssh-remoto no dice Listo a ciegas: si el puerto 22 sigue abierto, avisa', () => {
  const e = entorno();
  try {
    writeFileSync(join(e.bin, 'nc'), '#!/bin/sh\nexit 0\n'); // siempre responde
    const r = e.correr('admin.sh', ['ssh-remoto', 'hacer']);
    assert.match(r.out, /sigue abierto/);
    assert.doesNotMatch(r.out, /^Listo\./m);
  } finally { e.limpiar(); }
});

// ---------- (2) la nota de cómo deshacer no depende de la versión ----------
testMac('como deshacer (2): el comando anotado funciona aunque cambie la carpeta de la versión', () => {
  const e = entorno();
  try {
    for (const v of ['1.0.0', '2.0.0']) {
      const dest = join(e.home, '.claude/plugins/cache/mercado/seguridad', v);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(join(raiz, 'plugins/seguridad'), dest, { recursive: true });
      if (v === '1.0.0') utimesSync(dest, new Date(2020, 1, 1), new Date(2020, 1, 1));
    }
    const h = e.correr('arreglar.sh', ['sandbox', 'hacer']);
    assert.equal(h.rc, 0, h.todo);
    const reg = readFileSync(join(e.home, '.claude/mi-perfil/seguridad/cambios.md'), 'utf8');
    const cmd = reg.match(/Cómo deshacer: `([^`]+)`/)[1];
    assert.ok(!cmd.includes('1.0.0') && !cmd.includes('2.0.0') && !cmd.includes(S), cmd);
    assert.match(reg, /o pídele a Claude: deshaz sandbox/);
    const r = spawnSync(BASH, ['-c', cmd], { env: e.env, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /Deshecho/);
  } finally { e.limpiar(); }
});

// ---------- env-gitignore deshacer sin expandir comodines (5) ----------
testMac('arreglar.sh env-gitignore (5): deshacer desde una carpeta con archivos .env no expande .env*', () => {
  const e = entorno();
  try {
    const p = join(e.home, 'Desktop', 'uno'); mkdirSync(p, { recursive: true }); e.git(p, 'init', '-q');
    escribir(join(p, '.env'), 'A=1\n'); escribir(join(p, '.gitignore'), 'dist\n');
    haceYRegistra(e, 'env-gitignore');
    writeFileSync(join(p, '.gitignore'), readFileSync(join(p, '.gitignore'), 'utf8') + 'build\n');
    const aqui = join(e.raizT, 'aqui'); mkdirSync(aqui);
    for (const n of ['.env', '.env.local', '.env.example']) escribir(join(aqui, n), 'Z=1\n');
    const d = e.correr('arreglar.sh', ['env-gitignore', 'deshacer'], { __cwd: aqui });
    assert.equal(d.rc, 0, d.todo);
    assert.equal(readFileSync(join(p, '.gitignore'), 'utf8'), 'dist\nbuild\n');
  } finally { e.limpiar(); }
});

// ---------- sin herramientas de desarrollador no se llama a git (12) ----------
testMac('sin herramientas de desarrollador no se llama a git (12)', () => {
  const e = entorno({ sin: ['xcode-select'] });
  try {
    prepararHome(e);
    rmSync(join(e.bin, 'git'));
    writeFileSync(join(e.bin, 'git'), '#!/bin/sh\necho "GIT $*" >>"$FAKE_LOG"\nexit 0\n'); chmodSync(join(e.bin, 'git'), 0o755);
    const r = e.correr('revisar.sh', ['--solo', 'env-en-git']);
    assert.match(r.out, /CHEQUEO id=env-en-git estado=no-se detalle=.*herramientas de desarrollador/);
    const h = e.correr('arreglar.sh', ['env-gitignore', 'hacer']);
    assert.match(h.out, /herramientas de desarrollador/);
    const repo = join(e.home, 'Desktop', 'proy');
    const g = e.correr('arreglar.sh', ['gitleaks', 'hacer', repo]);
    assert.match(g.out, /herramientas de desarrollador/);
    assert.doesNotMatch(readFileSync(e.log, 'utf8'), /GIT /, 'se llamó a git sin herramientas de desarrollador');
    assert.ok(!existsSync(join(repo, '.gitignore')));
  } finally { e.limpiar(); }
});

// ---------- gitleaks usa la ruta de hooks que dice git (13) ----------
testMac('arreglar.sh gitleaks (13): respeta core.hooksPath y el deshacer lo quita de ahí', () => {
  const e = entorno();
  try {
    const repo = join(e.home, 'Desktop', 'r'); mkdirSync(repo, { recursive: true }); e.git(repo, 'init', '-q');
    e.git(repo, 'config', 'core.hooksPath', '.githooks');
    haceYRegistra(e, 'gitleaks', repo);
    const h = join(repo, '.githooks', 'pre-commit');
    assert.match(readFileSync(h, 'utf8'), /seguridad-hook/);
    assert.ok(!existsSync(join(repo, '.git', 'hooks', 'pre-commit')));
    e.correr('arreglar.sh', ['gitleaks', 'deshacer']);
    assert.ok(!existsSync(h));
  } finally { e.limpiar(); }
});

// ---------- textos verdaderos (14, 18) ----------
testMac('arreglar.sh claude-deny (14): el mensaje no promete más de lo que hace', () => {
  const e = entorno();
  try {
    const { r } = haceYRegistra(e, 'claude-deny');
    assert.doesNotMatch(r.out, /Claude ya no puede abrir \.env/);
    assert.match(r.out, /herramienta de lectura/);
    assert.match(r.out, /sandbox/);
  } finally { e.limpiar(); }
});

testMac('arreglar.sh quitar-mcp (18): avisa dónde quedan las copias y cómo borrarlas', () => {
  const e = entorno();
  try {
    const { r } = haceYRegistra(e, 'quitar-mcp', 'miconector');
    assert.match(r.out, /respaldos/);
    assert.match(r.out, /claves/);
    assert.match(r.out, /rm -r/);
  } finally { e.limpiar(); }
});

// ---------- cierre: bloqueante 1, importantes 2, menores 7 y 9 ----------
testMac('admin.sh (cierre 1): SOCKETFILTERFW con ADMIN_PRUEBA que no es 1/osa se niega y no llama a osascript', () => {
  const e = entorno();
  try {
    for (const prueba of ['2', 'si', 'true', 'yes']) {
      const r = e.correr('admin.sh', ['firewall', 'hacer'], { ADMIN_PRUEBA: prueba, SOCKETFILTERFW: join(e.raizT, 'sfw') });
      sinVentana(e, r, `ADMIN_PRUEBA=${prueba}`);
    }
  } finally { e.limpiar(); }
});

testMac('arreglar.sh env-gitignore (cierre 2): un .env ya subido a git no tumba el arreglo de otro repo y avisa que está en el historial', () => {
  const e = entorno();
  try {
    const p1 = join(e.home, 'Desktop', 'subido'); const p2 = join(e.home, 'Desktop', 'suelto');
    for (const p of [p1, p2]) { mkdirSync(p, { recursive: true }); e.git(p, 'init', '-q'); escribir(join(p, '.env'), 'A=1\n'); }
    e.git(p1, 'add', '.env');
    const h = e.correr('arreglar.sh', ['env-gitignore', 'hacer']);
    assert.equal(h.rc, 0, h.todo);
    assert.equal(readFileSync(join(p2, '.gitignore'), 'utf8'), '.env*\n!.env.example\n', 'el repo sin proteger debe quedar arreglado');
    assert.ok(existsSync(join(p1, '.gitignore')), 'el repo con .env subido también recibe su .gitignore');
    assert.match(h.out, /YA están en git/);
    assert.match(h.out, /historial de git/);
    assert.match(h.out, /rota esas claves/);
    assert.match(h.out, /subido\/\.env/);
  } finally { e.limpiar(); }
});

testMac('arreglar.sh env-gitignore (cierre 2): si un repo no queda ignorado, los demás repos no se deshacen', () => {
  const e = entorno();
  try {
    const p1 = join(e.home, 'Desktop', 'bueno'); const p2 = join(e.home, 'Desktop', 'malo');
    for (const p of [p1, p2]) { mkdirSync(p, { recursive: true }); e.git(p, 'init', '-q'); escribir(join(p, '.env'), 'A=1\n'); }
    // en "malo", .gitignore es una carpeta: no se puede escribir ahí y git no ignorará el .env
    mkdirSync(join(p2, '.gitignore'));
    const h = e.correr('arreglar.sh', ['env-gitignore', 'hacer']);
    assert.equal(readFileSync(join(p1, '.gitignore'), 'utf8'), '.env*\n!.env.example\n', h.todo);
    assert.match(h.todo, /malo/);
  } finally { e.limpiar(); }
});

testMac('revisar.sh admins (cierre 7): si dscl da error, es no-se y no cuenta el mensaje como cuentas', () => {
  const e = entorno();
  try {
    prepararHome(e);
    writeFileSync(join(e.bin, 'dscl'), '#!/bin/sh\necho "<dscl_cmd> DS Error: -14009 (eDSUnknownNodeName)"\nexit 1\n'); chmodSync(join(e.bin, 'dscl'), 0o755);
    const r = e.correr('revisar.sh', ['--solo', 'admins']);
    assert.match(r.out, /CHEQUEO id=admins estado=no-se detalle=no pude leer/);
    assert.doesNotMatch(r.out, /cuentas son administrador/);
  } finally { e.limpiar(); }
});

testMac('arreglar.sh gitleaks (cierre 9): si no puso ningún aviso antes de cada commit, no dice Listo ni registra', () => {
  const e = entorno();
  try {
    const repo = join(e.home, 'Desktop', 'r'); mkdirSync(repo, { recursive: true });
    e.git(repo, 'init', '-q');
    mkdirSync(join(repo, '.git', 'hooks'), { recursive: true });
    writeFileSync(join(repo, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\necho mio\n'); chmodSync(join(repo, '.git', 'hooks', 'pre-commit'), 0o755);
    const g = e.correr('arreglar.sh', ['gitleaks', 'hacer', repo]);
    assert.doesNotMatch(g.out, /^Listo/m, g.todo);
    assert.match(g.out, /no puse el aviso|no quedó|ningún proyecto/i);
    assert.ok(!existsSync(join(e.home, '.claude/mi-perfil/seguridad/cambios.md')) || !/gitleaks listo/.test(readFileSync(join(e.home, '.claude/mi-perfil/seguridad/cambios.md'), 'utf8')));
  } finally { e.limpiar(); }
});

testMac('admin.sh (cierre 2): lo que corre como administrador usa siempre la ruta fija del firewall, aunque SOCKETFILTERFW apunte a otro programa', () => {
  const e = entorno();
  try {
    for (const acc of ['hacer', 'deshacer']) {
      e.correr('admin.sh', ['firewall', acc], { ADMIN_PRUEBA: 'osa', SOCKETFILTERFW: join(e.raizT, 'sfw') });
    }
    const log = readFileSync(e.logOsa, 'utf8');
    assert.ok(log.length > 0, 'no se llamó a osascript (falso) en ningún caso');
    for (const l of log.split('\n').filter(Boolean)) {
      assert.match(l, /\/usr\/libexec\/ApplicationFirewall\/socketfilterfw --set/, l);
      assert.doesNotMatch(l, new RegExp(e.raizT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `el comando de administrador trae la ruta de la variable: ${l}`);
    }
  } finally { e.limpiar?.(); }
});

testMac('admin.sh (cierre 3): un respaldo alterado de la cuenta de invitado se niega y no abre la ventana', () => {
  const e = entorno();
  try {
    const resp = join(e.home, '.claude/mi-perfil/seguridad/respaldos/invitado');
    mkdirSync(resp, { recursive: true });
    writeFileSync(join(resp, 'activo'), '');
    writeFileSync(join(resp, 'anterior'), 'raro; touch /tmp/x\n');
    const r = e.correr('admin.sh', ['invitado', 'deshacer'], { ADMIN_PRUEBA: 'osa' });
    assert.equal(r.rc, 3, r.todo);
    assert.equal(readFileSync(e.logOsa, 'utf8'), '', 'se abrió la ventana (osascript)');
  } finally { e.limpiar(); }
});

testMac('admin.sh (cierre 4): si la persona cancela la ventana, no se ve el error crudo de osascript, solo el mensaje en español', () => {
  const e = entorno();
  try {
    const r = e.correr('admin.sh', ['firewall', 'hacer'], { ADMIN_PRUEBA: 'osa', FAKE_OSA_RC: '1', FAKE_OSA_ERR: '0:459: execution error: User canceled. (-128)' });
    assert.doesNotMatch(r.todo, /execution error|User canceled|-128/, r.todo);
    assert.match(r.todo, /No se hizo el cambio|cancelaste/i, r.todo);
  } finally { e.limpiar(); }
});
