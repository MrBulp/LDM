(()=>{'use strict';let confirming=false,validatedClick=false;
window.ldmOpenBambuPrintConnection=function(){
 const modal=document.getElementById('v3GoldenConnectModal');if(!modal)return;
 window.v3GoldenEnsureConnected?.();modal.classList.add('is-open');window.v3GoldenSyncConsole?.();
 const title=modal.querySelector('.gc-title');if(title)title.textContent='CONNECT TO BAMBU PRINTER';modal.setAttribute('aria-label','Connect to Bambu printer');
 let box=document.getElementById('ldmPrintConnectionModel');if(!box){box=document.createElement('div');box.id='ldmPrintConnectionModel';box.innerHTML='<label>PRINTER MODEL<select id="ldmPrintConnectModel"><option value="a1">A1</option><option value="a1mini">A1 mini</option><option value="p1s">P1S · sliced 3D printing only</option></select></label><p class="tiny" id="ldmPrintConnectionMessage">Select the actual connected printer model. Connect using the fields below, then press OK to confirm.</p>';modal.querySelector('.gc-head').after(box);}
 box.hidden=false;document.getElementById('ldmPrintConnectModel').value=document.getElementById('ldmPrintModel')?.value||'a1';
};
document.addEventListener('click',async event=>{
 const button=event.target.closest?.('#v3GoldenOkBtn'),box=document.getElementById('ldmPrintConnectionModel');if(!button||!box||box.hidden||validatedClick)return;
 event.preventDefault();event.stopImmediatePropagation();if(confirming)return;confirming=true;button.disabled=true;
 const message=document.getElementById('ldmPrintConnectionMessage'),model=document.getElementById('ldmPrintConnectModel').value;message.textContent='CONFIRMING CONNECTED PRINTER…';
 try{const response=await fetch('/api/admin/sliced-print/machine',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,confirmed:true})}),data=await response.json();if(!response.ok)throw Error(data.error||'Printer confirmation failed.');if(document.getElementById('ldmPrintConnectModel').value!==model)throw Error('Model changed during confirmation. Press OK again.');const select=document.getElementById('ldmPrintModel');if(select){select.value=model;select.dispatchEvent(new Event('change'));}message.textContent='CONNECTED PRINTER MODEL CONFIRMED · '+model.toUpperCase();const hidden=document.getElementById('v3GoldenExperiencedCheck');if(hidden)hidden.checked=true;const finish=window.ldmCompletePrinterConnection;if(typeof finish!=='function')throw Error('Connection completion is unavailable. Reload LDM and try again.');if(!await finish())throw Error('Live printer connection changed. Connect again, then press OK.');document.dispatchEvent(new Event('ldm-printer-confirmed'));button.disabled=false;
 }catch(error){message.textContent=error.message;document.dispatchEvent(new CustomEvent('ldm-printer-confirmation-failed26',{detail:{message:error.message}}));}finally{confirming=false;window.v3GoldenSyncConsole?.();}
},true);
document.addEventListener('click',event=>{const box=document.getElementById('ldmPrintConnectionModel');if(box&&!event.target.closest('#v3GoldenConnectModal')&&!document.querySelector('#v3StepShow.open .v3Direct-slicedfiles')){box.hidden=true;const title=document.querySelector('#v3GoldenConnectModal .gc-title');if(title)title.textContent='CONNECT MACHINE FIRST';}},true);
})();
