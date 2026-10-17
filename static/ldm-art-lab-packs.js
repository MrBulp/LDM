/* Local ART LAB packs: numerical output, existing preview and VECTOR handoff. */
(()=>{'use strict';
 const id=x=>document.getElementById(x), prefix='pack:', packs=new Map();
 let mounted=null, current=null, generation=0, scanning=false, attempted=false, cached=null;
 function status(text){const e=id('ldmPackStatus');if(e)e.textContent=text}
 function validate(result){
   const {width,height,paths}=result||{};
   if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>2500||height>2500)throw new Error('Invalid algorithm paper dimensions');
   if(!Array.isArray(paths)||!paths.length||paths.length>50000)throw new Error('Algorithm returned no valid drawing paths');
   let count=0;
   for(const stroke of paths){
     if(!Array.isArray(stroke)||stroke.length<2)throw new Error('Each stroke needs at least two points');
     for(const p of stroke){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p.some(v=>Math.abs(v)>10000))throw new Error('Algorithm returned an invalid point');if(++count>250000)throw new Error('Algorithm output exceeds 250000 points')}
   }
   return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" width="'+width+'mm" height="'+height+'mm">'+paths.map(st=>'<polyline fill="none" stroke="#000" stroke-width="0.35" points="'+st.map(p=>p.join(',')).join(' ')+'"/>').join('')+'</svg>';
 }
 window.ldmValidatePackPaths=validate;
 async function refresh(force=true){
   if(!id('ldmAlgorithmSelect')||scanning)return;scanning=true;
   const button=id('ldmRefreshAlgorithms');if(button)button.disabled=true;
   try{
     if(force||!attempted){
       attempted=true;
       const r=await fetch('/api/art-lab/packs',{cache:'no-store'});if(!r.ok)throw new Error('Algorithm folder unavailable');
       const data=await r.json();if(!Array.isArray(data.packs)||!Array.isArray(data.errors))throw new Error('Invalid algorithm folder response');
       cached=data;
     }
     if(!cached){status('Folder list unavailable — click REFRESH ALGORITHMS to retry');return;}
     const data=cached,select=id('ldmAlgorithmSelect');if(!select)return;
     const selected=select.value, prior=packs.get(selected.slice(prefix.length));
     select.querySelectorAll('[data-ldm-pack]').forEach(n=>n.remove());packs.clear();
     for(const pack of data.packs){packs.set(pack.id,pack);const option=document.createElement('option');option.value=prefix+pack.id;option.textContent=pack.name+' · '+pack.version;option.dataset.ldmPack='1';select.appendChild(option)}
     if(selected.startsWith(prefix)){
       const pack=packs.get(selected.slice(prefix.length));
       if(pack){select.value=selected;if(!current||prior?.revision!==pack.revision)show(pack)}
       else{select.value='createprint';window.ldmAlgorithmSelectChanged('createprint')}
     }
     status(data.packs.length+' folder algorithm(s) loaded'+(data.errors.length?' · '+data.errors.map(e=>e.folder+': '+e.error).join('; '):''));
   }catch(error){status(error.message)}finally{scanning=false;if(button)button.disabled=false;const active=id('ldmRefreshAlgorithms');if(active)active.disabled=false}
 }
 function show(pack){
   const host=id('ldmAlgorithmWorkspace');if(!host)return;
   const token=++generation;current={pack,svg:null,token};window.ldmAlgorithmResult=null;
   window.ldmLineDrawClearCanvasPreview?.();host.replaceChildren();
   const title=document.createElement('b');title.textContent=pack.name+' · '+pack.version;host.appendChild(title);
   const description=document.createElement('p');description.textContent=pack.description;host.appendChild(description);
   const controls=document.createElement('div');controls.className='ldmAlgGrid';host.appendChild(controls);
   const inputs=new Map();
   for(const control of pack.controls){const label=document.createElement('label');label.textContent=control.label;const input=document.createElement('input');input.type='number';for(const key of ['min','max','step'])input[key]=control[key];input.value=control.default;inputs.set(control.id,input);label.appendChild(input);controls.appendChild(label)}
   const generate=document.createElement('button');generate.type='button';generate.className='ldmAlgAction';generate.textContent='GENERATE PREVIEW';host.appendChild(generate);
   const message=document.createElement('p');message.setAttribute('role','status');host.appendChild(message);
   const send=document.createElement('button');send.type='button';send.className='ldmAlgAction';send.textContent='SEND TO CANVAS';send.disabled=true;send.onclick=sendToCanvas;host.appendChild(send);
   generate.onclick=async()=>{
     generate.disabled=true;send.disabled=true;current.svg=null;message.textContent='Generating…';
     try{
       const params={};for(const control of pack.controls){const value=Number(inputs.get(control.id).value);if(!Number.isFinite(value)||value<control.min||value>control.max)throw new Error('Check '+control.label);params[control.id]=value}
       const module=await (window.ldmOnlineImportModule?window.ldmOnlineImportModule(pack.module):import(pack.module));if(typeof module.generate!=='function')throw new Error('algorithm.js must export generate');
       const result=await module.generate({width:Number(id('paperW')?.value)||256,height:Number(id('paperH')?.value)||256,params});
       const svg=validate(result);if(current?.token!==token)return;
       if(!window.ldmLineDrawShowOnCanvas?.(svg))throw new Error('ART LAB preview unavailable');
       current.svg=svg;window.ldmAlgorithmResult=svg;send.disabled=false;message.textContent='READY — '+result.paths.length+' strokes';
     }catch(error){message.textContent=error.message}finally{generate.disabled=false}
   };
 }
 let sending=false;
 async function sendToCanvas(){
   if(sending||window.ldmCanvasImportBusy){status('CANVAS import is already in progress. Please wait.');return;}
   if(!current?.svg){status('Generate an algorithm preview first');return}
   const previous=window.ldmPendingSvgName, before=window.ldmSvgObjects?.length||0;
   sending=true;status('SENDING TO CANVAS…');
   try{
     svgText=current.svg;
     window.ldmPendingSvgName=current.pack.name+' '+String(before+1).padStart(3,'0');
     const added=await sendSvgToPreview();
     if(added===false||(window.ldmSvgObjects?.length||0)<=before)throw new Error(window.ldmUiSourceText?.(id('job'))||id('job')?.textContent||'Canvas import did not complete');
     document.querySelector('.v3ArtworkModeTabs [data-artmode="vector"]')?.click();
     window.ldmApplyWorkspaceIsolation?.('vector');window.ldmSandboxPreviewMode?.('vector');window.ldmRenderComposition?.();status('ADDED TO CANVAS');
   }catch(error){status(error.message)}finally{window.ldmPendingSvgName=previous;sending=false}
 }
 const original=window.ldmAlgorithmSelectChanged;
 window.ldmAlgorithmSelectChanged=function(value){if(value.startsWith(prefix)){const pack=packs.get(value.slice(prefix.length));if(pack)show(pack);return}generation++;current=null;return original?.apply(this,arguments)};
 function mount(){
   if(mounted?.isConnected)return;
   const select=id('ldmAlgorithmSelect');if(!select||select===mounted)return;mounted=select;current=null;generation++;
   const toolbar=document.createElement('div');toolbar.className='ldmPackToolbar';
   const button=document.createElement('button');button.id='ldmRefreshAlgorithms';button.type='button';button.textContent='REFRESH ALGORITHMS';button.onclick=()=>refresh(true);toolbar.appendChild(button);
   const info=document.createElement('span');info.id='ldmPackStatus';info.className='tiny';toolbar.appendChild(info);
   select.closest('label').insertAdjacentElement('afterend',toolbar);refresh(false);
 }
 document.addEventListener('click',e=>{if(!e.target.closest?.('#ldmLabSendCanvasBtn')||!id('ldmAlgorithmSelect')?.value.startsWith(prefix)||document.querySelector('.v3ArtworkModeTabs [data-artmode].active')?.dataset.artmode!=='algorithm')return;e.preventDefault();e.stopImmediatePropagation();sendToCanvas()},true);
 new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount();
})();
