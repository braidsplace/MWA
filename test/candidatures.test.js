'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {Readable}=require('node:stream');
const {randomUUID}=require('node:crypto');
const {normalize,notionPage,qualification,handler}=require('../api/candidatures');

function candidate(overrides={}) {
  return {reference:randomUUID(),firstName:'Test',lastName:'Sisi',email:'test.sisi@example.invalid',
    whatsapp:'+262 692 123 456',departureCity:'Saint-Denis',departureCountry:'France',
    source:'Instagram',destinations:['Johannesburg'],periods:["Dans l'année"],
    duration:'8 à 10 jours',budget:'1 500 à 2 500 €',motivations:['Me reconnecter à moi'],
    experiences:['Culture et rencontres'],travelStyle:'Équilibré',room:'Chambre individuelle',
    companions:'Seule',qualification:'identified',identifiedTrip:'Johannesburg',marketing:false,...overrides};
}
function request(payload,ip) {
  const req=Readable.from([JSON.stringify(payload)]);
  req.method='POST';req.headers={host:'localhost:8766',origin:'http://localhost:8766','content-type':'application/json','content-length':String(Buffer.byteLength(JSON.stringify(payload)))};
  req.socket={remoteAddress:ip};
  return req;
}
function response() {
  return {status:0,headers:{},body:'',
    writeHead(status,headers){this.status=status;this.headers=headers},
    end(text){this.body=text||''}};
}
test('classe les trois intentions sans mêler le statut commercial',()=>{
  for(const [choice,intention,priority,action] of [
    ['identified','Voyage identifié','Haute','Aucune'],
    ['callback','À rappeler','Haute','Appel téléphonique'],
    ['future','Projet futur','Basse','Aucune']
  ]) {
    const raw=candidate({qualification:choice,identifiedTrip:choice==='identified'?'Johannesburg':'',
      callbackTime:choice==='callback'?'En semaine, le matin':'',futurePeriod:choice==='future'?'2028':''});
    const page=notionPage(normalize(raw));
    assert.equal(page.properties.Intention.select.name,intention);
    assert.equal(page.properties.Priorité.select.name,priority);
    assert.equal(page.properties.Action.select.name,action);
    assert.equal(page.properties['Suivi commercial'].status.name,'Nouveau');
  }
});
test('rejette une candidature incomplète côté serveur',()=>{
  assert.throws(()=>normalize(candidate({email:'incorrect'})));
  assert.throws(()=>normalize(candidate({destinations:[]})));
  assert.throws(()=>normalize(candidate({qualification:'callback',identifiedTrip:'',callbackTime:''})));
});
test('une nouvelle tentative avec la même référence retrouve la fiche Notion',async()=>{
  const token=process.env.NOTION_API_KEY;
  const originalFetch=global.fetch;
  process.env.NOTION_API_KEY='test-token';
  let savedReference=null;
  let creates=0;
  global.fetch=async(url,options)=>{
    const body=JSON.parse(options.body);
    if(String(url).includes('/query')) return {ok:true,json:async()=>({results:savedReference===body.filter.rich_text.equals?[{id:'page-test'}]:[]})};
    if(String(url).endsWith('/pages')) {creates++;savedReference=body.properties['Référence soumission'].rich_text[0].text.content;return {ok:true,json:async()=>({id:'page-test'})}};
    throw new Error('unexpected URL');
  };
  try {
    const payload=candidate();
    const first=response();await handler(request(payload,'test-1'),first);
    const second=response();await handler(request(payload,'test-2'),second);
    assert.equal(first.status,200);assert.equal(second.status,200);
    assert.equal(JSON.parse(second.body).saved,true);
    assert.equal(creates,1);
  } finally {global.fetch=originalFetch;if(token===undefined)delete process.env.NOTION_API_KEY;else process.env.NOTION_API_KEY=token}
});
