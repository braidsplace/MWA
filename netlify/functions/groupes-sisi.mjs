import { makeNotionClient } from '../../api/ambassador-notion.mjs';

export default async function handler() {
  const token = process.env.NOTION_API_KEY;
  if (!token) return new Response('not configured', { status: 503 });
  try {
    const result = await makeNotionClient({ token, dataSourceId: process.env.NOTION_DATA_SOURCE_ID || undefined }).reconcileGroups();
    return Response.json(result);
  } catch { return new Response('sync failed', { status: 503 }); }
}

export const config = { schedule: '*/10 * * * *' };
