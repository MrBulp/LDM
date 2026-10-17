/* GUI.41: per-file canvas visibility, shared by preview and output geometry. */
(()=>{'use strict';
 const objects=()=>window.ldmSvgObjects||[];
 const transform=window.ldmTransformPaths,render=window.ldmRenderComposition,list=window.ldmRefreshSvgList;
 if(typeof transform!=='function'||typeof render!=='function'||typeof list!=='function')return;
 window.ldmTransformPaths=function(o){return o?.visible===false?[]:transform.apply(this,arguments)};
 window.ldmRenderComposition=function(){
   const result=render.apply(this,arguments);
   document.querySelectorAll('#art .ldmMultiSvg[data-svg-index]').forEach(g=>{if(objects()[Number(g.dataset.svgIndex)]?.visible===false)g.remove()});
   return result;
 };
 window.ldmToggleSvgVisibility=function(i){
   const o=objects()[i];if(!o)return;
   window.ldmSnapshot?.();o.visible=o.visible===false;
   if(typeof FTE!=='undefined')FTE.built=false;
   document.getElementById('svgObjectList')?.dispatchEvent(new Event('input',{bubbles:true}));
   window.ldmRefreshSvgList();window.ldmRenderComposition();
 };
 const eye='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
 window.ldmRefreshSvgList=function(){
   const result=list.apply(this,arguments),box=document.getElementById('svgObjectList');if(!box)return result;
   box.querySelectorAll('.textObjectRow').forEach((row,i)=>{
     const o=objects()[i];if(!o)return;const on=o.visible!==false;
     const button=document.createElement('button');button.type='button';button.className='ldmFileVisibility';
     button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',(on?'Hide ':'Show ')+(o.name||'file')+' on CANVAS');
     button.title=(on?'ON — hide':'OFF — show')+' on CANVAS';
     button.innerHTML=eye+(on?'':'<path d="m3 3 18 18"/>')+'</svg>';
     button.onclick=e=>{e.preventDefault();e.stopPropagation();window.ldmToggleSvgVisibility(i)};
     row.insertBefore(button,row.querySelector('.textObjectDelete'));
   });return result;
 };
 window.ldmRefreshSvgList();
})();
