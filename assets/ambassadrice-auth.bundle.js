// Aperçu local. Le build Netlify remplace ce fichier par le vrai module d'authentification.
const feedback = document.getElementById('auth-feedback');
function preview(event) { event.preventDefault(); feedback.textContent = 'Aperçu visuel : la connexion et les emails seront actifs après configuration de l’espace privé.'; feedback.className = 'auth-feedback'; }
for (const form of document.querySelectorAll('form')) form.addEventListener('submit', preview);
document.getElementById('show-recovery').addEventListener('click', () => { document.getElementById('ambassador-login').hidden = true; document.getElementById('show-recovery').hidden = true; document.getElementById('ambassador-recovery').hidden = false; feedback.textContent = ''; });
document.getElementById('back-login').addEventListener('click', () => { document.getElementById('ambassador-login').hidden = false; document.getElementById('show-recovery').hidden = false; document.getElementById('ambassador-recovery').hidden = true; feedback.textContent = ''; });
document.querySelector('.password-visibility')?.addEventListener('click', event => { const input = document.getElementById('ambassador-password'); const visible = input.type === 'password'; input.type = visible ? 'text' : 'password'; event.currentTarget.textContent = visible ? 'Masquer' : 'Voir'; event.currentTarget.setAttribute('aria-pressed', String(visible)); });
