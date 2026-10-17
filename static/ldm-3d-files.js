/* GUI.44: 3D layers use one physical canvas and standard file rows. */
(()=>{'use strict';const S=()=>window.ldmSTLState;
 window.ldm3DPreviewLayout=(v,count,tw,th)=>{const sc=v.previewScale>0?v.previewScale:1;return {x:(tw-v.w*sc)/2,y:(th-v.h*sc)/2,sc}};
 const NS='http://www.w3.org/2000/svg';
 function paths(v){
   if(!window.ldm3DPreviewDimensionsEnabled?.()||v.visible===false)return [];
   const b=v.dimensionBounds||{minX:0,minY:0,maxX:v.w,maxY:v.h,width:v.w,height:v.h},L=v.layout;if(!b||!L)return [];
   const x0=L.x+b.minX*L.sc,x1=L.x+b.maxX*L.sc,y0=L.y+b.minY*L.sc,y1=L.y+b.maxY*L.sc,dy=y1+7,dx=x0-7,out=[];
   const line=(a,b,c,d)=>out.push([[a,b],[c,d]]),arrow=(x,y,a)=>{line(x,y,x+2*Math.cos(a-.45),y+2*Math.sin(a-.45));line(x,y,x+2*Math.cos(a+.45),y+2*Math.sin(a+.45))};
   line(x0,y1+1,x0,dy+1);line(x1,y1+1,x1,dy+1);line(x0,dy,x1,dy);arrow(x0,dy,0);arrow(x1,dy,Math.PI);
   line(dx-1,y0,x0-1,y0);line(dx-1,y1,x0-1,y1);line(dx,y0,dx,y1);arrow(dx,y0,Math.PI/2);arrow(dx,y1,-Math.PI/2);
   const segments=[[[0,0],[1,0]],[[1,0],[1,1]],[[1,1],[1,2]],[[0,2],[1,2]],[[0,1],[0,2]],[[0,0],[0,1]],[[0,1],[1,1]]],digits=['012345','12','01346','01236','1256','02356','023456','012','0123456','012356'];
   function text(value,x,y,vertical){const unit=1.6,advance=2.3,width=value.length*advance;
     [...value].forEach((ch,i)=>{let strokes=[];if(/\d/.test(ch))strokes=[...digits[+ch]].map(n=>segments[+n]);else if(ch==='X')strokes=[[[0,0],[1,2]],[[1,0],[0,2]]];else if(ch==='Y')strokes=[[[0,0],[.5,1],[1,0]],[[.5,1],[.5,2]]];else if(ch==='Z')strokes=[[[0,0],[1,0],[0,2],[1,2]]];else if(ch==='m')strokes=[[[0,2],[0,1],[.5,1],[.5,2]],[[.5,1],[1,1],[1,2]]];else if(ch==='.')strokes=[[[.45,1.9],[.55,2]]];
       strokes.forEach(st=>out.push(st.map(([a,b])=>{const px=i*advance+a*unit-width/2,py=b*unit;return vertical?[x+py,y-px]:[x+px,y+py]})));
     });
   }
   text((['left','right'].includes(v.sliceMetadata?.direction)?'Y ':'X ')+(b.width*L.sc).toFixed(2)+' mm',(x0+x1)/2,dy+2,false);
   text((v.sliceMetadata?.direction&&v.sliceMetadata.direction!=='top'?'Z ':'Y ')+(b.height*L.sc).toFixed(2)+' mm',dx-6,(y0+y1)/2,true);return out;
 }
 window.ldm3DPreviewDimensionPaths=paths;
 window.ldm3DPreviewDimensionGeometry=v=>{const p=paths(v);return p.length?'<g fill="none" stroke="black" stroke-width="0.24">'+p.map(st=>'<polyline points="'+st.map(q=>q.map(n=>n.toFixed(4)).join(',')).join(' ')+'"/>').join('')+'</g>':''};
 window.ldm3DPreviewDimensions=(parent,v)=>{const p=paths(v);if(!p.length)return;const g=document.createElementNS(NS,'g');g.setAttribute('data-ldm-dimension-guide','true');g.setAttribute('fill','none');g.setAttribute('stroke','currentColor');g.setAttribute('stroke-width','.24');g.setAttribute('pointer-events','none');p.forEach(st=>{const n=document.createElementNS(NS,'polyline');n.setAttribute('points',st.map(q=>q.join(',')).join(' '));g.appendChild(n)});parent.appendChild(g)};
 function selected(){const s=S();return s?.techViews[s.techSelected]}
 const refresh=()=>window.ldmSTLRenderTechViews?.();
 window.ldmToggle3DVisibility=i=>{const v=S()?.techViews[i];if(!v)return;v.visible=v.visible===false;const group=document.querySelector('#ldmSTLTechnicalPreviewLayer [data-tech-index="'+i+'"]');if(group){for(let node=group;node;node=node.nextElementSibling){if(node!==group&&node.hasAttribute('data-tech-index'))break;node.style.display=v.visible===false?'none':''}window.ldm3DRememberPreviewState?.();window.ldmRender3DFileList?.();const apply=document.getElementById('ldmSTLApplyTech');if(apply)apply.disabled=!S().techViews.some(v=>v.visible!==false)}else refresh();document.getElementById('ldm3DEye'+i)?.focus()};
 window.ldmDuplicate3DLayer=()=>{const s=S(),v=selected();if(!v)return;const copy=JSON.parse(JSON.stringify(v));copy.name+=' copy';s.techViews.splice(s.techSelected+1,0,copy);s.techSelected++;refresh()};
 window.ldmMove3DLayer=d=>{const s=S();if(!s)return;const i=s.techSelected,j=i+d;if(i<0||j<0||j>=s.techViews.length)return;[s.techViews[i],s.techViews[j]]=[s.techViews[j],s.techViews[i]];s.techSelected=j;refresh()};
 const eye='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
 function button(text,cls,fn){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.onclick=fn;return b}
 let fileListCache=null;
 window.ldmRender3DFileList=()=>{const s=S(),box=document.getElementById('ldmSTLTechList');if(!box||!s)return;const key=[box,s.techSelected,...s.techViews.flatMap(v=>[v,v.name,v.visible])];if(fileListCache&&key.length===fileListCache.key.length&&key.every((value,i)=>Object.is(value,fileListCache.key[i]))&&box.firstChild===fileListCache.first)return;
   if(!document.getElementById('ldm3DFileCount'))box.insertAdjacentHTML('beforebegin','<div class="textObjectHead ldm3DFileHead"><b>FILES ON PREVIEW</b><span id="ldm3DFileCount" class="tiny"></span></div>');
   for(const [id,off]of [['ldm3DDuplicate',s.techSelected<0],['ldm3DMoveUp',s.techSelected<=0],['ldm3DMoveDown',s.techSelected<0||s.techSelected>=s.techViews.length-1]]){const b=document.getElementById(id);if(b)b.disabled=off;}
   const count=document.getElementById('ldm3DFileCount');if(count)count.textContent=s.techViews.length+' item'+(s.techViews.length===1?'':'s');box.innerHTML='';
   if(!s.techViews.length){const empty=document.createElement('div');empty.className='tiny textObjectEmpty';empty.textContent='No files inserted yet.';box.appendChild(empty)}
   s.techViews.forEach((v,i)=>{const row=document.createElement('div');row.className='textObjectRow'+(i===s.techSelected?' selected':'');const pick=button((i+1)+'. '+v.name,'textObjectPick',()=>{window.ldmSTLSelectPreviewLayer(i);document.getElementById('ldm3DPick'+i)?.focus()});pick.id='ldm3DPick'+i;pick.title=v.name;
     const on=v.visible!==false,toggle=button('','ldm3DFileVisibility',()=>window.ldmToggle3DVisibility(i));toggle.id='ldm3DEye'+i;toggle.innerHTML=eye+(on?'':'<path d="m3 3 18 18"/>')+'</svg>';toggle.setAttribute('aria-pressed',String(on));toggle.setAttribute('aria-label',(on?'Hide ':'Show ')+v.name+' on 3D PREVIEW');toggle.title=on?'ON — hide':'OFF — show';
     const del=button('DELETE','stop textObjectDelete',()=>{s.techSelected=i;window.ldmSTLDeletePreviewLayer();document.getElementById('ldm3DPick'+s.techSelected)?.focus()});row.append(pick,toggle,del);box.appendChild(row);
   });
   fileListCache={key,first:box.firstChild};
 };
 const actions='<div class="ldmSTLButtons two ldm3DFileActions"><button id="ldm3DDuplicate" type="button" onclick="ldmDuplicate3DLayer()">DUPLICATE</button><button type="button" id="ldmSTLDeleteTech" onclick="ldmSTLDeletePreviewLayer()">DELETE SELECTED</button><button type="button" id="ldm3DMoveUp" onclick="ldmMove3DLayer(-1)">MOVE UP</button><button type="button" id="ldm3DMoveDown" onclick="ldmMove3DLayer(1)">MOVE DOWN</button></div>';
 const oldActions=/<div class="ldmSTLButtons two"><button type="button" id="ldmSTLDeleteTech"[\s\S]*?<\/div>/;
 const clear='<div class="ldmSTLButtons"><button type="button" id="ldmSTLClearTech" onclick="ldmSTLClearPreview()">CLEAR 3D PREVIEW</button></div>';
 const panel=window.ldmSTLPanelHTML;if(typeof panel==='function')window.ldmSTLPanelHTML=function(){return panel.apply(this,arguments).replace('<div id="ldmSTLTechList" class="ldmSTLTechList">','<div class="textObjectManager ldm3DFileManager"><div class="textObjectHead"><b>FILES ON PREVIEW</b><span id="ldm3DFileCount" class="tiny"></span></div><div id="ldmSTLTechList" class="ldmSTLTechList textObjectList">').replace(oldActions,actions+'</div>'+clear)};
 const oldDelete=document.getElementById('ldmSTLDeleteTech');if(oldDelete?.parentElement)oldDelete.parentElement.outerHTML=actions+clear;
 const currentList=document.getElementById('ldmSTLTechList');if(currentList?.parentElement&&!currentList.closest('.ldm3DFileManager')){const manager=document.createElement('div');manager.className='textObjectManager ldm3DFileManager';currentList.parentElement.insertBefore(manager,currentList);manager.appendChild(currentList);currentList.classList.add('textObjectList');const buttons=document.querySelector('.ldm3DFileActions');if(buttons)manager.appendChild(buttons);}
 refresh();
})();
