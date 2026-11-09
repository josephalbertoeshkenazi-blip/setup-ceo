// seguridad en Windows: revisión de solo lectura (PowerShell falso), arreglos seguros y el "todavía no" de admin.sh.
// Windows se finge con un uname falso; las herramientas de Mac son trampas que dejan una marca si alguien las llama.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync, copyFileSync, statSync, readdirSync, utimesSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, sep as sep2 } from 'node:path';

import { raiz, esWindows, entornoCasa, fingirWindows } from './ayuda.mjs';

const S = join(raiz, 'plugins/seguridad/scripts');
const sep = esWindows ? ';' : ':';

const IDS = ['secretos-disco', 'secretos-historial', 'env-archivos', 'env-en-git', 'filevault', 'actualizaciones',
  'copias', 'bloqueo', 'firewall', 'admins', 'env-permisos', 'ssh-permisos', 'claude-deny', 'claude-extras',
  'invitado', 'mdm', 'sistema', 'transcripciones'];
const MAC = ['fdesetup', 'softwareupdate', 'tmutil', 'sysadminctl', 'dscl', 'defaults', 'profiles', 'csrutil', 'spctl',
  'sw_vers', 'plutil', 'osascript', 'xcode-select'];

const tmp = (p) => mkdtempSync(join(tmpdir(), p));
const ejecutable = (ruta, texto) => { mkdirSync(dirname(ruta), { recursive: true }); writeFileSync(ruta, texto); chmodSync(ruta, 0o755); };

// PowerShell falso: busca una palabra en el -Command y contesta con PS_<CLAVE>; PS_<CLAVE>_RC fuerza un error.
const PS_FALSO = `#!/bin/sh
echo "$*" >>"$PS_LOG"
cmd="$4"
case "$cmd" in
  *BitLocker*) k=BITLOCKER;;
  *Get-NetFirewallProfile*) k=FIREWALL;;
  *NoAutoUpdate*) k=WUPOL;;
  *Get-LocalGroupMember*) k=ADMINS;;
  *Get-LocalUser*) k=GUEST;;
  *OSVersion*) k=OSVER;;
  *Get-MpComputerStatus*) k=MP;;
  *AntiVirusProduct*) k=AV;;
  *) k=OTRO;;
esac
eval "rc=\\\${PS_\${k}_RC:-0}"
eval "val=\\\${PS_\${k}-}"
[ "$rc" = 0 ] || exit "$rc"
[ -z "$val" ] || printf '%b\\r\\n' "$val"
exit 0
`;

function ambiente({ ps = {}, extra = {} } = {}) {
  const { home, env } = entornoCasa();
  const raizT = tmp('segwin-');
  const trampas = join(raizT, 'trampas');
  const sentinela = join(raizT, 'sentinela');
  for (const n of MAC) ejecutable(join(trampas, n), `#!/bin/sh\necho "LLAMADO ${n}" >>"${sentinela}"\nexit 1\n`);
  const psBin = join(raizT, 'ps', 'powershell-falso');
  ejecutable(psBin, PS_FALSO);
  const psLog = join(raizT, 'ps.log');
  writeFileSync(psLog, '');
  const e = fingirWindows({
    ...env, PS_LOG: psLog, SEG_POWERSHELL: psBin,
    ...Object.fromEntries(Object.entries(ps).map(([k, v]) => [`PS_${k}`, v])), ...extra,
  });
  e.PATH = `${trampas}${sep}${e.PATH}`;
  const correr = (script, args = [], mas = {}) => {
    const r = spawnSync('bash', [join(S, script), ...args], { encoding: 'utf8', env: { ...e, ...mas }, timeout: 90000 });
    return { out: r.stdout, err: r.stderr, rc: r.status, todo: r.stdout + r.stderr };
  };
  return { home, env: e, raizT, trampas, sentinela, psBin, psLog, correr };
}

const lineas = (out) => out.split('\n').filter((l) => l.startsWith('CHEQUEO '));
function chequeo(a, id, ps = {}, mas = {}) {
  for (const [k, v] of Object.entries(ps)) mas[`PS_${k}`] = v;
  const r = a.correr('revisar.sh', ['--solo', id], mas);
  const l = lineas(r.out);
  assert.equal(r.rc, 0, r.todo);
  assert.equal(l.length, 1, r.todo);
  const m = l[0].match(/^CHEQUEO id=(\S+) estado=(bien|mal|no-se) detalle=(.*)$/);
  assert.ok(m, l[0]);
  assert.equal(m[1], id);
  return { estado: m[2], detalle: m[3] };
}
const sinMarca = (a) => assert.equal(existsSync(a.sentinela) ? readFileSync(a.sentinela, 'utf8') : '', '', 'se llamó una herramienta de Mac');
const escribirJson = (ruta, obj) => { mkdirSync(dirname(ruta), { recursive: true }); writeFileSync(ruta, JSON.stringify(obj, null, 2)); };

test('revisar en Windows da una línea por chequeo y nunca usa herramientas de Mac (HOME con espacio y acento)', () => {
  const a = ambiente();
  assert.match(a.home, /José Pérez/);
  const r = a.correr('revisar.sh');
  assert.equal(r.rc, 0, r.todo);
  const l = lineas(r.out);
  assert.deepEqual(l.map((x) => x.match(/id=(\S+)/)[1]), IDS, r.todo);
  for (const x of l) assert.match(x, /^CHEQUEO id=\S+ estado=(bien|mal|no-se) detalle=.+/);
  sinMarca(a);
});

test('filevault: BitLocker 1 bien, 2 mal, otra cosa no-se; error no-se', () => {
  const a = ambiente();
  let c = chequeo(a, 'filevault', { BITLOCKER: '1' });
  assert.equal(c.estado, 'bien'); assert.match(c.detalle, /el disco está cifrado \(BitLocker\)/);
  c = chequeo(a, 'filevault', { BITLOCKER: '2' });
  assert.equal(c.estado, 'mal');
  assert.equal(chequeo(a, 'filevault', { BITLOCKER: '0' }).estado, 'no-se');
  assert.equal(chequeo(a, 'filevault', { BITLOCKER: '', BITLOCKER_RC: '1' }).estado, 'no-se');
  sinMarca(a);
});

