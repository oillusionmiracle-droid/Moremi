"use client";
/* eslint-disable @next/next/no-img-element -- Optimized self-hosted WebP game art. */
import {useState} from 'react';
import {ArrowRight,Check,Hand,Link2,Minus,Plus,Settings,Sparkles,Star,X} from 'lucide-react';
import {appTotal,casePassed,changePrice,changeRule,counterConfig,eligible,type Builder,type Project} from '@/lib/moremi/model';
import {configureButton,pressButton,type ButtonAction} from '@/lib/moremi/counter-toy';
import {deliverSnacks} from '@/lib/moremi/play';
import {DragBoard,DragToy,DropSpot,HandHint,ToyArt,type Sound} from './play-scene';
import {CounterPad} from './counter-pad';
import {GameButton} from './world-shell';

type Props={draft:Project;builder:Builder;patch:(fn:(p:Project)=>Project)=>boolean;finish:()=>void;exit:()=>void;settings:()=>void;reduced:boolean;unsaved:boolean;sound:Sound};
export default function BlobWorkshop({draft:p,builder,patch,finish,exit,settings,reduced,unsaved,sound}:Props){
 const phase=!p.buttonPlaced?'place':!p.buttonConnected?'wire':['challenge','direction','draft'].includes(p.stage)?'try':p.stage==='edit'?'price':'orders';
 const passed=counterConfig.tests.filter(t=>casePassed(p,t.id)),round=counterConfig.tests.find(t=>!casePassed(p,t.id));
 const [count,setCount]=useState(0),[message,setMessage]=useState(''),[pulse,setPulse]=useState(0),[touched,setTouched]=useState(false),[happy,setHappy]=useState(false);
 const resetKey=`${p.id}:${p.revision}:${p.stage}:${round?.id??'done'}`;
 const [previousKey,setPreviousKey]=useState(resetKey);
 if(previousKey!==resetKey){setPreviousKey(resetKey);setCount(0);setTouched(false);}
 const baseline=p.sourceId?builder.projects.find(x=>x.id===p.sourceId)?.unitPrice??100:100;
 const finished=passed.length===3&&eligible(p,builder),headings={place:'Give Blob a button!',wire:'Give your button a job!',try:'Let’s try your button!',price:'Make the total work!',orders:finished?'Look what you made!':'Shop’s open. Try an order!'};
 const hints={place:'Drag the button onto the pad.',wire:'When I tap… what should happen?',try:'Press your button. Make 2 snacks!',price:'One price. Every snack. Connect the pieces.',orders:finished?'Your app works. Give it a name!':round?.quantity===0?'No snacks today. Does your app show zero?':`Make an order of ${round?.quantity??0}. Then serve it!`};
 const feedback=(text:string,ok=false)=>{setMessage(text);setHappy(ok);sound(ok?'success':'retry');};
 const drop=(target:string,value:string)=>{
  setTouched(true);setMessage('');setHappy(false);
  if(target==='pad'&&value==='button'&&phase==='place'){patch(d=>({...configureButton(d,{buttonPlaced:true}),stage:'direction'}));feedback('A button! Now give it a job.',true);return;}
  if(target==='job'&&value.startsWith('job:')){patch(d=>({...configureButton(d,{buttonConnected:true,buttonAction:value.slice(4) as ButtonAction}),stage:'draft'}));feedback('Connected! Give it a tap.',true);return;}
  if(target==='price'&&value.startsWith('price:')){patch(d=>changePrice(d,Number(value.slice(6))));sound();return;}
  if(target==='math'&&value.startsWith('math:')){patch(d=>changeRule(d,value.slice(5) as Project['rule']));sound();return;}
 };
 const press=()=>{setTouched(true);try{const next=pressButton(p,count);setCount(next);setPulse(n=>n+1);setHappy(false);sound();if(p.buttonAction==='take-one')feedback('That takes one away! Try the +1 job.');else if(phase==='try'&&next===2)feedback('Tap → add one → the screen changes!',true);else setMessage('');}catch(e){feedback((e as Error).message);}};
 const clear=()=>{setCount(0);setTouched(true);setMessage('');sound();};
 const changeJob=()=>{patch(d=>({...configureButton(d,{buttonConnected:false}),stage:'direction'}));setMessage('');};
 const serve=()=>{setTouched(true);if(!round)return;try{if(p.rule!=='multiply')throw new Error('The total looks funny. Connect the × tile.');patch(d=>deliverSnacks(d,round.id,count,appTotal(d,count)));feedback(round.id==='five'?'You did it! Blob can use your app.':'Yum! Another happy customer.',true);}catch(e){feedback(count!==round.quantity?`This friend asked for ${round.quantity} snacks. Try your button!`:(e as Error).message);}};
 const save=()=>{if(!finished)return;if(patch(d=>({...d,stage:'handoff'})))finish();};
 return <main className={`mw-screen mw-workshop ${reduced?'toy-still':''}`}><img className="mw-scene-bg" src="/art/world/stall.webp" alt=""/><div className="mw-workshop-vignette"/><header className="mw-lesson-hud"><button className="mw-round" aria-label="Save and exit lesson" onClick={exit}><X/></button><span>Blob’s shop</span><div className="mw-lesson-stars" aria-label={`${passed.length} of 3 stars`}>{[0,1,2].map(i=><Star key={i} fill={i<passed.length?'currentColor':'none'} className={i<passed.length?'earned':''}/>)}</div><button className="mw-round" aria-label="Lesson settings" onClick={settings}><Settings/></button></header>
 <h1 className="mw-goal-sign" tabIndex={-1}>{headings[phase]}</h1>
 <DragBoard onDrop={drop} className={`mw-workshop-board phase-${phase}`}>
 <div className="mw-shop-scene"><div className={`mw-shop-blob ${happy?'blob-delighted':''}`} key={happy?`happy-${p.tests.length}`:'idle'}><img src="/art/world/blob.webp" alt="Blob at his snack shop" draggable={false}/></div><div className="mw-order-request" aria-label={phase==='orders'&&!finished?`Customer wants ${round?.quantity} snacks`:'Blob needs a working app'}>{phase==='orders'&&!finished?<><strong>{round?.quantity}</strong><ToyArt name="puff-puff"/></>:happy?<Check/>:phase==='wire'?<Link2/>:<Plus/>}</div><div className="mw-pad-mount"><CounterPad project={p} count={count} onPress={press} onClear={clear} placing={phase==='place'} reduced={reduced} pulse={pulse}/></div>{!touched&&phase==='place'&&<HandHint className="mw-placement-hand"/>}{happy&&<span className="mw-blob-pop" aria-hidden="true">✦ ✦ ✦</span>}</div>
 <div className="mw-guide-line"><img src="/art/moremi-head-playful.webp" alt="Moremi"/><p role="status">{message||hints[phase]}</p></div>
 <section className="mw-parts-tray" aria-label="Building pieces">
 {phase==='place'?<div className="mw-single-part"><DragToy payload="button" label="Pick up the plus button" className="mw-drag-button"><Plus strokeWidth={4}/></DragToy><span>Pick me up!</span></div>:phase==='wire'?<><div className="mw-connection-row"><span><Hand/> TAP</span><ArrowRight/><DropSpot id="job" label="Connect the button job" className="mw-job-socket"><Link2/><span>Drop a job</span></DropSpot></div><div className="mw-job-parts"><DragToy payload="job:add-one" label="Pick add one job"><Plus/><strong>1</strong></DragToy><DragToy payload="job:take-one" label="Pick take one job"><Minus/><strong>1</strong></DragToy></div></>:phase==='try'?<><div className="mw-flow-line" aria-label="Your button recipe"><Hand/><ArrowRight/><span>{p.buttonAction==='add-one'?'+1':'−1'}</span><ArrowRight/><span>{count}</span></div><GameButton disabled={count!==2||p.buttonAction!=='add-one'} onClick={()=>{patch(d=>({...d,stage:'edit'}));setMessage('');sound('success');}}>It works! <ArrowRight/></GameButton><button className="mw-text-link" onClick={changeJob}>Change its job</button></>:phase==='price'?<><div className="mw-price-recipe"><DropSpot id="price" label="Set snack price"><small>ONE SNACK</small><strong>₦{p.unitPrice}</strong></DropSpot><DropSpot id="math" label="Set counting rule"><small>MAGIC TILE</small><strong>{p.rule==='multiply'?'×':p.rule==='add'?'+':'−'}</strong></DropSpot><div><small>ORDER</small><ToyArt name="puff-puff"/></div></div><div className="mw-price-pieces">{[50,125,150].filter(n=>n!==baseline).map(n=><DragToy key={n} payload={`price:${n}`} label={`Pick price ${n}`} className="mw-coin-part">₦{n}</DragToy>)}{(['multiply','add'] as const).map(rule=><DragToy key={rule} payload={`math:${rule}`} label={`Pick ${rule} tile`} className="mw-math-part">{rule==='multiply'?'×':'+'}</DragToy>)}</div><GameButton disabled={p.unitPrice===baseline} onClick={()=>{patch(d=>({...d,stage:'test'}));setMessage('');sound();}}>Try my app! <Sparkles/></GameButton></>:finished?<><label className="mw-name-my-app" htmlFor="snack-app-name">Name your creation<input id="snack-app-name" value={p.title} maxLength={60} onChange={e=>patch(d=>({...d,title:e.target.value||'My snack app'}))}/></label><GameButton onClick={save}>Keep my app <Star fill="currentColor"/></GameButton></>:<><div className="mw-order-pips" aria-hidden="true">{counterConfig.tests.map(t=><span key={t.id} className={casePassed(p,t.id)?'done':''}>{casePassed(p,t.id)?<Check size={15}/>:t.quantity}<ToyArt name="puff-puff"/></span>)}</div><GameButton onClick={serve}>Serve! <ArrowRight/></GameButton><button className="mw-text-link" onClick={()=>{patch(d=>({...d,stage:'edit'}));setMessage('');}}>Change my tiles</button></>}
 {phase!=='place'&&phase!=='wire'&&<span className="mw-save-caption">{unsaved?'Your changes need saving':'Saved as you play'}</span>}
 </section></DragBoard></main>;
}
