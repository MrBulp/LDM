/* Navigation only: observe successful existing gates; never check/unlock them. */
(()=>{'use strict';
 const routes=[['v4HomeCard',1,2],['v3QuickMaterialTile',2,3],['v3QuickSurfaceTile',3,4]];
 window.ldmStepProgressTarget=(before,after,current)=>{for(const [card,from,to]of routes)if(!before[card]&&after[card]&&current===from)return to;return null;};
 function boot(){const drawer=document.getElementById('v3QuickStepsDrawer');if(!drawer)return;let queued=false;
 const read=()=>Object.fromEntries(routes.map(([card])=>[card,!!document.getElementById(card)?.classList.contains('v4GateGreen')]));let previous=read();
 function sync(){queued=false;const next=read(),target=window.ldmStepProgressTarget(previous,next,Number(drawer.dataset.v7Step));previous=next;
 if(target===null||drawer.dataset.v7Files||!document.getElementById('v3StepShow')?.classList.contains('open')||drawer.hasAttribute('data-guide-step'))return;
 if(window.V3_SD_TRANSFER_ACTIVE||(typeof V3_JOB_MOTION_LOCK!=='undefined'&&V3_JOB_MOTION_LOCK))return;
 // Dispatch only navigation to the original rail, after confirmed state propagation.
 drawer.querySelector('#ldmV7StepRail [data-v7-step="'+target+'"]')?.click();
 }
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(sync);}};
 new MutationObserver(schedule).observe(drawer,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
 document.addEventListener('change',schedule);
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
