import {lessons,nodes,questions,templates,relations} from './content';
export const STORAGE_KEY='glint.learning.v1';
export type Event = {id:string;kind:'answer'|'video'|'reading'|'application'|'preference'|'update';object:string;time:string;nodes:string[];correct?:boolean;guided?:boolean;repeat?:boolean;choice?:number;tag?:string;version:number};
export type Card = {id:string;goal:string;scene:string;material:string;type:number;judgment:string;checks:string;pending:string;conclusion:string;nodes:string[];modified:string;history:{time:string;conclusion:string}[]};
export type State={version:1;userId:string;profile:{adopted:boolean;name:string;goal:number;style:string;budget:number;reducedMotion:boolean;recordPreferences:boolean};agent:{xp:number;unlocked:number[];form:number};events:Event[];rewards:Record<string,number>;drafts:Record<string,{choice:number|null;hint:boolean;seen:boolean;dirty:boolean}>;playback:Record<string,{position:number;duration:number;ranges:number[][];updated:string}>;queue:{pinned:string[];deferred:Record<string,string>;skipped:string[]};cards:Card[];chat:{id:string;question:string;answer:string;nodes:string[];time:string}[];chatSummary:{count:number;topics:string[]};logs:{id:string;text:string;time:string}[];activity:Record<string,number>;selfReports:Record<string,string>;updateSeen:boolean};
export type Task={id:string;kind:'video'|'question'|'application'|'update';title:string;reason:string;minutes:string;clip?:number};
export const now=()=>new Date().toISOString();
export const uid=()=>globalThis.crypto?.randomUUID?.() ?? `e-${Date.now()}-${Math.random()}`;
export function day(date=new Date()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function week(date=new Date()) {const d=new Date(`${day(date)}T00:00:00+08:00`);const weekday=new Date(`${day(date)}T00:00:00Z`).getUTCDay();d.setDate(d.getDate()-((weekday+6)%7));return day(d);}
export function initialState():State {return {version:1,userId:uid(),profile:{adopted:false,name:'识光',goal:0,style:'简洁友好',budget:180,reducedMotion:false,recordPreferences:true},agent:{xp:0,unlocked:[1],form:1},events:[],rewards:{},drafts:{},playback:{},queue:{pinned:[],deferred:{},skipped:[]},cards:[],chat:[],chatSummary:{count:0,topics:[]},logs:[],activity:{},selfReports:{},updateSeen:false};}
export function validateState(s:unknown):s is State {
  if(!s||typeof s!=='object')return false;
  const a=s as State;
  return a.version===1 && !!a.userId && !!a.profile && !!a.agent && Array.isArray(a.events) && Array.isArray(a.cards) && !!a.queue && !!a.rewards && !!a.drafts && !!a.playback && !!a.activity && Array.isArray(a.chat) && !!a.chatSummary && !!a.selfReports && typeof a.profile.budget==='number' && a.profile.goal>=0 && a.profile.goal<3 && a.events.every(e=>Array.isArray(e.nodes)&&e.nodes.every(n=>nodes.some(k=>k.id===n))&&!!e.id);
}
export function loadState(storage:Pick<Storage,'getItem'>):State {const raw=storage.getItem(STORAGE_KEY);if(!raw)return initialState();const parsed=JSON.parse(raw);if(!validateState(parsed))throw new Error('学习数据版本或引用无效。原始数据仍保留，请先导出再重置。');if(parsed.profile.name==='微光')parsed.profile.name='识光';return parsed;}
export function completedChapters(s:State) {return [1,2,3].filter(c=>questions.filter(q=>q.chapter===c&&q.kind==='check').every(q=>s.events.some(e=>e.kind==='answer'&&e.object===q.id&&e.correct)));}
export function currentLevel(s:State){return Math.max(...s.agent.unlocked);}
export function getKnowledgeView(s:State){return nodes.map(n=>{
 const evidence=s.events.filter(e=>e.nodes.includes(n.id));
 const answers=evidence.filter(e=>e.kind==='answer');
 const lastAnswer=answers.at(-1);
 const app=evidence.some(e=>e.kind==='application');const understood=answers.some(e=>e.correct);const touched=evidence.some(e=>e.kind==='video'||e.kind==='reading');
 return {...n,status:app?3:understood?2:touched?1:0,evidence,review:lastAnswer?.correct===false || (s.updateSeen&&n.id==='K08'&&!answers.some(e=>e.correct&&e.time>(s.events.find(e=>e.kind==='update')?.time??''))),guided:answers.some(e=>e.correct&&e.guided),independent:answers.some(e=>e.correct&&!e.guided),selfReport:s.selfReports[n.id]};
});}
export const statusNames=['未接触','已接触','有理解练习记录','有应用练习记录'];
function log(s:State,text:string){s.logs.unshift({id:uid(),text,time:now()});s.logs=s.logs.slice(0,60);}
function unlock(s:State){s.agent.xp=Object.values(s.rewards).reduce((a,b)=>a+b,0);const chapters=completedChapters(s).length;for(const [level,xp,count]of [[2,80,1],[3,160,2],[4,240,3]])if(s.agent.xp>=xp&&chapters>=count&&!s.agent.unlocked.includes(level)){s.agent.unlocked.push(level);s.agent.form=level;}}
export function applyLearningEvent(s:State,e:Event){if(s.events.some(x=>x.id===e.id))return false;s.events.push(e);if(e.kind==='answer'&&e.correct){const q=questions.find(q=>q.id===e.object);if(q&&!s.rewards[q.id])s.rewards[q.id]=q.kind==='practice'?20:40;unlock(s);}const names=e.nodes.map(id=>nodes.find(n=>n.id===id)?.short).join('、');log(s,e.kind==='answer'?`${e.object} ${e.correct?'通过':'需复核'} · ${e.guided?'有引导 / 已看过答案':'独立尝试'}，已连接「${names}」。${e.correct?'继续下一小步。':`下一步补充「${e.tag}」的解释。`}`:e.kind==='video'?`${e.object} 有效观看覆盖达到 80%，「${names}」记为已接触。`:e.kind==='reading'?`${e.object} 图文阅读已保存，与视频观看记录分开。`:e.kind==='application'?`已把工作判断卡连接到「${names}」，记录为应用尝试，仍需真实材料验证。`:e.kind==='update'?'策展更新示例已连接到 K08，建议复核受影响的判断。':'目标与偏好已保存，未来路线按新目标安排。');return true;}
export function submitChallenge(s:State,id:string,eventId=uid()){
 const q=questions.find(q=>q.id===id);if(!q)throw new Error('题目不存在');const d=s.drafts[id];if(!d||d.choice===null)throw new Error('请先选择一个答案');
 if(s.events.some(e=>e.id===eventId))return {correct:d.choice===q.answer,reward:0};
 const correct=d.choice===q.answer;const hadReward=!!s.rewards[id];const repeat=s.events.some(e=>e.kind==='answer'&&e.object===id);
 const e:Event={id:eventId,kind:'answer',object:id,time:now(),nodes:q.nodes,correct,choice:d.choice,guided:d.hint||d.seen||repeat,repeat,tag:correct?undefined:q.tag,version:1};
 applyLearningEvent(s,e);d.seen=true;d.dirty=false;
 return {correct,reward:correct&&!hadReward?(q.kind==='check'?40:20):0};
}
export function mergeRanges(ranges:number[][]){const sorted=ranges.filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>a).map(r=>[...r]).sort((a,b)=>a[0]-b[0]);const result:number[][]=[];for(const r of sorted){const last=result.at(-1);if(last&&r[0]<=last[1]+0.1)last[1]=Math.max(last[1],r[1]);else result.push(r);}return result;}
export function coverage(s:State,id:string){const p=s.playback[id];return p?.duration?Math.min(1,mergeRanges(p.ranges).reduce((a,[x,y])=>a+y-x,0)/p.duration):0;}
export function savePlayback(s:State,id:string,position:number,duration:number,ranges:number[][]){if(!lessons.some(l=>l.id===id)||!Number.isFinite(duration)||duration<=0)return;s.playback[id]={position:Math.min(Math.max(position,0),duration),duration,ranges:mergeRanges([...(s.playback[id]?.ranges??[]),...ranges]).map(([a,b])=>[Math.max(0,a),Math.min(duration,b)]),updated:now()};if(coverage(s,id)>=.8&&!s.events.some(e=>e.kind==='video'&&e.object===id))applyLearningEvent(s,{id:uid(),kind:'video',object:id,time:now(),nodes:lessons.find(l=>l.id===id)!.nodes,version:1});}
export function updatePreference(s:State,profile:Partial<State['profile']>){s.profile={...s.profile,...profile};applyLearningEvent(s,{id:uid(),kind:'preference',object:'profile',time:now(),nodes:[],version:1});}
export function removeMemory(s:State,id:string){const e=s.events.find(e=>e.id===id);s.events=s.events.filter(e=>e.id!==id);if(e?.kind==='application')s.cards=s.cards.filter(c=>c.id!==e.object);log(s,'已删除原始记录与依赖证据，个人知识视图已重算；已领取经验和形态保留。');}
export function weeklySeconds(s:State,date=new Date()){const first=week(date);return Object.entries(s.activity).filter(([d])=>d>=first&&d<=day(date)).reduce((total,[,n])=>total+n,0);}
export function taskFor(id:string):Task|undefined {const l=lessons.find(l=>l.id===id);if(l)return {id,kind:'video',title:l.title,reason:'先用一个短故事理解关键概念。',minutes:'1 分钟'};const q=questions.find(q=>q.id===id);if(q)return {id,kind:'question',title:q.title,reason:q.kind==='check'?'直接挑战，按真实作答安排后续学习。':'做一个小判断，把发现留成证据。',minutes:'约 1 分钟'};if(id==='application')return {id,kind:'application',title:'做一张工作判断卡',reason:'把知识连接到你正在评审的方案。',minutes:'约 3 分钟'};if(id==='update')return {id,kind:'update',title:'资料变了，旧答案还能用吗？',reason:'策展更新示例：连接评估维度与条件变化。',minutes:'约 1 分钟'};}
export function getNextTasks(s:State):Task[]{
 const tasks:Task[]=[];const add=(t:Task|undefined)=>{if(t&&!tasks.some(a=>a.id===t.id)&&!s.queue.skipped.includes(t.id)&&s.queue.deferred[t.id]!==day())tasks.push(t);};
 s.queue.pinned.forEach(id=>add(taskFor(id)));
 Object.entries(s.drafts).filter(([,d])=>d.dirty).forEach(([id])=>add({...taskFor(id)!,reason:'接续上次还没提交的选择。'}));
 Object.entries(s.playback).sort((a,b)=>b[1].updated.localeCompare(a[1].updated)).filter(([,p])=>p.position>0&&p.position<p.duration-1).forEach(([id])=>add({...taskFor(id)!,reason:`从 ${Math.floor(s.playback[id].position)} 秒继续上次发现。`}));
 const views=getKnowledgeView(s);const errors=s.events.filter(e=>e.kind==='answer'&&!e.correct&&e.nodes.some(id=>views.find(v=>v.id===id)?.review));
 errors.slice(-2).reverse().forEach(e=>{const q=questions.find(q=>q.id===e.object)!;const l=lessons[q.chapter-1];add({...taskFor(l.id)!,reason:`补充「${e.tag}」· 回看 ${q.clip} 秒起的片段。`,clip:q.clip});});
 const starts=s.profile.goal===0?['V01','Q01','Q02']:s.profile.goal===1?['Q07','application','V02']:['Q11','update','V03'];
 const done=(id:string)=>id.startsWith('V')?s.events.some(e=>['video','reading'].includes(e.kind)&&e.object===id):id.startsWith('Q')?s.events.some(e=>e.kind==='answer'&&e.object===id&&e.correct):id==='application'?s.cards.length>0:s.updateSeen;
 starts.filter(id=>!done(id)).forEach(id=>add(taskFor(id)));
 lessons.forEach(l=>{if(!done(l.id))add(taskFor(l.id));questions.filter(q=>q.chapter===l.chapter&&!done(q.id)).forEach(q=>add(taskFor(q.id)));});
 if(tasks.length<3)add(taskFor('application'));if(tasks.length<3&&!s.updateSeen)add(taskFor('update'));
 if(!tasks.length)add({...taskFor('Q12')!,reason:'已有记录已保留，可选择复习；重复答题不重复领奖。'});
 const result=tasks.slice(0,3);
 if(weeklySeconds(s)>=s.profile.budget*60&&result[0])result[0]={...result[0],reason:'已达到本周预算，建议回顾或休息。你仍可继续这一步。'};
 return result;
}
export function createApplicationCard(s:State,input:Pick<Card,'goal'|'scene'|'material'|'type'>){const t=templates[input.type];if(!t)throw new Error('场景类型无效');const card:Card={...input,id:uid(),judgment:t.judgment,checks:t.checks,pending:t.pending+(input.material.trim()?'；已输入材料仍需核对其真实性':'；尚未提供材料')+(!input.goal.trim()?'；工作目标':'')+(!input.scene.trim()?'；使用场景':''),conclusion:'',nodes:t.nodes,modified:now(),history:[]};return card;}
export function saveCard(s:State,card:Card){const old=s.cards.find(c=>c.id===card.id);card.modified=now();card.history=[...(old?.history??[]),{time:card.modified,conclusion:card.conclusion}];s.cards=s.cards.filter(c=>c.id!==card.id);s.cards.unshift(structuredClone(card));s.events=s.events.filter(e=>!(e.kind==='application'&&e.object===card.id));applyLearningEvent(s,{id:uid(),kind:'application',object:card.id,time:now(),nodes:card.nodes,version:1});}
export function cardMarkdown(c:Card){return `# ${c.goal||'工作方案判断卡'}\n\n> 场景模板生成，未对真实系统执行检测。\n\n- 使用场景：${c.scene||'待确认'}\n- 已有材料：${c.material||'待补充'}\n\n## 当前判断与条件\n${c.judgment}\n\n## 检查建议\n${c.checks}\n\n## 待确认\n${c.pending}\n\n## 最终结论\n${c.conclusion||'用户尚未填写'}\n\n## 关联知识\n${c.nodes.join('、')}\n\n## 来源\n- [Anthropic 减少幻觉](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)\n- [Lewis 等检索增强生成论文](https://arxiv.org/abs/2005.11401)\n- [Google Cloud 评估指标模板](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/metrics-templates?hl=zh-cn)\n\n修改时间：${c.modified}\n`}
export function exportLearningData(s:State){return JSON.stringify({exportedAt:now(),storageScope:'当前浏览器',...s},null,2);}
export function answerQuestion(s:State,question:string,context:string){
 const q=questions.find(q=>q.id===context);const lesson=lessons.find(l=>l.id===context);
 const matches=nodes.filter(n=>question.includes(n.short)||question.includes(n.name)||question.includes(n.id));
 const ids=matches.length?matches.map(n=>n.id):/检索|资料室|RAG|rag/.test(question)?['K04','K05','K06']:/分数|评估|过时|更新|版本/.test(question)?['K07','K08']:/依据|可靠|流畅|不足|例子|这个词|关系/.test(question)?(lesson?.nodes??q?.nodes??['K01','K02','K03']):[];
 let answer=ids.length?ids.map(id=>nodes.find(n=>n.id===id)!.text).join(' '):'这个问题超出首版内容库，目前无法给出有来源的回答。我已保留问题。可以先问「回答与依据」「检索与生成」或「评估与更新」。';
 if(/例子/.test(question)&&ids.length)answer+=' 例如：材料只写工作日响应，回答却承诺周末也响应。新增条件需要另找依据。这是原创模拟案例。';
 if(/关系/.test(question)&&ids.length)answer+=' '+relations.filter(r=>ids.includes(r.from)||ids.includes(r.to)).slice(0,2).map(r=>`${r.from} → ${r.to}：${r.text}`).join(' ');
 const entry={id:uid(),question,answer,nodes:ids,time:now()};s.chat.push(entry);if(s.chat.length>20){const removed=s.chat.splice(0,s.chat.length-20);s.chatSummary.count+=removed.length;s.chatSummary.topics=[...new Set([...s.chatSummary.topics,...removed.flatMap(r=>r.nodes)])];}return entry;
}
// Frontend mock API: transactional state updates. UI receives success only after persistence.
export class MockLearningAPI {
 constructor(public state:State,private storage:Pick<Storage,'setItem'>){}
 transaction<T>(change:(draft:State)=>T):T {const draft=structuredClone(this.state);const value=change(draft);this.storage.setItem(STORAGE_KEY,JSON.stringify(draft));this.state=draft;return value;}
}
