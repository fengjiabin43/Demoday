import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();const results=[];
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.waitForFunction(async()=>{const keys=await (await caches.open('glint-content-v2')).keys();return keys.some(k=>k.url.endsWith('V03.mp4'))&&keys.some(k=>k.url.includes('/assets/')&&k.url.endsWith('.js'));},{},{timeout:30000});
 await page.getByRole('button',{name:'先体验一下'}).click();await page.getByRole('button',{name:'播放动画',exact:true}).click();await page.waitForFunction(()=>document.querySelector('video').currentTime>2);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('glint.learning.v1')).activity);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('video')).toHaveJSProperty('paused',true);await page.waitForTimeout(2600);const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('glint.learning.v1')).activity);expect(after).toEqual(before);
 results.push('A14: visibilitychange pauses the player and stops foreground time accumulation');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{level:1})).toContainText('说得像专家');await page.waitForFunction(()=>document.querySelector('video')?.readyState>=1);await page.getByRole('button',{name:'从上次继续',exact:true}).click();await page.waitForFunction(()=>document.querySelector('video').currentTime>4);await page.locator('video').evaluate(v=>v.pause());
 results.push('A13/offline: production app shell and cached MP4 reload and continue offline');
 await page.goto('http://127.0.0.1:4173/#challenge/Q03');await page.getByRole('radio').nth(2).click();await page.getByRole('button',{name:'提交判断'}).click();await expect(page.getByRole('heading',{name:'这次判断，通过了。'})).toBeVisible();
 results.push('A13/offline: standard questions, evidence and rewards save without a network');
 await context.setOffline(false);
 await page.goto('http://127.0.0.1:4173/#lesson/V02');await page.route('**/media/V02.mp4',r=>r.abort());
 // Use a fresh context without the media cache to check the uncached failure state.
 const fresh=await browser.newContext();await fresh.route('**/media/V02.mp4',r=>r.abort());const fail=await fresh.newPage();await fail.goto('http://127.0.0.1:4173/#lesson/V02');await expect(fail.getByRole('heading',{name:'视频暂时无法播放'})).toBeVisible();await expect(fail.getByRole('button',{name:'重试视频'})).toBeVisible();await expect(fail.getByRole('heading',{name:'完整图文解释'})).toBeVisible();await fail.getByRole('button',{name:'我已读完图文解释'}).click();const events=await fail.evaluate(()=>JSON.parse(localStorage.getItem('glint.learning.v1')).events);expect(events.some(e=>e.kind==='reading')).toBe(true);expect(events.some(e=>e.kind==='video')).toBe(false);await fresh.close();
 results.push('A13/video failure: retry and full reading fallback appear; reading is never counted as a video');
 console.log(results.map(r=>'PASS '+r).join('\n'));await writeFile('test-results/resilience-results.json',JSON.stringify(results,null,2));
}catch(e){await page.screenshot({path:'test-results/resilience-failure.png',fullPage:true});console.error(e);process.exitCode=1;}finally{await browser.close();}
