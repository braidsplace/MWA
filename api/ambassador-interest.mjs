const DEFAULT_DATA_SOURCE = 'eb6987a4-1288-4580-b448-348d5c657ba2';
const VERSION = '2026-03-11';
const rich = value => ({ rich_text: [{ text: { content: value } }] });

export function makeInterestClient({ token, dataSourceId = DEFAULT_DATA_SOURCE, fetchImpl = fetch }) {
  if (!token) throw new Error('not_configured');
  async function request(path, method, body) {
    const response = await fetchImpl(`https://api.notion.com/v1${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, 'Notion-Version': VERSION, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('notion_unavailable');
    return response.json();
  }
  async function find(reference) {
    const data = await request(`/data_sources/${dataSourceId}/query`, 'POST', {
      page_size: 1, filter: { property: 'Référence soumission', rich_text: { equals: reference } }
    });
    return data.results?.[0] || null;
  }
  async function create(person) {
    if (await find(person.reference)) return { saved: true, duplicate: true };
    const properties = {
      'Nom': { title: [{ text: { content: person.lastName } }] },
      'Prénom': rich(person.firstName), 'Email': { email: person.email },
      'Téléphone': { phone_number: person.phone }, 'Pays': rich(person.country),
      'Statut': { select: { name: 'À contacter' } },
      'Accord de contact': { checkbox: true }, 'Référence soumission': rich(person.reference)
    };
    try {
      await request('/pages', 'POST', { parent: { type: 'data_source_id', data_source_id: dataSourceId }, properties });
      return { saved: true, duplicate: false };
    } catch (error) {
      // Recheck if Notion saved the page immediately before a timeout.
      try { if (await find(person.reference)) return { saved: true, duplicate: true }; } catch {}
      throw error;
    }
  }
  return { create, find };
}
