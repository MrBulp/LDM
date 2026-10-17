/* STEP 3 edits the existing vinyl depth; no separate output setting. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 function boot(){
   const input=$('v7MaterialCutDepth'),field=$('v7MaterialCutDepthField'),source=$('cutDepth'),job=$('v4MaterialJobType');
   if(!input||!field||!source||!job)return;
   function sync(){
     field.hidden=job.value!=='vinyl';
     field.style.display=field.hidden?'none':'';
     if(document.activeElement!==input)input.value=source.value;
   }
   input.addEventListener('input',()=>{
     if(!input.checkValidity()||input.value.trim()==='')return;
     source.value=input.value;
     const legacy=$('v3JobCutDepth');if(legacy)legacy.value=input.value;
     source.dispatchEvent(new Event('input',{bubbles:true}));
     source.dispatchEvent(new Event('change',{bubbles:true}));
     const check=$('v3QuickMaterialCheck');
     if(check?.checked){check.checked=false;check.dispatchEvent(new Event('change',{bubbles:true}));}
   });
   input.addEventListener('change',()=>{
     if(!input.checkValidity()||input.value.trim()===''){input.reportValidity();input.value=source.value;}
   });
   job.addEventListener('change',sync);
   source.addEventListener('input',sync);source.addEventListener('change',sync);
   sync();
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
