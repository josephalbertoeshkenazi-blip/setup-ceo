// listar-agentes.sh con un HOME falso: solo cuenta, nunca abre contenido.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { raiz } from './ayuda.mjs';
const script = join(raiz, 'plugins/adaptar/scripts/listar-agentes.sh');
const MARCA = 'MARCADOR_SECRETO_NO_LEER_' + 'X'.repeat(8);

const correr = (home) =>
  execFileSync('bash', [script], { encoding: 'utf8', env: { HOME: home, PATH: process.env.PATH } });
const linea = (out, k) => out.split('\n').find((l) => l.startsWith(k + ':'));

function casa() { return mkdtempSync(join(tmpdir(), 'sj-home-')); }

test('con historial, catálogo instalado y entrevista a medias', () => {
  const home = casa();
  try {
    const c = join(home, '.claude');
    for (const p of ['-a', '-b', '-c']) mkdirSync(join(c, 'projects', p), { recursive: true });
    mkdirSync(join(c, 'projects/-a/memory'), { recursive: true });
    mkdirSync(join(c, 'projects/-b/memory'), { recursive: true });
    writeFileSync(join(c, 'projects/-a/memory/MEMORY.md'), MARCA);
    writeFileSync(join(c, 'projects/-b/memory/MEMORY.md'), MARCA);
    writeFileSync(join(c, 'CLAUDE.md'), MARCA);
    mkdirSync(join(c, 'mi-perfil'), { recursive: true });
    writeFileSync(join(c, 'mi-perfil/ceo.md'), MARCA);
    writeFileSync(join(c, 'mi-perfil/.entrevista.md'), `${MARCA}\nÚltima pregunta: 6\notra cosa ${MARCA}\n`);
    mkdirSync(join(c, 'skills/gstack'), { recursive: true });
    const plug = join(raiz, 'plugins/complementos');
    mkdirSync(join(c, 'plugins'), { recursive: true });
    writeFileSync(join(c, 'plugins/installed_plugins.json'), JSON.stringify({ version: 2, plugins: {
      'complementos@setup-ceo': [{ installPath: plug, version: '1.0.6' }],
      'superpowers@claude-plugins-official': [{ installPath: '/nada', version: '7.0.0' }] } }));
    const out = correr(home);
    assert.equal(linea(out, 'CATALOGO').replace(/\\/g, '/'), `CATALOGO: ${plug}/skills/instalar-complementos/catalogo.json`.replace(/\\/g, '/'));
    assert.equal(linea(out, 'HISTORIAL'), 'HISTORIAL: proyectos=3 memorias=2 claude_md=sí perfil=sí');
    assert.equal(linea(out, 'ENTREVISTA_EN_CURSO'), 'ENTREVISTA_EN_CURSO: sí (pregunta 6)');
    const inst = linea(out, 'INSTALADOS');
    assert.match(inst, /\bcomplementos\b/);
    assert.match(inst, /\bsuperpowers\b/);
    assert.match(inst, /\bgstack\b/);
    assert.ok(!out.includes(MARCA), 'el script abrió contenido');
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test('sin historial, sin plugins y sin entrevista', () => {
  const home = casa();
  try {
    const out = correr(home);
    assert.equal(linea(out, 'CATALOGO'), 'CATALOGO: no-instalado');
    assert.equal(linea(out, 'HISTORIAL'), 'HISTORIAL: proyectos=0 memorias=0 claude_md=no perfil=no');
    assert.equal(linea(out, 'ENTREVISTA_EN_CURSO'), 'ENTREVISTA_EN_CURSO: no');
    assert.equal(linea(out, 'INSTALADOS').trim(), 'INSTALADOS:');
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test('.entrevista.md sin la línea Última pregunta cuenta como no', () => {
  const home = casa();
  try {
    mkdirSync(join(home, '.claude/mi-perfil'), { recursive: true });
    writeFileSync(join(home, '.claude/mi-perfil/.entrevista.md'), 'nada útil\n');
    const out = correr(home);
    assert.equal(linea(out, 'ENTREVISTA_EN_CURSO'), 'ENTREVISTA_EN_CURSO: no');
    assert.equal(linea(out, 'HISTORIAL').endsWith('perfil=no'), true);
  } finally { rmSync(home, { recursive: true, force: true }); }
});
