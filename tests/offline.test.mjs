import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import vm from "node:vm";

const output=new URL("../dist/client/",import.meta.url);
const manifest=JSON.parse(await readFile(new URL("offline-manifest.json",output),"utf8"));
const code=await readFile(new URL("sw.js",output),"utf8");
function runtime({badFile,offline=false}={}){
  let connected=!offline;
  const stores=new Map(),handlers=new Map();
  const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return{async match(key){return data.get(key)?.clone();},async put(key,response){data.set(key,response.clone());}};},async delete(name){return stores.delete(name);},async keys(){return [...stores.keys()];}};
  const self={location:{origin:"https://moremi.test"},clients:{async claim(){}},async skipWaiting(){},addEventListener(name,handler){handlers.set(name,handler);}};
  vm.runInNewContext(code,{self,caches,crypto:webcrypto,URL,Uint8Array,Map,Headers,Response,fetch:async(url)=>{
    if(!connected)throw new Error("No network");const key=typeof url==="string"?url:new URL(url.url).pathname;
    if(key===badFile)return new Response("a different deployed file");
    return new Response(await readFile(new URL(key==="/"?"index.html":key.slice(1),output)));
  }});
  async function trigger(type,extra={}){let pending;handlers.get(type)({...extra,waitUntil(promise){pending=promise;},respondWith(promise){pending=promise;}});return pending;}
  async function verify(){let result;await trigger("message",{data:{type:"VERIFY"},ports:[{postMessage(value){result=value;}}]});return result;}
  return{caches,stores,trigger,verify,setOffline(){connected=false;}};
}
test("pack includes actual artwork, entrypoint, chunks and font files",()=>{
  assert(manifest.files.some(file=>file.url==="/"));assert(manifest.files.some(file=>file.url.includes("moremi-poses.webp")));assert(manifest.files.some(file=>file.url.endsWith(".js")));assert(manifest.files.some(file=>file.url.endsWith(".woff2")));
  for(const asset of ["map","welcome","stall","moremi","blob","sheep","fruit-shop"])assert(manifest.files.some(file=>file.url===`/art/world/${asset}.webp`));
  assert(manifest.totalBytes<9_000_000);for(const track of ["sunny-orchard","rising-wonder","moremi-celebration"])assert(manifest.files.some(file=>file.url===`/audio/${track}.m4a`));assert.equal(new Set(manifest.files.map(file=>file.url)).size,manifest.files.length);assert.equal(manifest.files.filter(file=>file.url.endsWith(".mp4")).length,10);assert(!manifest.files.some(file=>file.url.includes(".vite")||file.url.includes(".assetsignore")));
});
test("ready means every required file is present and its digest matches",async()=>{
  const r=runtime();assert.equal((await r.verify()).ready,false);await r.trigger("install");await r.trigger("activate");assert.equal((await r.verify()).ready,true);
  const cache=await r.caches.open(`moremi-pack-${manifest.version}`);await cache.put("/art/basket.webp",new Response("damaged"));assert.equal((await r.verify()).ready,false);
});
test("cached navigation and art work without network access",async()=>{
  const r=runtime();await r.trigger("install");r.setOffline();
  const navigation=await r.trigger("fetch",{request:{method:"GET",url:"https://moremi.test/",mode:"navigate"}});
  assert.equal(await navigation.text(),await readFile(new URL("index.html",output),"utf8"));
  const art=await r.trigger("fetch",{request:{method:"GET",url:"https://moremi.test/art/basket.webp",mode:"cors"}});assert(art.ok);assert((await art.arrayBuffer()).byteLength>10_000);
});
test("a mismatched replacement fails installation and preserves older complete packs",async()=>{
  const r=runtime({badFile:"/art/basket.webp"});await r.caches.open("moremi-pack-previous");
  await assert.rejects(r.trigger("install"),/Incomplete offline file/);assert(r.stores.has("moremi-pack-previous"));assert(!r.stores.has(`moremi-pack-${manifest.version}`));
});


test("cached animations serve byte ranges offline, including a suffix and an invalid range",async()=>{
  const r=runtime();await r.trigger("install");r.setOffline();
  const path="/motion/blob-problem.mp4",original=await readFile(new URL(path.slice(1),output));
  const request=range=>({method:"GET",url:"https://moremi.test"+path,mode:"cors",headers:new Headers({Range:range})});
  const chunk=await r.trigger("fetch",{request:request("bytes=10-109")});
  assert.equal(chunk.status,206);assert.equal(chunk.headers.get("Content-Range"),`bytes 10-109/${original.length}`);
  assert.deepEqual(new Uint8Array(await chunk.arrayBuffer()),new Uint8Array(original.subarray(10,110)));
  const suffix=await r.trigger("fetch",{request:request("bytes=-20")});assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,20);
  const invalid=await r.trigger("fetch",{request:request(`bytes=${original.length+1}-`)});assert.equal(invalid.status,416);
});
