/* OPEN FILES upload-only sliced files. Never call plot preparation or start. */
(()=>{'use strict';const $=id=>document.getElementById(id);let uploading=false,items=new Map(),connectionEpoch=0;
 const connected=()=>typeof window.v3GoldenRuleMachineConnected==='function'&&window.v3GoldenRuleMachineConnected();
 function clearDisconnected(){connectionEpoch++;items.clear();const list=$('ldmSlicedFiles');list?.replaceChildren();if(list)list.disabled=true;const image=$('ldmSdThumbnail');if(image){image.hidden=true;image.removeAttribute('src');}const info=$('ldmSdThumbnailInfo');if(info)info.textContent='CONNECT TO BAMBU PRINTER to read SD files.';const gallery=$('ldmPrintPlateGallery');if(gallery){gallery.hidden=true;gallery.replaceChildren();}if($('ldmSdSlicedStatus'))$('ldmSdSlicedStatus').textContent='DISCONNECTED · no SD file read.';window.ldmSlicedPrintConnectionLost?.();}
 const disconnect=window.nativeDisconnect;if(disconnect)window.nativeDisconnect=function(...args){clearDisconnected();return disconnect.apply(this,args);};
 const machineStatus=window.ldmFoamStatus;if(machineStatus)window.ldmFoamStatus=function(s){const result=machineStatus.apply(this,arguments);if(!s?.printer_connected)clearDisconnected();return result;};
 const uploadTime=ts=>Number.isFinite(Number(ts))&&Number(ts)>0?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kuala_Lumpur',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(Number(ts)*1000))+' MYT':'Upload time unavailable';
 const selectedLdm=()=>$('sdPlotFiles')?.selectedOptions?.length===1?$('sdPlotFiles').selectedOptions[0]:null;
 const selected=()=>$('ldmSlicedFiles')?.selectedOptions?.length===1?$('ldmSlicedFiles').selectedOptions[0]:null;
 const sliced=option=>!!option&&(option.dataset.sliced==='true'||items.has(option.value));
 function paint(){if(!connected()){clearDisconnected();return;}const option=selected(),image=$('ldmSdThumbnail'),note=$('ldmSdThumbnailInfo');if(!image||!note)return;
  image.hidden=true;image.removeAttribute('src');
  if(!option){note.textContent='Select one file to view its thumbnail.';return;}
  const item=items.get(option.value);note.textContent=option.value+(item?' · '+(item.bytes/1048576).toFixed(2)+' MiB':'')+' · '+uploadTime(item?.uploaded_at);
  if(item?.thumbnail&&!($('ldmPrintPlateGallery')&&!$('ldmPrintPlateGallery').hidden)){image.src='/api/admin/sliced-sd/thumbnail?filename='+encodeURIComponent(option.value);image.hidden=false;}
  else note.textContent+=' · No cached embedded PNG thumbnail.';
 }
 async function records(){if(!connected())return;const current=connectionEpoch;const r=await fetch('/api/admin/sliced-sd'),d=await r.json();if(!r.ok)throw Error(d.error||'Cannot read uploaded-file information.');if(!connected()||current!==connectionEpoch)return;items=new Map((d.items||[]).map(x=>[x.filename,x]));
  for(const option of Array.from($('sdPlotFiles')?.options||[]))if(items.has(option.value))option.remove();
 }
 async function upload(){if(uploading)return;if(!connected()){clearDisconnected();return;}const file=$('ldmSdSlicedFile')?.files?.[0],status=$('ldmSdSlicedStatus');
  if(!file){status.textContent='Choose a sliced .gcode or .3mf file first.';return;}
  if(!/\.(?:gcode|3mf)$/i.test(file.name)||file.size>64*1048576){status.textContent='Choose .gcode or sliced .3mf, up to 64 MiB.';return;}
  if(!window.ldmConfirmSendBegin?.()){status.textContent='Upload blocked while a job or transfer is in progress.';return;}
  uploading=true;$('ldmSdSlicedUpload').disabled=true;let responseReceived=false;
  try{
   status.textContent='UPLOADING ORIGINAL SLICED FILE — '+file.name;window.v3SetQuickCurrentJobFile?.(file.name);beginSDProgress(file.name);
   const body=new FormData();body.append('file',file,file.name);
   const r=await fetch('/api/admin/sliced-sd/upload',{method:'POST',body});const d=await r.json();responseReceived=true;
   if(!r.ok||!d.success)throw Error(d.error||'Upload failed.');
   // Preserve the final real byte count; no synthetic completion or auto-start.
   const p=await fetch('/bridge/sd/progress',{cache:'no-store'}).then(r=>r.json());if(p.filename===file.name)setSDProgress(p);
   await refreshHome();const list=$('ldmSlicedFiles');if(list)list.value=file.name;
   paint();status.textContent=d.message+' Read print info below to start a sliced .3mf package.';
  }catch(e){status.textContent=e.message+' No automatic start or resend.';}
  finally{
   if(responseReceived){if(sdProgressTimer){clearInterval(sdProgressTimer);sdProgressTimer=null;}V3_SD_TRANSFER_ACTIVE=false;v3SyncSdTransferDeleteVisibility();}
   uploading=false;$('ldmSdSlicedUpload').disabled=false;window.ldmConfirmSendFinish?.(false);
  }
 }
 async function refreshHome(){const status=$('ldmSdSlicedStatus'),list=$('ldmSlicedFiles');if(!list)return;if(!connected()){clearDisconnected();return;}window.ldmSlicedPrintConnectionReady?.();const current=connectionEpoch;
  const old=list.value;list.replaceChildren();
  try{await records();if(!connected()||current!==connectionEpoch){clearDisconnected();return;}const r=await fetch('/bridge/sd/list',{cache:'no-store'}),d=await r.json();if(!r.ok||d.success===false)throw Error(d.error||'Connect the machine to read its SD files.');
   if(!connected()||current!==connectionEpoch){clearDisconnected();return;}list.disabled=!!window.V4CH_SD_FILES_JOB_LOCK;
   for(const raw of d.files||[]){const name=String(raw).split('/').pop();if(!/\.(?:gcode|3mf)$/i.test(name))continue;
    const ldm=/^(?:LDM-(?:\d+-)?(?:PLOT|FOAM)-|(?:plot|cut)_\d+)/i.test(name);if(ldm&&!items.has(name))continue;
    const option=document.createElement('option');option.value=name;option.textContent=name+' · '+uploadTime(items.get(name)?.uploaded_at);list.appendChild(option);
   }
   list.value=Array.from(list.options).some(o=>o.value===old)?old:'';paint();
  }catch(e){status.textContent=e.message;paint();}
 }
 function bind(){const manager=$('sdFileManagerDetails');if(!manager)return;
  const section=document.createElement('section');section.id='ldmSdSlicedCenter';section.innerHTML='<b>UPLOAD SLICED FILE</b><p class="tiny">Bambu Studio .gcode or sliced .3mf · any filename · up to 64 MiB. Original data stays unchanged. Upload only; existing SD files are not overwritten.</p><div class="ldmSlicedUploadRow"><input id="ldmSdSlicedFile" type="file" accept=".gcode,.3mf"><button id="ldmSdSlicedUpload" type="button">UPLOAD TO PRINTER SD CARD</button></div><div id="ldmSdSlicedStatus" class="tiny" role="status">Read a sliced .3mf package below, then START PRINT. Plain .gcode is storage/download only.</div><div class="ldmSdThumbnailArea"><img id="ldmSdThumbnail" alt="Selected sliced file thumbnail" hidden><div id="ldmSdThumbnailInfo" class="tiny">Select one file to view its thumbnail.</div></div>';
  const fileArea=document.createElement('div');fileArea.innerHTML='<div class="sd-file-head"><b>BAMBU STUDIO SLICED FILES ON SD</b><button id="ldmSlicedRefresh" type="button">REFRESH</button></div><select id="ldmSlicedFiles" size="10"></select>';
  section.querySelector('.ldmSdThumbnailArea').before(fileArea);
  const parking=document.createElement('div');parking.hidden=true;document.body.appendChild(parking);parking.appendChild(section);
  window.ldmSlicedSdPaint=paint;window.ldmSlicedSdPanel=()=>section;window.ldmSlicedSdRefresh=refreshHome;
  $('ldmSdSlicedUpload').addEventListener('click',upload);$('ldmSlicedRefresh').addEventListener('click',refreshHome);$('ldmSlicedFiles')?.addEventListener('change',paint);
  for(const name of ['v4chLockSdFilesDuringJob','v4chUnlockSdFilesAfterJob']){const previous=window[name];if(previous)window[name]=function(...args){const result=previous.apply(this,args);const list=$('ldmSlicedFiles');if(list)list.disabled=!!window.V4CH_SD_FILES_JOB_LOCK;return result;};}

  const refresh=window.refreshPlotFiles;window.refreshPlotFiles=async function(...args){const r=await refresh.apply(this,args);try{await records();}catch(_){}paint();return r;};
  const verify=window.verifySelectedProject;window.verifySelectedProject=async function(...args){const name=args[0]||selectedLdm()?.value,option=Array.from($('sdPlotFiles')?.options||[]).find(o=>o.value===name);
   if(sliced(option)||items.has(name)){const state=$('sdProjectPackageState');if(state)state.textContent='ORIGINAL SLICED FILE — upload only; start from machine LCD.';v3SetSdReadyActions(false);paint();return false;}
   return verify.apply(this,args);
  };
  // Prevent imported print G-code entering PLOT HOME / Surface-Z preparation.
  window.addEventListener('click',e=>{if(!sliced(selectedLdm())||!e.target.closest?.('#startSelectedPlotBtn'))return;e.preventDefault();e.stopImmediatePropagation();window.ldmAlert?.('Original sliced file: start from the machine LCD. LDM printing start is not enabled.');},true);
  window.addEventListener('dblclick',e=>{if(!e.target.closest?.('#sdPlotFiles')||!sliced(selectedLdm()))return;e.preventDefault();e.stopImmediatePropagation();paint();},true);
 }
 const style=document.createElement('style');style.textContent='#ldmSdSlicedCenter{border:1px solid var(--bp-line);border-radius:var(--bp-radius);padding:10px;margin:10px 0;font:inherit}.ldmSdThumbnailArea{border:1px solid var(--bp-line);padding:10px;margin-top:10px;min-height:100px;text-align:left}#ldmSdThumbnail{display:block;max-width:240px;max-height:180px;object-fit:contain;margin-bottom:8px}#ldmSdThumbnail[hidden]{display:none}#ldmSdSlicedFile{max-width:100%;font:inherit}';document.head.appendChild(style);
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();
