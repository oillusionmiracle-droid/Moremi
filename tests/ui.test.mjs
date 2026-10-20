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
const {STORAGE_KEY,initialDatabase,createProject,createStallProject}=await import("../lib/moremi/model.ts");
let root;
const buttons=()=>[...document.querySelectorAll('[role="dialog"] button'),...document.querySelectorAll("button")];
const normalize=text=>text.trim().replaceAll("’","'");
function find(label){const result=buttons().find(button=>normalize(button.textContent)===normalize(label) || button.getAttribute("aria-label")===label);assert(result,`Button missing: ${label}. Current text: ${document.body.textContent}`);return result;}
async function click(label){await act(async()=>{const button=find(label);button.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,button:0}));button.focus();button.click();});await act(async()=>new Promise(resolve=>setTimeout(resolve,220)));}
async function name(value="Ada") { await act(async()=>{const input=document.getElementById("maker-name");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,value);input.dispatchEvent(new Event("input",{bubbles:true}));}); }
async function onboard(){await click("Let's make something");await name();await click("Let's go!");await click("Start the Puff-puff Counter");await click("Let’s play!");}
const saved=()=>JSON.parse(localStorage.getItem(STORAGE_KEY));
async function mount(){root=createRoot(document.getElementById("root"));await act(async()=>{root.render(createElement(MakerClub));await new Promise(resolve=>setTimeout(resolve,30));});}
async function unmount(){if(root){await act(async()=>root.unmount());root=null;}}
afterEach(unmount);after(()=>dom.window.close());

test("unreadable data remains untouched until explicit recovery",async()=>{
  localStorage.setItem(STORAGE_KEY,"{bad record}");await mount();assert.match(document.body.textContent,/Saved data could not be opened/);assert.equal(localStorage.getItem(STORAGE_KEY),"{bad record}");
  await click("Recovery");assert.match(document.querySelector('[role="dialog"]').textContent,/Download its original contents first/);await click("Keep current record");assert.equal(localStorage.getItem(STORAGE_KEY),"{bad record}");await unmount();
});


test("personalized onboarding and mute persist",async()=>{
 localStorage.clear();await mount();assert(document.querySelector('img[src="/art/world/moremi.webp"]'));await click("Say hello to Moremi");assert.match(document.body.textContent,/Hehe! Hello/);await click("Turn sound off");await click("Let's make something");assert(find("Let’s go!").disabled);await name("Zuri");await click("Let’s go!");assert.equal(saved().builders[0].nickname,"Zuri");assert.equal(saved().settings.sound,false);assert(document.querySelector('.mw-world'));await unmount();await mount();assert(document.querySelector('.mw-world'));assert.equal(saved().settings.sound,false);
});

async function put(source,target){await click(source);await click(target);}
async function snacks(n){for(let i=0;i<n;i++)await put('Pick up a puff-puff','Put snack in basket');}
async function counterReady(){await onboard();await put('Pick up the plus button','Place the button on the order pad');await put('Pick add one job','Connect the button job');await click('Add a snack with your button');await click('Add a snack with your button');await click('It works!');await put('Pick price 150','Set snack price');await put('Pick multiply tile','Set counting rule');await click('Try my app!');}
async function add(n){for(let i=0;i<n;i++)await click('Add a snack with your button');}
async function finishOrders(){await add(2);await click('Serve!');await click('Serve!');await add(5);await click('Serve!');}
test('build a real button, reject wrong orders, resume and save a playable app',async()=>{
 localStorage.clear();await mount();await counterReady();await add(3);await click('Serve!');assert.equal(saved().builders[0].draft.tests.length,0);await click('Clear order');await add(2);await click('Serve!');assert.equal(saved().builders[0].draft.tests.length,1);await unmount();await mount();await click('Start the Puff-puff Counter');await click('Keep playing');await click('Serve!');await add(5);await click('Serve!');assert.equal(saved().builders[0].draft.tests.length,3);await click('Keep my app');assert.equal(saved().builders[0].projects.length,1);assert.match(document.body.textContent,/50 XP/);await click('Play my app');await add(2);assert.equal(document.querySelector('[aria-label="Order total"]').textContent,'₦300');await click('Serve!');assert.equal(document.querySelector('[aria-label="Order quantity"]').textContent,'0');
});
test('storage failure never awards a finished app and retry succeeds',async()=>{
 localStorage.clear();await mount();await counterReady();await finishOrders();const proto=Object.getPrototypeOf(localStorage),original=proto.setItem;proto.setItem=function(){throw new DOMException('Device storage is full','QuotaExceededError');};try{await click('Keep my app');assert.equal(saved().builders[0].projects.length,0);assert.equal(saved().builders[0].awards.length,0);}finally{proto.setItem=original;}await click('Keep my app');assert.equal(saved().builders[0].projects.length,1);
});
test('a wrong button action can be repaired before pricing',async()=>{
 localStorage.clear();await mount();await onboard();await put('Pick up the plus button','Place the button on the order pad');await put('Pick take one job','Connect the button job');await click('Add a snack with your button');assert.equal(document.querySelector('[aria-label="Order quantity"]').textContent,'0');assert(find('It works!').disabled);await click('Change its job');await put('Pick add one job','Connect the button job');await add(2);assert(!find('It works!').disabled);
});
test('pointer cancellation leaves the button unplaced',async()=>{
 localStorage.clear();await mount();await onboard();const source=find('Pick up the plus button'),target=find('Place the button on the order pad');target.getBoundingClientRect=()=>({left:100,right:200,top:100,bottom:200});const pointer=(type,x,y)=>{const e=new MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y});Object.defineProperty(e,'pointerId',{value:1});return e;};await act(async()=>{source.dispatchEvent(pointer('pointerdown',20,20));source.dispatchEvent(pointer('pointermove',140,140));source.dispatchEvent(pointer('pointercancel',140,140));});assert.equal(saved().builders[0].draft.buttonPlaced,false);await act(async()=>{source.dispatchEvent(pointer('pointerdown',20,20));source.dispatchEvent(pointer('pointermove',140,140));source.dispatchEvent(pointer('pointerup',140,140));});assert.equal(saved().builders[0].draft.buttonPlaced,true);
});
test('scene videos autoplay muted with no visible pause button, reduced motion uses poster',async()=>{
 const {SceneClip}=await import('../components/moremi/animation.tsx');root=createRoot(document.getElementById('root'));await act(async()=>root.render(createElement(SceneClip,{name:'blob-idle',label:'Blob playing',reduced:false})));const v=document.querySelector('video');assert(v.autoplay);assert(v.muted);assert(v.loop);assert.equal(document.querySelectorAll('button').length,0);await act(async()=>root.render(createElement(SceneClip,{name:'blob-idle',label:'Blob playing',reduced:true})));assert.equal(document.querySelectorAll('video').length,0);assert(document.querySelector('img'));
});

