/* GUI.41: per-file canvas visibility, shared by preview and output geometry. */
(()=>{'use strict';
 const objects=()=>window.ldmSvgObjects||[];
 function syncControls(){const on=!!objects()[window.ldmSelectedSvg]?.locked;
   document.querySelectorAll('#svgX,#svgY,#scale,#rotate,#mirrorX,#mirrorY,#mirrorXBtn,#mirrorYBtn,.svgObjectManager button[onclick="fitArt()"],.svgObjectManager button[onclick="centerArt()"],.svgObjectManager button[onclick="resetSvgToImportState()"],.svgObjectManager button[onclick="ldmDuplicateSvg()"],.svgObjectManager button[onclick^="ldmMoveSvg("]').forEach(b=>{
     if(on){if(!b.disabled)b.dataset.ldmLayerDisabled='true';b.disabled=true;}else if(b.dataset.ldmLayerDisabled){b.disabled=false;delete b.dataset.ldmLayerDisabled;}
   });
 }

 const transform=window.ldmTransformPaths,render=window.ldmRenderComposition,list=window.ldmRefreshSvgList;
 if(typeof transform!=='function'||typeof render!=='function'||typeof list!=='function')return;
 window.ldmTransformPaths=function(o){return o?.visible===false?[]:transform.apply(this,arguments)};
 window.ldmRenderComposition=function(){
   const result=render.apply(this,arguments);
   document.querySelectorAll('#art .ldmMultiSvg[data-svg-index]').forEach(g=>{if(objects()[Number(g.dataset.svgIndex)]?.visible===false)g.remove()});
   return result;
 };
 window.ldmToggleSvgVisibility=function(i){
   const o=objects()[i];if(!o)return;
   window.ldmSnapshot?.();o.visible=o.visible===false;
   if(typeof FTE!=='undefined')FTE.built=false;
   document.getElementById('svgObjectList')?.dispatchEvent(new Event('input',{bubbles:true}));
   window.ldmRefreshSvgList();window.ldmRenderComposition();
 };
 window.ldmToggleSvgLayerLock=function(i){
   const o=objects()[i];if(!o||window.ldmCanvasImportBusy||window.ldmVectorLayerGestureBusy?.()||(window.ldmArtworkEditBlocked?window.ldmArtworkEditBlocked(true):(document.body.classList.contains('v3PreviewEditLocked')||(typeof V3_JOB_MOTION_LOCK!=='undefined'&&V3_JOB_MOTION_LOCK)))||(typeof kSvgEdit!=='undefined'&&kSvgEdit.mode)||(typeof svgArtDrag!=='undefined'&&svgArtDrag))return;
   window.ldmSelectSvgObject(i);window.ldmCloseLayerColourMenu?.();o.locked=!o.locked;
   window.ldmRefreshSvgList();window.ldmRenderComposition();
   const info=document.getElementById('job');if(info)info.textContent=o.locked?'LAYER LOCKED — unlock this layer to edit.':'LAYER UNLOCKED — ready to edit.';
 };
 const eye='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
 window.ldmRefreshSvgList=function(){
   const result=list.apply(this,arguments);syncControls();const box=document.getElementById('svgObjectList');if(!box)return result;
   box.querySelectorAll('.textObjectRow').forEach((row,i)=>{
     const o=objects()[i];if(!o)return;const on=o.visible!==false;
     const button=document.createElement('button');button.type='button';button.className='ldmFileVisibility';
     button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',(on?'Hide ':'Show ')+(o.name||'file')+' on CANVAS');
     button.title=(on?'ON — hide':'OFF — show')+' on CANVAS';
     button.innerHTML=eye+(on?'':'<path d="m3 3 18 18"/>')+'</svg>';
     button.onclick=e=>{e.preventDefault();e.stopPropagation();window.ldmToggleSvgVisibility(i)};
     const lock=document.createElement('button'),isLocked=!!o.locked;lock.type='button';lock.className='ldmLayerLock';
     lock.setAttribute('aria-pressed',String(isLocked));lock.setAttribute('aria-label',(isLocked?'Unlock ':'Lock ')+(o.name||'layer'));lock.title=(isLocked?'LOCKED — unlock':'UNLOCKED — lock')+' layer';
     lock.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="'+(isLocked?'M8 10V7a4 4 0 0 1 8 0v3':'M8 10V7a4 4 0 0 1 7.5-2')+'"/><path d="M12 14v3"/></svg>';
     lock.onclick=e=>{e.preventDefault();e.stopPropagation();window.ldmToggleSvgLayerLock(i)};
     row.classList.toggle('ldmLayerLocked',isLocked);row.insertBefore(lock,row.querySelector('.textObjectDelete'));
     row.insertBefore(button,row.querySelector('.textObjectDelete'));
   });return result;
 };
 window.ldmRefreshSvgList();
})();
