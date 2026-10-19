import { test } from "node:test";
import assert from "node:assert/strict";
import { activeBuilder, appTotal, calculate, casePassed, changePrice, changeRule, createProject, eligible, finishProject, importAsCopies, initialDatabase, parseBackup, runCase, STORAGE_KEY, storeDatabase, undoPrice, updateBuilder, xp } from "../lib/moremi/model.ts";
import { moveStage } from "../lib/moremi/mission-machine.ts";

const storage = () => { const records = new Map(); return { getItem:key=>records.get(key)??null, setItem:(key,value)=>records.set(key,value) }; };
function tested(source) { let p=changeRule(changePrice(createProject("puff-puff",source),source?source.unitPrice+25:125),"multiply"); p={...p,buttonPlaced:true,buttonConnected:true,prediction:p.unitPrice*2,predictionChecked:true,stage:"test"}; p=runCase(runCase(runCase(p,"two"),"zero"),"five"); return {...p,stage:"handoff"}; }
function withDraft(d,p) { return updateBuilder(d,b=>({...b,draft:p})); }

test("calculator handles ordinary and empty orders; rejects invalid input",()=>{
  assert.equal(calculate(100,2),200); assert.equal(calculate(125,0),0); assert.equal(calculate(500,12),6000);
  for(const [p,q] of [[0,1],[501,1],[100,-1],[100,13],[100,0.5],[NaN,2]]) assert.throws(()=>calculate(p,q));
});
test("actual edits and undo invalidate predictions and old test evidence",()=>{
  const p=tested(); assert.equal(p.tests.length,3); const changed=changePrice(p,150);
  assert.equal(changed.revision,p.revision+1); assert.deepEqual(changed.tests,[]); assert.equal(changed.prediction,null);
  const undone=undoPrice(changed); assert.equal(undone.unitPrice,125); assert.equal(undone.revision,changed.revision+1); assert.deepEqual(undone.tests,[]);
  assert.strictEqual(changePrice(p,125),p);
});
test("checkpoint machine follows the intended journey and resumes a checkpoint",()=>{
  let stage="challenge"; for(const expected of ["direction","draft","edit","predict","test","handoff","complete"]){stage=moveStage(stage,"NEXT");assert.equal(stage,expected);}
  assert.equal(moveStage("test","BACK"),"predict");assert.equal(moveStage("challenge","BACK"),"challenge");
});
test("completion requires a changed rule, prediction and current three-order evidence",()=>{
  const d=initialDatabase(),p=tested(); assert(eligible(p,activeBuilder(d)));
  assert.throws(()=>finishProject(withDraft(d,{...p,tests:p.tests.slice(0,1)})));
  assert.throws(()=>finishProject(withDraft(d,{...p,stage:"edit"})));
  assert.throws(()=>finishProject(withDraft(d,{...p,prediction:null})));
  assert.throws(()=>finishProject(withDraft(d,{...p,tests:p.tests.map(t=>({...t,revision:0}))})));
  assert.throws(()=>finishProject(withDraft(d,{...p,unitPrice:100})));
  assert.throws(()=>finishProject(withDraft(d,{...p,prediction:450})));
  assert.throws(()=>finishProject(withDraft(d,{...p,predictionChecked:false})));
  // Correcting a prediction costs no work or reward; correctness is still required.
  assert.equal(xp(activeBuilder(finishProject(withDraft(d,p)))),50);
});
test("save once awards 50 XP, repeated completion cannot mint extra rewards",()=>{
  const d=finishProject(withDraft(initialDatabase(),tested()));
  assert.equal(activeBuilder(d).projects.length,1);assert.equal(activeBuilder(d).draft,null);assert.equal(xp(activeBuilder(d)),50);
  assert.throws(()=>finishProject(d)); assert.equal(xp(activeBuilder(d)),50);
  const again=finishProject(withDraft(d,tested()));assert.equal(activeBuilder(again).projects.length,2);assert.equal(xp(activeBuilder(again)),50);
});
test("remix keeps the original intact and grants its 10 XP bonus only once",()=>{
  let d=finishProject(withDraft(initialDatabase(),tested()));const original=structuredClone(activeBuilder(d).projects[0]);
  const remix=tested(original);assert.notEqual(remix.id,original.id);assert.equal(remix.sourceId,original.id);
  d=finishProject(withDraft(d,remix));assert.deepEqual(activeBuilder(d).projects[0],original);assert.equal(xp(activeBuilder(d)),60);
  d=finishProject(withDraft(d,tested(original)));assert.equal(xp(activeBuilder(d)),60);assert.equal(activeBuilder(d).projects.length,3);
});
test("storage round-trip restores drafts, tests and preferences",()=>{
  const s=storage(),d=initialDatabase();const pending={...withDraft(d,{...tested(),stage:"test"}),settings:{sound:true,reduceMotion:true,narration:false}};
  const saved=storeDatabase(d,pending,s);assert.equal(saved.revision,1);assert.deepEqual(parseBackup(JSON.parse(s.getItem(STORAGE_KEY))),JSON.parse(JSON.stringify(saved)));
});
test("a failed atomic write retains the preceding record and earns no reward",()=>{
  const s=storage(),draft=storeDatabase(initialDatabase(),withDraft(initialDatabase(),tested()),s);const before=s.getItem(STORAGE_KEY);
  const full={getItem:s.getItem,setItem(){throw new Error("QuotaExceededError");}};
  assert.throws(()=>storeDatabase(draft,finishProject(draft),full),/Quota/);assert.equal(s.getItem(STORAGE_KEY),before);assert.equal(xp(activeBuilder(parseBackup(JSON.parse(before)))),0);
});
test("stale tabs are rejected instead of overwriting newer work",()=>{
  const s=storage(),stale=initialDatabase(),saved=storeDatabase(stale,withDraft(stale,createProject()),s);
  assert.throws(()=>storeDatabase(stale,{...stale,introSeen:true},s),/another tab/);assert.equal(JSON.parse(s.getItem(STORAGE_KEY)).revision,saved.revision);
});
test("different makers cannot share drafts or earned work",()=>{
  let d=finishProject(withDraft(initialDatabase(),tested()));d={...d,builders:[...d.builders,{id:"maker-2",nickname:"Maker 2",avatar:"frog",draft:null,projects:[],awards:[]}],activeBuilderId:"maker-2"};
  d=withDraft(d,createProject());assert.equal(xp(activeBuilder(d)),0);assert.equal(activeBuilder(d).projects.length,0);assert.equal(d.builders[0].projects.length,1);assert.equal(d.builders[0].draft,null);
});
test("backup import validates first, adds separate copies and preserves current makers",()=>{
  const d=initialDatabase(),backup=finishProject(withDraft(initialDatabase(),tested()));const restored=importAsCopies(d,parseBackup(JSON.parse(JSON.stringify(backup))));
  assert.deepEqual(restored.builders[0],d.builders[0]);assert.notEqual(restored.builders[1].id,backup.builders[0].id);assert.equal(xp(restored.builders[1]),50);assert.equal(restored.activeBuilderId,d.activeBuilderId);
  assert.throws(()=>parseBackup({schemaVersion:99}));assert.throws(()=>parseBackup({...d,activeBuilderId:"missing"}));assert.throws(()=>parseBackup({...d,builders:[{...d.builders[0],awards:["core:puff-puff-counter"]}]}));
});


