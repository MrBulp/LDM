/* Navigation only: reuse the existing exit control and existing FOAM tab. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 function syncExit(){
  const exit=$('ldmV7Exit'),rail=$('ldmV7StepRail'),overlay=$('v3StepShow');if(!exit||!rail||!overlay)return;
  const detached=overlay.classList.contains('open')&&!!overlay.querySelector('.v3Direct-advanced,.v3Direct-slicedfiles');
  const target=detached?overlay:rail;if(exit.parentNode!==target)target.appendChild(exit);
  exit.classList.toggle('ldmStandaloneExit',detached);
 }
 async function showFoam(){
  if(!$('v3StepShow')?.querySelector('.v3Direct-artwork'))await window.v3PresentationOpenTab?.('artwork');
  const tab=document.querySelector('.v3ArtworkModeTabs [data-artmode="foam"]');if(!tab||tab.hidden)return;
  tab.click();const simulator=$('ldmFoamSimulator');if(simulator)simulator.open=true;
 }
 document.addEventListener('change',event=>{if(event.target?.id==='v4MaterialJobType'&&event.target.value==='foam')showFoam().catch(console.error);});
 function start(){const overlay=$('v3StepShow'),stage=$('v3ShowStage');if(stage)new MutationObserver(syncExit).observe(stage,{childList:true});if(overlay)new MutationObserver(syncExit).observe(overlay,{attributes:true,attributeFilter:['class']});syncExit();}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
