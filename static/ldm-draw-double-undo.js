/* GitHub DRAW only. Observe before palm filtering and legacy drawing listeners. */
(()=>{'use strict';let gesture=null,first=null,lastUndo=-Infinity;
const drawing=()=>document.querySelector('.v3ArtworkModeTabs [data-artmode="draw"].active')&&!['move','layerMove','erase'].includes(window.ldmDrawInteractionMode);
const eligible=e=>drawing()&&document.getElementById('art')?.contains(e.target)&&!e.target.closest?.('.ldmImgEditorHandle,.ldmImgRotateHandle,.ldmImgEditorRect')&&e.button<=0;
const stop=e=>{if(e.cancelable)e.preventDefault();e.stopImmediatePropagation()};
window.addEventListener('pointerdown',e=>{if(!eligible(e))return;if(gesture){gesture.moved=true;first=null;return;}const now=performance.now(),second=first&&now-first.at<=350&&Math.hypot(e.clientX-first.x,e.clientY-first.y)<=24&&first.type===e.pointerType;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,at:now,type:e.pointerType,moved:false,second,bookmark:second?first.bookmark:window.ldmDrawUndoBookmark?.()};if(second)stop(e);},{capture:true,passive:false});
window.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture.moved=true;if(gesture.second)stop(e);},{capture:true,passive:false});
window.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const g=gesture;gesture=null;const tap=!g.moved&&performance.now()-g.at<=250&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<=8;if(g.second){stop(e);first=null;if(tap&&g.bookmark){window.ldmDrawUndoFromBookmark?.(g.bookmark);lastUndo=performance.now();}return;}first=tap&&g.bookmark?{x:g.x,y:g.y,at:performance.now(),type:g.type,bookmark:g.bookmark}:null;},{capture:true,passive:false});
window.addEventListener('pointercancel',e=>{if(gesture?.id===e.pointerId){const second=gesture.second;gesture=null;first=null;if(second)stop(e);}},{capture:true,passive:false});
window.addEventListener('dblclick',e=>{if(!eligible({...e,button:0,target:e.target}))return;stop(e);if(performance.now()-lastUndo>500)window.ldmDrawUndoActiveLayer?.();first=null;},{capture:true,passive:false});
window.addEventListener('blur',()=>{gesture=null;first=null;});
})();
