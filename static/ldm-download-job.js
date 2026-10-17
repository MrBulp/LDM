(()=>{'use strict';let busy=false,started=0,timer=null,phase='BUILDING / PREPARING FILE',outcome='STOPPED';
 const elapsed=()=>{const sec=Math.floor((performance.now()-started)/1000);return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');};
 function paint(){const n=document.getElementById('ldmDownloadElapsed');if(!n)return;const text='DOWNLOAD JOB ('+elapsed()+') — '+phase;if(n.textContent!==text)n.textContent=text;}
 window.ldmDownloadPhase=function(value,final=false){if(!busy)return;phase=value;if(final)outcome=value;paint();};
 const guide='DOWNLOAD JOB — MANUAL SD TRANSFER\n\n1. Generate and download the LDM .gcode.3mf job package. Large artwork may take time to prepare.\n2. Copy the complete file to the A1 microSD card. Wait for copying to finish before ejecting it.\n3. Reconnect the A1 in LDM, open OPEN FILES and refresh the SD list.\n4. Select this exact job, then use REPEAT JOB / RUN FILE in LDM.\n\nSTART THIS JOB ONLY THROUGH LDM. Do not start it from the printer screen or Bambu Studio. LDM must handle the protected Repeat Job setup and start sequence.\n\nKeep the same material, tool, Surface Z and taught bed/plate center. If these changed, recalibrate and generate a new package.\n\nDownloading does not upload or start the machine.';
 const original=downloadA1PlotPackage;
 downloadA1PlotPackage=async function(gcode=null,filename=null){
  if(gcode)return original.apply(this,arguments);
  if(busy)return;
  busy=true;
  if(!await ldmConfirm(guide,'DOWNLOAD JOB — USE LDM ONLY','DOWNLOAD JOB','CANCEL')){busy=false;return;}
  started=performance.now();phase='BUILDING / PREPARING FILE';outcome='STOPPED';paint();timer=setInterval(paint,1000);const button=document.getElementById('ldmDownloadJob');if(button)button.disabled=true;
  try{if(typeof requestAnimationFrame==='function')await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));await original.apply(this,arguments);if(outcome==='STOPPED'){const reason=document.getElementById('job')?.textContent?.trim();outcome=reason?'BLOCKED — '+reason:'STOPPED — no job package was generated';}}catch(error){outcome='FAILED — '+error.message;throw error;}finally{clearInterval(timer);timer=null;phase=outcome;paint();busy=false;if(button)button.disabled=false;}
 };
 const anchor=document.getElementById('v3SvgSaveStartJobBtn');if(!anchor)return;
 const button=document.createElement('button');button.id='ldmDownloadJob';button.type='button';button.className='previewSaveBtn machineSdMainBtn';button.textContent='DOWNLOAD JOB (.3MF)';button.title='Manual SD transfer — start only through LDM OPEN FILES → REPEAT JOB';button.onclick=()=>downloadA1PlotPackage();anchor.insertAdjacentElement('afterend',button);
 const elapsedLine=document.createElement('div');elapsedLine.id='ldmDownloadElapsed';elapsedLine.style.cssText='font:inherit;color:inherit;';button.insertAdjacentElement('afterend',elapsedLine);
 const note=document.createElement('div');note.className='tiny';note.textContent='Manual SD transfer · Start ONLY through LDM OPEN FILES → REPEAT JOB';note.style.cssText='font:inherit;color:inherit;';button.insertAdjacentElement('afterend',note);
})();
