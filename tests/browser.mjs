import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:5173';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[];const results=[];
page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('glint.learning.v1')));
const route=async path=>{await page.goto(`${base}/#${path}`);await page.locator('main h1').first().waitFor();};
const note=message=>{results.push(message);console.log('PASS',message);};
try{
 await page.goto(base);await expect(page.getByRole('heading',{level:1})).toContainText('让每一点好奇');
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 await page.getByRole('button',{name:'先体验一下'}).click();
 await page.locator('video').waitFor();await expect(page.getByRole('button',{name:'播放动画',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'播放动画',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('video').currentTime>4);
 await page.evaluate(()=>document.querySelector('video').pause());
 const saved=(await state()).playback.V01.position;
 await page.reload();await page.waitForFunction(()=>document.querySelector('video')?.readyState>=1);
 const restored=await page.locator('video').evaluate(v=>v.currentTime);
 expect(Math.abs(saved-restored)).toBeLessThan(3);note('A01/A02/A03: skip onboarding plays a real MP4; playback survives reload within 3 seconds');
 await page.locator('video').evaluate(v=>{v.currentTime=59;});await page.waitForTimeout(600);
 expect((await state()).events.filter(e=>e.kind==='video').length).toBe(0);
 const videoProgress=(await state()).playback.V01;expect(videoProgress.ranges.reduce((a,[x,y])=>a+y-x,0)).toBeLessThan(15);
 note('A04: seeking to the end does not mark full viewing or understanding');
 await page.locator('video').evaluate(async v=>{v.currentTime=0;v.playbackRate=8;await v.play();});
 await page.waitForFunction(()=>document.querySelector('video')?.ended,{},{timeout:20000});
 await expect(page.getByText('这一分钟的发现',{exact:true})).toBeVisible();
 expect((await state()).events.some(e=>e.kind==='video'&&e.object==='V01')).toBe(true);
 expect((await state()).agent.xp).toBe(0);note('A02/A04: actual playback reaches coverage threshold, writes exposure only, grants no XP');
 await route('challenge/Q01');await page.getByRole('radio',{name:'B 核对材料'}).click();await page.reload();
 await expect(page.getByRole('radio',{name:'B 核对材料'})).toHaveAttribute('aria-checked','true');
 await page.getByRole('button',{name:'查看一层提示'}).click();await page.getByRole('button',{name:'提交判断'}).click();
 await expect(page.getByRole('heading',{name:'这次判断，通过了。'})).toBeVisible();
 expect((await state()).events.find(e=>e.object==='Q01').guided).toBe(true);
 expect((await state()).agent.xp).toBe(20);note('A03/A05/A09: question draft restores; guided evidence and explanation save correctly');
 const checks=[['Q03',2],['Q04',3],['Q07',1],['Q08',2],['Q11',1],['Q12',2]];
 for(const [id,answer]of checks){await route(`challenge/${id}`);await page.getByRole('radio').nth(answer).click();await page.getByRole('button',{name:'提交判断'}).click();await expect(page.getByRole('heading',{name:'这次判断，通过了。'})).toBeVisible();}
 expect((await state()).agent.xp).toBe(260);expect((await state()).agent.unlocked).toEqual([1,2,3,4]);
 await route('challenge/Q03');await page.getByRole('radio').nth(2).click();await page.getByRole('button',{name:'提交判断'}).click();expect((await state()).agent.xp).toBe(260);note('A06/A07: all chapter checks unlock four stages; repeating questions gives no additional XP');
 await route('learn');await page.getByRole('button',{name:'领养我的搭子',exact:true}).click();
 await page.getByRole('textbox',{name:'给搭子起个名字'}).fill('小芽');await page.getByRole('radio',{name:/解决工作问题/}).check();
 await page.getByRole('button',{name:'领养并开始'}).click();await page.reload();expect((await state()).profile.name).toBe('小芽');expect((await state()).profile.goal).toBe(1);note('A01/A08: adoption, naming and work route persist after reload');
 await route('workbench');await page.getByRole('button',{name:'用于我的工作'}).click();await page.getByRole('button',{name:'使用示例'}).click();
 await page.getByRole('button',{name:'生成判断卡',exact:true}).click();
 await page.getByRole('textbox',{name:'我的最终结论'}).fill('先补实际回答与材料样例，暂不决定上线。');
 await page.getByRole('button',{name:'保存并连接知识'}).click();
 const card=(await state()).cards[0];expect(card.goal).toBe('准备评审内部知识库助手');expect(card.nodes).toEqual(['K02','K05']);expect(card.pending).toContain('实际回答');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'导出 Markdown'}).click();const dl=await downloadPromise;await dl.saveAs('test-results/判断卡.md');
 await route(`application/${card.id}`);await expect(page.getByRole('textbox',{name:'我的最终结论'})).toHaveValue('先补实际回答与材料样例，暂不决定上线。');note('A12: real scenario creates an editable persisted card with citations and pending checks; Markdown download works');
 await route('workbench');await page.getByRole('button',{name:/K02 回答与依据/}).click();await expect(page.getByRole('heading',{name:'回答与依据',exact:true})).toBeVisible();await expect(page.getByRole('dialog').getByText('有应用练习记录',{exact:true})).toBeVisible();await page.getByRole('button',{name:'关闭面板'}).click();
 await page.getByRole('button',{name:'管理',exact:true}).click();
 const xpBefore=(await state()).agent.xp;await page.getByRole('button',{name:'删除 Q03 记录'}).first().click();expect((await state()).agent.xp).toBe(xpBefore);await page.getByRole('button',{name:'关闭面板'}).click();note('A10/A11: map opens source-linked evidence; deleting evidence keeps reward ledger and earned forms');
 await page.getByRole('button',{name:'打开搭子帮助'}).click();await page.getByRole('textbox',{name:'向搭子提问'}).fill('检索增强是什么？');await page.getByRole('button',{name:'发送问题'}).click();await expect(page.getByText(/问题引导检索，外部材料提供给生成环节/)).toBeVisible();await page.getByRole('button',{name:'关闭面板'}).click();
 note('Agent: context help responds using scoped knowledge, exposes sources and explicitly labels local FAQ');
 for(const lesson of ['V02','V03']){await route(`lesson/${lesson}`);await page.waitForFunction(()=>document.querySelector('video')?.readyState>=1);expect(await page.locator('video').evaluate(v=>v.duration)).toBe(60);await page.getByRole('button',{name:'播放动画',exact:true}).click();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>1);await page.locator('video').evaluate(v=>v.pause());}
 note('A02/A15: all 3 MP4 assets decode and play with subtitle tracks');
 await route('challenge/Q02');await page.getByRole('radio').nth(2).click();await page.evaluate(()=>{window._realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Test quota','QuotaExceededError');};});await page.getByRole('button',{name:'提交判断'}).click();await expect(page.getByRole('alert')).toContainText('尚未保存');await expect(page.getByRole('heading',{name:'这次判断，通过了。'})).toHaveCount(0);await page.evaluate(()=>{Storage.prototype.setItem=window._realSet;});
 note('A13: simulated storage failure preserves input and does not show successful reward');
 for(const width of [360,390,768]){await page.setViewportSize({width,height:844});for(const r of ['learn','workbench','buddy','lesson/V01','challenge/Q04','application/new']){await route(r);const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(size.scroll).toBeLessThanOrEqual(size.width);}}
 await page.setViewportSize({width:390,height:844});await route('learn');await page.screenshot({path:'test-results/mobile.png',fullPage:true});await route('workbench');await page.screenshot({path:'test-results/workbench-mobile.png',fullPage:true});
 note('A17/mobile: all core screens at 360, 390 and 768px fit without horizontal scrolling');
 expect(errors).toEqual([]);note('Browser console: no uncaught runtime errors');
 await writeFile('test-results/browser-results.json',JSON.stringify({results,errors},null,2));
}catch(e){await page.screenshot({path:'test-results/failure.png',fullPage:true});console.error(e);process.exitCode=1;}
finally{await browser.close();}
