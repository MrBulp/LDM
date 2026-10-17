/* Canvas is a production view with its own INBOX tab; machine gates are unchanged. */
(()=>{'use strict';
 window.ldmSetupArtworkInbox=function(host){
   if(!host)return;
   if(!window.LDM_ACCESS?.admin){
     window.ldmMountRemoteCanvasInbox?.();
     window.ldmRefreshOwnCanvasSubmissions?.();
   }
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
     if(host.isConnected&&window.LDM_ACCESS?.inbox_enabled!==false)document.querySelector('.v3ArtworkModeTabs [data-artmode="inbox"]')?.click();
   }));
 };
 function reconcile(){
   const dock=document.getElementById('ldmHomeInboxDock');if(!dock){window.ldmPlaceCanvasInbox?.(null);return;}
   const host=document.getElementById('v3ArtworkInboxHost');
   const target=host&&!host.hidden?host:document.body;
   if(dock.parentNode!==target)window.ldmPlaceCanvasInbox?.(target===document.body?null:target);
 }
 const start=()=>{new MutationObserver(reconcile).observe(document.body,{childList:true,subtree:true});reconcile()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
