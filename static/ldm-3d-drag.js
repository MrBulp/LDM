/* GUI.45: translation-only 3D layer dragging; scale labels are preview metadata. */
(()=>{'use strict';const NS='http://www.w3.org/2000/svg';let drag=null,frame=null;
 const layout=window.ldm3DPreviewLayout;
 window.ldm3DPreviewLayout=function(v){const L=layout.apply(this,arguments);L.x+=Number(v.previewX)||0;L.y+=Number(v.previewY)||0;return L};
 window.ldm3DLayerDragDecorations=function(parent,group,v,i){
   const hit=document.createElementNS(NS,'rect');hit.setAttribute('x','0');hit.setAttribute('y','0');hit.setAttribute('width',v.w);hit.setAttribute('height',v.h);hit.setAttribute('fill','transparent');hit.setAttribute('stroke','currentColor');hit.setAttribute('stroke-opacity',i===window.ldmSTLState?.techSelected?'0':'.3');hit.setAttribute('stroke-width','.3');hit.setAttribute('vector-effect','non-scaling-stroke');hit.style.pointerEvents='all';group.insertBefore(hit,group.firstChild);group.style.cursor='move';
   const L=v.layout,label=document.createElementNS(NS,'text');label.setAttribute('data-ldm-scale-info','true');label.setAttribute('x',L.x+v.w*L.sc/2);label.setAttribute('y',L.y+v.h*L.sc+(window.ldm3DPreviewDimensionsEnabled?.()?18:7));label.setAttribute('fill','currentColor');label.setAttribute('font-family','Arial,sans-serif');label.setAttribute('font-size','3.5');label.setAttribute('text-anchor','middle');label.setAttribute('pointer-events','none');label.textContent='SCALE '+Number((L.sc*100).toFixed(2))+'%';parent.appendChild(label);
 };
 function point(e,art){try{const inverse=drag?.art===art?drag.inverse:art.getScreenCTM()?.inverse();if(!inverse)return null;const p=art.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(inverse);return Number.isFinite(q.x)&&Number.isFinite(q.y)?q:null}catch(_){return null}}
 function paint(){frame=null;if(!drag)return;const dx=drag.view.previewX-drag.x,dy=drag.view.previewY-drag.y;if(dx===drag.lastDX&&dy===drag.lastDY)return;drag.lastDX=dx;drag.lastDY=dy;drag.group.setAttribute('transform',`translate(${drag.layout.x+dx} ${drag.layout.y+dy}) scale(${drag.layout.sc})`);drag.decorations.forEach(({node,base})=>node.setAttribute('transform',`translate(${dx} ${dy}) ${base}`))}
 function move(e){if(!drag||e.pointerId!==drag.id)return;const p=point(e,drag.art);if(!p)return;
   drag.view.previewX=drag.x+p.x-drag.start.x;drag.view.previewY=drag.y+p.y-drag.start.y;
   e.preventDefault();e.stopPropagation();if(frame===null)frame=requestAnimationFrame(paint);
 }
 function end(e){if(!drag||e.pointerId!==drag.id)return;if(e.type!=='pointercancel')move(e);if(frame!==null){cancelAnimationFrame(frame);frame=null}paint();const art=drag.art,id=drag.id;drag.view.layout={x:drag.layout.x+drag.view.previewX-drag.x,y:drag.layout.y+drag.view.previewY-drag.y,sc:drag.layout.sc};drag=null;window.ldm3DRememberPreviewState?.();try{art.releasePointerCapture(id)}catch(_){}e.preventDefault();e.stopPropagation()}
 document.addEventListener('pointerdown',e=>{
   const group=e.target.closest?.('#ldmSTLTechnicalPreviewLayer [data-tech-index]'),art=document.getElementById('art'),S=window.ldmSTLState;if(!group||!art||!S||e.button>0||drag)return;
   const access=window.LDM_ACCESS;if(access&&!access.admin&&(access.local||!access.sections?.includes('stl')))return;
   const i=Number(group.dataset.techIndex),v=S.techViews[i],p=point(e,art);if(!v||v.visible===false||!p)return;
   const decorations=[];for(let n=group.nextElementSibling;n&&!n.hasAttribute('data-tech-index');n=n.nextElementSibling)decorations.push({node:n,base:n.getAttribute('transform')||''});window.ldmSTLSelectPreviewLayer(i);drag={id:e.pointerId,art,inverse:art.getScreenCTM()?.inverse(),group,decorations,layout:{...v.layout},view:v,start:p,x:Number(v.previewX)||0,y:Number(v.previewY)||0};try{art.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();e.stopPropagation();
 },true);
 document.addEventListener('pointermove',move,{capture:true,passive:false});document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);

 // GUI.90: selection changes borders and controls without reparsing artwork.
 window.ldmSTLSelectPreviewLayer=function(i){
   const S=window.ldmSTLState,art=document.getElementById('art');if(!S||!S.techViews[i])return;S.techSelected=i;
   art?.querySelectorAll('#ldmSTLTechnicalPreviewLayer [data-tech-index]').forEach(group=>{
     const selected=Number(group.dataset.techIndex)===i,v=S.techViews[Number(group.dataset.techIndex)];
     let border=group.querySelector('[data-ldm-tech-selection]');
     if(!selected){border?.remove();return}if(border||!v)return;
     border=document.createElementNS(NS,'rect');for(const [k,value] of Object.entries({'data-ldm-tech-selection':'true',x:-2,y:-2,width:v.w+4,height:v.h+4,fill:'none',stroke:'#00a9c7','stroke-width':1,'vector-effect':'non-scaling-stroke','pointer-events':'none'}))border.setAttribute(k,value);group.insertBefore(border,group.firstChild);
   });
   document.querySelectorAll('#ldmSTLTechList .ldmTechLayerBtn').forEach((b,n)=>{if(b.classList.contains('selected')!==(n===i))b.classList.toggle('selected',n===i)});
   window.ldmSync3DPreviewSizeControls?.();window.ldmRender3DFileList?.();window.ldm3DRememberPreviewState?.();
 };
 // Preview-only batching: exact line endpoints and stroke settings; stored export geometry stays original.
 const compactCache=new WeakMap();
 const compactLines=function(geometry){
   const lines=geometry.replace(/(?:<line x1="[^"]+" y1="[^"]+" x2="[^"]+" y2="[^"]+" fill="none" stroke="[^"]+" stroke-width="[^"]+" vector-effect="non-scaling-stroke"\/>)+/g,run=>{
     let result='',commands=[],attrs='';const flush=()=>{if(commands.length){result+='<path d="'+commands.join(' ')+'" '+attrs+'/>';commands=[]}};
     const re=/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)" (fill="none" stroke="[^"]+" stroke-width="[^"]+" vector-effect="non-scaling-stroke")\/>/g;let m;
     while((m=re.exec(run))){if(attrs!==m[5])flush();attrs=m[5];commands.push('M'+m[1]+' '+m[2]+' L'+m[3]+' '+m[4]);if(commands.length===512)flush()}flush();return result;
   });
   return lines.replace(/(?:<polyline points="[^"]+" fill="none" stroke="[^"]+" stroke-width="[^"]+" vector-effect="non-scaling-stroke"\/>)+/g,run=>{
    let result='',commands=[],attrs='';const flush=()=>{if(commands.length){result+='<path d="'+commands.join(' ')+'" '+attrs+'/>';commands=[]}};
    const re=/<polyline points="([^"]+)" (fill="none" stroke="[^"]+" stroke-width="[^"]+" vector-effect="non-scaling-stroke")\/>/g;let m;
    while((m=re.exec(run))){const numbers=m[1].trim().split(/[\s,]+/);if(numbers.length<4||numbers.length%2||numbers.some(n=>!Number.isFinite(Number(n)))){flush();result+=m[0];continue}if(attrs!==m[2])flush();attrs=m[2];let d='';for(let i=0;i<numbers.length;i+=2)d+=(i?' L':'M')+numbers[i]+' '+numbers[i+1];commands.push(d);if(commands.length===512)flush()}flush();return result;
   });

 };
 window.ldm3DCompactPreviewGeometry=function(geometry){return compactLines(geometry)};
 window.ldm3DCompactViewGeometry=function(view){const old=compactCache.get(view);if(old?.source===view.geometry)return old.result;const result=compactLines(view.geometry);compactCache.set(view,{source:view.geometry,result});return result};
 window.ldmSTLRenderTechViews?.();
})();
