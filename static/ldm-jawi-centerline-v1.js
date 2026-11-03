/* JAWI TRUE CENTERLINE V1 — experimental vector glyph engine; preview only.
   Paths are open centerlines, never filled outlines. Missing glyphs fail closed. */
(function(){'use strict';
const glyphs={
 'ا':{join:'R',p:['M 5 2 L 5 19']},'أ':{join:'R',p:['M 5 2 L 5 19','M 2 0 L 5 -2 L 8 0']},'إ':{join:'R',p:['M 5 2 L 5 19','M 2 22 L 5 20 L 8 22']},
 'ب':{join:'D',p:['M 1 12 Q 5 19 10 12','M 5 23 L 5.2 23']},
 'ت':{join:'D',p:['M 1 12 Q 5 19 10 12','M 3 7 L 3.2 7','M 7 7 L 7.2 7']},
 'ث':{join:'D',p:['M 1 12 Q 5 19 10 12','M 3 7 L 3.2 7','M 7 7 L 7.2 7','M 5 4 L 5.2 4']},
 'ن':{join:'D',p:['M 1 12 Q 5 19 10 12','M 5 7 L 5.2 7']},
 'ي':{join:'D',p:['M 1 12 Q 5 19 10 12','M 3 23 L 3.2 23','M 7 23 L 7.2 23']},
 'ڽ':{join:'D',p:['M 1 12 Q 5 19 10 12','M 3 7 L 3.2 7','M 7 7 L 7.2 7','M 5 4 L 5.2 4']},
 'ج':{join:'D',p:['M 10 10 Q 4 6 2 14 Q 0 22 9 20','M 5 16 L 5.2 16']},
 'چ':{join:'D',p:['M 10 10 Q 4 6 2 14 Q 0 22 9 20','M 3 16 L 3.2 16','M 5 18 L 5.2 18','M 7 16 L 7.2 16']},
 'ح':{join:'D',p:['M 10 10 Q 4 6 2 14 Q 0 22 9 20']},
 'خ':{join:'D',p:['M 10 10 Q 4 6 2 14 Q 0 22 9 20','M 5 4 L 5.2 4']},
 'د':{join:'R',p:['M 4 7 Q 12 13 2 18']},'ذ':{join:'R',p:['M 4 7 Q 12 13 2 18','M 6 3 L 6.2 3']},
 'ر':{join:'R',p:['M 9 10 Q 8 20 2 21']},'ز':{join:'R',p:['M 9 10 Q 8 20 2 21','M 6 5 L 6.2 5']},
 'س':{join:'D',p:['M 10 12 Q 8 18 6 12 Q 4 18 2 12 Q 0 24 -3 19']},
 'ش':{join:'D',p:['M 10 12 Q 8 18 6 12 Q 4 18 2 12 Q 0 24 -3 19','M 3 5 L 3.2 5','M 6 3 L 6.2 3','M 9 5 L 9.2 5']},
 'ص':{join:'D',p:['M 10 13 Q 7 6 3 12 Q 1 17 10 17']},'ض':{join:'D',p:['M 10 13 Q 7 6 3 12 Q 1 17 10 17','M 5 5 L 5.2 5']},
 'ط':{join:'D',p:['M 10 13 Q 7 6 3 12 Q 1 17 10 17','M 5 2 L 5 16']},
 'ظ':{join:'D',p:['M 10 13 Q 7 6 3 12 Q 1 17 10 17','M 5 2 L 5 16','M 7 0 L 7.2 0']},
 'ع':{join:'D',p:['M 10 11 Q 3 4 3 12 Q 5 16 10 15']},'غ':{join:'D',p:['M 10 11 Q 3 4 3 12 Q 5 16 10 15','M 6 4 L 6.2 4']},
 'ف':{join:'D',p:['M 10 13 Q 5 18 5 11 Q 5 5 10 9','M 8 4 L 8.2 4']},
 'ڤ':{join:'D',p:['M 10 13 Q 5 18 5 11 Q 5 5 10 9','M 5 3 L 5.2 3','M 8 3 L 8.2 3','M 6.5 0 L 6.7 0']},
 'ق':{join:'D',p:['M 10 13 Q 5 18 5 11 Q 5 5 10 9','M 6 3 L 6.2 3','M 9 3 L 9.2 3']},
 'ك':{join:'D',p:['M 10 4 L 10 17 L 1 17','M 5 9 L 8 11']},
 'ک':{join:'D',p:['M 10 4 L 10 17 L 1 17','M 5 9 L 8 11']},
 'ڬ':{join:'D',p:['M 10 4 L 10 17 L 1 17','M 5 9 L 8 11','M 4 5 L 8 5']},
 'ل':{join:'D',p:['M 9 2 L 9 15 Q 6 23 1 17']},
 'م':{join:'D',p:['M 10 14 Q 5 7 3 13 Q 1 18 8 17','M 4 17 L 3 23']},
 'ه':{join:'D',p:['M 10 13 Q 5 5 2 13 Q 4 20 10 13']},
 'ة':{join:'R',p:['M 10 13 Q 5 5 2 13 Q 4 20 10 13','M 4 4 L 4.2 4','M 7 4 L 7.2 4']},
 'و':{join:'R',p:['M 9 10 Q 2 5 3 13 Q 6 19 9 13 Q 8 22 3 23']},
 'ؤ':{join:'R',p:['M 9 10 Q 2 5 3 13 Q 6 19 9 13 Q 8 22 3 23','M 2 4 Q 5 1 7 4']},
 'ى':{join:'R',p:['M 9 11 Q 2 10 1 18 Q 3 23 10 19']},
 'ء':{join:'N',p:['M 2 14 Q 5 9 8 14 L 4 17 L 9 17']},
 ' ': {join:'N',p:[],width:6}
};
const arabic=/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
function canJoinLeft(ch){return glyphs[ch]&&glyphs[ch].join==='D'}
function canJoinRight(ch){return glyphs[ch]&&glyphs[ch].join!=='N'}
function layout(text,scale=1){let paths=[],missing=[],x=0,y=0;const lines=String(text).split('\n');for(const line of lines){x=0;const chars=Array.from(line);for(let i=chars.length-1;i>=0;i--){let ch=chars[i],g=glyphs[ch];if(!g){if(!/\s/.test(ch))missing.push(ch);x-=11*scale;continue;}const w=g.width||12;x-=w*scale;for(const d of g.p)paths.push({d,tx:x,ty:y,scale,ch});const next=chars[i-1],prev=chars[i+1];if(next&&canJoinLeft(ch)&&canJoinRight(next))paths.push({d:'M 0 15 L 2 15',tx:x,ty:y,scale,ch:'join'});}y+=29*scale;}return {paths,missing:[...new Set(missing)],width:Math.max(12,...lines.map(l=>l.length*12))*scale,height:Math.max(25,lines.length*29)*scale};}
function render(o,grp,NS){const text=String(o?.text||'');if(!arabic.test(text))return null;const scale=Math.max(.25,(Number(o.size)||20)/22),r=layout(text,scale);if(r.missing.length){grp.dataset.jawiMissing=r.missing.join('');return null;}const g=document.createElementNS(NS,'g');g.setAttribute('data-jawi-centerline','experimental');g.setAttribute('fill','none');g.setAttribute('stroke','currentColor');g.setAttribute('stroke-width','.55');g.setAttribute('stroke-linecap','round');g.setAttribute('stroke-linejoin','round');for(const p of r.paths){const path=document.createElementNS(NS,'path');path.setAttribute('d',p.d);path.setAttribute('transform',`translate(${p.tx} ${p.ty}) scale(${p.scale})`);g.appendChild(path);}grp.appendChild(g);return {minx:-r.width,maxx:0,miny:-3*scale,maxy:r.height};}
window.LDMJawiCenterlineV1={glyphs,layout,render,experimental:true,plottingEnabled:false};
})();

window.addEventListener('DOMContentLoaded',()=>{const s=document.getElementById('fontSource');if(s&&!s.querySelector('[value="jawi-centerline-v1"]')){const o=document.createElement('option');o.value='jawi-centerline-v1';o.textContent='Jawi TRUE CENTERLINE V1 (experimental · preview only)';s.appendChild(o);}});
