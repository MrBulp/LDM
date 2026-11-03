/* JAWI GLYPH STUDIO V2: floating authoring controls; authoring only. */
(function(){'use strict';
let dirty=false, snapshot='', activeKey='';
const $=id=>document.getElementById(id);
function strokes(){return JSON.stringify({done:window.glyphStrokes||[],current:window.glyphStroke||[]});}
// Top-level let glyphStrokes is accessible through same global lexical environment.
function currentStrokes(){try{return JSON.stringify({done:glyphStrokes,current:glyphStroke})}catch(_){return ''}}
function markClean(){snapshot=currentStrokes();dirty=false;activeKey=key();status()}
window.ldmJawiStrokeLoadedV13=markClean;
function key(){return (($('glyphChar')?.value||'ب').slice(0,1))+'|'+($('ldmJawiForm')?.value||'isolated')+(Number($('ldmJawiVariant')?.value||1)>1?'|'+$('ldmJawiVariant').value:'')}
function status(){const s=$('ldmJawiV2State');if(!s)return;let k=key();let g=null;try{g=JSON.parse(localStorage.getItem('ldmJawiGlyphLibraryV1')||'{}')[k]}catch(_){}s.textContent=(dirty?'UNSAVED CHANGES':'No unsaved changes')+' · '+(g?'SAVED':'NOT SAVED')+' · '+k;}
function hasUnsaved(){return dirty||currentStrokes()!==snapshot}
function guard(){if(!window.ldmJawiGlyphMode||!hasUnsaved())return true;return confirm('Jawi glyph has unsaved strokes. Discard changes and switch?')}
function save(){if(!window.ldmJawiGlyphMode)return;try{// V17: a key mismatch can arise from a character field edit without a reload.
 // Never destroy the user's unsaved drawing during SAVE. Persist under the visible selection.
 const requestedKey=key();
 if(!glyphStrokes.length&&!glyphStroke.length){alert('Draw at least one stroke before saving this Jawi form.');return;}
 glyphSaveCurrent();
 const saved=JSON.parse(localStorage.getItem('ldmJawiGlyphLibraryV1')||'{}')[requestedKey];
 if(!saved||!Array.isArray(saved.strokes)||!saved.strokes.length)throw Error('Storage verification failed: '+requestedKey);
 window.ldmJawiLoadedKeyV14=requestedKey;
 markClean();status();window.ldmJawiRefreshV19?.()}catch(e){alert('Unable to save Jawi form: '+e.message)}}
function clear(){if(!window.ldmJawiGlyphMode)return;if(!confirm('Clear the current drawing? Previously saved Jawi form stays in the library until you save again.'))return;glyphStrokes=[];glyphStroke=[];drawGlyphCanvas();dirty=true;status()}
function setup(){const panel=$('ldmJawiStudio');if(!panel)return;
if(panel.dataset.jawiV2Ready==='1')return;panel.dataset.jawiV2Ready='1';
const header=panel.firstElementChild;header.style.cssText='font-weight:700;margin-bottom:8px;cursor:move;touch-action:none;display:flex;align-items:center;justify-content:space-between;gap:8px';
header.classList.add('ldmJawiOriginalHeading');
const title=document.createElement('span');title.textContent='JAWI GLYPH STUDIO · CENTERLINE AUTHORING';header.textContent='';header.appendChild(title);
const float=document.createElement('button');float.type='button';float.innerHTML='&#x2922;';float.className='ldmJawiStudioToggle';float.title='Open floating Jawi editor';float.setAttribute('aria-label','Open floating Jawi editor');header.appendChild(float);
const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;position:sticky;top:0;z-index:5;padding:8px 0;background:var(--panel,var(--bg,#f4f4f4))';
const saveBtn=document.createElement('button');saveBtn.type='button';saveBtn.textContent='SAVE JAWI FORM';saveBtn.style.cssText='font-weight:700;min-height:38px;flex:1 1 135px';saveBtn.onclick=save;
const clearBtn=document.createElement('button');clearBtn.type='button';clearBtn.textContent='CLEAR CURRENT FORM';clearBtn.onclick=clear;clearBtn.style.cssText='min-height:38px;flex:1 1 135px';
actions.append(saveBtn,clearBtn);const state=document.createElement('div');state.id='ldmJawiV2State';state.className='tiny';state.style.margin='6px 0';
const controls=panel.querySelector('[data-jawi-controls]');panel.insertBefore(actions,panel.children[1]);panel.insertBefore(state,actions.nextSibling);
// V11: native LDM floating sections; no custom floating windows or duplicate headings.
// Keep the actual buttons and their event listeners, moving only control rows.
const studio=document.createElement('details');studio.id='ldmJawiNativeStudio';studio.className='toolbox main-toolbox';studio.open=true;
const studioSummary=document.createElement('summary');studioSummary.textContent='JAWI GLYPH STUDIO · CENTERLINE AUTHORING';
panel.before(studio);studio.append(studioSummary,panel);
header.remove(); // Native summary is the only heading.
panel.classList.remove('ldmJawiFloatWindow');panel.style.cssText='margin:0;padding:8px;border:0;background:transparent;color:inherit';
const draw=document.createElement('details');draw.id='ldmJawiNativeDraw';draw.className='toolbox main-toolbox';draw.open=true;
const drawSummary=document.createElement('summary');drawSummary.textContent='DRAW / EDIT';
draw.append(drawSummary);
const drawBody=document.createElement('div');drawBody.className='ldmJawiNativeDrawBody';draw.append(drawBody);
studio.after(draw);
const homes=new Map();
function findRows(){const root=$('strokeFontCreator');if(!root)return [];
 return ['.sfc-edit-actions','.sfc-character-actions','.sfc-file-actions'].map(sel=>root.querySelector(sel)).filter(Boolean);
}
function syncJawiDrawEdit(){const active=!!$('ldmJawiMode')?.checked;
 if(active){for(const row of findRows()){if(!homes.has(row)){const marker=document.createComment('Jawi DRAW EDIT original location');row.before(marker);homes.set(row,marker)}drawBody.append(row)}}
 else{for(const [row,marker] of homes)if(marker.isConnected)marker.after(row)}
 draw.hidden=!active;
 window.ldmFloatingSections?.refresh?.();
}
const css=document.createElement('style');css.id='ldmJawiNativeFloatV11';css.textContent=`
#ldmJawiNativeStudio,#ldmJawiNativeDraw{margin:8px 0}
#ldmJawiNativeStudio > summary,#ldmJawiNativeDraw > summary{cursor:pointer}
#ldmJawiNativeDraw .ldmJawiNativeDrawBody{padding:8px}
#ldmJawiNativeDraw .sfc-row{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
#ldmJawiNativeDraw .sfc-row button{flex:1 1 100px;min-width:0;white-space:normal}
#ldmJawiNativeStudio #ldmJawiStudio .ldmJawiStudioToggle{display:none!important}
`;document.head.append(css);
// Let the standard floating-sections module add the icon, drag handle,
// minimize, dock placeholder and DOCK button. No bespoke floating logic.
window.ldmFloatingSections?.refresh?.();
const origChoose=window.ldmJawiChoose;window.ldmJawiChoose=function(ch){if(!guard())return;origChoose(ch);markClean()};
const form=$('ldmJawiForm');let prevForm=form.value;form.addEventListener('change',e=>{if(!guard()){e.stopImmediatePropagation();form.value=prevForm;return}prevForm=form.value;},true);
const mode=$('ldmJawiMode');mode.addEventListener('change',e=>{if(!e.target.checked&&!guard()){e.stopImmediatePropagation();e.target.checked=true;return}setTimeout(markClean,0)},true);
const canvas=$('glyphCanvas');if(canvas){canvas.addEventListener('pointerup',()=>{if(!window.ldmJawiGlyphMode)return;setTimeout(()=>{dirty=currentStrokes()!==snapshot;status()},0)});}
// V18: one canonical save operation; never use a second key check after saving.
const originalSave=window.glyphSaveCurrent;
window.glyphSaveCurrent=function(){
 if(!window.ldmJawiGlyphMode)return originalSave.apply(this,arguments);
 const ch=Array.from($('glyphChar')?.value||'')[0];
 if(!ch)throw Error('Select a Jawi character first');
 const k=ldmJawiGlyphKey(ch);
 const strokes=glyphStrokes.map(st=>st.map(p=>[Number(p[0]),Number(p[1])]));
 if(glyphStroke.length)strokes.push(glyphStroke.map(p=>[Number(p[0]),Number(p[1])]));
 if(!strokes.length)throw Error('Draw at least one stroke before saving');
 if(strokes.some(st=>!st.length||st.some(p=>p.some(v=>!Number.isFinite(v)))))throw Error('Invalid stroke points');
 const record={strokes,advance:1,character:ch,form:ldmJawiForm(),variant:ldmJawiVariant(),entry:[0,0.5],exit:[1,0.5]};
 // Merge with the latest persisted library to avoid overwriting other forms.
 let library={};try{library=JSON.parse(localStorage.getItem('ldmJawiGlyphLibraryV1')||'{}')||{}}catch(e){throw Error('Cannot read Jawi storage: '+e.message)}
 library[k]=record;
 localStorage.setItem('ldmJawiGlyphLibraryV1',JSON.stringify(library));
 const verified=JSON.parse(localStorage.getItem('ldmJawiGlyphLibraryV1')||'{}')[k];
 if(!verified||JSON.stringify(verified.strokes)!==JSON.stringify(strokes))throw Error('Storage verification failed for '+k);
 ldmJawiGlyphLibrary=library;
 window.ldmJawiLoadedKeyV14=k;
 drawGlyphCanvas();markClean();ldmJawiStatus();window.ldmJawiRefreshV19?.();
 return record;
};
markClean();
mode.addEventListener('change',()=>setTimeout(syncJawiDrawEdit,0));
syncJawiDrawEdit();
}
function ensure(){setup()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure);else ensure();
const observer=new MutationObserver(()=>{if(document.getElementById('ldmJawiStudio')?.dataset.jawiV2Ready!=='1')ensure()});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();