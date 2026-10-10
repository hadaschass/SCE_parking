'use strict';

const { embed, MODEL } = require('../services/embedding.service');
const { analyze } = require('../services/similarity.service');

async function compareSimilarity(req, res, next) {
  try {
    const { traits, roles } = req.body;
    const vectors = await embed([...traits, ...roles]);
    const result = analyze(traits, roles, vectors.slice(0, traits.length), vectors.slice(traits.length));
    return res.json({ model: MODEL, ...result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { compareSimilarity };
