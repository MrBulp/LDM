/* V27.2 SVG stroke font bridge: loaded libraries use existing glyphFor -> TEXT layout/plot paths. */
(function(){
 const ids=['ldm_simple','ldm_hershey_roman','ldm_hershey_serif'];
 const libraries=Object.create(null);
 window.ldmStrokeFontLibrary=libraries;
 function load(id){if(!ids.includes(id))return Promise.resolve();if(libraries[id])return Promise.resolve();return fetch('static/fonts/'+id+'.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Font HTTP '+r.status);return r.json()}).then(j=>{libraries[id]=j;document.getElementById('fontSource')?.dispatchEvent(new Event('change',{bubbles:true}));}).catch(e=>console.error('[LDM font] '+id,e));}
 window.ldmLoadStrokeFont=load;
 document.addEventListener('DOMContentLoaded',()=>{const sel=document.getElementById('fontSource');if(!sel)return;sel.addEventListener('change',()=>load(sel.value));ids.forEach(load);});
})();