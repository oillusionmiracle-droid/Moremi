import { appTotal, calculate, runCase, type Project } from './model';
import { runStallCase, stallSequence, traceStall, type StallCase, type StallEvent } from './stall';
import { correctWeatherRules, runWeatherCase, weatherCases, weatherOutput, type Weather, type WeatherCase } from './weather';

/** Evidence is earned by the child's actions in the play scene, never by opening it. */
export function deliverSnacks(p:Project,id:'two'|'zero'|'five',count:number,payment:number):Project {
 const needed=id==='two'?2:id==='zero'?0:5;
 if(count!==needed)throw new Error(`Pop ${needed} snacks in the basket.`);
 if(payment!==calculate(p.unitPrice,count))throw new Error('Try another coin card.');
 if(appTotal(p,count)!==payment)throw new Error('Oops! Fix the machine with ×.');
 const checked=id==='two'?{...p,prediction:payment,predictionChecked:true}:p;
 return runCase(checked,id);
}
export function deliverStall(p:Project,id:StallCase,events:StallEvent[]):Project {
 const expected=stallSequence(p,id);
 if(events.length!==expected.length||events.some((e,i)=>e!==expected[i]))throw new Error('Try those moves again.');
 const actual=traceStall(p,id),wanted=traceStall(p,id,true);
 if(actual.some((s,i)=>s.stock!==wanted[i].stock||s.blocked!==wanted[i].blocked))throw new Error('Oops! Fix the button tiles.');
 return runStallCase(p,id);
}
export function deliverWeather(p:Project,id:WeatherCase,visits:Weather[]):Project {
 const t=weatherCases.find(t=>t.id===id);if(!t||visits.length!==t.sequence.length||visits.some((w,i)=>w!==t.sequence[i]))throw new Error('Try the weather on the picture.');
 if(visits.some(w=>weatherOutput(p,w)!==correctWeatherRules[w]))throw new Error('Oops! Reconnect that picture tile.');
 return runWeatherCase(p,id);
}
