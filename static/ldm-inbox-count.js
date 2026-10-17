/* Reuse the existing administrator inbox polling; no extra requests. */
(function initialize(){'use strict';
 if(!window.LDM_ACCESS?.admin){document.addEventListener('ldm-administrator-unlocked',initialize,{once:true});return;}
 let pending=null;
 function paint(){
   const button=document.querySelector('#ldmFilesInboxSection > summary')||document.querySelector('.v3ArtworkModeTabs [data-artmode="inbox"]');
   if(!button||pending===null)return;
   const value=`INBOX (${pending})`;
   if(button.textContent!==value)button.textContent=value;
   const label=`INBOX — ${pending} pending remote artwork`;
   if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
   if(button.title!==label)button.title=label;
 }
 window.ldmSetPendingCanvasCount=function(value){pending=Number.isInteger(value)&&value>=0?value:0;paint();};
 let frame=0;new MutationObserver(mutations=>{if(mutations.every(m=>m.target.namespaceURI==='http://www.w3.org/2000/svg'))return;if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint();});}).observe(document.body,{childList:true,subtree:true});
})();
