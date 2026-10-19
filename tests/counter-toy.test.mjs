import {test} from 'node:test';
import assert from 'node:assert/strict';
import {configureButton,pressButton} from '../lib/moremi/counter-toy.ts';
import {createProject,parseBackup,initialDatabase,eligible,activeBuilder,changePrice,changeRule,runCase} from '../lib/moremi/model.ts';
test('a new app needs a placed, connected button; the same action handles boundaries',()=>{
 let p=createProject();assert.equal(p.buttonPlaced,false);assert.throws(()=>pressButton(p,0));p=configureButton(p,{buttonPlaced:true});assert.throws(()=>pressButton(p,0));p=configureButton(p,{buttonConnected:true});assert.equal(pressButton(p,0),1);assert.equal(pressButton(p,12),12);p=configureButton(p,{buttonAction:'take-one'});assert.equal(pressButton(p,2),1);assert.equal(pressButton(p,0),0);assert.throws(()=>pressButton(p,-1));assert.throws(()=>pressButton(p,.5));
});
test('changing component behaviour clears earned evidence and blocks completion',()=>{
 let p=configureButton(createProject(),{buttonPlaced:true,buttonConnected:true});p=changeRule(changePrice(p,150),'multiply');p={...p,prediction:300,predictionChecked:true,stage:'handoff'};for(const id of ['two','zero','five'])p=runCase(p,id);assert(eligible(p,activeBuilder(initialDatabase())));const changed=configureButton(p,{buttonAction:'take-one'});assert.equal(changed.tests.length,0);assert.equal(changed.predictionChecked,false);assert(!eligible(changed,activeBuilder(initialDatabase())));assert.equal(configureButton(p,{}),p);
});
test('old counters retain working buttons when a backup is opened',()=>{
 const d=initialDatabase(),p=createProject();delete p.buttonPlaced;delete p.buttonConnected;delete p.buttonAction;d.builders[0].draft=p;const restored=parseBackup(d).builders[0].draft;assert.equal(restored.buttonPlaced,true);assert.equal(restored.buttonConnected,true);assert.equal(pressButton(restored,0),1);
});
