// Guards the release rules in scripts/nueva-version.sh: every plugin ships the same
// version, that version is the newest CHANGELOG entry, and every skill and agent has frontmatter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { raiz } from './ayuda.mjs';
const plugins = readdirSync(join(raiz, 'plugins'));
const version = (p) => JSON.parse(readFileSync(join(raiz, 'plugins', p, '.claude-plugin', 'plugin.json'), 'utf8')).version;

test('todos los plugins tienen la misma versión', () => {
  const versiones = new Set(plugins.map(version));
  assert.equal(versiones.size, 1, `versiones distintas: ${[...versiones].join(', ')}`);
});

test('la versión de los plugins es la primera del CHANGELOG', () => {
  const primera = readFileSync(join(raiz, 'CHANGELOG.md'), 'utf8').match(/^## (\d+\.\d+\.\d+) \(/m)?.[1];
  assert.equal(primera, version(plugins[0]));
});

test('cada agente de cada plugin tiene name, description y model', () => {
  for (const p of plugins) {
    const dir = join(raiz, 'plugins', p, 'agents');
    if (!existsSync(dir)) continue;
    for (const a of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const cabeza = readFileSync(join(dir, a), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      assert.match(cabeza, new RegExp(`^name: ${a.replace(/\.md$/, '')}$`, 'm'), `${p}/${a}: sin name o distinto al archivo`);
      assert.match(cabeza, /^description: .{20,}/m, `${p}/${a} sin description`);
      assert.match(cabeza, /^model: (haiku|sonnet|opus|fable|inherit)$/m, `${p}/${a} sin model`);
    }
  }
});

test('cada skill tiene name y description en su frontmatter', () => {
  for (const p of plugins) {
    const dir = join(raiz, 'plugins', p, 'skills');
    if (!existsSync(dir)) continue;
    for (const s of readdirSync(dir)) {
      const md = join(dir, s, 'SKILL.md');
      if (!existsSync(md)) continue;
      const cabeza = readFileSync(md, 'utf8').split('---')[1] ?? '';
      assert.match(cabeza, /^name: \S+/m, `${p}/${s} sin name`);
      assert.match(cabeza, /^description: (\|[ \t]*\n[ \t]+)?.{20,}/m, `${p}/${s} sin description`);
    }
  }
});

test('ningún archivo de texto tiene fin de línea CRLF', () => {
  const archivos = execFileSync('git', ['-C', raiz, 'ls-files', '-z'], { encoding: 'utf8' }).split('\0')
    .filter((f) => /\.(sh|py|json|md|mjs|yml)$/.test(f) && existsSync(join(raiz, f)));
  assert.ok(archivos.length > 20);
  const con = archivos.filter((f) => readFileSync(join(raiz, f), 'utf8').includes('\r'));
  assert.deepEqual(con, []);
});
