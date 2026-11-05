'use strict';

const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID || 'a0bb33cf-eced-481e-bb0d-a3a83f70364e';
const NOTION_VERSION = '2026-03-11';
const REQUEST_LIMIT = 20_000;
const recent = new Map();
const inFlight = new Map();
const destinationValues = new Set(['Johannesburg','Cape Town','Tuléar','Hoedspruit','Tanzanie','Je suis ouverte']);
const options={
  ageRange:new Set(['','18–25 ans','26–35 ans','36–45 ans','46–55 ans','56 ans et plus']),
  source:new Set(['Instagram','LinkedIn','Une amie / le bouche-à-oreille','Recherche internet','Un événement','Autre']),
  periods:new Set(['Dans les 3 mois','Dans les 6 mois',"Dans l'année",'Plus tard / flexible']),
  duration:new Set(['5 à 7 jours','8 à 10 jours','11 à 14 jours','Je suis flexible']),
  budget:new Set(['Moins de 1 500 €','1 500 à 2 500 €','2 500 à 3 500 €','Plus de 3 500 €','À discuter']),
  motivations:new Set(['Me reconnecter à moi',"Rencontrer d'autres femmes","Découvrir l'Afrique autrement","Trouver de l'inspiration"]),
  experiences:new Set(['Culture et rencontres','Nature et aventure','Bien-être et ateliers','Gastronomie, beauté et lifestyle']),
  travelStyle:new Set(['Doux et contemplatif','Équilibré','Actif et curieux']),
  room:new Set(['Chambre individuelle','Chambre partagée si possible','À voir selon le tarif']),
  companions:new Set(['Seule','Accompagnée','Je ne sais pas encore']),
  callbackTime:new Set(['','En semaine, le matin',"En semaine, l'après-midi",'En semaine, le soir','Le week-end'])
};
const qualification = {
  identified:{intention:'Voyage identifié',priority:'Haute',action:'Aucune'},
  callback:{intention:'À rappeler',priority:'Haute',action:'Appel téléphonique'},
  future:{intention:'Projet futur',priority:'Basse',action:'Aucune'}
};
function text(v,max=200) {return typeof v==='string'?v.trim().slice(0,max):''}
function list(v,allowed) {return Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&x.length<100&&(!allowed||allowed.has(x))))].slice(0,12):[]}
function validPhone(v) {return /^[+\d\s().-]{7,30}$/.test(v)&&v.replace(/\D/g,'').length>=7}
function normalize(raw) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw)) throw new Error('invalid');
  const p={
    reference:text(raw.reference,60),firstName:text(raw.firstName,80),lastName:text(raw.lastName,80),
    email:text(raw.email,254).toLowerCase(),whatsapp:text(raw.whatsapp,30),
    departureCity:text(raw.departureCity,100),departureCountry:text(raw.departureCountry,100),
    ageRange:text(raw.ageRange,50),source:text(raw.source,80),
    destinations:list(raw.destinations,destinationValues),periods:list(raw.periods,options.periods),
    duration:text(raw.duration,80),budget:text(raw.budget,80),
    motivations:list(raw.motivations,options.motivations),experiences:list(raw.experiences,options.experiences),
    travelStyle:text(raw.travelStyle,80),room:text(raw.room,80),
    companions:text(raw.companions,80),qualification:text(raw.qualification,20),
    identifiedTrip:text(raw.identifiedTrip,150),callbackTime:text(raw.callbackTime,80),
    callbackPhone:text(raw.callbackPhone,30),futurePeriod:text(raw.futurePeriod,120),
    marketing:raw.marketing===true,website:text(raw.website,100)
  };
  if(p.website) throw new Error('spam');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.reference)) throw new Error('invalid');
  if(!p.firstName||!p.lastName||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)||!validPhone(p.whatsapp)||!p.departureCity||!p.departureCountry||!p.source) throw new Error('invalid');
  for(const name of ['ageRange','source','duration','budget','travelStyle','room','companions','callbackTime']) if(!options[name].has(p[name])) throw new Error('invalid');
  if(!p.destinations.length||!p.periods.length||!p.duration||!p.budget||!p.motivations.length||!p.experiences.length||!p.travelStyle||!p.room||!p.companions||!qualification[p.qualification]) throw new Error('invalid');
  if(p.qualification==='identified'&&!p.identifiedTrip) throw new Error('invalid');
  if(p.qualification==='callback'&&(!p.callbackTime||!validPhone(p.callbackPhone||p.whatsapp))) throw new Error('invalid');
  if(p.qualification!=='identified')p.identifiedTrip='';
  if(p.qualification!=='callback'){p.callbackTime='';p.callbackPhone=''}
  if(p.qualification!=='future')p.futurePeriod='';
  return p;
}
function originAllowed(req) {
  const origin=req.headers.origin;
  if(!origin) return true;
  try {
    const host=new URL(origin).host;
    return host===req.headers.host;
  } catch {return false}
}
function allowRate(req) {
  const now=Date.now();
  const ip=req.socket?.remoteAddress||'unknown';
  const row=recent.get(ip)||[];
  const live=row.filter(t=>now-t<600_000);
  live.push(now);
  recent.set(ip,live);
  if(recent.size>5_000) for(const [key,times] of recent) if(times.at(-1)<now-600_000) recent.delete(key);
  return live.length<=12;
}
function json(res,status,body) {
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(body));
}
function notionHeaders() {
  return {'Authorization':`Bearer ${process.env.NOTION_API_KEY}`,'Notion-Version':NOTION_VERSION,'Content-Type':'application/json'};
}
async function notionRequest(path,body) {
  const response=await fetch(`https://api.notion.com/v1${path}`,{
    method:'POST',headers:notionHeaders(),body:JSON.stringify(body),signal:AbortSignal.timeout(12_000)
  });
  if(!response.ok) {
    // Do not log response body: Notion errors can echo user-supplied values.
    const error=new Error('notion_unavailable');
    error.status=response.status;
    throw error;
  }
  return response.json();
}
async function findReference(reference) {
  const result=await notionRequest(`/data_sources/${DATA_SOURCE_ID}/query`,{
    filter:{property:'Référence soumission',rich_text:{equals:reference}},page_size:1
  });
  return result.results?.[0]?.id||null;
}
function rich(v) {return {rich_text:[{text:{content:v||'—'}}]}}
function paragraph(label,v) {
  return {object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:`${label} : ${v||'—'}`}}]}};
}
function notionPage(p) {
  const q=qualification[p.qualification];
  const destinationOptions=p.destinations.filter(x=>x!=='Je suis ouverte').map(name=>({name}));
  const props={
    'Candidature':{title:[{text:{content:`${p.firstName} ${p.lastName}`}}]},
    'Prénom':rich(p.firstName),'Nom':rich(p.lastName),'Email':{email:p.email},
    'WhatsApp':{phone_number:p.whatsapp},'Départ':rich(`${p.departureCity}, ${p.departureCountry}`),
    'Destinations':{multi_select:destinationOptions},'Intention':{select:{name:q.intention}},
    'Priorité':{select:{name:q.priority}},'Action':{select:{name:q.action}},
    'Suivi commercial':{status:{name:'Nouveau'}},
    'Voyage repéré':rich(p.identifiedTrip),'Consentement marketing':{checkbox:p.marketing},
    'Référence soumission':rich(p.reference)
  };
  if(p.callbackPhone||p.qualification==='callback')props['Téléphone rappel']={phone_number:p.callbackPhone||p.whatsapp};
  const sections=[
    ['Coordonnées',[
      ['Prénom et nom',`${p.firstName} ${p.lastName}`],['Email',p.email],['WhatsApp',p.whatsapp],
      ['Ville et pays de départ',`${p.departureCity}, ${p.departureCountry}`],["Tranche d'âge",p.ageRange],
      ['Découverte de Sisi',p.source]
    ]],
    ['Ton voyage',[
      ['Destinations',p.destinations.join(', ')],['Périodes',p.periods.join(', ')],
      ['Durée',p.duration],['Budget hors vol international',p.budget]
    ]],
    ['Ta façon de voyager',[
      ['Motivations',p.motivations.join(', ')],['Expériences',p.experiences.join(', ')],
      ['Rythme',p.travelStyle],['Hébergement',p.room]
    ]],
    ['Ton projet',[
      ['Voyage seule ou accompagnée',p.companions],['Qualification',q.intention],
      ['Voyage repéré',p.identifiedTrip],['Moment pour être rappelée',p.callbackTime],
      ['Numéro pour rappel',p.callbackPhone||p.whatsapp],['Période future',p.futurePeriod],
      ['Consentement marketing',p.marketing?'Oui':'Non']
    ]]
  ];
  const children=[];
  for(const [title,rows] of sections) {
    children.push({object:'block',type:'heading_2',heading_2:{rich_text:[{text:{content:title}}]}});
    children.push(...rows.map(([label,v])=>paragraph(label,v)));
  }
  children.push(paragraph('Date d’inscription',new Date().toISOString()));
  return {parent:{type:'data_source_id',data_source_id:DATA_SOURCE_ID},properties:props,children};
}
async function createOrFind(p) {
  const existing=await findReference(p.reference);
  if(existing) return existing;
  try {
    const page=await notionRequest('/pages',notionPage(p));
    return page.id;
  } catch(error) {
    // A timed-out write may have succeeded. Query before reporting a retryable failure.
    try {const found=await findReference(p.reference);if(found)return found} catch {}
    throw error;
  }
}
async function handler(req,res) {
  if(req.method!=='POST') return json(res,405,{saved:false});
  if(!originAllowed(req)) return json(res,403,{saved:false});
  if(!String(req.headers['content-type']||'').startsWith('application/json')) return json(res,415,{saved:false});
  if(!allowRate(req)) return json(res,429,{saved:false,message:'Réessaie dans quelques minutes.'});
  if(!process.env.NOTION_API_KEY) return json(res,503,{saved:false,message:'Connexion Notion non configurée.'});
  if(Number(req.headers['content-length']||0)>REQUEST_LIMIT) return json(res,413,{saved:false});
  let body='';
  try {
    for await(const chunk of req) {
      body+=chunk;
      if(Buffer.byteLength(body)>REQUEST_LIMIT) return json(res,413,{saved:false});
    }
    const p=normalize(JSON.parse(body));
    let job=inFlight.get(p.reference);
    if(!job) {
      job=createOrFind(p).finally(()=>inFlight.delete(p.reference));
      inFlight.set(p.reference,job);
    }
    await job;
    return json(res,200,{saved:true});
  } catch(error) {
    if(error.message==='invalid'||error instanceof SyntaxError) return json(res,400,{saved:false,message:'Vérifie les champs du formulaire.'});
    if(error.message==='spam') return json(res,400,{saved:false});
    // No names, contact details, answers or request bodies in logs.
    console.error('Candidature Notion : échec technique',error.status||error.code||'network');
    return json(res,503,{saved:false,message:'Enregistrement indisponible. Réessaie sans quitter cette page.'});
  }
}
module.exports=handler;
module.exports.handler=handler;
module.exports.normalize=normalize;
module.exports.notionPage=notionPage;
module.exports.qualification=qualification;
