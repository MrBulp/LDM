/* JAWI GLYPH STUDIO V6: per-character, per-form centerline variants. */
(function(){'use strict';
const $=id=>document.getElementById(id);
function current(){return Math.max(1,Number($('ldmJawiVariant')?.value)||1)}
function prefix(){return Array.from($('glyphChar')?.value||'ب')[0]+'|'+($('ldmJawiForm')?.value||'isolated')}
function variants(){const p=prefix();const found=new Set([1]);for(const k of Object.keys(ldmJawiGlyphLibrary||{})){if(k===p)found.add(1);else if(k.startsWith(p+'|')){const n=Number(k.slice(p.length+1));if(Number.isInteger(n)&&n>=2&&n<=99)found.add(n)}}return [...found].sort((a,b)=>a-b)}
function status(){const sel=$('ldmJawiVariant'),hint=$('ldmJawiVariantStatus');if(!sel||!hint)return;const n=current(),k=prefix()+(n===1?'':'|'+n);hint.textContent='Variant '+n+' · '+(ldmJawiGlyphLibrary[k]?'SAVED':'NOT SAVED')+' · '+variants().filter(x=>ldmJawiGlyphLibrary[prefix()+(x===1?'':'|'+x)]).length+' saved for this form';}
function refresh(keep){const sel=$('ldmJawiVariant');if(!sel)return;const old=keep||current();const ns=variants();if(!ns.includes(old))ns.push(old);ns.sort((a,b)=>a-b);sel.replaceChildren(...ns.map(n=>{const o=document.createElement('option');o.value=String(n);o.textContent='Variant '+n;return o}));sel.value=String(old);status();}
function guard(){const state=$('ldmJawiV2State')?.textContent||'';return !state.startsWith('UNSAVED CHANGES')||confirm('Unsaved Jawi strokes will be discarded. Continue?')}
function load(){loadNewGlyph();window.ldmJawiStrokeLoadedV13?.();ldmJawiStatus();status();}
function setup(){const host=$('ldmJawiVariantHost');if(!host||host.dataset.ready)return;host.dataset.ready='1';
const label=document.createElement('label');label.textContent='Handwriting variant';label.style.display='block';
const sel=document.createElement('select');sel.id='ldmJawiVariant';sel.style.width='100%';label.appendChild(sel);host.appendChild(label);
const row=document.createElement('div');row.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin:6px 0';
const add=document.createElement('button');add.type='button';add.textContent='+ ADD VARIANT';
const del=document.createElement('button');del.type='button';del.textContent='DELETE VARIANT';
row.append(add,del);host.appendChild(row);
const hint=document.createElement('div');hint.id='ldmJawiVariantStatus';hint.className='tiny';host.appendChild(hint);
sel.addEventListener('change',e=>{const next=Number(sel.value);if(!guard()){sel.value=String(sel.dataset.prev||1);return}sel.dataset.prev=String(next);load();});
add.addEventListener('click',()=>{if(!guard())return;const ns=variants(),n=Math.max(...ns)+1;if(n>99){alert('Maximum 99 variants per form');return}refresh(n);sel.dataset.prev=String(n);load();});
del.addEventListener('click',()=>{const n=current(),p=prefix(),k=p+(n===1?'':'|'+n);if(n===1){alert('Variant 1 is the default and cannot be deleted. Clear its strokes instead.');return}if(!guard())return;if(!confirm('Delete saved Variant '+n+' for '+p+'? This cannot be undone.'))return;delete ldmJawiGlyphLibrary[k];localStorage.setItem('ldmJawiGlyphLibraryV1',JSON.stringify(ldmJawiGlyphLibrary));refresh(1);sel.dataset.prev='1';load();});
const palette=$('ldmJawiPalette');palette?.addEventListener('click',()=>{sel.value='1';sel.dataset.prev='1';refresh(1)},true);
$('ldmJawiForm')?.addEventListener('change',()=>{sel.value='1';sel.dataset.prev='1';refresh(1);load();});
$('ldmJawiMode')?.addEventListener('change',()=>{sel.value='1';sel.dataset.prev='1';refresh(1)});
$('ldmJawiImport')?.addEventListener('change',()=>setTimeout(()=>refresh(current()),250));
$('ldmJawiStudio')?.addEventListener('click',e=>{if(e.target?.textContent?.trim()==='SAVE JAWI FORM')setTimeout(()=>{refresh(current());status()},0)});
refresh(1);sel.dataset.prev='1';}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
const mo=new MutationObserver(()=>{if($('ldmJawiVariantHost')&&!$('ldmJawiVariantHost').dataset.ready)setup()});mo.observe(document.documentElement,{subtree:true,childList:true});
})();