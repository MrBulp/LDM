/* GUI.40: one presentation owner; never change job locks or send commands. */
(()=>{'use strict';
 const id=n=>document.getElementById(n);let choice=null;
 const q=()=>id('v3QuickActiveJobStatus'),h=()=>id('v4SdQueueHandle');
 function attr(node,name,value){if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value)}
 function paint(closed){
   const panel=q(),handle=h();if(!panel||!handle)return;
   attr(document.body,'data-ldm-sd-drawer',closed?'closed':'open');
   if(panel.classList.contains('v4SdQueueCollapsed')!==closed)panel.classList.toggle('v4SdQueueCollapsed',closed);
   if(document.body.classList.contains('v4SdQueueIsCollapsed')!==closed)document.body.classList.toggle('v4SdQueueIsCollapsed',closed);
   attr(handle,'aria-expanded',closed?'false':'true');
   const arrow=handle.querySelector('span:last-child');if(arrow&&arrow.textContent!==(closed?'⌃':'⌄'))arrow.textContent=closed?'⌃':'⌄';
   if(!closed){
     const height=Math.max(72,Math.ceil(panel.getBoundingClientRect().height))+'px',style=document.documentElement.style;
     if(style.getPropertyValue('--v4-sd-queue-height')!==height)style.setProperty('--v4-sd-queue-height',height);
   }
 }
 function reset(){choice=null;document.body.removeAttribute('data-ldm-sd-drawer')}
 window.ldmSdQueueDrawerHasUserChoice=()=>choice!==null;
 window.ldmResetSdQueueDrawerChoice=reset;
 // Capture just this presentation control; leave administrator authentication in force.
 window.addEventListener('click',e=>{
   const handle=e.target.closest?.('#v4SdQueueHandle');
   if(handle){
     if(window.LDM_ACCESS&&!window.LDM_ACCESS.admin)return;
     if(!q())return;
     e.preventDefault();e.stopImmediatePropagation();
     choice=choice===null?!q().classList.contains('v4SdQueueCollapsed'):!choice;
     paint(choice);return;
   }
   const start=e.target.closest?.('#v3SvgSaveStartJobBtn,#startSelectedPlotBtn');
   if(start&&!start.disabled)reset();
 },true);
 function bind(){
   const panel=q(),handle=h();if(!panel||!handle)return;
   attr(handle,'title','V6.GUI.40 — toggle SD JOB QUEUE at any job stage');
   new MutationObserver(()=>{if(choice!==null)paint(choice)}).observe(panel,{attributes:true,attributeFilter:['class','style','hidden']});
   new ResizeObserver(()=>{if(choice===false)paint(false)}).observe(panel);
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
 const finish=window.v3MarkJobFinished;
 if(typeof finish==='function')window.v3MarkJobFinished=function(){const result=finish.apply(this,arguments);choice=null;paint(true);return result};
})();
