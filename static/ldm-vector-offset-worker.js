/* Bounded polyline offsets. Reject ambiguous/intersecting results instead of dropping geometry. */
(function(root){'use strict';
 const MAX=20000,EPS=1e-8,cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],d2=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
 function offsetGeometry({paths,direction,gap}){
  gap=Number(gap);if(!Number.isFinite(gap)||gap<.01||gap>100)throw Error('GAP must be 0.01–100 mm.');
  if(!['inside','outside','left','right'].includes(direction))throw Error('Choose INSIDE, OUTSIDE, LEFT or RIGHT.');
  if(!Array.isArray(paths)||!paths.length||paths.length>500)throw Error('Select 1–500 vector paths.');
  if(paths.reduce((n,p)=>n+(p?.length||0),0)>MAX)throw Error('Offset limit: 20,000 source points. Simplify the selected layer first.');
  let work=0,bevels=0;const tick=()=>{if(++work>4000000)throw Error('Offset geometry is too complex. Simplify the layer or use a smaller gap.');};
  const area=p=>p.slice(0,-1).reduce((a,q,i)=>a+cross(q,p[i+1]),0)/2;
  const clean=input=>{const p=[];for(const q of input){if(!Array.isArray(q)||q.length<2||!q.slice(0,2).every(Number.isFinite))throw Error('Invalid vector coordinates.');if(!p.length||d2(q,p.at(-1))>EPS*EPS)p.push([q[0],q[1]]);}if(p.length<2)throw Error('Degenerate vector path.');const closed=d2(p[0],p.at(-1))<1e-12;if(closed)p[p.length-1]=p[0].slice();return {p,closed};};
  const records=paths.map(clean),closed=records.every(r=>r.closed);
  if(records.some(r=>r.closed)!==closed)throw Error('This layer mixes closed and open paths. Put them in separate layers before offsetting.');
  if(closed&&!['inside','outside'].includes(direction))throw Error('Closed shapes use INSIDE / OUTSIDE.');
  if(!closed&&!['left','right'].includes(direction))throw Error('Open paths use LEFT / RIGHT, or close the outlines before using INSIDE / OUTSIDE.');
  function segmentDistance(q,a,b){const r=sub(b,a),t=Math.max(0,Math.min(1,((q[0]-a[0])*r[0]+(q[1]-a[1])*r[1])/(r[0]*r[0]+r[1]*r[1])));return d2(q,[a[0]+t*r[0],a[1]+t*r[1]]);}
  function makeIndex(rr){const segments=[],xs=[],ys=[];rr.forEach((r,path)=>{r.p.forEach(q=>{xs.push(q[0]);ys.push(q[1]);});for(let i=0;i<r.p.length-1;i++)segments.push({a:r.p[i],b:r.p[i+1],path,i,last:r.p.length-2,closed:r.closed});});const span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)),cell=Math.max(.1,span/64),grid=new Map();
   function cells(minx,miny,maxx,maxy,visit){for(let x=Math.floor(minx/cell);x<=Math.floor(maxx/cell);x++)for(let y=Math.floor(miny/cell);y<=Math.floor(maxy/cell);y++){tick();visit(x+','+y);}}
   segments.forEach((s,i)=>cells(Math.min(s.a[0],s.b[0]),Math.min(s.a[1],s.b[1]),Math.max(s.a[0],s.b[0]),Math.max(s.a[1],s.b[1]),key=>{if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);}));return {segments,grid,cells};
  }
  function touch(a,b,c,d){if(Math.max(a[0],b[0])+EPS<Math.min(c[0],d[0])||Math.max(c[0],d[0])+EPS<Math.min(a[0],b[0])||Math.max(a[1],b[1])+EPS<Math.min(c[1],d[1])||Math.max(c[1],d[1])+EPS<Math.min(a[1],b[1]))return false;const sign=v=>Math.abs(v)<EPS?0:Math.sign(v);return sign(cross(sub(b,a),sub(c,a)))*sign(cross(sub(b,a),sub(d,a)))<=0&&sign(cross(sub(d,c),sub(a,c)))*sign(cross(sub(d,c),sub(b,c)))<=0;}
  function validate(rr,message){const ix=makeIndex(rr);ix.segments.forEach((s,k)=>{const seen=new Set();ix.cells(Math.min(s.a[0],s.b[0]),Math.min(s.a[1],s.b[1]),Math.max(s.a[0],s.b[0]),Math.max(s.a[1],s.b[1]),key=>{for(const j of ix.grid.get(key)||[]){if(j<=k||seen.has(j))continue;seen.add(j);tick();const v=ix.segments[j];if(s.path===v.path&&(Math.abs(s.i-v.i)===1||(s.closed&&Math.abs(s.i-v.i)===s.last)))continue;if(touch(s.a,s.b,v.a,v.b))throw Error(message);}});});return ix;}
  const originalIndex=validate(records,'Source paths cross or touch. Split crossing shapes into simple outlines before offsetting.');
  const rayIndices=new WeakMap();
  function inside(q,p){let ix=rayIndices.get(p);if(!ix){const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys),bins=Math.max(64,Math.min(512,Math.ceil(p.length/16))),step=Math.max(1e-6,(maxy-miny)/bins),grid=new Map();for(let i=0;i<p.length-1;i++){for(let k=Math.floor((Math.min(p[i][1],p[i+1][1])-miny)/step);k<=Math.floor((Math.max(p[i][1],p[i+1][1])-miny)/step);k++){tick();if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);}}ix={minx,maxx,miny,maxy,step,grid};rayIndices.set(p,ix);}if(q[0]<ix.minx||q[0]>ix.maxx||q[1]<ix.miny||q[1]>ix.maxy)return false;let yes=false;for(const i of ix.grid.get(Math.floor((q[1]-ix.miny)/ix.step))||[]){tick();const a=p[i],b=p[i+1];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}

  if(closed)for(const r of records){r.area=area(r.p);if(Math.abs(r.area)<EPS)throw Error('Closed outline has no area.');r.depth=0;for(const other of records)if(other!==r&&inside(r.p[0],other.p))r.depth++;}
  const result=records.map(r=>{
   const p=r.p,end=r.closed?p.length-1:p.length,sign=r.closed?(direction==='inside'?1:-1)*Math.sign(r.area)*(r.depth%2?-1:1):(direction==='left'?-1:1),delta=gap*sign,edges=[];
   for(let i=0;i<p.length-1;i++){const v=sub(p[i+1],p[i]),len=Math.hypot(...v);edges.push({v:[v[0]/len,v[1]/len],n:[-v[1]/len,v[0]/len]});}
   const shifted=(q,n)=>[q[0]+delta*n[0],q[1]+delta*n[1]],out=[];
   for(let i=0;i<end;i++){tick();if(!r.closed&&i===0){out.push(shifted(p[i],edges[0].n));continue;}if(!r.closed&&i===end-1){out.push(shifted(p[i],edges.at(-1).n));continue;}
    const a=edges[(i-1+edges.length)%edges.length],b=edges[i%edges.length],qa=shifted(p[i],a.n),qb=shifted(p[i],b.n),den=cross(a.v,b.v);
    if(Math.abs(den)<EPS){if(a.v[0]*b.v[0]+a.v[1]*b.v[1]<0)throw Error('Path doubles back on itself. Split it before offsetting.');out.push(qa);continue;}
    const u=cross(sub(qb,qa),b.v)/den,q=[qa[0]+u*a.v[0],qa[1]+u*a.v[1]];
    if(d2(q,p[i])>gap*gap*16){out.push(qa,qb);bevels++;}else out.push(q);
   }
   if(r.closed)out.push(out[0].slice());const normalized=clean(out);
   if(r.closed&&(normalized.p.length<4||Math.abs(area(normalized.p))<EPS||Math.sign(area(normalized.p))!==Math.sign(r.area)))throw Error('Offset collapses a contour. Reduce GAP.');return normalized;
  });
  if(result.reduce((n,r)=>n+r.p.length,0)>40000)throw Error('Offset result is too large. Simplify the layer.');
  validate(result,'Offset contours overlap, merge or collapse narrow details. Reduce GAP or separate the shapes.');
  if(closed){validate([...records,...result],'Offset crosses source boundaries or collapses narrow details. Reduce GAP.');const limit=(gap-1e-6)**2;for(let i=0;i<result.length;i++){const expectedInside=(direction==='inside')!==(records[i].depth%2===1);for(const q of result[i].p.slice(0,-1)){tick();if(inside(q,records[i].p)!==expectedInside)throw Error('Offset collapses or crosses its source contour. Reduce GAP.');const seen=new Set();originalIndex.cells(q[0]-gap,q[1]-gap,q[0]+gap,q[1]+gap,key=>{for(const j of originalIndex.grid.get(key)||[]){if(seen.has(j))continue;seen.add(j);tick();const e=originalIndex.segments[j];if(segmentDistance(q,e.a,e.b)<limit)throw Error('Offset collapses narrow details or approaches another contour. Reduce GAP.');}});}}}
  return {paths:result.map(r=>r.p),warnings:bevels?['Sharp corners were bevelled at the 4× miter limit.']:[],gap,direction};
 }
 function closedOffset(data){
  const {paths,direction}=data,gap=Number(data.gap);
  if(!['inside','outside'].includes(direction)||!paths.every(p=>p.length>3&&d2(p[0],p.at(-1))<1e-12))return offsetGeometry(data);
  if(!Number.isFinite(gap)||gap<.01||gap>100)throw Error('GAP must be 0.01–100 mm.');
  if(paths.length>500||paths.reduce((n,p)=>n+p.length,0)>MAX)throw Error('Offset limit: 500 paths / 20,000 points.');
  if(paths.some(p=>p.some(q=>!q.every(Number.isFinite)||q.some(v=>Math.abs(v)>100000))))throw Error('Invalid or excessive vector coordinates.');
  const C=typeof module!=='undefined'?require('./ldm-clipper.js'):(root.ClipperLib||(importScripts('./ldm-clipper.js?gui231'),root.ClipperLib)),scale=100000;
  const input=paths.map(p=>p.slice(0,-1).map(q=>({X:Math.round(q[0]*scale),Y:Math.round(q[1]*scale)}))),union=new C.Clipper(),normalized=[];
  union.AddPaths(input,C.PolyType.ptSubject,true);union.Execute(C.ClipType.ctUnion,normalized,C.PolyFillType.pftEvenOdd,C.PolyFillType.pftEvenOdd);
  if(!normalized.length)throw Error('Closed outline has no usable area.');
  const engine=new C.ClipperOffset(4,100),out=[];engine.AddPaths(normalized,C.JoinType.jtMiter,C.EndType.etClosedPolygon);engine.Execute(out,(direction==='outside'?1:-1)*gap*scale);
  if(!out.length)throw Error('Offset removes the entire shape. Reduce GAP.');
  if(out.reduce((n,p)=>n+p.length,0)>40000)throw Error('Offset result is too large. Simplify the layer.');
  return {paths:out.map(p=>{const q=p.map(v=>[v.X/scale,v.Y/scale]);q.push(q[0].slice());return q;}),direction,gap,warnings:['Polygon offset resolves overlapping corners; narrow details may merge, split or disappear. Review the preview.']};
 }
 function prepare(data){if(!data.closeDraw&&data.direction!=='clean')return data;if(!Array.isArray(data.paths)||data.paths.reduce((n,p)=>n+p.length,0)>20000)throw Error('Close-path limit: 20,000 source points. Simplify first.');if(typeof root.ldmCloseDrawPaths!=='function')importScripts('./ldm-vector-close-path.js?gui231');const cleaned=root.ldmCloseDrawPaths(data.paths);const paths=cleaned.paths.filter(p=>p.length>3&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-6);if(!paths.length)throw Error('No enclosed DRAW outline found. Cross back over the starting stroke to close the shape, then regenerate.');return {...data,paths};}
 if(typeof module!=='undefined')module.exports={offsetGeometry,closedOffset};else root.onmessage=e=>{try{const prepared=prepare(e.data),result=e.data.direction==='clean'?{paths:prepared.paths,warnings:[],direction:'clean',gap:0}:closedOffset(prepared);if(e.data.closeDraw||e.data.direction==='clean')result.warnings.push('Closed DRAW outlines only; extra tails/open strokes excluded. Original preserved.');root.postMessage({ok:true,...result});}catch(error){root.postMessage({ok:false,error:error.message});}};
})(typeof self==='undefined'?globalThis:self);
