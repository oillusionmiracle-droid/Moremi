import type { Builder, Project } from "./model";

export type StallEvent="sell"|"restock";
export const productNames={mango:"mangoes",orange:"oranges","puff-puff":"puff-puff"};
export const sellLabels={"remove-one":"Take away 1","add-one":"Add 1","keep-same":"Keep the same"};
export const stallCases=[{id:"two-sales",label:"Two customers",description:"Sell one. Sell one again."},{id:"empty-shelf",label:"An empty shelf",description:"Sell everything. Try one more sale."},{id:"restock",label:"More fruit arrives",description:"Sell one, then restock two."}] as const;
export type StallCase=typeof stallCases[number]["id"];
export type StallSnapshot={before:number;stock:number;blocked:boolean;event:StallEvent};

/** The same event interpreter powers play, trace and tests. */
export function stallEvent(p:Pick<Project,"sellRule"|"restockAmount">,stock:number,event:StallEvent):StallSnapshot {
  if(!Number.isInteger(stock)||stock<0||stock>100)throw new Error("Stock must be a whole number from 0 to 100.");
  if(event!=="sell"&&event!=="restock")throw new Error("Unknown stall button.");
  const blocked=event==="sell"&&stock===0;
  const delta=event==="restock"?p.restockAmount:p.sellRule==="remove-one"?-1:p.sellRule==="add-one"?1:0;
  return{before:stock,stock:blocked?stock:Math.min(100,stock+delta),blocked,event};
}
export function stallSequence(p:Project,id:StallCase):StallEvent[]{
  if(id==="two-sales")return["sell","sell"];
  if(id==="empty-shelf")return Array.from({length:p.stockStart+1},()=>"sell");
  if(id==="restock")return["sell","restock"];
  throw new Error("Unknown stall test.");
}
export function traceStall(p:Project,id:StallCase,correct=false):StallSnapshot[]{
  let stock=p.stockStart;return stallSequence(p,id).map(event=>{const next=stallEvent(correct?{sellRule:"remove-one",restockAmount:2}:p,stock,event);stock=next.stock;return next;});
}
export function runStallCase(p:Project,id:StallCase):Project {
  const trace=traceStall(p,id);return{...p,stockTests:[...p.stockTests.filter(t=>t.id!==id),{id,revision:p.revision,stocks:trace.map(t=>t.stock),blocked:trace.map(t=>t.blocked)}],updatedAt:new Date().toISOString()};
}
export function stallCasePassed(p:Project,id:StallCase){
  const actual=p.stockTests.find(t=>t.id===id&&t.revision===p.revision),expected=traceStall(p,id,true);
  return !!actual&&actual.stocks.length===expected.length&&actual.blocked.length===expected.length&&expected.every((step,i)=>actual.stocks[i]===step.stock&&actual.blocked[i]===step.blocked);
}
export function stallPredictionCorrect(p:Project){return p.stockPredictionChecked&&p.stockPrediction===p.stockStart-1;}
export function stallEligible(p:Project,b:Builder){
  const base=p.sourceId?b.projects.find(x=>x.id===p.sourceId)?.stockStart??3:3;
  return p.stockDisplayPlaced&&p.stockStart!==base&&p.sellRule==="remove-one"&&p.restockAmount===2&&stallPredictionCorrect(p)&&stallCases.every(t=>stallCasePassed(p,t.id));
}
type Rules=Pick<Project,"stockStart"|"sellRule"|"restockAmount">;
function invalidate(p:Project,next:Rules,history=p.stockHistory):Project{return{...p,...next,revision:p.revision+1,stockTests:[],stockPrediction:null,stockPredictionChecked:false,stockHistory:history,updatedAt:new Date().toISOString()};}
export function changeStall(p:Project,change:Partial<Rules>):Project{
  const next={stockStart:p.stockStart,sellRule:p.sellRule,restockAmount:p.restockAmount,...change};
  if(!Number.isInteger(next.stockStart)||next.stockStart<2||next.stockStart>8||!Number.isInteger(next.restockAmount)||next.restockAmount<1||next.restockAmount>3||!Object.hasOwn(sellLabels,next.sellRule))throw new Error("That stall rule is outside the allowed choices.");
  if(next.stockStart===p.stockStart&&next.sellRule===p.sellRule&&next.restockAmount===p.restockAmount)return p;
  return invalidate(p,next,[...p.stockHistory,{stockStart:p.stockStart,sellRule:p.sellRule,restockAmount:p.restockAmount}].slice(-20));
}
export function undoStall(p:Project){const last=p.stockHistory.at(-1);return last?invalidate(p,last,p.stockHistory.slice(0,-1)):p;}
