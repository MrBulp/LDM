/* GUI.189: shared preparation presentation and OPEN FILES lock for PLOT/FOAM.
   No commands, host reservations or machine-motion flags are changed here. */
(()=>{'use strict';let preparing=false,repeatPreparing=false,submitted=false,cleanupNeeded=false,artworkUnlockPending=false,repeatArtworkCycle=false;
 const machineBusy=()=>!!(V3_JOB_MOTION_LOCK||V3_SVG_SAVE_START_MOVING_LOCK);
 const transferBusy=()=>!!(V3_SD_TRANSFER_ACTIVE||V3_AUTO_START_IN_FLIGHT||V3_AUTO_START_NEW_SD);
 const locked=()=>preparing||repeatPreparing||submitted||machineBusy()||transferBusy();
 function releaseFinishedArtwork(){
  if(!artworkUnlockPending||locked()||window.ldmCanvasImportBusy||(typeof V3_REPEAT_PROCESSING!=='undefined'&&V3_REPEAT_PROCESSING)||(typeof V3_QS_INTERNAL_REPEAT_HOME!=='undefined'&&V3_QS_INTERNAL_REPEAT_HOME))return;
  artworkUnlockPending=false;V3_PREVIEW_SAVE_CLICK_LOCK=false;
  // Only edit/click locks are released. Calibration, Step 5 and machine state stay authoritative.
  window.v3SetPreviewEditLock?.(false);window.v3G3LResetSaveStartClickLock?.();window.v3SyncSvgSaveStartJobLock?.();
 }
 window.ldmConfirmSendArtworkBusy=()=>preparing||repeatPreparing;
 function syncFiles(){
  window.ldmSyncArtworkJobEditing?.();
  releaseFinishedArtwork();
  if(!locked()&&cleanupNeeded){
   cleanupNeeded=false;window.V3_QUICK_SD_QUEUE_CYCLE=false;V3_PREVIEW_SAVE_CLICK_LOCK=false;
   window.v3SetPreviewEditLock?.(false);window.v3G3LResetSaveStartClickLock?.();window.v3SyncQuickActiveJobStatus?.();
  }
  if(locked())window.v4chLockSdFilesDuringJob?.();
  else window.v4chUnlockSdFilesAfterJob?.();
 }
 // Repeat owns the same file lock from the first double-click, including
 // file verification, confirmation dialogs and saved FOAM setup reads.
 window.ldmRepeatFilesPending=()=>repeatPreparing;
 window.ldmRepeatFilesBegin=()=>{if(locked())return false;window.ldmArtworkCaptureBegin?.();repeatPreparing=true;repeatArtworkCycle=true;artworkUnlockPending=false;syncFiles();return true;};
 window.ldmRepeatFilesSubmitted=()=>{if(repeatPreparing){submitted=true;syncFiles();}};
 window.ldmRepeatFilesFinish=()=>{repeatPreparing=false;
  if(!submitted&&!machineBusy()&&!transferBusy()){
   repeatArtworkCycle=false;window.V3_QUICK_SD_QUEUE_CYCLE=false;V3_PREVIEW_SAVE_CLICK_LOCK=false;
   if(typeof V3_REPEAT_PROCESSING!=='undefined')V3_REPEAT_PROCESSING=false;
  }
  syncFiles();window.v3SyncQuickActiveJobStatus?.();
 };
 window.ldmConfirmSendSyncFiles=syncFiles;
 window.ldmConfirmSendSubmitted=()=>{submitted=true;syncFiles();};
 const unlock=window.v4chUnlockSdFilesAfterJob;
 if(typeof unlock==='function')window.v4chUnlockSdFilesAfterJob=function(){if(!locked())return unlock.apply(this,arguments);};
 const filesSync=window.v3SyncSdFilesActiveJobLock;
 if(typeof filesSync==='function')window.v3SyncSdFilesActiveJobLock=function(){const result=filesSync.apply(this,arguments);syncFiles();return result;};
 window.ldmConfirmSendBegin=function(){
  if(locked())return false;
  window.ldmArtworkCaptureBegin?.();preparing=true;cleanupNeeded=false;artworkUnlockPending=false;repeatArtworkCycle=false;window.V3_QUICK_SD_QUEUE_CYCLE=true;window.V3_QUICK_CURRENT_JOB_FILE='';
  V3_PREVIEW_SAVE_CLICK_LOCK=true;window.v3SetPreviewEditLock?.(true);
  syncFiles();window.ldmPreparingBegin?.();window.ldmResetSdQueueDrawerChoice?.();
  window.v4OpenAcceptedSdJobQueue?.();window.v3SyncQuickActiveJobStatus?.();
  return true;
 };
 window.ldmConfirmSendFinish=function(started){
  preparing=false;if(started!==undefined)submitted=!!started;
  cleanupNeeded=!submitted;
  if(!submitted&&!machineBusy()&&!transferBusy()){
   cleanupNeeded=false;window.V3_QUICK_SD_QUEUE_CYCLE=false;V3_PREVIEW_SAVE_CLICK_LOCK=false;
   window.v3SetPreviewEditLock?.(false);window.v3G3LResetSaveStartClickLock?.();
  }
  syncFiles();window.v3SyncQuickActiveJobStatus?.();window.v3SyncSvgSaveStartJobLock?.();
 };
 // Some legacy OPEN FILES renderers replace disabled/onchange. Block mouse,
 // touch, keyboard and dispatched selection events until the owner releases.
 for(const event of ['pointerdown','click','dblclick','keydown','change'])window.addEventListener(event,e=>{
  if(!locked()||!e.target.closest?.('#sdPlotFiles,#v3DeleteSelectedFilesBtn,#v3DeleteAllFilesBtn'))return;
  e.preventDefault();e.stopImmediatePropagation();syncFiles();
 },true);
 // FINISH / authoritative STOP remain the only successful-job release points.
 for(const name of ['v3MarkJobFinished','v3ForceRecal123AfterMachineStop']){
  const previous=window[name];if(typeof previous!=='function')continue;
  window[name]=function(...args){const finishedRepeat=name==='v3MarkJobFinished'&&(repeatArtworkCycle||(typeof V3_REPEAT_PROCESSING!=='undefined'&&V3_REPEAT_PROCESSING));const result=previous.apply(this,args);
   if(!preparing){submitted=false;if(finishedRepeat)artworkUnlockPending=true;repeatArtworkCycle=false;syncFiles();queueMicrotask(syncFiles);}return result;
  };
 }
 const motion=window.v3SetJobMotionLock;
 if(typeof motion==='function')window.v3SetJobMotionLock=function(){const r=motion.apply(this,arguments);queueMicrotask(syncFiles);return r;};
 function bind(){
  const previous=window.v3SvgSaveStartJob;
  if(typeof previous!=='function')return;
  window.v3SvgSaveStartJob=async function(...args){
   // FOAM starts the same lifecycle inside its async action, including calls
   // from its tab. PLOT retains every existing preparation/motion gate.
   if(window.ldmFoamMaterialActive?.())return previous.apply(this,args);
   if(!window.ldmConfirmSendBegin()){
    const reason=machineBusy()?'Machine is active. Wait for completion.':transferBusy()?'A file transfer or start request is already active.':'Another preparation owns the file queue.';
    window.ldmPreparingFailed?.(reason);return;
   }
   const read=id=>window.ldmUiSourceText?.(document.getElementById(id))||document.getElementById(id)?.textContent||'';
   const before=read('job');let failure='';
   try{
    const result=await previous.apply(this,args);
    if(!submitted&&!machineBusy()&&!transferBusy()){
     const status=read('job'),log=read('drawLog');
     failure=status&&status!==before?status:log&&/BLOCKED|ERROR|INCOMPLETE|NOT READY/i.test(log)?log:'PLOT preparation returned without a verified SD file or accepted start. Check STEP 1–5 and the build log.';
    }
    return result;
   }catch(error){failure=error?.message||String(error);throw error;}
   finally{window.ldmConfirmSendFinish();if(failure){window.ldmPreparingFailed?.(failure);const target=document.getElementById('job');if(target)target.textContent='PREPARATION FAILED — '+failure;window.ldmAlert?.('PLOT PREPARATION FAILED\n\n'+failure);}}
  };
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
 // Both PLOT and FOAM use one monitor, exact-file selection and verification.
 // Progress completion itself never starts a machine job.
 window.ldmTransferPreparedSdJob=async function(payload){
  const raw=String(payload.filename||''),expected=raw.toLowerCase().endsWith('.3mf')?raw:raw+'.3mf';
  window.v3SetQuickCurrentJobFile?.(expected);beginSDProgress(expected);
  const thumb=payload.foam_token?null:await ldmBuild3mfCanvasThumbnail(raw);
  const response=await fetch('/bridge/sd/save-plot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({},thumb||{},payload,{replace_ready:true}))});
  const result=await response.json();
  if(!response.ok||!result.success){
   // A returned server rejection is definitive; a network loss above is not.
   // The latter keeps monitoring the original transfer, never resending it.
   if(sdProgressTimer){clearInterval(sdProgressTimer);sdProgressTimer=null;}
   V3_SD_TRANSFER_ACTIVE=false;v3SyncSdTransferDeleteVisibility();syncFiles();
   throw Error(result.error||'SD transfer was rejected. No start request was sent.');
  }
  // Save completed on the server. Read the last real progress once, then end
  // this monitor. Keep the list locked throughout exact-file verification.
  if(sdProgressTimer){clearInterval(sdProgressTimer);sdProgressTimer=null;}
  let name='';
  try{
   try{const p=await fetch('/bridge/sd/progress',{cache:'no-store'}).then(r=>r.json());
    if(String(p.filename||'').split('/').pop().toLowerCase()===expected.split('/').pop().toLowerCase())setSDProgress(p);
   }catch(_){}
   name=String(result.project_file||'').split('/').pop();
   if(!name||name.toLowerCase()!==expected.split('/').pop().toLowerCase())throw Error('Saved SD package does not match this job. No start request was sent.');
   window.v3SetQuickCurrentJobFile?.(name);await sdList();await refreshPlotFiles();
   const select=document.getElementById('sdPlotFiles');
   const exact=select&&Array.from(select.options).find(o=>o.value.toLowerCase()===name.toLowerCase());
   if(!exact)throw Error('Saved job was not found in the refreshed SD list. No start request was sent.');
   select.value=exact.value;
   if(!await verifySelectedProject(name))throw Error('Uploaded package could not be verified on SD. No start request was sent.');
  }finally{V3_SD_TRANSFER_ACTIVE=false;v3SyncSdTransferDeleteVisibility();syncFiles();}
  return Object.assign({},result,{project_file:name});
 };
})();
