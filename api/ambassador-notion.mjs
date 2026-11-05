import { planGroups } from './grouping.mjs';

const NOTION_VERSION = '2026-03-11';
const DEFAULT_DATA_SOURCE = 'a0bb33cf-eced-481e-bb0d-a3a83f70364e';

const rich = value => ({ rich_text: value ? [{ text: { content: value } }] : [] });
const plain = value => (value || []).map(item => item.plain_text || item.text?.content || '').join('');

export function mapReferral(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    firstName: plain(p['Prénom']?.rich_text),
    lastName: plain(p['Nom']?.rich_text),
    email: p['Email']?.email || '',
    phone: p['WhatsApp']?.phone_number || '',
    destination: p['Destinations']?.multi_select?.[0]?.name || '',
    period: plain(p['Période souhaitée']?.rich_text),
    ambassadorId: plain(p['ID ambassadrice']?.rich_text),
    status: p['Validation ambassadrice']?.select?.name || 'À valider',
    group: plain(p['Groupe Sisi']?.rich_text),
    created: page.created_time || ''
  };
}

export function makeNotionClient({ token, dataSourceId = DEFAULT_DATA_SOURCE, fetchImpl = fetch }) {
  if (!token) throw new Error('notion_not_configured');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json'
  };
  async function request(path, method, body) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetchImpl(`https://api.notion.com/v1${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(12_000)
      });
      if (response.status === 429 && attempt < 2) {
        const seconds = Math.min(3, Number(response.headers.get('retry-after')) || 1);
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        continue;
      }
      if (!response.ok) {
        const error = new Error('notion_unavailable');
        error.status = response.status;
        throw error;
      }
      return response.json();
    }
    throw new Error('notion_unavailable');
  }
  async function queryAll(filter) {
    const results = [];
    let cursor;
    do {
      const body = { page_size: 100, filter };
      if (cursor) body.start_cursor = cursor;
      const data = await request(`/data_sources/${dataSourceId}/query`, 'POST', body);
      results.push(...(data.results || []));
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor && results.length < 5000);
    return results;
  }
  async function findReference(reference) {
    const data = await request(`/data_sources/${dataSourceId}/query`, 'POST', {
      page_size: 1,
      filter: { property: 'Référence soumission', rich_text: { equals: reference } }
    });
    return data.results?.[0] || null;
  }
  async function listOwned(ambassadorId) {
    const pages = await queryAll({ and: [
      { property: 'Origine', select: { equals: 'Ambassadrice' } },
      { property: 'ID ambassadrice', rich_text: { equals: ambassadorId } }
    ] });
    return pages.map(mapReferral).sort((a, b) => b.created.localeCompare(a.created));
  }
  async function createReferral(ambassador, p) {
    const existing = await findReference(p.reference);
    if (existing) {
      const mapped = mapReferral(existing);
      if (mapped.ambassadorId !== ambassador.id) throw new Error('duplicate_reference');
      return mapped;
    }
    const properties = {
      'Candidature': { title: [{ text: { content: `${p.firstName} ${p.lastName}` } }] },
      'Prénom': rich(p.firstName), 'Nom': rich(p.lastName),
      'Email': { email: p.email }, 'WhatsApp': { phone_number: p.phone },
      'Destinations': { multi_select: [{ name: p.destination }] },
      'Période souhaitée': rich(p.period),
      'Origine': { select: { name: 'Ambassadrice' } },
      'Ambassadrice': rich(ambassador.name),
      'Email ambassadrice': { email: ambassador.email },
      'ID ambassadrice': rich(ambassador.id),
      'Validation ambassadrice': { select: { name: 'À valider' } },
      'Accord de contact': { checkbox: true },
      'Référence soumission': rich(p.reference)
    };
    const children = [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [
      { text: { content: `Proposition transmise par ${ambassador.name} le ${new Date().toISOString()}. L’ambassadrice a confirmé l’accord de la Sisi pour être contactée. À valider par Florence dans Notion.` } }
    ] } }];
    try {
      const page = await request('/pages', 'POST', {
        parent: { type: 'data_source_id', data_source_id: dataSourceId }, properties, children
      });
      return mapReferral(page);
    } catch (error) {
      // A timeout may follow a successful creation. Recheck before inviting a retry.
      try {
        const found = await findReference(p.reference);
        if (found) return mapReferral(found);
      } catch {}
      throw error;
    }
  }
  async function reconcileGroups() {
    const pages = await queryAll({ property: 'Origine', select: { equals: 'Ambassadrice' } });
    const changes = planGroups(pages.map(mapReferral)).slice(0, 24);
    for (const change of changes) {
      await request(`/pages/${change.id}`, 'PATCH', {
        properties: { 'Groupe Sisi': rich(change.group) }
      });
    }
    return { scanned: pages.length, changed: changes.length };
  }
  return { listOwned, createReferral, reconcileGroups, findReference };
}
