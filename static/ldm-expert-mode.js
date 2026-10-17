/* V6.8: Expert is a tab-session preference, not a calibration completion flag. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),key='ldmExpertAcknowledgementV68';
 let accepted=null,suppress=false,initializing=true,armed=false,initial=null;
 const num=v=>{if(v==null||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
 function type(){return $('v4MaterialJobType')?.value==='vinyl'?'vinyl':'pen'}
 function values(){return {cd:type()==='vinyl'?num($('cutDepth')?.value):0,sz:num($('v3QuickSurfaceValue')?.value),zl:num($('v4MaterialZLift')?.value??$('v3JobLift')?.value),zls:num($('v4MaterialZLiftSpeed')?.value??$('zFeed')?.value),ms:num((type()==='vinyl'?$('cutFeed'):$('plotSpeed'))?.value??$('v4FinalMachineSpeed')?.value)}}
 function valid(v){return v&&['cd','sz','zl','zls','ms'].every(k=>v[k]!==null&&Number.isFinite(v[k]))&&v.zl>=0&&v.zls>0&&v.ms>0}
 function same(a,b){return valid(a)&&valid(b)&&['cd','sz','zl','zls','ms'].every(k=>Math.abs(a[k]-b[k])<=0.0000005)}
 function persist(){try{if(armed&&valid(accepted))sessionStorage.setItem(key,JSON.stringify({values:accepted,type:type()}));else sessionStorage.removeItem(key)}catch(_){} }
 try{initial=JSON.parse(sessionStorage.getItem(key)||'null')}catch(_){}
 function disarm(warn=true){
   armed=false;accepted=null;persist();const cb=$('v4ExpertModeCheck');
   if(cb?.checked){suppress=true;cb.checked=false;cb.dispatchEvent(new Event('change',{bubbles:true}));suppress=false;}
   $('v3QuickStepsDrawer')?.classList.remove('v4fiExpertPostFinishLock');
   if(warn){const m='EXPERT MODE RESET — MACHINE SETUP CHANGED\n\nCUT DEPTH, SZ, Z LIFT, Z LIFT SPEED or TRAVEL SPEED changed. Review the values, then check EXPERT MODE again.';window.ldmAlert?window.ldmAlert(m):alert(m)}
 }
 function checkChanged(){if(!initializing&&!suppress&&armed&&!same(values(),accepted))disarm()}
 const fields=new Set(['cutDepth','v3JobCutDepth','v7MaterialCutDepth','v3QuickSurfaceValue','v4ExpertSurfaceZ','v4MaterialZLift','v4MaterialZLiftSpeed','v3JobLift','penLift','zFeed','v4FinalMachineSpeed','v4dtCompactLift','v4dtCompactLiftSpeed','v4dtCompactMachineSpeed','v4duCompactMachineSpeed','plotSpeed','cutFeed','v4MaterialJobType']);
 document.addEventListener('change',e=>{
   if(e.target?.id==='v4ExpertModeCheck'){
     if(suppress||initializing)return;
     armed=!!e.target.checked;accepted=armed?values():null;
     if(armed&&!valid(accepted)){disarm(false);return;}persist();return;
   }
   if(fields.has(e.target?.id))queueMicrotask(checkChanged);
 },false);
 document.addEventListener('input',e=>{if(fields.has(e.target?.id))queueMicrotask(checkChanged)},false);
 function set(id,v){const el=$(id);if(el)el.value=String(v)}
 function restore(){
   const cb=$('v4ExpertModeCheck');
   if(initial&&valid(initial.values)&&initial.type===type()){
     const v=initial.values;
     if(type()==='vinyl'){set('cutDepth',v.cd);set('v3JobCutDepth',v.cd);set('v7MaterialCutDepth',v.cd);}
     // Restore numeric preferences only. Never restore HOME/center/material flags.
     set('v3QuickSurfaceValue',v.sz);set('v4ExpertSurfaceZ',v.sz);
     for(const id of ['v4MaterialZLift','v3JobLift','penLift','v4dtCompactLift'])set(id,v.zl);
     for(const id of ['v4MaterialZLiftSpeed','zFeed','v4dtCompactLiftSpeed'])set(id,v.zls);
     for(const id of [type()==='vinyl'?'cutFeed':'plotSpeed','v4FinalMachineSpeed','v4dtCompactMachineSpeed','v4duCompactMachineSpeed'])set(id,v.ms);
     accepted=values();armed=same(accepted,v);
     if(cb)cb.checked=armed;
     window.V4_EXPERT_PRESET_SURFACE_Z=v.sz;
   }else{armed=!!cb?.checked;accepted=armed?values():null;}
   initial=null;initializing=false;persist();
   window.v3QuickSequentialSync?.();
 }
 // Run after inherited boot/reset callbacks, before any user-triggered send.
 function boot(){setTimeout(restore,0)}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
 const finish=window.v3MarkJobFinished;
 if(typeof finish==='function')window.v3MarkJobFinished=function(...args){
   const keep=armed&&$('v4ExpertModeCheck')?.checked&&same(values(),accepted);
   const r=finish.apply(this,args);
   if(keep){
     const retain=()=>{if(armed&&same(values(),accepted)){const cb=$('v4ExpertModeCheck');if(cb)cb.checked=true;persist();}};
     retain();queueMicrotask(retain);setTimeout(retain,0);
   }
   return r;
 };
 // Catch effective/programmatic changes too, but never re-arm a runner failure.
 setInterval(()=>{
   if(initializing||suppress)return;checkChanged();
   if(armed&&!$('v4ExpertModeCheck')?.checked)disarm(false);
 },500);
 window.addEventListener('pagehide',()=>{if(armed&&$('v4ExpertModeCheck')?.checked&&same(values(),accepted))persist();else{armed=false;persist()}});
 window.ldmExpertAcknowledgedValues=()=>armed?{...accepted}:null;
})();
