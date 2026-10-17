/* GUI.42: optional selected-slice measurements, inspector only. */
(()=>{'use strict';let enabled=false;
 function bounds(paths){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
   for(const line of paths||[])for(const p of line||[]){if(!Number.isFinite(p[0])||!Number.isFinite(p[1]))continue;minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1])}
   return Number.isFinite(minX)?{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY}:null;
 }
 window.ldmSliceDimensionBounds=bounds;
 window.ldmSetSliceDimensions=on=>{enabled=!!on;window.ldmSTLDrawSliceInspector?.()};
 window.ldmDrawSliceDimensions=function(canvas,state,layout){
   if(!enabled)return;const b=bounds(state.paths);if(!b)return;
   const {sc,ox,oy}=layout,ctx=canvas.getContext('2d'),x0=ox+b.minX*sc,x1=ox+b.maxX*sc,y0=oy+b.minY*sc,y1=oy+b.maxY*sc;
   const dy=Math.min(canvas.height-18,y1+18),dx=Math.max(28,x0-24);
   ctx.save();ctx.strokeStyle=ctx.fillStyle=document.body.classList.contains('ldm-dark')?'#edf2ef':'#202724';ctx.lineWidth=1;ctx.font='12px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
   function line(a,b,c,d){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke()}
   function arrow(x,y,angle){const n=5;line(x,y,x+n*Math.cos(angle-.45),y+n*Math.sin(angle-.45));line(x,y,x+n*Math.cos(angle+.45),y+n*Math.sin(angle+.45))}
   line(x0,y1+3,x0,dy+4);line(x1,y1+3,x1,dy+4);line(x0,dy,x1,dy);arrow(x0,dy,0);arrow(x1,dy,Math.PI);
   ctx.fillText((['left','right'].includes(state.sliceDirection)?'Y ':'X ')+b.width.toFixed(2)+' mm',(x0+x1)/2,dy+12);
   line(dx-4,y0,x0-3,y0);line(dx-4,y1,x0-3,y1);line(dx,y0,dx,y1);arrow(dx,y0,Math.PI/2);arrow(dx,y1,-Math.PI/2);
   ctx.translate(dx-12,(y0+y1)/2);ctx.rotate(-Math.PI/2);ctx.fillText((state.sliceDirection&&state.sliceDirection!=='top'?'Z ':'Y ')+b.height.toFixed(2)+' mm',0,0);ctx.restore();
 };
 const option=()=>'<label class="ldmSliceDimensionOption" title="Measure the selected slice contour in millimetres; preview guide only"><input id="ldmSliceDimensions" type="checkbox" '+(enabled?'checked ':'')+'onchange="ldmSetSliceDimensions(this.checked)"> SHOW SLICE DIMENSIONS</label>';
 const panel=window.ldmSTLPanelHTML;if(typeof panel==='function')window.ldmSTLPanelHTML=function(){return panel.apply(this,arguments).replace('<div id="ldmSTLSliceControls" style="display:none">','<div id="ldmSTLSliceControls" style="display:none">'+option())};
 const controls=document.getElementById('ldmSTLSliceControls');if(controls&&!document.getElementById('ldmSliceDimensions'))controls.insertAdjacentHTML('afterbegin',option());
})();
