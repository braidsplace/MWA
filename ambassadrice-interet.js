const form = document.getElementById('ambassador-interest-form');
const feedback = document.getElementById('ambassador-interest-feedback');
const submit = form.querySelector('button[type="submit"]');
let reference = crypto.randomUUID();
try {
  reference = sessionStorage.getItem('sisi-ambassador-interest-reference') || reference;
  sessionStorage.setItem('sisi-ambassador-interest-reference', reference);
} catch {}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  if (data.website) return;
  data.consent = data.consent === 'on';
  data.reference = reference;
  submit.disabled = true;
  feedback.textContent = 'Envoi en cours…';
  feedback.className = '';
  try {
    const response = await fetch('/api/ambassadrice-interet', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('unavailable');
    feedback.textContent = 'Merci ! Ta demande est reçue. On te recontacte pour te présenter le programme ambassadrice.';
    feedback.className = 'success';
    form.reset();
    reference = crypto.randomUUID();
    try { sessionStorage.setItem('sisi-ambassador-interest-reference', reference); } catch {}
  } catch {
    feedback.textContent = 'La demande n’a pas été enregistrée. Tes réponses sont conservées : tu peux réessayer.';
    feedback.className = 'error';
  } finally { submit.disabled = false; }
});
