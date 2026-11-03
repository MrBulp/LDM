/* Only invoked after an explicit, server-verified idle Typewriter recovery. */
(()=>{'use strict';
 window.ldmTypewriterRestoreSetup=function(){
  if(!window.LDM_ACCESS?.local||!window.LDM_ACCESS?.admin)return false;
  // Reuse the original STOP lifecycle cleanup, including the inherited Expert,
  // preparation and home-recalibration wrappers; do not fake a successful step.
  if(typeof V3_A1_STOP_RECAL_LATCH!=='undefined')V3_A1_STOP_RECAL_LATCH=false;
  window.v3ForceRecal123AfterMachineStop?.('TYPEWRITER RECOVERY');
  window.v3ResetMainHomeAfterMachineStop?.();
  window.ldmInvalidateNewJobSetupAfterRepeat?.();
  document.getElementById('v3QuickStepsDrawer')?.classList.remove('v4fiExpertPostFinishLock');
  window.v3SetJobMotionLock?.(false,'IDLE');
  window.v3QuickSequentialSync?.();
  document.dispatchEvent(new Event('ldm-typewriter-setup-recovered'));
  return true;
 };
})();
