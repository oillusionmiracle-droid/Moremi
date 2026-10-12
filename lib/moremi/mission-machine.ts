import { createActor, createMachine } from "xstate";
import type { Stage } from "./model";
export const missionMachine=createMachine({id:"counter-journey",initial:"challenge",states:{challenge:{on:{NEXT:"direction"}},direction:{on:{NEXT:"draft",BACK:"challenge"}},draft:{on:{NEXT:"edit",BACK:"direction"}},edit:{on:{NEXT:"predict",BACK:"draft"}},predict:{on:{NEXT:"test",BACK:"edit"}},test:{on:{NEXT:"handoff",BACK:"predict"}},handoff:{on:{NEXT:"complete",BACK:"test"}},complete:{type:"final"}}});
export function moveStage(stage:Stage,event:"NEXT"|"BACK"):Stage{const actor=createActor(missionMachine,{snapshot:missionMachine.resolveState({value:stage,context:{}})}).start();actor.send({type:event});const value=actor.getSnapshot().value as Stage;actor.stop();return value;}
