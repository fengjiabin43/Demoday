export type User={id:string;name:string;joined:string;channel:string;goal:string;device:string};
export type Event={id:string;userId:string;sessionId:string;time:string;step:string;object?:string;error?:string};
export type Feedback={id:string;userId:string;time:string;type:string;content:string;step:string;status:string;priority:string;owner:string;note:string};
export type Dataset={version:1;users:User[];events:Event[];feedback:Feedback[]};
export const steps=['进入产品','开始学习','完成内容','提交闯关','通过闯关','查看工作台','保存判断卡'];
export const channels=['直接访问','社群分享','朋友推荐','内容引流'];
export const goals=['建立基础','解决工作问题','更新已有认识'];
const dayFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'});
const dayCache=new Map<string,string>();
export const dateKey=(d:Date|string=new Date())=>{
 if(typeof d==='string'){
  if(/^\d{4}-\d{2}-\d{2}$/.test(d))return d;
  const cached=dayCache.get(d);if(cached)return cached;
  const value=dayFormatter.format(new Date(d));if(dayCache.size>100000)dayCache.clear();dayCache.set(d,value);return value;
 }
 return dayFormatter.format(d);
};
export const addDays=(s:string,n:number)=>dateKey(new Date(new Date(s+'T12:00:00+08:00').getTime()+n*86400000));
export const fmt=(n:number)=>new Intl.NumberFormat('zh-CN').format(n);
export const pct=(n:number,d:number)=>d?`${(n/d*100).toFixed(1)}%`:'—';
export const timeLabel=(s:string)=>new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
export function demoData():Dataset{
 let seed=731;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const users:User[]=[],events:Event[]=[],feedback:Feedback[]=[];const today=addDays(dateKey(),-1);
 const comments=[['体验建议','闯关答错后想回看对应的知识片段，但不太清楚怎么返回。','提交闯关'],['内容问题','这段检索增强的解释有点难，希望能再给一个具体工作案例。','完成内容'],['功能异常','视频偶尔加载不出来，切成文字以后才继续学完。','开始学习'],['体验建议','生成判断卡之后，不确定保存成功没有，希望提示更明显。','保存判断卡'],['内容问题','引用的原文位置和解释对不上，希望可以直接定位到段落。','查看工作台'],['其他反馈','工作台里的知识关系很有帮助，想要把地图也一起导出。','查看工作台']];
 for(let i=0;i<760;i++){
  const offset=Math.min(27,Math.floor(Math.pow(random(),.82)*28));const joined=addDays(today,-27+offset);const goal=goals[Math.floor(random()*3)];
  const user={id:`SG-${String(i+1).padStart(5,'0')}`,name:['林','陈','张','李','周','杨','许','王'][i%8]+['同学','小白','产品人','的搭子'][i%4],joined,channel:channels[Math.floor(random()*4)],goal,device:random()<.72?'移动端':'桌面端'};users.push(user);
  const visits=1+Math.floor(random()*5);let lastOffset=-1;
  for(let j=0;j<visits;j++){
   const dayOffset=j===0?0:Math.floor(random()*(28-offset));if(j>0&&dayOffset===0||dayOffset===lastOffset)continue;lastOffset=dayOffset;const date=addDays(joined,dayOffset);if(date>today)continue;
   const sessionId=`S-${i}-${j}`;const start=new Date(`${date}T${String(8+Math.floor(random()*12)).padStart(2,'0')}:${String(Math.floor(random()*60)).padStart(2,'0')}:00+08:00`).getTime();
   let path=steps.slice(0,random()<.13?1:random()<.15?2:random()<.40?3:random()<.20?4:random()<.23?5:random()<.45?6:7);
   if(goal==='更新已有认识'&&random()<.30)path=[steps[0],steps[3],steps[4],steps[5]];
   path.forEach((step,k)=>events.push({id:`E-${i}-${j}-${k}`,userId:user.id,sessionId,time:new Date(start+k*70000+Math.floor(random()*12000)).toISOString(),step,object:step==='开始学习'||step==='完成内容'?['V01','V02','V03'][i%3]:step==='提交闯关'||step==='通过闯关'?`Q${String(i%12+1).padStart(2,'0')}`:undefined}));
   if(i%23===0&&j===0){const c=comments[i%comments.length];feedback.push({id:`FB-${String(feedback.length+1).padStart(4,'0')}`,userId:user.id,time:new Date(start+120000).toISOString(),type:c[0],content:c[1],step:c[2],status:i%3===0?'待处理':i%3===1?'处理中':'已解决',priority:c[0]==='功能异常'?'高':'中',owner:i%3===0?'未分配':'产品同学',note:i%3===2?'已核对对应内容，补充了引导说明。':''});}
  }
 }
 events.sort((a,b)=>a.time.localeCompare(b.time));feedback.sort((a,b)=>b.time.localeCompare(a.time));return{version:1,users,events,feedback};
}
export function validateData(data:unknown):Dataset{
 const d=data as Dataset;if(!d||d.version!==1||!Array.isArray(d.users)||!Array.isArray(d.events)||!Array.isArray(d.feedback))throw new Error('文件需要包含 version: 1、users、events、feedback。');
 if(d.users.length>100000||d.events.length>500000)throw new Error('Demo 支持最多 10 万用户、50 万事件。');
 const ids=new Set<string>(),eventIds=new Set<string>(),feedbackIds=new Set<string>();
 const validDate=(s:unknown)=>typeof s==='string'&&Number.isFinite(Date.parse(s));
 for(const u of d.users){if(!u||typeof u.id!=='string'||ids.has(u.id)||!validDate(u.joined)||![u.name,u.channel,u.goal,u.device].every(v=>typeof v==='string'))throw new Error('用户字段缺失、日期无效或用户 ID 重复。');ids.add(u.id);}
 for(const e of d.events){if(!e||typeof e.id!=='string'||eventIds.has(e.id)||!ids.has(e.userId)||typeof e.sessionId!=='string'||!validDate(e.time)||!steps.includes(e.step))throw new Error('事件字段、用户引用、步骤或日期无效；事件 ID 必须唯一。');eventIds.add(e.id);}
 for(const f of d.feedback){if(!f||typeof f.id!=='string'||feedbackIds.has(f.id)||!ids.has(f.userId)||!validDate(f.time)||!['待处理','处理中','已解决'].includes(f.status)||![f.type,f.content,f.step,f.priority,f.owner,f.note].every(v=>typeof v==='string'))throw new Error('反馈字段、状态、用户引用或日期无效。');feedbackIds.add(f.id);}
 return d;
}
export function saveFile(text:string,name:string,type='text/csv;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
export function csv(rows:(string|number)[][]){return '\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');}
