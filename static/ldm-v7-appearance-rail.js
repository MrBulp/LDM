/* Move the existing appearance controls, preserving their handlers and preferences. */
(()=>{'use strict';
function mount(){
 const rail=document.getElementById('ldmV7StepRail'),language=document.getElementById('ldmV7Language'),select=document.getElementById('ldmVisualThemeSelect'),dark=document.getElementById('ldmDarkModeToggle');
 if(!rail||!language||!select||!dark||document.getElementById('ldmV7Theme'))return;
 const button=document.createElement('button');button.id='ldmV7Theme';button.type='button';button.textContent='THEME';button.title='Choose visual theme';button.setAttribute('aria-label',button.title);button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','ldmV7ThemePopup');button.setAttribute('aria-haspopup','dialog');
 rail.insertBefore(button,language);rail.insertBefore(dark,language);dark.dataset.railIcon='true';
 function syncDark(){const on=document.body.classList.contains('ldm-dark');const icon=on?'☀':'☾',title=on?'Switch to light mode':'Switch to dark mode';if(dark.textContent!==icon)dark.textContent=icon;if(dark.title!==title)dark.title=title;if(dark.getAttribute('aria-label')!==title)dark.setAttribute('aria-label',title);if(dark.getAttribute('aria-pressed')!==String(on))dark.setAttribute('aria-pressed',String(on));}
 syncDark();new MutationObserver(syncDark).observe(document.body,{attributes:true,attributeFilter:['class']});
 const popup=document.createElement('div');popup.id='ldmV7ThemePopup';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Visual theme');
 const label=document.createElement('label');label.htmlFor=select.id;label.textContent='THEME';popup.append(label,select);document.body.appendChild(popup);
 if(typeof popup.showPopover==='function')popup.setAttribute('popover','auto');else popup.hidden=true;
 function close(){if(typeof popup.hidePopover==='function'){if(popup.matches(':popover-open'))popup.hidePopover();}else popup.hidden=true;button.setAttribute('aria-expanded','false');}
 function position(){const r=button.getBoundingClientRect(),width=Math.min(260,innerWidth-16);popup.style.width=width+'px';popup.style.left=Math.max(8,Math.min(r.right+8,innerWidth-width-8))+'px';popup.style.top=Math.max(8,Math.min(r.top,innerHeight-(popup.offsetHeight||80)-8))+'px';}
 button.onclick=()=>{if(button.getAttribute('aria-expanded')==='true'){close();return;}if(typeof popup.showPopover==='function')popup.showPopover();else popup.hidden=false;position();button.setAttribute('aria-expanded','true');select.focus();};
 select.addEventListener('change',()=>{close();button.focus();});popup.addEventListener('toggle',e=>button.setAttribute('aria-expanded',String(e.newState==='open')));
 document.addEventListener('pointerdown',e=>{if(!popup.contains(e.target)&&!button.contains(e.target))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});window.addEventListener('resize',()=>{if(button.getAttribute('aria-expanded')==='true')position();});
 const stage=document.getElementById('v3ShowStage'),overlay=document.getElementById('v3StepShow');if(stage)new MutationObserver(close).observe(stage,{childList:true});if(overlay)new MutationObserver(()=>{if(!overlay.classList.contains('open'))close();}).observe(overlay,{attributes:true,attributeFilter:['class']});
}
function start(){mount();new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
