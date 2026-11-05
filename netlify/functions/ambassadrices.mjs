import { getUser, verifyRequestOrigin } from '@netlify/identity';
import { makeNotionClient } from '../../api/ambassador-notion.mjs';

const DESTINATIONS = new Set(['Johannesburg', 'Cape Town', 'Madagascar · Tuléar', 'Hoedspruit · Ukuthula', 'Tanzanie']);
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const validText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (request.method === 'POST') {
    try { verifyRequestOrigin(request); } catch { return json({ error: 'forbidden' }, 403); }
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 5000) return json({ error: 'too_large' }, 413);
  }
  const user = await getUser();
  if (!user) return json({ error: 'not_authenticated' }, 401);
  if (!user.roles?.includes('ambassadrice')) return json({ error: 'not_ambassador' }, 403);
  const token = process.env.NOTION_API_KEY;
  if (!token) return json({ error: 'service_not_configured' }, 503);
  const notion = makeNotionClient({ token, dataSourceId: process.env.NOTION_DATA_SOURCE_ID || undefined });
  try {
    if (request.method === 'GET') return json({ referrals: await notion.listOwned(user.id) });
    let body;
    try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }
    if (!body || !validText(body.firstName, 80) || !validText(body.lastName, 80) ||
        !validText(body.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
        !validText(body.phone, 35) || !/^[+\d()\s.-]{6,35}$/.test(body.phone) ||
        !DESTINATIONS.has(body.destination) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(body.period || '') ||
        body.consent !== true || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.reference || '')) {
      return json({ error: 'invalid_fields' }, 400);
    }
    const referral = await notion.createReferral({ id: user.id, email: user.email, name: user.name || user.email }, {
      reference: body.reference, firstName: body.firstName.trim(), lastName: body.lastName.trim(),
      email: body.email.trim().toLowerCase(), phone: body.phone.trim(), destination: body.destination, period: body.period
    });
    return json({ referral }, 201);
  } catch { return json({ error: 'temporarily_unavailable' }, 503); }
}

export const config = { path: '/api/ambassadrices', rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
