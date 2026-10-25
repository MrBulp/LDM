window.ldmCommitDrawLayerSet=async(input,canvas,guides,perspective)=>{
 if(window.ldmCanvasDraftImportBlocked?.())throw Error('Wait until the current artwork capture or import finishes.');
 if(window.ldmCanvasImportBusy)throw Error('CANVAS import is busy.');ldmSnapshot();const old=ldmSvgObjects.slice(),signature=()=>JSON.stringify(old.map(o=>[o.raw,o.x,o.y,o.scale,o.rot,o.mx,o.my,o.visible,o.locked])),before=signature();window.ldmCanvasImportBusy=true;
 try{
  const ready=[];
  async function prepare(raw,name,colour,visible,locked=false){if(!raw.length)return;const geometry=await ldmPrepareVectorGeometry(raw),b=geometry.bounds;if(!b)throw Error('Empty layer: '+name);const text='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+canvas.width+' '+canvas.height+'">'+raw.map(p=>'<polyline fill="none" stroke="'+colour+'" points="'+p.map(q=>q.join(',')).join(' ')+'"/>').join('')+'</svg>';ready.push({object:{name,text,raw,x:(b.minx+b.maxx-canvas.width)/2,y:(b.miny+b.maxy-canvas.height)/2,scale:100,rot:0,mx:false,my:false,visible,locked,lineColour:colour},geometry});}
  for(const l of input){const doc=new DOMParser().parseFromString(l.svg,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('Invalid drawing layer: '+l.name);await prepare(await ldmCapturePathsAsync(doc.documentElement),l.name,l.colour,l.visible!==false,!!l.locked);}
  for(const [helper,name] of [[guides,'WRITING GUIDES'],[perspective,'PERSPECTIVE GUIDES']]){if(!helper)continue;const palette=['#2471a3','#b03a2e','#148f77','#7d3c98','#111111'];const colour=palette.find(c=>![...old,...ready.map(r=>r.object)].some(o=>o.lineColour===c))||'#111111';await prepare(helper.paths,name,colour,true);}
  const warning=window.ldmWritingGuideOverflow?.(ready.filter(r=>r.object.visible!==false&&!['WRITING GUIDES','PERSPECTIVE GUIDES'].includes(r.object.name)).flatMap(r=>r.object.raw),canvas)||'';
  if(!ready.length)throw Error('No drawable layers.');if(signature()!==before||old.length!==ldmSvgObjects.length||old.some((o,i)=>o!==ldmSvgObjects[i]))throw Error('Composition changed. Try SEND again.');
  if(window.ldmCanvasDraftImportBlocked?.(true))throw Error('Artwork capture began. Draft was not imported.');
  for(const {object,geometry}of ready){ldmVectorNodeCache.set(object,{raw:object.raw,group:geometry.group});ldmVectorBoundsCache.set(object.raw,geometry.bounds);ldmSvgObjects.push(object);}window.ldmCanvasDraftAdded?.();ldmSelectedSvg=old.length;ldmLoadControls();ldmRefreshSvgList();ldmRenderComposition();FTE.built=false;window.ldmShowWritingTransferStatus?.('DRAW / WRITE added to CANVAS. '+(warning||'Complete the machine setup before CONFIRM & SEND.'));return ready.length;
 }finally{window.ldmCanvasImportBusy=false;}
};
