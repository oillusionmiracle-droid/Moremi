"use client";
/* eslint-disable @next/next/no-img-element -- Small self-hosted game sprites. */
import {createContext,useContext,useRef,useState,type ReactNode} from 'react';
import {motion} from 'motion/react';
import {CloudRain,Sun,Wind,Check,Sparkles} from 'lucide-react';
import type {Project} from '@/lib/moremi/model';
import {appTotal} from '@/lib/moremi/model';
import {weatherOutput,weatherInputs,weatherLabels,type Weather,type Gear} from '@/lib/moremi/weather';
import {StockPad} from "./stock-pad";
import {CounterPad} from "./counter-pad";
import {pressButton} from "@/lib/moremi/counter-toy";
import {stallEvent} from '@/lib/moremi/stall';
import type {Cue} from '@/lib/moremi/audio';
export type Sound=(cue?:Cue|boolean)=>void;
const asset=(name:string)=>`/art/play/${name}.webp`;
export function ToyArt({name,className='',alt=''}:{name:string;className?:string;alt?:string}){return <img src={asset(name)} alt={alt} className={`toy-art ${className}`} draggable={false}/>;}
export function WeatherGlyph({weather}:{weather:Weather}){return weather==='sunny'?<Sun/>:weather==='rainy'?<CloudRain/>:<Wind/>;}
export function SheepSprite({className='',excited=false}:{className?:string;excited?:boolean}){return <img src="/art/world/sheep.webp" alt="Cloud Sheep" draggable={false} className={`sheep-sprite ${excited?'toy-celebrate':''} ${className}`}/>;}
const DragContext=createContext<{selected:string|null;select:(s:string|null)=>void;drop:(target:string,payload:string)=>void;root:React.RefObject<HTMLDivElement|null>}>({selected:null,select:()=>{},drop:()=>{},root:{current:null}});
export function DragBoard({onDrop,children,className=''}:{onDrop:(target:string,payload:string)=>void;children:ReactNode;className?:string}){
 const [selected,select]=useState<string|null>(null);const root=useRef<HTMLDivElement>(null);
 const drop=(target:string,payload:string)=>{select(null);onDrop(target,payload);};
 return <DragContext.Provider value={{selected,select,drop,root}}><div ref={root} className={`drag-board ${selected?'holding-toy':''} ${className}`} onKeyDown={e=>{if(e.key==='Escape')select(null);}}>{children}<span className="sr-only" role="status">{selected?'Selected. Tap a glowing place to put it down.':''}</span></div></DragContext.Provider>;
}
export function DragToy({payload,label,children,className='',disabled=false}:{payload:string;label:string;children:ReactNode;className?:string;disabled?:boolean}){
 const ctx=useContext(DragContext),origin=useRef<{x:number;y:number;id:number}|null>(null),moved=useRef(false),suppress=useRef(false);
 const [offset,setOffset]=useState({x:0,y:0}),[dragging,setDragging]=useState(false);
 const reset=()=>{origin.current=null;setDragging(false);setOffset({x:0,y:0});};
 return <button type="button" className={`drag-toy ${className} ${ctx.selected===payload?'picked':''} ${dragging?'dragging':''}`} disabled={disabled} aria-label={label} aria-pressed={ctx.selected===payload} style={{transform:dragging?`translate(${offset.x}px,${offset.y}px) scale(1.1) rotate(-5deg)`:undefined,touchAction:'none'}} onPointerDown={e=>{if(e.button!==0||disabled)return;origin.current={x:e.clientX,y:e.clientY,id:e.pointerId};moved.current=false;suppress.current=false;e.currentTarget.setPointerCapture?.(e.pointerId);}} onPointerMove={e=>{const start=origin.current;if(!start||start.id!==e.pointerId)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.hypot(x,y)>7)moved.current=true;if(moved.current){setDragging(true);setOffset({x,y});ctx.select(payload);}}} onPointerUp={e=>{const start=origin.current;if(!start)return;if(moved.current){suppress.current=true;const targets=[...(ctx.root.current?.querySelectorAll<HTMLElement>('[data-drop]')??[])].reverse();const target=targets.find(el=>{const r=el.getBoundingClientRect();return !el.hasAttribute('disabled')&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;});if(target)ctx.drop(target.dataset.drop!,payload);else ctx.select(null);}reset();}} onPointerCancel={()=>{suppress.current=true;ctx.select(null);reset();}} onLostPointerCapture={()=>{if(origin.current)reset();}} onClick={()=>{if(suppress.current){suppress.current=false;return;}ctx.select(ctx.selected===payload?null:payload);}}>{children}</button>;
}
export function DropSpot({id,label,children,className='',onEmptyClick,disabled=false}:{id:string;label:string;children:ReactNode;className?:string;onEmptyClick?:()=>void;disabled?:boolean}){
 const ctx=useContext(DragContext);return <button type="button" data-drop={id} aria-label={label} disabled={disabled} className={`drop-spot ${className} ${ctx.selected?'drop-ready':''}`} onClick={()=>ctx.selected?ctx.drop(id,ctx.selected):onEmptyClick?.()}>{children}</button>;
}
export function HandHint({show=true,className=''}:{show?:boolean;className?:string}){return show?<div className={`hand-hint ${className}`} aria-hidden="true"><ToyArt name="hand"/></div>:null;}
export function PlayStars({count}:{count:number}){return <div className="play-stars" aria-label={`${count} of 3 stars`}>{[0,1,2].map(i=><span key={i} className={i<count?'earned':''}>{i<count?<Check size={18}/>:<Sparkles size={18}/>}</span>)}</div>;}
export function CreatureToy({kind,happy=false}:{kind:Project['kind'];happy?:boolean}){return kind==='weather'?<SheepSprite excited={happy}/>:<img className={`customer-sprite ${happy?'toy-celebrate':''}`} src={`/art/${kind==='counter'?'blob':'mushroom'}-cutout.webp`} alt={kind==='counter'?'Blob':'Mushroom'} draggable={false}/>;}

