import express from 'express';
import {
  inspectFile,
  convertFile,
  SUPPORTED,
  PRE_FLATTENING_MC_VERSION,
} from '@froyln/schem-convert-lib';

const TARGETS = [...Object.keys(SUPPORTED), PRE_FLATTENING_MC_VERSION];

// A bare express.Router() doesn't get res.json/req.query when used as raw
// connect middleware (Vite's dev server) — only a full express() app does
// that prototype setup on every request. Export the app itself.
const router = express();
// fetch() sends raw ArrayBuffer bodies with no Content-Type header, and
// type-is (which express.raw uses to decide whether to parse) treats a
// missing header as "don't parse" even with type: '*/*' — so match everything.
router.use(express.raw({ type: () => true, limit: '25mb' }));

router.get('/api/versions', (req, res) => {
  res.json({ targets: TARGETS });
});

router.post('/api/inspect', async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const info = await inspectFile(req.body);
    res.json(info);
  } catch (err) {
    res.status(400).json({ error: 'Not a valid .litematic file' });
  }
});

router.post('/api/convert', async (req, res) => {
  const to = req.query.to;
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  if (!TARGETS.includes(to)) {
    return res.status(400).json({ error: `Unsupported Minecraft version: ${to}` });
  }
  try {
    const { buffer, report } = await convertFile(req.body, to);
    const name = req.get('X-Filename') || 'schematic.litematic';
    const stem = name.replace(/\.litematic$/i, '');
    res.json({
      filename: `${stem}-${to}.litematic`,
      data: buffer.toString('base64'),
      report: {
        blocks: report.blockLines(),
        items: report.itemLines(),
        notes: report.noteLines(),
      },
    });
  } catch (err) {
    if (/Unsupported Minecraft version/.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    if (/unexpected end of file|invalid|incorrect header/i.test(err.message)) {
      return res.status(400).json({ error: 'Not a valid .litematic file' });
    }
    res.status(500).json({ error: err.message });
  }
});

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File is too large (max 25MB)' });
  }
  res.status(500).json({ error: err.message || 'Internal error' });
});

export default router;
