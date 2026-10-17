/* Selectable appearance only: no navigation, editor, FTE or machine handlers. */
(()=>{'use strict';
 const key='ldmVisualThemeV6';
 let theme='v6';try{theme=localStorage.getItem(key)||'v6'}catch(_){}
 function apply(value){
  theme=value==='v5'?'v5':'v6';
  document.documentElement.classList.toggle('ldm-v6',theme==='v6');
  document.body.classList.toggle('ldm-v6',theme==='v6');
  const select=document.getElementById('ldmVisualThemeSelect');if(select)select.value=theme;
  try{localStorage.setItem(key,theme)}catch(_){}
 }
 function mount(){
  const host=document.querySelector('.ldmTopRight');if(!host)return;
  const select=document.createElement('select');select.id='ldmVisualThemeSelect';select.setAttribute('aria-label','Visual theme');select.title='Visual theme';
  for(const [value,label] of [['v6','V6 PLAIN'],['v5','V5 ORIGINAL']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option)}
  select.addEventListener('change',()=>apply(select.value));host.prepend(select);apply(theme);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
