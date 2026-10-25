/* GUI.84: non-modal live tools over a full-width tablet preview. Live tools stay mounted; the existing width button docks beside their toggle. */
(()=>{'use strict';
const id=n=>document.getElementById(n);let wanted=false,active=false,shown=false,queued=false,current=null,ended=false;
const shell=()=>document.querySelector('#v3StepShow.open .v3Direct-artwork');
function resize(){queueMicrotask(()=>window.dispatchEvent(new Event('resize')));}
function toggle(on){wanted=typeof on==='boolean'?on:!wanted;sync();if(shown)id('ldmFloatToolsClose84')?.focus();else if(!wanted)id('ldmFloatToolsToggle84')?.focus();}
function mount(scene){const left=scene.querySelector('.v3ArtworkPreviewCol'),right=scene.querySelector('.v3ArtworkToolsCol');if(!left||!right)return null;
 let bar=scene.querySelector('#ldmFloatToolsBar84');if(!bar){bar=document.createElement('div');bar.id='ldmFloatToolsBar84';bar.hidden=true;bar.innerHTML='<button type="button" id="ldmFloatToolsToggle84" aria-expanded="false">☰ OPEN TABS / TOOLS</button>';left.prepend(bar);bar.querySelector('#ldmFloatToolsToggle84').onclick=()=>toggle();}
 let header=right.querySelector(':scope > #ldmFloatToolsHeader84');if(!header){header=document.createElement('div');header.id='ldmFloatToolsHeader84';header.innerHTML='<b id="ldmFloatToolsTitle84">ARTWORK TOOLS</b><button type="button" id="ldmFloatToolsClose84">CLOSE ×</button>';right.prepend(header);header.querySelector('button').onclick=()=>toggle(false);}
 if(!right.id)right.id='ldmFloatingTools84';bar.querySelector('#ldmFloatToolsToggle84').setAttribute('aria-controls',right.id);return {scene,left,right,bar,header};
}
let widthHome=null;
function dockWidth(record,on){/* Preview controls remain inside the preview in every width mode. */}
function restore(record){dockWidth(record,false);if(!record)return;record.scene.classList.remove('ldmFloatToolsShell','ldmFloatToolsOpen');record.bar.hidden=true;record.right.removeAttribute('aria-hidden');record.right.removeAttribute('aria-labelledby');}
function sync(){queued=false;const scene=shell();if(current&&current.scene!==scene){restore(current);current=null;}const record=scene?mount(scene):null;if(record)current=record;
 const on=!ended&&!window.V3_LDM_ENDING&&!!record&&!!record.right.querySelector('.v3ArtworkModeTabs [data-artmode]')&&!!record.right.querySelector('.v3ArtworkModeBody')&&scene.classList.contains('ldmArtworkWide')&&window.innerWidth<=1366;const open=on&&wanted,changed=active!==on||shown!==open;active=on;shown=open;const overlay=id('v3StepShow');if(overlay.classList.contains('ldmFloatToolsMode')!==on)overlay.classList.toggle('ldmFloatToolsMode',on);
 if(record){dockWidth(record,on);const {right,bar,header}=record;for(const [cls,value]of [['ldmFloatToolsShell',on],['ldmFloatToolsOpen',open]])if(scene.classList.contains(cls)!==value)scene.classList.toggle(cls,value);if(bar.hidden!==!on)bar.hidden=!on;
  const b=bar.querySelector('#ldmFloatToolsToggle84'),label=open?'☰ HIDE TABS / TOOLS':'☰ OPEN TABS / TOOLS';if(b.textContent!==label)b.textContent=label;if(b.getAttribute('aria-expanded')!==String(open))b.setAttribute('aria-expanded',String(open));
  if(on){if(right.getAttribute('aria-hidden')!==String(!open))right.setAttribute('aria-hidden',String(!open));if(right.getAttribute('aria-labelledby')!=='ldmFloatToolsTitle84')right.setAttribute('aria-labelledby','ldmFloatToolsTitle84');}else{if(right.hasAttribute('aria-hidden'))right.removeAttribute('aria-hidden');if(right.hasAttribute('aria-labelledby'))right.removeAttribute('aria-labelledby');}
  const mode=scene.querySelector('.v3ArtworkModeTabs [data-artmode].active')?.textContent.trim()||'ARTWORK';const title='ARTWORK TOOLS · '+mode;if(header.querySelector('b').textContent!==title)header.querySelector('b').textContent=title;
  if(on){const vv=window.visualViewport,height=vv?.height||window.innerHeight,top=Math.max(8,Math.min(id('v3StepShow')?.querySelector('.v3ShowTop')?.getBoundingClientRect().bottom||72,height*.25)+8),maxHeight=Math.max(100,height-top-12);
  const t=Math.round(top)+'px',h=Math.round(maxHeight)+'px';if(scene.style.getPropertyValue('--ldm-float-top')!==t)scene.style.setProperty('--ldm-float-top',t);if(scene.style.getPropertyValue('--ldm-float-height')!==h)scene.style.setProperty('--ldm-float-height',h);}
 }
 if(changed)resize();
}
function schedule(){if(!queued){queued=true;queueMicrotask(sync);}}
window.ldmFloatingArtworkTools={refresh:sync,setOpen:toggle,isActive:()=>active,isOpen:()=>shown};
function boot(){const view=id('v3StepShow');if(!view)return;new MutationObserver(rs=>{if(rs.some(r=>r.type==='attributes'?r.target===view||r.target.matches?.('.v3Direct-artwork,.v3ArtworkModeTabs [data-artmode]'):[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches('.v3Direct-artwork,.v3ArtworkToolsCol,.v3ArtworkModeTabs,.v3ArtworkModeBody')||n.querySelector('.v3ArtworkToolsCol,.v3ArtworkModeTabs,.v3ArtworkModeBody')))))schedule();}).observe(view,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('resize',sync);window.addEventListener('orientationchange',schedule);window.visualViewport?.addEventListener('resize',schedule);document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.key!=='Escape'||!shown||[...document.querySelectorAll('dialog[open],#v3Modal.open,#ldmUnifiedModal.is-open,#ldmPlotSimPopup,#ldmFoamSimPopup,#ldmCncSimPopup')].some(n=>!n.hidden&&getComputedStyle(n).display!=='none')||document.body.classList.contains('ldm-glyph-text-mode'))return;e.preventDefault();e.stopImmediatePropagation();toggle(false);},true);document.addEventListener('ldm-ending',()=>{ended=true;wanted=false;restore(current);active=false;shown=false;view.classList.remove('ldmFloatToolsMode');});sync();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
