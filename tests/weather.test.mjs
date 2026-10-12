import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activeBuilder,activateProject,createProject,createWeatherProject,eligible,finishProject,initialDatabase,parseBackup,updateBuilder,xp} from '../lib/moremi/model.ts';
import {changeWeather,correctWeatherRules,runWeatherCase,undoWeather,weatherCasePassed,weatherCases,weatherOutput} from '../lib/moremi/weather.ts';
const withDraft=(d,p)=>updateBuilder(d,b=>({...b,draft:p}));
function tested(source){let p=changeWeather(createWeatherProject(source),{weatherRules:{...correctWeatherRules},weatherTheme:source?.weatherTheme==='lilac'?'sunset':'lilac'});p={...p,weatherPrediction:'umbrella',weatherPredictionChecked:true,stage:'handoff'};return weatherCases.reduce((p,t)=>runWeatherCase(p,t.id),p);}
test('weather inputs use the same rules across every switch, and invalid inputs fail',()=>{
 const p=tested();assert.deepEqual(['rainy','sunny','windy','rainy'].map(w=>weatherOutput(p,w)),['umbrella','cap','scarf','umbrella']);assert.throws(()=>weatherOutput(p,'snow'));assert.throws(()=>changeWeather(p,{weatherTheme:'bad'}));assert.throws(()=>changeWeather(p,{weatherRules:{...p.weatherRules,rainy:'nothing'}}));
});
test('muddled weather rules fail; switching evidence checks every output, not just the last',()=>{
 let p=createWeatherProject();for(const t of weatherCases)p=runWeatherCase(p,t.id);assert(weatherCases.every(t=>!weatherCasePassed(p,t.id)));assert(!eligible(p,activeBuilder(initialDatabase())));
 const good=tested(),tampered={...good,weatherTests:good.weatherTests.map(t=>t.id==='switch'?{...t,outputs:['umbrella','umbrella','scarf','umbrella']}:t)};assert(!weatherCasePassed(tampered,'switch'));
 const stale={...good,revision:good.revision+1};assert(weatherCases.every(t=>!weatherCasePassed(stale,t.id)));
});
test('rule edits, colour edits and undo invalidate prediction and tests',()=>{
 const p=tested(),edit=changeWeather(p,{weatherRules:{...p.weatherRules,rainy:'cap'}});assert.equal(edit.revision,p.revision+1);assert.deepEqual(edit.weatherTests,[]);assert.equal(edit.weatherPrediction,null);assert.equal(edit.weatherPredictionChecked,false);
 const undo=undoWeather(edit);assert.deepEqual(undo.weatherRules,p.weatherRules);assert.equal(undo.revision,edit.revision+1);assert.deepEqual(undo.weatherTests,[]);assert.strictEqual(changeWeather(p,{weatherTheme:p.weatherTheme}),p);
});
test('completion rejects unchecked predictions, missing tests, wrong rules and wrong stage',()=>{
 const d=initialDatabase(),p=tested();assert(eligible(p,activeBuilder(d)));
 for(const invalid of [{...p,weatherPrediction:'cap'},{...p,weatherPredictionChecked:false},{...p,weatherTests:p.weatherTests.slice(0,2)},{...p,weatherRules:{...p.weatherRules,windy:'cap'}},{...p,stage:'edit'}])assert.throws(()=>finishProject(withDraft(d,invalid)));
});
test('weather rewards deduplicate; remix is a changed copy, preserving the original',()=>{
 let d=finishProject(withDraft(initialDatabase(),tested()));const original=structuredClone(activeBuilder(d).projects[0]);assert.deepEqual(activeBuilder(d).awards,['core:weather-helper']);assert.equal(xp(activeBuilder(d)),50);
 const unchanged=createWeatherProject(original);const evidence=weatherCases.reduce((p,t)=>runWeatherCase(p,t.id),{...unchanged,weatherPrediction:'umbrella',weatherPredictionChecked:true,stage:'handoff'});assert.throws(()=>finishProject(withDraft(d,evidence)));
 d=finishProject(withDraft(d,tested(original)));assert.equal(xp(activeBuilder(d)),60);assert.deepEqual(activeBuilder(d).projects[0],original);d=finishProject(withDraft(d,tested(original)));assert.equal(xp(activeBuilder(d)),60);assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(d))),JSON.parse(JSON.stringify(d)));
 const forged=structuredClone(d);forged.builders[0].awards=['core:market-stall'];assert.throws(()=>parseBackup(forged));
});
test('three drafts switch safely and old backups receive additive weather defaults',()=>{
 let d=initialDatabase();d=activateProject(d,'counter');const counter=activeBuilder(d).draft.id;d=activateProject(d,'stall');const stall=activeBuilder(d).draft.id;d=activateProject(d,'weather');const weather=activeBuilder(d).draft.id;
 d=withDraft(d,{...tested(),id:weather,stage:'test'});d=activateProject(d,'counter');assert.equal(activeBuilder(d).draft.id,counter);assert.equal(activeBuilder(d).pausedDrafts.length,2);d=parseBackup(JSON.parse(JSON.stringify(d)));d=activateProject(d,'weather');assert.equal(activeBuilder(d).draft.id,weather);assert.equal(activeBuilder(d).draft.weatherTests.length,3);d=activateProject(d,'stall');assert.equal(activeBuilder(d).draft.id,stall);
 const old=withDraft(initialDatabase(),createProject());for(const key of Object.keys(old.builders[0].draft).filter(k=>k.startsWith('weather')))delete old.builders[0].draft[key];const upgraded=parseBackup(old);assert.equal(upgraded.builders[0].draft.kind,'counter');assert.equal(upgraded.builders[0].draft.weatherTheme,'sky');
});
