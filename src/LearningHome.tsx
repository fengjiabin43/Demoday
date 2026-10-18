import {useState, type KeyboardEvent} from 'react';
import {Bookmark, Check, ExternalLink, Globe2, Play, Search, Settings2, Sparkles, X} from 'lucide-react';
import {LearningNextStep, type LayoutProps} from './Layouts';
import {collectionSources, emptyFeedMemory, feedItems, feedTags, recommendFeed, type FeedItem, type FeedMemory} from './feed';
import {lessons} from './content';
import './learning.css';

type Props=LayoutProps & {onFeedUpdate:(change:(draft:FeedMemory)=>void)=>boolean};
export default function LearningHome(props:Props){
 const {state,go,route,onFeedUpdate}=props;
 const tab=route==='learn/recommended'?'recommended':'news';
 const memory=state.feed??emptyFeedMemory();
 const [topic,setTopic]=useState('全部');
 const [channel,setChannel]=useState('全部来源');
 const [search,setSearch]=useState('');
 const [savedOnly,setSavedOnly]=useState(false);
 const [preferences,setPreferences]=useState(false);
 const [notice,setNotice]=useState('');
 const [lastDismissed,setLastDismissed]=useState<string|null>(null);
 const update=(change:(draft:FeedMemory)=>void,message='')=>{if(onFeedUpdate(change))setNotice(message);};
 const visit=(item:FeedItem)=>{if(state.profile.recordPreferences)update(d=>{d.opened=[item.id,...d.opened.filter(id=>id!==item.id)].slice(0,100);});};
 const save=(item:FeedItem)=>update(d=>{d.saved=d.saved.includes(item.id)?d.saved.filter(id=>id!==item.id):[item.id,...d.saved];},memory.saved.includes(item.id)?'已取消收藏':'已收藏，可在资讯中筛选查看');
 const dismiss=(item:FeedItem)=>{if(onFeedUpdate(d=>{d.dismissed=[...new Set([...d.dismissed,item.id])];})){setLastDismissed(item.id);setNotice('已减少这条推荐，你可以撤销');}};
 const switchTab=(next:string)=>go(next==='news'?'learn':'learn/recommended');
 const tabKey=(event:KeyboardEvent<HTMLButtonElement>)=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'news':event.key==='End'?'recommended':tab==='news'?'recommended':'news';switchTab(next);document.getElementById(`learning-tab-${next}`)?.focus();}};
 const query=search.trim().toLocaleLowerCase();
 const visible=feedItems.filter(item=>(savedOnly?memory.saved.includes(item.id):!item.lesson)&&(topic==='全部'||item.topic===topic)&&(channel==='全部来源'||item.channel===channel)&&(!query||[item.title,item.summary,item.source,...item.tags].join(' ').toLocaleLowerCase().includes(query)));
 const recommended=recommendFeed(state);
 const card=(item:FeedItem,reason?:string)=>{
  const lesson=lessons.find(l=>l.id===item.lesson);
  return <article className={`feed-card ${lesson?'feed-card-video':''}`} key={item.id}>
   {lesson&&<button className="feed-video-cover" onClick={()=>{visit(item);go(`lesson/${lesson.id}`);}} aria-label={`播放：${item.title}`}><img src={lesson.poster} alt=""/><span><Play size={18} fill="currentColor"/>1 分钟</span></button>}
   <div className="feed-source-line"><span className={`feed-source-mark mark-${item.mark.toLowerCase()}`}>{item.mark||<Play size={14}/>}</span><span>{item.source}</span><span className="feed-format">{item.format}</span></div>
   <h3>{item.url?<a href={item.url} target="_blank" rel="noreferrer" onClick={()=>visit(item)}>{item.title}</a>:<button onClick={()=>{visit(item);go(`lesson/${item.lesson}`);}}>{item.title}</button>}</h3>
   <p className="feed-summary">{item.summary}</p>
   <div className="feed-tags">{item.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
   {reason&&<p className="feed-reason"><Sparkles size={13}/>{reason}</p>}
   <div className="feed-card-foot"><span>{item.lesson?'原创短视频':item.date==='动态文档'?'动态文档 · 以原文为准':`发布于 ${item.date}`}</span><button onClick={()=>save(item)} aria-pressed={memory.saved.includes(item.id)} aria-label={`${memory.saved.includes(item.id)?'取消收藏':'收藏'}：${item.title}`} title={memory.saved.includes(item.id)?'取消收藏':'收藏'}><Bookmark size={16} fill={memory.saved.includes(item.id)?'currentColor':'none'}/></button>{reason&&<button onClick={()=>dismiss(item)} aria-label={`不感兴趣：${item.title}`} title="不感兴趣"><X size={16}/></button>}{item.url&&<a href={item.url} target="_blank" rel="noreferrer" onClick={()=>visit(item)} aria-label={`阅读原文：${item.title}`}><ExternalLink size={15}/></a>}</div>
  </article>;
 };
 return <div className="learning-page">
  <header className="page-heading learning-heading"><div><p className="eyebrow">保持好奇，让每次发现都有方向</p><h1>看见 AI 的变化，找到你的下一步。</h1><p>从行业动态到产品实践，把值得关注的内容，变成自己的积累。</p></div></header>
  <div className="learning-tab-row"><div className="layout-tabs learning-tabs" role="tablist" aria-label="学习内容">{[['news','资讯',Globe2],['recommended','推荐',Sparkles]].map(([id,label,Icon])=>{const TabIcon=Icon as typeof Globe2;return <button key={id as string} id={`learning-tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`learning-panel-${id}`} tabIndex={tab===id?0:-1} className={tab===id?'active':''} onClick={()=>switchTab(id as string)} onKeyDown={tabKey}><TabIcon size={18}/>{label as string}</button>;})}</div><button className="learning-preferences" aria-expanded={preferences} onClick={()=>setPreferences(!preferences)}><Settings2 size={15}/>我的偏好</button></div>
  {preferences&&<section className="feed-preferences" aria-label="推荐偏好"><div className="section-head"><div><h2>让推荐更懂你</h2><p>选择关注主题，也可以随时修改或清除浏览记忆。</p></div><button aria-label="收起偏好" onClick={()=>setPreferences(false)}><X size={18}/></button></div><div className="feed-preference-topics">{feedTags.map(tag=><button key={tag} aria-pressed={memory.topics.includes(tag)} onClick={()=>update(d=>{d.topics=d.topics.includes(tag)?d.topics.filter(t=>t!==tag):[...d.topics,tag];},'关注主题已更新')}>{memory.topics.includes(tag)&&<Check size={13}/>} {tag}</button>)}</div><div className="feed-preference-bottom"><label>内容形式 <select value={memory.format} onChange={e=>update(d=>{d.format=e.target.value as FeedMemory['format'];},'内容偏好已更新')}><option>全部</option><option>文章</option><option>视频</option></select></label><span>记住了 {memory.opened.length} 条打开记录 · {memory.saved.length} 条收藏</span><button onClick={()=>update(d=>{d.opened=[];},'浏览记忆已清除，收藏和学习进度保留')}>清除浏览记忆</button><button onClick={()=>props.onOpen('settings')}>记录设置 ↗</button>{memory.dismissed.length>0&&<button onClick={()=>update(d=>{d.dismissed=[];},'已恢复隐藏的推荐')}>恢复隐藏内容（{memory.dismissed.length}）</button>}</div><p className="feed-preference-note">{state.profile.recordPreferences?'仅记录在识光里打开的内容，不读取站外浏览历史。':'已关闭浏览偏好记录；推荐仍参考学习进度和你主动选择的偏好。'}</p></section>}
  {notice&&<div className="feed-notice" role="status"><Check size={14}/>{notice}{lastDismissed&&memory.dismissed.includes(lastDismissed)&&<button onClick={()=>{update(d=>{d.dismissed=d.dismissed.filter(id=>id!==lastDismissed);},'已恢复这条推荐');setLastDismissed(null);}}>撤销</button>}<button aria-label="关闭反馈" onClick={()=>setNotice('')}><X size={14}/></button></div>}
  <section role="tabpanel" id={`learning-panel-${tab}`} aria-labelledby={`learning-tab-${tab}`} tabIndex={0}>
  {tab==='news'?<>
   <div className="feed-intro"><div><h2>AI 世界，值得留意的事</h2><p>关注 AI 行业与 AI 产品经理，从公开网站、社区、博客和社交平台发现内容。</p></div><span className="feed-edition">精选内容 · 非实时采集</span></div>
   <div className="feed-toolbar"><div className="feed-topic-filter" aria-label="资讯主题">{['全部','AI 行业','AI 产品经理'].map(t=><button key={t} className={topic===t?'active':''} aria-pressed={topic===t} onClick={()=>setTopic(t)}>{t}</button>)}</div><label className="feed-search"><Search size={16}/><input aria-label="搜索资讯" placeholder="搜索主题、关键词或来源" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="清空搜索" onClick={()=>setSearch('')}><X size={14}/></button>}</label></div>
   <div className="feed-layout"><div><div className="feed-list-tools"><label>来源 <select aria-label="筛选资讯来源" value={channel} onChange={e=>setChannel(e.target.value)}>{['全部来源','公开网站','博客','X / Twitter',...(savedOnly?['视频']:[])].map(c=><option key={c}>{c}</option>)}</select></label><span>{visible.length} 条内容</span><button className={savedOnly?'active':''} aria-pressed={savedOnly} onClick={()=>{setSavedOnly(!savedOnly);if(channel==='视频')setChannel('全部来源');}}><Bookmark size={14}/>{savedOnly?'已收藏':'只看收藏'}</button></div><div className="feed-grid">{visible.map(item=>card(item))}</div>{!visible.length&&<div className="feed-empty"><Search size={26}/><h3>{channel==='X / Twitter'?'X / Twitter 内容尚未接入':savedOnly?'还没有符合条件的收藏':'没有找到相关内容'}</h3><p>{channel==='X / Twitter'?'可以从右侧来源入口访问平台，接入采集后会在这里展示原帖。':'换个关键词或筛选条件，继续发现感兴趣的内容。'}</p><button className="btn secondary" onClick={()=>{setTopic('全部');setChannel('全部来源');setSearch('');setSavedOnly(false);}}>查看全部资讯</button></div>}</div>
   <aside className="feed-sidebar"><section><p className="eyebrow">发现内容的地方</p><h3>公开来源</h3><p className="feed-sidebar-copy">保留出处，回到原文了解完整背景。</p>{collectionSources.map(source=><a className="feed-source-entry" key={source.name} href={source.url} target="_blank" rel="noreferrer"><span className={`feed-source-mark mark-${source.mark.toLowerCase()}`}>{source.mark}</span><span><strong>{source.name}</strong><small>{source.kind} · {source.description}</small></span><ExternalLink size={13}/></a>)}<p className="feed-source-status">自动采集待接入。当前展示内置精选文章，X / Twitter 暂提供来源入口。</p></section><section className="feed-discovery-note"><Sparkles size={22}/><h3>看见之后，学深一点</h3><p>在“推荐”里，把你关注的主题与正在学习的知识连接起来。</p><button onClick={()=>switchTab('recommended')}>看看为我推荐的内容 <span>↗</span></button></section></aside></div>
  </>:<>
   <div className="feed-intro"><div><h2>从你的进度出发，多发现一点</h2><p>{state.events.length||memory.opened.length||memory.saved.length||memory.topics.length?'结合你的学习进度、关注主题和浏览偏好，为你安排下一步。':'先从基础内容开始。随着学习、浏览与收藏，推荐会逐渐贴近你的兴趣。'}</p></div><button className="learning-preferences" onClick={()=>setPreferences(true)}>调整推荐 <Settings2 size={14}/></button></div>
   <div className="feed-next-step"><LearningNextStep {...props}/></div>
   <div className="section-head feed-recommended-heading"><div><p className="eyebrow">与你有关的延伸阅读</p><h2>值得接着看</h2></div><span>文章 · 视频 · 产品实践</span></div>
   <div className="feed-grid recommendation-grid">{recommended.map(({item,reason})=>card(item,reason))}</div>
   {!recommended.length&&<div className="feed-empty"><h3>这批推荐都已隐藏</h3><p>可以恢复内容，或去资讯里自由探索。</p><button className="btn secondary" onClick={()=>update(d=>{d.dismissed=[];},'已恢复推荐内容')}>恢复推荐</button></div>}
  </>}
  </section>
 </div>;
}
