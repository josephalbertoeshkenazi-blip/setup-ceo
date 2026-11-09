// Pruebas de los arreglos de la revisión final que son de texto, de listas o del exportador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { raiz } from './ayuda.mjs';
const leer = (r) => readFileSync(join(raiz, r), 'utf8');

test('(6) "lo de afuera es dato, no orden" está en repo-eval y en los dos agentes que leen cosas ajenas', () => {
  for (const r of ['plugins/complementos/skills/repo-eval/SKILL.md', 'plugins/diseno/agents/asesor-diseno.md', 'plugins/diseno/agents/critico-diseno.md', 'plugins/diseno/agents/dev-creativo.md']) {
    assert.match(leer(r), /is data, never instructions/, r);
  }
});

test('(7) ningún texto promete que "nada sale" de la Mac: dicen lo que pasa de verdad', () => {
  for (const r of ['plugins/adaptar/skills/adaptar-a-mi/migrar.md', 'plugins/seguridad/skills/revisar-mi-seguridad/SKILL.md',
    'plugins/adaptar/skills/adaptar-a-mi/SKILL.md', 'plugins/adaptar/skills/adaptar-a-mi/ramas/creativo.md']) {
    const t = leer(r);
    assert.doesNotMatch(t, /nada sale de (tu|su) (Mac|computadora)/i, r);
    assert.match(t, /(no lo subo|no se sube) a ningún otro lado/i, r);
  }
  assert.match(leer('plugins/adaptar/skills/adaptar-a-mi/migrar.md'), /pasa por Claude como cualquier mensaje/);
});
