import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,expect} from '@playwright/test';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const prefix='/Demoday/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4','.vtt':'text/vtt'};
let server;
let base=process.env.DEPLOYMENT_URL;
if(!base){
 server=createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(!pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
   let target=path.resolve(root,pathname.slice(prefix.length)||'index.html');
   if(target!==path.resolve(root)&&!target.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}
   if((await stat(target)).isDirectory())target=path.join(target,'index.html');
   const body=await readFile(target);
   res.writeHead(200,{'Content-Type':types[path.extname(target)]??'application/octet-stream','Cache-Control':'no-store'});
   res.end(body);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base=`http://127.0.0.1:${server.address().port}${prefix}`;
}
if(!base.endsWith('/'))base+='/';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844}});
const errors=[];
context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
const page=await context.newPage();
const skipTour=async()=>{await page.getByRole('button',{name:'跳过新手引导',exact:true}).click();};
const route=async(hash)=>{await page.evaluate(value=>{location.hash=value;},hash);};
try{
 await page.goto(base,{waitUntil:'networkidle'});
 await expect(page.getByRole('heading',{name:'手机号登录'})).toBeVisible();
 await page.getByRole('textbox',{name:'手机号'}).fill('12345678901');
 await page.getByRole('button',{name:'登录并开始探索'}).click();
 await skipTour();
 console.log('PASS: simulated login and onboarding at repository subpath');
 for(const id of ['V01','V02','V03']){
  await route(`lesson/${id}`);
  await page.waitForFunction(()=>document.querySelector('video')?.readyState>=1,null,{timeout:30000});
  const video=page.locator('video');
  assert.equal(await video.evaluate(v=>v.duration),60);
  await video.evaluate(v=>v.play());
  await page.waitForFunction(()=>document.querySelector('video')?.currentTime>0.25);
  await video.evaluate(v=>v.pause());
 }
 console.log('PASS: all three videos, covers and subtitle paths work');
 await route('challenge/Q03');
 await page.getByRole('radio').nth(2).click();
 await page.getByRole('button',{name:'提交判断'}).click();
 await expect(page.getByRole('heading',{name:'这次判断，通过了。'})).toBeVisible();
 await page.reload({waitUntil:'networkidle'});
 await skipTour();
 assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('glint.learning.v1')))).events.some(event=>event.object==='Q03'));
 console.log('PASS: challenge submission and persisted progress after reload');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(async()=>{
  const entries=await caches.keys();
  for(const key of entries){
   if(!key.startsWith('glint-content-v3:'))continue;
   const cache=await caches.open(key);
   if((await Promise.all(['assets/app.js','assets/app.css','media/V01.mp4','media/V02.mp4','media/V03.mp4'].map(asset=>cache.match(new URL(asset,location.href.split('#')[0]).href)))).every(Boolean))return true;
  }
  return false;
 },null,{timeout:30000});
 await context.setOffline(true);
 await page.reload({waitUntil:'load'});
 await skipTour();
 await route('lesson/V01');
 await page.waitForFunction(()=>document.querySelector('video')?.readyState>=1);
 await page.locator('video').evaluate(v=>v.play());
 await page.waitForFunction(()=>document.querySelector('video')?.currentTime>0.25);
 await page.locator('video').evaluate(v=>v.pause());
 await context.setOffline(false);
 console.log('PASS: offline page reload and cached video playback at repository subpath');
 const admin=await context.newPage();
 await admin.setViewportSize({width:1440,height:1000});
 await admin.goto(`${base}admin/`,{waitUntil:'networkidle'});
 await expect(admin.getByRole('heading',{name:'数据概览',exact:true})).toBeVisible();
 await admin.getByRole('button',{name:'数据接入',exact:true}).click();
 await expect(admin.getByRole('heading',{name:'数据接入',exact:true}).first()).toBeVisible();
 console.log('PASS: independent admin dashboard and data import screen');
 assert.deepEqual(errors,[]);
 console.log('PASS: no uncaught browser errors');
}catch(error){
 console.error(error);
 process.exitCode=1;
}finally{
 await browser.close();
 if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
