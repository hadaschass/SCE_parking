'use strict';

const { createApp } = require('./src/app');

const PORT = Number(process.env.PORT) || 3000;

createApp().listen(PORT, () => {
  console.log(`Traits vs Tech Roles is running at http://localhost:${PORT}`);
});
