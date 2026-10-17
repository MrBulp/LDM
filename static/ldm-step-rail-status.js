/* Side navigation reflects original live gates; never changes their state. */
(()=>{'use strict';const cards=['v4ConnectCard','v4HomeCard','v3QuickMaterialTile','v3QuickSurfaceTile','v4CenterCard'];
function boot(){const drawer=document.getElementById('v3QuickStepsDrawer');if(!drawer)return;let queued=false;
function sync(){queued=false;cards.forEach((card,i)=>{const button=drawer.querySelector('#ldmV7StepRail [data-v7-step="'+i+'"]');if(!button)return;const value=document.getElementById(card)?.classList.contains('v4GateGreen')?'complete':'pending';if(button.dataset.gateState!==value)button.dataset.gateState=value;});}
new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(sync);}}).observe(drawer,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});sync();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();})();