test('firewall: todos True bien; uno False mal con el perfil en español; error no-se', () => {
  const a = ambiente();
  assert.equal(chequeo(a, 'firewall', { FIREWALL: 'Domain=True\\nPrivate=True\\nPublic=True' }).estado, 'bien');
  for (const [en, es] of [['Domain', 'Dominio'], ['Private', 'Privada'], ['Public', 'Pública']]) {
    const lista = ['Domain', 'Private', 'Public'].map((p) => `${p}=${p === en ? 'False' : 'True'}`).join('\\n');
    const c = chequeo(a, 'firewall', { FIREWALL: lista });
    assert.equal(c.estado, 'mal');
    assert.match(c.detalle, new RegExp(es));
  }
  const nc = chequeo(a, 'firewall', { FIREWALL: 'Domain=True\\nPrivate=NotConfigured\\nPublic=True' });
  assert.equal(nc.estado, 'no-se'); assert.match(nc.detalle, /Privada/);
  assert.equal(chequeo(a, 'firewall', { FIREWALL: '', FIREWALL_RC: '1' }).estado, 'no-se');
  sinMarca(a);
});

test('actualizaciones: NoAutoUpdate 1 mal, ausente bien', () => {
  const a = ambiente();
  let c = chequeo(a, 'actualizaciones', { WUPOL: '1' });
  assert.equal(c.estado, 'mal'); assert.match(c.detalle, /las actualizaciones automáticas de Windows están apagadas por una política/);
  c = chequeo(a, 'actualizaciones', {});
  assert.equal(c.estado, 'bien'); assert.match(c.detalle, /Windows Update se encarga solo \(confírmalo en Configuración > Windows Update\)/);
  sinMarca(a);
});

test('admins: uno bien; varios no-se con la lista; error no-se', () => {
  const a = ambiente();
  assert.equal(chequeo(a, 'admins', { ADMINS: 'PC\\\\Ana' }).estado, 'bien');
  const c = chequeo(a, 'admins', { ADMINS: 'PC\\\\Ana\\nPC\\\\Beto' });
  assert.equal(c.estado, 'no-se'); assert.match(c.detalle, /Ana/); assert.match(c.detalle, /Beto/);
  assert.equal(chequeo(a, 'admins', { ADMINS: '', ADMINS_RC: '1' }).estado, 'no-se');
  // El Administrador de fábrica (apagado) no cuenta: el filtro de cuentas prendidas va dentro de la consulta.
  assert.match(readFileSync(a.psLog, 'utf8'), /Get-LocalGroupMember[^\n]*Get-LocalUser -SID[^\n]*\.Enabled/);
  sinMarca(a);
});

test('invitado: Enabled False bien, True mal', () => {
  const a = ambiente();
  assert.equal(chequeo(a, 'invitado', { GUEST: 'False' }).estado, 'bien');
  assert.equal(chequeo(a, 'invitado', { GUEST: 'True' }).estado, 'mal');
  sinMarca(a);
});

test('sistema: Defender activo bien con la versión; apagado y sin otro antivirus mal', () => {
  const a = ambiente();
  let c = chequeo(a, 'sistema', { OSVER: '10.0.26100', MP: 'True Normal' });
  assert.equal(c.estado, 'bien'); assert.match(c.detalle, /Windows 10\.0\.26100 con Microsoft Defender activo/);
  c = chequeo(a, 'sistema', { OSVER: '10.0.26100', MP: 'False Normal', AV: '' });
  assert.equal(c.estado, 'mal');
  sinMarca(a);
});

test('sistema (A4): Defender en modo pasivo, apagado o con error: otro antivirus registrado cuenta como bien; ninguno es mal', () => {
  const a = ambiente();
  for (const mp of [{ MP: 'True Passive' }, { MP: 'False Disabled' }, { MP: '', MP_RC: '1' }]) {
    const c = chequeo(a, 'sistema', { OSVER: '10.0.26100', AV: '266240|Bitdefender Antivirus', ...mp });
    assert.equal(c.estado, 'bien', JSON.stringify(mp)); assert.match(c.detalle, /tienes otro antivirus: Bitdefender Antivirus/);
    const m = chequeo(a, 'sistema', { OSVER: '10.0.26100', AV: '', ...mp });
    assert.equal(m.estado, 'mal', JSON.stringify(mp));
    // SecurityCenter2 lista a Defender aunque esté apagado, y a un antivirus de otra marca con el bit de "prendido" en 0.
    for (const av of ['262144|Windows Defender', '397568|Microsoft Defender Antivirus', '262144|Bitdefender Antivirus', '262144|Windows Defender\\n262144|Avast']) {
      const f = chequeo(a, 'sistema', { OSVER: '10.0.26100', AV: av, ...mp });
      assert.equal(f.estado, 'mal', `${av} ${JSON.stringify(mp)}`);
    }
    const dos = chequeo(a, 'sistema', { OSVER: '10.0.26100', AV: '262144|Windows Defender\\n266240|Avast', ...mp });
    assert.equal(dos.estado, 'bien'); assert.match(dos.detalle, /tienes otro antivirus: Avast$/);
  }
  sinMarca(a);
});

test('copias, bloqueo y mdm: no-se con la ruta exacta en Configuración, sin llamar a PowerShell', () => {
  const a = ambiente();
  const rutas = {
    copias: 'Configuración > Cuentas > Copia de seguridad de Windows',
    bloqueo: 'Configuración > Personalización > Pantalla de bloqueo',
    mdm: 'Configuración > Cuentas > Obtener acceso a trabajo o escuela',
  };
  for (const [id, ruta] of Object.entries(rutas)) {
    const c = chequeo(a, id);
    assert.equal(c.estado, 'no-se'); assert.ok(c.detalle.includes(ruta), c.detalle);
  }
  sinMarca(a);
});

test('env-permisos y ssh-permisos: no-se, nunca bien, aunque haya un .env', () => {
  const a = ambiente();
  mkdirSync(join(a.home, 'Desktop', 'p'), { recursive: true });
  writeFileSync(join(a.home, 'Desktop', 'p', '.env'), 'X=1\n');
  mkdirSync(join(a.home, '.ssh'));
  for (const id of ['env-permisos', 'ssh-permisos']) {
    const c = chequeo(a, id);
    assert.equal(c.estado, 'no-se');
    assert.match(c.detalle, /en Windows los permisos se revisan distinto; tu carpeta de usuario normalmente solo la abre tu cuenta/);
  }
});

