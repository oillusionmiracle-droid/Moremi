"use client";
import {Plus,RotateCcw} from 'lucide-react';
import {motion} from 'motion/react';
import {appTotal,type Project} from '@/lib/moremi/model';
import {DropSpot,ToyArt} from './play-scene';

export function CounterPad({project:p,count,onPress,onClear,placing=false,reduced=false,pulse=0}:{project:Project;count:number;onPress:()=>void;onClear:()=>void;placing?:boolean;reduced?:boolean;pulse?:number}){
 return <div className={`mw-pad ${p.buttonConnected?'is-connected':''}`} aria-label="Your working order app"><i className="pad-screw s-one"/><i className="pad-screw s-two"/>
 <div className="mw-pad-display"><ToyArt name="puff-puff"/><output aria-label="Order quantity" aria-live="polite" key={pulse}>{count}</output><span className="pad-display-divider"/><div><small>TOTAL</small><output aria-label="Order total">₦{appTotal(p,count)}</output></div></div>
 <div className="mw-pad-snacks" aria-hidden="true">{Array.from({length:Math.min(count,6)},(_,i)=><ToyArt key={i} name="puff-puff"/>)}</div>
 <div className="mw-pad-buttons">{placing?<DropSpot id="pad" label="Place the button on the order pad" className="mw-button-socket"><Plus/><span className="sr-only">Empty button space</span></DropSpot>:<motion.button type="button" className="mw-plus-button" aria-label="Add a snack with your button" onClick={onPress} whileTap={reduced?undefined:{y:5,scale:.95}} animate={reduced?undefined:pulse?{rotate:[0,-7,7,0]}:undefined} transition={{duration:.3}}><Plus strokeWidth={4}/>{!p.buttonConnected&&<span className="unplugged-dot"/>}</motion.button>}<button className="mw-clear-button" aria-label="Clear order" onClick={onClear}><RotateCcw size={19}/></button></div>
 <span className="pad-maker-label">MADE BY YOU ✦</span>
 </div>;
}