export function ToyScene({project:p,count,stock,weather,gear,onWeather,onRemove,goal,happy=false,hint=false,reduced=false,free=false}:{project:Project;count:number;stock:number;weather:Weather;gear:Gear|null;onWeather:(w:Weather)=>void;onRemove:()=>void;goal?:ReactNode;happy?:boolean;hint?:boolean;reduced?:boolean;free?:boolean}){
 const isWeather=p.kind==='weather';
 return <div className={`toy-scene toy-scene-${p.kind} theme-${p.weatherTheme} sky-${weather} ${reduced?'toy-still':''}`}>
 <div className="toy-scene-depth"/>{isWeather&&<><div className="toy-sun"/><div className="toy-cloud tc-one"/><div className="toy-cloud tc-two"/>{weather==='rainy'&&<div className="toy-rain" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{left:`${9+i*10}%`,animationDelay:`${i*.15}s`}}/>)}</div>}</>}
 <div className="scene-top">{goal&&<div className="order-bubble">{goal}</div>}{p.kind==='stall'&&<div className="stock-bubble"><strong>{stock}</strong><span>left</span></div>}</div>
 <DropSpot id={isWeather?'dress':'friend'} label={isWeather?'Give item to Cloud Sheep':'Give fruit to customer'} className="creature-drop" onEmptyClick={()=>onWeather(weather)}><CreatureToy kind={p.kind} happy={happy}/>{isWeather&&gear&&<motion.div key={gear} className={`worn-gear worn-${gear}`} initial={reduced?false:{scale:.5,y:-15}} animate={{scale:1,y:0}}><ToyArt name={gear}/></motion.div>}</DropSpot>
 {!isWeather&&<><div className="toy-awning"><i/><i/><i/><i/><i/><i/></div><div className="toy-counter-table"/><DropSpot id="basket" label="Put snack in basket" className="basket-drop" onEmptyClick={onRemove}><div className="toy-basket-rim"/><div className="basket-snacks">{Array.from({length:Math.min(count,12)},(_,i)=><ToyArt key={i} name={p.kind==='counter'?'puff-puff':'mango'}/>)}</div><span className="basket-count">{count}</span></DropSpot></>}
 {p.kind==='counter'&&<div className="toy-receipt"><span>YOUR APP</span><strong>₦{appTotal(p,count)}</strong></div>}
 {p.kind==='stall'&&<div className="fruit-shelf">{Array.from({length:Math.min(stock,8)},(_,i)=><DragToy key={i} payload="fruit" label={`Move fruit ${i+1}`}><ToyArt name="mango"/></DragToy>)}{stock===0&&<span>All gone!</span>}</div>}
 {isWeather&&<div className="weather-controller" role="group" aria-label="Change the weather">{weatherInputs.map(w=><button key={w} aria-label={`Make it ${w}`} aria-pressed={weather===w} className={weather===w?'selected':''} onClick={()=>onWeather(w)}><WeatherGlyph weather={w}/><span>{weatherLabels[w]}</span></button>)}</div>}
 <HandHint show={hint} className={isWeather?'hint-to-sheep':'hint-to-basket'}/>
 {free&&<span className="free-play-sticker">Just play ✦</span>}
 </div>;
}

