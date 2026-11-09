#!/usr/bin/env node
// Simula la entrevista de setup-ceo con una persona de mentira.
//   node tests/entrevista/simular.mjs <marisol|diego|raquel|andres> [--turnos 30] [--max-usd 20] [--modelo sonnet] [--dejar-home]
// GASTA plan de Claude (entrevistador + persona). No va dentro de `node --test`.
import { spawn, execFileSync } from 'node:child_process';
import { symlinkSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, existsSync, realpathSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join, dirname } from 'node:path';
import { aqui, raizRepo, cargarPersona, armarArchivos, armarStubs, leerToken, redactor, foto, diferencias, IDS_PERSONAS } from './lib.mjs';

// ---------- argumentos ----------
const args = process.argv.slice(2);
const idPersona = args.find((a) => !a.startsWith('--') && IDS_PERSONAS.includes(a));
const opc = (nombre, defecto) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 ? args[i + 1] : defecto;
};
if (!idPersona) {
  console.error(`Uso: node simular.mjs <${IDS_PERSONAS.join('|')}> [--turnos 30] [--max-usd 20] [--modelo sonnet] [--dejar-home]`);
  process.exit(2);
}
const maxTurnos = Number(opc('turnos', 30));
const maxUsd = Number(opc('max-usd', 20)); // tope de gasto por corrida (CEO: Andrés < ~US$20)
const modelo = opc('modelo', 'sonnet');
const dejarHome = args.includes('--dejar-home');

