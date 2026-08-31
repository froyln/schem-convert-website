import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import api from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(api);
app.use(express.static(path.join(__dirname, 'dist')));

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
