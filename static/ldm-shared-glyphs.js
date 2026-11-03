/* V9.55 shared Desktop glyphs. No machine commands or printer permission changes. */
(()=>{'use strict';
 const id=x=>document.getElementById(x),admin=()=>window.LDM_ACCESS?.local&&window.LDM_ACCESS?.admin;
 const remote=()=>!admin()&&window.LDM_ACCESS?.typewriter_lan===true;
 let busy=false,timer=0,published='',seen='',applied='',pending=null,wrapped=false,wasAdmin=false;
 function notice(text){let node=id('ldmSharedGlyphStatus');if(!node){const parent=id('fontSource')?.parentElement;if(!parent)return;node=document.createElement('p');node.id='ldmSharedGlyphStatus';node.className='tiny';node.setAttribute('role','status');parent.append(node);}node.textContent=text;}
 async function api(url,body){const r=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json','X-LDM-CSRF':window.LDM_ACCESS?.csrf||''},body:JSON.stringify(body)}:{cache:'no-store'});const v=await r.json();if(!r.ok||!v.success)throw Error(v.error||'Glyph sharing unavailable.');return v;}
 function apply(value){
  if(typeof glyphFont==='undefined'||typeof glyphMeta==='undefined')return false;
  const inFlight=window.ldmWriteLineState?.();
  if(inFlight?.pending||inFlight?.busy||applied&&id('ldmTypewriterText')?.value.trim())return false;
  glyphFont=JSON.parse(JSON.stringify(value.glyphs));glyphMeta=JSON.parse(JSON.stringify(value.meta||{}));
  if(id('fontName'))id('fontName').value=glyphMeta.name||'Desktop GLYPHs';
  if(id('fontSpacing'))id('fontSpacing').value=glyphMeta.spacing||1.18;
  // Remote browser's saved personal library is not overwritten by automatic sync.
  window.refreshGlyphList?.();window.renderTextObjects?.();
  document.dispatchEvent(new Event('ldm-shared-glyphs-updated'));
  applied=value.revision;notice('DESKTOP GLYPHs · '+(glyphMeta.name||'Custom font')+' · '+Object.keys(glyphFont).length+' characters');return true;
 }
 async function pull(){
  if(!remote()||busy)return;busy=true;
  try{
   if(pending&&apply(pending))pending=null;
   const value=await api('/api/glyphs/shared'+(seen?'?revision='+encodeURIComponent(seen):''));
   if(value.available&&value.revision!==seen){seen=value.revision;pending=value;if(apply(value))pending=null;}
   else if(!value.available&&!value.unchanged)notice('Desktop has not shared a saved GLYPH library yet.');
  }catch(error){notice('DESKTOP GLYPHs · '+error.message);}finally{busy=false;}
 }
 async function publish(force=false){
  if(!admin()||busy)return;busy=true;
  try{
   const raw=localStorage.getItem('a1GlyphFont'),metaRaw=localStorage.getItem('a1GlyphFontMeta')||'{}';
   if(!raw||!force&&raw==='{}'){
    const stored=await api('/api/admin/glyphs/shared');
    notice(stored.available?'Desktop GLYPH library is available to LAN TEXT users.':'Save custom GLYPHs here; they will appear automatically on LAN clients.');return;
   }
   const stamp=raw+'\n'+metaRaw;if(stamp===published)return;
   const value=await api('/api/admin/glyphs/shared',{glyphs:JSON.parse(raw),meta:JSON.parse(metaRaw)});
   published=stamp;notice('DESKTOP GLYPHs · shared with LAN TEXT users · '+Object.keys(value.glyphs||{}).length+' characters');
  }catch(error){notice('DESKTOP GLYPHs · '+error.message);}finally{busy=false;}
 }
 function queue(force=true){clearTimeout(timer);timer=setTimeout(()=>publish(force),300);}
 function hook(){
  if(!wrapped&&typeof window.refreshGlyphList==='function'){
   wrapped=true;const before=window.refreshGlyphList;
   window.refreshGlyphList=function(){const result=before.apply(this,arguments);if(admin())queue();return result;};
  }
  const button=id('ldmTypewriterCustom');if(button&&!button.dataset.sharedGlyphBound){button.dataset.sharedGlyphBound='1';const before=button.onclick;button.onclick=async function(event){if(remote())await pull();return before?.call(this,event);};}
 }
 window.ldmEnsureSharedGlyphs=pull;
 function boot(){hook();if(admin()){wasAdmin=true;queue(false);}else pull();}
 document.addEventListener('click',event=>{hook();if(admin()&&event.target.closest?.('#strokeFontCreator'))queue();});
 document.addEventListener('change',event=>{if(admin()&&event.target.id==='fontUpload')queue();});
 window.addEventListener('storage',event=>{if(admin()&&['a1GlyphFont','a1GlyphFontMeta'].includes(event.key))queue();});
 document.addEventListener('ldm-online-view',()=>{hook();if(admin())queue(false);else pull();});
 setInterval(()=>{hook();if(admin()&&!wasAdmin)queue(false);wasAdmin=!!admin();if(remote())pull();},3000);
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
