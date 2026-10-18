import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState, MockLearningAPI, submitChallenge, validateState} from '../src/engine.ts';
import {emptyFeedMemory, recommendFeed} from '../src/feed.ts';

test('recommendations work with old backups without feed memory and explain cold start',()=>{
 const state=initialState();
 assert.ok(recommendFeed(state).length>0);
 assert.ok(recommendFeed(state).every(r=>r.reason.includes('先探索')));
 assert.equal(validateState(state),true);
 state.feed=emptyFeedMemory();assert.equal(validateState(state),true);
 state.feed.opened=null;assert.equal(validateState(state),false);
});
test('review needs outweigh preference alone and cite the real learning gap',()=>{
 const state=initialState();state.feed={...emptyFeedMemory(),topics:['AI 编程']};
 state.drafts.Q05={choice:1,hint:false,seen:false,dirty:true};submitChallenge(state,'Q05');
 const ranked=recommendFeed(state);
 assert.ok(ranked[0].item.nodes.some(id=>['K04','K06'].includes(id)));
 assert.match(ranked[0].reason,/需要复核/);
});
test('topic, format and browsing affect ranking; disabled recording excludes implicit signals',()=>{
 const state=initialState();state.feed={...emptyFeedMemory(),topics:['RAG'],format:'视频'};
 assert.equal(recommendFeed(state)[0].item.lesson,'V02');
 state.feed={...emptyFeedMemory(),opened:['rag']};
 assert.equal(recommendFeed(state)[0].item.lesson,'V02');
 state.profile.recordPreferences=false;
 assert.ok(recommendFeed(state).every(r=>!r.reason.includes('打开过')));
 state.feed.saved=['rag'];
 assert.equal(recommendFeed(state)[0].item.lesson,'V02');
});
test('dismissals persist transactionally and can be undone without changing learning evidence',()=>{
 const state=initialState();let saved;
 const api=new MockLearningAPI(state,{setItem(_key,value){saved=JSON.parse(value);}});
 api.transaction(d=>{d.feed={...emptyFeedMemory(),dismissed:['agents']};});
 assert.ok(!recommendFeed(saved).some(r=>r.item.id==='agents'));
 api.transaction(d=>{d.feed.dismissed=[];});
 assert.ok(recommendFeed(api.state).some(r=>r.item.id==='agents'));
 assert.deepEqual(api.state.events,[]);assert.equal(api.state.agent.xp,0);
 const failing=new MockLearningAPI(state,{setItem(){throw Error('storage full');}});
 assert.throws(()=>failing.transaction(d=>{d.feed=emptyFeedMemory();}));
 assert.equal(failing.state.feed,undefined);
});
