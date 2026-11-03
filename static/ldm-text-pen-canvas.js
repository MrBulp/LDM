/* TEXT pen sections: atomic VECTOR transfer, numeric metadata, timed SD holds. */
(()=>{'use strict';
window.ldmCanvasHasPenChanges=()=>!window.ldmDrawJobSource&&(window.ldmSvgObjects||[]).some(o=>o.visible!==false&&o.ldmPenChange===true);
window.ldmTextPenParts=function(canvas,name){
 const objects=typeof textObjects==='undefined'?[]:textObjects;
 if(!objects.some(o=>o.ldmCharacterPen?.some(v=>v===true)))return null;
 const parts=[];
 for(const group of document.querySelectorAll('#art > .a1text')){
  const object=objects[Number(group.dataset.idx)];if(!object||object.ldmCreativeGuideData)continue;
  const clean=group.cloneNode(true);clean.querySelectorAll('rect,[data-role],.ldmTextEditorLocal').forEach(n=>n.remove());
  clean.removeAttribute('class');clean.removeAttribute('data-idx');
  const strokes=[...clean.querySelectorAll('polyline')];if(!strokes.length)continue;
  let changes=[];
  if(object.ldmCharacterPen?.some(v=>v===true)){
   if(!object.ldmLiveTypewriter)throw Error('Use Live Typing to mark pen-change text before sending.');
   const layout=window.ldmLiveTypewriterLayout(object);
   if(layout.error||layout.paths.length!==strokes.length)throw Error('TEXT pen sections differ from preview. Refresh the TEXT preview before sending.');
   changes=layout.penChanges||[];
  }
  const cuts=[...new Set([0,...changes,strokes.length])].sort((a,b)=>a-b);let alternate=false;
  for(let i=0;i<cuts.length-1;i++){
   const a=cuts[i],b=cuts[i+1];if(changes.includes(a))alternate=!alternate;
   if(a===b)continue;const clone=clean.cloneNode(true);[...clone.querySelectorAll('polyline')].forEach((n,j)=>{if(j<a||j>=b)n.remove();else{n.removeAttribute('style');n.setAttribute('fill','none');n.setAttribute('stroke','#000');}});
   parts.push({name:name+' · '+(parts.length+1)+(alternate?' · CHANGE PEN':''),pen_change:alternate,svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+canvas.width+' '+canvas.height+'">'+new XMLSerializer().serializeToString(clone)+'</svg>'});
  }
 }
 if(!parts.length)throw Error('No TEXT pen sections found.');return parts;
};
window.ldmCommitTextPenParts=async function(parts,canvas,guides){
 if(window.ldmCanvasDraftImportBlocked?.()||window.ldmCanvasImportBusy)throw Error('Wait until the current artwork capture or import finishes.');
 const objects=window.ldmSvgObjects;ldmSnapshot();const existing=objects.slice(),signature=()=>JSON.stringify(existing),before=signature(),textBefore=JSON.stringify(typeof textObjects==='undefined'?[]:textObjects);
 window.ldmCanvasImportBusy=true;const ready=[],selectedBefore=window.ldmSelectedSvg;let committed=false;
 try{
  for(const part of [...parts,...(guides?(guides.layers||[{name:'WRITING GUIDES',paths:guides.paths}]).map(g=>({name:g.name,paths:g.paths,pen_change:false})):[])]){
   const raw=part.paths||await ldmCapturePathsAsync(new DOMParser().parseFromString(part.svg,'image/svg+xml').documentElement);
   if(!raw.length)throw Error('A TEXT pen section contains no drawable paths.');
   const geometry=await ldmPrepareVectorGeometry(raw),b=geometry.bounds;if(!b)throw Error('No TEXT pen section geometry.');
   const colour=part.pen_change?'#b03a2e':part.paths?'#2471a3':'#17202a';
   const text='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+canvas.width+' '+canvas.height+'">'+raw.map(p=>'<polyline fill="none" stroke="'+colour+'" points="'+p.map(q=>q.join(',')).join(' ')+'"/>').join('')+'</svg>';
   ready.push({geometry,object:{name:part.name,text,raw,x:(b.minx+b.maxx-canvas.width)/2,y:(b.miny+b.maxy-canvas.height)/2,scale:100,rot:0,mx:false,my:false,visible:true,ldmTextPenSection:true,lineColour:colour,...(part.pen_change?{ldmPenChange:true}:{})}});
  }
  if(existing.length+ready.length>200)throw Error('TEXT pen sections would exceed 200 VECTOR layers. Split the draft.');
  if(signature()!==before||JSON.stringify(typeof textObjects==='undefined'?[]:textObjects)!==textBefore||objects.length!==existing.length||existing.some((o,i)=>o!==objects[i])||window.ldmCanvasDraftImportBlocked?.(true))throw Error('Composition changed during import. TEXT retained; retry.');
  for(const {object,geometry}of ready){ldmVectorNodeCache.set(object,{raw:object.raw,group:geometry.group});ldmVectorBoundsCache.set(object.raw,geometry.bounds);objects.push(object);}
  committed=true;window.ldmCanvasDraftAdded?.();window.ldmSelectedSvg=existing.length;ldmLoadControls();ldmRefreshSvgList();ldmRenderComposition();FTE.built=false;return true;
 }catch(error){if(committed&&objects.length===existing.length+ready.length&&ready.every((r,i)=>objects[existing.length+i]===r.object)){objects.splice(existing.length,ready.length);window.ldmSelectedSvg=selectedBefore;try{ldmLoadControls();ldmRefreshSvgList();ldmRenderComposition();}catch{}}throw error;}finally{window.ldmCanvasImportBusy=false;}
};
window.ldmTextPenPause=function(lines,label,lift,zf,alreadyUp){
 if(!(lift>0&&Number.isFinite(lift)&&zf>0))throw Error('TEXT pen change requires a positive pen lift.');
 if(!alreadyUp)lines.push('G91','G1 Z'+lift.toFixed(3)+' F'+zf,'M400');
 lines.push('; LDM TEXT PEN CHANGE - '+String(label).replace(/[^a-zA-Z0-9 ._-]/g,' ').slice(0,100),'M400','M17','M1006 S1','M1006 A0 B0 L45 C72 D8 M100 E72 F8 N100','M1006 W','M400','G4 P'+(window.ldmVectorColourHoldSeconds()*1000),'G91');
};
})();