const ejecutarSync = (cmd, a) => execFileSync(cmd, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const claudeBin = ejecutarSync('/bin/zsh', ['-lc', 'command -v claude']).trim();
const persona = await cargarPersona(idPersona);

const token = leerToken(ejecutarSync);
const redactar = redactor(token);

// ---------- HOME temporal ----------
const home = realpathSync(mkdtempSync(join(tmpdir(), `entrevista-${idPersona}-`)));
const homePersona = realpathSync(mkdtempSync(join(tmpdir(), `entrevista-${idPersona}-persona-`)));
const acciones = join(home, 'acciones.log');
const bin = join(home, 'bin');
writeFileSync(acciones, '');

const sello = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
const salida = join(raizRepo, 'pruebas', '_salida', 'entrevista', `${idPersona}-${sello}`);
mkdirSync(salida, { recursive: true });

// ---------- canario: el HOME REAL de la persona que corre esto no se puede tocar ----------
const homeReal = userInfo().homedir;
const perfilReal = join(homeReal, '.claude', 'mi-perfil');
function fotoCanario() {
  if (!existsSync(perfilReal)) return 'NO EXISTE';
  const out = [];
  const rec = (d) => { for (const n of readdirSync(d)) { const a = join(d, n); const st = statSync(a); if (st.isDirectory()) rec(a); else out.push(`${a} ${st.size} ${st.mtimeMs}`); } };
  rec(perfilReal);
  return out.sort().join('\n') || 'VACIO';
}
const canarioInicial = fotoCanario();
function revisarCanario(cuando) {
  const ahora = fotoCanario();
  if (ahora !== canarioInicial) {
    throw new Error(`CANARIO ROJO (${cuando}): ${perfilReal} apareció o cambió durante la corrida.\nAntes: ${canarioInicial.slice(0, 300)}\nAhora: ${ahora.slice(0, 300)}`);
  }
}
console.error(`[canario] ${perfilReal}: ${canarioInicial.split('\n')[0]}`);

const notas = [];
const nota = (t) => { notas.push(t); console.error(`[nota] ${t}`); };

function limpiar() {
  if (dejarHome) {
    console.error(`HOME temporal conservado: ${home}  (persona: ${homePersona})`);
    return;
  }
  rmSync(home, { recursive: true, force: true });
  rmSync(homePersona, { recursive: true, force: true });
}
process.on('SIGINT', () => { limpiar(); process.exit(130); });

// ---------- ejecutar claude como proceso hijo ----------
const PATH_BASE = process.env.PATH ?? '/usr/bin:/bin';
// Solo lo necesario: nada de las demás variables del entorno real (claves de otros servicios, etc.).
const envBase = { CLAUDE_CODE_OAUTH_TOKEN: token };
for (const v of ['HOME', 'PATH', 'USER', 'LANG', 'TMPDIR']) if (process.env[v] !== undefined) envBase[v] = process.env[v];
const envInstalar = { ...envBase, HOME: home }; // sin stubs: el instalador local no debe pasar por los falsos
// La Mac de la persona no es la de Joseph: el nombre de usuario real no se le muestra al entrevistador.
// El PATH real trae carpetas de la cuenta de Joseph (y su nombre de usuario). Al entrevistador solo le llegan
// las carpetas del sistema y un enlace a claude dentro del HOME de prueba.
const PATH_SISTEMA = PATH_BASE.split(':').filter((d) => d && !d.startsWith('/Users/')).join(':');
mkdirSync(bin, { recursive: true });
try { symlinkSync(claudeBin, join(bin, 'claude')); } catch {}
const envEntrevistador = { ...envBase, HOME: home, USER: 'persona', LOGNAME: 'persona', PATH: `${bin}:${PATH_SISTEMA}` };
const envPersona = { ...envBase, HOME: homePersona };

function correr(args, { cwd, env, entrada = '', limiteMs = 15 * 60_000 }) {
  return new Promise((resolve) => {
    const hijo = spawn(claudeBin, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    const reloj = setTimeout(() => hijo.kill('SIGKILL'), limiteMs);
    hijo.stdout.on('data', (d) => (out += d));
    hijo.stderr.on('data', (d) => (err += d));
    hijo.on('close', (codigo) => { clearTimeout(reloj); resolve({ codigo, out, err }); });
    hijo.stdin.end(entrada);
  });
}

// ---------- instalación del setup ----------
// Copia del repo dentro del HOME temporal: ninguna ruta que vea el modelo (CLAUDE_PLUGIN_ROOT, skills) lleva el HOME real.
const repoCopia = join(home, 'repo-setup');
function copiarRepo() {
  // Solo lo que se instala: plugins/ y .claude-plugin/. Ni tests/ (con las fichas de las personas) ni scripts/.
  for (const carpeta of ['plugins', '.claude-plugin']) cpSync(join(raizRepo, carpeta), join(repoCopia, carpeta), { recursive: true });
}

// Defensa en profundidad: deniega herramientas de archivos sobre /Users y prende el sandbox de Bash (escritura solo en el HOME temporal).
function escribirAjustes() {
  mkdirSync(join(home, '.claude'), { recursive: true });
  const ajustes = {
    permissions: { deny: ['Read(//Users/**)', 'Edit(//Users/**)', 'Write(//Users/**)', 'Glob(//Users/**)', 'Grep(//Users/**)'] },
    // allowUnsandboxedCommands:false quita la salida de emergencia (dangerouslyDisableSandbox). El sandbox
    // protege settings.json, así que `claude plugin install` solo puede escribirlo si va en excludedCommands (comprobado
    // con una prueba de humo con haiku); allowRead deja ejecutar el binario de claude aunque /Users esté vedado.
    sandbox: {
      enabled: true, autoAllowBashIfSandboxed: true, allowUnsandboxedCommands: false,
      excludedCommands: ['claude plugin install:*', 'claude plugin marketplace add:*'],
      filesystem: { allowWrite: [home], denyRead: ['/Users'], allowRead: [dirname(claudeBin), dirname(realpathSync(claudeBin))] },
    },
  };
  writeFileSync(join(home, '.claude', 'settings.json'), JSON.stringify(ajustes, null, 2));
}

async function instalarSetup() {
  const raizRepo = repoCopia; // (sombra a propósito) todo el instalador usa la copia
  const plugins = ['ceo-base', 'adaptar', 'actualizaciones', 'sugerencias'];
  for (const extra of ['complementos', 'seguridad']) {
    if (existsSync(join(raizRepo, 'plugins', extra))) plugins.push(extra);
  }
  const añadir = await correr(['plugin', 'marketplace', 'add', raizRepo], { cwd: home, env: envInstalar, limiteMs: 180_000 });
  if (añadir.codigo !== 0) throw new Error(`marketplace add falló: ${redactar(añadir.err || añadir.out).slice(0, 400)}`);
  const respaldo = [];
  for (const p of plugins) {
    const r = await correr(['plugin', 'install', `${p}@setup-ceo`], { cwd: home, env: envInstalar, limiteMs: 180_000 });
    if (r.codigo !== 0) {
      nota(`plugin install ${p}@setup-ceo falló (${redactar(r.err || r.out).trim().slice(0, 160)}); uso --plugin-dir`);
      respaldo.push(join(raizRepo, 'plugins', p));
    }
  }
  return respaldo;
}

// ---------- entrevistador ----------
const eventos = [];       // eventos crudos (redactados) del entrevistador
const toolCalls = [];     // {sesion, turnoPersonas, personaAntes, name, input}
const turnos = [];        // {n, sesion, quien, texto}
const sesiones = [];      // {n, id}
let costo = { entrevistador: 0, persona: 0 };
let tokens = { entrevistador: { entrada: 0, salida: 0 }, persona: { entrada: 0, salida: 0 } };
let planDir = [];

function sumaUso(quien, uso) {
  if (!uso) return;
  tokens[quien].entrada += (uso.input_tokens ?? 0) + (uso.cache_read_input_tokens ?? 0) + (uso.cache_creation_input_tokens ?? 0);
  tokens[quien].salida += uso.output_tokens ?? 0;
}

async function turnoEntrevistador(mensaje, idSesion, nSesion) {
  const a = ['-p', '--model', modelo, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions'];
  for (const d of planDir) a.push('--plugin-dir', d);
  if (idSesion) a.push('--resume', idSesion);
  const r = await correr(a, { cwd: home, env: envEntrevistador, entrada: mensaje });
  let resultado = null, sid = idSesion;
  const personaAntes = [...turnos].reverse().find((t) => t.quien === 'persona')?.texto ?? '';
  const turnoPersonas = turnos.filter((t) => t.quien === 'persona').length;
  for (const linea of r.out.split('\n')) {
    if (!linea.trim()) continue;
    let ev;
    try { ev = JSON.parse(linea); } catch { continue; }
    if (ev.session_id) sid = ev.session_id;
    if (ev.type === 'system' && ev.subtype === 'init') {
      eventos.push({ type: 'system', subtype: 'init', session_id: ev.session_id, model: ev.model, plugins: ev.plugins, skills: ev.skills?.length });
      continue;
    }
    if (!['assistant', 'user', 'result'].includes(ev.type)) continue;
    eventos.push(JSON.parse(redactar(JSON.stringify(ev))));
    if (ev.type === 'assistant') {
      for (const c of ev.message?.content ?? []) {
        if (c.type === 'tool_use') toolCalls.push(JSON.parse(redactar(JSON.stringify({ sesion: nSesion, turnoPersonas, personaAntes, id: c.id, name: c.name, input: c.input }))));
      }
    }
    if (ev.type === 'result') {
      resultado = ev;
      costo.entrevistador += ev.total_cost_usd ?? 0;
      sumaUso('entrevistador', ev.usage);
    }
  }
  if (!resultado) throw new Error(`El entrevistador no devolvió resultado (código ${r.codigo}): ${redactar(r.err).slice(0, 500)}`);
  if (resultado.is_error) nota(`El entrevistador devolvió error: ${redactar(String(resultado.result)).slice(0, 200)}`);
  return { texto: redactar(String(resultado.result ?? '')).trim(), sid };
}

// ---------- persona ----------
const sistemaPersona = persona.ficha;
let idPersonaSesion = null;

async function turnoPersona(mensaje) {
  const a = ['-p', '--model', 'sonnet', '--output-format', 'json', '--tools', '', '--system-prompt', sistemaPersona];
  if (idPersonaSesion) a.push('--resume', idPersonaSesion);
  const r = await correr(a, { cwd: homePersona, env: envPersona, entrada: mensaje, limiteMs: 5 * 60_000 });
  let j;
  try { j = JSON.parse(r.out); } catch { throw new Error(`La persona no devolvió JSON (código ${r.codigo}): ${redactar(r.err || r.out).slice(0, 400)}`); }
  idPersonaSesion = j.session_id ?? idPersonaSesion;
  costo.persona += j.total_cost_usd ?? 0;
  sumaUso('persona', j.usage);
  return redactar(String(j.result ?? '')).trim();
}

// ---------- principal ----------
let codigoSalida = 0;
try {
  armarArchivos(home, persona);
  armarStubs(bin, acciones);
  copiarRepo();
  escribirAjustes();
  const fotoInicial = foto(home);
  if (existsSync(join(home, '.claude', 'mi-perfil'))) cpSync(join(home, '.claude', 'mi-perfil'), join(salida, 'mi-perfil-inicial'), { recursive: true });

  planDir = await instalarSetup();
  console.error(`HOME de prueba listo (${idPersona}). Instalado${planDir.length ? ` (con --plugin-dir para: ${planDir.join(', ')})` : ' con marketplace'}.`);

  const PRIMER_MENSAJE = '/adaptar:adaptar-a-mi';
  let nSesion = 1;
  let sid = null;
  let mensajeEntrevistador = PRIMER_MENSAJE;
  let preguntasEntrevistador = 0;
  let pausaHecha = false;
  let motivo = 'tope de turnos';
  let cambiosEnPausa = null;
  const nuevoTurno = (quien, texto) => turnos.push({ n: turnos.length + 1, sesion: nSesion, quien, texto });
  sesiones.push({ n: 1, id: null });

  for (let i = 0; i < maxTurnos; i++) {
    if (costo.entrevistador + costo.persona >= maxUsd) { motivo = `tope de costo (US$ ${maxUsd})`; break; }
    const r = await turnoEntrevistador(mensajeEntrevistador, sid, nSesion);
    revisarCanario(`turno ${i + 1}`);
    sid = r.sid;
    sesiones[nSesion - 1].id = sid;
    nuevoTurno('entrevistador', r.texto);
    console.error(`[turno ${i + 1}] entrevistador (${r.texto.length} car.)`);
    if (r.texto.includes('?')) preguntasEntrevistador++;

    let mensajePersona = r.texto;
    if (persona.guion?.pausaEnPregunta && !pausaHecha && r.texto.includes('?') && preguntasEntrevistador === persona.guion.pausaEnPregunta) {
      mensajePersona += `\n\n[ESCENA: es la pregunta ${preguntasEntrevistador}. Contesta exactamente "${persona.guion.textoPausa}" y pon [PAUSA] al final.]`;
    }
    const respuesta = await turnoPersona(mensajePersona);
    const pausa = respuesta.includes('[PAUSA]');
    const fin = respuesta.includes('[FIN]');
    const limpio = respuesta.replace(/\[(PAUSA|FIN)\]/g, '').trim();
    nuevoTurno('persona', limpio || (fin ? '(sin más que decir)' : ''));
    console.error(`[turno ${i + 1}] persona${pausa ? ' [PAUSA]' : ''}${fin ? ' [FIN]' : ''}`);

    if (fin && !limpio) { motivo = 'FIN'; break; }
    if (fin) { motivo = 'FIN'; break; }

    if (pausa && !pausaHecha) {
      pausaHecha = true;
      // El entrevistador recibe el "después" para que guarde el archivo de pausa y se despida.
      const adios = await turnoEntrevistador(limpio, sid, nSesion);
      revisarCanario(`despedida del turno ${i + 1}`);
      nuevoTurno('entrevistador', adios.texto);
      console.error(`[turno ${i + 1}] entrevistador (despedida de la pausa)`);
      cambiosEnPausa = diferencias(fotoInicial, foto(home));
      writeFileSync(join(salida, 'cambios-en-pausa.txt'), cambiosEnPausa.join('\n') + '\n');
      nSesion++;
      sesiones.push({ n: nSesion, id: null });
      sid = null;
      mensajeEntrevistador = PRIMER_MENSAJE;
      turnos.push({ n: turnos.length + 1, sesion: nSesion, quien: 'sistema', texto: '--- Sesión cerrada. Se abre una sesión NUEVA del entrevistador (misma carpeta, sin --resume). ---' });
      continue;
    }
    mensajeEntrevistador = limpio;
  }

  // ---------- resultados ----------
  revisarCanario('final');
  const fotoFinal = foto(home);
  writeFileSync(join(salida, 'archivos-cambiados.txt'), diferencias(fotoInicial, fotoFinal).join('\n') + '\n');
  if (existsSync(join(home, '.claude', 'mi-perfil'))) cpSync(join(home, '.claude', 'mi-perfil'), join(salida, 'mi-perfil'), { recursive: true });
  writeFileSync(join(salida, 'acciones.log'), redactar(readFileSync(acciones, 'utf8')));

  const md = [`# Conversación: ${persona.nombre} (${persona.perfil})`, '', `Entrevistador: ${modelo}. Persona: sonnet. Motivo de cierre: ${motivo}. Sesiones: ${sesiones.length}.`, ''];
  for (const t of turnos) {
    if (t.quien === 'sistema') md.push(`> ${t.texto}`, '');
    else md.push(`### ${t.n}. ${t.quien === 'entrevistador' ? 'ENTREVISTADOR' : persona.nombre.toUpperCase()} (sesión ${t.sesion})`, '', t.texto, '');
  }
  writeFileSync(join(salida, 'conversacion.md'), md.join('\n'));

  const total = costo.entrevistador + costo.persona;
  const meta = { persona: idPersona, fecha: sello, modelo, motivo, turnos: turnos.filter((t) => t.quien === 'entrevistador').length, sesiones, planDir: planDir.map((d) => d.replace(raizRepo, '.')), notas, canario: { ruta: perfilReal, antes: canarioInicial.split('\n')[0], despues: fotoCanario().split('\n')[0] }, costoUsd: { ...costo, total }, tokens };
  writeFileSync(join(salida, 'conversacion.json'), JSON.stringify({ meta, turnos, toolCalls }, null, 2));
  writeFileSync(join(salida, 'eventos.jsonl'), eventos.map((e) => JSON.stringify(e)).join('\n') + '\n');

  console.log(`Listo: ${salida}`);
  console.log(`Turnos: ${meta.turnos}  cierre: ${motivo}  costo: US$ ${total.toFixed(2)} (entrevistador ${costo.entrevistador.toFixed(2)}, persona ${costo.persona.toFixed(2)})`);
  console.log(`Tokens entrevistador: ${tokens.entrevistador.entrada} entrada / ${tokens.entrevistador.salida} salida`);
  if (notas.length) console.log(`Notas: ${notas.join(' | ')}`);
} catch (e) {
  codigoSalida = 1;
  console.error(`FALLÓ: ${redactar(e.stack ?? e.message)}`);
  try { writeFileSync(join(salida, 'error.txt'), redactar(e.stack ?? e.message)); } catch {}
} finally {
  limpiar();
}
process.exit(codigoSalida);
