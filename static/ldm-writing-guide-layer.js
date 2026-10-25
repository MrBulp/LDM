/* Explicit, separate VECTOR import. Preview helpers remain outside artwork. */
window.ldmAddWritingGuidesLayer=async(paths,canvas)=>{
 if(window.ldmCanvasDraftImportBlocked?.())throw Error('Wait until the current artwork capture or import finishes.');
 if(window.ldmCanvasImportBusy)throw Error('CANVAS import is busy. Please wait.');
 if(!paths.length||paths.some(p=>p.length<2||p.some(q=>!q.every(Number.isFinite))))throw Error('No valid writing lines.');
 ldmSnapshot();const existing=ldmSvgObjects.slice(),raw=paths.map(p=>p.map(q=>q.slice()));
 const signature=()=>JSON.stringify(existing.map(o=>[o.raw,o.x,o.y,o.scale,o.rot,o.mx,o.my,o.visible]));const before=signature();window.ldmCanvasImportBusy=true;
 try{
  const prepared=await ldmPrepareVectorGeometry(raw),b=prepared.bounds;if(!b)throw Error('Writing guides have no drawable geometry.');
  if(signature()!==before||ldmSvgObjects.length!==existing.length||existing.some((o,i)=>o!==ldmSvgObjects[i]))throw Error('Composition changed. Try adding guides again.');
  if(window.ldmCanvasDraftImportBlocked?.(true))throw Error('Artwork capture began. Guides were not imported.');
  const colour=['#2471a3','#b03a2e','#148f77','#7d3c98'].find(c=>!existing.some(o=>o.lineColour?.toLowerCase()===c))||'#2471a3';
  const text='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+canvas.width+' '+canvas.height+'">'+raw.map(p=>'<polyline fill="none" stroke="'+colour+'" points="'+p.map(q=>q.join(',')).join(' ')+'"/>').join('')+'</svg>';
  const object={name:'WRITING GUIDES '+String(existing.filter(o=>/^WRITING GUIDES/.test(o.name||'')).length+1).padStart(3,'0'),text,raw,x:(b.minx+b.maxx-canvas.width)/2,y:(b.miny+b.maxy-canvas.height)/2,scale:100,rot:0,mx:false,my:false,visible:true,lineColour:colour};
  ldmVectorNodeCache.set(object,{raw,group:prepared.group});ldmVectorBoundsCache.set(raw,b);ldmSvgObjects.push(object);window.ldmCanvasDraftAdded?.();ldmSelectedSvg=ldmSvgObjects.length-1;ldmLoadControls();ldmRefreshSvgList();ldmRenderComposition();FTE.built=false;return object;
 }finally{window.ldmCanvasImportBusy=false;}
};

/* Prepare both layers before committing either: a failed preparation keeps the drawing. */
window.ldmCommitWritingWithGuides=async(svg,canvas,guides,name)=>{
 if(window.ldmCanvasDraftImportBlocked?.())throw Error('Wait until the current artwork capture or import finishes.');
 if(window.ldmCanvasImportBusy)throw Error('CANVAS import is busy. Please wait.');
 ldmSnapshot();const existing=ldmSvgObjects.slice(),signature=()=>JSON.stringify(existing.map(o=>[o.raw,o.x,o.y,o.scale,o.rot,o.mx,o.my,o.visible])),before=signature();window.ldmCanvasImportBusy=true;
 try{
  const doc=new DOMParser().parseFromString(svg,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('Invalid drawing.');
  const writing=await ldmCapturePathsAsync(doc.documentElement);if(!writing.length)throw Error('No writing found.');
  const blue=['#2471a3','#b03a2e','#148f77','#7d3c98'].find(c=>!existing.some(o=>o.lineColour?.toLowerCase()===c))||'#2471a3';
  const black=blue==='#b03a2e'?'#17202a':'#b03a2e';
  const prepared=[];
  for(const [raw,label,colour]of [[writing,name,black],[guides.paths,'WRITING GUIDES '+String(existing.filter(o=>/^WRITING GUIDES/.test(o.name||'')).length+1).padStart(3,'0'),blue]]){
   const geometry=await ldmPrepareVectorGeometry(raw),b=geometry.bounds;if(!b)throw Error('No drawable '+label+' geometry.');
   const text='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+canvas.width+' '+canvas.height+'">'+raw.map(p=>'<polyline fill="none" stroke="'+colour+'" points="'+p.map(q=>q.join(',')).join(' ')+'"/>').join('')+'</svg>';
   const object={name:label,text,raw,x:(b.minx+b.maxx-canvas.width)/2,y:(b.miny+b.maxy-canvas.height)/2,scale:100,rot:0,mx:false,my:false,visible:true,lineColour:colour};prepared.push({object,geometry});
  }
  if(signature()!==before||ldmSvgObjects.length!==existing.length||existing.some((o,i)=>ldmSvgObjects[i]!==o))throw Error('Composition changed. Send again.');
  if(window.ldmCanvasDraftImportBlocked?.(true))throw Error('Artwork capture began. Writing was not imported.');
  for(const {object,geometry}of prepared){ldmVectorNodeCache.set(object,{raw:object.raw,group:geometry.group});ldmVectorBoundsCache.set(object.raw,geometry.bounds);ldmSvgObjects.push(object);}
  window.ldmCanvasDraftAdded?.();ldmSelectedSvg=existing.length;ldmLoadControls();ldmRefreshSvgList();ldmRenderComposition();FTE.built=false;return true;
 }finally{window.ldmCanvasImportBusy=false;}
};
