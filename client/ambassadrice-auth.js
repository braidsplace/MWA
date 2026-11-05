import { login, getUser, requestPasswordRecovery, handleAuthCallback, updateUser, acceptInvite } from '@netlify/identity';

const $ = id => document.getElementById(id);
const feedback = $('auth-feedback');
let invitationToken = null;
function message(text, type = '') { feedback.textContent = text; feedback.className = `auth-feedback ${type}`; }
function busy(form, value) { form.querySelector('button[type=submit]').disabled = value; }
function show(which) {
  for (const id of ['ambassador-login', 'ambassador-recovery', 'ambassador-reset', 'ambassador-invite']) $(id).hidden = id !== which;
  $('show-recovery').hidden = which !== 'ambassador-login';
  message('');
}

try {
  const callback = await handleAuthCallback();
  if (callback?.type === 'invite' && callback.token) { invitationToken = callback.token; show('ambassador-invite'); }
  else if (callback?.type === 'recovery') show('ambassador-reset');
  else if (await getUser()) window.location.replace('portail-ambassadrice.html');
} catch { message('La connexion est momentanément indisponible. Réessaie plus tard.', 'error'); }

$('show-recovery').addEventListener('click', () => show('ambassador-recovery'));
$('back-login').addEventListener('click', () => show('ambassador-login'));
document.querySelector('.password-visibility')?.addEventListener('click', event => {
  const input = $('ambassador-password');
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  event.currentTarget.textContent = visible ? 'Masquer' : 'Voir';
  event.currentTarget.setAttribute('aria-label', visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  event.currentTarget.setAttribute('aria-pressed', String(visible));
});
$('ambassador-login').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; busy(form, true); message('Connexion en cours…');
  try { const d = new FormData(form); await login(String(d.get('email')).trim(), String(d.get('password'))); window.location.assign('portail-ambassadrice.html'); }
  catch { message('Connexion impossible. Vérifie ton adresse et ton mot de passe.', 'error'); busy(form, false); }
});
$('ambassador-recovery').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; busy(form, true);
  try { await requestPasswordRecovery(String(new FormData(form).get('email')).trim()); message('Si cette adresse possède un accès, un email de réinitialisation vient d’être envoyé.', 'success'); }
  catch { message('L’envoi n’a pas abouti. Réessaie dans quelques instants.', 'error'); }
  finally { busy(form, false); }
});
$('ambassador-reset').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; busy(form, true);
  try { await updateUser({ password: String(new FormData(form).get('password')) }); message('Mot de passe enregistré. Tu peux accéder à ton espace.', 'success'); setTimeout(() => window.location.assign('portail-ambassadrice.html'), 900); }
  catch { message('Ce lien a peut-être expiré. Demande un nouveau lien.', 'error'); busy(form, false); }
});
$('ambassador-invite').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; busy(form, true);
  try { await acceptInvite(invitationToken, String(new FormData(form).get('password'))); window.location.assign('portail-ambassadrice.html'); }
  catch { message('L’invitation a peut-être expirée. Contacte Made With Africa.', 'error'); busy(form, false); }
});
