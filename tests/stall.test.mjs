import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeBuilder, createProject, createStallProject, eligible, finishProject, initialDatabase, parseBackup, storeDatabase, updateBuilder, xp } from '../lib/moremi/model.ts';
import { changeStall, runStallCase, stallCasePassed, stallCases, stallEvent, traceStall, undoStall } from '../lib/moremi/stall.ts';
const withDraft=(d,p)=>updateBuilder(d,b=>({...b,draft:p}));
function complete(source){let p=changeStall(createStallProject(source),{stockStart:source?source.stockStart+1:4,sellRule:'remove-one',restockAmount:2});p={...p,stockPrediction:p.stockStart-1,stockPredictionChecked:true,stage:'handoff'};return stallCases.reduce((p,t)=>runStallCase(p,t.id),p);}
test('stall events remember successive changes, block empty sales and refill',()=>{
 const p=complete();let stock=4;stock=stallEvent(p,stock,'sell').stock;assert.equal(stock,3);stock=stallEvent(p,stock,'sell').stock;assert.equal(stock,2);assert.equal(stallEvent(p,stock,'restock').stock,4);
 assert.deepEqual(stallEvent(p,0,'sell'),{before:0,stock:0,blocked:true,event:'sell'});assert.equal(stallEvent(p,0,'restock').stock,2);
 assert.throws(()=>stallEvent(p,-1,'sell'));assert.throws(()=>stallEvent(p,1.5,'sell'));
});
test('both muddled buttons fail their stories; every intermediate change is checked',()=>{
 let p=createStallProject();for(const t of stallCases)p=runStallCase(p,t.id);
 assert(stallCases.every(t=>!stallCasePassed(p,t.id)));assert.equal(eligible(p,activeBuilder(initialDatabase())),false);
 const fixed=complete();assert.deepEqual(traceStall(fixed,'empty-shelf').map(s=>s.stock),[3,2,1,0,0]);assert.equal(traceStall(fixed,'empty-shelf').at(-1).blocked,true);
 const tampered={...fixed,stockTests:fixed.stockTests.map(t=>t.id==='two-sales'?{...t,stocks:[99,2]}:t)};assert.equal(stallCasePassed(tampered,'two-sales'),false);
 const partial=changeStall(fixed,{restockAmount:1});const tested=stallCases.reduce((p,t)=>runStallCase(p,t.id),partial);assert.equal(stallCasePassed(tested,'restock'),false);
});
test('edits and undo clear old predictions and evidence',()=>{
 const p=complete();const edited=changeStall(p,{stockStart:5});assert.equal(edited.revision,p.revision+1);assert.equal(edited.stockPrediction,null);assert.equal(edited.stockPredictionChecked,false);assert.deepEqual(edited.stockTests,[]);
 const undo=undoStall(edited);assert.equal(undo.stockStart,4);assert.equal(undo.revision,edited.revision+1);assert.deepEqual(undo.stockTests,[]);assert.strictEqual(changeStall(p,{stockStart:4}),p);
 for(const change of [{stockStart:9},{stockStart:1.5},{restockAmount:0},{sellRule:'wrong'}])assert.throws(()=>changeStall(p,change));
});
test('stall completion requires personalized stock, a correct prediction and latest tests',()=>{
 const d=initialDatabase(),p=complete();assert(eligible(p,activeBuilder(d)));
 for(const invalid of [{...p,stockPrediction:5},{...p,stockPredictionChecked:false},{...p,stockStart:3},{...p,sellRule:'add-one'},{...p,stockTests:p.stockTests.slice(0,2)},{...p,stockTests:p.stockTests.map(t=>({...t,revision:0}))}])assert.throws(()=>finishProject(withDraft(d,invalid)));
 assert.throws(()=>finishProject(withDraft(d,{...p,stage:'edit'})));
});
test('stall saves and remixes earn their own deduplicated rewards without changing originals',()=>{
 let d=finishProject(withDraft(initialDatabase(),complete()));const original=structuredClone(activeBuilder(d).projects[0]);assert.equal(xp(activeBuilder(d)),50);assert.deepEqual(activeBuilder(d).awards,['core:market-stall']);
 d=finishProject(withDraft(d,complete(original)));assert.equal(xp(activeBuilder(d)),60);assert.deepEqual(activeBuilder(d).projects[0],original);
 d=finishProject(withDraft(d,complete(original)));assert.equal(xp(activeBuilder(d)),60);assert.equal(activeBuilder(d).projects.length,3);
 assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(d))),JSON.parse(JSON.stringify(d)));
 const forged={...d,builders:[{...d.builders[0],awards:['core:puff-puff-counter']}]};assert.throws(()=>parseBackup(forged));
});
test('old counter backups upgrade additively; stall drafts and backups survive reload',()=>{
 const d=withDraft(initialDatabase(),createProject());const old=JSON.parse(JSON.stringify(d));for(const field of ['kind','product','stockStart','sellRule','restockAmount','stockPrediction','stockPredictionChecked','stockTests','stockHistory'])delete old.builders[0].draft[field];
 const upgraded=parseBackup(old);assert.equal(activeBuilder(upgraded).draft.kind,'counter');assert.equal(activeBuilder(upgraded).draft.title,'My puff-puff counter');
 const records=new Map(),storage={getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v)};const current=initialDatabase(),saved=storeDatabase(current,withDraft(current,{...complete(),stage:'test'}),storage);assert.deepEqual(parseBackup(JSON.parse([...records.values()][0])),JSON.parse(JSON.stringify(saved)));
 const failed={getItem:storage.getItem,setItem(){throw new Error('QuotaExceededError');}};assert.throws(()=>storeDatabase(saved,finishProject(withDraft(saved,complete())),failed));assert.equal(parseBackup(JSON.parse([...records.values()][0])).builders[0].projects.length,0);
});

test('adventure switching preserves both edited drafts and upgrades old backups',async()=>{
 const {activateProject}=await import('../lib/moremi/model.ts');
 let d=initialDatabase();d=activateProject(d,'counter');const counterId=activeBuilder(d).draft.id;
 d=updateBuilder(d,b=>({...b,draft:{...b.draft,unitPrice:175,stage:'edit'}}));
 d=activateProject(d,'stall');const stallId=activeBuilder(d).draft.id;
 assert.equal(activeBuilder(d).pausedDrafts[0].id,counterId);assert.equal(activeBuilder(d).pausedDrafts[0].unitPrice,175);
 d=updateBuilder(d,b=>({...b,draft:changeStall(b.draft,{stockStart:6})}));
 d=activateProject(d,'counter');assert.equal(activeBuilder(d).draft.id,counterId);assert.equal(activeBuilder(d).draft.stage,'edit');assert.equal(activeBuilder(d).pausedDrafts[0].id,stallId);
 d=parseBackup(JSON.parse(JSON.stringify(d)));d=activateProject(d,'stall');assert.equal(activeBuilder(d).draft.id,stallId);assert.equal(activeBuilder(d).draft.stockStart,6);assert.strictEqual(activateProject(d,'stall'),d);
 const legacy=JSON.parse(JSON.stringify(initialDatabase()));delete legacy.builders[0].pausedDrafts;assert.deepEqual(parseBackup(legacy).builders[0].pausedDrafts,[]);
 const duplicate=JSON.parse(JSON.stringify(d));duplicate.builders[0].pausedDrafts.push(duplicate.builders[0].draft);assert.throws(()=>parseBackup(duplicate));
});
