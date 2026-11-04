'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {handler}=require('./api/candidatures');
const root=__dirname;
const port=Number(process.env.PORT||8766);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/candidatures') return handler(req,res);
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
  let pathname;
  try {pathname=url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)}
  catch {res.writeHead(400);return res.end('Adresse invalide')}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||
     /(^|\/)(?:\.|api\/|test\/|server\.js)/.test(pathname)||!mime[path.extname(file)]) {
    res.writeHead(404);return res.end('Introuvable');
  }
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(file).pipe(res);
});
server.listen(port,'127.0.0.1',()=>console.log(`Aperçu Sisi : http://127.0.0.1:${port}/`));
