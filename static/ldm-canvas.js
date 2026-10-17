/* Canvas is a numeric snapshot; never send machine settings or source markup. */
(()=>{'use strict';
 const state=window.LDM_ACCESS;
 // Legacy MultiSVG composition still calls this historical cursor helper.
 // Optional chaining cannot protect an undeclared global identifier.
 if(typeof window.updateToolPositionOverlay!=='function')window.updateToolPositionOverlay=function(){
   if(typeof window.drawToolPosition==='function')return window.drawToolPosition.apply(this,arguments);
 };
 const el=id=>document.getElementById(id);
 const mode=()=>document.querySelector('.v3ArtworkModeTabs [data-artmode].active')?.dataset.artmode||'vector';
 // Approved snapshots may have sub-0.01 mm placement. The inherited control
 // renderer rounds ordinary VECTOR offsets to two decimals; retain full offsets
 // only for imported snapshots, including later object reselection.
 const loadControls=window.ldmLoadControls;
 if(typeof loadControls==='function')window.ldmLoadControls=function(){
   const result=loadControls.apply(this,arguments),o=window.ldmSvgObjects?.[window.ldmSelectedSvg];
   if(o?.ldmCanvasSnapshotId){el('svgX').value=o.x;el('svgY').value=o.y;}
   return result;
 };
 async function call(path,body){
   const r=await fetch(path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
   const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d;
 }
 function message(value){if(el('ldmCanvasMessage'))el('ldmCanvasMessage').textContent=value}
 let submitting=false,refreshing=false;
 function capture(){
   if(mode()==='draw'&&window.ldmCaptureDrawSubmissionCanvas)return window.ldmCaptureDrawSubmissionCanvas();
   if(!['vector','inbox'].includes(mode()))throw new Error('Send your artwork to CANVAS, switch to VECTOR / CANVAS, then submit. Unsent staging artwork is not submitted.');
   const paths=sourcePaths().map(st=>st.map(p=>[Number(p[0]),Number(p[1])])).filter(st=>st.length>1);
   if(!paths.length)throw new Error('CANVAS is empty. Place artwork onto CANVAS first.');
   const canvas={width:Number(el('paperW').value),height:Number(el('paperH').value),paths};
   if(window.ldmSvgObjects?.length){
     window.ldmSnapshot?.();canvas.layers=window.ldmSvgObjects.map((o,i)=>({name:String(o.name||'VECTOR '+(i+1)).slice(0,120),colour:window.ldmVectorLayerColour?.(o,i)||o.lineColour||'#df625c',visible:o.visible!==false,paths:window.ldmTransformPaths({...o,visible:true}).map(st=>st.map(p=>[Number(p[0]),Number(p[1])])).filter(st=>st.length>1)})).filter(o=>o.paths.length);
     canvas.paths=canvas.layers.filter(o=>o.visible).flatMap(o=>o.paths);
     canvas.vector_options={multicolour:!!window.ldmVectorColourEnabled,hold_seconds:Number(el('ldmVectorHoldSeconds')?.value||60)};
   }
   return canvas;
 }
 async function submit(){
   if(submitting)return;submitting=true;el('ldmCanvasSubmit').disabled=true;
   try{
     const snapshot=capture();
     const d=await call('/api/canvas',{title:el('ldmCanvasTitle').value.trim(),canvas:snapshot});
     message(`${d.duplicate?'Already submitted':'Snapshot submitted'} — ${d.item.status}. LDM Admin controls machine sending.`);await refresh();
   }catch(e){message(e.message)}finally{submitting=false;if(el('ldmCanvasSubmit'))el('ldmCanvasSubmit').disabled=state.mode==='off'||state.inbox_enabled===false}
 }
 let selectedSubmission='',previewRequest=0;
 function usernameTitle(){const input=el('ldmCanvasTitle');if(!input)return;let prefix=el('ldmCanvasUsername');if(!prefix){prefix=document.createElement('span');prefix.id='ldmCanvasUsername';prefix.className='ldmCanvasUsername';prefix.setAttribute('data-ldm-no-translate','');const field=document.createElement('div');field.className='ldmCanvasTitleField';input.before(field);field.append(prefix,input);}const text=state.username?state.username+' · ':'';if(prefix.textContent!==text)prefix.textContent=text;if(prefix.hidden!==!text)prefix.hidden=!text;const limit=120-text.length;if(input.maxLength!==limit)input.maxLength=limit;}
 async function previewSubmission(item){const request=++previewRequest;selectedSubmission=item.id;const host=el('ldmMySubmissionPreview');if(!host)return;host.hidden=false;host.replaceChildren();const heading=document.createElement('b');heading.setAttribute('data-ldm-no-translate','');heading.textContent=item.title+' · '+item.status;const info=document.createElement('p');info.textContent='Loading submitted artwork…';host.append(heading,info);
  try{const d=await call('/api/canvas/'+encodeURIComponent(item.id));if(request!==previewRequest)return;heading.textContent=d.item.title+' · '+d.item.status;const c=d.item.canvas,svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 '+c.width+' '+c.height);svg.setAttribute('role','img');svg.setAttribute('aria-label','Submitted canvas: '+item.title);svg.classList.add('ldmOwnCanvasPreview');const layers=c.layers?.length?c.layers:[{visible:true,colour:'#444444',paths:c.paths}];for(const layer of layers){if(layer.visible===false)continue;const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',layer.paths.map(p=>p.map((q,i)=>(i?'L':'M')+q[0]+' '+q[1]).join(' ')).join(' '));path.setAttribute('stroke',layer.colour||'#444444');path.setAttribute('fill','none');path.setAttribute('stroke-width','.65');path.setAttribute('vector-effect','non-scaling-stroke');svg.append(path);}info.textContent=c.width+' × '+c.height+' mm · Saved submission snapshot';host.append(svg);}catch(e){if(request===previewRequest)info.textContent=e.message;}
 }
 document.addEventListener('ldm-online-identity',()=>{usernameTitle();previewRequest++;selectedSubmission='';const preview=el('ldmMySubmissionPreview');if(preview){preview.replaceChildren();preview.hidden=true;}el('ldmCanvasMine')?.replaceChildren();});
 async function refresh(){
   if(refreshing||!el('ldmCanvasMine'))return;refreshing=true;
   try{
     const d=await call('/api/canvas');const host=el('ldmCanvasMine');host.replaceChildren();
     for(const item of d.items){
       const row=document.createElement('div');row.className='ldmSubmissionRow';
       const text=document.createElement('span');text.setAttribute('data-ldm-no-translate','');text.textContent=`${item.title} · ${item.status} · ${new Date(item.created_at*1000).toLocaleString()}`;row.appendChild(text);const view=document.createElement('button');view.type='button';view.textContent='PREVIEW';view.title='Preview submitted canvas';view.setAttribute('aria-label','Preview '+item.title);view.setAttribute('aria-pressed',String(item.id===selectedSubmission));view.onclick=()=>previewSubmission(item);row.append(view);
       if(item.status==='PENDING'){
         const b=document.createElement('button');b.type='button';b.textContent='CANCEL SUBMISSION';
         b.onclick=async()=>{try{await call(`/api/canvas/${item.id}/cancel`,{});await refresh()}catch(e){message(e.message)}};row.appendChild(b);
       }
       host.appendChild(row);
     }
   }catch(e){message(e.message)}finally{refreshing=false}
 }
 function mount(){
   const drawLayers=mode()==='draw'?el('ldmDrawLayers'):null;
   const host=drawLayers?.parentElement||el('v3ArtworkInboxHost');if(!host)return;
   const existing=el('ldmRemoteCanvasPanel');if(existing){if(drawLayers){if(existing.parentNode!==host||existing.nextElementSibling!==drawLayers)host.insertBefore(existing,drawLayers);}else if(existing.parentNode!==host)host.appendChild(existing);usernameTitle();return;}
   const panel=document.createElement('section');panel.id='ldmRemoteCanvasPanel';
   panel.innerHTML='<b>REMOTE ARTWORK — SUBMIT TO LDM ADMIN</b><div class="ldmCanvasFields"><label>Canvas title<input id="ldmCanvasTitle" maxlength="120" value="Remote canvas"></label><button type="button" id="ldmCanvasSubmit">SUBMIT</button></div><p id="ldmCanvasMessage" role="status"></p><details class="ldmMySubmissions"><summary>MY SUBMISSIONS</summary><section id="ldmMySubmissionPreview" hidden aria-live="polite"></section><div id="ldmCanvasMine"></div></details>';
   panel.setAttribute('aria-label','Remote artwork submissions');
   if(drawLayers)host.insertBefore(panel,drawLayers);else host.appendChild(panel);
   usernameTitle();el('ldmCanvasSubmit').onclick=submit;
   updatePermissions();refresh();
 }
 function updatePermissions(){
   const allowed=state.online_view_ready===true?state.sections:[];document.documentElement.classList.toggle('ldm-online-no-tabs',!allowed.length);

   document.querySelectorAll('[data-artmode]').forEach(b=>b.toggleAttribute('data-ldm-section-disabled',(b.dataset.artmode==='inbox'?(state.online_inbox_visible===false||state.inbox_enabled===false||!state.sections.includes('inbox')):!state.sections.includes(b.dataset.artmode))));
   for(const [section,id] of [['inbox','v3ArtworkInboxHost'],['vector','v3ArtworkVectorHost'],['text','v3ArtworkTextHost'],['draw','v3ArtworkDrawHost'],['algorithm','v3ArtworkAlgorithmHost'],['stl','v3ArtworkStlHost'],['foam','v3ArtworkFoamHost']])el(id)?.toggleAttribute('data-ldm-section-disabled',(section==='inbox'?(state.online_inbox_visible===false||state.inbox_enabled===false||!state.sections.includes('inbox')):!state.sections.includes(section)));
   // Legacy functions can repaint button labels; hide every machine action independently.
   document.querySelectorAll('button[onclick]').forEach(b=>{
     if(/\b(startJob|v3SvgSaveStartJob|startSelectedProject|traceBridgeSD|downloadA1PlotPackage|v3OpenRepeatSdJobs|penUp|penDown|moveZAbs|homeXYZ|raw)\s*\(/.test(b.getAttribute('onclick')))b.setAttribute('data-ldm-admin-only','');
   });
   const button=el('ldmCanvasSubmit');if(button){button.disabled=state.mode==='off'||state.inbox_enabled===false||submitting;const label=state.mode==='off'?'SUBMISSIONS DISABLED':'SUBMIT';if(button.textContent!==label)button.textContent=label;}
   const remoteTab=el('ldmArtworkFilesTab');if(remoteTab?.dataset.ldmRemoteInbox)remoteTab.toggleAttribute('data-ldm-section-disabled',state.online_inbox_visible===false||state.inbox_enabled===false||!state.sections.includes('inbox'));
   const current=mode();if((current==='inbox'&&(state.inbox_enabled===false||state.online_inbox_visible===false))||!state.sections.includes(current))document.querySelector(`.v3ArtworkModeTabs [data-artmode="${state.sections[0]||'none'}"]`)?.click();
 }
 function svgString(canvas){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}">${canvas.paths.map(st=>`<polyline fill="none" stroke="black" points="${st.map(p=>p.join(',')).join(' ')}"/>`).join('')}</svg>`}
 async function importApproved(id){
   try{
     const d=await call(`/api/admin/canvas/${encodeURIComponent(id)}`);const item=d.item;
     if(item.status!=='APPROVED')throw new Error('This submission is not approved. Review it in ADMINISTRATOR first.');
     // Deliberately no source SVG import: preserve accepted point order and placement.
     const c=item.canvas;
     if(window.ldmSvgObjects.length)ldmSnapshot();
     else{el('paperW').value=c.width;el('paperH').value=c.height;el('paperW').dispatchEvent(new Event('input',{bubbles:true}));el('paperH').dispatchEvent(new Event('input',{bubbles:true}));}
     const paperWidth=Number(el('paperW').value),paperHeight=Number(el('paperH').value);
     const layers=c.layers?.length?c.layers:[{name:`APPROVED · ${item.title}`,paths:c.paths,visible:true}];
     const objects=layers.map(layer=>{const paths=JSON.parse(JSON.stringify(layer.paths));let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;for(const st of paths)for(const [x,y]of st){minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);}return {name:layer.name,text:svgString({...c,paths}),raw:paths,x:(minx+maxx)/2-paperWidth/2,y:(miny+maxy)/2-paperHeight/2,scale:100,rot:0,mx:false,my:false,visible:layer.visible!==false,...(layer.colour?{lineColour:layer.colour}:{}),ldmCanvasSnapshotId:item.id,ldmCanvasSnapshotSha256:item.sha256,ldmCanvasSourceWidth:c.width,ldmCanvasSourceHeight:c.height};});
     window.ldmSvgObjects.push(...objects);svgText=objects.at(-1).text;rawSvgPaths=objects.at(-1).raw;placedSvgPaths=[];
     if(c.vector_options){window.ldmSetVectorColour?.(c.vector_options.multicolour);window.ldmVectorColourEnabled=c.vector_options.multicolour;const check=document.querySelector('.ldmVectorColourOption input[type="checkbox"]');if(check)check.checked=c.vector_options.multicolour;if(el('ldmVectorHoldSeconds'))el('ldmVectorHoldSeconds').value=c.vector_options.hold_seconds;}
     window.ldmSelectedSvg=window.ldmSvgObjects.length-1;selectedPreviewObject={kind:'vector',idx:window.ldmSelectedSvg};
     clearObjectEditOverlay?.();ldmLoadControls();ldmRefreshSvgList();ldmRenderComposition();refreshTextObjectList?.();FTE.built=false;
     window.LDM_IMPORTED_CANVAS={id:item.id,sha256:item.sha256};
     el('job').textContent=`APPROVED CANVAS LAYER ADDED · ${item.title}. Review machine setup, then use the existing CONFIRM & SEND.`;
     history.replaceState(null,'',location.pathname);
   }catch(e){window.ldmAlert?ldmAlert(e.message):alert(e.message)}
 }
 let started=false;
 async function start(){
   if(state.local&&!state.admin)return;
   if(started)return;started=true;
   const top=document.querySelector('.ldmTopRight');
   if(state.admin){
     const id=new URLSearchParams(location.search).get('canvas');
     if(id){await window.v3PresentationOpenTab('artwork');requestAnimationFrame(()=>requestAnimationFrame(()=>importApproved(id)));}
   }else{
     // Reuse the exact existing artwork workspace, editor, preview and algorithms.
     const open=window.v3PresentationOpenTab;
     window.v3PresentationOpenTab=function(kind){if(kind!=='artwork')return;return open.apply(this,arguments)};
     await window.v3PresentationOpenTab('artwork');mount();
     // Keyboard/swipe guide navigation must not reopen machine/setup scenes.
     for(const name of ['v3PresentationExit','v3PresentationNext','v3PresentationPrev','v3PresentationStart'])window[name]=()=>{};
     const bar=el('v3ShowCounter');if(bar)bar.textContent='REMOTE ARTWORK';
     const observer=new MutationObserver(()=>{mount();updatePermissions()});
     observer.observe(document.body,{childList:true,subtree:true});
   }
   setInterval(async()=>{
     try{
       const next=await call('/api/access');
       if(state.admin&&!next.admin){location.replace('/');return;}
       Object.assign(state,next);
       if(!state.admin){
         document.documentElement.classList.toggle('ldm-remote-disabled',!state.remote_enabled);
         if(!state.remote_enabled){message('Remote workspace disabled by administrator.');return;}
         updatePermissions();await refresh();
       }
     }catch(_){}
   },5000);
 }
 document.addEventListener('ldm-administrator-unlocked',start);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 document.addEventListener('ldm-online-view',()=>{updatePermissions();mount();});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-artmode]'))setTimeout(mount,0);});
 window.ldmMountRemoteCanvasInbox=mount;
 window.ldmRefreshOwnCanvasSubmissions=refresh;
 window.ldmCaptureSubmissionCanvas=capture;
 window.ldmImportApprovedCanvas=importApproved;
})();
