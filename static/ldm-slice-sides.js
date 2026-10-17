/* GUI.46: cardinal slice frames and optional layer metadata. */
(()=>{'use strict';let heightInfo=false,numberInfo=false,scaleInfo=true,cached=null;
 window.ldm3DScaleInfoVisible=v=>scaleInfo&&(v.kind==='slice'||['top','bottom','front','back','left','right'].includes(v.sourceView||({TOP:'top',BOTTOM:'bottom',FRONT:'front',BACK:'back',LEFT:'left',RIGHT:'right'}[String(v.name||'').split(' ')[2]])));
 window.ldmClearSliceFrameCache=()=>{cached=null};
 window.ldmSliceFrame=function(S){const [x,y,z]=S.size,d=S.sliceDirection||'top';if(cached&&cached.source===S.tris&&cached.modelSize===S.size&&cached.direction===d)return cached.frame;let size,map;
   if(d==='front'){size=[x,z,y];map=p=>[p[0],p[2],p[1]]}
   else if(d==='back'){size=[x,z,y];map=p=>[x-p[0],p[2],y-p[1]]}
   else if(d==='left'){size=[y,z,x];map=p=>[y-p[1],p[2],p[0]]}
   else if(d==='right'){size=[y,z,x];map=p=>[p[1],p[2],x-p[0]]}
   else return {size:S.size,tris:S.tris,direction:'top'};
   const frame={size,tris:S.tris.map(t=>t.map(map)),direction:d};cached={source:S.tris,modelSize:S.size,direction:d,frame};return frame;
 };
 window.ldmSetSliceSide=function(value){const S=window.ldmSTLState;if(!S||!['top','front','back','left','right'].includes(value))return;S.sliceDirection=value;S.layer=0;window.ldmSTLSlice?.()};
 window.ldmSet3DLayerInfo=function(kind,on){window.ldm3DInfoRevision=(window.ldm3DInfoRevision||0)+1;if(kind==='height')heightInfo=!!on;else if(kind==='number')numberInfo=!!on;else if(kind==='scale')scaleInfo=!!on;window.ldmSTLRenderTechViews?.()};
 const decorate=window.ldm3DLayerDragDecorations;
 window.ldm3DLayerDragDecorations=function(parent,group,v,i){decorate.apply(this,arguments);const label=parent.lastChild,m=v.sliceMetadata;if(!label)return;if(!m){if(!window.ldm3DScaleInfoVisible(v))label.remove();return}const scale=label.textContent,rows=[];if(heightInfo)rows.push('SLICE HEIGHT '+m.height.toFixed(2)+' mm');if(numberInfo)rows.push('SLICE NO. '+String(m.number).padStart(4,'0'));if(window.ldm3DScaleInfoVisible(v))rows.push(scale);if(!rows.length){label.remove();return}label.textContent='';label.setAttribute('text-anchor','start');label.setAttribute('x',v.layout.x);rows.forEach((value,n)=>{const line=document.createElementNS('http://www.w3.org/2000/svg','tspan');line.setAttribute('x',v.layout.x);line.setAttribute('dy',n?'1.4em':'0');line.textContent=value;label.appendChild(line)})};
 // Canvas importer accepts numeric strokes, so annotation text must be outlined.
 window.ldm3DPreviewInfoGeometry=function(v){if(v.visible===false||!v.layout)return '';const m=v.sliceMetadata,L=v.layout,rows=[];
 if(m&&heightInfo)rows.push('SLICE HEIGHT '+m.height.toFixed(2)+' mm');if(m&&numberInfo)rows.push('SLICE NO. '+String(m.number).padStart(4,'0'));if(window.ldm3DScaleInfoVisible(v))rows.push('SCALE '+Number((L.sc*100).toFixed(2))+'%');if(!rows.length)return '';
 const glyph={S:'20 00 01 21 22 02',L:'00 02 22',I:'00 20|10 12|02 22',C:'20 00 02 22',E:'20 00 02 22|01 21',H:'00 02|20 22|01 21',G:'20 00 02 22 21 11',T:'00 20|10 12',N:'02 00 22 20',O:'00 20 22 02 00',A:'02 10 22|01 21',m:'02 01 11 12|11 21 22','%':'02 20|00 10 11 01 00|11 21 22 12 11','.':'12 12',0:'00 20 22 02 00',1:'10 12',2:'00 20 21 01 02 22',3:'00 20 22 02|01 21',4:'00 01 21|20 22',5:'20 00 01 21 22 02',6:'20 00 02 22 21 01',7:'00 20 12',8:'00 20 22 02 00|01 21',9:'22 20 00 01 21'};
 const y=L.y+v.h*L.sc+(window.ldm3DPreviewDimensionsEnabled?.()?18:7),out=[];
 rows.forEach((row,r)=>[...row].forEach((ch,i)=>{(glyph[ch]||'').split('|').filter(Boolean).forEach(st=>{const points=st.split(' ').map(q=>[(L.x+i*2.3+(+q[0])*.8).toFixed(4),(y-2.8+r*4.9+(+q[1])*1.4).toFixed(4)].join(',')).join(' ');out.push('<polyline points="'+points+'"/>')})}));
 return '<g data-ldm-slice-info="true" fill="none" stroke="black" stroke-width="0.24">'+out.join('')+'</g>';
 };

 const controls=()=>'<label class="ldmSliceMetadataOption"><input type="checkbox" '+(scaleInfo?'checked ':'')+'onchange="ldmSet3DLayerInfo(\'scale\',this.checked)"> SHOW SCALE INFO (ORTHOGRAPHIC / SLICE)</label>'+'<label class="ldmSliceMetadataOption"><input type="checkbox" '+(heightInfo?'checked ':'')+'onchange="ldmSet3DLayerInfo(\'height\',this.checked)"> SHOW SLICE HEIGHT</label><label class="ldmSliceMetadataOption"><input type="checkbox" '+(numberInfo?'checked ':'')+'onchange="ldmSet3DLayerInfo(\'number\',this.checked)"> SHOW SELECTED SLICE NUMBER</label>';
 const side=()=>'<label class="ldmSliceSideControl">SLICE FROM<select id="ldmSliceSide" onchange="ldmSetSliceSide(this.value)">'+[['top','TOP PLAN'],['front','FRONT'],['back','BACK'],['left','LEFT'],['right','RIGHT']].map(([v,n])=>'<option value="'+v+'" '+((window.ldmSTLState?.sliceDirection||'top')===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label>';
 const panel=window.ldmSTLPanelHTML;if(typeof panel==='function')window.ldmSTLPanelHTML=function(){return panel.apply(this,arguments).replace('<div class="ldm3DPreviewSize">','<div class="ldm3DPreviewSize">'+controls()).replace('<div id="ldmSTLSliceControls" style="display:none">','<div id="ldmSTLSliceControls" style="display:none">'+side())};
 const size=document.querySelector('.ldm3DPreviewSize');if(size)size.insertAdjacentHTML('afterbegin',controls());const slice=document.getElementById('ldmSTLSliceControls');if(slice&&!document.getElementById('ldmSliceSide'))slice.insertAdjacentHTML('afterbegin',side());
 const sync=window.syncSliceControls;if(typeof sync==='function')window.syncSliceControls=function(){const result=sync.apply(this,arguments),direction=window.ldmSTLState?.sliceDirection||'top',readout=document.getElementById('ldmSTLSliceReadout');if(readout&&direction!=='top'){const text=readout.textContent.replace(' · Z ',' · '+direction.toUpperCase()+' DEPTH ');if(readout.textContent!==text)readout.textContent=text;}return result};
 window.ldmSTLRenderTechViews?.();
})();
