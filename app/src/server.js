import express from 'express';
const app = express();

const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || 'v1.0.0';

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', version: VERSION });
});

app.get('/api/time', (_req, res) => {
  res.json({ now: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.send(`Hello from KubeSphere Starter API (${VERSION}) ✨`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
