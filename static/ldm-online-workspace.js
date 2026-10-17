/* Reuse GUI.146's remote workspace. Never open printer/admin/setup scenes. */
(()=>{'use strict';
 document.documentElement.classList.add('ldm-online-workspace','ldm-artwork-guest');
 function appearance(){const panel=document.getElementById('ldmOnlineConnection');if(!panel)return;let bar=document.getElementById('ldmOnlineAppearance');if(!bar){bar=document.createElement('div');bar.id='ldmOnlineAppearance';bar.setAttribute('aria-label','Workspace appearance');panel.append(bar);}
  for(const key of ['ldmVisualThemeSelect','ldmDarkModeToggle','ldmLanguageSelect']){const node=document.getElementById(key);if(node&&node.parentElement!==bar){node.setAttribute('aria-label',key==='ldmVisualThemeSelect'?'Theme':key==='ldmLanguageSelect'?'Language':'Toggle dark mode');bar.append(node);}}
 }
 function boot(){const panel=document.getElementById('ldmOnlineConnection');if(panel){panel.open=false;const title=panel.querySelector('summary');if(title)title.textContent='LDM · ONLINE ARTWORK / CONNECT';}appearance();let queued=false;new MutationObserver(records=>{if(queued||!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.closest?.('svg,canvas,#ldmOnlineAppearance'))))return;queued=true;requestAnimationFrame(()=>{queued=false;appearance()});}).observe(document.body,{subtree:true,childList:true});
  // The inherited ldm-canvas.js opens ARTWORK at DOMContentLoaded and enforces sections.
  // Remove the HOME guide auto-start preference only for this website session.
  window.v3PresentationStart=()=>{};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueMicrotask(boot),{once:true});else boot();
})();
