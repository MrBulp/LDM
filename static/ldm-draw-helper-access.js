/* Remote helper visibility is presentation policy, not a machine authorization gate. */
(()=>{'use strict';let queued=false,savedA4=null;
function sync(){const a=window.LDM_ACCESS||{},remote=!a.local&&!a.admin,allow=!remote||a.draw_helpers?.a4!==false,draw=!!document.querySelector('.v3ArtworkModeTabs [data-artmode="draw"].active'),input=document.getElementById('showA4Boundary');
 if(input){const label=input.closest('label'),hide=draw&&!allow;if(label&&label.hidden!==hide)label.hidden=hide;if(hide){if(savedA4===null)savedA4=input.checked;if(input.checked){input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));}}else if(savedA4!==null){input.checked=savedA4;savedA4=null;input.dispatchEvent(new Event('change',{bubbles:true}));}}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
function boot(){schedule();document.addEventListener('ldm-draw-helper-access',schedule);document.addEventListener('ldm-online-view',schedule);document.addEventListener('click',schedule);document.addEventListener('change',schedule);new MutationObserver(rs=>{if(rs.some(r=>!r.target.closest?.('svg,canvas')))schedule();}).observe(document.body,{subtree:true,childList:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
