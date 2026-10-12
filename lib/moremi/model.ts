import { z } from "zod";
import { stallEligible } from "./stall";
import { weatherEligible } from "./weather";
export const STORAGE_KEY = "moremi-maker-club:v1";
export const variants = ["puff-puff", "party", "picnic"] as const;
export const stages = ["challenge", "direction", "draft", "edit", "predict", "test", "handoff", "complete"] as const;
export type Stage = typeof stages[number];
export type Variant = typeof variants[number];
export const rules = ["add", "multiply", "subtract"] as const;
export type Rule = typeof rules[number];
export const counterConfig = {
  id:"puff-puff-counter",version:1,title:"Puff-puff Counter",starterPrice:100,
  tests:[{id:"two",quantity:2,label:"An order of two"},{id:"zero",quantity:0,label:"An empty order"},{id:"five",quantity:5,label:"A bigger order of five"}],rewardId:"market-basket",xp:50,
} as const;
const price=z.number().int().min(25).max(500), quantity=z.number().int().min(0).max(12);
const testSchema=z.object({id:z.enum(["two","zero","five"]),revision:z.number().int().nonnegative(),quantity,total:z.number().int().nonnegative()});
const gearSchema=z.enum(["cap","umbrella","scarf"]);
const weatherRulesSchema=z.object({sunny:gearSchema,rainy:gearSchema,windy:gearSchema});
const weatherThemeSchema=z.enum(["sky","lilac","sunset"]);
const projectSchema=z.object({
  kind:z.enum(["counter","stall","weather"]).default("counter"),
  id:z.string().min(1).max(100),sourceId:z.string().max(100).optional(),title:z.string().min(1).max(60),variant:z.enum(variants),
  unitPrice:price,quantity,rule:z.enum(rules).default("multiply"),revision:z.number().int().nonnegative(),stage:z.enum(stages),tests:z.array(testSchema).max(3),
  prediction:z.number().int().nonnegative().nullable(),predictionChecked:z.boolean().default(false),reflection:z.string().max(280),history:z.array(price).max(20),completed:z.boolean(),createdAt:z.string().datetime(),updatedAt:z.string().datetime(),
  product:z.enum(["mango","orange","puff-puff"]).default("mango"),stockStart:z.number().int().min(2).max(8).default(3),sellRule:z.enum(["remove-one","add-one","keep-same"]).default("add-one"),restockAmount:z.number().int().min(1).max(3).default(1),
  stockPrediction:z.number().int().min(0).max(12).nullable().default(null),stockPredictionChecked:z.boolean().default(false),
  stockTests:z.array(z.object({id:z.enum(["two-sales","empty-shelf","restock"]),revision:z.number().int().nonnegative(),stocks:z.array(z.number().int().min(0).max(100)).max(12),blocked:z.array(z.boolean()).max(12)})).max(3).default([]),
  weatherRules:weatherRulesSchema.default({sunny:"umbrella",rainy:"cap",windy:"cap"}),weatherTheme:weatherThemeSchema.default("sky"),
  weatherPrediction:gearSchema.nullable().default(null),weatherPredictionChecked:z.boolean().default(false),
  weatherTests:z.array(z.object({id:z.enum(["sunny","rainy","switch"]),revision:z.number().int().nonnegative(),outputs:z.array(gearSchema).max(4)})).max(3).default([]),
  weatherHistory:z.array(z.object({rules:weatherRulesSchema,theme:weatherThemeSchema})).max(20).default([]),
  stockHistory:z.array(z.object({stockStart:z.number().int().min(2).max(8),sellRule:z.enum(["remove-one","add-one","keep-same"]),restockAmount:z.number().int().min(1).max(3)})).max(20).default([]),
});
export type Project=z.infer<typeof projectSchema>;
export type ProjectKind=Project["kind"];
const builderSchema=z.object({id:z.string().min(1).max(100),nickname:z.string().min(1).max(40),avatar:z.enum(["blob","mushroom","frog"]),identity:z.enum(["boy","girl"]).nullable().default(null),profileComplete:z.boolean().default(false),draft:projectSchema.nullable(),pausedDrafts:z.array(projectSchema).max(12).default([]),projects:z.array(projectSchema).max(100),awards:z.array(z.enum(["core:puff-puff-counter","remix:puff-puff-counter","core:market-stall","remix:market-stall","core:weather-helper","remix:weather-helper"])).max(6)});
export type Builder=z.infer<typeof builderSchema>;
export const databaseSchema=z.object({schemaVersion:z.literal(1),revision:z.number().int().nonnegative(),activeBuilderId:z.string(),introSeen:z.boolean(),builders:z.array(builderSchema).min(1).max(8),settings:z.object({soundChosen:z.boolean().default(false),sound:z.boolean(),reduceMotion:z.boolean(),narration:z.boolean()})}).superRefine((d,c)=>{
  if(!d.builders.some(b=>b.id===d.activeBuilderId))c.addIssue({code:"custom",message:"Active maker is missing"});
  if(new Set(d.builders.map(b=>b.id)).size!==d.builders.length)c.addIssue({code:"custom",message:"Duplicate maker"});
  for(const b of d.builders){
    const drafts=[...(b.draft?[b.draft]:[]),...b.pausedDrafts];
    if(new Set(drafts.map(p=>p.kind)).size!==drafts.length)c.addIssue({code:"custom",message:"Duplicate adventure draft"});
    if(drafts.some(p=>p.completed))c.addIssue({code:"custom",message:"A completed project cannot be a draft"});
    if(new Set(b.projects.map(p=>p.id)).size!==b.projects.length)c.addIssue({code:"custom",message:"Duplicate project"});
    if(new Set(b.awards).size!==b.awards.length)c.addIssue({code:"custom",message:"Duplicate reward"});
    for(const award of b.awards){const kind=award.endsWith("weather-helper")?"weather":award.endsWith("market-stall")?"stall":"counter",remix=award.startsWith("remix:");if(!b.projects.some(p=>p.completed&&p.kind===kind&&!!p.sourceId===remix))c.addIssue({code:"custom",message:"Reward has no matching completed project"});}
  }
});
export type Database=z.infer<typeof databaseSchema>;
export function initialDatabase():Database{return{schemaVersion:1,revision:0,activeBuilderId:"maker-1",introSeen:false,builders:[{id:"maker-1",nickname:"Little Maker",avatar:"blob",identity:null,profileComplete:false,draft:null,pausedDrafts:[],projects:[],awards:[]}],settings:{soundChosen:false,sound:true,reduceMotion:false,narration:false}};}
export function newId(){return globalThis.crypto?.randomUUID?.()??`maker-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;}
export function createProject(variant:Variant="puff-puff",source?:Project):Project{
  const now=new Date().toISOString();return{id:newId(),sourceId:source?.id,kind:source?.kind??"counter",title:source?`${source.title.replace(/ remix$/,"")} remix`.slice(0,60):"My puff-puff counter",variant:source?.variant??variant,unitPrice:source?.unitPrice??100,quantity:1,rule:source?.rule??"add",revision:0,stage:source?"edit":"challenge",tests:[],prediction:null,predictionChecked:false,reflection:"",history:[],completed:false,createdAt:now,updatedAt:now,product:source?.product??"mango",stockStart:source?.stockStart??3,sellRule:source?.sellRule??"add-one",restockAmount:source?.restockAmount??1,stockPrediction:null,stockPredictionChecked:false,stockTests:[],stockHistory:[],weatherRules:source?{...source.weatherRules}:{sunny:"umbrella",rainy:"cap",windy:"cap"},weatherTheme:source?.weatherTheme??"sky",weatherPrediction:null,weatherPredictionChecked:false,weatherTests:[],weatherHistory:[]};
}
export function createStallProject(source?:Project):Project{return{...createProject("puff-puff",source),kind:"stall",title:source?`${source.title.replace(/ remix$/,"")} remix`.slice(0,60):"My fruit stall"};}
export function createWeatherProject(source?:Project):Project{return{...createProject("picnic",source),kind:"weather",title:source?`${source.title.replace(/ remix$/,"")} remix`.slice(0,60):"My weather helper"};}
export function activeBuilder(d:Database){return d.builders.find(b=>b.id===d.activeBuilderId)!;}
export function updateBuilder(d:Database,fn:(b:Builder)=>Builder):Database{return{...d,builders:d.builders.map(b=>b.id===d.activeBuilderId?fn(b):b)};}
/** One saved draft per adventure; changing games never discards the other draft. */
export function activateProject(d:Database,kind:ProjectKind="counter",source?:Project):Database{
  const b=activeBuilder(d),target=source?.kind??kind;
  if(b.draft?.kind===target)return d;
  const paused=b.pausedDrafts??[],resume=paused.find(p=>p.kind===target);
  const draft=resume??(target==="weather"?createWeatherProject(source):target==="stall"?createStallProject(source):createProject("puff-puff",source));
  return updateBuilder(d,b=>({...b,draft,pausedDrafts:[...paused.filter(p=>p.kind!==target),...(b.draft?[b.draft]:[])]}));
}
export function calculate(unitPrice:number,amount:number){price.parse(unitPrice);quantity.parse(amount);return unitPrice*amount;}
export function appTotal(p:Pick<Project,"unitPrice"|"quantity"|"rule">,amount=p.quantity){price.parse(p.unitPrice);quantity.parse(amount);return p.rule==="multiply"?p.unitPrice*amount:p.rule==="subtract"?p.unitPrice-amount:p.unitPrice+amount;}
export function changePrice(p:Project,value:number):Project{price.parse(value);if(value===p.unitPrice)return p;return{...p,unitPrice:value,revision:p.revision+1,tests:[],prediction:null,predictionChecked:false,history:[...p.history,p.unitPrice].slice(-20),updatedAt:new Date().toISOString()};}
export function changeRule(p:Project,value:Rule):Project{z.enum(rules).parse(value);if(value===p.rule)return p;return{...p,rule:value,revision:p.revision+1,tests:[],prediction:null,predictionChecked:false,updatedAt:new Date().toISOString()};}
export function undoPrice(p:Project):Project{if(!p.history.length)return p;return{...p,unitPrice:p.history[p.history.length-1],history:p.history.slice(0,-1),revision:p.revision+1,tests:[],prediction:null,predictionChecked:false,updatedAt:new Date().toISOString()};}
export function predictionCorrect(p:Project){return p.predictionChecked&&p.prediction===calculate(p.unitPrice,2);}
export function runCase(p:Project,id:"two"|"zero"|"five"):Project{const test=counterConfig.tests.find(t=>t.id===id);if(!test)throw new Error("Unknown test case.");const evidence={id,revision:p.revision,quantity:test.quantity,total:appTotal(p,test.quantity)};return{...p,quantity:test.quantity,tests:[...p.tests.filter(t=>t.id!==id),evidence],updatedAt:new Date().toISOString()};}
export function casePassed(p:Project,id:"two"|"zero"|"five"){const test=counterConfig.tests.find(t=>t.id===id)!;return p.tests.some(e=>e.id===id&&e.revision===p.revision&&e.quantity===test.quantity&&e.total===calculate(p.unitPrice,test.quantity));}
export function eligible(p:Project,b:Builder){if(p.kind==="weather")return weatherEligible(p,b);if(p.kind==="stall")return stallEligible(p,b);const original=p.sourceId?b.projects.find(x=>x.id===p.sourceId):null;const baseline=original?.unitPrice??counterConfig.starterPrice;return p.unitPrice!==baseline&&p.rule==="multiply"&&predictionCorrect(p)&&counterConfig.tests.every(t=>casePassed(p,t.id));}
export function finishProject(d:Database):Database{
  const b=activeBuilder(d),p=b.draft;if(!p||p.stage!=="handoff"||!eligible(p,b))throw new Error(p?.kind==="weather"?"Check your rain prediction and pass all three weather tests with your latest rules before saving.":p?.kind==="stall"?"Check your prediction and pass all three stall tests with your latest button rules before saving.":"Check your prediction and pass all three orders with your latest rule before saving.");
  const result={...p,completed:true,stage:"complete" as const,updatedAt:new Date().toISOString()};const award=p.kind==="weather"?(p.sourceId?"remix:weather-helper" as const:"core:weather-helper" as const):p.kind==="stall"?(p.sourceId?"remix:market-stall" as const:"core:market-stall" as const):(p.sourceId?"remix:puff-puff-counter" as const:"core:puff-puff-counter" as const);
  return updateBuilder(d,b=>({...b,draft:null,projects:[...b.projects.filter(x=>x.id!==p.id),result],awards:b.awards.includes(award)?b.awards:[...b.awards,award]}));
}
export function xp(b:Builder){return b.awards.reduce((total,a)=>total+(a.startsWith("core:")?50:10),0);}
export const levelThresholds=[0,100,250,450,600,720] as const;
export function level(b:Builder){return levelThresholds.filter(t=>xp(b)>=t).length;}
export function parseBackup(input:unknown):Database{return databaseSchema.parse(input);}
export function storeDatabase(current:Database,next:Database,storage:Pick<Storage,"getItem"|"setItem">):Database{
  const stored=storage.getItem(STORAGE_KEY);if(stored){const existing=databaseSchema.parse(JSON.parse(stored));if(existing.revision!==current.revision)throw new Error("Your work changed in another tab. Reload to use the latest saved version.");}
  const validated=databaseSchema.parse({...next,revision:current.revision+1});storage.setItem(STORAGE_KEY,JSON.stringify(validated));return validated;
}
export function importAsCopies(current:Database,backup:Database):Database{
  if(current.builders.length+backup.builders.length>8)throw new Error("There is room for eight local makers. Export your current work before importing a larger backup.");
  const copies=backup.builders.map(b=>({...b,id:newId(),nickname:`${b.nickname} (copy)`.slice(0,40)}));return{...current,builders:[...current.builders,...copies]};
}
