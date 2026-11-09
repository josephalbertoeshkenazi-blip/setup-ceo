// La descarga de Avisos: sale del Release de setup-ceo (no del repo privado)
// y la huella es la misma en instalar y en desinstalar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { raiz } from './ayuda.mjs';
const leer = (f) => readFileSync(join(raiz, f), 'utf8');

test('Avisos se baja de setup-ceo y la huella coincide en instalar y desinstalar', () => {
  const i = leer('plugins/avisos/skills/instalar/SKILL.md');
  const d = leer('plugins/avisos/skills/desinstalar/SKILL.md');
  const url = i.match(/https:\/\/github\.com\/[^\s"]+\/releases\/download\/[^\s"]+\.zip/)?.[0];
  assert.ok(url, 'no hay URL de descarga');
  assert.match(url, /\/setup-ceo\/releases\/download\//);
  const huellas = new Set([...i.matchAll(/\b[0-9a-f]{64}\b/g), ...d.matchAll(/\b[0-9a-f]{64}\b/g)].map((m) => m[0]));
  assert.equal(huellas.size, 1, `huellas distintas: ${[...huellas].join(', ')}`);
});
