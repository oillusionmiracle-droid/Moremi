"use client";
import {ArrowRight} from 'lucide-react';
import {motion} from 'motion/react';
import type {Project} from '@/lib/moremi/model';
import {weatherInputs,weatherLabels,weatherOutput,gearLabels,type Weather} from '@/lib/moremi/weather';
import {DropSpot,ToyArt,WeatherGlyph} from './play-scene';

export function WeatherPad({project,weather,onWeather,placing=false,reduced=false}:{project:Project;weather:Weather;onWeather:(w:Weather)=>void;placing?:boolean;reduced?:boolean}){
 const item=weatherOutput(project,weather);
 return <div className="mw-weather-pad" aria-label="Your working weather app">
 <span className="mw-weather-pad-title">MY WEATHER APP</span>
 {placing?<DropSpot id="weather-input" label="Place the weather input" className="mw-weather-input-socket"><WeatherGlyph weather="sunny"/><span>Drop weather buttons here</span></DropSpot>:
 <div className="mw-weather-inputs" role="group" aria-label="Weather input">{weatherInputs.map(w=><button type="button" key={w} aria-label={`Make it ${w}`} aria-pressed={w===weather} onClick={()=>onWeather(w)}><WeatherGlyph weather={w}/><span>{weatherLabels[w]}</span></button>)}</div>}
 <div className="mw-weather-runtime"><span>WEATHER<br/><WeatherGlyph weather={weather}/></span><ArrowRight/><motion.div className="mw-weather-output" key={`${weather}:${item}`} initial={reduced?false:{scale:.85}} animate={{scale:1}} transition={{duration:.2}}><small>PACK THIS</small>{!placing&&<ToyArt name={item}/>}<output aria-label="App chose" aria-live="polite">{placing?'?':gearLabels[item]}</output></motion.div></div>
 <small className="mw-auto-note">{placing?'Add an input to start':'Change the weather. Your app chooses the item.'}</small>
 </div>;
}
