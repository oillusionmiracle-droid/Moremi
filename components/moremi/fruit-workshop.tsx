"use client";
/* eslint-disable @next/next/no-img-element -- Optimized self-hosted game sprites. */
import {useState} from 'react';
import {ArrowRight,Check,PackagePlus,ShoppingBag,Star,X,Settings} from 'lucide-react';
import {eligible,type Builder,type Project} from '@/lib/moremi/model';
import {changeStall,stallCases,stallCasePassed,stallEvent,stallSequence,stallPredictionCorrect,type StallEvent} from '@/lib/moremi/stall';
import {deliverStall} from '@/lib/moremi/play';
import {DragBoard,DragToy,DropSpot,HandHint,ToyArt,type Sound} from './play-scene';
import {StockPad} from './stock-pad';
import {GameButton} from './world-shell';

type Props={draft:Project;builder:Builder;patch:(fn:(p:Project)=>Project)=>boolean;finish:()=>void;exit:()=>void;settings:()=>void;reduced:boolean;unsaved:boolean;sound:Sound};
export default function FruitWorkshop({draft:p,builder,patch,finish,exit,settings,reduced,unsaved,sound}:Props){
 const phase=!p.stockDisplayPlaced?'place':['challenge','direction','draft','edit'].includes(p.stage)?'wire':p.stage==='predict'?'predict':'play';
 const passed=stallCases.filter(t=>stallCasePassed(p,t.id)),round=stallCases.find(t=>!stallCasePassed(p,t.id));
 const [stock,setStock]=useState(p.stockStart),[events,setEvents]=useState<StallEvent[]>([]),[served,setServed]=useState(0),[message,setMessage]=useState(''),[happy,setHappy]=useState(false),[touched,setTouched]=useState(false),[predictionSeen,setPredictionSeen]=useState(false);
 const resetKey=`${p.id}:${p.revision}:${p.stage}:${round?.id??'done'}`,[previousKey,setPreviousKey]=useState(resetKey);
 if(previousKey!==resetKey){setPreviousKey(resetKey);setStock(p.stockStart);setEvents([]);setServed(0);setTouched(false);setPredictionSeen(false);}
 const baseline=p.sourceId?builder.projects.find(x=>x.id===p.sourceId)?.stockStart??3:3;
 const built=p.stockStart!==baseline,finished=passed.length===3&&eligible(p,builder);
 const nextEvent=round?stallSequence(p,round.id)[events.length]:undefined;
 const feedback=(text:string,ok=false)=>{setMessage(text);setHappy(ok);sound(ok?'success':'retry');};
 const drop=(target:string,value:string)=>{
  setTouched(true);setMessage('');setHappy(false);
  if(phase==='place'&&target==='display'&&value==='display'){if(patch(d=>({...d,stockDisplayPlaced:true,stage:'edit'})))feedback('Now the shop can remember its fruit!',true);return;}
  if(phase==='wire'&&target==='stock'&&value.startsWith('stock:')){patch(d=>changeStall(d,{stockStart:Number(value.slice(6))}));sound();return;}
  if(phase==='wire'&&target==='sell'&&value.startsWith('sell:')){patch(d=>changeStall(d,{sellRule:value.slice(5) as Project['sellRule']}));sound();return;}
  if(phase==='wire'&&target==='refill'&&value.startsWith('refill:')){patch(d=>changeStall(d,{restockAmount:Number(value.slice(7))}));sound();return;}
  if(phase==='predict'&&target==='forecast'&&value.startsWith('guess:')){patch(d=>({...d,stockPrediction:Number(value.slice(6)),stockPredictionChecked:false}));setPredictionSeen(false);setStock(p.stockStart);sound();}
 };
 const act=(event:StallEvent)=>{
  setTouched(true);
  if(phase==='place')return;
  if(phase==='predict'){
   if(event!=='sell'){feedback('Try one sale. What will be left?');return;}
   if(p.stockPrediction===null){feedback('Put your guess in the little window first.');return;}
   const next=stallEvent(p,p.stockStart,'sell');setStock(next.stock);setPredictionSeen(true);
   const ok=next.stock===p.stockStart-1&&p.stockPrediction===next.stock;
   patch(d=>({...d,stockPredictionChecked:ok}));feedback(ok?'Yes! One sold. One less on the shelf.':next.stock>=p.stockStart?'The shelf grew! Give SELL the −1 job.':'Look at the shelf. Try another guess.',ok);return;
  }
  if(phase==='wire'){const next=stallEvent(p,stock,event);setStock(next.stock);feedback(event==='sell'&&next.stock>stock?'Sold a fruit… and it grew?! Try the −1 job.':event==='restock'?'A delivery! The number remembers.':'One tap. Watch the shelf!',event==='sell'&&next.stock<stock);return;}
  if(finished)return;
  if(event!==nextEvent){feedback(nextEvent==='sell'?'A friend is waiting. Tap SELL.':'The delivery has arrived. Tap REFILL.');return;}
  const next=stallEvent(p,stock,event),expected=stallEvent({sellRule:'remove-one',restockAmount:2},stock,event);
  setStock(next.stock);
  if(next.stock!==expected.stock||next.blocked!==expected.blocked){setEvents([]);setServed(0);setStock(p.stockStart);feedback(event==='sell'?'Oops, the shelf grew. Change SELL to −1.':'That delivery needs two fruit. Change REFILL to +2.');return;}
  const sequence=[...events,event];setEvents(sequence);if(event==='sell'&&!next.blocked)setServed(n=>n+1);
  if(round&&sequence.length===stallSequence(p,round.id).length){try{const result=deliverStall(p,round.id,sequence);if(patch(()=>result))feedback(round.id==='restock'?'The shop works—even after a delivery!':round.id==='empty-shelf'?'Zero stays zero. No imaginary fruit!':'Two friends. The number remembered!',true);}catch(e){feedback((e as Error).message);}}
  else feedback(next.blocked?'Empty means empty.':event==='restock'?'Fresh fruit!':'Yum! Next friend!',true);
 };
 const move=(stage:Project['stage'])=>{if(patch(d=>({...d,stage}))){setMessage('');setHappy(false);sound();}};
 const title=phase==='place'?'Give the shop a memory!':phase==='wire'?'Two buttons. Two little jobs.':phase==='predict'?'One sold. What stays?':finished?'Fruit for everyone!':round?.id==='two-sales'?'Here come two hungry friends!':round?.id==='empty-shelf'?'What if the shelf is empty?':'A delivery has arrived!';
 const hint=phase==='place'?'Drag the number window onto the shop.':phase==='wire'?'Give SELL and REFILL a job. Tap them to try.':phase==='predict'?'Pick what will be left. Then tap SELL.':finished?'You built a shop that remembers.':nextEvent==='restock'?'Tap REFILL. Two more fruit should arrive.':stock===0?'A friend asks for one more. Tap SELL.':'Tap SELL. One fruit for our friend.';
 return <main className={`mw-screen mw-workshop mw-fruit-workshop ${reduced?'toy-still':''}`}><img className="mw-scene-bg" src="/art/world/fruit-shop.webp" alt=""/><div className="mw-workshop-vignette"/><header className="mw-lesson-hud"><button className="mw-round" aria-label="Save and exit lesson" onClick={exit}><X/></button><span>Mushroom’s fruit party</span><div className="mw-lesson-stars" aria-label={`${passed.length} of 3 stars`}>{[0,1,2].map(i=><Star key={i} fill={i<passed.length?'currentColor':'none'}/>)}</div><button className="mw-round" aria-label="Lesson settings" onClick={settings}><Settings/></button></header><h1 className="mw-goal-sign" tabIndex={-1}>{title}</h1>
 <DragBoard onDrop={drop} className={`mw-workshop-board phase-${phase}`}><div className="mw-shop-scene"><div className={`mw-fruit-friend ${happy?'fruit-happy':''}`}><img src="/art/mushroom-cutout.webp" alt="Mushroom at the fruit shop" draggable={false}/></div><div className="mw-fruit-request" aria-label={nextEvent==='restock'?'A delivery of two fruit':'A customer wants one fruit'}>{phase==='play'&&nextEvent==='restock'?<><PackagePlus/><strong>+2</strong></>:finished?<Check/>:<><ShoppingBag/><ToyArt name="mango"/><span>1</span></>}</div><div className="mw-stock-mount"><StockPad project={p} stock={stock} onSell={()=>act('sell')} onRefill={()=>act('restock')} placing={phase==='place'} reduced={reduced} delivered={served}/></div>{phase==='place'&&!touched&&<HandHint className="mw-placement-hand"/>}</div>
 <div className="mw-guide-line"><img src="/art/moremi-head-playful.webp" alt="Moremi"/><p role="status">{message||hint}</p></div>
 <section className="mw-parts-tray" aria-label="Building pieces">{phase==='place'?<div className="mw-single-part"><DragToy payload="display" label="Pick up the stock display" className="mw-display-part"><span>123</span></DragToy><span>Pick me up!</span></div>:phase==='wire'?<>
 <div className="mw-stock-recipe"><DropSpot id="stock" label="Set starting fruit"><ToyArt name="mango"/><strong>{p.stockStart}</strong></DropSpot><DropSpot id="sell" label="Set sell action"><ShoppingBag/><span>SELL</span><strong>{p.sellRule==='remove-one'?'−1':p.sellRule==='add-one'?'+1':'0'}</strong></DropSpot><DropSpot id="refill" label="Set refill action"><PackagePlus/><span>REFILL</span><strong>+{p.restockAmount}</strong></DropSpot></div>
 <div className="mw-stock-pieces">{[4,5,6].filter(n=>n!==baseline).map(n=><DragToy key={n} payload={`stock:${n}`} label={`Pick ${n} starting fruit`}><ToyArt name="mango"/><strong>{n}</strong></DragToy>)}<DragToy payload="sell:remove-one" label="Pick take one tile"><ShoppingBag/><strong>−1</strong></DragToy><DragToy payload="sell:add-one" label="Pick add one sell tile"><ShoppingBag/><strong>+1</strong></DragToy><DragToy payload="refill:2" label="Pick refill two tile"><PackagePlus/><strong>+2</strong></DragToy></div>
 <GameButton disabled={!built} onClick={()=>move('predict')}>Try my buttons! <ArrowRight/></GameButton>
 </>:phase==='predict'?<><div className="mw-forecast-row"><span><ShoppingBag/> 1 sold <ArrowRight/></span><DropSpot id="forecast" label="Put your fruit prediction here"><strong>{p.stockPrediction??'?'}</strong><ToyArt name="mango"/></DropSpot>{predictionSeen&&<span className="mw-forecast-result">{stock}<Check className={stallPredictionCorrect(p)?'correct':''}/></span>}</div><div className="mw-stock-pieces mw-guess-pieces">{[p.stockStart-1,p.stockStart,p.stockStart+1].map(n=><DragToy key={n} payload={`guess:${n}`} label={`Predict ${n} fruit left`}><strong>{n}</strong><ToyArt name="mango"/></DragToy>)}</div><GameButton disabled={!stallPredictionCorrect(p)} onClick={()=>move('test')}>Open the shop! <ArrowRight/></GameButton><button className="mw-text-link" onClick={()=>move('edit')}>Change my jobs</button></>:finished?<><label className="mw-name-my-app" htmlFor="fruit-app-name">Name your shop app<input id="fruit-app-name" value={p.title} maxLength={60} onChange={e=>patch(d=>({...d,title:e.target.value||'My fruit shop'}))}/></label><GameButton onClick={()=>{if(patch(d=>({...d,stage:'handoff'})))finish();}}>Keep my app <Star fill="currentColor"/></GameButton></>:<><div className="mw-fruit-story-steps" aria-label="Current challenge">{stallCases.map(t=><span key={t.id} className={stallCasePassed(p,t.id)?'done':round?.id===t.id?'current':''}>{stallCasePassed(p,t.id)?<Check/>:t.id==='restock'?<PackagePlus/>:<ShoppingBag/>}<small>{t.id==='two-sales'?'2 friends':t.id==='empty-shelf'?'Empty shelf':'Delivery'}</small></span>)}</div><div className="mw-event-progress" aria-label="Customer progress">{round&&stallSequence(p,round.id).map((event,i)=><i key={i} className={i<events.length?'done':i===events.length?'current':''}>{event==='sell'?<ShoppingBag/>:<PackagePlus/>}</i>)}</div><button className="mw-text-link" onClick={()=>move('edit')}>Change my jobs</button></>}
 <span className="mw-save-caption">{unsaved?'Your changes need saving':'Saved as you play'}</span></section></DragBoard></main>;
}
