/* V9.EXPERIMENT.17: panel actions target checked layers without changing machine workflows. */
(()=>{'use strict';
 const id=n=>document.getElementById(n),all=()=>window.ldmSvgObjects||[];
 const targets=()=>{const checked=window.ldmGetSelectedVectorLayers?.()||[];return checked.length?checked.filter(o=>all().includes(o)):[all()[window.ldmSelectedSvg]].filter(Boolean)};
 const status=s=>{if(id('job'))id('job').textContent=s;};
 function bounds(items){return items.reduce((b,o)=>{const q=window.ldmBounds((window.ldmVectorVisualPaths||window.ldmTransformPaths)({...o,visible:true}));if(!q)throw Error('Selected layer has no geometry.');return {minx:Math.min(b.minx,q.minx),maxx:Math.max(b.maxx,q.maxx),miny:Math.min(b.miny,q.miny),maxy:Math.max(b.maxy,q.maxy)};},{minx:Infinity,maxx:-Infinity,miny:Infinity,maxy:-Infinity});}
 window.ldmTransformSelectedLayers=function(action,dx=0,dy=0){try{
  if(window.V3_LDM_ENDING||window.ldmCanvasImportBusy||window.ldmVectorLayerGestureBusy?.()||window.ldmArtworkEditBlocked?.())throw Error('Wait until artwork capture / import finishes.');
  const items=targets();if(!items.length)throw Error('Select a VECTOR layer first.');if(items.some(o=>o.locked))throw Error('Unlock all selected layers before transforming.');
  const active=all()[window.ldmSelectedSvg]||items[0],pw=Number(id('paperW').value),ph=Number(id('paperH').value);
  if(!(pw>0&&ph>0))throw Error('Set valid CANVAS dimensions first.');
  const b=bounds(items),cx=(b.minx+b.maxx-pw)/2,cy=(b.miny+b.maxy-ph)/2;
  let factor=1,angle=0,tx=0,ty=0;
  if(action==='update'){
   const scale=Number(id('scale').value),rot=Number(id('rotate').value),x=Number(id('svgX').value),y=Number(id('svgY').value);
   if(![scale,rot,x,y].every(Number.isFinite)||scale<=0)throw Error('Enter valid scale, rotation and offsets.');
   factor=scale/active.scale;angle=rot-active.rot;tx=x-active.x;ty=y-active.y;
  }else if(action==='fit'){factor=Math.min(pw/Math.max(.0001,b.maxx-b.minx),ph/Math.max(.0001,b.maxy-b.miny))*.9;tx=-cx;ty=-cy;}
  else if(action==='center'){tx=-cx;ty=-cy;}
  else if(action==='nudge'){tx=dx;ty=dy;}
  else if(!['mirrorX','mirrorY','reset'].includes(action))return false;
  const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const updates=items.map(o=>{let x=o.x-cx,y=o.y-cy;const n={x:cx+factor*(x*c-y*s)+tx,y:cy+factor*(x*s+y*c)+ty,scale:o.scale*factor,rot:o.rot+angle,mx:o.mx,my:o.my};
   if(action==='mirrorX'){n.x=2*cx-o.x;n.rot=-o.rot;n.mx=!o.mx;}
   if(action==='mirrorY'){n.y=2*cy-o.y;n.rot=-o.rot;n.my=!o.my;}
   if(action==='reset'){const ar=-active.rot*Math.PI/180,ac=Math.cos(ar),as=Math.sin(ar),rx=o.x-active.x,ry=o.y-active.y,k=100/active.scale;n.x=(rx*ac-ry*as)*k*(active.mx?-1:1);n.y=(rx*as+ry*ac)*k*(active.my?-1:1);n.scale=o.scale*k;n.rot=(o.rot-active.rot)*(active.mx!==active.my?-1:1);n.mx=!!o.mx!==!!active.mx;n.my=!!o.my!==!!active.my;}
   if(!Object.values(n).every(v=>typeof v==='boolean'||Number.isFinite(v))||n.scale<=0)throw Error('Transform exceeds valid numeric limits.');return {o,n};});
  window.ldmPreviewHistoryRecord?.();for(const {o,n}of updates)Object.assign(o,n);
  window.ldmLoadControls?.();window.ldmRefreshSvgList?.();window.ldmRenderComposition?.();if(typeof FTE!=='undefined')FTE.built=false;window.ldmPreviewHistoryRecord?.();window.ldmArtworkBoundaryCheck?.({popup:false});
  status(items.length+' SELECTED LAYER(S) — '+action.toUpperCase()+'.');return true;
 }catch(e){status(e.message);return false;}};
 // Only panel UI is intercepted: internal import, setup and repeat functions retain their original behavior.
 window.addEventListener('click',e=>{const button=e.target.closest?.('button[onclick]');if(!button||!button.closest('#svgMainSection')||button.disabled)return;const code=button.getAttribute('onclick')||'';let action=null,dx=0,dy=0;
  if(/^applyPreciseSvgTransform\(\)/.test(code))action='update';
  else if(/^toggleMirrorButton\('X'\)/.test(code))action='mirrorX';else if(/^toggleMirrorButton\('Y'\)/.test(code))action='mirrorY';
  else if(/^fitArt\(\)/.test(code))action='fit';else if(/^centerArt\(\)/.test(code))action='center';else if(/^resetSvgToImportState\(\)/.test(code))action='reset';
  else{const m=code.match(/^nudgeSvg\((-?\d+),(-?\d+)\)/);if(m){action='nudge';dx=Number(m[1]);dy=Number(m[2]);}}
  if(!action)return;e.preventDefault();e.stopImmediatePropagation();window.ldmTransformSelectedLayers(action,dx,dy);
 },true);
})();
