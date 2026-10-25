/* GUI.62: artwork drafts are independent of the submitted machine program. */
(()=>{'use strict';
 let captured=false,draftReady=false;
 window.ldmArtworkCaptureBegin=()=>{captured=false;draftReady=false;window.ldmSyncArtworkJobEditing?.();};
 window.ldmArtworkPayloadCaptured=()=>{captured=true;window.ldmSyncArtworkJobEditing?.();};
 window.ldmArtworkProgramCaptured=()=>captured;
 const mode=()=>document.querySelector('.v3ArtworkModeTabs [data-artmode].active')?.dataset.artmode||'vector';
 const active=()=>typeof V3_JOB_MOTION_LOCK!=='undefined'&&!!V3_JOB_MOTION_LOCK;
 const handoffBusy=()=>!!(window.ldmConfirmSendArtworkBusy?.()||
  (typeof V3_SD_TRANSFER_ACTIVE!=='undefined'&&V3_SD_TRANSFER_ACTIVE)||
  (typeof V3_AUTO_START_IN_FLIGHT!=='undefined'&&V3_AUTO_START_IN_FLIGHT)||
  (typeof V3_AUTO_START_NEW_SD!=='undefined'&&V3_AUTO_START_NEW_SD)||
  (typeof ldmPlotStartBusy!=='undefined'&&ldmPlotStartBusy)||
  (typeof V3_QS_INTERNAL_REPEAT_HOME!=='undefined'&&V3_QS_INTERNAL_REPEAT_HOME));
 window.ldmArtworkPreparationBusy=()=>handoffBusy()&&!captured;
 window.ldmCanvasDraftImportBlocked=(ignoreImport=false)=>!!(window.V3_LDM_ENDING||(!ignoreImport&&window.ldmCanvasImportBusy)||window.ldmArtworkPreparationBusy());
 window.ldmCanvasDraftAdded=()=>{draftReady=true;queueMicrotask(()=>window.ldmSyncArtworkJobEditing?.());};
 window.ldmArtworkJobEditing=()=>(draftReady||active()||(captured&&handoffBusy()))&&['vector','inbox','text','draw','algorithm','stl'].includes(mode())&&!window.ldmArtworkPreparationBusy();
 window.ldmArtworkEditBlocked=(ignoreImport=false)=>{
  if((!ignoreImport&&window.ldmCanvasImportBusy)||window.ldmArtworkPreparationBusy())return true;
  if(window.ldmArtworkJobEditing())return false;
  return document.body.classList.contains('v3PreviewEditLocked')||
   (typeof V3_PREVIEW_EDIT_LOCK!=='undefined'&&V3_PREVIEW_EDIT_LOCK)||active();
 };
 function sync(){const on=window.ldmArtworkJobEditing(),changed=document.body.classList.contains('ldmJobDraftEditing')!==on;
  if(changed)document.body.classList.toggle('ldmJobDraftEditing',on);
  const overlay=document.getElementById('v3PreviewEditLock');if(overlay){const hidden=on||!(typeof V3_PREVIEW_EDIT_LOCK!=='undefined'&&V3_PREVIEW_EDIT_LOCK);if(overlay.getAttribute('aria-hidden')!==String(hidden))overlay.setAttribute('aria-hidden',String(hidden));}
  let note=document.getElementById('ldmJobDraftNotice');const host=document.getElementById('ldmLabCanvasAction');
  if(!note&&host){note=document.createElement('p');note.id='ldmJobDraftNotice';note.className='tiny';note.setAttribute('role','status');note.textContent='ARTWORK DRAFT · Changes affect this draft only. Captured transfers and running jobs stay unchanged; machine sending uses CONFIRM & SEND.';host.append(note);}
  if(note&&note.hidden===on)note.hidden=!on;
  if(changed){window.ldmRefreshSvgList?.();if(on){if(mode()==='text')window.renderTextObjects?.();else if(mode()==='vector')window.ldmRenderComposition?.();}}
 }
 window.ldmSyncArtworkJobEditing=sync;
 // Guard only artwork controls while a source is being captured/transferred.
 // Machine setup, SD files and command buttons retain their own hard interlocks.
 for(const name of ['pointerdown','click','input','change','keydown'])window.addEventListener(name,e=>{
  if(!window.ldmArtworkPreparationBusy()||!e.target.closest?.('#art,#ldmDrawDraftSurface,#svgObjectList,.svgObjectManager,#textMainSection,#ldmDrawLayers,.ldmVectorColourMenu'))return;
  e.preventDefault();e.stopImmediatePropagation();
 },true);
 function boot(){sync();document.addEventListener('ldm-artwork-job-state',sync);document.addEventListener('click',()=>queueMicrotask(sync));new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});setInterval(sync,300);}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
