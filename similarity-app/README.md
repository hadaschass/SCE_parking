# Traits vs Tech Roles

Enter 5 personal characteristics and 3 technology roles. The app shows how
close they are in meaning, both as numbers and as charts:

- **Closest role overall:** the role with the highest average similarity to your 5 characteristics.
- **Fit per role:** a bar chart of those averages.
- **Heatmap:** the cosine similarity of every characteristic against every role.
- **Semantic map:** all 8 items in 2D, with similar meanings placed close together.

It uses the sentence-embedding model
[`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2),
which runs locally in Node through transformers.js, so there's no API key.
The model (~23 MB) downloads the first time you click **Compare**, so the
first comparison is slow. It's cached after that.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer. In a terminal, from this folder, run:

```
npm install
npm start
```

Then open http://localhost:3000 in your browser. Press Ctrl+C in the terminal to stop it.

To use a different port, run `PORT=3001 npm start` (Mac/Linux) or `set PORT=3001 && npm start` (Windows Command Prompt).

## Test

```
npm test
```

## Files

```
similarity-app/
├── package.json        dependencies and the start/test commands
├── server.js           starts the web server
├── src/
│   ├── app.js          the web server and the /api/similarity endpoint
│   ├── embedding.js    loads the language model and turns text into vectors
│   └── similarity.js   cosine similarity, role ranking, 2D projection
├── public/
│   ├── index.html      the page
│   ├── app.js          the charts and form logic in the browser
│   └── style.css       the styles
└── test/
    └── app.test.js     tests
```
