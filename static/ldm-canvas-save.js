/* Save numeric CANVAS snapshots; machine execution remains a separate action. */
(()=>{'use strict';
 const access=window.LDM_ACCESS;
 let dialog, title, status, save, cancel, snapshot, pending=false, previousFocus;
 const id=name=>document.getElementById(name);
 function close(){if(pending)return;dialog.hidden=true;snapshot=null;previousFocus?.focus();}
 function makeDialog(){
   if(dialog)return;
   dialog=document.createElement('div');dialog.id='ldmCanvasSaveDialog';dialog.hidden=true;
   dialog.innerHTML='<form role="dialog" aria-modal="true" aria-labelledby="ldmCanvasSaveHeading"><h2 id="ldmCanvasSaveHeading">SAVE TO CANVAS INBOX</h2><label>Canvas title<input id="ldmCanvasSaveTitle" maxlength="120" required autocomplete="off"></label><p>Save a fixed copy of the artwork currently on CANVAS.</p><p id="ldmCanvasSaveStatus" role="status"></p><div class="ldmCanvasSaveActions"><button type="button" id="ldmCanvasSaveCancel">CANCEL</button><button type="submit" id="ldmCanvasSaveConfirm">SAVE</button></div></form>';
   document.body.appendChild(dialog);
   title=id('ldmCanvasSaveTitle');status=id('ldmCanvasSaveStatus');save=id('ldmCanvasSaveConfirm');cancel=id('ldmCanvasSaveCancel');
   cancel.onclick=close;
   dialog.querySelector('form').onsubmit=async event=>{
     event.preventDefault();if(pending||!snapshot)return;
     const name=title.value.trim();if(!name){status.textContent='Enter a canvas title.';title.focus();return;}
     pending=true;save.disabled=cancel.disabled=title.disabled=true;status.textContent='Saving…';
     try{
       const response=await fetch(access.admin?'/api/admin/canvas/save':'/api/canvas',{
         method:'POST',headers:{'Content-Type':'application/json','X-LDM-CSRF':access.csrf},
         body:JSON.stringify({title:name,canvas:snapshot})
       });
       const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save canvas.');
       status.textContent=`${result.duplicate?'Already in CANVAS INBOX':'Saved to CANVAS INBOX'} — ${result.item.status}.`;
       snapshot=null;save.hidden=true;cancel.textContent='DONE';
       await window.ldmRefreshOwnCanvasSubmissions?.();
       id('ldmHomeCanvasInbox')?.querySelector('[data-inbox-refresh]')?.click();
     }catch(error){status.textContent=error.message;}
     finally{pending=false;save.disabled=cancel.disabled=title.disabled=false;}
   };
   dialog.addEventListener('keydown',event=>{
     if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
     if(event.key==='Tab'){
       const controls=[title,cancel,save].filter(node=>!node.hidden&&!node.disabled);
       if(!controls.length){event.preventDefault();return;}
       const first=controls[0],last=controls[controls.length-1];
       if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
       else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
     }
   });
 }
 function open(){
   makeDialog();previousFocus=document.activeElement;save.hidden=false;cancel.textContent='CANCEL';status.textContent='';snapshot=null;
   title.value=id('ldmCanvasTitle')?.value||'Canvas '+new Date().toLocaleString();
   try{snapshot=window.ldmCaptureSubmissionCanvas();}catch(error){status.textContent=error.message;}
   save.disabled=!snapshot;dialog.hidden=false;title.focus();
 }
 function mount(){
   const bar=id('ldmCanvasExportBar');if(!bar||id('ldmCanvasSaveInbox')||(!access.admin&&access.local))return;
   const button=document.createElement('button');button.type='button';button.id='ldmCanvasSaveInbox';button.textContent='SAVE TO CANVAS INBOX';button.onclick=open;bar.appendChild(button);
 }
 new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
 mount();
})();
