/* GUI.153: session-only reuse of an unchanged, normally finished FOAM setup. */
(()=>{'use strict';let accepted=null,pending=false,sawActive=false,finished=false,recovering=false;
 const $=id=>document.getElementById(id);
 const expert=()=>!!$('v4ExpertModeCheck')?.checked||!!window.ldmExpertAcknowledgedValues?.();
 const signature=s=>JSON.stringify({settings:s,model:$('v4MachineModelSelect')?.value,ip:$('nativeIP')?.value,serial:$('nativeSerial')?.value,center:typeof paperCenterMachine==='undefined'?null:paperCenterMachine});
 const reset=()=>{accepted=null;pending=false;sawActive=false;finished=false;recovering=false;};
 window.ldmFoamExpertReset=reset;
 window.ldmFoamExpertRecord=s=>{accepted=signature(s);finished=false;};
 window.ldmFoamExpertRecoveryActive=()=>recovering&&!!accepted&&finished;
 window.ldmFoamExpertRecovery=on=>{recovering=!!on&&!!accepted&&finished;return recovering;};
 window.ldmFoamExpertBegin=()=>{pending=true;sawActive=false;finished=false;};
 window.ldmFoamExpertCheck=s=>{if(accepted&&accepted!==signature(s)){window.ldmFoamInvalidate?.('Setup values changed. Confirm FOAM setup and clearance again.');return false;}return true;};
 window.ldmFoamExpertReuse=s=>expert()&&finished&&accepted===signature(s)&&!(typeof V3_FORCE_RECAL_123!=='undefined'&&V3_FORCE_RECAL_123);
 window.ldmFoamExpertStatus=s=>{
  if(!s?.printer_connected){reset();return false;}
  const state=String(s.printer_state||'').toUpperCase();
  if(['FAILED','STOPPED','CANCELLED','CANCELED'].includes(state)||(typeof V3_FORCE_RECAL_123!=='undefined'&&V3_FORCE_RECAL_123)){const hadSetup=!!accepted||pending;reset();if(hadSetup)window.ldmFoamInvalidate?.('FOAM job stopped or failed. Complete setup and cold clearance again.');return false;}
  if(!expert()){reset();return false;}
  if(recovering)return !!accepted;
  if(!pending&&(s.direct_job?.active||['PREPARE','RUNNING','PAUSE','PAUSED'].includes(state))){reset();return false;}
  if(pending&&(s.direct_job?.active||['PREPARE','RUNNING','PAUSE','PAUSED'].includes(state)))sawActive=true;
  if(pending&&sawActive&&state==='FINISH'){pending=false;finished=true;}
  // An unrelated job must never retain our calibration acknowledgements.
  return !!accepted&&(pending||finished);
 };
 document.addEventListener('input',changed,true);document.addEventListener('change',changed,true);
 function changed(e){
  if(!e.isTrusted)return;
  // Acknowledging STEP4 is not a setting edit; invalidation would uncheck itself.
  if(e.target?.id==='v3QuickSurfaceCheck'&&e.target.checked)return;
  if(['v4FinalMachineSpeedFoamCutSpeed','v4duCompactMachineSpeedFoamCutSpeed','ldmFoam_feed_rate'].includes(e.target?.id)){window.ldmFoamInvalidate?.('Cutting speed changed. Prepared job invalidated; STEP 4 heat confirmation retained.',{preserveHeat:true});return;}
  if(e.target?.id==='v4ExpertModeCheck'){if(!e.target.checked)reset();return;}
  if(e.target?.closest?.('#v3QuickStepsDrawer')||e.target?.closest?.('#ldmFoamMaterialFields')||['nativeIP','nativeSerial','nativeCode','v4MachineModelSelect'].includes(e.target?.id))window.ldmFoamInvalidate?.('STEP 1–5 changed. Complete setup and confirm FOAM clearance again.');
 }
})();
