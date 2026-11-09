// Pruebas de /adaptar:trae-mi-memoria, su script y el texto compartido, y de la sección de conectores del README.
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

import { raiz, esWindows, BASH, carpetaConHerramientas, baseWindows } from './ayuda.mjs';
// pbcopy y open son de Mac. En Windows el script usa PowerShell, y eso lo prueban tests/windows-actualizaciones-adaptar.test.mjs.
const soloMac = { skip: process.platform === 'darwin' ? false : 'pbcopy y open son de macOS; en Windows el script usa PowerShell (ver windows-actualizaciones-adaptar)' };
const plugin = join(raiz, 'plugins/adaptar');
const leer = (rel) => readFileSync(join(raiz, rel), 'utf8');
const skillMd = leer('plugins/adaptar/skills/trae-mi-memoria/SKILL.md');
const script = join(plugin, 'scripts/copiar-prompt-memoria.sh');

describe('skill trae-mi-memoria', () => {
  const cabeza = skillMd.split('---')[1];

  test('existe con name, description y argument-hint válidos', () => {
    assert.match(cabeza, /^name: trae-mi-memoria$/m);
    assert.match(cabeza, /^description: .{40,}/m);
    assert.match(cabeza, /^argument-hint: /m);
  });

  test('hace una sola pregunta, la misma del arranque de adaptar-a-mi, con sus opciones clicables', () => {
    const q = '¿Usas el chat de Claude (claude.ai) o ChatGPT?';
    assert.ok(skillMd.includes(q));
    assert.ok(leer('plugins/adaptar/skills/adaptar-a-mi/SKILL.md').includes(q), 'misma pregunta en adaptar-a-mi');
    assert.doesNotMatch(skillMd, /¿Dónde la tienes/);
    const pasos = skillMd.split('## Paso 1')[1].split('## Paso 2')[0];
    assert.equal((pasos.match(/¿/g) || []).length, 1);
    for (const o of ['"El chat de Claude"', '"ChatGPT"', '"Ninguno"']) assert.ok(pasos.includes(o), o);
    assert.match(pasos, /`AskUserQuestion`/);
    assert.match(pasos, /lista corta numerada/);
  });

  test('una IA a la vez: primero el chat de Claude, después ChatGPT', () => {
    const paso2 = skillMd.split('## Paso 2')[1].split('## Paso 3')[0];
    assert.match(paso2, /de una en una: primero el chat de Claude, después ChatGPT/);
    assert.match(paso2, /No empieces la siguiente hasta terminar con la anterior/);
    assert.ok(paso2.indexOf('<ia>') >= 0);
  });

  test('corre el script con los argumentos y termina el turno esperando el pegado', () => {
    assert.match(skillMd, /bash "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/copiar-prompt-memoria\.sh" <ia> <idioma>/);
    for (const t of ['Cmd+V', '"Copiar"', 'continúa', 'Termina tu turno aquí y espera el pegado']) assert.ok(skillMd.includes(t), t);
  });

  test('referencia migrar.md y el Paso 8 en vez de copiarlos', () => {
    assert.match(skillMd, /\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/adaptar-a-mi\/migrar\.md/);
    assert.match(skillMd, /Paso 8\. Escribir el perfil sin perder nada/);
    assert.match(skillMd, /Lo lees? desde ahí|Léelo desde ahí/);
    assert.doesNotMatch(skillMd, /Ignora lo anterior|\[sin fecha\]|Notas que yo agregué[^\n]*no se toca nunca/);
    assert.match(skillMd, /Lo que traje de <IA>/);
    assert.match(skillMd, /Memoria traída de <IA>: <AAAA-MM-DD>/);
    assert.match(skillMd, /\(por definir\)/);
    assert.match(skillMd, /\[secreto omitido\]/);
  });

  test('cierra con adaptar-a-mi y con el importador opcional de claude.ai', () => {
    const cierre = skillMd.split('## Paso 5')[1];
    assert.match(cierre, /\/adaptar:adaptar-a-mi/);
    assert.match(cierre, /Settings > Your Claude > Start import/);
    assert.match(cierre, /experimental/);
  });

  test('no depende de Claude in Chrome ni fuerza Chrome', () => {
    for (const t of [skillMd, readFileSync(script, 'utf8')]) {
      assert.doesNotMatch(t, /Claude in Chrome/i);
      assert.doesNotMatch(t, /open -a "?Google Chrome/);
      assert.doesNotMatch(t, /mcp__claude-in-chrome/);
    }
  });

  test('sin emojis', () => {
    for (const rel of ['plugins/adaptar/skills/trae-mi-memoria/SKILL.md', 'plugins/adaptar/scripts/copiar-prompt-memoria.sh',
      'plugins/adaptar/prompts/memoria-es.txt', 'plugins/adaptar/prompts/memoria-en.txt'])
      assert.doesNotMatch(leer(rel), /\p{Extended_Pictographic}/u, rel);
  });
});

describe('prompts compartidos', () => {
  test('existen en es y en y tienen las 5 categorías', () => {
    const es = leer('plugins/adaptar/prompts/memoria-es.txt');
    const en = leer('plugins/adaptar/prompts/memoria-en.txt');
    for (const c of ['Instrucciones', 'Identidad', 'Trabajo', 'Proyectos', 'Preferencias']) assert.match(es, new RegExp(c));
    for (const c of ['Instructions', 'Identity', 'Work', 'Projects', 'Preferences']) assert.match(en, new RegExp(c));
    assert.match(es, /\[AAAA-MM-DD\]/);
    assert.match(en, /\[YYYY-MM-DD\]/);
  });

  test('migrar.md y la skill usan el mismo script', () => {
    assert.match(leer('plugins/adaptar/skills/adaptar-a-mi/migrar.md'), /copiar-prompt-memoria\.sh/);
    assert.match(skillMd, /copiar-prompt-memoria\.sh/);
  });
});

describe('copiar-prompt-memoria.sh', () => {
  let base, bin, casa, binSinMac;
  const correr = (args, { path = bin } = {}) =>
    spawnSync(BASH, [script, ...args], {
      encoding: 'utf8',
      env: { HOME: casa, PATH: path, ...baseWindows },
    });
  const stub = (dir, nombre, cuerpo) => {
    const f = join(dir, nombre);
    writeFileSync(f, `#!/bin/bash\n${cuerpo}\n`);
    chmodSync(f, 0o755);
  };

  before(() => {
    base = mkdtempSync(join(tmpdir(), 'memoria-'));
    casa = join(base, 'home'); bin = join(base, 'bin'); binSinMac = join(base, 'bin-sin');
    for (const d of [casa, bin, binSinMac]) mkdirSync(d);
    stub(bin, 'pbcopy', `cat > "${base}/portapapeles"`);
    stub(bin, 'open', `echo "$@" >> "${base}/abierto"`);
    // lo mínimo que usa el script: cat, dirname y bash están en /bin y /usr/bin
    for (const destino of [binSinMac, bin]) carpetaConHerramientas(['cat', 'dirname'], destino);
  });
  after(() => rmSync(base, { recursive: true, force: true }));

  const limpiar = () => { for (const f of ['portapapeles', 'abierto']) rmSync(join(base, f), { force: true }); };

  test('es ejecutable, usa set -euo pipefail y no hace llamadas de red', () => {
    // Windows no guarda el permiso de ejecución en el archivo: ahí el script se corre siempre con "bash script", nunca directo.
    if (!esWindows) assert.ok(statSync(script).mode & 0o111, 'sin permiso de ejecución');
    const t = readFileSync(script, 'utf8');
    assert.match(t, /^set -euo pipefail$/m);
    assert.doesNotMatch(t, /\b(curl|wget|nc|ssh)\b/);
  });

  const casos = [['chatgpt', 'https://chatgpt.com/'], ['claude', 'https://claude.ai/new'], ['gemini', 'https://gemini.google.com/']];
  for (const [ia, url] of casos) {
    for (const idioma of ['es', 'en']) {
      test(`${ia} ${idioma}: copia el texto exacto y abre ${url}`, soloMac, () => {
        limpiar();
        const r = correr([ia, idioma]);
        assert.equal(r.status, 0, r.stderr);
        assert.equal(readFileSync(join(base, 'portapapeles'), 'utf8'), leer(`plugins/adaptar/prompts/memoria-${idioma}.txt`));
        assert.equal(readFileSync(join(base, 'abierto'), 'utf8').trim(), url);
        assert.equal(r.stdout.trim().split('\n').length, 1, 'imprime una sola línea');
      });
    }
  }

  test('otra: copia pero no abre nada', soloMac, () => {
    limpiar();
    const r = correr(['otra', 'es']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(base, 'portapapeles'), 'utf8'), leer('plugins/adaptar/prompts/memoria-es.txt'));
    assert.ok(!existsSync(join(base, 'abierto')));
  });

  test('argumento desconocido: salida 2 y mensaje claro, sin copiar', () => {
    limpiar();
    for (const args of [['grok', 'es'], ['chatgpt', 'fr'], ['chatgpt'], []]) {
      const r = correr(args);
      assert.equal(r.status, 2, args.join(' '));
      assert.match(r.stderr, /Uso:|desconocid/);
    }
    assert.ok(!existsSync(join(base, 'portapapeles')));
  });

  test('sin pbcopy ni open: imprime el texto entre marcas y sale 0', () => {
    const r = correr(['chatgpt', 'es'], { path: binSinMac });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /----- COPIA DESDE AQUI -----/);
    assert.ok(r.stdout.includes(leer('plugins/adaptar/prompts/memoria-es.txt')));
    assert.match(r.stdout, /----- COPIA HASTA AQUI -----/);
  });

  test('open falla: dice que no pudo abrir el navegador, da el enlace y avisa que ya está copiado', soloMac, () => {
    limpiar();
    const d = join(base, 'bin-open-roto'); mkdirSync(d, { recursive: true });
    carpetaConHerramientas(['cat', 'dirname'], d);
    stub(d, 'pbcopy', `cat > "${base}/portapapeles"`);
    stub(d, 'open', 'exit 1');
    const r = correr(['chatgpt', 'es'], { path: d });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(base, 'portapapeles'), 'utf8'), leer('plugins/adaptar/prompts/memoria-es.txt'));
    assert.match(r.stdout, /No pude abrir el navegador/);
    assert.match(r.stdout, /https:\/\/chatgpt\.com\//);
    assert.match(r.stdout, /ya está copiado/);
  });

  test('ningun PATH de estas pruebas contiene el pbcopy ni el open reales', () => {
    for (const dir of [bin, binSinMac, join(base, 'bin-sin-open'), join(base, 'bin-open-roto')]) {
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)) {
        const t = readFileSync(join(dir, f), 'utf8');
        assert.doesNotMatch(t, /\/usr\/bin\/(pbcopy|open)\b/, f);
      }
    }
    assert.ok(![bin, binSinMac].some((d) => d.startsWith('/usr') || d.startsWith('/bin')));
  });

  test('con pbcopy pero sin open: copia, imprime el texto y sale 0', soloMac, () => {
    limpiar();
    const d = join(base, 'bin-sin-open'); mkdirSync(d, { recursive: true });
    carpetaConHerramientas(['cat', 'dirname'], d);
    stub(d, 'pbcopy', `cat > "${base}/portapapeles"`);
    const r = correr(['claude', 'en'], { path: d });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(base, 'portapapeles'), 'utf8'), leer('plugins/adaptar/prompts/memoria-en.txt'));
    assert.match(r.stdout, /COPIA DESDE AQUI/);
  });
});