/** Saved creations are the same toys, using the child's saved rules. */
export function FreePlay({project:p,reduced,sound}:{project:Project;reduced:boolean;sound:Sound}){
 const [count,setCount]=useState(0),[stock,setStock]=useState(p.stockStart),[weather,setWeather]=useState<Weather>('sunny'),[gear,setGear]=useState<Gear|null>(null),[happy,setHappy]=useState(false),[message,setMessage]=useState('Move things. Make something happen!');
 const drop=(target:string,payload:string)=>{
  if(p.kind==='weather'&&target==='dress'&&payload.startsWith('gear:')){setGear(payload.slice(5) as Gear);setHappy(true);setMessage('Picnic time!');sound('success');}
  else if(p.kind==='counter'&&target==='basket'&&payload==='snack'){setCount(n=>Math.min(12,n+1));sound();}
  else if(p.kind==='stall'&&(target==='basket'||target==='friend')&&payload==='fruit'){const s=stallEvent(p,stock,'sell');setStock(s.stock);setCount(n=>n+Number(!s.blocked));setHappy(!s.blocked);setMessage(s.blocked?'Time for more fruit!':'Yum! Another happy customer.');sound(s.blocked?'retry':'success');}
  else if(p.kind==='stall'&&target==='basket'&&payload==='crate'){setStock(stallEvent(p,stock,'restock').stock);setMessage('Fresh fruit!');sound();}
 };
 if(p.kind==='counter')return <div className="mw-free-play"><div className="mw-free-actor"><img src="/art/world/blob.webp" alt="Blob"/></div><CounterPad project={p} count={count} onPress={()=>{setCount(n=>pressButton(p,n));setHappy(false);sound();}} onClear={()=>{setCount(0);sound();}} reduced={reduced}/><button className="mw-button mw-yellow" onClick={()=>{setCount(0);setHappy(true);setMessage('Yum yum! One more?');sound('success');}}><span>Serve!</span></button><p role="status">{message}</p></div>;
 if(p.kind==='stall')return <div className="mw-free-play mw-saved-fruit"><div className="mw-free-actor"><img src="/art/mushroom-cutout.webp" alt="Mushroom"/></div><StockPad project={p} stock={stock} onSell={()=>{const next=stallEvent(p,stock,'sell');setStock(next.stock);setCount(n=>n+Number(!next.blocked));setMessage(next.blocked?'All gone! Tap REFILL for a delivery.':'One sold. Your app remembered!');sound(next.blocked?'retry':'success');}} onRefill={()=>{setStock(stallEvent(p,stock,'restock').stock);setMessage('Fresh fruit! Ready for another friend.');sound('success');}} reduced={reduced} delivered={count}/><button className="mw-text-link" onClick={()=>{setStock(p.stockStart);setCount(0);setMessage('Ready for the morning rush!');}}>Start a fresh day</button><p role="status">{message}</p></div>;
 return <DragBoard onDrop={drop} className="free-play"><ToyScene project={p} count={count} stock={stock} weather={weather} gear={gear} onWeather={w=>{setWeather(w);setGear(null);sound();}} onRemove={()=>setCount(n=>Math.max(0,n-1))} happy={happy} reduced={reduced} free/>
 <div className="toy-dock">{<DragToy payload={`gear:${weatherOutput(p,weather)}`} label={`Pick up ${weatherOutput(p,weather)}`}><ToyArt name={weatherOutput(p,weather)}/></DragToy>}<button className="plain-link" onClick={()=>{setCount(0);setStock(p.stockStart);setGear(null);setHappy(false);setMessage('Let’s play again!');}}>Reset</button></div><p className="play-caption" role="status">{message}</p></DragBoard>;
}
