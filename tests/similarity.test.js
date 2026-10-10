const request = require('supertest');

// Small hand-made "embeddings": each text maps to a 3-d vector so the
// expected similarities are easy to reason about.
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

jest.mock('../src/services/embedding.service', () => ({
  MODEL: 'test-model',
  embed: jest.fn(async (texts) => texts.map((t) => VECTORS[t])),
}));

const createApp = require('../src/app');
const { cosine, project2d } = require('../src/services/similarity.service');

const app = createApp();
const traits = ['analytical', 'curious', 'creative', 'empathetic', 'organized'];
const roles = ['data scientist', 'UX designer', 'DevOps engineer'];

describe('POST /api/similarity', () => {
  it('returns a 5x3 similarity matrix, role ranking and 2D map', async () => {
    const res = await request(app).post('/api/similarity').send({ traits, roles });

    expect(res.status).toBe(200);
    expect(res.body.model).toBe('test-model');
    expect(res.body.matrix).toHaveLength(5);
    res.body.matrix.forEach((row) => expect(row).toHaveLength(3));
    expect(res.body.matrix[0][0]).toBeCloseTo(cosine(VECTORS.analytical, VECTORS['data scientist']), 3);
    expect(res.body.points).toHaveLength(8);

    const closest = Object.fromEntries(res.body.traitMatches.map((m) => [m.trait, m.closestRole]));
    expect(closest).toEqual({
      analytical: 'data scientist',
      curious: 'data scientist',
      creative: 'UX designer',
      empathetic: 'UX designer',
      organized: 'DevOps engineer',
    });
    expect(res.body.bestRole).toBe(res.body.roleScores[0].role);
    const averages = res.body.roleScores.map((r) => r.average);
    expect([...averages].sort((a, b) => b - a)).toEqual(averages);
  });

  it('requires exactly 5 characteristics and 3 roles', async () => {
    const res = await request(app).post('/api/similarity').send({ traits: traits.slice(0, 4), roles });
    expect(res.status).toBe(422);
  });

  it('rejects duplicate entries', async () => {
    const res = await request(app)
      .post('/api/similarity')
      .send({ traits, roles: ['data scientist', 'Data Scientist', 'UX designer'] });
    expect(res.status).toBe(422);
  });

  it('rejects empty entries', async () => {
    const res = await request(app).post('/api/similarity').send({ traits: ['a', ...traits.slice(1)], roles });
    expect(res.status).toBe(422);
  });
});

describe('project2d', () => {
  it('keeps nearby vectors closer together than distant ones', () => {
    const pts = project2d([[1, 0, 0], [0.95, 0.05, 0], [0, 0, 1]]);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    expect(dist(pts[0], pts[1])).toBeLessThan(dist(pts[0], pts[2]));
  });
});
