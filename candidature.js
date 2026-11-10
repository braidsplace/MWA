(() => {
  const form = document.querySelector('#application-form');
  if (!form) return;
  const steps = [...form.querySelectorAll('.form-step')];
  const markers = [...document.querySelectorAll('.stepper li')];
  const back = document.querySelector('#back-button');
  const next = document.querySelector('#next-button');
  const submit = document.querySelector('#submit-button');
  const error = document.querySelector('#form-error');
  const progress = document.querySelector('.progress-track');
  let current = 0;
  let sending = false;
  let reference = crypto.randomUUID();

  function checked(name) {
    return [...form.querySelectorAll(`[name="${name}"]:checked`)].map(input => input.value);
  }
  function value(name) {
    return form.elements.namedItem(name)?.value?.trim() || '';
  }
  function showError(message, element) {
    error.textContent = message;
    error.hidden = false;
    if (element) {
      element.setAttribute('aria-invalid', 'true');
      element.focus({preventScroll:true});
    }
    error.scrollIntoView({block:'nearest', behavior:'smooth'});
    return false;
  }
  function clearError() {
    error.hidden = true;
    error.textContent = '';
    form.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
  }
  function first(name) {
    return form.querySelector(`[name="${name}"]`);
  }
  function requiredField(name, label) {
    const field = first(name);
    if (!field?.checkValidity() || !field.value.trim()) return showError(`Merci de renseigner « ${label} ».`, field);
    return true;
  }
  function requiredChoice(name, label) {
    if (!checked(name).length) return showError(`Choisis au moins une réponse pour « ${label} ».`, first(name));
    return true;
  }
  function validStep(index) {
    clearError();
    if (index === 0) {
      for (const [name,label] of [['firstName','Prénom'],['lastName','Nom'],['email','Email'],['whatsapp','WhatsApp'],['departureCity','Ville de départ'],['departureCountry','Pays de départ'],['source','Comment as-tu découvert Sisi ?']]) {
        if (!requiredField(name,label)) return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'))) return showError('Saisis une adresse email valide.', first('email'));
      if (value('whatsapp').replace(/\D/g,'').length < 7) return showError('Saisis un numéro WhatsApp valide.', first('whatsapp'));
    }
    if (index === 1) {
      if (!requiredChoice('destinations','Destinations souhaitées')) return false;
      if (!checked('periods').length && !value('departureDate')) return showError('Choisis une période ou un départ précis.', first('periods'));
      if (!requiredField('duration','Durée idéale')) return false;
      if (!requiredField('budget','Budget envisagé')) return false;
    }
    if (index === 2) {
      for (const [name,label] of [['motivations','Motivations'],['experiences','Expériences recherchées'],['travelStyle','Rythme de voyage'],['room','Chambre']]) {
        if (!requiredChoice(name,label)) return false;
      }
    }
    if (index === 3) {
      if (!requiredChoice('companions','Tu envisages de voyager')) return false;
      if (!requiredChoice('qualification','Où en es-tu dans ton projet ?')) return false;
      const q = value('qualification');
      if (q === 'identified' && !requiredField('identifiedTrip','Voyage repéré')) return false;
      if (q === 'callback' && !requiredField('callbackTime','Moment pour te rappeler')) return false;
      if (q === 'callback' && !value('callbackPhone') && !value('whatsapp')) return showError('Indique un numéro de téléphone pour être rappelée.', first('callbackPhone'));
      if (q === 'callback' && value('callbackPhone') && value('callbackPhone').replace(/\D/g,'').length < 7) return showError('Saisis un numéro pour l’appel valide.', first('callbackPhone'));
    }
    return true;
  }
  function data() {
    return {
      reference,
      firstName:value('firstName'), lastName:value('lastName'), email:value('email'),
      whatsapp:value('whatsapp'), departureCity:value('departureCity'),
      departureCountry:value('departureCountry'), ageRange:value('ageRange'),
      source:value('source'), destinations:checked('destinations'), periods:checked('periods'), departureDate:value('departureDate'),
      duration:value('duration'), budget:value('budget'), motivations:checked('motivations'),
      experiences:checked('experiences'), travelStyle:value('travelStyle'), room:value('room'),
      companions:value('companions'), qualification:value('qualification'),
      identifiedTrip:value('qualification')==='identified'?value('identifiedTrip'):'',
      callbackTime:value('qualification')==='callback'?value('callbackTime'):'',
      callbackPhone:value('qualification')==='callback'?value('callbackPhone'):'',
      futurePeriod:value('qualification')==='future'?value('futurePeriod'):'',
      marketing:first('marketing').checked,
      website:''
    };
  }
  function summary() {
    const d = data();
    const groups = [
      ['Faisons connaissance', [['Nom',`${d.firstName} ${d.lastName}`],['Email',d.email],['WhatsApp',d.whatsapp],['Départ',`${d.departureCity}, ${d.departureCountry}`],["Tranche d'âge",d.ageRange],['Sisi découverte via',d.source]]],
      ['Ton voyage', [['Destinations',d.destinations.join(', ')],['Départ choisi',d.departureDate?first('departureDate').selectedOptions[0]?.textContent:''],['Période',d.periods.join(', ')],['Durée',d.duration],['Budget hors vol international',d.budget]]],
      ['Ta façon de voyager', [['Motivations',d.motivations.join(', ')],['Expériences',d.experiences.join(', ')],['Rythme',d.travelStyle],['Chambre',d.room]]],
      ['Ton projet', [['Voyage',d.companions],['Avancement', {identified:"Voyage identifié",callback:"Besoin d'informations",future:"Projet dans plus d'un an"}[d.qualification]],['Voyage repéré',d.identifiedTrip],['Rappel',d.callbackTime],["Numéro pour l'appel",d.callbackPhone||d.whatsapp],['Période future',d.futurePeriod]]]
    ];
    const root = document.querySelector('#application-summary');
    root.replaceChildren();
    for (const [heading,rows] of groups) {
      const section=document.createElement('section');
      section.className='summary-group';
      const h=document.createElement('h3');h.textContent=heading;section.append(h);
      for (const [label,text] of rows) {
        if (!text) continue;
        const p=document.createElement('p');
        const strong=document.createElement('strong');strong.textContent=`${label} : `;
        p.append(strong,document.createTextNode(text));section.append(p);
      }
      root.append(section);
    }
  }
  function go(index) {
    current=index;
    clearError();
    steps.forEach((step,i)=>{step.hidden=i!==index;step.classList.toggle('is-active',i===index)});
    markers.forEach((marker,i)=>{
      marker.classList.toggle('is-current',i===index);
      marker.classList.toggle('is-done',i<index);
      marker.tabIndex=i<index?0:-1;
      marker.setAttribute('aria-label',i<index?`Revenir à l'étape ${i+1} : ${marker.querySelector('small').textContent}`:`Étape ${i+1} : ${marker.querySelector('small').textContent}`);
      if (i===index) marker.setAttribute('aria-current','step');
      else marker.removeAttribute('aria-current');
    });
    progress.setAttribute('aria-valuenow',String(index+1));
    document.querySelector('#progress-fill').style.width=`${(index+1)*20}%`;
    document.querySelector('#step-count').textContent=`ÉTAPE ${index+1} / 5`;
    back.disabled=index===0;
    next.hidden=index===4;
    submit.hidden=index!==4;
    if (index===4) summary();
    document.querySelector('.application-main').scrollIntoView({block:'start',behavior:'smooth'});
  }
  form.querySelectorAll('[name="qualification"]').forEach(input=>input.addEventListener('change',()=>{
    document.querySelectorAll('[data-condition]').forEach(panel=>{panel.hidden=panel.dataset.condition!==input.value});
    clearError();
  }));
  const tripsFromLinks={johannesburg:'Johannesburg','cape-town':'Cape Town',tulear:'Tuléar',hoedspruit:'Hoedspruit',tanzanie:'Tanzanie',benin:'Bénin'};
  const params=new URLSearchParams(location.search);
  const linkedTrip=tripsFromLinks[params.get('voyage')];
  const departureDate=first('departureDate');
  const dateField=document.querySelector('#departure-date-field');
  const datedTrips=new Set(['Johannesburg','Cape Town','Hoedspruit']);
  function updateDateField(){
    const chosen=checked('destinations');
    dateField.hidden=!chosen.some(name=>datedTrips.has(name));
    [...departureDate.options].forEach(option=>{
      if(!option.value) return;
      option.hidden=!option.dataset.destinations.split(',').some(name=>chosen.includes(name));
      option.disabled=option.hidden;
    });
    if(dateField.hidden || departureDate.selectedOptions[0]?.disabled) departureDate.value='';
  }
  form.querySelectorAll('[name="destinations"]').forEach(input=>input.addEventListener('change',updateDateField));
  if(linkedTrip){
    const destination=[...form.querySelectorAll('[name="destinations"]')].find(input=>input.value===linkedTrip);
    if(destination) destination.checked=true;
    const identified=form.querySelector('[name="qualification"][value="identified"]');
    if(identified){identified.checked=true;identified.dispatchEvent(new Event('change',{bubbles:true}))}
    const tripField=first('identifiedTrip');
    if(tripField) tripField.value=linkedTrip;
  }
  updateDateField();
  if(!dateField.hidden && [...departureDate.options].some(option=>option.value===params.get('date'))) departureDate.value=params.get('date');
  form.addEventListener('input',clearError);
  form.addEventListener('change',clearError);
  markers.forEach((marker,i)=>{
    marker.addEventListener('click',()=>{if(i<current)go(i)});
    marker.addEventListener('keydown',event=>{
      if(i<current&&(event.key==='Enter'||event.key===' ')){event.preventDefault();go(i)}
    });
  });
  next.addEventListener('click',()=>{if(validStep(current))go(current+1)});
  back.addEventListener('click',()=>{if(current>0)go(current-1)});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(sending) return;
    for(let i=0;i<4;i++) if(!validStep(i)){go(i);validStep(i);return}
    clearError();
    sending=true;
    submit.disabled=true;
    submit.textContent='Enregistrement en cours…';
    try {
      const response=await fetch('/api/candidatures',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data())});
      if (!response.ok) throw new Error('save_failed');
      const result=await response.json();
      if (!result.saved) throw new Error('save_failed');
      form.hidden=true;
      document.querySelector('.stepper').hidden=true;
      document.querySelector('.progress-track').hidden=true;
      document.querySelector('.application-intro').hidden=true;
      document.querySelector('#application-success').hidden=false;
      document.querySelector('.application-main').scrollIntoView({block:'start',behavior:'smooth'});
    } catch {
      showError("L'enregistrement n'a pas abouti. Tes réponses sont conservées ici : réessaie dans un instant.");
    } finally {
      sending=false;
      submit.disabled=false;
      submit.innerHTML='Rejoindre l\'aventure Sisi <span aria-hidden="true">↗︎</span>';
    }
  });
  go(0);
})();
