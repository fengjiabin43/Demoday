import './build.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=Number(process.env.ADMIN_DEMO_PORT||5180);
createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=resolve(root,pathname==='/'?'index.html':'.'+pathname);if(!target.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);return res.end();}const data=await readFile(target);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[extname(target)]||'application/octet-stream'),'Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`识光 Insight 独立后台：http://127.0.0.1:${port}/`));
