/* Opt-in callback profiler. No callbacks, polling or machine guards are disabled. */
(()=>{'use strict';
 if(new URLSearchParams(location.search).get('ldm_profile')!=='1')return;
 const clock=()=>performance.now(), rows=new Map();let recording=false, started=0;
 const original={setTimeout:window.setTimeout.bind(window),setInterval:window.setInterval.bind(window),requestAnimationFrame:window.requestAnimationFrame.bind(window),MutationObserver:window.MutationObserver};
 function source(){return (new Error().stack||'').split('\n').slice(3,8).join('\n');}
 function wrap(fn,kind,origin){if(typeof fn!=='function')return fn;let row;
 return function(...args){if(!recording)return Reflect.apply(fn,this,args);
 if(!row||!rows.has(row.key)){const key=kind+' '+origin;row=rows.get(key);if(!row){row={key,kind,source:origin,calls:0,total_ms:0,max_ms:0,mutation_records:0};rows.set(key,row);}}
 const begin=clock();try{return Reflect.apply(fn,this,args);}finally{const elapsed=clock()-begin;row.calls++;row.total_ms+=elapsed;row.max_ms=Math.max(row.max_ms,elapsed);if(kind==='MutationObserver')row.mutation_records+=args[0]?.length||0;}
 };}
 for(const name of ['setTimeout','setInterval','requestAnimationFrame'])window[name]=function(fn,...args){return original[name](wrap(fn,name,source()),...args);};
 if(original.MutationObserver){window.MutationObserver=class extends original.MutationObserver{constructor(fn){super(wrap(fn,'MutationObserver',source()));}};}
 function state(){return {theme:localStorage.getItem('ldmVisualThemeV6'),dark:document.body.classList.contains('ldm-dark'),art_svg_elements:document.getElementById('art')?.querySelectorAll('*').length||0,visibility:document.visibilityState};}
 function download(report){const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LDM_GUI69_PROFILE_'+Date.now()+'.json';a.click();original.setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function mount(){const b=document.createElement('button');b.id='ldmProfileRecord';b.textContent='RECORD IDLE PROFILE (15s)';b.style.cssText='position:fixed;bottom:32px;left:12px;z-index:2147483647;font-size:13px';document.body.appendChild(b);
 b.addEventListener('click',()=>{if(recording)return;rows.clear();const before=state();b.disabled=true;b.textContent='RECORDING — leave untouched';started=clock();recording=true;
 original.setTimeout(()=>{recording=false;const report={version:'V6.GUI.79 diagnostic',duration_ms:clock()-started,before,after:state(),note:'Synchronous callback time only; nested callbacks may overlap. Browser CSS/layout/paint outside callbacks and async continuation time require Chrome Performance trace.',callbacks:[...rows.values()].sort((a,b)=>b.total_ms-a.total_ms)};b.disabled=false;b.textContent='RECORD IDLE PROFILE (15s)';download(report);},15000);
 });}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
