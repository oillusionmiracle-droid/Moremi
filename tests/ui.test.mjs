import { test, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom=new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>",{url:"https://moremi.test/",pretendToBeVisual:true});
for(const key of ["window","document","navigator","HTMLElement","HTMLInputElement","HTMLFormElement","HTMLTextAreaElement","SVGElement","Element","Node","NodeFilter","MutationObserver","CustomEvent","Event","MouseEvent","FocusEvent","KeyboardEvent","DocumentFragment","localStorage","getComputedStyle"])Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]});
globalThis.requestAnimationFrame=callback=>setTimeout(()=>callback(performance.now()),8);globalThis.cancelAnimationFrame=clearTimeout;
window.requestAnimationFrame=globalThis.requestAnimationFrame;window.cancelAnimationFrame=clearTimeout;
Object.defineProperty(dom.window.HTMLMediaElement.prototype,"play",{configurable:true,value(){return Promise.resolve();}});
Object.defineProperty(dom.window.HTMLMediaElement.prototype,"pause",{configurable:true,value(){}});
window.scrollTo=()=>{};window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const tools=new Map();document.modelContext={registerTool(tool,{signal}){tools.set(tool.name,tool);signal.addEventListener("abort",()=>tools.delete(tool.name));}};
const {act,createElement}=await import("react");const {createRoot}=await import("react-dom/client");
const {default:MakerClub}=await import("../components/moremi/maker-club.tsx");
const {STORAGE_KEY}=await import("../lib/moremi/model.ts");
let root;
const buttons=()=>[...document.querySelectorAll("button")];
const normalize=text=>text.trim().replaceAll("’","'");
function find(label){const result=buttons().find(button=>normalize(button.textContent)===normalize(label) || button.getAttribute("aria-label")===label);assert(result,`Button missing: ${label}. Current text: ${document.body.textContent}`);return result;}
async function click(label){await act(async()=>{const button=find(label);button.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,button:0}));button.focus();button.click();});await act(async()=>new Promise(resolve=>setTimeout(resolve,220)));}
async function name(value="Ada") { await act(async()=>{const input=document.getElementById("maker-name");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,value);input.dispatchEvent(new Event("input",{bubbles:true}));}); }
async function onboard(){await click("Let's make something");await name();await click("Continue");await click("Boy");await click("Let's go!");await click("Start the Puff-puff Counter");}
const saved=()=>JSON.parse(localStorage.getItem(STORAGE_KEY));
async function mount(){root=createRoot(document.getElementById("root"));await act(async()=>{root.render(createElement(MakerClub));await new Promise(resolve=>setTimeout(resolve,30));});}
async function unmount(){if(root){await act(async()=>root.unmount());root=null;}}
afterEach(unmount);after(()=>dom.window.close());

test("unreadable data remains untouched until explicit recovery",async()=>{
  localStorage.setItem(STORAGE_KEY,"{bad record}");await mount();assert.match(document.body.textContent,/Saved data could not be opened/);assert.equal(localStorage.getItem(STORAGE_KEY),"{bad record}");
  await click("Recovery");assert.match(document.querySelector('[role="dialog"]').textContent,/Download its original contents first/);await click("Keep current record");assert.equal(localStorage.getItem(STORAGE_KEY),"{bad record}");await unmount();
});


test("face greeting, personalized onboarding and warm audio respect mute and persist",async()=>{
  localStorage.clear();let notes=0;
  globalThis.AudioContext=class{get currentTime(){return performance.now()/1000;}destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createBiquadFilter(){return{type:"",frequency:{value:0},Q:{value:0},connect(){},disconnect(){}};}createOscillator(){return{type:"",frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){notes++;},stop(){}};}createGain(){return{gain:{value:.01,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}},connect(){},disconnect(){}};}};
  try{
    await mount();assert.equal(document.querySelector('.moremi-app').dataset.world,"welcome");assert(document.querySelector('.face-greeting img[src="/art/moremi-head-calm.webp"]'));assert(!document.querySelector('.face-stage .face-hello'));assert.equal(document.querySelectorAll("video").length,0);
    await click("Say hello to Moremi");assert.match(document.body.textContent,/Hehe! Hello, you!/);assert(notes>0);
    await click("Turn sound off");const muted=notes;await click("Say hello to Moremi");assert.equal(notes,muted);
    await click("Let's make something");assert.equal(find("Continue").disabled,true);await name("Zuri");await click("Continue");await click("Girl");await click("Let's go!");
    assert.equal(notes,muted);assert.equal(saved().builders[0].nickname,"Zuri");assert.equal(saved().builders[0].identity,"girl");assert.equal(saved().builders[0].profileComplete,true);assert.equal(saved().builders[0].draft,null);assert.match(document.body.textContent,/Zuri, your maker adventure starts here/);
    await unmount();await mount();assert.match(document.body.textContent,/Zuri, your maker adventure starts here/);assert.equal(saved().settings.sound,false);
    await click("Moremi home");await click("Turn sound on");const before=notes;await click("Say hello to Moremi");assert(notes>before);await unmount();
  }finally{delete globalThis.AudioContext;}
});

