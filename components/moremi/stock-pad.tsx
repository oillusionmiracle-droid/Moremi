"use client";
import {ArrowDown,PackagePlus,ShoppingBag} from 'lucide-react';
import {motion,AnimatePresence} from 'motion/react';
import type {Project} from '@/lib/moremi/model';
import {DropSpot,ToyArt} from './play-scene';

/** The visible shelf and the saved app both use the same stock event interpreter. */
export function StockPad({project:p,stock,onSell,onRefill,placing=false,reduced=false,delivered=0}:{project:Project;stock:number;onSell:()=>void;onRefill:()=>void;placing?:boolean;reduced?:boolean;delivered?:number}){
 return <div className={`mw-stock-pad ${stock===0?'shelf-empty':''}`}>
 <div className="mw-stock-meter"><span><ToyArt name={p.product==='puff-puff'?'puff-puff':'mango'}/> FRUIT LEFT</span>{placing?<DropSpot id="display" label="Place the stock display" className="mw-stock-display-socket"><ArrowDown/><span>Drop here</span></DropSpot>:<output aria-label="Fruit left" aria-live="polite">{stock}</output>}</div>
 <div className="mw-fruit-shelf" aria-label={`${stock} fruit on the shelf`}><AnimatePresence initial={false}>{Array.from({length:Math.min(stock,10)},(_,i)=><motion.div key={i} initial={reduced?false:{scale:.3,y:-25}} animate={{scale:1,y:0}} exit={reduced?{opacity:0}:{x:65,y:-30,scale:.5,opacity:0}} transition={{duration:.24}}><ToyArt name={p.product==='puff-puff'?'puff-puff':'mango'}/></motion.div>)}</AnimatePresence>{stock===0&&<span className="mw-empty-shelf"><PackagePlus/><span>Delivery time!</span></span>}</div>
 <div className="mw-stock-buttons"><button type="button" aria-label="Sell one fruit" disabled={placing} onClick={onSell}><ShoppingBag/><span>SELL</span><i>1</i></button><button type="button" aria-label="Refill the fruit shelf" disabled={placing} onClick={onRefill}><PackagePlus/><span>REFILL</span><i>+{p.restockAmount}</i></button></div>
 <span className="mw-stock-caption">{delivered>0?`${delivered} happy ${delivered===1?'customer':'customers'} ✦`:'YOUR LITTLE SHOP APP'}</span>
 </div>;
}
