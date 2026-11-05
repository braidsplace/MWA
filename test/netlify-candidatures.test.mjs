import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import candidature from '../netlify/functions/candidatures.mjs';

function candidate() {
  return {
    reference: randomUUID(), firstName: 'Test', lastName: 'Sisi',
    email: 'test.sisi@example.invalid', whatsapp: '+262 692 123 456',
    departureCity: 'Saint-Denis', departureCountry: 'France', source: 'Instagram',
    destinations: ['Johannesburg'], periods: ["Dans l'année"], duration: '8 à 10 jours',
    budget: '1 500 à 2 500 €', motivations: ['Me reconnecter à moi'],
    experiences: ['Culture et rencontres'], travelStyle: 'Équilibré',
    room: 'Chambre individuelle', companions: 'Seule', qualification: 'identified',
    identifiedTrip: 'Johannesburg', marketing: false,
  };
}

function post(payload, origin = 'https://sisi-demo.netlify.app') {
  return new Request('https://sisi-demo.netlify.app/api/candidatures', {
    method: 'POST', headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(payload),
  });
}

test('le parcours hébergé crée une fiche et une nouvelle tentative ne la duplique pas', async () => {
  const previousToken = process.env.NOTION_API_KEY;
  const previousFetch = global.fetch;
  process.env.NOTION_API_KEY = 'test-token';
  let savedReference = null;
  let creates = 0;
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    if (String(url).includes('/query')) {
      return { ok: true, json: async () => ({ results: savedReference === body.filter.rich_text.equals ? [{ id: 'page-test' }] : [] }) };
    }
    if (String(url).endsWith('/pages')) {
      creates++;
      savedReference = body.properties['Référence soumission'].rich_text[0].text.content;
      return { ok: true, json: async () => ({ id: 'page-test' }) };
    }
    throw new Error('unexpected URL');
  };
  try {
    const payload = candidate();
    const first = await candidature(post(payload), { ip: 'test-netlify-1' });
    const second = await candidature(post(payload), { ip: 'test-netlify-2' });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal((await second.json()).saved, true);
    assert.equal(creates, 1);
  } finally {
    global.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.NOTION_API_KEY;
    else process.env.NOTION_API_KEY = previousToken;
  }
});

test('une origine étrangère est refusée avant toute écriture', async () => {
  const response = await candidature(post(candidate(), 'https://autre-exemple.fr'), { ip: 'test-netlify-3' });
  assert.equal(response.status, 403);
});
