"use client";
import {useEffect,useState} from 'react';
import {Check,ChevronLeft,Settings,Sparkles,X,Volume2} from 'lucide-react';
import {appTotal,casePassed,changePrice,changeRule,counterConfig,eligible,type Builder,type Project} from '@/lib/moremi/model';
import {changeStall,stallCasePassed,stallCases,stallEvent,stallSequence,stallPredictionCorrect,type StallEvent} from '@/lib/moremi/stall';
import {changeWeather,correctWeatherRules,gearOptions,weatherCasePassed,weatherCases,weatherInputs,weatherOutput,weatherPredictionCorrect,type Gear,type Weather} from '@/lib/moremi/weather';
import {deliverSnacks,deliverStall,deliverWeather} from '@/lib/moremi/play';
import {DragBoard,DragToy,DropSpot,HandHint,PlayStars,ToyArt,ToyScene,WeatherGlyph,type Sound} from './play-scene';
import {MoremiHead} from './animation';
const names={counter:'Blob’s snack shop',stall:'Mushroom’s fruit party',weather:'Cloud Sheep’s picnic'};
const titles={counter:'Feed the little foodies!',stall:'Fruit for everyone!',weather:'Let’s save the picnic!'};
const Button=({children,...props}:React.ComponentProps<'button'>)=><button className="clay-button tone-yellow" {...props}>{children}</button>;

