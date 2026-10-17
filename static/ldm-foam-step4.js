/* GUI.155: reuse the existing heat controls; retain SZ=0 gate behind FOAM Step 4. */
(()=>{'use strict';const $=id=>document.getElementById(id);let heat=null,heatAnchor=null,buttons=null,buttonAnchor=null,syncing=false;
 const active=()=>!!window.ldmFoamMaterialActive?.();
 function restore(){if(heatAnchor?.isConnected&&heat)heatAnchor.after(heat);if(buttonAnchor?.isConnected&&buttons)buttonAnchor.after(buttons);heat=null;buttons=null;heatAnchor=null;buttonAnchor=null;}
 function heatValid(){const temp=$('ldmFoam_temperature'),a=$('ldmFoam_bottom_hold_seconds'),b=$('ldmFoam_tcd_hold_seconds');const holds=window.ldmFoamEntryMode?.()==='vertical'?[a]:[a,b];if(!temp||holds.some(e=>!e)||[temp,...holds].some(e=>e.value===''))return false;const t=Number(temp.value);return Number.isInteger(t)&&t>=0&&t<=300&&holds.every(e=>Number.isInteger(Number(e.value))&&Number(e.value)>=1&&Number(e.value)<=600);}
 function gate(){if(!active())return;const input=$('v3QuickSurfaceValue'),check=$('v3QuickSurfaceCheck'),tile=$('v3QuickSurfaceTile');if(!input||!check||!tile)return;
  if(input.value!=='0.00')input.value='0.00';if(!input.disabled)input.disabled=true;
  const ready=window.ldmFoamMaterialValid?.()!==false&&!!$('v3QuickMaterialCheck')?.checked&&!!window.__ldmQuickRealHomeComplete&&heatValid();
  if(check.disabled!==!ready)check.disabled=!ready;
  if(!ready)check.checked=false;
  window.V3_QUICK_SURFACE_Z_VALUE=0;window.V3_QUICK_SURFACE_Z_CONFIRMED=ready&&check.checked;
  tile.classList.toggle('is-success',ready&&check.checked);
 }
 function sync(){if(syncing)return;syncing=true;try{
  const tile=$('v3QuickSurfaceTile');if(!tile)return;let area=$('ldmFoamStep4');
  if(!area){area=document.createElement('div');area.id='ldmFoamStep4';area.className='v4InfoArea';area.innerHTML='<b>4</b><div class="v4CardBody"><strong>HEAT + TIMED HOLD</strong><div id="ldmFoamStep4Controls"></div></div>';tile.appendChild(area);}
  const h2=$('ldmFoam_tcd_hold_seconds')?.closest('label'),hideH2=active()&&window.ldmFoamEntryMode?.()==='vertical';if(h2&&h2.hidden!==hideH2)h2.hidden=hideH2;
  gate();const confirmed=active()&&heatValid()&&!!$('v3QuickSurfaceCheck')?.checked;
  tile.classList.toggle('ldmFoamOriginConfirmed',confirmed);
  const gateLabel=$('v3QuickSurfaceCheck')?.closest('label'),gateText=gateLabel?.querySelector('span');
  const title=active()?($('v3QuickSurfaceCheck')?.checked?'HEAT + TIMED HOLD CONFIRMED':'HEAT + TIMED HOLD SETUP'):'SURFACE Z CONFIRMED';if(gateText&&gateText.textContent!==title)gateText.textContent=title;
  if(active()){
   // Keep the original live confirmation below the heat content, without cloning its gate.
   if(gateLabel&&area.nextElementSibling!==gateLabel)area.after(gateLabel);
   const target=$('ldmFoamStep4Controls'),next=$('ldmFoamHeatSettings');
   if(next&&next!==heat){heat=next;heatAnchor=document.createElement('span');heatAnchor.hidden=true;heat.before(heatAnchor);}
   if(heat){heat.querySelectorAll('label').forEach(label=>label.classList.add('v4MaterialField'));heat.querySelectorAll('p').forEach(p=>p.classList.add('v4SetupHelp'));$('ldmFoam_live')?.classList.add('v4SetupHelp');}
   if(heat&&heat.parentNode!==target){target.appendChild(heat);heat.open=true;}
   const nextButtons=$('ldmFoam_heat')?.parentElement;
   if(nextButtons&&nextButtons!==buttons){buttons=nextButtons;buttonAnchor=document.createElement('span');buttonAnchor.hidden=true;buttons.before(buttonAnchor);}
   if(buttons&&buttons.parentNode!==target)target.appendChild(buttons);
   gate();
  }else restore();
 }finally{syncing=false;}}
 const mount=window.ldmFoamMount;
 if(mount)window.ldmFoamMount=function(host){restore();const r=mount(host);sync();return r;};
 function start(){const prior=window.v3QuickSequentialSync;if(prior)window.v3QuickSequentialSync=function(...args){if(syncing)return prior.apply(this,args);gate();const r=prior.apply(this,args);sync();return r;};
  document.addEventListener('change',e=>{if(['v4MaterialJobType','v3QuickMaterialCheck','v3QuickSurfaceCheck','v4ExpertModeCheck'].includes(e.target?.id))queueMicrotask(()=>{sync();window.v3QuickSequentialSync?.();});});
  document.addEventListener('input',e=>{if(!active()||!['ldmFoam_temperature','ldmFoam_bottom_hold_seconds','ldmFoam_tcd_hold_seconds'].includes(e.target?.id))return;const c=$('v3QuickSurfaceCheck');if(c)c.checked=false;sync();window.v3QuickSequentialSync?.();},true);
  const drawer=$('v3QuickStepsDrawer');if(drawer)new MutationObserver(sync).observe(drawer,{childList:true,subtree:true});sync();
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
 window.ldmFoamStep4Sync=sync;
})();
