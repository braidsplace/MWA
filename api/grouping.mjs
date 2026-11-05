'use strict';

const GROUP_SIZE = 6;

function groupNumber(value) {
  const match = /^Groupe n°(\d+)$/.exec(String(value || ''));
  return match ? Number(match[1]) : 0;
}

function bucketKey(row) {
  if (!row.destination || !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.period || '')) return '';
  return `${row.destination}\u0000${row.period}`;
}

// A plan contains only rows that need a group change. Existing groups keep their number.
function planGroups(rows) {
  const accepted = rows.filter(row => row.status === 'Validée' && bucketKey(row));
  const pending = new Map();
  const existing = new Map();
  let nextNumber = rows.reduce((max, row) => Math.max(max, groupNumber(row.group)), 0) + 1;
  for (const row of accepted) {
    const key = bucketKey(row);
    if (row.group) {
      const id = `${key}\u0000${row.group}`;
      if (!existing.has(id)) existing.set(id, []);
      existing.get(id).push(row);
    } else {
      if (!pending.has(key)) pending.set(key, []);
      pending.get(key).push(row);
    }
  }
  for (const list of pending.values()) list.sort((a, b) =>
    String(a.created).localeCompare(String(b.created)) || String(a.id).localeCompare(String(b.id)));
  const changes = rows.filter(row => row.group && row.status !== 'Validée')
    .map(row => ({ id: row.id, group: '' }));
  for (const [id, members] of [...existing].sort((a, b) =>
    groupNumber(a[1][0].group) - groupNumber(b[1][0].group))) {
    const key = id.slice(0, id.lastIndexOf('\u0000'));
    const waiting = pending.get(key) || [];
    const missing = Math.max(0, GROUP_SIZE - members.length);
    for (const row of waiting.splice(0, missing)) changes.push({ id: row.id, group: members[0].group });
  }
  for (const key of [...pending.keys()].sort()) {
    const waiting = pending.get(key);
    while (waiting.length >= GROUP_SIZE) {
      const group = `Groupe n°${nextNumber++}`;
      for (const row of waiting.splice(0, GROUP_SIZE)) changes.push({ id: row.id, group });
    }
  }
  return changes;
}

export { GROUP_SIZE, planGroups, bucketKey };