async function seedAdventure(kind){localStorage.clear();const d=initialDatabase();d.introSeen=true;d.builders[0].profileComplete=true;d.builders[0].nickname='Ada';d.builders[0].draft={...(kind==='stall'?createStallProject():createProject()),kind,title:kind==='stall'?'My fruit stall':'My weather helper'};localStorage.setItem(STORAGE_KEY,JSON.stringify(d));await mount();}
async function fruitReady(){await seedAdventure('stall');await click('Start the Market Stall');await click('Keep playing');await put('Pick up the stock display','Place the stock display');await put('Pick 4 starting fruit','Set starting fruit');await put('Pick take one tile','Set sell action');await put('Pick refill two tile','Set refill action');await click('Try my buttons!');}
async function predictFruit(n){await put(`Predict ${n} fruit left`,'Put your fruit prediction here');await click('Sell one fruit');}
test('fruit app uses working buttons, checks predictions, resumes and blocks empty sales',async()=>{
 await fruitReady();await predictFruit(4);assert(find('Open the shop!').disabled);assert.equal(saved().builders[0].draft.stockPredictionChecked,false);await predictFruit(3);await click('Open the shop!');await click('Refill the fruit shelf');assert.equal(document.querySelector('[aria-label="Fruit left"]').textContent,'4');assert.equal(saved().builders[0].draft.stockTests.length,0);await click('Sell one fruit');assert.equal(document.querySelector('[aria-label="Fruit left"]').textContent,'3');await click('Sell one fruit');assert.equal(saved().builders[0].draft.stockTests.length,1);await unmount();await mount();await click('Start the Market Stall');await click('Keep playing');for(let i=0;i<4;i++)await click('Sell one fruit');assert.equal(document.querySelector('[aria-label="Fruit left"]').textContent,'0');assert.equal(saved().builders[0].draft.stockTests.length,1);await click('Sell one fruit');assert.equal(saved().builders[0].draft.stockTests.length,2);await click('Sell one fruit');await click('Refill the fruit shelf');assert.equal(saved().builders[0].draft.stockTests.length,3);await click('Keep my app');assert.equal(saved().builders[0].projects[0].kind,'stall');await click('Play my app');for(let i=0;i<5;i++)await click('Sell one fruit');assert.equal(document.querySelector('[aria-label="Fruit left"]').textContent,'0');await click('Refill the fruit shelf');assert.equal(document.querySelector('[aria-label="Fruit left"]').textContent,'2');
});
test('a wrong sell job cannot pass and can be repaired',async()=>{
 await fruitReady();await click('Change my jobs');await put('Pick add one sell tile','Set sell action');await click('Try my buttons!');await predictFruit(3);assert.equal(document.querySelector('[aria-label="Fruit left"]').textContent,'5');assert(find('Open the shop!').disabled);assert.equal(saved().builders[0].draft.stockTests.length,0);await click('Change my jobs');await put('Pick take one tile','Set sell action');await predictFruitAfterBuild();await click('Sell one fruit');await click('Sell one fruit');assert.equal(saved().builders[0].draft.stockTests.length,1);await click('Change my jobs');assert.equal(saved().builders[0].draft.stockTests.length,1);
});
async function predictFruitAfterBuild(){await click('Try my buttons!');await predictFruit(3);await click('Open the shop!');}
test('dress up game requires correct weather connections and every weather switch',async()=>{
 await seedAdventure('weather');await click('Start the Weather Helper');await click('Keep playing');await put('Pick up umbrella','Give item to Cloud Sheep');await click('Make my toy');for(const [w,g] of [['sunny','cap'],['rainy','umbrella'],['windy','scarf']])await put(`Pick up ${g}`,`Connect ${w} picture`);await click('Let’s play!');await put('Pick up cap','Give item to Cloud Sheep');assert(find('Let’s go!').disabled);await put('Pick up umbrella','Give item to Cloud Sheep');await click('Let’s go!');for(const w of ['sunny','rainy','rainy','sunny','windy','rainy']){await click(`Make it ${w}`);await put(`Pick up ${{sunny:'cap',rainy:'umbrella',windy:'scarf'}[w]}`,'Give item to Cloud Sheep');}assert.equal(saved().builders[0].draft.weatherTests.length,3);await click('Keep my app');assert.equal(saved().builders[0].projects[0].kind,'weather');assert.equal(saved().builders[0].awards.length,1);
});
