/* V23: one Jawi canvas owner. No machine plotting. */
(()=>{'use strict';
const $=id=>document.getElementById(id), storage='ldmJawiGlyphLibraryV1';
const ch=()=>Array.from($('glyphChar')?.value||'ب')[0];
const form=()=> $('ldmJawiForm')?.value||'isolated';
const variant=()=>Math.max(1,Number($('ldmJawiVariant')?.value)||1);
const key=()=>ch()+'|'+form()+(variant()===1?'':'|'+variant());
let active='', clean='', switching=false;
function disk(){const o=JSON.parse(localStorage.getItem(storage)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}
function points(){return JSON.stringify({done:glyphStrokes,current:glyphStroke})}
function update(){if(!window.ldmJawiGlyphMode)return;const d=disk(),k=key(),saved=!!d[k],dirty=points()!==clean;
 const s=$('ldmJawiV2State');if(s)s.textContent=(dirty?'UNSAVED CHANGES':'No unsaved changes')+' · '+(saved?'SAVED':'NOT SAVED')+' · '+k;
 const v=$('ldmJawiVariantStatus');if(v)v.textContent='Variant '+variant()+' · '+(saved?'SAVED':'NOT SAVED')+' · '+Object.keys(d).filter(x=>x.startsWith(ch()+'|'+form())&&d[x]?.strokes?.length).length+' saved for this form';
 const progress=$('ldmJawiGuidedStatusV23');if(progress)progress.textContent=ch()+' · '+form()+' · Variant '+variant()+' · '+(saved?'SAVED':'NOT SAVED')+' · '+['isolated','initial','medial','final'].filter(f=>d[ch()+'|'+f]?.strokes?.length).length+'/4 base forms saved';
 ldmJawiGlyphLibrary=d;ldmJawiStatus();
}
function load(){if(!window.ldmJawiGlyphMode)return;switching=true;const d=disk(),k=key(),g=d[k];ldmJawiGlyphLibrary=d;
 glyphStrokes=(g?.strokes||[]).map(s=>s.map(p=>[Number(p[0]),Number(p[1])]));glyphStroke=[];active=k;window.ldmJawiLoadedKeyV14=k;drawGlyphCanvas();clean=points();switching=false;update();}
function save(){if(!window.ldmJawiGlyphMode)return false;if(active!==key()){alert('Selected Jawi form changed. Switch to that form again before saving.');return false}
 const strokes=glyphStrokes.map(s=>s.map(p=>[Number(p[0]),Number(p[1])]));if(glyphStroke.length)strokes.push(glyphStroke.map(p=>[Number(p[0]),Number(p[1])]));
 if(!strokes.length){alert('Draw a stroke before saving.');return false}
 if(strokes.some(s=>!s.length||s.some(p=>p.length!==2||p.some(n=>!Number.isFinite(n))))){alert('Invalid stroke coordinates');return false}
 const d=disk(),k=key();d[k]={strokes,advance:1,character:ch(),form:form(),variant:variant(),entry:[0,.5],exit:[1,.5]};localStorage.setItem(storage,JSON.stringify(d));if(JSON.stringify(disk()[k]?.strokes)!==JSON.stringify(strokes)){alert('Jawi save verification failed');return false}
 ldmJawiGlyphLibrary=d;clean=points();update();return true;
}
function chooseForm(next){if(!window.ldmJawiGlyphMode)return;const f=$('ldmJawiForm');if(f)f.value=next;const v=$('ldmJawiVariant');if(v)v.value='1';refreshVariants();load();window.ldmJawiContextV3?.update?.()}
function refreshVariants(){const sel=$('ldmJawiVariant');if(!sel)return;const d=disk(),p=ch()+'|'+form(),current=variant(),ns=new Set([1,current]);for(const k of Object.keys(d))if(k.startsWith(p+'|')){const n=Number(k.slice(p.length+1));if(Number.isInteger(n)&&n>=2&&n<=99)ns.add(n)}
 sel.replaceChildren(...[...ns].sort((a,b)=>a-b).map(n=>{const o=document.createElement('option');o.value=n;o.textContent='Variant '+n;return o}));sel.value=String(current)}
function switchGuard(){return points()===clean||confirm('Discard unsaved strokes for '+active+'?')}
function setup(){const panel=$('ldmJawiStudio'),host=$('ldmJawiVariantHost');if(!panel||!host||panel.dataset.v23)return;panel.dataset.v23='1';
 host.replaceChildren();const label=document.createElement('label');label.textContent='Handwriting variant';label.style.display='block';const sel=document.createElement('select');sel.id='ldmJawiVariant';sel.style.width='100%';label.append(sel);host.append(label);
 const row=document.createElement('div');row.style.cssText='display:flex;gap:6px;margin:6px 0';const add=document.createElement('button');add.textContent='+ ADD VARIANT';add.type='button';const del=document.createElement('button');del.textContent='DELETE VARIANT';del.type='button';row.append(add,del);host.append(row);
 const status=document.createElement('div');status.id='ldmJawiVariantStatus';host.append(status);refreshVariants();
 // Capture before legacy form and palette handlers, so only one load occurs.
 document.addEventListener('change',e=>{if(!window.ldmJawiGlyphMode)return;
 if(e.target?.id==='ldmJawiForm'){e.stopImmediatePropagation();if(!switchGuard()){e.target.value=active.split('|')[1]||'isolated';return}chooseForm(e.target.value)}
 else if(e.target?.id==='ldmJawiVariant'){e.stopImmediatePropagation();if(!switchGuard()){e.target.value=active.split('|')[2]||'1';return}load()}
 else if(e.target?.id==='ldmJawiMode'){queueMicrotask(()=>{refreshVariants();load()})}
 },true);
 document.addEventListener('change',e=>{if(window.ldmJawiGlyphMode&&e.target?.id==='glyphChar'){e.stopImmediatePropagation();if(!switchGuard()){e.target.value=active.split('|')[0];return}refreshVariants();load()}},true);
 document.addEventListener('click',e=>{const palette=e.target.closest?.('#ldmJawiPalette button');if(!palette||!window.ldmJawiGlyphMode)return;e.preventDefault();e.stopImmediatePropagation();if(!switchGuard())return;const input=$('glyphChar');input.value=palette.textContent.trim();$('ldmJawiForm').value='isolated';sel.value='1';refreshVariants();load()},true);
 add.onclick=()=>{if(!switchGuard())return;const d=disk(),ns=Object.keys(d).filter(k=>k.startsWith(ch()+'|'+form()+'|')).map(k=>Number(k.split('|')[2]));const n=Math.max(1,...ns,variant())+1;if(n>99)return alert('Maximum 99 variants');sel.add(new Option('Variant '+n,String(n)));sel.value=String(n);refreshVariants();load()};
 del.onclick=()=>{if(variant()===1)return alert('Variant 1 cannot be deleted');if(!confirm('Delete this saved variant?'))return;const d=disk();delete d[key()];localStorage.setItem(storage,JSON.stringify(d));sel.value='1';refreshVariants();load()};
 const actions=panel.querySelector('button');const saveButton=[...panel.querySelectorAll('button')].find(b=>b.textContent.trim()==='SAVE JAWI FORM');if(saveButton)saveButton.onclick=()=>{try{save()}catch(e){alert('Jawi save failed: '+e.message)}};
 const reload=[...panel.querySelectorAll('button')].find(b=>b.textContent.includes('RELOAD SAVED CENTERLINE'));if(reload)reload.onclick=load;
 const guided=document.createElement('div');guided.style.margin='8px 0';const gstatus=document.createElement('div');gstatus.id='ldmJawiGuidedStatusV23';const next=document.createElement('button');next.type='button';next.textContent='SAVE & NEXT VALID FORM';next.onclick=()=>{if(!save())return;const forms=['isolated','initial','medial','final'];chooseForm(forms[(forms.indexOf(form())+1)%4])};guided.append(gstatus,next);host.after(guided);
 const legacyDraw=window.drawGlyphCanvas;window.drawGlyphCanvas=function(){if(window.ldmJawiGlyphMode&&!switching&&active&&active!==key()){load();return}return legacyDraw.apply(this,arguments)};
 panel.addEventListener('click',e=>{if(!window.ldmJawiGlyphMode)return;const b=e.target.closest?.('button');if(!b)return;const label=b.textContent.trim();if(label==='SAVE JAWI FORM'){e.preventDefault();e.stopImmediatePropagation();save()}else if(label.includes('RELOAD SAVED CENTERLINE')){e.preventDefault();e.stopImmediatePropagation();load()}},true);
 const canvas=$('glyphCanvas');canvas?.addEventListener('pointerup',()=>setTimeout(update,0));
 // Late legacy handlers may still invoke loadNewGlyph. Redirect them to the single Jawi owner.
 const legacyLoad=window.loadNewGlyph;window.loadNewGlyph=function(){if(window.ldmJawiGlyphMode){refreshVariants();load();return}return legacyLoad.apply(this,arguments)};
 const legacyClear=window.clearGlyph;window.clearGlyph=function(){if(window.ldmJawiGlyphMode){glyphStrokes=[];glyphStroke=[];drawGlyphCanvas();update();return}return legacyClear.apply(this,arguments)};
 const legacySave=window.glyphSaveCurrent;window.glyphSaveCurrent=function(){if(window.ldmJawiGlyphMode)return save();return legacySave.apply(this,arguments)};
 const originalChoose=window.ldmJawiChoose;window.ldmJawiChoose=function(c){if(!window.ldmJawiGlyphMode)return originalChoose(c);if(!switchGuard())return;$('glyphChar').value=c;$('ldmJawiForm').value='isolated';sel.value='1';refreshVariants();load()};
 window.addEventListener('ldm-jawi-library-imported',()=>{refreshVariants();load()});
 const file=$('ldmJawiImport');file?.addEventListener('change',()=>setTimeout(()=>{refreshVariants();load()},200));
 if(window.ldmJawiGlyphMode)load();else clean=points();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();