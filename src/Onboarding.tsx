import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,ChevronLeft,Sparkles,X} from 'lucide-react';
import './onboarding.css';
const steps=[
 {title:'内容流',route:'workbench/library',target:'.layout-filters button:nth-child(2)',description:'视频、图文、情境案例和策展资讯集中在内容库，按形式挑选适合当下的内容。首版资讯为策展示例。',task:'点击「视频」，找到一条想学的内容。',done:'已打开视频内容流'},
 {title:'个性化推荐与重点标记',route:'learn',target:'.layout-recommend-links button:first-child',description:'识光根据你的目标和学习记录安排下一步，说明推荐理由；课程要点帮你抓住值得关注的判断。',task:'点击「推荐理由」，看看这一步为什么适合你。',done:'已查看推荐理由'},
 {title:'趣味学习与闯关',route:'lesson/V01',target:'.layout-play-row .direct',description:'用一分钟动画理解概念，再用情境挑战检验判断。卡住可看提示，离开后能接着学。',task:'点击「直接做个判断」，打开第一道挑战。',done:'已打开情境挑战'},
 {title:'Personal Agent',route:'buddy',target:'.layout-settings-list .layout-setting-row:first-child',description:'专属搭子陪你对话、记住进展并安排路线。你可以纠正或删除记忆；首次通过挑战获得经验，解锁新形态。',task:'点击「和搭子聊一聊」，认识你的学习 Agent。',done:'已打开搭子对话'},
 {title:'知识体系与工作台',route:'workbench',target:'.layout-map-node, .layout-knowledge-list button',description:'学习后自动连接知识。在地图里查看知识卡、关系和学习证据，在工作台管理内容、记忆与成长记录。',task:'点击高亮知识点，查看它的解释和学习依据。',done:'已打开知识卡'},
 {title:'知识应用',route:'workbench',target:'.layout-workbench .page-heading .btn.primary',description:'把知识用于真实工作问题：填写场景，生成方案判断卡，再编辑、保存和导出。模板建议仍需实际材料验证。',task:'点击「用于我的工作」，开始第一张判断卡。',done:'已进入判断卡创建页'}
];
type Progress={step:number;done:number[];status:'active'|'exploring'|'completed'|'skipped'};
function visibleTarget(selector:string){return Array.from(document.querySelectorAll<HTMLElement>(selector)).find(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0;});}
export default function Onboarding({navigate}:{navigate:(route:string)=>void}){
 const initial=useRef<Progress>({step:0,done:[],status:'active'});const [progress,setProgress]=useState(initial.current);const [active,setActive]=useState(!['completed','skipped'].includes(initial.current.status));const [exploring,setExploring]=useState(false);const [rect,setRect]=useState<{left:number;top:number;width:number;height:number}|null>(null);const [bubble,setBubble]=useState({left:14,top:100,above:false,arrow:30});const panel=useRef<HTMLElement>(null);const go=useRef(navigate);go.current=navigate;const step=steps[progress.step];
 const save=(next:Progress)=>setProgress(next);
 const stop=(status:'completed'|'skipped')=>{save({...progress,status});setActive(false);setExploring(false);document.querySelector('video')?.pause();};
 const move=(index:number)=>{if(index>=6){stop('completed');return;}setExploring(false);setRect(null);save({...progress,step:Math.max(0,index),status:'active'});};
 useEffect(()=>{const start=()=>{document.querySelector('video')?.pause();setActive(true);setExploring(false);setRect(null);save({step:0,done:[],status:'active'});};window.addEventListener('shiguang:start-tour',start);return()=>window.removeEventListener('shiguang:start-tour',start);},[]);
 useEffect(()=>{
  if(!active||exploring)return;
  document.querySelector('video')?.pause();go.current(step.route);
  let scrolled=false;let cancelled=false;
  const measure=()=>{
   if(cancelled)return;
   const target=visibleTarget(step.target);if(!target){setRect(null);return;}
   if(!scrolled){target.scrollIntoView({block:'center',behavior:'instant'});scrolled=true;}
   const raw=target.getBoundingClientRect(),padding=7;
   const left=Math.max(4,raw.left-padding),top=Math.max(4,raw.top-padding),right=Math.min(innerWidth-4,raw.right+padding),bottom=Math.min(innerHeight-4,raw.bottom+padding);
   if(right<=left||bottom<=top){setRect(null);return;}
   setRect({left,top,width:right-left,height:bottom-top});
   const width=Math.min(360,innerWidth-28),height=panel.current?.offsetHeight??330;
   const x=Math.min(innerWidth-width-14,Math.max(14,(left+right)/2-width/2));
   const above=bottom+height+18>innerHeight-12;
   const y=above?Math.max(12,top-height-14):bottom+14;
   setBubble({left:x,top:Math.min(Math.max(12,y),Math.max(12,innerHeight-height-12)),above,arrow:Math.max(22,Math.min(width-22,(left+right)/2-x))});
  };
  const timer=setInterval(measure,180);const delay=setTimeout(measure,120);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);
  return()=>{cancelled=true;clearInterval(timer);clearTimeout(delay);window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);};
 },[active,exploring,progress.step]);
 useEffect(()=>{
  if(!active||exploring)return;
  const click=(event:MouseEvent)=>{const target=visibleTarget(step.target);if(target&&event.target instanceof Node&&target.contains(event.target)){save({...progress,done:[...new Set([...progress.done,progress.step])],status:'exploring'});setExploring(true);setRect(null);}};
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape')stop('skipped');};
  document.addEventListener('click',click,true);document.addEventListener('keydown',key);return()=>{document.removeEventListener('click',click,true);document.removeEventListener('keydown',key);};
 },[active,exploring,progress]);
 if(!active)return null;
 if(exploring)return <aside className="tour-dock" role="status"><span className="tour-dock-check"><Check size={18}/></span><div><small>新手任务 {progress.step+1} / 6</small><strong>{step.done}</strong><span>可以先体验这个功能，再继续导览。</span></div><button onClick={()=>move(progress.step+1)}>{progress.step===5?'完成引导':'下一步'}<ArrowRight size={15}/></button><button className="tour-dock-close" onClick={()=>stop('skipped')} aria-label="结束新手引导"><X size={17}/></button></aside>;
 const width=Math.min(360,innerWidth-28);const top=rect?.top??0,bottom=rect?rect.top+rect.height:innerHeight,left=rect?.left??0,right=rect?rect.left+rect.width:innerWidth;
 return <div className="tour-layer">
 {rect?<><div className="tour-mask" style={{top:0,left:0,right:0,height:top}}/><div className="tour-mask" style={{top:bottom,left:0,right:0,bottom:0}}/><div className="tour-mask" style={{top,left:0,width:left,height:bottom-top}}/><div className="tour-mask" style={{top,left:right,right:0,height:bottom-top}}/><div className="tour-spotlight" style={{left:rect.left,top:rect.top,width:rect.width,height:rect.height}}/></>:<div className="tour-mask" style={{inset:0}}/>}
 <section className={`tour-bubble ${bubble.above?'above':''}`} role="dialog" aria-modal="false" aria-label={`新手任务：${step.title}`} ref={panel} style={{left:rect?bubble.left:'50%',top:rect?bubble.top:'50%',width,transform:rect?undefined:'translate(-50%,-50%)'}}>
 {rect&&<i className="tour-arrow" style={{left:bubble.arrow}}/>}<div className="tour-bubble-header"><span><Sparkles size={14}/>识光 · 新手任务 {progress.step+1} / 6</span><button onClick={()=>stop('skipped')} aria-label="跳过新手引导"><X size={17}/></button></div>
 <div className="tour-steps">{steps.map((s,i)=><button key={s.title} aria-label={`第${i+1}步：${s.title}`} className={i===progress.step?'current':progress.done.includes(i)?'done':''} onClick={()=>move(i)}>{progress.done.includes(i)?<Check size={10}/>:i+1}</button>)}</div>
 <h2>{step.title}</h2><p>{step.description}</p><div className="tour-task"><span>试一下</span><strong>{step.task}</strong></div>
 <div className="tour-actions"><button className="tour-back" disabled={progress.step===0} onClick={()=>move(progress.step-1)}><ChevronLeft size={14}/>上一步</button><button className="tour-try" disabled={!rect} onClick={()=>visibleTarget(step.target)?.dispatchEvent(new MouseEvent('click',{bubbles:true}))}>去试试<ArrowRight size={15}/></button></div><div className="tour-foot"><button onClick={()=>stop('skipped')}>跳过引导</button><button onClick={()=>move(progress.step+1)}>{progress.step===5?'结束导览':'先了解，下一步'}</button></div>
 </section></div>;
}
