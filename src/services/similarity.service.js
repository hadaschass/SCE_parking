'use strict';

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** Verbal label for a cosine score from a sentence-embedding model. */
function strength(score) {
  if (score >= 0.5) return 'strong';
  if (score >= 0.3) return 'moderate';
  if (score >= 0.15) return 'weak';
  return 'very weak';
}

/**
 * Projects vectors to 2D with PCA so semantically close items land close
 * together. Uses the n x n Gram matrix of the centered vectors (n is tiny)
 * and power iteration with deflation for the top two eigenvectors.
 */
function project2d(vectors) {
  const n = vectors.length;
  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);
  vectors.forEach((v) => v.forEach((x, i) => { mean[i] += x / n; }));
  const centered = vectors.map((v) => v.map((x, i) => x - mean[i]));
  const gram = centered.map((a) => centered.map((b) => a.reduce((s, x, i) => s + x * b[i], 0)));

  const components = [];
  for (let c = 0; c < 2; c += 1) {
    // Deterministic, non-degenerate start vector.
    let u = Array.from({ length: n }, (_, i) => 1 + i / n);
    let lambda = 0;
    for (let iter = 0; iter < 500; iter += 1) {
      const next = gram.map((row) => row.reduce((s, x, j) => s + x * u[j], 0));
      const norm = Math.sqrt(next.reduce((s, x) => s + x * x, 0));
      if (norm < 1e-12) break;
      lambda = norm;
      u = next.map((x) => x / norm);
    }
    components.push(u.map((x) => x * Math.sqrt(lambda)));
    // Deflate so the next iteration finds the following component.
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) gram[i][j] -= lambda * u[i] * u[j];
    }
  }
  return vectors.map((_, i) => ({ x: components[0][i], y: components[1][i] }));
}

/**
 * Compares every trait with every role. `traitVectors` / `roleVectors` are
 * embeddings in the same order as `traits` / `roles`.
 */
function analyze(traits, roles, traitVectors, roleVectors) {
  const round = (x) => Math.round(x * 1000) / 1000;

  const matrix = traitVectors.map((t) => roleVectors.map((r) => round(cosine(t, r))));

  const roleScores = roles
    .map((role, j) => {
      const scores = matrix.map((row) => row[j]);
      const average = round(scores.reduce((s, x) => s + x, 0) / scores.length);
      const best = scores.indexOf(Math.max(...scores));
      return { role, average, strength: strength(average), closestTrait: traits[best] };
    })
    .sort((a, b) => b.average - a.average);

  const traitMatches = traits.map((trait, i) => {
    const row = matrix[i];
    const best = row.indexOf(Math.max(...row));
    return { trait, closestRole: roles[best], score: row[best], strength: strength(row[best]) };
  });

  const points = project2d([...traitVectors, ...roleVectors]).map((p, i) => ({
    label: i < traits.length ? traits[i] : roles[i - traits.length],
    kind: i < traits.length ? 'trait' : 'role',
    x: round(p.x),
    y: round(p.y),
  }));

  return { traits, roles, matrix, roleScores, traitMatches, bestRole: roleScores[0].role, points };
}

module.exports = { analyze, cosine, strength, project2d };
