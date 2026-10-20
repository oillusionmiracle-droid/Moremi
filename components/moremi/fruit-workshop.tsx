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
 const [stock,setStock]=useState(p.stockStart),[events,setEvents]=useState<StallEvent[]>([]),[served,setServed]=useState(0),[message,setMessage]=useState(''),[happy,setHappy]=useState(false),[touched,setTouched]=useState(false);
 const resetKey=`${p.id}:${p.revision}:${p.stage}:${round?.id??'done'}`,[previousKey,setPreviousKey]=useState(resetKey);
 if(previousKey!==resetKey){setPreviousKey(resetKey);setStock(p.stockStart);setEvents([]);setServed(0);setTouched(false);}
 const baseline=p.sourceId?builder.projects.find(x=>x.id===p.sourceId)?.stockStart??3:3;
 const built=p.stockStart!==baseline,finished=passed.length===3&&eligible(p,builder);
 const [editing,setEditing]=useState<'stock'|'sell'|'refill'|null>(null);
 const buildPart=editing??(!built?'stock':p.sellRule!=='remove-one'?'sell':p.restockAmount!==2?'refill':'ready');
 const nextEvent=round?stallSequence(p,round.id)[events.length]:undefined;
 const feedback=(text:string,ok=false)=>{setMessage(text);setHappy(ok);sound(ok?'success':'retry');};
 const drop=(target:string,value:string)=>{
  setTouched(true);setMessage('');setHappy(false);
  if(phase==='place'&&target==='display'&&value==='display'){if(patch(d=>({...d,stockDisplayPlaced:true,stage:'edit'})))feedback('Now the shop can remember its fruit!',true);return;}
  if(phase==='wire'&&target==='stock'&&value.startsWith('stock:')){patch(d=>changeStall(d,{stockStart:Number(value.slice(6))}));setEditing(null);feedback('Your display has a starting number. Now connect SELL.',true);return;}
  if(phase==='wire'&&target==='sell'&&value.startsWith('sell:')){patch(d=>changeStall(d,{sellRule:value.slice(5) as Project['sellRule']}));setEditing(null);feedback(value==='sell:remove-one'?'Connected: tap SELL → remove one fruit.':'Selling should remove a fruit. Try Remove 1.',value==='sell:remove-one');return;}
  if(phase==='wire'&&target==='refill'&&value.startsWith('refill:')){patch(d=>changeStall(d,{restockAmount:Number(value.slice(7))}));setEditing(null);feedback('Connected: tap REFILL → add two fruit.',true);return;}

 };
 const act=(event:StallEvent)=>{
  setTouched(true);
  if(phase==='place')return;
  if(phase==='predict'){
   if(event!=='sell'){feedback('Tap your SELL button. Watch the number change.');return;}
   const next=stallEvent(p,p.stockStart,'sell');setStock(next.stock);
   const ok=next.stock===p.stockStart-1;
   patch(d=>({...d,stockPrediction:next.stock,stockPredictionChecked:ok}));
   feedback(ok?'Your button ran its job. One fruit gone, and the number changed!':'Your button needs the Remove 1 job.',ok);return;
  }
  if(phase==='wire'&&buildPart!=='ready'){feedback('Connect the highlighted piece first. Then run your app.');return;}
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
 const title=phase==='place'?'Give the shop a memory!':phase==='wire'?(buildPart==='stock'?'Choose the starting number':buildPart==='sell'?'Make the SELL button work':buildPart==='refill'?'Connect a delivery button':'You built a shop app!'):phase==='predict'?'Run the app you built':finished?'Fruit for everyone!':round?.id==='two-sales'?'Here come two hungry friends!':round?.id==='empty-shelf'?'What if the shelf is empty?':'A delivery has arrived!';
 const hint=phase==='place'?'Drag the number window onto the shop.':phase==='wire'?(buildPart==='stock'?'This is the number your app remembers.':buildPart==='sell'?'When SELL is tapped, remove one from FRUIT LEFT.':buildPart==='refill'?'When REFILL is tapped, add two to FRUIT LEFT.':'Your connections are ready. Run your app!'):phase==='predict'?'Tap SELL in your app. Watch both the fruit and the number.':finished?'You built a shop that remembers.':nextEvent==='restock'?'Tap REFILL. Two more fruit should arrive.':stock===0?'A friend asks for one more. Tap SELL.':'Tap SELL. One fruit for our friend.';
 return <main className={`mw-screen mw-workshop mw-fruit-workshop ${reduced?'toy-still':''}`}><img className="mw-scene-bg" src="/art/world/fruit-shop.webp" alt=""/><div className="mw-workshop-vignette"/><header className="mw-lesson-hud"><button className="mw-round" aria-label="Save and exit lesson" onClick={exit}><X/></button><span>Mushroom’s fruit party</span><div className="mw-lesson-stars" aria-label={`${passed.length} of 3 stars`}>{[0,1,2].map(i=><Star key={i} fill={i<passed.length?'currentColor':'none'}/>)}</div><button className="mw-round" aria-label="Lesson settings" onClick={settings}><Settings/></button></header><h1 className="mw-goal-sign" tabIndex={-1}>{title}</h1>
 <DragBoard onDrop={drop} className={`mw-workshop-board phase-${phase}`}><div className="mw-shop-scene"><span className="mw-app-label">MY SHOP APP · LIVE PREVIEW</span><div className={`mw-fruit-friend ${happy?'fruit-happy':''}`}><img src="/art/mushroom-cutout.webp" alt="Mushroom at the fruit shop" draggable={false}/></div><div className="mw-fruit-request" aria-label={nextEvent==='restock'?'A delivery of two fruit':'A customer wants one fruit'}>{phase==='play'&&nextEvent==='restock'?<><PackagePlus/><strong>+2</strong></>:finished?<Check/>:<><ShoppingBag/><ToyArt name="mango"/><span>1</span></>}</div><div className="mw-stock-mount"><StockPad project={p} stock={stock} onSell={()=>act('sell')} onRefill={()=>act('restock')} placing={phase==='place'} reduced={reduced} delivered={served}/></div>{phase==='place'&&!touched&&<HandHint className="mw-placement-hand"/>}</div>
 <div className="mw-guide-line"><img src="/art/moremi-head-playful.webp" alt="Moremi"/><p role="status">{message||hint}</p></div>
 <section className="mw-parts-tray" aria-label="Building pieces">{phase==='place'?<div className="mw-single-part"><DragToy payload="display" label="Pick up the stock display" className="mw-display-part"><span>123</span></DragToy><span>Pick me up!</span></div>:phase==='wire'?<>

 <div className="mw-build-step">
 {buildPart==='stock'?<><h2>1 · Set the display</h2><div className="mw-guided-connection"><span>Start with</span><DropSpot id="stock" label="Set starting fruit"><ToyArt name="mango"/><strong>{p.stockStart}</strong></DropSpot></div><div className="mw-stock-pieces">{[4,5,6].filter(n=>n!==baseline).map(n=><DragToy key={n} payload={`stock:${n}`} label={`Pick ${n} starting fruit`}><ToyArt name="mango"/><strong>{n}</strong></DragToy>)}</div></>:
 buildPart==='sell'?<><h2>2 · Give SELL a job</h2><div className="mw-guided-connection"><span><ShoppingBag/> Tap SELL</span><ArrowRight/><DropSpot id="sell" label="Set sell action">Drop job</DropSpot></div><div className="mw-stock-pieces"><DragToy payload="sell:remove-one" label="Pick take one tile"><strong>Remove 1</strong></DragToy><DragToy payload="sell:add-one" label="Pick add one sell tile"><strong>Add 1</strong></DragToy></div><p>Change the FRUIT LEFT number.</p></>:
 buildPart==='refill'?<><h2>3 · Give REFILL a job</h2><div className="mw-guided-connection"><span><PackagePlus/> Tap REFILL</span><ArrowRight/><DropSpot id="refill" label="Set refill action">Drop job</DropSpot></div><div className="mw-stock-pieces"><DragToy payload="refill:2" label="Pick refill two tile"><strong>Add 2 fruit</strong></DragToy></div></>:
 <><h2>Your app’s two connections</h2><div className="mw-run-recipe"><span>SELL</span><ArrowRight/><span>Remove 1</span></div><div className="mw-run-recipe"><span>REFILL</span><ArrowRight/><span>Add 2</span></div><GameButton onClick={()=>move('predict')}>Run my app <ArrowRight/></GameButton><div className="mw-connection-summary"><button onClick={()=>setEditing('stock')}>Edit number</button><button onClick={()=>setEditing('sell')}>Edit SELL</button><button onClick={()=>setEditing('refill')}>Edit REFILL</button></div></>}
 </div>
 </>:phase==='predict'?<><div className="mw-run-recipe"><span>Tap SELL</span><ArrowRight/><span>Remove 1</span><ArrowRight/><span>Display changes</span></div><GameButton disabled={!stallPredictionCorrect(p)} onClick={()=>move('test')}>It works! Open the shop <ArrowRight/></GameButton><button className="mw-text-link" onClick={()=>move('edit')}>Change my jobs</button></>:finished?<><label className="mw-name-my-app" htmlFor="fruit-app-name">Name your shop app<input id="fruit-app-name" value={p.title} maxLength={60} onChange={e=>patch(d=>({...d,title:e.target.value||'My fruit shop'}))}/></label><GameButton onClick={()=>{if(patch(d=>({...d,stage:'handoff'})))finish();}}>Keep my app <Star fill="currentColor"/></GameButton></>:<><div className="mw-fruit-story-steps" aria-label="Current challenge">{stallCases.map(t=><span key={t.id} className={stallCasePassed(p,t.id)?'done':round?.id===t.id?'current':''}>{stallCasePassed(p,t.id)?<Check/>:t.id==='restock'?<PackagePlus/>:<ShoppingBag/>}<small>{t.id==='two-sales'?'2 friends':t.id==='empty-shelf'?'Empty shelf':'Delivery'}</small></span>)}</div><div className="mw-event-progress" aria-label="Customer progress">{round&&stallSequence(p,round.id).map((event,i)=><i key={i} className={i<events.length?'done':i===events.length?'current':''}>{event==='sell'?<ShoppingBag/>:<PackagePlus/>}</i>)}</div><button className="mw-text-link" onClick={()=>move('edit')}>Change my jobs</button></>}
 <span className="mw-save-caption">{unsaved?'Your changes need saving':'Saved as you play'}</span></section></DragBoard></main>;
}
