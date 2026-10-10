'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { project2d } = require('../src/similarity');

// Small hand-made "embeddings" so expected results are easy to reason about.
const VECTORS = {
  analytical: [1, 0, 0],
  curious: [0.9, 0.3, 0],
  creative: [0, 1, 0],
  empathetic: [0, 0.8, 0.6],
  organized: [0.2, 0, 1],
  'data scientist': [1, 0.1, 0],
  'UX designer': [0, 1, 0.2],
  'DevOps engineer': [0.1, 0, 1],
};
const traits = ['analytical', 'curious', 'creative', 'empathetic', 'organized'];
const roles = ['data scientist', 'UX designer', 'DevOps engineer'];

let server;
let base;

test.before(async () => {
  const app = createApp({ model: 'test-model', embed: async (texts) => texts.map((t) => VECTORS[t]) });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

function post(body) {
  return fetch(`${base}/api/similarity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('returns the matrix, role ranking and 2D map', async () => {
  const res = await post({ traits, roles });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.model, 'test-model');
  assert.strictEqual(data.matrix.length, 5);
  data.matrix.forEach((row) => assert.strictEqual(row.length, 3));
  assert.strictEqual(data.points.length, 8);
  assert.deepStrictEqual(Object.fromEntries(data.traitMatches.map((m) => [m.trait, m.closestRole])), {
    analytical: 'data scientist',
    curious: 'data scientist',
    creative: 'UX designer',
    empathetic: 'UX designer',
    organized: 'DevOps engineer',
  });
  assert.strictEqual(data.bestRole, data.roleScores[0].role);
});

test('requires exactly 5 characteristics and 3 roles', async () => {
  const res = await post({ traits: traits.slice(0, 4), roles });
  assert.strictEqual(res.status, 422);
});

test('rejects duplicates and too-short entries', async () => {
  assert.strictEqual((await post({ traits, roles: ['data scientist', 'Data Scientist', 'UX designer'] })).status, 422);
  assert.strictEqual((await post({ traits: ['a', ...traits.slice(1)], roles })).status, 422);
});

test('serves the page', async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /Traits vs Tech Roles/);
});

test('project2d keeps nearby vectors closer together', () => {
  const pts = project2d([[1, 0, 0], [0.95, 0.05, 0], [0, 0, 1]]);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  assert.ok(dist(pts[0], pts[1]) < dist(pts[0], pts[2]));
});
