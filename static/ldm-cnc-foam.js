/* CNC FOAM experiment: local planning only; no machine or heater commands. */
(()=>{'use strict';
const fields=[['thickness','FOAM THICKNESS (mm)',40,0.01],['gap','BED → FOAM BOTTOM GAP (mm)',30,0.01],['diameter','CUTTER DIAMETER (mm)',3,0.1],['length','TOOL TIP BELOW NOZZLE (mm)',0,0],['depth','TOTAL CUT DEPTH (mm)',1,0.01],['pass','DEPTH PER PASS (mm)',0.5,0.01],['clearance','TRAVEL ABOVE FOAM (mm)',10,0.1],['travel','TRAVEL SPEED (mm/min)',1000,1],['plunge','PLUNGE SPEED (mm/min)',100,1],['cut','CUTTING SPEED (mm/min)',300,1]];
window.ldmCncFoamMount=host=>{
 if(!host||host.dataset.mounted)return;host.dataset.mounted='1';
 host.innerHTML='<section class="ldmCncFoam"><h3>CNC FOAM · EXPERIMENTAL</h3><p>Dense foam · rotary cutter planning</p><div class="ldmCncFields">'+fields.map(([id,label,value,min])=>`<label>${label}<input data-cnc="${id}" type="number" value="${value}" min="${min}" step="${['travel','plunge','cut'].includes(id)?1:0.01}"></label>`).join('')+'</div><p>Tool length is measured vertically from the nozzle end to cutter tip. Speeds shown are draft inputs, not validated cutting settings.</p><button type="button" data-cnc-preview>GENERATE UNPOWERED ROUTE PREVIEW</button><p data-cnc-status role="status">Planning only — no machine motion or spindle control.</p><canvas data-cnc-canvas width="720" height="520" hidden></canvas><p>Preview follows visible VECTOR centre lines. Use VECTOR OFFSET to prepare cutter-radius compensation. Powered cutting and SD job generation are not enabled in this experiment.</p></section>';
 const status=host.querySelector('[data-cnc-status]'),canvas=host.querySelector('canvas');
 host.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{canvas.hidden=true;status.textContent='Settings changed — generate the preview again.';}));
 host.querySelector('[data-cnc-preview]').onclick=()=>{if(host.querySelector('[data-cnc-source]')?.value==='stl'){document.getElementById('ldmCncSimBuild')?.click();return;}try{
  const values={};for(const [id,, ,min]of fields){const input=host.querySelector(`[data-cnc="${id}"]`);const value=Number(input.value);if(input.value===''||!Number.isFinite(value)||value<min)throw Error('Enter a valid '+id+' value.');values[id]=value;}
  const passes=Math.ceil(values.depth/values.pass);if(passes>200)throw Error('More than 200 passes. Increase depth per pass or reduce total depth.');
  const objects=(window.ldmSvgObjects||[]).filter(o=>o.visible!==false);let paths=[];for(const object of objects)paths.push(...ldmTransformPaths(object));paths=paths.filter(p=>p.length>1);
  if(!paths.length)throw Error('No visible VECTOR paths. Import or send artwork to CANVAS first.');
  let count=0,minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const path of paths)for(const [x,y]of path){if(++count>100000)throw Error('Preview limit: 100,000 points. Use a simpler test composition.');minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  const ctx=canvas.getContext('2d'),theme=getComputedStyle(host),scale=Math.min(660/Math.max(1,maxX-minX),450/Math.max(1,maxY-minY));ctx.clearRect(0,0,720,520);ctx.strokeStyle=theme.color;ctx.lineWidth=1.5;
  for(const path of paths){ctx.beginPath();path.forEach(([x,y],i)=>{const px=30+(x-minX)*scale,py=30+(y-minY)*scale;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();}
  canvas.hidden=false;status.textContent=`${paths.length} paths · ${passes} depth passes · final depth ${values.depth.toFixed(2)} mm below foam top. Each pass: travel above foam → plunge at PLUNGE SPEED → trace at CUTTING SPEED → retract. Centre-line preview only; no machine commands sent.`;
 }catch(error){canvas.hidden=true;status.textContent=error.message;}};
};
document.addEventListener('click',event=>{if(!document.querySelector('[data-artmode="cncfoam"].active'))return;const button=event.target.closest?.('button[onclick]');if(button&&/\b(startJob|v3SvgSaveStartJob|downloadA1PlotPackage)\s*\(/.test(button.getAttribute('onclick'))){event.preventDefault();event.stopImmediatePropagation();window.ldmAlert?.('CNC FOAM is a planning experiment. Machine sending is not enabled.');}},true);
})();
