/* GitHub edition only. Existing login/composition/appearance controls stay mounted. */
(()=>{'use strict';let panel,button,previousFocus;
 function setOpen(open){if(!panel)return;if(panel.dataset.open===String(open))return;panel.open=true;panel.dataset.open=String(open);panel.setAttribute('aria-hidden',String(!open));button.setAttribute('aria-expanded',String(open));if(open){previousFocus=document.activeElement;const target=panel.querySelector('input:not(:disabled)')||panel.querySelector('button:not(:disabled)');target?.focus();}else (previousFocus?.isConnected?previousFocus:button).focus();}
 function mount(){panel=document.getElementById('ldmOnlineConnection');if(!panel||document.getElementById('ldmOnlineDrawerButton'))return;
  button=document.createElement('button');button.id='ldmOnlineDrawerButton';button.type='button';button.textContent='LOGIN';button.title='Online artwork — direct to Desktop';button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');button.onclick=()=>setOpen(panel.dataset.open!=='true');document.body.append(button);
  const header=document.createElement('div');header.className='ldmOnlineDrawerHeader';const title=document.createElement('strong');title.id='ldmOnlineDrawerTitle';title.textContent='ONLINE ARTWORK · PI INBOX';const close=document.createElement('button');close.type='button';close.className='ldmOnlineDrawerClose';close.textContent='✕';close.title='Close online artwork drawer';close.setAttribute('aria-label',close.title);close.onclick=()=>setOpen(false);header.append(title,close);panel.prepend(header);panel.setAttribute('role','region');panel.setAttribute('aria-labelledby',title.id);panel.open=true;panel.dataset.open='false';panel.setAttribute('aria-hidden','true');
  function revealQR(){if(panel.dataset.qrPrefilled!=='true')return;setOpen(true);panel.querySelector('[name=username]')?.focus();}
  revealQR();document.addEventListener('ldm-online-qr-password',revealQR);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.dataset.open==='true'){e.preventDefault();e.stopImmediatePropagation();setOpen(false);}},true);
 }
 function start(){mount();if(!panel){const observer=new MutationObserver(()=>{mount();if(panel)observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueMicrotask(start),{once:true});else start();
})();