test("450 cannot earn a pass for two items costing 150 each",()=>{
  const d=initialDatabase(),p={...tested(),unitPrice:150,prediction:450};
  assert.equal(calculate(150,2),300);
  assert.equal(eligible(p,activeBuilder(d)),false);
  assert.throws(()=>finishProject(withDraft(d,p)));
  const corrected={...p,prediction:300,tests:[]};
  const retested=runCase(runCase(runCase(corrected,"two"),"zero"),"five");
  assert.equal(eligible(retested,activeBuilder(d)),true);
});

test("tests execute the chosen rule and reject wrong output rather than awarding a pass for a click",()=>{
  let p=changePrice(createProject(),150);
  p={...p,prediction:300,predictionChecked:true};
  assert.equal(appTotal(p,2),152);
  p=runCase(runCase(runCase(p,"two"),"zero"),"five");
  assert(p.tests.every(t=>!casePassed(p,t.id)));
  assert.equal(eligible(p,activeBuilder(initialDatabase())),false);
  const repaired=changeRule(p,"multiply");
  assert.equal(repaired.tests.length,0);assert.equal(repaired.predictionChecked,false);
  assert.equal(appTotal(repaired,2),300);assert.equal(appTotal(repaired,0),0);
});

test("older backups get safe additive defaults without losing completed creations",()=>{
  const saved=finishProject(withDraft(initialDatabase(),tested()));
  const raw=JSON.parse(JSON.stringify(saved));
  delete raw.builders[0].projects[0].rule;delete raw.builders[0].projects[0].predictionChecked;
  const restored=parseBackup(raw);
  assert.equal(restored.builders[0].projects[0].rule,"multiply");
  assert.equal(restored.builders[0].projects.length,1);assert.equal(xp(restored.builders[0]),50);
});
