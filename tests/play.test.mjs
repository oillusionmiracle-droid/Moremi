import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,createStallProject,createWeatherProject,changePrice,changeRule,casePassed} from '../lib/moremi/model.ts';
import {changeStall,stallSequence,stallCasePassed} from '../lib/moremi/stall.ts';
import {changeWeather,correctWeatherRules,weatherCasePassed} from '../lib/moremi/weather.ts';
import {deliverSnacks,deliverStall,deliverWeather} from '../lib/moremi/play.ts';
test('snack evidence requires the right basket, payment and app rule',()=>{let p=changePrice(createProject(),150);assert.throws(()=>deliverSnacks(p,'two',2,300),/machine/);p=changeRule(p,'multiply');assert.throws(()=>deliverSnacks(p,'two',1,300),/2 snacks/);assert.throws(()=>deliverSnacks(p,'two',2,450),/coin/);assert.equal(p.tests.length,0);p=deliverSnacks(p,'two',2,300);assert(casePassed(p,'two'));assert.equal(p.prediction,300);assert(casePassed(deliverSnacks(p,'zero',0,0),'zero'));});
test('fruit evidence requires every event, including empty blocked sale',()=>{const p=changeStall(createStallProject(),{stockStart:4,sellRule:'remove-one',restockAmount:2});const events=stallSequence(p,'empty-shelf');assert.throws(()=>deliverStall(p,'empty-shelf',events.slice(0,-1)));assert(stallCasePassed(deliverStall(p,'empty-shelf',events),'empty-shelf'));assert.throws(()=>deliverStall(createStallProject(),'two-sales',['sell','sell']),/tiles/);});
test('weather evidence cannot skip an intermediate weather change',()=>{const p=changeWeather(createWeatherProject(),{weatherRules:correctWeatherRules});assert.throws(()=>deliverWeather(p,'switch',['rainy']));assert.throws(()=>deliverWeather(p,'switch',['rainy','rainy','windy','rainy']));assert(weatherCasePassed(deliverWeather(p,'switch',['rainy','sunny','windy','rainy']),'switch'));});
