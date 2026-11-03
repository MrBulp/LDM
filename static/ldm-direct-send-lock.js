/* Direct ownership presentation gate. Server guards remain authoritative. */
(()=>{'use strict';
const selector='#v3SvgSaveStartJobBtn,#startSelectedPlotBtn,#v3Step10MainBtn,#v3RepeatChooseBtn,#sdPlotFiles',held=new Map();let previous=false,queued=false;
const locked=()=>!!window.ldmDirectSessionOwnsMachine?.();
const reason='DIRECT SESSION ACTIVE — End Direct Typewriter / Drawing before sending another job. Interrupted sessions require recovery first.';
function sync(){queued=false;const on=locked();
 for(const b of document.querySelectorAll(selector)){if(on){if(!held.has(b))held.set(b,{disabled:b.disabled,title:b.getAttribute('title')});if(!b.disabled)b.disabled=true;if(b.getAttribute('aria-disabled')!=='true')b.setAttribute('aria-disabled','true');if(b.title!==reason)b.title=reason;}else if(held.has(b)){const old=held.get(b);b.disabled=old.disabled;b.removeAttribute('aria-disabled');if(old.title===null)b.removeAttribute('title');else b.title=old.title;held.delete(b);}}
 const button=document.getElementById('v3SvgSaveStartJobBtn');let note=document.getElementById('ldmDirectSendLock75');if(button&&!note){note=document.createElement('p');note.id='ldmDirectSendLock75';note.className='tiny';note.setAttribute('role','status');note.textContent=reason;note.style.cssText='padding:8px;border:1px solid var(--bp-line,var(--v3-line,#c8d0d4));border-radius:var(--bp-radius,9px);color:var(--bp-text,inherit);background:var(--bp-panel,transparent)';button.after(note);}if(note&&note.hidden===on)note.hidden=!on;
 if(previous&&!on){previous=false;window.v3SyncSvgSaveStartJobLock?.();window.v3SyncSdFilesActiveJobLock?.();window.v3SyncQuickActiveJobStatus?.();}previous=on;
}
function schedule(){if(!queued){queued=true;queueMicrotask(sync);}}
for(const event of ['click','dblclick','keydown','pointerdown'])window.addEventListener(event,e=>{if(!locked())return;const direct=e.target.closest?.(selector),repeat=event==='dblclick'&&e.target.closest?.('#sdPlotFiles');if(!direct&&!repeat)return;e.preventDefault();e.stopImmediatePropagation();schedule();},true);
function boot(){for(const name of ['ldmConfirmSendBegin','ldmRepeatFilesBegin','v3SvgSaveStartJob','startSelectedProject']){const fn=window[name];if(typeof fn==='function')window[name]=function(...args){if(locked()){schedule();return false;}return fn.apply(this,args);};}new MutationObserver(rs=>{if(rs.some(r=>r.type==='childList'?[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.(selector)||n.querySelector?.(selector))):r.target.matches?.(selector)))schedule();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});document.addEventListener('ldm-direct-ownership-change',schedule);sync();}
window.ldmDirectSendLock={sync,locked};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
