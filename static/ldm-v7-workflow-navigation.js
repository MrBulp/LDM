/* Navigation only: reuse the existing exit control and existing FOAM tab. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);let navigating=false;
 function syncExit(){
  const exit=$('ldmV7Exit'),rail=$('ldmV7StepRail'),overlay=$('v3StepShow');if(!exit||!rail||!overlay)return;
 const stage=$('v3ShowStage'),scene=stage?.querySelector(':scope > .v3DirectTabScene,:scope > [class*="v3Direct-"]');
 const open=overlay.classList.contains('open'),workspace=open&&!!scene?.classList.contains('v3Direct-artwork');
 const detached=open&&!!(scene?.classList.contains('v3Direct-advanced')||scene?.classList.contains('v3Direct-slicedfiles'));
 let dock=$('ldmWorkspaceBottomDock16');if(workspace&&!dock){dock=document.createElement('nav');dock.id='ldmWorkspaceBottomDock16';dock.setAttribute('aria-label','Workspace shortcuts and navigation');for(const [kind,label]of [['slicedfiles','BAMBU<br>PRINT JOB'],['advanced','SETTING']]){const b=document.createElement('button');b.type='button';b.dataset.workspaceDestination=kind;b.innerHTML=label;b.setAttribute('aria-label',kind==='slicedfiles'?'BAMBU PRINT JOB':'SETTING');b.onclick=async()=>{if(b.disabled||navigating)return;navigating=true;b.disabled=true;try{await window.v3PresentationExit?.();await window.v3PresentationOpenTab?.(kind);}finally{b.disabled=false;navigating=false;}};dock.append(b);}overlay.append(dock);}if(dock&&dock.hidden===workspace)dock.hidden=!workspace;
 const grid=$('ldmV7QuickIcons');if(workspace&&grid&&grid.parentNode!==dock)dock.prepend(grid);else if(!workspace&&grid&&grid.parentNode===dock)rail.append(grid);
 const target=workspace?dock:detached?overlay:rail;if(exit.parentNode!==target)target.appendChild(exit);
 exit.classList.toggle('ldmStandaloneExit',detached);
  let links=$('ldmDetachedNavigation87');if(detached&&!links){links=document.createElement('nav');links.id='ldmDetachedNavigation87';links.setAttribute('aria-label','LDM screens');for(const [kind,label]of [['artwork','WORKSPACE'],['other','SETTING']]){const b=document.createElement('button');b.type='button';b.dataset.target=kind;if(kind==='artwork'){b.innerHTML='WORK<br>SPACE';b.setAttribute('aria-label','WORKSPACE');}else b.textContent=label;b.onclick=async()=>{if(b.disabled||navigating)return;navigating=true;b.disabled=true;const destination=b.dataset.target;try{await window.v3PresentationExit?.();await window.v3PresentationOpenTab?.(destination);}finally{b.disabled=false;navigating=false;}};links.append(b);}overlay.append(links);}if(links){for(const button of links.querySelectorAll(':scope > button'))for(const [key,value]of Object.entries({'font-size':'9px','line-height':'1.2','letter-spacing':'0','word-break':'normal','overflow-wrap':'normal',width:'60px','min-width':'60px','max-width':'60px',height:'66px','min-height':'66px','max-height':'66px',padding:'5px',margin:'0','box-sizing':'border-box',display:'flex','flex-direction':'column','align-items':'center','justify-content':'center','flex-shrink':'0'}))if(button.style.getPropertyValue(key)!==value)button.style.setProperty(key,value,'important');links.hidden=!detached;const other=links.querySelector('[data-target]:last-child'),settings=!!scene?.classList.contains('v3Direct-advanced');const destination=settings?'slicedfiles':'advanced',label=settings?'BAMBU PRINT JOB':'SETTING';if(other.dataset.target!==destination)other.dataset.target=destination;if(other.textContent!==label)other.textContent=label;}
 if(detached&&grid&&links&&grid.parentNode!==links)links.prepend(grid);else if(!workspace&&!detached&&grid&&grid.parentNode===links)rail.append(grid);

 }
 async function showFoam(){
  if(!$('v3StepShow')?.querySelector('.v3Direct-artwork'))await window.v3PresentationOpenTab?.('artwork');
  const tab=document.querySelector('.v3ArtworkModeTabs [data-artmode="foam"]');if(!tab||tab.hidden)return;
  tab.click();const simulator=$('ldmFoamSimulator');if(simulator)simulator.open=true;
 }
 document.addEventListener('change',event=>{if(event.target?.id==='v4MaterialJobType'&&event.target.value==='foam')showFoam().catch(console.error);});
 function start(){const overlay=$('v3StepShow'),stage=$('v3ShowStage');if(stage)new MutationObserver(syncExit).observe(stage,{childList:true});if(overlay)new MutationObserver(syncExit).observe(overlay,{attributes:true,attributeFilter:['class']});document.addEventListener('ldm-rail-shortcuts-ready',syncExit);syncExit();}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
