"use client";
/* eslint-disable @next/next/no-img-element -- Self-hosted optimized game artwork. */
import {useState} from 'react';
import {ArrowRight,Check,Settings,Star,X} from 'lucide-react';
import {eligible,type Builder,type Project} from '@/lib/moremi/model';
import {changeWeather,correctWeatherRules,gearLabels,gearOptions,weatherCases,weatherCasePassed,weatherInputs,weatherLabels,weatherOutput,weatherPredictionCorrect,type Weather,type Gear} from '@/lib/moremi/weather';
import {deliverWeather} from '@/lib/moremi/play';
import {DragBoard,DragToy,DropSpot,HandHint,ToyArt,WeatherGlyph,type Sound} from './play-scene';
import {WeatherPad} from './weather-pad';
import {GameButton} from './world-shell';

type Props={draft:Project;builder:Builder;patch:(fn:(p:Project)=>Project)=>boolean;finish:()=>void;exit:()=>void;settings:()=>void;reduced:boolean;unsaved:boolean;sound:Sound};
export default function WeatherWorkshop({draft:p,builder,patch,finish,exit,settings,reduced,unsaved,sound}:Props){
 const phase=['challenge','direction','draft'].includes(p.stage)?'place':p.stage==='edit'?'connect':p.stage==='predict'?'run':'test';
 const [weather,setWeather]=useState<Weather>('sunny'),[visits,setVisits]=useState<Weather[]>([]),[message,setMessage]=useState(''),[touched,setTouched]=useState(false),[editing,setEditing]=useState<Weather|null>(null);
 const round=weatherCases.find(t=>!weatherCasePassed(p,t.id)),passed=weatherCases.filter(t=>weatherCasePassed(p,t.id)).length;
 const resetKey=`${p.id}:${p.revision}:${p.stage}:${round?.id??'done'}`,[previousKey,setPreviousKey]=useState(resetKey);
 if(resetKey!==previousKey){setPreviousKey(resetKey);setWeather('sunny');setVisits([]);setTouched(false);}
 const connection=editing??weatherInputs.find(w=>p.weatherRules[w]!==correctWeatherRules[w]);
 const finished=passed===3&&eligible(p,builder),nextWeather=round?.sequence[visits.length];
 const feedback=(text:string,ok=false)=>{setMessage(text);sound(ok?'success':'retry');};
 const move=(stage:Project['stage'])=>{if(patch(d=>({...d,stage}))){setMessage('');setEditing(null);sound();}};
 const drop=(target:string,value:string)=>{
  setTouched(true);
  if(phase==='place'&&target==='weather-input'&&value==='weather-input'){if(patch(d=>({...d,stage:'edit'})))feedback('You added an input! Now tell your app what each weather means.',true);return;}
  if(phase==='connect'&&connection&&target===`weather:${connection}`&&value.startsWith('gear:')){
   const item=value.slice(5) as Gear,w=connection;
   if(!gearOptions.includes(item))return;
   patch(d=>changeWeather(d,{weatherRules:{...d.weatherRules,[w]:item}}));setWeather(w);setEditing(null);
   feedback(item===correctWeatherRules[w]?`Connected: ${weatherLabels[w]} → ${gearLabels[item]}.`:`That item will not help in ${weatherLabels[w].toLowerCase()}. Try another.`,item===correctWeatherRules[w]);return;
  }
  feedback('Match the item to the highlighted weather.');
 };
 const input=(w:Weather)=>{
  setWeather(w);setTouched(true);const actual=weatherOutput(p,w);
  if(phase==='connect'){feedback(`Your app chose ${gearLabels[actual].toLowerCase()} using its connection.`);return;}
  if(phase==='run'){
   if(w!=='rainy'){feedback('Try the Rain button. Does your app choose an umbrella?');return;}
   const ok=actual==='umbrella';patch(d=>({...d,weatherPrediction:actual,weatherPredictionChecked:ok}));
   feedback(ok?'You changed an input. Your app chose the umbrella by itself!':'The rain connection needs an umbrella.',ok);return;
  }
  if(phase!=='test'||finished)return;
  if(w!==nextWeather){feedback(`Your app still works. For this test, try ${nextWeather?weatherLabels[nextWeather]:'the next weather'}.`);return;}
  if(actual!==correctWeatherRules[w]){feedback('That output needs a different connection. Edit your rules.');return;}
  const next=[...visits,w];setVisits(next);
  if(round&&next.length===round.sequence.length){try{const result=deliverWeather(p,round.id,next);if(patch(()=>result))feedback('Your app chose correctly—all by itself!',true);}catch(e){feedback((e as Error).message);}}
  else feedback('The input changed, so your app changed its output.',true);
 };
 const title=phase==='place'?'Build Sheep a weather app':phase==='connect'?connection?`When it’s ${weatherLabels[connection].toLowerCase()}…`:'Your app has three rules!':phase==='run'?'Run your weather app':finished?'Your app can pack for Sheep!':'Change the weather. Watch your app.';
 const hint=phase==='place'?'Drag weather buttons into your empty app.':phase==='connect'?connection?'Connect an item. Your app will choose it whenever this weather happens.':'Your rules are ready. Run your app!':phase==='run'?'Tap Rain inside your app. No dragging an umbrella this time.':finished?'You made an app that chooses for itself.':`Try ${nextWeather?weatherLabels[nextWeather]:'the weather'}. Watch PACK THIS change automatically.`;
 return <main className={`mw-screen mw-workshop mw-weather-workshop ${reduced?'toy-still':''}`}><div className="mw-weather-hill"/><header className="mw-lesson-hud"><button className="mw-round" aria-label="Save and exit lesson" onClick={exit}><X/></button><span>Sheep’s weather app</span><div className="mw-lesson-stars" aria-label={`${passed} of 3 stars`}>{[0,1,2].map(i=><Star key={i} fill={i<passed?'currentColor':'none'}/>)}</div><button className="mw-round" aria-label="Lesson settings" onClick={settings}><Settings/></button></header><h1 className="mw-goal-sign" tabIndex={-1}>{title}</h1>
 <DragBoard onDrop={drop} className={`mw-workshop-board phase-${phase}`}><div className="mw-shop-scene"><img className="mw-weather-sheep" src="/art/world/sheep.webp" alt="Sheep needs an app to help pack for the picnic"/><span className="mw-sheep-story">What should I pack?</span><div className="mw-weather-pad-mount"><WeatherPad project={p} weather={weather} onWeather={input} placing={phase==='place'} reduced={reduced}/></div>{phase==='place'&&!touched&&<HandHint className="mw-placement-hand"/>}</div>
 <div className="mw-guide-line"><img src="/art/moremi-head-playful.webp" alt="Moremi"/><p role="status">{message||hint}</p></div>
 <section className="mw-parts-tray" aria-label="Building pieces">{phase==='place'?<div className="mw-single-part"><DragToy payload="weather-input" label="Pick up weather input" className="mw-weather-part"><WeatherGlyph weather="sunny"/><WeatherGlyph weather="rainy"/><WeatherGlyph weather="windy"/></DragToy><span>Add weather buttons</span></div>:phase==='connect'?<div className="mw-build-step">{connection?<><h2>IF weather is {weatherLabels[connection]}</h2><div className="mw-guided-connection"><span><WeatherGlyph weather={connection}/></span><ArrowRight/><DropSpot id={`weather:${connection}`} label={`Connect ${connection} picture`}><ToyArt name={p.weatherRules[connection]}/></DropSpot></div><p>THEN show this item in PACK THIS.</p><div className="mw-weather-items">{gearOptions.map(g=><DragToy key={g} payload={`gear:${g}`} label={`Pick up ${g}`}><ToyArt name={g}/><span>{gearLabels[g]}</span></DragToy>)}</div></>:<><div className="mw-weather-rules" aria-label="Your app rules">{weatherInputs.map(w=><button key={w} aria-label={`Edit ${w} rule`} onClick={()=>setEditing(w)}><WeatherGlyph weather={w}/><ArrowRight/><ToyArt name={p.weatherRules[w]}/></button>)}</div><GameButton onClick={()=>move('predict')}>Run my app <ArrowRight/></GameButton></>}
 {p.sourceId&&<div className="mw-connection-summary" aria-label="Remix app colour">{(['sky','lilac','sunset'] as const).map(t=><button key={t} aria-label={`Choose ${t} sky`} onClick={()=>patch(d=>changeWeather(d,{weatherTheme:t}))}>{t}</button>)}</div>}</div>:phase==='run'?<><div className="mw-run-recipe"><span>Rain input</span><ArrowRight/><span>Umbrella output</span></div><GameButton disabled={!weatherPredictionCorrect(p)} onClick={()=>move('test')}>It chose by itself! <ArrowRight/></GameButton><button className="mw-text-link" onClick={()=>move('edit')}>Edit my rules</button></>:finished?<><label className="mw-name-my-app" htmlFor="weather-app-name">Name your app<input id="weather-app-name" maxLength={60} value={p.title} onChange={e=>patch(d=>({...d,title:e.target.value||'My weather app'}))}/></label><GameButton onClick={()=>{if(patch(d=>({...d,stage:'handoff'})))finish();}}>Keep my app <Star fill="currentColor"/></GameButton></>:<><div className="mw-weather-test-prompt"><span>TRY THIS INPUT</span>{nextWeather&&<><WeatherGlyph weather={nextWeather}/><strong>{weatherLabels[nextWeather]}</strong></>}</div><div className="mw-event-progress" aria-label="Weather test progress">{round?.sequence.map((w,i)=><i key={i} className={i<visits.length?'done':i===visits.length?'current':''}><WeatherGlyph weather={w}/></i>)}</div><button className="mw-text-link" onClick={()=>move('edit')}>Edit my rules</button></>}<span className="mw-save-caption">{unsaved?'Your changes need saving':'Saved as you play'}</span></section></DragBoard></main>;
}
