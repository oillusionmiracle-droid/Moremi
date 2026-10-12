"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion } from "motion/react";
import type { ReactNode } from "react";


export function SceneClip({name,label,reduced=false,loop=true,playOnMount=true,className=""}:{name:string;label:string;reduced?:boolean;loop?:boolean;controls?:boolean;playOnMount?:boolean;className?:string}) {
  const video=useRef<HTMLVideoElement>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const el=video.current;if(!el||reduced||!playOnMount)return;
    let visible=true,disposed=false;
    const sync=()=>{if(disposed)return;if(document.hidden||!visible)el.pause();else void el.play().catch(()=>{});};
    sync();document.addEventListener("visibilitychange",sync);
    const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:.05}):null;
    observer?.observe(el);
    return()=>{disposed=true;observer?.disconnect();document.removeEventListener("visibilitychange",sync);el.pause();};
  },[name,reduced,playOnMount]);
  return <div className={`scene-clip ${className}`}>{reduced||failed||!playOnMount?<img src={`/motion/${name}.webp`} alt={label} draggable={false}/>:<video ref={video} aria-label={label} muted playsInline autoPlay loop={loop} preload="metadata" poster={`/motion/${name}.webp`} onError={()=>setFailed(true)}><source src={`/motion/${name}.mp4`} type="video/mp4"/></video>}</div>;
}

export function KineticHeading({text,reduced,as="h1",className="",breakAfter,accentFrom}:{text:string;reduced:boolean;as?:"h1"|"h2";className?:string;breakAfter?:number;accentFrom?:number}) {
  const ref=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{
    if(reduced||!ref.current)return;
    const ctx=gsap.context(()=>{gsap.from(".kinetic-word",{y:14,opacity:0,duration:.5,stagger:.035,ease:"back.out(1.15)"});},ref);
    return()=>ctx.revert();
  },[text,reduced]);
  const Heading=as;
  return <Heading ref={ref} className={`kinetic-heading ${className}`} aria-label={text} tabIndex={as==="h1"?-1:undefined}>{text.split(" ").map((word,i)=><span key={`${i}-${word}`} aria-hidden="true"><span className={`kinetic-word ${accentFrom!==undefined&&i>=accentFrom?"accent-word":""}`}>{word}{" "}</span>{breakAfter===i+1?<br/>:null}</span>)}</Heading>;
}

/* The user requested a drawing made from tonal shapes, rather than a market photo. */
export function WorldDepth() {
  return <div className="world-depth" aria-hidden="true"><svg className="depth-far" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"><g fill="currentColor" opacity=".13"><circle cx="1250" cy="130" r="170"/><path d="M0 270Q170 170 250 285T500 300V900H0Z"/><path d="M950 750Q1140 580 1440 720V900H950Z"/><rect x="1040" y="390" width="275" height="260" rx="30"/><path d="M1008 405L1080 330H1275L1347 405Z"/><rect x="1100" y="450" width="155" height="140" rx="20"/></g><g fill="currentColor" opacity=".2"><rect x="72" y="560" width="24" height="230" rx="12"/><circle cx="84" cy="500" r="72"/><circle cx="45" cy="555" r="65"/><circle cx="127" cy="558" r="65"/><rect x="1350" y="535" width="20" height="220" rx="10"/><circle cx="1360" cy="490" r="85"/></g><g fill="none" stroke="currentColor" strokeWidth="14" opacity=".14"><path d="M250 70Q350 190 450 70T650 70"/><path d="M990 810q80-70 160 0t160 0"/></g></svg><div className="depth-near"><i/><i/><i/></div></div>;
}

export function MoremiHead({reduced=false,className="",replay=0,excited=false,expression="calm"}:{expression?:"calm"|"playful";reduced?:boolean;className?:string;replay?:number;excited?:boolean}) {
  return <motion.div key={replay} className={`moremi-head ${excited?"head-excited":""} ${className}`} initial={reduced?false:{scale:.65,rotate:-12,opacity:0}} animate={reduced?{}:{scale:[.65,1.08,.96,1],rotate:[-12,8,-4,0],opacity:1}} transition={{duration:.85,ease:"easeOut"}}><img src={`/art/moremi-head-${excited?"playful":expression}.webp`} width={1024} height={1024} alt="Moremi, smiling with you" draggable={false}/></motion.div>;
}

export function AnimatedMap({reduced,children}:{reduced:boolean;children:ReactNode}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(reduced||!ref.current)return;
    const ctx=gsap.context(()=>{gsap.from(".game-island",{y:24,opacity:0,duration:.55,stagger:.1,ease:"back.out(1.4)"});},ref);
    return()=>ctx.revert();
  },[reduced]);
  return <div ref={ref} className="path-content">{children}</div>;
}

export function CelebrationConfetti({reduced}:{reduced:boolean}) {
  return <div className="celebration-confetti" aria-hidden="true">{reduced?<span>✦ ✧ ✦</span>:Array.from({length:56},(_,i)=><motion.i key={i} initial={{x:0,y:0,opacity:0,rotate:0}} animate={{x:[0,(i%2?1:-1)*(45+i*8),(i%2?1:-1)*(60+i*9)],y:[0,-100-(i%7)*32,650],opacity:[0,1,1,0],rotate:[0,i*19,i*41]}} transition={{duration:3.2+(i%5)*.18,delay:(i%8)*.04,ease:"easeOut"}} style={{left:`${20+(i*13)%60}%`,background:["#F65BB6","#FFD447","#B8EB32","#43C8EF","#B98AFF"][i%5],borderRadius:i%3===0?"50%":"2px"}}/>)}</div>;
}