test('claude-deny y transcripciones leen settings.json con json_get (sin plutil)', () => {
  const a = ambiente();
  const s = join(a.home, '.claude', 'settings.json');
  assert.equal(chequeo(a, 'claude-deny').estado, 'mal');
  escribirJson(s, { permissions: { deny: ['Read(//**/.env)', 'Read(~/.ssh/**)'] } });
  let c = chequeo(a, 'claude-deny');
  assert.equal(c.estado, 'mal'); assert.match(c.detalle, /\.aws/);
  escribirJson(s, { permissions: { deny: ['Read(//**/.env)', 'Read(~/.ssh/**)', 'Read(~/.aws/**)'] }, sandbox: { enabled: true }, cleanupPeriodDays: 14 });
  c = chequeo(a, 'claude-deny');
  assert.equal(c.estado, 'bien'); assert.match(c.detalle, /sandbox prendido/);
  mkdirSync(join(a.home, '.claude', 'projects', 'p'), { recursive: true });
  writeFileSync(join(a.home, '.claude', 'projects', 'p', 'a.jsonl'), '{}\n');
  c = chequeo(a, 'transcripciones');
  assert.equal(c.estado, 'bien'); assert.match(c.detalle, /se borran a los 14 días/);
  writeFileSync(s, '{ esto no es json');
  assert.equal(chequeo(a, 'claude-deny').estado, 'no-se');
  sinMarca(a);
});

test('powershell por defecto: se busca powershell.exe en el PATH si SEG_POWERSHELL no está', () => {
  const a = ambiente({ ps: { BITLOCKER: '1' } });
  const d = tmp('psdef-');
  copyFileSync(a.psBin, join(d, 'powershell.exe')); chmodSync(join(d, 'powershell.exe'), 0o755);
  const r = a.correr('revisar.sh', ['--solo', 'filevault'], { SEG_POWERSHELL: '', PATH: `${d}${sep}${a.env.PATH}` });
  assert.match(r.out, /estado=bien/, r.todo);
  assert.match(readFileSync(a.psLog, 'utf8'), /-NoProfile -NonInteractive -Command/);
});

test('sin PowerShell: los chequeos que lo necesitan dicen no-se en plano', () => {
  const a = ambiente();
  const c = chequeo(a, 'firewall', {}, { SEG_POWERSHELL: join(a.raizT, 'no-existe') });
  assert.equal(c.estado, 'no-se');
});

test('A5: un timeout de System32 que no sirve no rompe nada; find sigue siendo el de /usr/bin', () => {
  const a = ambiente({ ps: { BITLOCKER: '1' } });
  const d = tmp('sys32-');
  ejecutable(join(d, 'timeout'), '#!/bin/sh\necho "ERROR: Invalid syntax"\nexit 1\n');
  ejecutable(join(d, 'find'), '#!/bin/sh\necho "FIND-FALSO" >&2\nexit 1\n');
  const mas = { PATH: `${d}${sep}${a.env.PATH}` };
  assert.equal(chequeo(a, 'filevault', {}, mas).estado, 'bien');
  mkdirSync(join(a.home, 'Desktop', 'p'), { recursive: true });
  writeFileSync(join(a.home, 'Desktop', 'p', '.env'), 'X=1\n');
  const c = chequeo(a, 'env-archivos', {}, mas);
  assert.equal(c.estado, 'bien'); assert.match(c.detalle, /1 archivos .env/);
});

test('A4: secretos-disco también mira OneDrive y secretos-historial el historial de PowerShell', () => {
  const a = ambiente();
  const log = join(a.raizT, 'gitleaks.log');
  ejecutable(join(a.trampas, 'gitleaks'), `#!/bin/sh
for x in "$@"; do prev2="$prev"; prev="$x"; if [ "$prev2" = "--report-path" ]; then echo "[]" >"$x"; fi; done
echo "$2" >>"${log}"
exit 0
`);
  const od = join(a.home, 'OneDrive - Empresa', 'Documentos'); mkdirSync(od, { recursive: true });
  const od2 = join(a.home, 'OneDriveEnv', 'Desktop'); mkdirSync(od2, { recursive: true });
  const hist = join(a.home, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'PowerShell', 'PSReadLine', 'ConsoleHost_history.txt');
  mkdirSync(dirname(hist), { recursive: true }); writeFileSync(hist, 'ls\n');
  const mas = { OneDrive: join(a.home, 'OneDriveEnv'), APPDATA: join(a.home, 'AppData', 'Roaming') };
  mkdirSync(join(a.home, 'Desktop'), { recursive: true });
  assert.equal(chequeo(a, 'secretos-disco', {}, mas).estado, 'bien');
  let vistos = readFileSync(log, 'utf8');
  // Lo que ve bash (/tmp/...) y lo que ve node (C:\\...) cambian en Windows: se compara la parte que cuelga de HOME.
  const bajoHome = (ruta) => relative(a.home, ruta).split(sep2).join('/');
  assert.ok(vistos.includes(bajoHome(od)), vistos);
  assert.ok(vistos.includes(bajoHome(od2)), vistos);
  // --carpetas a mano: no se suma OneDrive.
  writeFileSync(log, '');
  chequeo(a, 'secretos-disco', {}, mas);
  const base = readFileSync(log, 'utf8');
  writeFileSync(log, '');
  const manual = a.correr('revisar.sh', ['--solo', 'secretos-disco', '--carpetas', join(a.home, 'Desktop')], mas);
  assert.match(manual.out, /estado=bien/, manual.todo);
  assert.ok(!readFileSync(log, 'utf8').includes('OneDrive'), readFileSync(log, 'utf8'));
  assert.ok(base.includes('OneDrive'));
  writeFileSync(log, '');
  assert.equal(chequeo(a, 'secretos-historial', {}, mas).estado, 'bien');
  vistos = readFileSync(log, 'utf8');
  // APPDATA y HOME apuntan al mismo archivo: se escanea una sola vez.
  assert.equal(vistos.split('\n').filter((x) => x.includes('ConsoleHost_history.txt')).length, 1, vistos);
});

test('A4: env-en-git en Windows solo mira git, nunca xcode-select, y no habla de Mac ni de Apple', () => {
  const a = ambiente();
  const d = join(a.home, 'Desktop', 'proy'); mkdirSync(d, { recursive: true });
  spawnSync('git', ['-C', d, 'init', '-q'], { env: a.env });
  writeFileSync(join(d, '.env'), 'X=1\n');
  const c = chequeo(a, 'env-en-git');
  assert.equal(c.estado, 'mal');
  assert.doesNotMatch(c.detalle, /Mac|Apple|xcode/i);
  sinMarca(a);
});

// ---------- arreglar.sh ----------
const REGLAS = ['Read(//**/.env)', 'Read(//**/.env.*)', 'Read(~/.ssh/**)', 'Read(~/.aws/**)'];
const leerJson = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));

