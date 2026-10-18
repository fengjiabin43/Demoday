import {lessons, sources} from './content';
import {getKnowledgeView, type State} from './engine';

export type FeedItem = {id:string;title:string;summary:string;source:string;channel:'公开网站'|'博客'|'视频';topic:'AI 行业'|'AI 产品经理';tags:string[];nodes:string[];format:'文章'|'视频';date:string;url?:string;lesson?:string;mark:string};
export type FeedMemory = {saved:string[];dismissed:string[];opened:string[];topics:string[];format:'全部'|'文章'|'视频'};
export const emptyFeedMemory=():FeedMemory=>({saved:[],dismissed:[],opened:[],topics:[],format:'全部'});
export const feedItems:FeedItem[]=[
 {id:'agents',title:'做 Agent 之前，先判断是否需要 Agent',summary:'从工作流与自主 Agent 的区别出发，理解复杂度、成本和可控性之间的取舍。',source:'Anthropic Engineering',channel:'公开网站',topic:'AI 产品经理',tags:['Agent','产品设计'],nodes:['K06','K07'],format:'文章',date:'2024-12-19',url:'https://www.anthropic.com/engineering/building-effective-agents',mark:'A'},
 {id:'coding',title:'AI 编程的实际经验：上下文、原型与验证',summary:'Simon Willison 分享如何与大模型协作写代码，以及为什么仍需要亲自验证结果。',source:'Simon Willison',channel:'博客',topic:'AI 行业',tags:['AI 编程','产品实践'],nodes:['K02','K07'],format:'文章',date:'2025-03-11',url:'https://simonwillison.net/2025/Mar/11/using-llms-for-code/',mark:'S'},
 {id:'rag',title:'理解 RAG：外部知识如何参与生成',summary:'从检索增强生成的原始论文，认识检索与生成的连接方式。',source:'arXiv · Lewis 等',channel:'公开网站',topic:'AI 行业',tags:['RAG','基础原理'],nodes:['K04','K05','K06'],format:'文章',date:'2020-05-22',url:sources[1].url,mark:'R'},
 {id:'grounding',title:'产品里的“可靠回答”，该如何检查？',summary:'阅读减少幻觉的官方指南，把不确定性、材料支持和核对步骤带进产品评审。',source:'Anthropic Docs',channel:'公开网站',topic:'AI 产品经理',tags:['产品评估','可靠性'],nodes:['K01','K02','K03'],format:'文章',date:'动态文档',url:sources[0].url,mark:'A'},
 {id:'evaluation',title:'别只看一个总分：拆开 AI 产品的评估维度',summary:'查阅评估指标模板，区分回答与依据的关系、具体任务要求和评估条件。',source:'Google Cloud',channel:'公开网站',topic:'AI 产品经理',tags:['产品评估','产品设计'],nodes:['K07','K08'],format:'文章',date:'动态文档',url:sources[2].url,mark:'G'},
 ...lessons.map(l=>({id:`feed-${l.id}`,title:l.title,summary:l.discovery,source:'识光 · 原创教学',channel:'视频' as const,topic:'AI 产品经理' as const,tags:l.chapter===2?['RAG','基础原理']:['产品评估','可靠性'],nodes:l.nodes,format:'视频' as const,date:'1 分钟',lesson:l.id,mark:'',})),
];
export const feedTags=['Agent','RAG','产品评估','AI 编程','产品设计','基础原理'];
export const collectionSources=[
 {name:'Anthropic',kind:'公开网站',description:'研究、产品与工程实践',url:'https://www.anthropic.com/engineering',mark:'A'},
 {name:'Hugging Face',kind:'社区博客',description:'开源模型与应用实践',url:'https://huggingface.co/blog',mark:'H'},
 {name:'Simon Willison',kind:'个人博客',description:'LLM 工具与实战观察',url:'https://simonwillison.net/',mark:'S'},
 {name:'X / Twitter',kind:'社交平台',description:'研究者与产品团队动态',url:'https://x.com/',mark:'X'},
];

export function recommendFeed(state:State){
 const memory=state.feed??emptyFeedMemory();
 const views=getKnowledgeView(state);
 // Preference recording also controls the use of browsing history in ranking.
 const opened=state.profile.recordPreferences?memory.opened:[];
 const signals=feedItems.filter(item=>memory.saved.includes(item.id)||opened.includes(item.id));
 const formatEvents=state.events.filter(e=>e.kind==='video'||e.kind==='reading');
 const lastFormat=state.profile.recordPreferences?formatEvents.at(-1)?.kind:undefined;
 return feedItems.filter(item=>!memory.dismissed.includes(item.id)).map(item=>{
  let score=0;const reasons:string[]=[];
  if(item.nodes.some(id=>views.some(v=>v.id===id&&v.review))){score+=12;reasons.push('补充你最近判断中需要复核的知识');}
  else if(item.nodes.some(id=>views.some(v=>v.id===id&&v.status>0))){score+=5;reasons.push('与你已经学过的知识相关');}
  if(item.tags.some(tag=>memory.topics.includes(tag))){score+=8;reasons.push('匹配你选择的关注主题');}
  if(signals.some(other=>other.id!==item.id&&other.tags.some(tag=>item.tags.includes(tag)))){score+=4;reasons.push('与你收藏或打开过的内容相关');}
  const preferred=memory.format!=='全部'?memory.format:lastFormat==='video'?'视频':lastFormat==='reading'?'文章':undefined;
  if(item.format===preferred){score+=3;reasons.push(memory.format==='全部'?'延续你最近的学习形式':`你偏好${preferred}内容`);}
  if(state.profile.goal===1&&item.topic==='AI 产品经理'){score+=2;reasons.push('适合你解决工作问题的目标');}
  if(opened.includes(item.id))score-=3;
  if(item.lesson&&state.events.some(e=>e.object===item.lesson&&['video','reading'].includes(e.kind)))score-=6;
  return {item,score,reason:reasons.slice(0,2).join(' · ')||'先探索一个主题，逐步找到你的兴趣'};
 }).sort((a,b)=>b.score-a.score);
}
