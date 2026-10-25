/* GUI.53: opt-in, SD-only VECTOR file boundaries. */
(()=>{'use strict';
 const palette=['#e53935','#1976d2','#43a047','#8e24aa','#fb8c00','#00838f','#c2185b','#795548'];
 const colour=(o,i)=>/^#[0-9a-f]{6}$/i.test(o.lineColour||'')?o.lineColour:(o.lineColour=palette[i%palette.length]);
 window.ldmVectorLayerColour=colour;
 window.ldmVectorColourEnabled=false;
 window.ldmSetVectorColour=function(on){window.ldmVectorColourEnabled=!!on;if(typeof FTE!=='undefined')FTE.built=false};
 window.ldmBuildVectorColourPlan=function(){
  window.ldmSnapshot?.();const files=(window.ldmSvgObjects||[]).filter(o=>o.visible!==false),paths=[],starts=new Map();
  for(const o of files){let pp=window.ldmTransformPaths(o);if(window.ldmClipPathsToPaper)pp=window.ldmClipPathsToPaper(pp);pp=pp.filter(p=>p.length>1);if(typeof fteS==='function'){const tol=Math.max(0,Number(document.getElementById('fteTol')?.value||0));pp=pp.map(p=>fteS(p,tol)).filter(p=>p.length>1)}if(!pp.length)continue;
   const name=String((o.name||'VECTOR')+' '+colour(o,(window.ldmSvgObjects||[]).indexOf(o))).replace(/[^a-zA-Z0-9 ._-]/g,' ').slice(0,70);starts.set(paths.length,name);for(const p of pp)paths.push(p);
  }return {paths,starts};
 };
 window.ldmVectorColourHoldSeconds=function(){const input=document.getElementById('ldmVectorHoldSeconds'),n=Number(input?input.value:60);if(!Number.isInteger(n)||n<1||n>600)throw Error('VECTOR timed hold must be whole seconds from 1 to 600.');return n;};
 window.ldmVectorColourPause=function(lines,name,lift,zf,alreadyUp){if(!alreadyUp)lines.push('G91',`G1 Z${lift.toFixed(3)} F${zf}`,'M400');lines.push('; LDM COLOUR CHANGE - NEXT '+name,'M400','M17','M1006 S1','M1006 A0 B0 L45 C72 D8 M100 E72 F8 N100','M1006 W','M400','G4 P'+(window.ldmVectorColourHoldSeconds()*1000),'G91');};
 const render=window.ldmRenderComposition;
 window.ldmRenderComposition=function(){const r=render?.apply(this,arguments);document.querySelectorAll('#art .ldmMultiSvg[data-svg-index]').forEach(g=>{const i=Number(g.dataset.svgIndex),o=window.ldmSvgObjects?.[i];if(!o)return;const value=colour(o,i);for(const p of g.children){if(['polyline','path'].includes(p.tagName?.toLowerCase())){p.setAttribute('stroke',value);p.style.setProperty('stroke',value,'important')}}});return r};
 const refresh=window.ldmRefreshSvgList;
 function paintName(button,value){const n=parseInt(value.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;button.style.setProperty('background-color',value,'important');button.style.setProperty('color',(.2126*r+.7152*g+.0722*b)>145?'#111111':'#ffffff','important')}

 let menu=null;
 function closeColourMenu(){if(menu){menu.remove();menu=null}}
 window.ldmCloseLayerColourMenu=closeColourMenu;
 function openColourMenu(event,pick,object,input,onApply){
  closeColourMenu();menu=document.createElement('div');menu.className='ldmVectorColourMenu';menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Vector line colour');
  Object.assign(menu.style,{position:'fixed',zIndex:'2147483647',padding:'8px',border:'1px solid currentColor',background:'var(--ldm-colour-menu-bg, #f5f5f5)',color:'var(--ldm-colour-menu-fg, #222)',boxSizing:'border-box',width:'220px',maxWidth:'calc(100vw - 16px)'});
  const apply=value=>{if(object.locked){closeColourMenu();return;}if(!/^#[0-9a-f]{6}$/i.test(value))return;input.value=value;object.lineColour=value;paintName(pick,value);if(onApply)onApply(value);else{window.ldmRenderComposition();if(typeof FTE!=='undefined')FTE.built=false;}closeColourMenu();pick.focus()};
  const swatches=document.createElement('div');Object.assign(swatches.style,{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'});
  for(const value of [...palette,'#000000','#ffffff','#ffff00','#00ff00']){const b=document.createElement('button');b.type='button';b.title=value;b.setAttribute('aria-label','Choose '+value);Object.assign(b.style,{background:value,color:value,padding:'0',height:'28px',minHeight:'28px',border:'1px solid #888'});b.style.setProperty('background',value,'important');b.style.setProperty('background-color',value,'important');b.style.setProperty('background-image','none','important');b.style.setProperty('display','block','important');b.style.setProperty('min-width','0','important');b.style.setProperty('padding','0','important');b.style.setProperty('height','28px','important');b.style.setProperty('min-height','28px','important');b.textContent=' ';b.addEventListener('click',()=>apply(value));swatches.appendChild(b)}
  const hex=document.createElement('input');hex.type='text';hex.value=input.value;hex.setAttribute('aria-label','Custom colour hex code');hex.maxLength=7;Object.assign(hex.style,{width:'100%',boxSizing:'border-box',marginTop:'6px'});hex.addEventListener('change',()=>apply(hex.value));hex.addEventListener('keydown',e=>{if(e.key==='Enter')apply(hex.value)});
  menu.append(swatches,hex);document.body.appendChild(menu);
  const rect=pick.getBoundingClientRect(),mouse=event.detail!==0&&Number.isFinite(event.clientX),x=mouse?event.clientX:rect.left+rect.width/2,y=mouse?event.clientY:rect.top;
  const bounds=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(innerWidth-bounds.width-8,x-bounds.width/2))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-bounds.height-8,y-bounds.height-12))+'px';
  hex.focus();
 }
 window.ldmOpenLayerColourMenu=(event,pick,value,onApply)=>{const input=document.createElement('input');input.value=value;openColourMenu(event,pick,{lineColour:value},input,onApply);return menu;};
 document.addEventListener?.('pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest('.textObjectPick'))closeColourMenu()},true);
 document.addEventListener?.('keydown',e=>{if(e.key==='Escape')closeColourMenu()});
 window.addEventListener?.('resize',closeColourMenu);document.addEventListener?.('scroll',closeColourMenu,true);
 window.ldmRefreshSvgList=function(){const r=refresh.apply(this,arguments),box=document.getElementById('svgObjectList');if(!box)return r;box.querySelectorAll('.textObjectRow').forEach((row,i)=>{const o=window.ldmSvgObjects?.[i],pick=row.querySelector('.textObjectPick');if(!o||!pick)return;const input=document.createElement('input');input.type='color';input.id='ldmVectorColourHidden'+i;input.hidden=true;input.tabIndex=-1;input.setAttribute('aria-hidden','true');input.value=colour(o,i);paintName(pick,input.value);pick.title='Select file and choose line colour';const select=pick.onclick;pick.onclick=e=>{select?.call(pick,e);if(!o.locked)openColourMenu(e,pick,o,input)};input.oninput=()=>{if(o.locked)return;o.lineColour=input.value;paintName(pick,input.value);window.ldmRenderComposition();if(typeof FTE!=='undefined')FTE.built=false};row.appendChild(input)});return r};
 window.ldmRefreshSvgList?.();window.ldmRenderComposition?.();
})();
