/* LDM sketch geometry. Numeric polylines only; no fill and no machine commands. */
(function(root){'use strict';
function sketch(paths,settings,generator){
 const s={roughness:.6,bowing:.3,double:false,extension:2,start:true,end:true,mode:'ends',path:0,seed:12345,...settings};
 for(const [k,min,max] of [['roughness',0,3],['bowing',0,3],['extension',0,30],['seed',1,2147483646]])if(!Number.isFinite(s[k])||s[k]<min||s[k]>max)throw Error('Invalid '+k+'.');
 if(!['ends','segments'].includes(s.mode)||!Number.isInteger(s.path)||s.path<0||s.path>paths.length)throw Error('Invalid path selection.');
 let count=0;const input=paths.map(p=>{if(!Array.isArray(p)||p.length<2)throw Error('Invalid path.');count+=p.length;if(count>20000)throw Error('Sketch limit: 20,000 input points. Select a smaller layer.');return p.map(q=>{if(!Array.isArray(q)||q.length!==2||!q.every(Number.isFinite))throw Error('Invalid coordinates.');return q.slice();});});
 const out=[];let total=0,serial=0;
 function add(p){if(p.length<2)return;total+=p.length;if(total>100000||out.length>=20000)throw Error('Sketch exceeds 100,000 points or 20,000 paths. Reduce detail or use a smaller layer.');out.push(p);}
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 function extend(p){const a=p[0],b=p[p.length-1];if(s.extension===0)return p;
  if(s.start){const n=p.find(q=>dist(a,q)>1e-9);if(n){const d=dist(a,n);p[0]=[a[0]+(a[0]-n[0])*s.extension/d,a[1]+(a[1]-n[1])*s.extension/d];}}
  if(s.end){const n=p.slice(0,-1).reverse().find(q=>dist(b,q)>1e-9);if(n){const d=dist(b,n);p[p.length-1]=[b[0]+(b[0]-n[0])*s.extension/d,b[1]+(b[1]-n[1])*s.extension/d];}}return p;}
 function flatten(a,b,c,d,p,depth=0){const dx=d[0]-a[0],dy=d[1]-a[1],len=Math.hypot(dx,dy);const error=len?Math.max(Math.abs(dy*(b[0]-a[0])-dx*(b[1]-a[1])),Math.abs(dy*(c[0]-a[0])-dx*(c[1]-a[1])))/len:Math.max(dist(a,b),dist(a,c));if(depth>=12||error<=.025){p.push(d);return;}const mid=(x,y)=>[(x[0]+y[0])/2,(x[1]+y[1])/2],ab=mid(a,b),bc=mid(b,c),cd=mid(c,d),abc=mid(ab,bc),bcd=mid(bc,cd),m=mid(abc,bcd);flatten(a,ab,abc,m,p,depth+1);flatten(m,bcd,cd,d,p,depth+1);}
 function draw(p){if(s.roughness===0&&!s.double){add(p);return;}const drawing=generator.linearPath(p,{roughness:s.roughness,bowing:s.bowing,maxRandomnessOffset:1,disableMultiStroke:!s.double,preserveVertices:true,seed:((s.seed+serial++)%2147483646)||1});for(const set of drawing.sets){if(set.type!=='path')continue;let points=[],last=null;for(const op of set.ops){const d=op.data;if(op.op==='move'){add(points);points=[[d[0],d[1]]];last=points[0];}else if(op.op==='lineTo'){last=[d[0],d[1]];points.push(last);}else if(op.op==='bcurveTo'&&last){const end=[d[4],d[5]];flatten(last,[d[0],d[1]],[d[2],d[3]],end,points);last=end;}else throw Error('Unsupported sketch operation.');}add(points);}}
 input.forEach((p,i)=>{if(s.path&&i!==s.path-1){add(p);return;}if(s.mode==='segments'){for(let n=1;n<p.length;n++)if(dist(p[n-1],p[n])>1e-9)draw(extend([p[n-1].slice(),p[n].slice()]));}else{if(dist(p[0],p[p.length-1])>1e-7)extend(p);draw(p);}});
 if(!out.length)throw Error('No drawable paths.');return{paths:out,points:total};
}
root.ldmSketchGeometry=sketch;if(typeof module!=='undefined')module.exports=sketch;
})(typeof self!=='undefined'?self:globalThis);
