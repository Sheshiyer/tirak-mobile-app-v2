import http from 'node:http';
import zlib from 'node:zlib';

const HOST = '127.0.0.1';
const PORT = 8787;
const FIXTURE_TOKEN = 'tirak-local-fixture-token';
const providerEnvironmentKeys = Object.keys(process.env).filter((key) => (
  /^(OMISE|OPN|STRIPE|PAYMENT_PROVIDER)_/i.test(key)
));

if (providerEnvironmentKeys.length > 0) {
  throw new Error(`Refusing to start with provider environment keys: ${providerEnvironmentKeys.join(', ')}`);
}

const crcTable = Array.from({ length: 256 }, (_value, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  return value >>> 0;
});

const crc32 = (buffer) => {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
};

const makeNonScannableFixture = () => {
  const width = 224;
  const height = 224;
  const scanline = width * 3 + 1;
  const pixels = Buffer.alloc(scanline * height);

  for (let y = 0; y < height; y += 1) {
    pixels[y * scanline] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = y * scanline + 1 + x * 3;
      const border = x < 12 || y < 12 || x >= width - 12 || y >= height - 12;
      const cross = Math.abs(x - width / 2) < 22 || Math.abs(y - height / 2) < 22;
      const checker = (Math.floor(x / 20) + Math.floor(y / 20)) % 2 === 0;
      const purple = border || (!cross && checker);
      pixels[offset] = purple ? 93 : 255;
      pixels[offset + 1] = purple ? 58 : 255;
      pixels[offset + 2] = purple ? 160 : 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(pixels)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

const fixtureImage = makeNonScannableFixture();

const sendJson = (response, status, body) => {
  const payload = Buffer.from(JSON.stringify(body));
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': payload.length,
    'Cache-Control': 'no-store',
  });
  response.end(payload);
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${HOST}:${PORT}`);

  if (request.method === 'GET' && url.pathname === '/fixture/pending.png') {
    response.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': fixtureImage.length,
      'Cache-Control': 'no-store',
    });
    response.end(fixtureImage);
    return;
  }

  if (request.method !== 'POST' || url.pathname !== '/api/payments/charges') {
    sendJson(response, 404, { success: false, message: 'Local fixture route not found' });
    return;
  }

  if (request.headers.authorization !== `Bearer ${FIXTURE_TOKEN}`) {
    sendJson(response, 401, { success: false, message: 'Local fixture authentication required' });
    return;
  }

  const chunks = [];
  let size = 0;
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > 4096) request.destroy();
    else chunks.push(chunk);
  });
  request.on('end', () => {
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      sendJson(response, 400, { success: false, message: 'Invalid JSON' });
      return;
    }

    const bodyKeys = body && typeof body === 'object' && !Array.isArray(body)
      ? Object.keys(body).sort()
      : [];
    console.log(JSON.stringify({ method: request.method, path: url.pathname, bodyKeys }));

    if (
      bodyKeys.length !== 2
      || bodyKeys[0] !== 'bookingId'
      || bodyKeys[1] !== 'method'
      || typeof body.bookingId !== 'string'
      || body.bookingId.length === 0
      || body.method !== 'promptpay'
    ) {
      sendJson(response, 400, { success: false, message: 'Request does not match tirak-payments-v1' });
      return;
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    sendJson(response, 200, {
      success: true,
      data: {
        contractVersion: 'tirak-payments-v1',
        chargeId: 'chrg_local_fixture_0001',
        paymentStatus: 'pending',
        attemptStatus: 'pending',
        qrCodeUrl: `http://${HOST}:${PORT}/fixture/pending.png`,
        amountSatang: 180000,
        displayTotalThb: 1800,
        currency: 'THB',
        expiresAt,
      },
      message: 'PromptPay charge created',
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`tirak-payments-v1 local fixture listening on http://${HOST}:${PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
