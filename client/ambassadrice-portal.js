import { getUser, logout } from '@netlify/identity';

const $ = id => document.getElementById(id);
let referrals = [];
let reference = crypto.randomUUID();
const escapeHtml = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function statusLabel(status) { return status === 'Validée' ? 'Validée' : status === 'Refusée' ? 'Refusée' : 'En attente'; }
function statusClass(status) { return status === 'Validée' ? 'approved' : status === 'Refusée' ? 'rejected' : 'pending'; }
function render() {
  const q = $('referral-search').value.trim().toLocaleLowerCase('fr'); const s = $('referral-status').value;
  const filtered = referrals.filter(r => (!s || r.status === s) && (!q || `${r.firstName} ${r.lastName} ${r.destination}`.toLocaleLowerCase('fr').includes(q)));
  $('referral-rows').innerHTML = filtered.length ? filtered.map(r => `<tr><td>${escapeHtml(r.firstName)} ${escapeHtml(r.lastName)}</td><td>${escapeHtml(r.destination)}</td><td>${escapeHtml(r.period)}</td><td>${escapeHtml(r.group || '—')}</td><td><span class="status-pill status-${statusClass(r.status)}">${statusLabel(r.status)}</span></td></tr>`).join('') : '<tr><td colspan="5">Aucune recommandation à afficher.</td></tr>';
}
async function load() {
  const response = await fetch('/api/ambassadrices', { credentials: 'same-origin', cache: 'no-store' });
  if (response.status === 401 || response.status === 403) { window.location.replace('ambassadrice.html#connexion'); return; }
  if (!response.ok) throw new Error('unavailable');
  referrals = (await response.json()).referrals || []; render();
}
try {
  const user = await getUser();
  if (!user) { window.location.replace('ambassadrice.html#connexion'); }
  else { await load(); $('portal-gate').hidden = true; $('portal-content').hidden = false; }
} catch { $('portal-gate').textContent = 'Le suivi est momentanément indisponible. Réessaie dans quelques instants.'; }
$('referral-search').addEventListener('input', render);
$('referral-status').addEventListener('change', render);
$('refresh-referrals').addEventListener('click', async () => { try { await load(); } catch { $('referral-feedback').textContent = 'Actualisation impossible pour le moment.'; } });
$('logout').addEventListener('click', async () => { await logout(); window.location.assign('ambassadrice.html#connexion'); });
$('referral-form').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type=submit]'); const feedback = $('referral-feedback');
  const data = Object.fromEntries(new FormData(form)); data.reference = reference; data.consent = data.consent === 'on'; button.disabled = true; feedback.textContent = 'Enregistrement en cours…'; feedback.className = 'form-feedback';
  try {
    const response = await fetch('/api/ambassadrices', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    if (response.status === 401 || response.status === 403) { window.location.replace('ambassadrice.html#connexion'); return; }
    if (!response.ok) throw new Error('unavailable');
    form.reset(); reference = crypto.randomUUID(); feedback.textContent = 'Ta recommandation est enregistrée. Elle est en attente de validation par Florence.'; feedback.className = 'form-feedback success'; await load();
  } catch { feedback.textContent = 'L’enregistrement n’a pas abouti. Tes réponses sont conservées : réessaie.'; feedback.className = 'form-feedback error'; }
  finally { button.disabled = false; }
});
