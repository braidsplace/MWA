import { Readable } from 'node:stream';
import backend from '../../api/candidatures.js';

const MAX_BODY = 20_000;

async function limitedBody(request) {
  const knownLength = Number(request.headers.get('content-length') || 0);
  if (knownLength > MAX_BODY) return null;
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      return null;
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

export default async function candidature(request, context) {
  const body = await limitedBody(request);
  if (body === null) {
    return Response.json({ saved: false }, { status: 413, headers: { 'Cache-Control': 'no-store' } });
  }

  const url = new URL(request.url);
  const incoming = Readable.from([body]);
  incoming.method = request.method;
  incoming.headers = {
    host: url.host,
    origin: request.headers.get('origin') || undefined,
    'content-type': request.headers.get('content-type') || '',
    'content-length': String(body.byteLength),
  };
  incoming.socket = { remoteAddress: context?.ip || 'unknown' };

  const result = { status: 500, headers: {}, body: '' };
  const outgoing = {
    writeHead(status, headers) { result.status = status; result.headers = headers; },
    end(value = '') { result.body = value; },
  };
  await backend.handler(incoming, outgoing);
  return new Response(result.body, { status: result.status, headers: result.headers });
}

export const config = {
  path: '/api/candidatures',
  rateLimit: { windowLimit: 12, windowSize: 180, aggregateBy: ['ip', 'domain'] },
};
