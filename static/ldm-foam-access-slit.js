/* Exact CANVAS-coordinate insertion: never normalise or re-centre source artwork. */
window.ldmFoamAccessSlitPlacement=(paths,canvas)=>{
 if(!paths.length||paths.some(p=>p.length<2||p.some(q=>q.length!==2||!q.every(Number.isFinite))))throw Error('Invalid access slit coordinates.');
 let minx=Infinity,maxx=-Infinity,miny=Infinity,maxy=-Infinity;
 for(const p of paths)for(const [x,y]of p){minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);}
 return {x:(minx+maxx-canvas.width)/2,y:(miny+maxy-canvas.height)/2,scale:100,rot:0,mx:false,my:false};
};
window.ldmAddFoamAccessSlit=async(paths,canvas)=>{
 if(window.ldmCanvasImportBusy)throw Error('CANVAS import is busy.');
 ldmSnapshot();const existing=ldmSvgObjects.slice(),raw=paths.map(p=>p.map(q=>q.slice())),placement=window.ldmFoamAccessSlitPlacement(raw,canvas);
 const signature=()=>JSON.stringify(existing.map(o=>({raw:o.raw,x:o.x,y:o.y,scale:o.scale,rot:o.rot,mx:o.mx,my:o.my,visible:o.visible})));
 const before=signature();window.ldmCanvasImportBusy=true;
 try{
  const prepared=await ldmPrepareVectorGeometry(raw);
  if(signature()!==before||ldmSvgObjects.length!==existing.length||existing.some((o,i)=>ldmSvgObjects[i]!==o))throw Error('Artwork changed during preparation. Regenerate the suggestion.');
  const text='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+canvas.width+' '+canvas.height+'">'+raw.map(p=>'<polyline fill="none" stroke="#ff00cc" points="'+p.map(q=>q.join(',')).join(' ')+'"/>').join('')+'</svg>';
  const object={name:'FOAM ACCESS SLIT',text,raw,...placement,lineColour:'#ff00cc',visible:true};
  ldmVectorNodeCache.set(object,{raw,group:prepared.group});ldmVectorBoundsCache.set(raw,prepared.bounds);
  ldmSvgObjects.push(object);ldmSelectedSvg=ldmSvgObjects.length-1;
  ldmLoadControls();ldmRefreshSvgList();ldmRenderComposition();FTE.built=false;
  return object;
 }finally{window.ldmCanvasImportBusy=false;}
};
