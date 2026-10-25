/* V6.7: Administrator-only quick inbox on LDM HOME. No machine requests. */
(function initialize(){'use strict';
 const state=window.LDM_ACCESS;if(!state?.admin){document.addEventListener('ldm-administrator-unlocked',initialize,{once:true});return;}
 let dock,panel,list,count,note,preview,previewTitle,previewSvg,items=[],busy=false,polling=false,previewedId='',previewRequest=0;
 async function call(path,body){
   const r=await fetch(path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
   const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d;
 }
 const terminal=i=>['CANCELLED','REJECTED'].includes(i.status);
 function resetPreview(){previewedId='';previewRequest++;if(preview){preview.hidden=false;previewTitle.textContent='SUBMITTED CANVAS';previewSvg.replaceChildren();}try{localStorage.removeItem('ldmSelectedSubmissionPreview')}catch(_){}}
 async function togglePreview(item){
   if(previewedId===item.id)return;
   const serial=++previewRequest;previewedId=item.id;try{localStorage.setItem('ldmSelectedSubmissionPreview',item.id)}catch(_){}
   try{
     const d=await call(`/api/admin/canvas/${item.id}`);if(serial!==previewRequest)return;
     const c=d.item.canvas;previewTitle.textContent=d.item.title;
     previewSvg.setAttribute('viewBox',`0 0 ${c.width} ${c.height}`);previewSvg.replaceChildren();
     const previewPaths=c.layers?.length?c.layers.filter(l=>l.visible!==false).flatMap(l=>l.paths.map(stroke=>({stroke,colour:l.colour}))):c.paths.map(stroke=>({stroke,colour:'currentColor'}));
     for(const {stroke,colour} of previewPaths){const p=document.createElementNS('http://www.w3.org/2000/svg','polyline');p.setAttribute('points',stroke.map(q=>q.join(',')).join(' '));p.setAttribute('fill','none');p.setAttribute('stroke',colour||'currentColor');p.setAttribute('stroke-width','.6');p.setAttribute('vector-effect','non-scaling-stroke');previewSvg.appendChild(p)}
     preview.hidden=false;render();
   }catch(e){if(serial===previewRequest){resetPreview();note.textContent=e.message;render();}}
 }
 function eyeButton(item){
   const b=button('','View submitted artwork',()=>togglePreview(item));b.className='ldmInboxEye';b.setAttribute('aria-pressed',String(previewedId===item.id));
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
   const outline=document.createElementNS('http://www.w3.org/2000/svg','path');outline.setAttribute('d','M2 12C5 7 8 5 12 5s7 2 10 7c-3 5-6 7-10 7s-7-2-10-7Z');outline.setAttribute('fill','none');outline.setAttribute('stroke','currentColor');outline.setAttribute('stroke-width','1.7');
   const pupil=document.createElementNS('http://www.w3.org/2000/svg','circle');pupil.setAttribute('cx','12');pupil.setAttribute('cy','12');pupil.setAttribute('r','3');pupil.setAttribute('fill','none');pupil.setAttribute('stroke','currentColor');pupil.setAttribute('stroke-width','1.7');svg.append(outline,pupil);b.appendChild(svg);return b;
 }
 function button(label,title,action,disabled=false){const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.disabled=disabled;b.onclick=action;return b;}
 let lastRenderKey;
 function render(){
   const renderKey=JSON.stringify([items,busy,previewedId]);
   if(renderKey===lastRenderKey)return;lastRenderKey=renderKey;
   const ready=items.filter(i=>['PENDING','APPROVED'].includes(i.status)).length;
   window.ldmSetPendingCanvasCount?.(items.filter(i=>i.status==='PENDING').length);
   count.textContent=String(ready);list.replaceChildren();
   if(!items.length){const empty=document.createElement('p');empty.textContent='No submitted canvases.';list.appendChild(empty);}
   for(const item of items){
     const row=document.createElement('div');row.className='ldmHomeInboxRow';
     const name=document.createElement('div');name.className='ldmHomeInboxName';name.textContent=item.title;name.title=item.title;
     const status=document.createElement('small');status.textContent=item.status;name.appendChild(status);
     const actions=document.createElement('div');actions.className='ldmHomeInboxActions';
     const approve=button('✓',item.status==='PENDING'?'Approve and load into Desktop CANVAS':'Load approved canvas into Desktop',()=>run(()=>approveAndLoad(item)),busy||!['PENDING','APPROVED'].includes(item.status));approve.className='ldmInboxApprove';
     const reject=button('X','Reject this canvas submission',()=>run(async()=>{await call(`/api/admin/canvas/${item.id}/reject`,{sha256:item.sha256});note.textContent='Submission rejected.';}),busy||terminal(item));reject.className='ldmInboxReject';
     actions.append(eyeButton(item),approve,reject,button('REMOVE','Remove this entry regardless of approval status',()=>run(async()=>{await call(`/api/admin/canvas/${item.id}/delete`,{});note.textContent='Entry removed.';}),busy));
     row.append(name,actions);list.appendChild(row);
   }
   panel.querySelector('[data-inbox-clear-all]').disabled=busy||!items.length;
 }
 async function refresh(){
   if(polling||busy)return;polling=true;
   try{const d=await call('/api/admin/canvas');items=d.items;if(!items.some(i=>i.id===previewedId)){let saved='';try{saved=localStorage.getItem('ldmSelectedSubmissionPreview')||''}catch(_){}const selected=items.find(i=>i.id===saved)||items[0];if(selected)await togglePreview(selected);else resetPreview();}render();}
   catch(e){note.textContent=e.message;}
   finally{polling=false}
 }
 async function run(action){
   if(busy)return;busy=true;render();
   try{await action()}catch(e){note.textContent=e.message}
   finally{busy=false;await refresh()}
 }
 async function approveAndLoad(item){
   await togglePreview(item);
   if(item.status==='PENDING')await call(`/api/admin/canvas/${item.id}/approve`,{sha256:item.sha256});
   note.textContent='Approved. Loading into Desktop CANVAS…';
   await window.v3PresentationOpenTab('artwork');
   document.querySelector('.v3ArtworkModeTabs [data-artmode="inbox"]')?.click();
   // The existing importer rechecks approval before loading the numeric snapshot.
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const loaded=await window.ldmImportApprovedCanvas(item.id);
   note.textContent=loaded===false?'Approved. Artwork was not loaded; retry loading when the current capture/import finishes.':'Approved. Added to the artwork draft; machine sending stays manual.';
 }
 function mount(){
   panel=document.createElement('details');panel.id='ldmHomeCanvasInbox';panel.setAttribute('aria-label','Canvas inbox quick list');
   panel.innerHTML='<summary><span>CANVAS INBOX</span><span id="ldmHomeInboxCount">0</span></summary><div class="ldmHomeInboxBody"><div class="ldmHomeInboxToolbar"><button type="button" data-inbox-refresh>↻</button></div><div id="ldmHomeInboxList"></div><div class="ldmHomeInboxFooter"><button type="button" data-inbox-clear-all>REMOVE ALL LIST</button></div><div id="ldmHomeInboxNote" role="status"></div></div>';
   dock=document.createElement('div');dock.id='ldmHomeInboxDock';
   preview=document.createElement('section');preview.id='ldmHomeInboxPreview';preview.hidden=false;preview.setAttribute('aria-label','Submitted artwork preview');
   const head=document.createElement('div');head.className='ldmInboxPreviewHead';previewTitle=document.createElement('span');previewTitle.textContent='SUBMITTED CANVAS';head.append(previewTitle);
   previewSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');previewSvg.setAttribute('role','img');previewSvg.setAttribute('aria-label','Submitted canvas artwork');preview.append(head,previewSvg);
   dock.append(preview,panel);document.body.appendChild(dock);list=panel.querySelector('#ldmHomeInboxList');count=panel.querySelector('#ldmHomeInboxCount');note=panel.querySelector('#ldmHomeInboxNote');
   count.title='Pending and approved canvases';
   try{panel.open=localStorage.getItem('ldmHomeCanvasInboxOpen')==='1'}catch(_){}
   panel.addEventListener('toggle',()=>{try{localStorage.setItem('ldmHomeCanvasInboxOpen',panel.open?'1':'0')}catch(_){}if(panel.open)refresh();else render()});
   panel.querySelector('[data-inbox-refresh]').title='Refresh canvas inbox';panel.querySelector('[data-inbox-refresh]').setAttribute('aria-label','Refresh canvas inbox');panel.querySelector('[data-inbox-refresh]').onclick=refresh;
   panel.querySelector('[data-inbox-clear-all]').title='Remove every submission, including pending and approved entries';
   panel.querySelector('[data-inbox-clear-all]').onclick=()=>run(async()=>{if(!await ldmConfirm('Remove the entire CANVAS INBOX list, including pending and approved entries?'))return;const d=await call('/api/admin/canvas/clear-all',{});note.textContent=`List removed — ${d.cleared} entries removed.`;});
   window.ldmPlaceCanvasInbox=function(host){if(!dock)return;const target=host||document.body;if(dock.parentNode!==target)target.appendChild(dock);dock.toggleAttribute('data-embedded',!!host);if(host){panel.open=true;refresh()}};
   const host=document.getElementById('v3ArtworkInboxHost');if(host&&!host.hidden)window.ldmPlaceCanvasInbox(host);
   refresh();setInterval(refresh,5000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
