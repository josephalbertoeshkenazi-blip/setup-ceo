// La cuenta de preguntas del banco de simulacion: solo los borradores en bloque citado "> " quedan fuera.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contarPreguntas, sinMarkdown } from './entrevista/revisar-salida.mjs';

test('un borrador en bloque citado no cuenta como pregunta', () => {
  const t = 'Aquí va tu correo:\n\n> Hola, buen día:\n> ¿Me ayudas a confirmar de qué son?\n> Gracias.\n\n¿Lo mandas tú?';
  assert.equal(contarPreguntas(t), 1);
});

test('una pregunta real entre comillas sí cuenta', () => {
  assert.equal(contarPreguntas('Te pregunto esto: "¿Seguimos o paramos?"'), 1);
  assert.equal(contarPreguntas('«¿Cómo quieres que te hable?» y ¿qué no hago sin preguntarte?'), 2);
});

test('sin preguntas da cero', () => {
  assert.equal(contarPreguntas('Listo, guardé tu perfil.'), 0);
});

test('las negritas de markdown no rompen la comparación de frases', () => {
  assert.match(sinMarkdown('Revisa **tu** texto y le quita lo que suena a robot.'), /revis\w+ tu texto/i);
  assert.doesNotMatch(sinMarkdown('Escribe tu informe por ti.'), /revis\w+ tu texto/i);
});
