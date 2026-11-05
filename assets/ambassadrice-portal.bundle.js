// Aperçu local uniquement. Le build Netlify remplace ce fichier par la connexion privée à Notion.
document.getElementById('portal-gate').textContent = 'Aperçu visuel · données fictives · enregistrement désactivé';
document.getElementById('portal-content').hidden = false;
document.getElementById('referral-rows').innerHTML = '<tr><td>Amina D.</td><td>Johannesburg</td><td>2027-03</td><td>—</td><td><span class="status-pill status-pending">En attente</span></td></tr><tr><td>Léa M.</td><td>Cape Town</td><td>2027-03</td><td>Groupe n°1</td><td><span class="status-pill status-approved">Validée</span></td></tr><tr><td>Sarah B.</td><td>Madagascar · Tuléar</td><td>2027-06</td><td>—</td><td><span class="status-pill status-rejected">Refusée</span></td></tr>';
document.getElementById('referral-form').addEventListener('submit', event => { event.preventDefault(); document.getElementById('referral-feedback').textContent = 'Aperçu visuel : les recommandations ne sont pas encore envoyées.'; });
document.getElementById('logout').addEventListener('click', () => location.assign('ambassadrice.html#connexion'));
