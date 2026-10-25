/* Entry navigation only; the established OK verifier still checks profile, live connection and access. */
(()=>{'use strict';let pending=false;const id=n=>document.getElementById(n),fresh=()=>id('v3GoldenConnectModal')?.classList.contains('ldm-fresh-entry');
const notice=text=>{const node=id('ldmEntryStageStatus24');if(node)node.textContent=text;};
document.addEventListener('ldm-entry-connection-pass26',()=>{if(pending||!fresh()||id('v3GoldenConnectModal').dataset.entryStage24!=='ready'||!window.LDM_ACCESS?.admin||!window.LDM_ACCESS?.local||window.V3_LDM_ENDING)return;const button=id('v3GoldenOkBtn');if(!button)return;pending=true;notice('Connection checks passed. Verifying printer and opening WORKSPACE…');button.disabled=false;button.click();});
document.addEventListener('ldm-printer-confirmation-failed26',e=>{if(!pending)return;pending=false;notice((e.detail?.message||'Printer verification failed.')+' Press CONNECT to retry.');});
document.addEventListener('ldm-printer-confirmed',async e=>{if(!pending||!e.detail?.fresh_entry)return;pending=false;if(window.V3_LDM_ENDING||!window.LDM_ACCESS?.admin||!window.LDM_ACCESS?.local)return;try{await window.v3PresentationOpenTab?.('artwork');}catch(error){notice(error.message||'WORKSPACE could not open.');}});
window.addEventListener('click',e=>{if(!fresh()||!e.target.closest?.('#v3GoldenCancelBtn'))return;e.preventDefault();e.stopImmediatePropagation();pending=false;Promise.resolve(window.ldmCancelFreshEntryHome?.()).catch(console.error);},true);
document.addEventListener('ldm-ending',()=>{pending=false;});
})();
