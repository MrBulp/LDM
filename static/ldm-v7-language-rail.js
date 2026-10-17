/* STEP rail language shortcut; reuses the single existing localization engine. */
(()=>{'use strict';
const choices=[['en','English'],['zh','中文'],['fr','Français'],['ko','한국어'],['ja','日本語'],['ar','العربية'],['es','Español']];let button,popup,select;
function position(){if(!button||!popup)return;const rect=button.getBoundingClientRect(),width=Math.min(260,window.innerWidth-16),height=popup.offsetHeight||80;popup.style.width=width+'px';popup.style.left=Math.max(8,Math.min(rect.right+8,window.innerWidth-width-8))+'px';popup.style.top=Math.max(8,Math.min(rect.top,window.innerHeight-height-8))+'px';}
function close(){if(!popup)return;if(typeof popup.hidePopover==='function'){if(popup.matches(':popover-open'))popup.hidePopover();}else popup.hidden=true;button?.setAttribute('aria-expanded','false');}
function open(){const current=document.getElementById('ldmLanguageSelect')?.value||document.documentElement.lang||'en';select.value=choices.some(([code])=>code===current)?current:'en';if(typeof popup.showPopover==='function')popup.showPopover();else popup.hidden=false;position();button.setAttribute('aria-expanded','true');select.focus();}
function mount(){const rail=document.getElementById('ldmV7StepRail');if(!rail||document.getElementById('ldmV7Language'))return;
 button=document.createElement('button');button.id='ldmV7Language';button.type='button';button.title='Language';button.setAttribute('aria-label','Choose LDM language');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','ldmV7LanguagePopup');button.setAttribute('data-ldm-no-translate','');
 button.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></svg>';
 const exit=document.getElementById('ldmV7Exit');if(exit?.parentNode===rail)rail.insertBefore(button,exit);else rail.appendChild(button);
 popup=document.createElement('div');popup.id='ldmV7LanguagePopup';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','LDM language');popup.setAttribute('data-ldm-no-translate','');popup.innerHTML='<label for="ldmV7LanguageSelect">LANGUAGE</label><select id="ldmV7LanguageSelect" aria-label="LDM language"></select><button id="ldmV7LanguageEnable" type="button">ENABLE FULL TRANSLATION</button>';
 if(typeof popup.showPopover==='function')popup.setAttribute('popover','auto');else popup.hidden=true;
 select=popup.querySelector('select');for(const [code,name]of choices){const option=document.createElement('option');option.value=code;option.textContent=name;select.appendChild(option);}select.onchange=()=>{window.ldmSetLanguage?.(select.value,true);close();button.focus();};
 popup.querySelector('#ldmV7LanguageEnable').onclick=()=>{document.getElementById('ldmLanguageEnable')?.click();};
 document.body.appendChild(popup);button.onclick=()=>{if(button.getAttribute('aria-expanded')==='true')close();else open();};popup.addEventListener('toggle',event=>button.setAttribute('aria-expanded',String(event.newState==='open')));
 document.addEventListener('pointerdown',event=>{if(!popup.contains(event.target)&&!button.contains(event.target))close();});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){close();button.focus();}});window.addEventListener('resize',()=>{if(button.getAttribute('aria-expanded')==='true')position();});
 const overlay=document.getElementById('v3StepShow'),stage=document.getElementById('v3ShowStage');if(overlay)new MutationObserver(()=>{if(!overlay.classList.contains('open'))close();}).observe(overlay,{attributes:true,attributeFilter:['class']});if(stage)new MutationObserver(close).observe(stage,{childList:true});
}
function start(){mount();new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
