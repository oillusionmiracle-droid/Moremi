import {type Project} from './model';

export type ButtonAction='add-one'|'take-one';
/** Component behaviour is shared by the editor, live creation and test rounds. */
export function configureButton(p:Project,change:Partial<Pick<Project,'buttonPlaced'|'buttonConnected'|'buttonAction'>>):Project {
 const next={...p,...change};
 if(!next.buttonPlaced)next.buttonConnected=false;
 if(next.buttonPlaced===p.buttonPlaced&&next.buttonConnected===p.buttonConnected&&next.buttonAction===p.buttonAction)return p;
 return {...next,revision:p.revision+1,tests:[],prediction:null,predictionChecked:false,updatedAt:new Date().toISOString()};
}
export function pressButton(p:Project,count:number):number {
 if(!Number.isInteger(count)||count<0||count>12)throw new Error('Invalid order count.');
 if(!p.buttonPlaced||!p.buttonConnected)throw new Error('Give your button a job first.');
 return Math.max(0,Math.min(12,count+(p.buttonAction==='add-one'?1:-1)));
}
