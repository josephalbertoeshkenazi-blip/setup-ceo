// Decisión de Joseph (23-oct): Shabbat sale del todo del setup, en setup-ceo y en el público.
// Ningún archivo que se entrega puede nombrarlo. Quedan fuera de esta revisión solo las pruebas
// (tests/, test_exportar.py), investigacion/ (no está en git) y los candados que lo buscan
// (exportar-publico.sh y la lista de privacidad), porque necesitan escribir la palabra para buscarla.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { raiz } from './ayuda.mjs';
const PALABRAS = /shabbat|shabat|yom tov|kosher/i;
const CANDADOS = new Set(['scripts/exportar-publico.sh', 'scripts/exportar-publico/test_exportar.py', 'scripts/privacidad.txt']);

test('ningún archivo que se entrega nombra Shabbat, Yom Tov ni kosher', () => {
  const archivos = execFileSync('git', ['-C', raiz, 'ls-files'], { encoding: 'utf8' }).split('\n')
    .filter((f) => f && !f.startsWith('tests/') && !f.startsWith('investigacion/') && !CANDADOS.has(f))
    .filter((f) => !/\.(png|webp|gif|jpg|zip)$/i.test(f));
  const con = archivos.filter((f) => PALABRAS.test(readFileSync(join(raiz, f), 'utf8')));
  assert.deepEqual(con, []);
});