test('arreglar claude-deny en Windows agrega y deshace las reglas sin plutil', () => {
  const a = ambiente();
  const s = join(a.home, '.claude', 'settings.json');
  const original = { model: 'opus', permissions: { allow: ['Bash(ls)'], deny: ['Bash(rm *)'] }, env: { A: 'ñandú' }, hooks: { x: [1, 2] } };
  escribirJson(s, original);
  const bytes = readFileSync(s);
  let r = a.correr('arreglar.sh', ['claude-deny', 'hacer']);
  assert.equal(r.rc, 0, r.todo);
  const d = leerJson(s);
  for (const x of REGLAS) assert.ok(d.permissions.deny.includes(x), x);
  assert.ok(d.permissions.deny.includes('Bash(rm *)'));
  assert.deepEqual(d.permissions.allow, ['Bash(ls)']);
  assert.equal(d.model, 'opus'); assert.deepEqual(d.env, original.env); assert.deepEqual(d.hooks, original.hooks);
  assert.match(r.out, /Reviso de nuevo:\s*CHEQUEO id=claude-deny estado=bien/);
  r = a.correr('arreglar.sh', ['claude-deny', 'deshacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.deepEqual(leerJson(s), original);
  assert.ok(readFileSync(s).equals(bytes), 'deshacer no devolvió los mismos bytes');
  sinMarca(a);
});

test('arreglar claude-deny en Windows: sin settings.json lo crea y deshacer lo quita; si cambió después, quita solo las reglas', () => {
  const a = ambiente();
  const s = join(a.home, '.claude', 'settings.json');
  let r = a.correr('arreglar.sh', ['claude-deny', 'hacer']);
  assert.equal(r.rc, 0, r.todo);
  for (const x of REGLAS) assert.ok(leerJson(s).permissions.deny.includes(x));
  r = a.correr('arreglar.sh', ['claude-deny', 'deshacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.ok(!existsSync(s));
  escribirJson(s, { model: 'sonnet' });
  a.correr('arreglar.sh', ['claude-deny', 'hacer']);
  const d = leerJson(s); d.theme = 'dark'; d.permissions.deny.push('Bash(curl *)'); writeFileSync(s, JSON.stringify(d));
  r = a.correr('arreglar.sh', ['claude-deny', 'deshacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.deepEqual(leerJson(s), { model: 'sonnet', theme: 'dark', permissions: { deny: ['Bash(curl *)'] } });
  sinMarca(a);
});

test('arreglar claude-deny en Windows: un settings.json roto no se toca', () => {
  const a = ambiente();
  const s = join(a.home, '.claude', 'settings.json');
  mkdirSync(dirname(s), { recursive: true }); writeFileSync(s, '{ roto');
  const r = a.correr('arreglar.sh', ['claude-deny', 'hacer']);
  assert.equal(r.rc, 1, r.todo);
  assert.equal(readFileSync(s, 'utf8'), '{ roto');
});

test('arreglar sandbox en Windows no toca nada', () => {
  const a = ambiente();
  const s = join(a.home, '.claude', 'settings.json');
  escribirJson(s, { model: 'opus' });
  const antes = readFileSync(s);
  for (const acc of ['hacer', 'deshacer']) {
    const r = a.correr('arreglar.sh', ['sandbox', acc]);
    assert.equal(r.rc, 0, r.todo);
    assert.match(r.out, /En Windows Claude Code no tiene sandbox/);
  }
  assert.ok(readFileSync(s).equals(antes));
  sinMarca(a);
});

test('arreglar env-permisos y ssh-permisos en Windows no tocan nada', () => {
  const a = ambiente();
  const env = join(a.home, 'Desktop', 'p', '.env');
  mkdirSync(dirname(env), { recursive: true }); writeFileSync(env, 'X=1\n'); chmodSync(env, 0o644);
  mkdirSync(join(a.home, '.ssh'), { mode: 0o755 });
  for (const id of ['env-permisos', 'ssh-permisos']) for (const acc of ['hacer', 'deshacer']) {
    const r = a.correr('arreglar.sh', [id, acc]);
    assert.equal(r.rc, 0, r.todo);
    assert.match(r.out, /en Windows|En Windows/);
    assert.ok(r.out.trim().split('\n').length <= 2, r.out);
  }
  if (!esWindows) assert.equal(statSync(env).mode & 0o777, 0o644); // Windows no tiene bits de permiso reales
  assert.equal(readFileSync(env, 'utf8'), 'X=1\n');
  sinMarca(a);
});

test('arreglar env-gitignore en Windows usa git sin preguntarle a xcode-select', () => {
  const a = ambiente();
  const d = join(a.home, 'Desktop', 'proy'); mkdirSync(d, { recursive: true });
  spawnSync('git', ['-C', d, 'init', '-q'], { env: a.env });
  writeFileSync(join(d, '.env'), 'X=1\n');
  const r = a.correr('arreglar.sh', ['env-gitignore', 'hacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.match(readFileSync(join(d, '.gitignore'), 'utf8'), /\.env\*/);
  sinMarca(a);
});

// ---------- admin.sh ----------
test('admin.sh en Windows: una línea clara por arreglo, sale 0 y nunca llama a osascript', () => {
  const a = ambiente();
  const rutas = { actualizaciones: 'Windows Update', firewall: 'Seguridad de Windows', 'ssh-remoto': 'OpenSSH', invitado: 'Configuración > Cuentas' };
  for (const [id, ruta] of Object.entries(rutas)) for (const acc of ['hacer', 'deshacer']) {
    const r = a.correr('admin.sh', [id, acc]);
    assert.equal(r.rc, 0, r.todo);
    assert.match(r.out, /^Este arreglo todavía no está listo para Windows\. Te digo cómo hacerlo a mano: /);
    assert.ok(r.out.includes(ruta), r.out);
    assert.doesNotMatch(r.todo, /macOS|osascript|ventana de/);
  }
  const r = a.correr('admin.sh', ['firewall', 'hacer'], { ADMIN_PRUEBA: '1' });
  assert.equal(r.rc, 0);
  assert.doesNotMatch(r.out, /PRUEBA osascript/);
  sinMarca(a);
});

test('admin.sh en Windows: un id que no existe sigue dando el uso', () => {
  const a = ambiente();
  assert.equal(a.correr('admin.sh', ['nada', 'hacer']).rc, 2);
});

test('arreglar claude-deny en Windows sin perl: lo dice claro y no toca nada', () => {
  const a = ambiente();
  const s = join(a.home, '.claude', 'settings.json');
  escribirJson(s, { model: 'opus' });
  const antes = readFileSync(s);
  const r = a.correr('arreglar.sh', ['claude-deny', 'hacer'], { JSON_SIN_PERL: '1' });
  assert.equal(r.rc, 1, r.todo);
  assert.match(r.out, /necesito perl/);
  assert.doesNotMatch(r.todo, /no se deja escribir|tiene un error/);
  assert.ok(readFileSync(s).equals(antes));
});

test('arreglar claude-deny en Windows escribe con sangría de 2 espacios y sin archivos temporales sobrantes', () => {
  const a = ambiente();
  const s = join(a.home, '.claude', 'settings.json');
  escribirJson(s, { model: 'opus' });
  const r = a.correr('arreglar.sh', ['claude-deny', 'hacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.match(readFileSync(s, 'utf8'), /\n  "model": "opus"/);
  assert.doesNotMatch(readFileSync(s, 'utf8'), /\n {3}"/); // sangría de 2 espacios, no de 3
  const sobran = spawnSync('bash', ['-c', 'ls -a "$1"', '_', dirname(s)], { encoding: 'utf8' }).stdout;
  assert.doesNotMatch(sobran, /seg-tmp/);
});

test('arreglar reglas-ia y env-gitignore deshacer en Windows: lo que usa un dueño de Windows también se deshace', () => {
  const a = ambiente();
  const md = join(a.home, '.claude', 'CLAUDE.md');
  mkdirSync(dirname(md), { recursive: true }); writeFileSync(md, '# mío\n');
  let r = a.correr('arreglar.sh', ['reglas-ia', 'hacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.match(readFileSync(md, 'utf8'), /reglas-ia-seguridad: inicio/);
  r = a.correr('arreglar.sh', ['reglas-ia', 'deshacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.equal(readFileSync(md, 'utf8'), '# mío\n');
  const d = join(a.home, 'Desktop', 'proy'); mkdirSync(d, { recursive: true });
  spawnSync('git', ['-C', d, 'init', '-q'], { env: a.env });
  writeFileSync(join(d, '.env'), 'X=1\n');
  a.correr('arreglar.sh', ['env-gitignore', 'hacer']);
  assert.ok(existsSync(join(d, '.gitignore')));
  r = a.correr('arreglar.sh', ['env-gitignore', 'deshacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.ok(!existsSync(join(d, '.gitignore')));
});

test('arreglar gitleaks en Windows: pone el aviso antes de cada commit y deshacer lo quita', () => {
  const a = ambiente();
  ejecutable(join(a.trampas, 'gitleaks'), '#!/bin/sh\nexit 0\n');
  const repo = join(a.home, 'Desktop', 'proy'); mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q'], { env: a.env });
  const rbash = spawnSync('bash', ['-c', 'cd "$1" && pwd', '_', repo], { encoding: 'utf8' }).stdout.trim();
  let r = a.correr('arreglar.sh', ['gitleaks', 'hacer', rbash]);
  assert.equal(r.rc, 0, r.todo);
  const hook = join(repo, '.git', 'hooks', 'pre-commit');
  assert.match(readFileSync(hook, 'utf8'), /seguridad-hook \(setup-ceo\)/);
  r = a.correr('arreglar.sh', ['gitleaks', 'deshacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.ok(!existsSync(hook));
  sinMarca(a);
});

test('arreglar gitleaks en Windows sin gitleaks: dice cómo instalarlo a mano y no usa brew', () => {
  const a = ambiente();
  const r = a.correr('arreglar.sh', ['gitleaks', 'hacer'], { PATH: a.env.PATH });
  if (/gitleaks/.test(spawnSync('bash', ['-c', 'command -v gitleaks'], { encoding: 'utf8', env: a.env }).stdout)) return; // ya hay uno instalado
  assert.equal(r.rc, 0, r.todo);
  assert.match(r.out, /winget install gitleaks/);
  assert.doesNotMatch(r.todo, /Homebrew|brew/);
});

test('arreglar quitar-plugin en Windows: quita, anota y deshacer lo vuelve a instalar', () => {
  const a = ambiente();
  const gone = join(a.raizT, 'gone');
  ejecutable(join(a.trampas, 'claude'), `#!/bin/sh
case "$1 $2" in
  "plugin uninstall") echo "$3" >"${gone}";;
  "plugin install") rm -f "${gone}";;
  "plugin list") [ -f "${gone}" ] || printf '  > uno@mercado\\n    Version: 1.0.0\\n';;
esac
exit 0
`);
  let r = a.correr('arreglar.sh', ['quitar-plugin', 'hacer', 'uno@mercado']);
  assert.equal(r.rc, 0, r.todo);
  assert.match(r.out, /Listo: quité uno@mercado/);
  assert.ok(existsSync(gone));
  r = a.correr('arreglar.sh', ['quitar-plugin', 'deshacer', 'uno@mercado']);
  assert.equal(r.rc, 0, r.todo);
  assert.ok(!existsSync(gone));
});

// ---------- Ronda 3: lo que antes solo cubría la prueba de Mac ----------
const SECRETO = 'gh' + 'p_' + 'Zq8Wm3Xk9TrB5nLc2VdY7HsFj4PgA6EuKo1N'.slice(0, 36);
const GITLEAKS_CON_HALLAZGO = `#!/bin/sh
target=""; rep=""; prev=""
for x in "$@"; do
  [ "$prev" = "--report-path" ] && rep="$x"
  case "$x" in -*) ;; *) [ -z "$target" ] && [ "$prev" != "--report-path" ] && [ "$prev" != "--config" ] && [ "$prev" != "--report-format" ] && [ "$prev" != "--exit-code" ] && [ "$x" != dir ] && [ "$x" != git ] && target="$x";; esac
  prev="$x"
done
[ -z "$rep" ] || printf '[{"RuleID":"github-pat","Secret":"%s","Match":"token=%s","File":"%s/aqui.txt"}]' "$FAKE_SECRET" "$FAKE_SECRET" "$target" >"$rep"
exit 0
`;
const bashHome = (a) => spawnSync('bash', ['-c', 'printf %s "$HOME"'], { encoding: 'utf8', env: a.env }).stdout;

// Un claude falso con registro: quitar-plugin y quitar-mcp, y claude-extras.
function claudeFalso(a) {
  const log = join(a.raizT, 'claude.log'); const gone = join(a.raizT, 'claude.gone');
  writeFileSync(log, ''); writeFileSync(gone, '');
  ejecutable(join(a.trampas, 'claude'), `#!/bin/sh
case "$1 $2" in
  "plugin uninstall") echo "claude $*" >>"${log}"; [ -n "$FAKE_NOOP_QUITAR" ] || echo "$3" >>"${gone}";;
  "mcp remove") echo "claude $*" >>"${log}"; [ -n "$FAKE_NOOP_QUITAR" ] || echo "$3" >>"${gone}";;
  "plugin list") printf 'Installed plugins:\\n\\n'; grep -qx 'uno@mercado' "${gone}" 2>/dev/null || printf '  > uno@mercado\\n    Version: 1.0.0\\n    Scope: user\\n\\n'; printf '  > dos@mercado\\n    Version: 1.0.0\\n';;
  "mcp list") printf 'Checking MCP server health...\\n\\n'; grep -qx 'miconector' "${gone}" 2>/dev/null || printf 'miconector: https://example.invalid/mcp - Connected\\n';;
  "mcp get") printf '%s:\\n  Scope: User config\\n  Type: http\\n  URL: https://example.invalid/mcp\\n' "$3";;
  *) echo "claude $*" >>"${log}";;
esac
exit 0
`);
  return { log, gone };
}
const cambios = (a) => { const f = join(a.home, '.claude/mi-perfil/seguridad/cambios.md'); return existsSync(f) ? readFileSync(f, 'utf8') : ''; };

test('a. gitleaks con un hallazgo real: el secreto, el contenido de los .env y la ruta absoluta nunca salen, y no queda carpeta temporal', () => {
  const a = ambiente();
  ejecutable(join(a.trampas, 'gitleaks'), GITLEAKS_CON_HALLAZGO);
  for (const n of ['Desktop', 'Documents']) mkdirSync(join(a.home, n), { recursive: true });
  mkdirSync(join(a.home, 'Desktop', 'proy'), { recursive: true });
  writeFileSync(join(a.home, 'Desktop', 'proy', '.env'), 'CONTENIDO_PRIVADO=1\n');
  writeFileSync(join(a.home, '.bash_history'), 'ls\n');
  const limpio = tmp('seglimpio-'); // carpeta temporal privada de esta corrida: otra prueba en paralelo no la toca
  const mas = { FAKE_SECRET: SECRETO, TMPDIR: limpio, TMP: limpio, TEMP: limpio };
  const r = a.correr('revisar.sh', [], mas);
  assert.equal(r.rc, 0, r.todo);
  const l = lineas(r.out);
  assert.equal(l.length, 18, r.todo);
  assert.match(l[0], /estado=mal detalle=2 posibles claves en 2 archivos de tus carpetas: Desktop\/aqui\.txt \(github-pat\), Documents\/aqui\.txt \(github-pat\)/);
  assert.match(l[1], /id=secretos-historial estado=mal/);
  assert.ok(!r.todo.includes(SECRETO), 'el secreto falso apareció en la salida');
  assert.ok(!r.todo.includes('CONTENIDO_PRIVADO'), 'se imprimió el contenido de un .env');
  for (const h of [a.home, bashHome(a)]) assert.ok(!r.todo.includes(h), `salió la ruta absoluta ${h}`);
  assert.deepEqual(readdirSync(limpio), [], 'quedó algo en la carpeta temporal privada');
  sinMarca(a);
});

// Como gitleaks.exe de verdad: JSON con sangría (una clave por línea) y la ruta en forma de Windows (C:\Users\...) con las barras dobladas por el JSON.
const GITLEAKS_RUTA_WINDOWS = `#!/bin/sh
target=""; rep=""; prev=""
for x in "$@"; do
  [ "$prev" = "--report-path" ] && rep="$x"
  case "$x" in -*) ;; *) [ -z "$target" ] && [ "$prev" != "--report-path" ] && [ "$prev" != "--config" ] && [ "$prev" != "--report-format" ] && [ "$prev" != "--exit-code" ] && [ "$x" != dir ] && [ "$x" != git ] && target="$x";; esac
  prev="$x"
done
w=$(cygpath -w "$target" | sed 's/\\\\/\\\\\\\\/g')
[ -z "$rep" ] || printf '[\\n {\\n  "RuleID": "github-pat",\\n  "File": "%s\\\\\\\\aqui.txt"\\n }\\n]\\n' "$w" >"$rep"
exit 0
`;

// PATH sin jq (para la rama awk): las carpetas que tienen jq se cambian por una copia de enlaces sin jq.
function pathSinJq(a) {
  return a.env.PATH.split(sep).map((d, i) => {
    if (!existsSync(join(d, 'jq')) && !existsSync(join(d, 'jq.exe'))) return d;
    const c = join(a.raizT, `sinjq-${i}`); mkdirSync(c, { recursive: true });
    for (const n of readdirSync(d)) {
      if (n === 'jq' || n === 'jq.exe') continue;
      try { symlinkSync(join(d, n), join(c, n)); } catch { /* sin permiso para enlaces: esa herramienta no hace falta */ }
    }
    return c;
  }).join(sep);
}

test('a2. gitleaks.exe con rutas C:\\Users\\...: la lista sale corta (Desktop/aqui.txt) y nunca con la ruta completa', () => {
  const a = ambiente();
  const h = bashHome(a);
  if (!esWindows) {
    // Mac/Linux no tiene cygpath: uno falso que pasa la casa de prueba a C:\Users\Jose y de vuelta.
    ejecutable(join(a.trampas, 'cygpath'), `#!/bin/sh
case "$1" in
  -w) printf '%s\\n' "$2" | sed "s#^${h}#C:/Users/Jose#" | tr '/' '\\\\\\\\' ;;
  -u) printf '%s\\n' "$2" | tr '\\\\\\\\' '/' | sed "s#^C:/Users/Jose#${h}#" ;;
esac
`);
  }
  ejecutable(join(a.trampas, 'gitleaks'), GITLEAKS_RUTA_WINDOWS);
  mkdirSync(join(a.home, 'Desktop'), { recursive: true });
  for (const sinJq of [false, true]) {
    const mas = sinJq ? { PATH: pathSinJq(a) } : {};
    const r = a.correr('revisar.sh', ['--solo', 'secretos-disco'], mas);
    assert.equal(r.rc, 0, r.todo);
    assert.match(r.out, /estado=mal detalle=1 posibles claves en 1 archivos de tus carpetas: Desktop\/aqui\.txt \(github-pat\)/, r.todo);
    assert.doesNotMatch(r.out, /[A-Za-z]:[\\/]|Users[\\/]|Jose|\\\\/, r.todo);
    assert.ok(!r.out.includes(h), `salió la ruta absoluta ${h}`);
  }
  sinMarca(a);
});

test('b. env-archivos con un .env de verdad: lo cuenta, no lo abre y no imprime su contenido', () => {
  const a = ambiente();
  const d = join(a.home, 'Desktop', 'proy'); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, '.env'), 'CONTENIDO_PRIVADO=1\n');
  writeFileSync(join(d, '.env.example'), 'X=\n');
  const r = a.correr('revisar.sh', ['--solo', 'env-archivos']);
  assert.match(r.out, /estado=bien detalle=1 archivos \.env \(no los abro\): Desktop\/proy\/\.env/);
  assert.ok(!r.todo.includes('CONTENIDO_PRIVADO'));
  assert.ok(!r.todo.includes(bashHome(a)));
});

test('c. claude-extras en Windows: cuenta plugins y conectores con claude plugin list y claude mcp list', () => {
  const a = ambiente();
  claudeFalso(a);
  const c = chequeo(a, 'claude-extras');
  assert.equal(c.estado, 'bien');
  assert.match(c.detalle, /2 plugins y 1 conectores: .*uno@mercado.*miconector/);
});

test('d. quitar-mcp en Windows: quita, guarda la configuración en 600 y deshacer lo vuelve a agregar en su alcance', () => {
  const a = ambiente();
  const { log } = claudeFalso(a);
  let r = a.correr('arreglar.sh', ['quitar-mcp', 'hacer', 'miconector']);
  assert.equal(r.rc, 0, r.todo);
  assert.match(r.out, /Listo: quité miconector/);
  assert.match(r.out, /respaldos/); assert.match(r.out, /claves/); assert.match(r.out, /rm -r/);
  assert.match(readFileSync(log, 'utf8'), /claude mcp remove miconector/);
  assert.match(cambios(a), /claude mcp add|quitar-mcp miconector/);
  const cfg = join(a.home, '.claude/mi-perfil/seguridad/respaldos/quitar-mcp--miconector/config.txt');
  assert.ok(existsSync(cfg));
  if (!esWindows) assert.equal(statSync(cfg).mode & 0o777, 0o600);
  r = a.correr('arreglar.sh', ['quitar-mcp', 'deshacer', 'miconector']);
  assert.equal(r.rc, 0, r.todo);
  assert.match(readFileSync(log, 'utf8'), /claude mcp add -s user --transport http miconector https:\/\/example\.invalid\/mcp/);
});

test('d. quitar-plugin y quitar-mcp en Windows: si sigue instalado no se dice Listo ni se registra', () => {
  for (const [id, nombre] of [['quitar-plugin', 'uno@mercado'], ['quitar-mcp', 'miconector']]) {
    const a = ambiente();
    claudeFalso(a);
    const r = a.correr('arreglar.sh', [id, 'hacer', nombre], { FAKE_NOOP_QUITAR: '1' });
    assert.match(r.todo, /No quedó aplicado/, `${id}: ${r.todo}`);
    assert.doesNotMatch(r.todo, /^Listo/m, id);
    assert.notEqual(r.rc, 0, id);
    assert.doesNotMatch(cambios(a), /Quité/, id);
  }
});

test('e. env-gitignore en Windows: deshacer desde una carpeta con .env no expande .env* y solo quita las 2 líneas', () => {
  const a = ambiente();
  const p = join(a.home, 'Desktop', 'uno'); mkdirSync(p, { recursive: true });
  spawnSync('git', ['-C', p, 'init', '-q'], { env: a.env });
  writeFileSync(join(p, '.env'), 'A=1\n'); writeFileSync(join(p, '.gitignore'), 'dist\n');
  assert.equal(a.correr('arreglar.sh', ['env-gitignore', 'hacer']).rc, 0);
  writeFileSync(join(p, '.gitignore'), readFileSync(join(p, '.gitignore'), 'utf8') + 'build\n');
  const aqui = join(a.raizT, 'aqui'); mkdirSync(aqui);
  for (const n of ['.env', '.env.local', '.env.example']) writeFileSync(join(aqui, n), 'Z=1\n');
  const r = spawnSync('bash', [join(S, 'arreglar.sh'), 'env-gitignore', 'deshacer'], { encoding: 'utf8', env: a.env, cwd: aqui });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(readFileSync(join(p, '.gitignore'), 'utf8'), 'dist\nbuild\n');
  assert.deepEqual(readdirSync(aqui).sort(), ['.env', '.env.example', '.env.local']);
});

test('e. env-gitignore en Windows: un .env ya subido a git no tumba otro repo y avisa que está en el historial', () => {
  const a = ambiente();
  const p1 = join(a.home, 'Desktop', 'subido'); const p2 = join(a.home, 'Desktop', 'suelto');
  for (const p of [p1, p2]) { mkdirSync(p, { recursive: true }); spawnSync('git', ['-C', p, 'init', '-q'], { env: a.env }); writeFileSync(join(p, '.env'), 'A=1\n'); }
  spawnSync('git', ['-C', p1, 'add', '.env'], { env: a.env });
  const h = a.correr('arreglar.sh', ['env-gitignore', 'hacer']);
  assert.equal(h.rc, 0, h.todo);
  assert.equal(readFileSync(join(p2, '.gitignore'), 'utf8'), '.env*\n!.env.example\n');
  assert.ok(existsSync(join(p1, '.gitignore')));
  assert.match(h.out, /YA están en git/); assert.match(h.out, /historial de git/); assert.match(h.out, /rota esas claves/); assert.match(h.out, /subido\/\.env/);
});

test('e. env-gitignore en Windows: si un repo no queda ignorado, los demás repos no se deshacen', () => {
  const a = ambiente();
  const p1 = join(a.home, 'Desktop', 'bueno'); const p2 = join(a.home, 'Desktop', 'malo');
  for (const p of [p1, p2]) { mkdirSync(p, { recursive: true }); spawnSync('git', ['-C', p, 'init', '-q'], { env: a.env }); writeFileSync(join(p, '.env'), 'A=1\n'); }
  mkdirSync(join(p2, '.gitignore')); // una carpeta donde debería ir el archivo: no se puede escribir ahí
  const h = a.correr('arreglar.sh', ['env-gitignore', 'hacer']);
  assert.equal(readFileSync(join(p1, '.gitignore'), 'utf8'), '.env*\n!.env.example\n', h.todo);
  assert.match(h.todo, /malo/);
});

test('e. gitleaks en Windows respeta core.hooksPath y deshacer lo quita de ahí', () => {
  const a = ambiente();
  ejecutable(join(a.trampas, 'gitleaks'), '#!/bin/sh\nexit 0\n');
  const repo = join(a.home, 'Desktop', 'r'); mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q'], { env: a.env });
  spawnSync('git', ['-C', repo, 'config', 'core.hooksPath', '.githooks'], { env: a.env });
  const rb = spawnSync('bash', ['-c', 'cd "$1" && pwd', '_', repo], { encoding: 'utf8' }).stdout.trim();
  assert.equal(a.correr('arreglar.sh', ['gitleaks', 'hacer', rb]).rc, 0);
  const h = join(repo, '.githooks', 'pre-commit');
  assert.match(readFileSync(h, 'utf8'), /seguridad-hook/);
  assert.ok(!existsSync(join(repo, '.git', 'hooks', 'pre-commit')));
  a.correr('arreglar.sh', ['gitleaks', 'deshacer']);
  assert.ok(!existsSync(h));
});

test('e. gitleaks en Windows: si ya hay un pre-commit propio no lo pisa, no dice Listo ni registra', () => {
  const a = ambiente();
  ejecutable(join(a.trampas, 'gitleaks'), '#!/bin/sh\nexit 0\n');
  const repo = join(a.home, 'Desktop', 'r'); mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q'], { env: a.env });
  ejecutable(join(repo, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\necho mio\n');
  const rb = spawnSync('bash', ['-c', 'cd "$1" && pwd', '_', repo], { encoding: 'utf8' }).stdout.trim();
  const g = a.correr('arreglar.sh', ['gitleaks', 'hacer', rb]);
  assert.doesNotMatch(g.out, /^Listo/m, g.todo);
  assert.match(g.out, /no puse el aviso|no quedó|ningún proyecto|ya tiene su propio pre-commit/i);
  assert.doesNotMatch(cambios(a), /gitleaks listo/);
  assert.match(readFileSync(join(repo, '.git', 'hooks', 'pre-commit'), 'utf8'), /echo mio/);
});

test('e. revisar --solo en Windows: sin gitleaks da no-se, --solo da una línea y un id que no existe sale con 2', () => {
  const a = ambiente();
  // Se quitan del PATH las carpetas que traen gitleaks, para que el caso "no instalado" ocurra siempre.
  const hay = (d) => existsSync(join(d, 'gitleaks')) || existsSync(join(d, 'gitleaks.exe'));
  const sinGitleaks = a.env.PATH.split(sep).filter((d) => d && !hay(d)).join(sep);
  const mas = { PATH: sinGitleaks };
  assert.equal(spawnSync('bash', ['-c', 'command -v gitleaks'], { encoding: 'utf8', env: { ...a.env, ...mas } }).stdout.trim(), '');
  const r = a.correr('revisar.sh', ['--solo', 'secretos-disco'], mas);
  assert.equal(r.out.trim(), 'CHEQUEO id=secretos-disco estado=no-se detalle=gitleaks no está instalado');
  assert.equal(a.correr('revisar.sh', ['--solo', 'filevault'], mas).out.trim().split('\n').length, 1);
  const x = a.correr('revisar.sh', ['--solo', 'nada'], mas);
  assert.equal(x.rc, 2);
  assert.match(x.err, /No conozco el chequeo/);
  assert.equal(a.correr('revisar.sh', ['--nada'], mas).rc, 2);
});

test('claude-deny en Windows sin perl ni Python dice que faltan las herramientas, no que el archivo tiene un error', () => {
  const a = ambiente();
  escribirJson(join(a.home, '.claude', 'settings.json'), { model: 'opus' });
  const c = chequeo(a, 'claude-deny', {}, { JSON_SIN_PERL: '1', JSON_SIN_PYTHON: '1' });
  assert.equal(c.estado, 'no-se');
  assert.match(c.detalle, /no encuentro perl ni Python/);
  assert.doesNotMatch(c.detalle, /tiene un error|no pude leer/);
});

test('arreglar claude-deny en Windows: si settings.json no se puede escribir no dice Listo ni se registra', () => {
  const a = ambiente();
  // Una carpeta donde debería ir settings.json: escribir ahí falla igual en Windows y en Mac, sin depender de bits de permiso.
  mkdirSync(join(a.home, '.claude', 'settings.json'), { recursive: true });
  const r = a.correr('arreglar.sh', ['claude-deny', 'hacer']);
  assert.notEqual(r.rc, 0, r.todo);
  assert.doesNotMatch(r.todo, /^Listo/m);
  assert.doesNotMatch(cambios(a), /Reglas para que Claude/);
});

test('arreglar claude-deny en Windows: el mensaje no promete más de lo que hace', () => {
  const a = ambiente();
  const r = a.correr('arreglar.sh', ['claude-deny', 'hacer']);
  assert.equal(r.rc, 0, r.todo);
  assert.doesNotMatch(r.out, /Claude ya no puede abrir \.env/);
  assert.match(r.out, /herramienta de lectura/);
  assert.match(r.out, /no tiene sandbox/);
  assert.match(r.out, /cat \.env todavía podría/);
});

// cpSync de Node 22 en Windows puede fallar con carpetas con acento (José Pérez): se copia archivo por archivo.
function copiarCarpeta(origen, destino) {
  mkdirSync(destino, { recursive: true });
  for (const e of readdirSync(origen, { withFileTypes: true })) {
    const o = join(origen, e.name), d = join(destino, e.name);
    if (e.isDirectory()) copiarCarpeta(o, d);
    else copyFileSync(o, d);
  }
}

test('como deshacer en Windows: el comando anotado funciona aunque cambie la carpeta de la versión', () => {
  const a = ambiente();
  for (const v of ['1.0.0', '2.0.0']) {
    const dest = join(a.home, '.claude/plugins/cache/mercado/seguridad', v);
    copiarCarpeta(join(raiz, 'plugins/seguridad'), dest);
    assert.ok(existsSync(join(dest, 'scripts', 'arreglar.sh')), `no se copió el plugin a ${dest}`);
    if (v === '1.0.0') utimesSync(dest, new Date(2020, 1, 1), new Date(2020, 1, 1));
  }
  const h = a.correr('arreglar.sh', ['claude-deny', 'hacer']);
  assert.equal(h.rc, 0, h.todo);
  const reg = readFileSync(join(a.home, '.claude/mi-perfil/seguridad/cambios.md'), 'utf8');
  const cmd = reg.match(/Cómo deshacer: `([^`]+)`/)[1];
  assert.ok(!cmd.includes('1.0.0') && !cmd.includes('2.0.0') && !cmd.includes(S), cmd);
  assert.match(reg, /o pídele a Claude: deshaz claude-deny/);
  const r = spawnSync('bash', ['-c', cmd], { env: a.env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Deshecho/);
});
