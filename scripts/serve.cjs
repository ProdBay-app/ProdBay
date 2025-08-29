const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 4174;
const distPath = path.join(__dirname, '..', 'dist');

app.use(express.static(distPath, { index: false }));

// SPA fallback to index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://0.0.0.0:${port}`);
});


