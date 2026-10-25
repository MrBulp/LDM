/* GUI.54: shared guide-constrained paragraph geometry, used by preview and output. */
(()=>{'use strict';
 const id=s=>document.getElementById(s);
 function area(){const s=(window.ldmEffectiveWritingGuideSettings?.()||window.ldmGetWritingGuideSettings?.());if(!s?.enabled||s.wrap===false||window.LDM_ACCESS?.draw_helpers?.writing===false&&!(window.LDM_ACCESS?.local||window.LDM_ACCESS?.admin))return null;const v=id('art')?.viewBox?.baseVal;if(!v)return null;const g=window.ldmWritingGuideLayout(v.width,v.height,s);return {...g.bounds,error:g.error,pw:v.width,ph:v.height};}
 window.ldmParagraphGuideArea=area;
 window.ldmParagraphGuideLayout=function(o){const a=area();if(!a)return null;if(a.error)return {paths:[],error:a.error};
  const size=Number(o.size)||0,scale=Math.max(.0001,Math.abs(Number(o.scale)||1)),limit=(a.x1-a.x0)/scale,gap=Number(o.glyphSpacing)||0,step=size*(Number(o.spacing)||1.25),lines=[];
  // Measure the exact selected/warped glyph once, using original hard-line indices.
  // Reflow does not re-roll handwriting and never mutates the source paragraph.
  String(o.text||'').split('\n').forEach((hard,li)=>{const letters=[...hard],chars=letters.map((ch,i)=>{const g=window.ldmTextGlyphAt?.(ch,o,li,i)||glyphFor(ch,o),left=window.ldmGlyphLeft?.(g,o)||0,pts=(g.strokes||[]).flat(),xs=pts.map(p=>(Number(p[0])-left)*size),advance=window.ldmGlyphAdvance?.(g,o,size)??(g.advance||1)*size*.75;const travel=window.ldmHandwritingAdvance?.(ch,letters[i+1],o,li,i,advance)??advance;return {ch,g,left,advance,travel,joinKey:li+':'+i,lo:Math.min(0,...xs),hi:Math.max(advance,...xs)};});
   if(!chars.length){lines.push({chars:[],last:true});return;}
   let start=0;while(start<chars.length){let end=start,x=0,lo=0,hi=0,word=-1;
    for(;end<chars.length;end++){const g=chars[end],nl=Math.min(lo,x+g.lo),nh=Math.max(hi,x+g.hi);if(nh-nl>limit+1e-7&&end>start)break;lo=nl;hi=nh;if(/\s/u.test(g.ch)&&end>start)word=end;x+=Math.max(.25,g.travel+gap);if(nh-nl>limit+1e-7){end++;break;}}
    let next=end;if(end<chars.length&&word>=start){end=word;next=word+1;while(next<chars.length&&/\s/u.test(chars[next].ch))next++;}
    if(end<=start){end=start+1;next=end;}const row=chars.slice(start,end);while(next<chars.length&&row.length&&/\s/u.test(row[row.length-1].ch))row.pop();lines.push({chars:row,last:next>=chars.length});start=next;
   }
  });
  const paths=[];let y=0;for(const row of lines){let x=0,lo=0,hi=0;const positions=row.chars.map((g,i)=>{const p=x;lo=Math.min(lo,p+g.lo);hi=Math.max(hi,p+g.hi);x+=i<row.chars.length-1?Math.max(.25,g.travel+gap):g.advance;return p;});const width=hi-lo,spaces=row.chars.map((g,i)=>/\s/u.test(g.ch)&&i>0&&i<row.chars.length-1?i:-1).filter(i=>i>=0),extra=o.align==='Justify'&&!row.last&&spaces.length?Math.max(0,limit-width)/spaces.length:0;let shift=-lo+(o.align==='Right'?limit-width:o.align==='Center'?(limit-width)/2:0),added=0;
   const items=row.chars.map((g,i)=>{const item={ch:g.ch,joinKey:g.joinKey,glyph:g.g,paths:(g.g.strokes||[]).map(st=>st.map(p=>[positions[i]+shift+added+(Number(p[0])-g.left)*size,y+(1-Number(p[1]))*size]))};if(spaces.includes(i))added+=extra;return item;});paths.push(...(window.ldmConnectedGlyphPaths?window.ldmConnectedGlyphPaths(items,o):items.flatMap(it=>it.paths.filter(st=>st.length>1))));y+=step;
  }
  const all=paths.flat(),minY=all.length?all.reduce((n,p)=>Math.min(n,p[1]),Infinity):0;
  // Store coordinates about the paper centre; normal object offsets/rotation/mirror
  // still work, and the same transform is applied by sourcePaths and SVG export.
  const left=(a.x0-a.pw/2)/scale,top=(a.y0-a.ph/2)/scale;
  for(const st of paths)for(const p of st){p[0]+=left;p[1]+=top-minY;}
  const angle=(Number(o.rot)||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),mx=o.mx?-1:1,my=o.my?-1:1;let overflow=false;
  for(const st of paths)for(const [x,y]of st){const px=a.pw/2+(Number(o.x)||0)+scale*(x*mx*c-y*my*s),py=a.ph/2+(Number(o.y)||0)+scale*(x*mx*s+y*my*c);if(px<a.x0-1e-6||px>a.x1+1e-6||py<a.y0-1e-6||py>a.y1+1e-6)overflow=true;}
  return {paths,lines:lines.length,overflow,width:a.x1-a.x0,height:a.y1-a.y0,error:'',warning:overflow?'Writing-guide overflow: some TEXT is outside the guide margins. All strokes can still be sent to CANVAS; check their placement before CONFIRM & SEND.':''};
 };
 window.ldmValidateParagraphGuides=()=>{for(const o of (window.textObjects||textObjects||[])){const l=window.ldmParagraphGuideLayout(o);if(l?.error)throw Error(l.error);}return true;};
 window.ldmParagraphGuideWarnings=()=>[...new Set((window.textObjects||textObjects||[]).map(o=>window.ldmParagraphGuideLayout(o)?.warning).filter(Boolean))].join(' ');
 function status(){const host=id('ldmWritingGuideControls');if(!host)return;let note=id('ldmParagraphGuideStatus');if(!note){note=document.createElement('p');note.id='ldmParagraphGuideStatus';note.className='tiny';note.setAttribute('role','status');host.append(note);}const a=area(),objects=window.textObjects||textObjects||[],layouts=a?objects.map(o=>window.ldmParagraphGuideLayout(o)):[],error=layouts.find(l=>l?.error)?.error||a?.error;const message=error||layouts.find(l=>l?.warning)?.warning||(a?`PARAGRAPH AUTO WRAP · ${(a.x1-a.x0).toFixed(1)} × ${(a.y1-a.y0).toFixed(1)} mm · ${layouts.reduce((n,l)=>n+(l?.lines||0),0)} lines. Text follows the guide margins; line spacing remains the TEXT setting.`:'Enable writing lines and Auto wrap to use the guide margins as paragraph limits.');if(note.textContent!==message)note.textContent=message;}
 const before=window.renderTextObjects;if(typeof before==='function')window.renderTextObjects=function(){const r=before.apply(this,arguments);status();return r;};
 let signature='';function refresh(){const s=JSON.stringify([window.ldmGetWritingGuideSettings?.(),window.ldmEffectiveWritingGuideSettings?.(),id('paperW')?.value,id('paperH')?.value]);if(s!==signature){signature=s;if((window.ldmArtworkEditBlocked?!window.ldmArtworkEditBlocked():(!(typeof V3_JOB_MOTION_LOCK!=='undefined'&&V3_JOB_MOTION_LOCK)&&!(typeof V3_PREVIEW_EDIT_LOCK!=='undefined'&&V3_PREVIEW_EDIT_LOCK)&&!document.body.classList.contains('v3PreviewEditLocked')&&!window.ldmCanvasImportBusy))){if(typeof textCommitUi==='function')textCommitUi();else window.renderTextObjects?.();}}status();}
 document.addEventListener('input',refresh);document.addEventListener('change',refresh);document.addEventListener('ldm-writing-guides-change',refresh);document.addEventListener('ldm-draw-helper-access',refresh);document.addEventListener('ldm-online-view',refresh);document.addEventListener('DOMContentLoaded',refresh,{once:true});if(document.readyState!=='loading')refresh();
})();
