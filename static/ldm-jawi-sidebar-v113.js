/* V113 JAWI-only sidebar placement. No shared LDM controller changes. */
(()=>{'use strict';
let tries=0;
function place(){
 const jawi=document.getElementById('ldmJawiSection113');
 const glyph=document.getElementById('ldmFoldTextGlyph');
 const text=document.getElementById('paraText')?.closest('.v3ArtworkPane')||document.getElementById('textMainSection');
 if(!jawi||!glyph||!text||!text.contains(glyph)){
  if(++tries<40)setTimeout(place,250);
  return;
 }
 // Place as a sibling immediately after GLYPH FONT EDITOR, never inside the fold.
 if(jawi.parentElement!==glyph.parentElement||jawi.previousElementSibling!==glyph)glyph.after(jawi);
 jawi.style.margin='0';
 jawi.style.width='100%';
 jawi.style.boxSizing='border-box';
 jawi.open=false;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',place,{once:true});else place();
})();
