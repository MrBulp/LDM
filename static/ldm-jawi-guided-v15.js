/* V15 guided Jawi authoring and saved-stroke verification. No machine output. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const TWO=new Set(Array.from('اأإآدذرزژوؤءةى'));
const FORMS=['isolated','initial','medial','final'];
let installed=false;
function char(){return Array.from($('glyphChar')?.value||'ب')[0]}
function form(){return $('ldmJawiForm')?.value||'isolated'}
function variant(){return Math.max(1,Number($('ldmJawiVariant')?.value)||1)}
function key(){return char()+'|'+form()+(variant()>1?'|'+variant():'')}
function validForms(){return TWO.has(char())?['isolated','final']:FORMS}
function saved(){return !!window.ldmJawiGlyphLibrary?.[key()] || !!(typeof ldmJawiGlyphLibrary!=='undefined'&&ldmJawiGlyphLibrary[key()])}
function refresh(){
 const forms=validForms(),select=$('ldmJawiForm');if(!select)return;
 for(const opt of select.options)opt.disabled=!forms.includes(opt.value);
 const state=$('ldmJawiGuideV15');if(state){const n=forms.filter(f=>{
 const k=char()+'|'+f;return !!(typeof ldmJawiGlyphLibrary!=='undefined'&&ldmJawiGlyphLibrary[k]);
 }).length;
 state.textContent=char()+' · '+form()+' · Variant '+variant()+' · '+(saved()?'SAVED':'NOT SAVED')+' · '+n+'/'+forms.length+' base forms saved';
 }
}
function saveNext(){
 if(!window.ldmJawiGlyphMode)return;
 if(typeof glyphSaveCurrent!=='function')return;
 try{
  if(!glyphStrokes.length&&!glyphStroke.length){alert('Draw at least one stroke before saving.');return;}
  glyphSaveCurrent();
  window.ldmJawiLoadedKeyV14=key();
  const k=key(), g=typeof ldmJawiGlyphLibrary!=='undefined'?ldmJawiGlyphLibrary[k]:null;
  const persisted=JSON.parse(localStorage.getItem('ldmJawiGlyphLibraryV1')||'{}')[k];
  if(!g||!persisted||!Array.isArray(persisted.strokes)||!persisted.strokes.length){alert('SAVE FAILED: '+k+' was not persisted. The current drawing has not been advanced.');return}
  const forms=validForms(),i=forms.indexOf(form());refresh();
  if(i<forms.length-1){$('ldmJawiForm').value=forms[i+1];$('ldmJawiForm').dispatchEvent(new Event('change',{bubbles:true}))}
  else alert('Saved '+k+'. This letter has no further valid contextual forms. Export JAWI GLYPHS to back up your work.');
 }catch(e){alert('Jawi save failed: '+e.message)}
}
function install(){
 const panel=$('ldmJawiStudio'),formSel=$('ldmJawiForm');if(!panel||!formSel||installed)return;installed=true;
 const bar=document.createElement('div');bar.id='ldmJawiGuideBarV15';bar.style.cssText='margin:8px 0;padding:8px;border:1px solid var(--border,#888);background:var(--panel,transparent);color:inherit';
 const info=document.createElement('div');info.id='ldmJawiGuideV15';info.style.marginBottom='6px';
 const btn=document.createElement('span');btn.className='tiny';btn.textContent='Use SAVE & NEXT VALID FORM in Jawi Studio to advance.';
 const note=document.createElement('div');note.className='tiny';note.textContent='Right-joining letters need only Isolated and Final. Saved strokes are checked in browser storage before advancing.';
 bar.append(info,btn,note);
 const anchor=$('ldmJawiVariantHost');anchor?.after(bar);
 // V16: selection loading is owned by the core glyph loader and variants module.
 // Do not schedule additional delayed reloads; they can overwrite newer strokes.
 formSel.addEventListener('change',refresh);
 $('ldmJawiVariantHost')?.addEventListener('change',refresh);
 $('ldmJawiPalette')?.addEventListener('click',()=>queueMicrotask(refresh));
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
new MutationObserver(()=>{if(!installed&&$('ldmJawiStudio'))install()}).observe(document.documentElement,{childList:true,subtree:true});
})();
