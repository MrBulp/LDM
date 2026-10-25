/* GUI.73: align VECTOR artwork using transformed geometry, never editor handles. */
(()=>{'use strict';
 const id=n=>document.getElementById(n),objects=()=>window.ldmSvgObjects||[];
 const mode=()=>document.querySelector('.v3ArtworkModeTabs [data-artmode].active')?.dataset.artmode||'vector';
 const targets=()=>{const checked=window.ldmGetSelectedVectorLayers?.()||[];if(checked.length)return [...new Set(checked)].filter(o=>objects().includes(o));const active=objects()[window.ldmSelectedSvg];return active?[active]:[];};
 const blocked=()=>!['vector','inbox'].includes(mode())||!!(window.V3_LDM_ENDING||window.ldmCanvasImportBusy||window.ldmVectorLayerGestureBusy?.()||window.ldmArtworkEditBlocked?.());
 const notice=text=>{if(id('ldmVectorAlignStatus'))id('ldmVectorAlignStatus').textContent=text;};
 function sync(){const items=targets(),disabled=blocked()||!items.length||items.some(o=>o.locked);for(const b of document.querySelectorAll('[data-vector-align]'))if(b.disabled!==disabled)b.disabled=disabled;}
 window.ldmAlignVectorLayers=function(action,reference=id('ldmVectorAlignReference')?.value||'canvas'){
  try{
   if(!['center','left','right','bottom','top'].includes(action)||!['canvas','selection'].includes(reference))return false;
   if(blocked())throw Error('Wait until artwork capture / import finishes, or enable draft editing.');
   const items=targets();if(!items.length)throw Error('Select a VECTOR layer first.');
   if(items.some(o=>o.locked))throw Error('Unlock all selected layers before aligning.');
   if(reference==='selection'&&items.length<2)throw Error('Select at least two layers to align within the selection.');
   const width=Number(id('paperW')?.value),height=Number(id('paperH')?.value);if(!(width>0&&height>0&&Number.isFinite(width)&&Number.isFinite(height)))throw Error('Set valid CANVAS dimensions first.');
   window.ldmPreviewHistoryRecord?.();
   const prepared=items.map(o=>{const bounds=window.ldmBounds((window.ldmVectorVisualPaths||window.ldmTransformPaths)({...o,visible:true}));if(!bounds||Object.values(bounds).some(n=>!Number.isFinite(n))||!Number.isFinite(o.x)||!Number.isFinite(o.y))throw Error('Selected artwork has no valid geometry.');return {o,bounds};});
   const ref=reference==='canvas'?{minx:0,miny:0,maxx:width,maxy:height}:prepared.reduce((b,p)=>({minx:Math.min(b.minx,p.bounds.minx),miny:Math.min(b.miny,p.bounds.miny),maxx:Math.max(b.maxx,p.bounds.maxx),maxy:Math.max(b.maxy,p.bounds.maxy)}),{minx:Infinity,miny:Infinity,maxx:-Infinity,maxy:-Infinity});
   const updates=prepared.map(({o,bounds:b})=>{let dx=0,dy=0;if(action==='left')dx=ref.minx-b.minx;if(action==='right')dx=ref.maxx-b.maxx;if(action==='top')dy=ref.miny-b.miny;if(action==='bottom')dy=ref.maxy-b.maxy;if(action==='center'){dx=(ref.minx+ref.maxx-b.minx-b.maxx)/2;dy=(ref.miny+ref.maxy-b.miny-b.maxy)/2;}return {o,x:o.x+dx,y:o.y+dy};});
   for(const {o,x,y}of updates){o.x=x;o.y=y;}
   window.ldmLoadControls?.();window.ldmRefreshSvgList?.();window.ldmRenderComposition?.();if(typeof FTE!=='undefined')FTE.built=false;window.ldmPreviewHistoryRecord?.();
   notice(items.length+' VECTOR layer(s) aligned '+action.toUpperCase()+' to '+(reference==='canvas'?'CANVAS':'SELECTION')+'.');sync();return true;
  }catch(e){notice(e.message||'Alignment could not complete.');sync();return false;}
 };
 for(const name of ['ldmRefreshSvgList','ldmSetSelectedVectorLayers','ldmSyncArtworkJobEditing']){const previous=window[name];if(typeof previous==='function')window[name]=function(...args){const result=previous.apply(this,args);sync();return result;};}
 // ARTWORK slides intentionally stop bubbling at their overlay boundary.
 // Capture here after the established access/preparation guards.
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-vector-align]');if(b){e.preventDefault();window.ldmAlignVectorLayers(b.dataset.vectorAlign);}queueMicrotask(sync);},true);
 document.addEventListener('change',()=>queueMicrotask(sync));document.addEventListener('ldm-artwork-job-state',sync);
 // Checkbox clicks are consumed by VECTOR selection's window capture listener.
 // Observe its rendered state, rather than waiting for a document bubble event.
 function boot(){sync();new MutationObserver(records=>{
  if(records.some(r=>r.target===document.body||r.target.closest?.('#svgObjectList,#ldmVectorSelectionBar,.v3ArtworkModeTabs')))sync();
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
