import type { Builder, Project } from './model';
export const weatherInputs=['sunny','rainy','windy'] as const;
export type Weather=typeof weatherInputs[number];
export const gearOptions=['cap','umbrella','scarf'] as const;
export type Gear=typeof gearOptions[number];
export const weatherLabels={sunny:'Sunshine',rainy:'Rain',windy:'Wind'};
export const gearLabels={cap:'A cap',umbrella:'An umbrella',scarf:'A scarf'};
export const themeLabels={sky:'Blue-sky club',lilac:'Lilac meadow',sunset:'Peachy picnic'};
export const correctWeatherRules={sunny:'cap',rainy:'umbrella',windy:'scarf'} as const;
export const weatherCases=[{id:'sunny',label:'Sunny picnic',sequence:['sunny']},{id:'rainy',label:'Rainy picnic',sequence:['rainy']},{id:'switch',label:'Weather changes',sequence:['rainy','sunny','windy','rainy']}] as const;
export type WeatherCase=typeof weatherCases[number]['id'];
/** One interpreter for preview, trace, tests and the saved playable app. */
export function weatherOutput(p:Pick<Project,'weatherRules'>,weather:Weather):Gear{
 if(!weatherInputs.includes(weather))throw new Error('Choose sunshine, rain or wind.');
 const gear=p.weatherRules[weather];if(!gearOptions.includes(gear))throw new Error('Choose a cap, umbrella or scarf.');return gear;
}
export function changeWeather(p:Project,change:Partial<Pick<Project,'weatherRules'|'weatherTheme'>>):Project{
 const rules=change.weatherRules??p.weatherRules,theme=change.weatherTheme??p.weatherTheme;
 if(!Object.hasOwn(themeLabels,theme)||weatherInputs.some(w=>!gearOptions.includes(rules[w])))throw new Error('That weather choice is not available.');
 if(theme===p.weatherTheme&&weatherInputs.every(w=>rules[w]===p.weatherRules[w]))return p;
 return {...p,weatherRules:{...rules},weatherTheme:theme,revision:p.revision+1,weatherTests:[],weatherPrediction:null,weatherPredictionChecked:false,weatherHistory:[...p.weatherHistory,{rules:{...p.weatherRules},theme:p.weatherTheme}].slice(-20),updatedAt:new Date().toISOString()};
}
export function undoWeather(p:Project):Project{
 const last=p.weatherHistory.at(-1);if(!last)return p;
 return {...changeWeather(p,{weatherRules:last.rules,weatherTheme:last.theme}),weatherHistory:p.weatherHistory.slice(0,-1)};
}
export function runWeatherCase(p:Project,id:WeatherCase):Project{
 const t=weatherCases.find(t=>t.id===id);if(!t)throw new Error('Unknown weather test.');
 return {...p,weatherTests:[...p.weatherTests.filter(t=>t.id!==id),{id,revision:p.revision,outputs:t.sequence.map(w=>weatherOutput(p,w))}],updatedAt:new Date().toISOString()};
}
export function weatherCasePassed(p:Project,id:WeatherCase){
 const t=weatherCases.find(t=>t.id===id);if(!t)return false;
 const evidence=p.weatherTests.find(e=>e.id===id&&e.revision===p.revision);
 return !!evidence&&evidence.outputs.length===t.sequence.length&&t.sequence.every((w,i)=>evidence.outputs[i]===correctWeatherRules[w]&&weatherOutput(p,w)===correctWeatherRules[w]);
}
export function weatherPredictionCorrect(p:Project){return p.weatherPredictionChecked&&p.weatherPrediction==='umbrella';}
export function weatherEligible(p:Project,b:Builder){
 const original=p.sourceId?b.projects.find(x=>x.id===p.sourceId):null;
 return (!p.sourceId||(!!original&&p.weatherTheme!==original.weatherTheme))&&weatherInputs.every(w=>p.weatherRules[w]===correctWeatherRules[w])&&weatherPredictionCorrect(p)&&weatherCases.every(t=>weatherCasePassed(p,t.id));
}
