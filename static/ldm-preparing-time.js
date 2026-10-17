(()=>{'use strict';let started=null,lastDuration=null,phase='BUILDING / PREPARING FILE',timer=null,failure='';
 function state(){return {active:!!(V3_JOB_MOTION_LOCK||V3_SVG_SAVE_START_MOVING_LOCK),preparing:!!(window.V3_QUICK_SD_QUEUE_CYCLE||V3_PREVIEW_SAVE_CLICK_LOCK||V3_SD_TRANSFER_ACTIVE||V3_AUTO_START_IN_FLIGHT)};}
 function format(ms){const seconds=Math.floor(Math.max(0,ms)/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
 function paint(){const s=state(),preparing=s.preparing&&!s.active;
  if(preparing&&!failure&&started===null){started=performance.now();lastDuration=null;phase='BUILDING / PREPARING FILE';}
  if(!preparing&&started!==null){lastDuration=performance.now()-started;started=null;}
  const box=document.getElementById('v3QuickActiveJobStatus');
  const warning=box?.querySelector('.v3QuickActiveJobWarning');
  if(failure&&warning){const text=window.ldmPreparingHeading();if(warning.textContent!==text)warning.textContent=text;}
  else if(preparing&&warning){const text=window.ldmPreparingHeading();if(warning.textContent!==text)warning.textContent=text;}
  if(preparing&&!failure&&!timer)timer=setInterval(paint,1000);
  if(!preparing&&timer){clearInterval(timer);timer=null;}
 }
 const sync=window.v3SyncQuickActiveJobStatus;
 if(typeof sync==='function')window.v3SyncQuickActiveJobStatus=function(){const result=sync.apply(this,arguments);paint();return result;};
 window.ldmPreparingHeading=()=> failure?('PREPARATION FAILED — '+failure):'PREPARING JOB ('+format(started===null?0:performance.now()-started)+') — BUILDING / PREPARING FILE';
 window.ldmPreparingFailed=text=>{failure=String(text||'Preparation did not complete.');started=null;if(timer){clearInterval(timer);timer=null;}paint();};
 window.ldmPreparingBegin=()=>{failure='';started=performance.now();lastDuration=null;phase='BUILDING / PREPARING FILE';paint();};
 document.addEventListener('click',e=>{const b=e.target.closest?.('#v3SvgSaveStartJobBtn');if(!b||b.disabled)return;failure='';started=performance.now();lastDuration=null;phase='BUILDING / PREPARING FILE';queueMicrotask(paint);},true);
 paint();
})();