async function put(source,target){await click(source);await click(target);}
async function snacks(n){for(let i=0;i<n;i++)await put('Pick up a puff-puff','Put snack in basket');}
async function counterReady(){await onboard();await snacks(2);await click('Make my toy');await put('Pick price 150','Set snack price');await put('Pick multiply tile','Set counting rule');await click('Let’s play!');}
test('snack game requires actual orders, rejects 450, resumes and saves a playable app',async()=>{
 localStorage.clear();await mount();await counterReady();await snacks(2);await click('Pay 450');assert.match(document.body.textContent,/Try another coin/);assert.equal(saved().builders[0].draft.tests.length,0);await click('Pay 300');assert.equal(saved().builders[0].draft.tests.length,1);await unmount();await mount();await click('Keep playing my toy');await click('Pay 0');await snacks(5);await click('Pay 750');assert.equal(saved().builders[0].draft.tests.length,3);await click('Keep my app');assert.equal(saved().builders[0].projects.length,1);assert.match(document.body.textContent,/\+50 XP/);await click('Put it in my album');await click('Market Basket sticker, open your counter');await snacks(2);assert.match(document.querySelector('.toy-receipt').textContent,/300/);await click('Serve!');assert.match(document.querySelector('.toy-receipt').textContent,/0/);
});
test('storage failure never awards a finished toy, and retry succeeds',async()=>{
 localStorage.clear();await mount();await counterReady();await snacks(2);await click('Pay 300');await click('Pay 0');await snacks(5);await click('Pay 750');const proto=Object.getPrototypeOf(localStorage),original=proto.setItem;proto.setItem=function(){throw new DOMException('Device storage is full','QuotaExceededError');};try{await click('Keep my app');assert.equal(saved().builders[0].projects.length,0);assert.equal(saved().builders[0].awards.length,0);}finally{proto.setItem=original;}await click('Keep my app');assert.equal(saved().builders[0].projects.length,1);
});
test('fruit game checks sell, empty shelf and refill through moved objects',async()=>{
 localStorage.clear();await mount();await onboard();const counter=saved().builders[0].draft.id;await click('Save and exit lesson');await click('Start the Market Stall');await put('Move fruit 1','Give fruit to customer');await click('Make my toy');await put('Pick 4 starting fruit','Set starting fruit');await put('Pick take one tile','Set sell action');await put('Pick refill two tile','Set refill action');await click('Let’s play!');await click('Guess 4 fruit left');assert(find('Let’s go!').disabled);await click('Guess 3 fruit left');await click('Let’s go!');for(let i=0;i<2;i++)await put('Move fruit 1','Give fruit to customer');assert.equal(saved().builders[0].draft.stockTests.length,1);for(let i=0;i<4;i++)await put('Move fruit 1','Give fruit to customer');await click('One more customer?');assert.equal(saved().builders[0].draft.stockTests.length,2);await put('Move fruit 1','Give fruit to customer');await put('Pick up refill crate','Put snack in basket');await click('Keep my app');assert.equal(saved().builders[0].projects[0].kind,'stall');assert.equal(saved().builders[0].pausedDrafts[0].id,counter);
});
test('dress up game requires correct weather connections and every weather switch',async()=>{
 localStorage.clear();await mount();await onboard();await click('Save and exit lesson');await click('Start the Weather Helper');await put('Pick up umbrella','Give item to Cloud Sheep');await click('Make my toy');for(const [w,g] of [['sunny','cap'],['rainy','umbrella'],['windy','scarf']])await put(`Pick up ${g}`,`Connect ${w} picture`);await click('Let’s play!');await put('Pick up cap','Give item to Cloud Sheep');assert(find('Let’s go!').disabled);await put('Pick up umbrella','Give item to Cloud Sheep');await click('Let’s go!');for(const w of ['sunny','rainy','rainy','sunny','windy','rainy']){await click(`Make it ${w}`);await put(`Pick up ${{sunny:'cap',rainy:'umbrella',windy:'scarf'}[w]}`,'Give item to Cloud Sheep');}assert.equal(saved().builders[0].draft.weatherTests.length,3);await click('Keep my app');assert.equal(saved().builders[0].projects[0].kind,'weather');assert.equal(saved().builders[0].awards.length,1);
});
test('pointer drag places a toy; cancellation never adds a snack',async()=>{
 localStorage.clear();await mount();await onboard();const source=find('Pick up a puff-puff'),target=find('Put snack in basket');target.getBoundingClientRect=()=>({left:100,right:200,top:100,bottom:200});const pointer=(type,x,y)=>{const e=new MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y});Object.defineProperty(e,'pointerId',{value:1});return e;};await act(async()=>{source.dispatchEvent(pointer('pointerdown',20,20));source.dispatchEvent(pointer('pointermove',140,140));source.dispatchEvent(pointer('pointerup',140,140));});assert.equal(document.querySelector('.basket-count').textContent,'1');await act(async()=>{source.dispatchEvent(pointer('pointerdown',20,20));source.dispatchEvent(pointer('pointermove',140,140));source.dispatchEvent(pointer('pointercancel',140,140));});assert.equal(document.querySelector('.basket-count').textContent,'1');
});
test('scene videos autoplay muted with no visible pause button, reduced motion uses poster',async()=>{
 const {SceneClip}=await import('../components/moremi/animation.tsx');root=createRoot(document.getElementById('root'));await act(async()=>root.render(createElement(SceneClip,{name:'blob-idle',label:'Blob playing',reduced:false})));const v=document.querySelector('video');assert(v.autoplay);assert(v.muted);assert(v.loop);assert.equal(document.querySelectorAll('button').length,0);await act(async()=>root.render(createElement(SceneClip,{name:'blob-idle',label:'Blob playing',reduced:true})));assert.equal(document.querySelectorAll('video').length,0);assert(document.querySelector('img'));
});
