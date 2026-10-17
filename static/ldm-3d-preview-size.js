/* GUI.43: explicit physical preview scale and preview-only dimensions. */
(()=>{'use strict';let dimensions=false;
 const state=()=>window.ldmSTLState;
 window.ldm3DPreviewLayout=function(v,count,tw,th,legacy){
   const sc=Number.isFinite(v.previewScale)&&v.previewScale>0?v.previewScale:(count===1?1:legacy.sc);
   return count===1?{x:(tw-v.w*sc)/2,y:(th-v.h*sc)/2,sc}:{x:legacy.x+(legacy.sc-sc)*v.w/2,y:legacy.y+(legacy.sc-sc)*v.h/2,sc};
 };
 window.ldmSet3DPreviewScale=function(value){
   const n=Number(value),S=state(),v=S?.techViews[S.techSelected];if(!v||!Number.isFinite(n)||n<.1||n>1000)return false;
   v.previewScale=n/100;window.ldmSTLRenderTechViews();return true;
 };
 window.ldm3DPreviewDimensionsEnabled=()=>dimensions;
 window.ldmSet3DPreviewDimensions=on=>{dimensions=!!on;window.ldmSTLRenderTechViews?.()};
 const NS='http://www.w3.org/2000/svg';
 function element(tag,attrs,text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;return n}
 window.ldm3DPreviewDimensions=function(parent,v){
   if(!dimensions)return;const b=v.dimensionBounds||{minX:0,minY:0,maxX:v.w,maxY:v.h,width:v.w,height:v.h},L=v.layout;
   if(!b||!L||!Number.isFinite(b.width)||!Number.isFinite(b.height))return;
   const x0=L.x+b.minX*L.sc,x1=L.x+b.maxX*L.sc,y0=L.y+b.minY*L.sc,y1=L.y+b.maxY*L.sc,dy=y1+7,dx=x0-7;
   const g=element('g',{'data-ldm-dimension-guide':'true','pointer-events':'none',fill:'none',stroke:'currentColor','stroke-width':'.3'});
   function line(a,b,c,d){g.appendChild(element('line',{x1:a,y1:b,x2:c,y2:d}))}
   function arrow(x,y,a){line(x,y,x+2*Math.cos(a-.45),y+2*Math.sin(a-.45));line(x,y,x+2*Math.cos(a+.45),y+2*Math.sin(a+.45))}
   line(x0,y1+1,x0,dy+1);line(x1,y1+1,x1,dy+1);line(x0,dy,x1,dy);arrow(x0,dy,0);arrow(x1,dy,Math.PI);
   line(dx-1,y0,x0-1,y0);line(dx-1,y1,x0-1,y1);line(dx,y0,dx,y1);arrow(dx,y0,Math.PI/2);arrow(dx,y1,-Math.PI/2);
   const textAttrs={stroke:'none',fill:'currentColor','font-size':'3.5','font-family':'Arial,sans-serif','text-anchor':'middle'};
   g.appendChild(element('text',{...textAttrs,x:(x0+x1)/2,y:dy+4},'X '+(b.width*L.sc).toFixed(2)+' mm'));
   g.appendChild(element('text',{...textAttrs,transform:`translate(${dx-3} ${(y0+y1)/2}) rotate(-90)`},'Y '+(b.height*L.sc).toFixed(2)+' mm'));parent.appendChild(g);
 };
 window.ldmSync3DPreviewSizeControls=function(){
   const S=state(),v=S?.techViews[S.techSelected],input=document.getElementById('ldm3DPreviewScale'),reset=document.getElementById('ldm3DPreviewResetScale');
   if(input){input.disabled=!v;input.value=v?((v.previewScale??v.layout?.sc??1)*100).toFixed(2):'100';}if(reset)reset.disabled=!v;
 };
 const controls=()=>`<div class="ldm3DPreviewSize"><label>SELECTED 3D SCALE (%)<input id="ldm3DPreviewScale" type="number" min="0.1" max="1000" step="0.1" value="100" onchange="if(!ldmSet3DPreviewScale(this.value))ldmSync3DPreviewSizeControls()"></label><button id="ldm3DPreviewResetScale" type="button" onclick="ldmSet3DPreviewScale(100)">100%</button><label class="ldm3DPreviewDimensionCheck"><input type="checkbox" ${dimensions?'checked ':''}onchange="ldmSet3DPreviewDimensions(this.checked)"> SHOW X/Y DIMENSIONS</label></div>`;
 const panel=window.ldmSTLPanelHTML;if(typeof panel==='function')window.ldmSTLPanelHTML=function(){return panel.apply(this,arguments).replace('<div id="ldmSTLTechList"',controls()+'<div id="ldmSTLTechList"')};
 const list=document.getElementById('ldmSTLTechList');if(list&&!document.getElementById('ldm3DPreviewScale'))list.insertAdjacentHTML('beforebegin',controls());
 window.ldmSTLRenderTechViews?.();window.ldmSync3DPreviewSizeControls();
})();
