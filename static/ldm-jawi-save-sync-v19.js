/* V19 contextual form persistence synchronizer. Authoring only. */
(function(){'use strict';
const $=id=>document.getElementById(id);
function selected(){const ch=Array.from($('glyphChar')?.value||'')[0];const form=$('ldmJawiForm')?.value||'isolated';const v=Math.max(1,Number($('ldmJawiVariant')?.value)||1);return ch?ch+'|'+form+(v===1?'':'|'+v):''}
function refresh(){if(!window.ldmJawiGlyphMode)return;const key=selected();if(!key)return;let library={};try{library=JSON.parse(localStorage.getItem('ldmJawiGlyphLibraryV1')||'{}')||{}}catch(e){return}
 if(typeof ldmJawiGlyphLibrary!=='undefined')Object.assign(ldmJawiGlyphLibrary,library);
 const record=library[key],saved=!!(record&&Array.isArray(record.strokes)&&record.strokes.length);
 const state=$('ldmJawiVariantStatus');if(state){const prefix=key.split('|').slice(0,2).join('|');const count=Object.keys(library).filter(k=>k===prefix||k.startsWith(prefix+'|')).length;state.textContent='Variant '+(Number($('ldmJawiVariant')?.value)||1)+' · '+(saved?'SAVED':'NOT SAVED')+' · '+count+' saved for this form'}
 const guide=$('ldmJawiGuideV15');if(guide){const ch=Array.from($('glyphChar')?.value||'')[0],f=$('ldmJawiForm')?.value;const two=new Set(Array.from('اأإآدذرزژوؤءةى'));const forms=two.has(ch)?['isolated','final']:['isolated','initial','medial','final'];const count=forms.filter(f=>library[ch+'|'+f]).length;guide.textContent=ch+' · '+f+' · Variant '+(Number($('ldmJawiVariant')?.value)||1)+' · '+(saved?'SAVED':'NOT SAVED')+' · '+count+'/'+forms.length+' base forms saved'}
 window.ldmJawiStatus?.();
}
window.ldmJawiRefreshV19=refresh;
function setup(){const studio=$('ldmJawiStudio');if(!studio||studio.dataset.v19Ready)return;studio.dataset.v19Ready='1';
 // Refresh after save, but never reload or discard the drawing.
 studio.addEventListener('click',e=>{if(e.target?.closest('button')?.textContent?.includes('SAVE'))queueMicrotask(refresh)});
 $('ldmJawiForm')?.addEventListener('change',()=>queueMicrotask(refresh));
 $('ldmJawiVariantHost')?.addEventListener('change',()=>queueMicrotask(refresh));
 $('ldmJawiPalette')?.addEventListener('click',()=>queueMicrotask(refresh));
 refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();