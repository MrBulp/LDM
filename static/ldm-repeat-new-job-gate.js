/* Repeat recovery is not calibration evidence for the next new canvas job. */
(()=>{'use strict';
 window.ldmInvalidateNewJobSetupAfterRepeat=function(){
  const expert=document.getElementById('v4ExpertModeCheck');
  if(expert?.checked){expert.checked=false;expert.dispatchEvent(new Event('change',{bubbles:true}));}
  window.ldmFoamExpertReset?.();
  window.__ldmQuickRealHomeComplete=false;
  window.V3_QUICK_SURFACE_Z_CONFIRMED=false;
  if(typeof paperCenterSet!=='undefined')paperCenterSet=false;
  for(const id of ['v3QuickMaterialCheck','v3QuickSurfaceCheck']){
   const check=document.getElementById(id);if(check){check.checked=false;check.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  for(const id of ['v3QuickHomeBtn','v3QuickCenterBtn'])document.getElementById(id)?.classList.remove('is-success');
  window.v3QuickSequentialSync?.();
 };
})();
