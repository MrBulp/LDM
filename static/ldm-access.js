/* Runs in HEAD, before the inherited app. Same-origin requests only. */
(()=>{'use strict';
 const state=window.LDM_ACCESS||{};
 document.documentElement.classList.toggle('ldm-artwork-guest',!state.admin&&!state.local);
 try{window.LDM_ADMIN_HOME_BOOT=sessionStorage.getItem('ldmAdminLoginHomeOnce')==='1';sessionStorage.removeItem('ldmAdminLoginHomeOnce')}catch(_){}
 const original=window.fetch.bind(window);
 window.fetch=function(input,init){
   const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
   const method=String(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
   if(url.origin!==location.origin||['GET','HEAD','OPTIONS'].includes(method))return original(input,init);
   const opts={...init,headers:new Headers(init?.headers||(input instanceof Request?input.headers:undefined))};
   if(window.LDM_ACCESS?.csrf)opts.headers.set('X-LDM-CSRF',window.LDM_ACCESS.csrf);
   return original(input,opts);
 };
 document.addEventListener('keydown',e=>{if(state.local&&!state.admin&&!window.LDM_GUEST_EXPLORING&&!e.target.closest?.('#ldmAdminLoginPopup,#ldmEntryAdmin,#ldmMachineProfiles,#ldmLanguageControls,#v3GoldenCancelBtn,[data-ldm-entry-reopen]')){e.preventDefault();e.stopImmediatePropagation()}},true);
 // Capture before legacy document listeners. The server remains authoritative.
 document.addEventListener('click',e=>{
   if(window.LDM_ACCESS?.admin)return;
   if(state.local&&!state.admin){if(e.target.closest?.('#ldmAdminLoginPopup,#ldmEntryAdmin,#ldmMachineProfiles,#ldmLanguageControls,#v3GoldenCancelBtn,[data-ldm-entry-reopen]'))return;if(!window.LDM_GUEST_EXPLORING){e.preventDefault();e.stopImmediatePropagation();return;}}
   const b=e.target.closest?.('button,a');if(!b||b.closest('#ldmRemoteCanvasPanel'))return;
   const handler=b.getAttribute('onclick')||'';
   const machine=/\b(startJob|startSelectedProject|v3SvgSaveStartJob|nativeConnect|nativeDisconnect|nativeSave|home|homeXYZ|moveZAbs|penUp|penDown|raw|zeroXY|goPaperCenter|setPaperCenter|sdTest|sdList|sdStart|startDraw|startDrawNow|v3OpenRepeatSdJobs|v3PresentationStart|v3OpenQuickSteps|v3OpenRemoteView|v3PresentationExit|v3PresentationNext|v3PresentationPrev)\s*\(/;
   const kind=handler.match(/v3PresentationOpenTab\(['"]([^'"]+)/)?.[1];
   const tab=b.dataset.artmode;
   if(b.closest('#v3ArtworkFoamHost')&&(b.matches('[data-foam-jog],[data-foam-save]')||/^ldmFoam_(heat|off|upload|open|confirm|canvas|teachHome)$/.test(b.id))){e.preventDefault();e.stopImmediatePropagation();return;}
   if(machine.test(handler)||(!state.local&&kind&&kind!=='artwork')||(tab==='inbox'&&window.LDM_ACCESS.inbox_enabled===false)||(tab&&!window.LDM_ACCESS.sections?.includes(tab==='inbox'?'vector':tab))){e.preventDefault();e.stopImmediatePropagation();}
 },true);
})();
