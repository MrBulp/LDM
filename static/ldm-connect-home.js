/* Keep the existing connection dialog and continuation over the HOME screen. */
(()=>{'use strict';
 function start(){
   const modal=document.getElementById('v3GoldenConnectModal');
   if(!modal||!window.LDM_ACCESS?.local)return;
   let returning=false;
   async function placeOverHome(){
     if(returning||!modal.classList.contains('is-open')||!window.LDM_ACCESS.admin)return;
     const guide=document.getElementById('v3StepShow');
     if(!guide?.classList.contains('open'))return;
     returning=true;
     try{await window.v3PresentationExit?.();}
     finally{returning=false;}
   }
   new MutationObserver(placeOverHome).observe(modal,{attributes:true,attributeFilter:['class']});
   placeOverHome();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