export default function PlayMission({draft:p,builder,patch,finish,exit,settings,reduced,unsaved,sound}:{draft:Project;builder:Builder;patch:(fn:(p:Project)=>Project)=>boolean;finish:()=>void;exit:()=>void;settings:()=>void;reduced:boolean;unsaved:boolean;sound:Sound}){
 const phase=['challenge','direction','draft'].includes(p.stage)?'explore':p.stage==='edit'?'build':p.stage==='predict'&&p.kind!=='counter'?'predict':'play';
 const [count,setCount]=useState(0),[stock,setStock]=useState(p.stockStart),[weather,setWeather]=useState<Weather>('rainy'),[gear,setGear]=useState<Gear|null>(null);
 const [events,setEvents]=useState<StallEvent[]>([]),[visits,setVisits]=useState<Weather[]>([]),[introDone,setIntroDone]=useState(false),[touched,setTouched]=useState(false),[happy,setHappy]=useState(false),[message,setMessage]=useState('');
 const cases=p.kind==='counter'?counterConfig.tests:p.kind==='stall'?stallCases:weatherCases;
 const passed=(id:string)=>p.kind==='counter'?casePassed(p,id as 'two'|'zero'|'five'):p.kind==='stall'?stallCasePassed(p,id as typeof stallCases[number]['id']):weatherCasePassed(p,id as typeof weatherCases[number]['id']);
 const starCount=cases.filter(t=>passed(t.id)).length,roundIndex=cases.findIndex(t=>!passed(t.id)),round=Math.max(0,roundIndex),allDone=starCount===3&&eligible(p,builder);
 const counterCase=counterConfig.tests[round],stallCase=stallCases[round],weatherCase=weatherCases[round];
 const nextWeather=weatherCase.sequence[Math.min(visits.length,weatherCase.sequence.length-1)];
 const baseline=p.sourceId?builder.projects.find(x=>x.id===p.sourceId):undefined;
 const priceBase=baseline?.unitPrice??100,stockBase=baseline?.stockStart??3;
 useEffect(()=>{setCount(0);setStock(phase==='predict'&&p.kind==='stall'?p.stockStart-1:p.stockStart);setEvents([]);setVisits([]);setGear(null);setWeather('rainy');setTouched(false);},[p.id,p.revision,p.stage,roundIndex]);
 const feedback=(text:string,good=false)=>{setMessage(text);setHappy(good);sound(good?'success':'retry');};
 const move=(stage:Project['stage'])=>{patch(d=>({...d,stage}));setMessage('');setHappy(false);sound();};
 const stockMove=(event:StallEvent)=>{
  if(phase==='play'&&!allDone){const sequence=stallSequence(p,stallCase.id);if(sequence[events.length]!==event){feedback(sequence[events.length]==='sell'?'Give our friend a fruit first.':'Drop the refill crate in the basket.');return;}}
  const result=stallEvent(p,stock,event);setStock(result.stock);setCount(n=>event==='sell'&&!result.blocked?n+1:n);setTouched(true);sound();
  if(phase==='explore'){setIntroDone(true);feedback(result.stock>stock&&event==='sell'?'Sold one… it grew?! Let’s fix that!':'Yum! Let’s make the buttons.',true);return;}
  if(phase!=='play'||allDone)return;
  const next=[...events,event];setEvents(next);
  if(next.length===stallSequence(p,stallCase.id).length){try{const result=deliverStall(p,stallCase.id,next);patch(()=>result);feedback('Happy customer! You earned a star.',true);}catch(e){feedback((e as Error).message);setEvents([]);setStock(p.stockStart);setCount(0);}}
 };
 const drop=(target:string,payload:string)=>{
  setTouched(true);
  if(phase==='build'){
   if(target==='price'&&payload.startsWith('price:')){patch(d=>changePrice(d,Number(payload.slice(6))));sound();return;}
   if(target==='math'&&payload.startsWith('math:')){patch(d=>changeRule(d,payload.slice(5) as Project['rule']));sound();return;}
   if(target==='stock'&&payload.startsWith('stock:')){patch(d=>changeStall(d,{stockStart:Number(payload.slice(6))}));sound();return;}
   if(target==='sell'&&payload.startsWith('sell:')){patch(d=>changeStall(d,{sellRule:payload.slice(5) as Project['sellRule']}));sound();return;}
   if(target==='refill'&&payload.startsWith('refill:')){patch(d=>changeStall(d,{restockAmount:Number(payload.slice(7))}));sound();return;}
   if(target.startsWith('weather:')&&payload.startsWith('gear:')){const w=target.slice(8) as Weather;patch(d=>changeWeather(d,{weatherRules:{...d.weatherRules,[w]:payload.slice(5) as Gear}}));setWeather(w);setGear(payload.slice(5) as Gear);sound();return;}
  }
  if(p.kind==='counter'&&target==='basket'&&payload==='snack'){
   setCount(n=>Math.min(12,n+1));if(phase==='explore'&&count+1>=2){setIntroDone(true);feedback('Yum! Now give your shop a magic button.',true);}else sound();return;
  }
  if(p.kind==='stall'&&(target==='basket'||target==='friend')){if(payload==='fruit'){stockMove('sell');return;}if(payload==='crate'&&target==='basket'){stockMove('restock');return;}}
  if(p.kind==='weather'&&target==='dress'&&payload.startsWith('gear:')){
   const item=payload.slice(5) as Gear;setGear(item);
   if(phase==='predict'){patch(d=>({...d,weatherPrediction:item,weatherPredictionChecked:true}));feedback(item==='umbrella'?'Dry and cosy!':item==='cap'?'A soggy cap! Try something else.':'A soggy scarf! Try something else.',item==='umbrella');return;}
   if(phase==='explore'){const ok=item===correctWeatherRules[weather];setIntroDone(ok);feedback(ok?'Perfect! Now teach your toy to choose.':'Oops! Try a different thing.',ok);return;}
   if(phase==='play'&&!allDone){if(weather!==nextWeather){feedback('Tap the weather in the little picture.');return;}if(item!==weatherOutput(p,weather)||item!==correctWeatherRules[weather]){feedback('Oops! Reconnect that weather picture.');return;}const next=[...visits,weather];setVisits(next);feedback('Cosy! Who’s next?',true);if(next.length===weatherCase.sequence.length){patch(d=>deliverWeather(d,weatherCase.id,next));feedback('Picnic saved! You earned a star.',true);}return;}
  }
 };
 const serve=(payment:number)=>{setTouched(true);try{patch(d=>deliverSnacks(d,counterCase.id,count,payment));feedback('Nom nom! You earned a star.',true);}catch(e){feedback((e as Error).message);}};
 const finishPlay=()=>{if(!eligible(p,builder))return;if(patch(d=>({...d,stage:'handoff'})))finish();};
 const goal=phase==='explore'?p.kind==='counter'?<><span>2 please!</span><ToyArt name="puff-puff"/></>:p.kind==='stall'?<><span>One for me!</span><ToyArt name="mango"/></>:<><WeatherGlyph weather={weather}/><span>Dress me!</span></>:phase==='build'?<><Sparkles/><span>Make a little magic</span></>:phase==='predict'?p.kind==='weather'?<><WeatherGlyph weather="rainy"/><span>Keep me dry!</span></>:<span>One sold. How many stay?</span>:allDone?<><Check/><span>You made it!</span></>:p.kind==='counter'?<><strong>{counterCase.quantity}</strong><ToyArt name="puff-puff"/><span>{counterCase.quantity===0?'Just visiting!':'please!'}</span></>:p.kind==='stall'?<><ToyArt name="mango"/><span>{stallCase.id==='two-sales'?`Feed ${2-events.length} friends`:stallCase.id==='empty-shelf'?stock===0?'One more customer?':'Empty the shelf!':events.length===0?'Sell one':'Refill the shelf!'}</span></>:<><WeatherGlyph weather={nextWeather}/><span>{weatherCase.id==='switch'?`${visits.length+1} / 4`:'Picnic time!'}</span></>;
 const hintText=phase==='explore'?p.kind==='weather'?'Drag something onto Sheep.':p.kind==='counter'?'Drag snacks into the basket.':'Drag a fruit to our friend.':phase==='build'?p.kind==='weather'?'Match the pictures. Try your toy.':p.kind==='counter'?'Drop a price and a magic tile.':'Give each button a job.':phase==='predict'?p.kind==='weather'?'What keeps Sheep dry?':'Tap how many fruits are left.':allDone?'Your little app is ready!':p.kind==='counter'?'Fill the order. Tap the right total.':p.kind==='stall'?'Move the fruit. Follow the little picture.':'Tap the weather. Dress Sheep.';
 const canBuild=p.kind==='counter'?p.unitPrice!==priceBase:p.kind==='stall'?p.stockStart!==stockBase:!p.sourceId||p.weatherTheme!==baseline?.weatherTheme;
 const hasPrediction=p.kind==='weather'?weatherPredictionCorrect(p):stallPredictionCorrect(p);
 return <main className={`play-mission play-${p.kind} ${reduced?'toy-still':''}`}><header className="play-toolbar"><button className="icon-button" aria-label="Save and exit lesson" onClick={exit}><X/></button><span>{names[p.kind]}</span><PlayStars count={starCount}/><button className="icon-button" aria-label="Lesson settings" onClick={settings}><Settings/></button></header>
 <div className="play-heading"><span className="play-chapter">{phase==='explore'?'1 · PLAY':phase==='build'?'2 · MAKE': '3 · LET’S GO!'}</span><h1 tabIndex={-1}>{phase==='build'?'Make it yours!':phase==='play'&&allDone?'Look what you made!':titles[p.kind]}</h1></div>
 <DragBoard onDrop={drop} className={`play-stage-layout phase-${phase}`}>
 <section className="play-world"><ToyScene project={p} count={count} stock={stock} weather={phase==='predict'?'rainy':weather} gear={gear} onWeather={w=>{setWeather(w);setGear(null);setHappy(false);setTouched(true);sound();}} onRemove={()=>{if(p.kind==='counter'){setCount(n=>Math.max(0,n-1));sound();}}} goal={goal} happy={happy} hint={!touched&&phase!=='build'} reduced={reduced}/>
 <div className="moremi-play-tip"><MoremiHead expression="playful" reduced={reduced}/><p role="status">{message||hintText}</p></div>
 </section>
 <section className="play-controls" aria-label="Your toy tray">
 {phase==='build'?<>
 {p.kind==='counter'&&<><div className="picture-recipe"><DropSpot id="price" label="Set snack price"><span>One snack</span><strong>₦{p.unitPrice}</strong></DropSpot><DropSpot id="math" label="Set counting rule"><span>Magic tile</span><strong>{p.rule==='multiply'?'×':p.rule==='add'?'+':'−'}</strong></DropSpot><div><ToyArt name="puff-puff"/><span>Snacks</span></div></div><div className="toy-token-row">{[50,100,125,150].filter(n=>n!==priceBase).map(n=><DragToy key={n} payload={`price:${n}`} label={`Pick price ${n}`} className="coin-toy"><span>₦{n}</span></DragToy>)}</div><div className="toy-token-row">{(['multiply','add','subtract'] as const).map(r=><DragToy key={r} payload={`math:${r}`} label={`Pick ${r} tile`} className="rule-toy"><strong>{r==='multiply'?'×':r==='add'?'+':'−'}</strong></DragToy>)}</div><p className="tiny-play-copy">A price for every snack.</p></>}
 {p.kind==='stall'&&<><div className="picture-recipe"><DropSpot id="stock" label="Set starting fruit"><ToyArt name="mango"/><strong>{p.stockStart}</strong></DropSpot><DropSpot id="sell" label="Set sell action"><span>Sell</span><strong>{p.sellRule==='remove-one'?'−1':p.sellRule==='add-one'?'+1':'0'}</strong></DropSpot><DropSpot id="refill" label="Set refill action"><span>Refill</span><strong>+{p.restockAmount}</strong></DropSpot></div><div className="toy-token-row">{[3,4,5,6].filter(n=>n!==stockBase).map(n=><DragToy key={n} payload={`stock:${n}`} label={`Pick ${n} starting fruit`} className="stock-toy"><ToyArt name="mango"/><strong>{n}</strong></DragToy>)}</div><div className="toy-token-row"><DragToy payload="sell:remove-one" label="Pick take one tile" className="rule-toy pink-toy"><strong>−1</strong><span>Sell</span></DragToy><DragToy payload="sell:add-one" label="Pick add one sell tile" className="rule-toy pink-toy"><strong>+1</strong><span>Sell</span></DragToy><DragToy payload="refill:2" label="Pick refill two tile" className="rule-toy mint-toy"><strong>+2</strong><span>Refill</span></DragToy><DragToy payload="refill:1" label="Pick refill one tile" className="rule-toy mint-toy"><strong>+1</strong><span>Refill</span></DragToy></div></>}
 {p.kind==='weather'&&<><div className="weather-picture-rules">{weatherInputs.map(w=><DropSpot id={`weather:${w}`} label={`Connect ${w} picture`} key={w}><WeatherGlyph weather={w}/><span className="recipe-arrow">→</span><ToyArt name={p.weatherRules[w]}/><span className="sr-only">{p.weatherRules[w]}</span></DropSpot>)}</div><div className="toy-token-row gear-tray">{gearOptions.map(g=><DragToy key={g} payload={`gear:${g}`} label={`Pick up ${g}`}><ToyArt name={g}/></DragToy>)}</div><div className="toy-colours" aria-label="Choose your sky colour">{(['sky','lilac','sunset'] as const).map(t=><button key={t} className={`swatch-${t} ${p.weatherTheme===t?'selected':''}`} aria-label={`Choose ${t} sky`} aria-pressed={p.weatherTheme===t} onClick={()=>{patch(d=>changeWeather(d,{weatherTheme:t}));sound();}}>{p.weatherTheme===t&&<Check/>}</button>)}</div></>}
 <HandHint show={!touched} className="hint-to-recipe"/>
 </>:<>
 {p.kind==='counter'&&<><div className="toy-dock"><DragToy payload="snack" label="Pick up a puff-puff" className="snack-source"><ToyArt name="puff-puff"/><span>Grab me!</span></DragToy><button className="toy-clear" aria-label="Empty snack basket" onClick={()=>{setCount(0);sound();}}>Empty basket</button></div>{phase==='play'&&!allDone&&<div className="payment-cards" aria-label="Choose the order total">{[1,0,2].map(n=>p.unitPrice*(counterCase.quantity+n)).map(total=><button key={total} aria-label={`Pay ${total}`} className="coin-toy" onClick={()=>serve(total)}>₦{total}</button>)}</div>}</>}
 {p.kind==='stall'&&<>{phase==='predict'?<div className="fruit-answers">{[p.stockStart-1,p.stockStart,p.stockStart+1].map(n=><button key={n} aria-label={`Guess ${n} fruit left`} className={p.stockPrediction===n?'selected':''} onClick={()=>{patch(d=>({...d,stockPrediction:n,stockPredictionChecked:true}));feedback(n===p.stockStart-1?'Yes! One less fruit.':'Count the fruit. Try again.',n===p.stockStart-1);}}><ToyArt name="mango"/><strong>{n}</strong></button>)}</div>:<div className="toy-dock"><DragToy payload="crate" label="Pick up refill crate" className="refill-crate"><ToyArt name="mango"/><strong>+2</strong></DragToy>{stock===0&&<Button onClick={()=>stockMove('sell')}>One more customer?</Button>}</div>}</>}
 {p.kind==='weather'&&<div className="toy-token-row gear-tray">{(phase==='play'?[weatherOutput(p,weather)]:gearOptions).map(g=><DragToy key={g} payload={`gear:${g}`} label={`Pick up ${g}`}><ToyArt name={g}/></DragToy>)}</div>}
 </>}
 <div className="play-main-action">{phase==='explore'?<Button disabled={!introDone} onClick={()=>move('edit')}>Make my toy <Sparkles size={20}/></Button>:phase==='build'?<><Button disabled={!canBuild} onClick={()=>move(p.kind==='counter'?'test':'predict')}>Let’s play! <Sparkles size={20}/></Button>{!canBuild&&<p className="tiny-play-copy">{p.kind==='weather'?'Pick a new sky colour.':p.kind==='stall'?'Drop a new fruit number above.':'Drop a new price above.'}</p>}</>:phase==='predict'?<Button disabled={!hasPrediction} onClick={()=>move('test')}>Let’s go!</Button>:allDone?<Button onClick={finishPlay}>Keep my app <Check size={20}/></Button>:<button className="plain-link" onClick={()=>move('edit')}><ChevronLeft size={16}/> Change my tiles</button>}</div>
 <span className={`play-save ${unsaved?'warning':''}`}>{unsaved?'Your changes need saving':'Your toy saves as you play'}</span>
 </section></DragBoard></main>;
}
