import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync} from 'node:fs';
import {check,report,results,setSuite} from './lib.mjs';

setSuite('harness-self-test');
function result(){
 // These are deliberately failing fixtures, not failures of the CI job itself.
 const log=console.log,actions=process.env.GITHUB_ACTIONS,summary=process.env.GITHUB_STEP_SUMMARY;
 console.log=()=>{};delete process.env.GITHUB_ACTIONS;delete process.env.GITHUB_STEP_SUMMARY;
 try{return report();}finally{
  console.log=log;
  if(actions!==undefined)process.env.GITHUB_ACTIONS=actions;
  if(summary!==undefined)process.env.GITHUB_STEP_SUMMARY=summary;
 }
}
afterEach(()=>{
 results.length=0;
 rmSync(new URL('../build/audit/harness-self-test.json',import.meta.url),{force:true});
});

test('a passing measurement without calibration fails the report',async()=>{
 await check({name:'forgot-calibration',measure:()=>0,pass:v=>v===0});
 assert.equal(results[0].status,'UNCALIBRATED');
 assert.equal(result(),false);
});

test('a broken case that also passes fails the report',async()=>{
 await check({name:'blind-check',measure:()=>0,pass:v=>v===0,calibrate:()=>0});
 assert.equal(results[0].status,'UNPROVEN');
 assert.equal(result(),false);
});

test('a failed calibration is visible and cannot prove a check',async()=>{
 await check({name:'broken-control',measure:()=>0,pass:v=>v===0,
  calibrate:()=>{throw new Error('fixture failed to render');}});
 assert.equal(results[0].status,'UNPROVEN');
 assert.match(results[0].calErr,/fixture failed/);
 assert.equal(result(),false);
});

test('NaN from a broken renderer is not a successful known-bad calibration',async()=>{
 await check({name:'invalid-control',measure:()=>2,pass:v=>v>1,calibrate:()=>NaN});
 assert.equal(results[0].status,'UNPROVEN');
 assert.match(results[0].calErr,/non-finite/);
 assert.equal(result(),false);
});

test('a check with a separating broken case passes and preserves evidence',async()=>{
 const evidence={sourceHash:'source-a',pixelHash:'pixels-a'};
 await check({name:'proved-check',measure:()=>0,pass:v=>v===0,calibrate:()=>1,evidence});
 assert.equal(results[0].status,'PASS');
 assert.deepEqual(results[0].evidence,evidence);
 assert.equal(result(),true);
 const saved=JSON.parse(readFileSync(new URL('../build/audit/harness-self-test.json',import.meta.url),'utf8'));
 assert.deepEqual(saved.checks['proved-check'].evidence,evidence);
});
