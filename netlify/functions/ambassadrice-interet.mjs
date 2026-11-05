import { makeInterestClient } from '../../api/ambassador-interest.mjs';

const fail = (status, error) => Response.json({ saved: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });
const valid = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

export default async function handler(request) {
  if (request.method !== 'POST') return fail(405, 'method_not_allowed');
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return fail(403, 'forbidden');
  if (Number(request.headers.get('content-length') || 0) > 5000) return fail(413, 'too_large');
  let data;
  try { data = await request.json(); } catch { return fail(400, 'invalid_json'); }
  if (data?.website) return Response.json({ saved: true });
  if (!data || !valid(data.firstName, 80) || !valid(data.lastName, 80) ||
      !valid(data.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      !valid(data.phone, 35) || !/^[+\d()\s.-]{6,35}$/.test(data.phone) ||
      !valid(data.country, 80) || data.consent !== true ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.reference || '')) return fail(400, 'invalid_fields');
  if (!process.env.NOTION_API_KEY) return fail(503, 'not_configured');
  try {
    await makeInterestClient({ token: process.env.NOTION_API_KEY,
      dataSourceId: process.env.NOTION_AMBASSADOR_INTERESTS_DATA_SOURCE_ID || undefined }).create({
      reference: data.reference, firstName: data.firstName.trim(), lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(), phone: data.phone.trim(), country: data.country.trim()
    });
    return Response.json({ saved: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return fail(503, 'temporarily_unavailable'); }
}

export const config = { path: '/api/ambassadrice-interet', rateLimit: { windowLimit: 8, windowSize: 180, aggregateBy: ['ip', 'domain'] } };
