'use strict';

// Sentence embeddings via transformers.js. The model (~23 MB) is downloaded
// from the Hugging Face Hub on first use and cached locally afterwards.
const MODEL = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';

let extractorPromise;

function getExtractor() {
  if (!extractorPromise) {
    const { pipeline } = require('@huggingface/transformers');
    extractorPromise = pipeline('feature-extraction', MODEL, { dtype: 'fp32' }).catch((cause) => {
      extractorPromise = undefined; // allow a retry on the next request
      const err = new Error('The language model could not be loaded. Please try again later.');
      err.status = 503;
      err.cause = cause;
      throw err;
    });
  }
  return extractorPromise;
}

/** Returns one L2-normalized embedding (array of numbers) per input text. */
async function embed(texts) {
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  return output.tolist();
}

module.exports = { embed, MODEL };
