import {test} from "node:test";
import assert from "node:assert/strict";
import {MusicDirector,musicForView} from "../lib/moremi/music.ts";

test("onboarding plays Sunny Orchard, builds are quiet, and celebration has its own track",()=>{
  assert.equal(musicForView("welcome"),"sunny-orchard");
  assert.equal(musicForView("mission"),"rising-wonder");
  assert.equal(musicForView("reward"),"moremi-celebration");
  for(const view of ["path","apps","album","grownups"])assert.equal(musicForView(view),"sunny-orchard");
});

test("music waits for a gesture, resumes after mute, switches tracks and pauses in the background",async()=>{
  const originalFetch=globalThis.fetch,originalAudio=globalThis.AudioContext;
  const played=[],requests=[];let context;
  const parameter=()=>({value:0,setValueAtTime(value){this.value=value;},linearRampToValueAtTime(value){this.value=value;},cancelScheduledValues(){}});
  globalThis.AudioContext=class{
    currentTime=0;destination={};constructor(){context=this;}resume(){return Promise.resolve();}close(){return Promise.resolve();}
    decodeAudioData(){return Promise.resolve({duration:100});}createGain(){return{gain:parameter(),connect(){},disconnect(){}};}
    createBufferSource(){const node={buffer:null,loop:false,connect(){},disconnect(){},start(at,offset){played.push({node,offset});},stop(){this.stopped=true;}};return node;}
  };
  globalThis.fetch=async url=>{requests.push(url);return{ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  const music=new MusicDirector();
  try{
    music.setScene("path");await settle();assert.equal(played.length,0);assert.equal(requests.length,0);
    music.setScene("welcome");music.unlock();await settle();assert.equal(played.length,1);
    music.setScene("path");await settle();assert.equal(played.length,1);assert.equal(requests[0],"/audio/sunny-orchard.m4a");assert.equal(played[0].node.loop,true);
    context.currentTime=5;music.setEnabled(false);assert.equal(played[0].node.stopped,true);
    music.setEnabled(true);await settle();assert.equal(played[1].offset,5);
    music.setScene("mission");await settle();assert.equal(requests.at(-1),"/audio/rising-wonder.m4a");assert.equal(played[1].node.stopped,true);
    music.setHidden(true);const count=played.length;music.setScene("album");await settle();assert.equal(played.length,count);
    music.setHidden(false);await settle();assert.equal(requests.filter(x=>x.includes("sunny-orchard")).length,1);
    music.setScene("reward",1);await settle();assert.equal(requests.at(-1),"/audio/moremi-celebration.m4a");assert.equal(played.at(-1).node.loop,false);
    const once=played.length;music.setScene("reward",1);await settle();assert.equal(played.length,once);
    music.setScene("reward",2);await settle();assert.equal(played.length,once+1);assert.equal(played.at(-1).offset,0);
    const last=played.at(-1).node;music.setScene("welcome");await settle();assert.equal(last.stopped,true);assert.equal(played.at(-1).node.loop,true);
  }finally{music.dispose();globalThis.fetch=originalFetch;if(originalAudio===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=originalAudio;}
});

test("a late music download cannot play after mute or after leaving a lesson",async()=>{
  const originalFetch=globalThis.fetch,originalAudio=globalThis.AudioContext;let release,starts=0;
  globalThis.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({duration:20});}createBufferSource(){starts++;throw new Error("Should not start");}};
  globalThis.fetch=()=>new Promise(resolve=>{release=()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});});
  const music=new MusicDirector();
  try{music.unlock();music.setScene("path");await new Promise(resolve=>setImmediate(resolve));music.setScene("welcome");music.setEnabled(false);release();await new Promise(resolve=>setImmediate(resolve));assert.equal(starts,0);}
  finally{music.dispose();globalThis.fetch=originalFetch;if(originalAudio===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=originalAudio;}
});
