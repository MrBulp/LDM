/* GUI.197: selected SD FOAM setup owns Repeat, independent of live STEP 3. */
(()=>{'use strict';let token='',selected='',busy=false,epoch=0;
 window.ldmFoamSavedRepeatToken=()=>token;
 window.ldmFoamSavedRepeatReady=name=>!!token&&name===selected;
 window.ldmFoamSavedRepeatReset=()=>{token='';selected='';epoch++;};
 const state=text=>{const el=document.getElementById('sdProjectPackageState');if(el)el.textContent=text;};
 async function post(path,data,jobToken=''){
  const headers={'Content-Type':'application/json'};if(jobToken)headers['X-LDM-Job-Token']=jobToken;
  const r=await fetch(path,{method:'POST',headers,body:JSON.stringify(data)}),d=await r.json();
  if(!r.ok||!d.success)throw Error(d.error||'FOAM Repeat request failed.');return d;
 }
 async function wait(seconds,label,current){
  const until=Date.now()+seconds*1000;
  while(Date.now()<until){if(epoch!==current)throw Error('Setup or connection changed during FOAM Repeat.');state(label+' ('+Math.ceil((until-Date.now())/1000)+'s)');await new Promise(resolve=>setTimeout(resolve,250));}
 }
 window.ldmFoamSavedRepeatPrepare=async function(name){
  if(busy)throw Error('FOAM Repeat is already preparing.');busy=true;window.ldmPreparingBegin?.();token='';selected='';const current=epoch;let reserved=false,jobToken='';
  try{
   state('READING FOAM SETUP FROM SELECTED PRINTER SD CARD FILE…');
   const {setup}=await post('/api/admin/foam-repeat/read',{filename:name}),s=setup.settings;
   const center=setup.plot_center;window.ldmFoamPendingRepeatReview=setup;
   const summary=name+'\n\nFoam thickness: '+s.foam_thickness+' mm\nBed/plate → foam bottom gap: '+s.bed_gap+' mm\nExposed rod: '+s.rod_length+' mm\nHotend target: '+s.temperature+' °C\nTravel speed: '+s.machine_speed+' mm/min\nCutting speed: '+s.feed_rate+' mm/min\nRod-tip FTSZ / TCM / TCD: '+s.foam_top_z+' / '+s.clearance_z+' / '+s.cut_z+' mm\nTimed holds: '+s.bottom_hold_seconds+' / '+s.tcd_hold_seconds+' seconds\nLDM HOME center: X'+center.x+' Y'+center.y+' (physical G28 position; not firmware absolute XY)\nENTRY MODE : '+(s.entry_mode==='vertical'?'LIFT & VERTICAL ENTRY':'ENTRY / RETURN SLIT') ;
   const legacy=setup.legacy?'\n\nOLDER FILE: no origin or rod-material/size record. Continue only if its original calibrated G28 HOME center was X0/Y0, the bed reference was Z0, and the displayed geometry matches your actual setup. Material/size labels are unknown and are not used to heat this cold file.':'';
   if(epoch!==current)throw Error('Setup changed during file review.');
   const reservation=await post('/bridge/job/prepare',{filename:name,repeat_job:true});jobToken=reservation.job_token;reserved=true;
   const homeSeconds=Math.max(20,Math.min(300,typeof v3HomeXyzDurationSec==='function'?Number(v3HomeXyzDurationSec())||30:30));
   await post('/api/admin/foam-repeat/home',{home_requested:true,home_seconds:homeSeconds},jobToken);
   await wait(homeSeconds,'FOAM REPEAT — HOME XYZ SAFETY HOLD',current);
   if(epoch!==current)throw Error('Setup changed after HOME.');
   const recovery=await post('/api/admin/foam-repeat/position',{preparation_requested:true},jobToken);
   await wait(recovery.settle_seconds,'FOAM REPEAT — RECOVERING SAVED CENTER',current);
   if(!await ldmConfirm('Confirm HOME XYZ has physically completed.\n\nSecure the original tool, foam and jig. Verify the saved geometry and clear travel/cutting corridor.\n\n'+summary+legacy+'\n\nContinue only after a cold clearance check. The hotend should now be at Z'+(s.clearance_z+s.rod_length)+' mm, with XY still at the physical HOME center. CANCEL if HOME or the Z lift did not complete, or XY is at bottom-left.\n\nCONFIRM & REPEAT starts the existing SD file, which performs its own bottom-left approach.','FOAM REPEAT · VERIFY SETUP','CONFIRM & REPEAT','CANCEL'))throw Error('FOAM Repeat cancelled before SD start. No start request sent.');
   if(epoch!==current)throw Error('Setup changed before physical-position confirmation.');
   const accepted=await post('/api/admin/foam-repeat/confirm',{filename:name,home_confirmed:true,clearance_confirmed:true,position_confirmed:true,legacy_home_zero_confirmed:setup.legacy},jobToken);
   if(epoch!==current)throw Error('Setup changed before FOAM start.');
   token=accepted.token;selected=name;state('SAVED FOAM SETUP READY — EXISTING SD FILE · NO RE-UPLOAD');return {prepared:true};
  }catch(e){window.ldmPreparingFailed?.(e.message);token='';selected='';if(reserved)await post('/bridge/job/end-preparation',{},jobToken).catch(()=>{});throw e;}
  finally{busy=false;window.ldmFoamPendingRepeatReview=null;}
 };
})();
