(()=>{'use strict';let pending=null,worker=null,generation=0;
 const input=document.getElementById('file');if(!input)return;
 input.accept='.svg,.ngc,image/svg+xml,text/plain,application/octet-stream';
 const status=message=>{const n=document.getElementById('job');if(n)ldmIdleSetText(n,message)};
 input.addEventListener('change',async e=>{
  const file=input.files?.[0];generation++;const version=generation;pending=null;if(worker){worker.terminate();worker=null;}
  if(!file||!file.name.toLowerCase().endsWith('.ngc'))return;
  e.stopImmediatePropagation();svgText='';
  if(file.size>64*1024*1024){status('NGC import failed: maximum file size is 64 MB.');return;}
  status('READING NGC — '+file.name);
  try{const text=await file.text();if(version!==generation)return;
   worker=new Worker('static/ldm-ngc-worker.js?v=73');status('PARSING NGC — '+file.name);
   worker.onmessage=event=>{if(version!==generation)return;worker.terminate();worker=null;
    if(!event.data.ok){status('NGC import failed: '+event.data.error);return;}
    pending={name:file.name,raw:event.data.paths,text:event.data.svg,segments:event.data.segments};status(file.name+' ready — '+pending.raw.length+' strokes — PLACE INTO PREVIEW');
   };
   worker.onerror=()=>{if(version!==generation)return;worker?.terminate();worker=null;status('NGC import failed: background parser unavailable.');};worker.postMessage({text});
  }catch(error){status('NGC import failed: '+error.message);}
 },true);
 const original=sendSvgToPreview;
 sendSvgToPreview=function(){
  if(window.ldmCanvasDraftImportBlocked?.()){status('Wait until the current artwork capture or import finishes.');return false;}
  if(worker){status('NGC is still parsing. Wait for READY.');return;}
  if(!pending)return original.apply(this,arguments);
  const data=pending;pending=null;ldmSnapshot();
  const o={name:data.name,text:'',raw:data.raw,x:0,y:0,scale:100,rot:0,mx:false,my:false};
  /* SVG backup uses the same source coordinates; raw geometry enters the existing VECTOR pipeline directly. */
  o.text=data.text;
  ldmSvgObjects.push(o);ldmSelectedSvg=ldmSvgObjects.length-1;selectedPreviewObject={kind:'vector',idx:ldmSelectedSvg};clearObjectEditOverlay?.();
  ldmLoadControls();ldmRefreshSvgList();ldmRenderComposition();FTE.built=false;input.value='';
  window.ldmCanvasDraftAdded?.();status('NGC ADDED — '+data.name+' — '+data.raw.length+' strokes, '+data.segments+' segments');
 };
})();
