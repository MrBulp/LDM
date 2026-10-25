/* GUI.86: live-control folds and an isolated, viewport-sized temporary preview. */
(()=>{'use strict';
const id=n=>document.getElementById(n),key='ldmArtworkFolds82';let preferences={};try{preferences=JSON.parse(localStorage.getItem(key)||'{}');if(!preferences||typeof preferences!=='object')preferences={}}catch(_){}let queued=false,dialog=null,returnFocus=null,zoom=100;
function foldNodes(nodes,title,name,open=false){nodes=nodes.filter(Boolean);if(!nodes.length||id('ldmFold'+name))return;const parent=nodes[0].parentNode;if(nodes.some(n=>n.parentNode!==parent))return;const d=document.createElement('details');d.className='toolbox ldmArtworkFold';d.id='ldmFold'+name;d.dataset.foldKey=name;d.open=typeof preferences[name]==='boolean'?preferences[name]:open;const summary=document.createElement('summary');summary.textContent=title;d.append(summary);parent.insertBefore(d,nodes[0]);const body=document.createElement('div');body.className='ldmArtworkFoldBody';d.append(body);for(const n of nodes)body.append(n);d.addEventListener('toggle',()=>{preferences[name]=d.open;try{localStorage.setItem(key,JSON.stringify(preferences))}catch(_){}if(d.open)window.dispatchEvent(new Event('resize'));});return d;}
function fold(node,title,name,open=false){if(!node||id('ldmFold'+name))return;const d=foldNodes([node],title,name,open);if(d){d.dataset.foldTarget=node.id||'';if(!node.id)node.dataset.ldmFoldTarget=name;}return d;}
function range(first,stop){const nodes=[];for(let n=first;n&&n!==stop;n=n.nextElementSibling)nodes.push(n);return nodes;}

/* Keep the drawing engine's ancestor while exposing sibling sections for layout ordering. */
function drawSections(){const box=id('ldmDrawLayers');if(!box)return;if(!box.classList.contains('ldmDrawSections85'))box.classList.add('ldmDrawSections85');
 let main=id('ldmDrawLayerMain85');if(!main){main=document.createElement('div');main.id='ldmDrawLayerMain85';box.prepend(main);}
 const heading=box.querySelector(':scope > b');if(heading){heading.dataset.ldmDrawHeading85='';heading.hidden=true;main.prepend(heading);}
 const list=id('ldmDrawLayerList');if(list){list.dataset.ldmDrawActionsAnchor='';if(list.parentElement!==main)main.append(list);}
 const clear=id('ldmDrawClearBtn'),actions=id('ldmDrawAddLayer')?.parentElement;if(clear&&clear.parentElement!==main)main.append(clear);if(actions&&actions.parentElement!==main)main.append(actions);
 const active=id('ldmDrawActiveLayer');if(active&&active.parentElement!==main)main.append(active);for(const p of [...box.children].filter(n=>n.tagName==='P'&&!n.id))main.append(p);
 fold(main,'DRAW / WRITE LAYERS','DrawLayers',true);
 const selection=id('ldmDrawSelectionTools');if(selection?.parentElement===box)fold(selection,'SELECTION / MERGE / DELETE','DrawSelection');
 const importer=id('ldmDrawImportVector')?.closest('.ldmDrawLayerTools');if(importer?.parentElement===box){const created=fold(importer,'IMPORT VECTOR (SVG)','DrawImport');if(created)box.prepend(created);}
 const transform=id('ldmDrawLayerTransforms');if(transform&&transform.parentElement!==box)box.append(transform);if(transform&&!transform.classList.contains('ldmArtworkFold'))transform.classList.add('ldmArtworkFold');
 const pathNodes=['ldmExplodeDrawRow','ldmExplodeDrawStatus','ldmSplitDrawRow','ldmSplitDrawStatus'].map(id).filter(Boolean);if(pathNodes.length){let paths=id('ldmDrawPathOperations85');if(!paths){paths=document.createElement('div');paths.id='ldmDrawPathOperations85';box.append(paths);}for(const n of pathNodes)if(n.parentElement!==paths)paths.append(n);const created=fold(paths,'PATH OPERATIONS · EXPLODE / SPLIT','DrawPaths');if(created&&transform?.parentElement===box)box.insertBefore(created,transform);}
 const palm=id('ldmDrawPalmGuard');if(palm?.parentElement===box)fold(palm,'DRAWING INPUT / PALM GUARD','DrawInput');
}

function refreshFolds(){
 for(const n of [id('ldmVectorCleanPanel'),id('ldmVectorOffset')])if(n&&!n.classList.contains('ldmArtworkFold'))n.classList.add('ldmArtworkFold');
 const svg=id('scale')?.closest('.v3ArtworkPane')||id('svgMainSection'),manager=svg?.querySelector('.svgObjectManager');if(svg&&manager){
  // Keep independent path/offset tools at the same level as the layer section.
  let cursor=manager;for(const panel of [id('ldmVectorCleanPanel'),id('ldmVectorOffset')])if(panel){if(panel.parentNode===manager)cursor.after(panel);cursor=panel;}
  const file=id('file');if(file?.parentElement===svg)foldNodes([file,file.nextElementSibling],'IMPORT VECTOR / IMAGE','VectorImport');
  const scale=id('scale');if(scale?.parentElement===svg)foldNodes(range(scale.previousElementSibling,svg.querySelector(':scope > hr')),'TRANSFORM / POSITION','VectorTransform');
  fold(id('ldmVectorAlignControls'),'ALIGN SELECTED LAYERS','VectorAlign');fold(manager,'VECTOR LAYERS','VectorLayers',true);
 }
 const text=id('paraText')?.closest('.v3ArtworkPane')||id('textMainSection');if(text){
  const para=id('paraText'),mirror=id('textMirrorXBtn')?.closest('.row');if(para?.parentElement===text)foldNodes(range(para.previousElementSibling,mirror),'PARAGRAPH / FONT / SPACING','TextParagraph');
  if(mirror?.parentElement===text)foldNodes(range(mirror,text.querySelector('.ldmTextStageBar')||id('ldmGlyphTextControls')),'TRANSFORM / EDIT TEXT','TextTransform');
  fold(text.querySelector('.textObjectManager'),'TEXT LAYERS','TextLayers',true);fold(text.querySelector('.textQuickTools'),'GLYPH FONT EDITOR','TextGlyph');
 }
 drawSections();fold(id('ldmDrawSessionPanel'),'DRAWING SESSION','DrawSession');fold(document.querySelector('.ldmDrawModeTabs'),'DRAW / TRACE MODE','DrawMode');
 if(id('previewComposeTools')?.closest('#v3ArtworkDrawHost'))fold(id('previewComposeTools'),'IMAGE REFERENCE / DRAWING TOOLS','DrawImage');
 // Preserve each algorithm workspace root: external engines still replace its innerHTML.
 const ws=id('ldmAlgorithmWorkspace');fold(ws,'ALGORITHM CONTROLS','ArtControls');
 if(ws){const titles=new Map();[...ws.children].forEach((n,i)=>{if(!n.matches('.ldmAlgGrid,.ldmAlgDrop,.ldmPackControls'))return;const heading=n.querySelector(':scope > b,:scope > h3,:scope > h4');const title=(n.dataset.sectionTitle||heading?.textContent.trim()||(n.querySelector('input[type=file]')?'SOURCE IMAGE':n.matches('.ldmAlgGrid,.ldmPackControls')?'ALGORITHM SETTINGS':'INFORMATION')).toUpperCase();const count=(titles.get(title)||0)+1;titles.set(title,count);const created=fold(n,title+(count>1?' · '+count:''),'ArtGroup'+i);if(created&&heading){heading.dataset.ldmArtHeading86='';heading.hidden=true;}});} 
 const stl=document.querySelector('#v3ArtworkStlHost .ldmSTLPanel');if(stl){
  for(const [selector,title,name]of [['.ldmSTLSourceRow','IMPORT STL','StlSource'],['#ldmSTLTechInspector','TECHNICAL PREVIEW / INSPECTION','StlInspector'],['#ldmSTLSliceInspector','SLICE PREVIEW','StlSliceInspector'],['#ldmSTLTechControls','CAMERA / TECHNICAL VIEW','StlTech'],['#ldmSTLSliceControls','SLICE SETTINGS','StlSlice'],['#ldmSTLActivityControls','ACTIVITY SETTINGS','StlActivity'],['#ldmSTLUnfoldControls','UNFOLD SETTINGS','StlUnfold'],['.ldm3DPreviewSize','PREVIEW SIZE / DIMENSIONS','StlSize'],['.ldm3DFileManager','3D FILES / LAYERS','StlLayers']])fold(stl.querySelector(selector),title,name,name==='StlLayers');
  // Keep legacy slicing/export controls accessible without a long bottom panel.
  const exportBlock=id('ldmSTLNormalStatus')?.previousElementSibling;if(exportBlock?.parentElement===stl&&!exportBlock.matches('.ldmArtworkFold,button'))fold(exportBlock,'3D OUTPUT / EXPORT','StlOutput');
 }
 for(const d of document.querySelectorAll('.ldmArtworkFold[data-fold-target]')){const target=d.dataset.foldTarget?id(d.dataset.foldTarget):d.querySelector('[data-ldm-fold-target]');if(target){const hidden=target.hidden||target.style.display==='none';if(d.hidden!==hidden)d.hidden=hidden;}}
}
function modeSync(){const mode=document.querySelector('.v3ArtworkModeTabs [data-artmode].active')?.dataset.artmode||'vector';if(document.body.dataset.ldmArtMode82!==mode)document.body.dataset.ldmArtMode82=mode;}
function close(){if(!dialog?.open)return;dialog.close();dialog.querySelector('.ldmTempPreviewZoom').replaceChildren();if(returnFocus?.isConnected)returnFocus.focus();}
function setZoom(value){zoom=Math.max(25,Math.min(400,value));const body=dialog.querySelector('.ldmTempPreviewZoom');body.style.width=zoom+'%';body.style.height=zoom+'%';dialog.querySelector('[data-temp-zoom]').textContent=zoom+'%';}
function mountDialog(){if(dialog)return;dialog=document.createElement('dialog');dialog.id='ldmVectorTempFullscreen';dialog.className='ldmTempPreviewDialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','ldmVectorTempTitle');dialog.innerHTML='<header><b id="ldmVectorTempTitle">VECTOR · PATH TOOLS · TEMPORARY PREVIEW</b><div class="row"><button type="button" data-temp-minus aria-label="Zoom out">−</button><span data-temp-zoom>100%</span><button type="button" data-temp-plus aria-label="Zoom in">+</button><button type="button" data-temp-fit>FIT</button><button type="button" data-temp-close>CLOSE ×</button></div></header><p class="tiny" data-temp-status></p><div class="ldmTempPreviewViewport"><div class="ldmTempPreviewZoom"></div></div>';document.body.append(dialog);dialog.querySelector('[data-temp-close]').onclick=close;dialog.querySelector('[data-temp-minus]').onclick=()=>setZoom(zoom-25);dialog.querySelector('[data-temp-plus]').onclick=()=>setZoom(zoom+25);dialog.querySelector('[data-temp-fit]').onclick=()=>setZoom(100);dialog.addEventListener('cancel',e=>{e.preventDefault();close()});}
function popup(){const source=id('ldmVectorCleanPreview'),svg=source?.querySelector('svg');if(!svg||source.hidden)return;mountDialog();returnFocus=id('ldmVectorTempFullscreenBtn')||document.activeElement;const clone=svg.cloneNode(true);clone.removeAttribute('style');dialog.querySelector('.ldmTempPreviewZoom').replaceChildren(clone);dialog.querySelector('[data-temp-status]').textContent=id('ldmVectorCleanStatus')?.textContent||'Temporary preview — artwork is unchanged.';setZoom(100);if(!dialog.open)dialog.showModal();dialog.querySelector('[data-temp-close]').focus();}
function previewButton(){const panel=id('ldmVectorCleanPanel'),source=id('ldmVectorCleanPreview');if(!panel||!source)return;let b=id('ldmVectorTempFullscreenBtn');if(!b){b=document.createElement('button');b.type='button';b.id='ldmVectorTempFullscreenBtn';b.textContent='⛶ FULLSCREEN PREVIEW';b.onclick=popup;source.before(b);}const disabled=source.hidden||!source.querySelector('svg');if(b.disabled!==disabled)b.disabled=disabled;if(disabled)close();}
function refresh(){queued=false;refreshFolds();modeSync();previewButton();}
function schedule(){if(!queued){queued=true;queueMicrotask(refresh);}}
window.ldmArtworkCompactRefresh=refresh;window.ldmVectorTempFullscreen=popup;
function boot(){new MutationObserver(rs=>{if(rs.some(r=>!r.target.closest?.('svg,canvas,#ldmVectorTempFullscreen')&&!(r.type==='attributes'&&r.target===document.body)))schedule();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});new MutationObserver(schedule).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});document.addEventListener('click',schedule,true);document.addEventListener('ldm-ending',close);document.addEventListener('keydown',e=>{if(dialog?.open&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);refresh();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
