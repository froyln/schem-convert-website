import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'zlib';
import nbt from 'prismarine-nbt';
import http from 'http';
import api from '../api.js';

function buildLitematic() {
  const root = {
    Version: { type: 'int', value: 7 },
    MinecraftDataVersion: { type: 'int', value: 4189 }, // 1.21.4
    Regions: {
      type: 'compound',
      value: {
        Main: {
          type: 'compound',
          value: {
            BlockStatePalette: {
              type: 'list',
              value: {
                type: 'compound',
                value: [{ Name: { type: 'string', value: 'minecraft:air' } }],
              },
            },
          },
        },
      },
    },
  };
  const parsed = { type: 'compound', name: '', value: root };
  return zlib.gzipSync(nbt.writeUncompressed(parsed));
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(api);
    server.listen(0, () => resolve(server));
  });
}

async function withServer(fn) {
  const server = await startServer();
  const base = `http://localhost:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

test('GET /api/versions lists both flattened and pre-flattening targets', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/versions`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.targets.includes('26.1'));
    assert.ok(data.targets.includes('1.12.2'));
  });
});

test('POST /api/inspect detects the source version', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/inspect`, { method: 'POST', body: buildLitematic() });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.label, '1.21.4');
  });
});

test('POST /api/convert converts and returns a valid gzipped NBT buffer', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/convert?to=1.13.2`, {
      method: 'POST',
      headers: { 'X-Filename': 'build.litematic' },
      body: buildLitematic(),
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.filename, 'build-1.13.2.litematic');
    const bytes = Buffer.from(data.data, 'base64');
    const { parsed } = await nbt.parse(zlib.gunzipSync(bytes));
    assert.equal(parsed.value.Version.value, 5);
    assert.ok(Array.isArray(data.report.blocks));
  });
});

test('POST /api/convert rejects an unsupported target version', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/convert?to=1.9.4`, {
      method: 'POST',
      body: buildLitematic(),
    });
    assert.equal(res.status, 400);
  });
});

test('POST /api/inspect rejects a non-schematic file', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/inspect`, {
      method: 'POST',
      body: Buffer.from('not a litematic'),
    });
    assert.equal(res.status, 400);
  });
});
