/* GUI.136: exact CANVAS paper geometry -> relative FOAM route. */
(()=>{'use strict';
 const f=n=>Number(n).toFixed(3);
 // Split crossing strokes into a planar graph, then extract bounded faces.
 // Used only when an open stroke is present; existing closed-only jobs retain their topology.
 window.ldmResolveFoamClosedLoops=function(paths){
  const dist=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
  const open=paths.map(p=>dist(p[0],p.at(-1))>1e-12);
  if(!open.some(Boolean))return {paths,groups:paths.map(()=>null),ignoredSegments:[],extractedLoops:0,sources:paths.map((p,i)=>[i])};
  let work=0;const tick=()=>{if(++work>4000000)throw Error('FOAM crossing analysis is too complex. Simplify or split the artwork before generating the route.');};
  const segs=[];paths.forEach((p,source)=>{for(let i=0;i<p.length-1;i++)if(dist(p[i],p[i+1])>1e-16)segs.push({a:p[i],b:p[i+1],source,cuts:[0,1]});});
  const grid=new Map(),cell=v=>Math.max(0,Math.min(31,Math.floor((v+128)/8)));
  const cells=(s,fn)=>{for(let x=cell(Math.min(s.a[0],s.b[0]));x<=cell(Math.max(s.a[0],s.b[0]));x++)for(let y=cell(Math.min(s.a[1],s.b[1]));y<=cell(Math.max(s.a[1],s.b[1]));y++){tick();fn(x*32+y);}};
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
  function split(a,b){const r=sub(a.b,a.a),s=sub(b.b,b.a),q=sub(b.a,a.a),den=cross(r,s),eps=1e-9;
   if(Math.abs(den)>eps){const t=cross(q,s)/den,u=cross(q,r)/den;if(t>=-eps&&t<=1+eps&&u>=-eps&&u<=1+eps){a.cuts.push(Math.max(0,Math.min(1,t)));b.cuts.push(Math.max(0,Math.min(1,u)));}}
   else if(Math.abs(cross(q,r))<=eps){for(const [p,target,dir] of [[b.a,a,r],[b.b,a,r],[a.a,b,s],[a.b,b,s]]){const t=dot(sub(p,target.a),dir)/dot(dir,dir);if(t>=-eps&&t<=1+eps)target.cuts.push(Math.max(0,Math.min(1,t)));}}
  }
  segs.forEach((s,i)=>{const seen=new Set();cells(s,key=>{for(const j of grid.get(key)||[]){if(seen.has(j))continue;seen.add(j);tick();split(s,segs[j]);}if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);});});
  const nodes=[],byPoint=new Map(),edges=[],byEdge=new Map();
  const node=q=>{const p=q.map(v=>Math.round(v*1e6)/1e6),key=p.join(',');if(!byPoint.has(key)){byPoint.set(key,nodes.length);nodes.push({p,edges:[]});}return byPoint.get(key);};
  for(const s of segs){s.cuts.sort((a,b)=>a-b);const cuts=s.cuts.filter((t,i,a)=>i===0||t-a[i-1]>1e-9);for(let i=1;i<cuts.length;i++){
   tick();const at=t=>[s.a[0]+t*(s.b[0]-s.a[0]),s.a[1]+t*(s.b[1]-s.a[1])],a=node(at(cuts[i-1])),b=node(at(cuts[i]));if(a===b)continue;const key=Math.min(a,b)+':'+Math.max(a,b);
   if(byEdge.has(key)){edges[byEdge.get(key)].sources.add(s.source);continue;}
   const e={a,b,sources:new Set([s.source]),active:true};byEdge.set(key,edges.length);nodes[a].edges.push(edges.length);nodes[b].edges.push(edges.length);edges.push(e);
  }}
  // Connected components preserve isolated open paths and closed-only artwork.
  const components=[],seenNodes=new Set();for(let n=0;n<nodes.length;n++){if(seenNodes.has(n))continue;const queue=[n],vertices=[],componentEdges=new Set(),sources=new Set();seenNodes.add(n);for(let k=0;k<queue.length;k++){tick();const u=queue[k];vertices.push(u);for(const e of nodes[u].edges){componentEdges.add(e);for(const s of edges[e].sources)sources.add(s);const v=edges[e].a===u?edges[e].b:edges[e].a;if(!seenNodes.has(v)){seenNodes.add(v);queue.push(v);}}}components.push({vertices,edgeIds:[...componentEdges],sources:[...sources]});}
  const result=[],groups=[],ignoredSegments=[],sourceGroups=[];let extractedLoops=0;
  for(let ci=0;ci<components.length;ci++){
   const comp=components[ci];if(!comp.sources.some(i=>open[i])){for(const i of comp.sources){result.push(paths[i]);groups.push(null);sourceGroups.push([i]);}continue;}
   // Trim dangling edges from face analysis. They remain visible as excluded tails.
   const degrees=new Map(comp.vertices.map(n=>[n,nodes[n].edges.length])),queue=comp.vertices.filter(n=>degrees.get(n)<2);
   for(let k=0;k<queue.length;k++){const n=queue[k];for(const i of nodes[n].edges){tick();const e=edges[i];if(!e.active)continue;e.active=false;const v=e.a===n?e.b:e.a;degrees.set(v,degrees.get(v)-1);if(degrees.get(v)===1)queue.push(v);}}
   const neighbours=new Map();for(const n of comp.vertices){const list=nodes[n].edges.filter(i=>edges[i].active).map(i=>edges[i].a===n?edges[i].b:edges[i].a);list.sort((a,b)=>Math.atan2(nodes[a].p[1]-nodes[n].p[1],nodes[a].p[0]-nodes[n].p[0])-Math.atan2(nodes[b].p[1]-nodes[n].p[1],nodes[b].p[0]-nodes[n].p[0]));neighbours.set(n,list);}
   const visited=new Set(),loops=[],loopKeys=new Set(),usedEdges=new Set();
   function cycle(ids){if(ids.length<4)return;let area=0;for(let i=1;i<ids.length;i++)area+=cross(nodes[ids[i-1]].p,nodes[ids[i]].p);if(Math.abs(area)<1e-8)return;
    const edgeIds=[];for(let i=1;i<ids.length;i++)edgeIds.push(byEdge.get(Math.min(ids[i-1],ids[i])+':'+Math.max(ids[i-1],ids[i])));
    const key=edgeIds.slice().sort((a,b)=>a-b).join(',');if(loopKeys.has(key))return;loopKeys.add(key);edgeIds.forEach(i=>usedEdges.add(i));loops.push(ids.map(i=>nodes[i].p));
   }
   for(const eId of comp.edgeIds){const e=edges[eId];if(!e.active)continue;for(const [startA,startB] of [[e.a,e.b],[e.b,e.a]]){
    if(visited.has(startA+':'+startB))continue;const walk=[startA];let a=startA,b=startB,area=0;
    do{tick();visited.add(a+':'+b);walk.push(b);area+=cross(nodes[a].p,nodes[b].p);const ns=neighbours.get(b),idx=ns.indexOf(a),next=ns[(idx-1+ns.length)%ns.length];a=b;b=next;}while(a!==startA||b!==startB);
    if(area<=1e-8)continue;
    // Bridges can repeat a vertex in a face walk; split into elementary closed loops.
    const stack=[],positions=new Map();for(const n of walk){if(positions.has(n)){const at=positions.get(n);cycle([...stack.slice(at),n]);for(const v of stack.slice(at+1))positions.delete(v);stack.splice(at+1);}else{positions.set(n,stack.length);stack.push(n);}}
   }}
   if(!loops.length){for(const i of comp.sources){result.push(paths[i]);groups.push(null);sourceGroups.push([i]);}continue;}
   extractedLoops+=loops.length;for(const p of loops){result.push(p);groups.push('crossing-'+ci);sourceGroups.push(comp.sources);}
   for(const i of comp.edgeIds)if(!usedEdges.has(i))ignoredSegments.push([nodes[edges[i].a].p,nodes[edges[i].b].p]);
  }
  return {paths:result,groups,ignoredSegments,extractedLoops,sources:sourceGroups};
 };
 window.ldmFoamWireRoute=function(paths,contours){
  const dist=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
  let work=0;const tick=()=>{if(++work>4000000)throw Error('FOAM crossing analysis is too complex. Simplify or split the artwork before generating the route.');};
  const segs=[];paths.forEach((p,source)=>{for(let i=0;i<p.length-1;i++)if(dist(p[i],p[i+1])>1e-16)segs.push({a:p[i],b:p[i+1],source,cuts:[0,1]});});
  const grid=new Map(),cell=v=>Math.max(0,Math.min(31,Math.floor((v+128)/8)));
  const cells=(s,fn)=>{for(let x=cell(Math.min(s.a[0],s.b[0]));x<=cell(Math.max(s.a[0],s.b[0]));x++)for(let y=cell(Math.min(s.a[1],s.b[1]));y<=cell(Math.max(s.a[1],s.b[1]));y++){tick();fn(x*32+y);}};
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
  function split(a,b){const r=sub(a.b,a.a),s=sub(b.b,b.a),q=sub(b.a,a.a),den=cross(r,s),eps=1e-9;
   if(Math.abs(den)>eps){const t=cross(q,s)/den,u=cross(q,r)/den;if(t>=-eps&&t<=1+eps&&u>=-eps&&u<=1+eps){a.cuts.push(Math.max(0,Math.min(1,t)));b.cuts.push(Math.max(0,Math.min(1,u)));}}
   else if(Math.abs(cross(q,r))<=eps){for(const [p,target,dir] of [[b.a,a,r],[b.b,a,r],[a.a,b,s],[a.b,b,s]]){const t=dot(sub(p,target.a),dir)/dot(dir,dir);if(t>=-eps&&t<=1+eps)target.cuts.push(Math.max(0,Math.min(1,t)));}}
  }
  segs.forEach((s,i)=>{const seen=new Set();cells(s,key=>{for(const j of grid.get(key)||[]){if(seen.has(j))continue;seen.add(j);tick();split(s,segs[j]);}if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);});});
  const nodes=[],byPoint=new Map(),edges=[],byEdge=new Map();
  const node=q=>{const p=q.map(v=>Math.round(v*1e6)/1e6),key=p.join(',');if(!byPoint.has(key)){byPoint.set(key,nodes.length);nodes.push({p,edges:[]});}return byPoint.get(key);};
  for(const s of segs){s.cuts.sort((a,b)=>a-b);const cuts=s.cuts.filter((t,i,a)=>i===0||t-a[i-1]>1e-9);for(let i=1;i<cuts.length;i++){
   tick();const at=t=>[s.a[0]+t*(s.b[0]-s.a[0]),s.a[1]+t*(s.b[1]-s.a[1])],a=node(at(cuts[i-1])),b=node(at(cuts[i]));if(a===b)continue;const key=Math.min(a,b)+':'+Math.max(a,b);
   if(byEdge.has(key)){edges[byEdge.get(key)].sources.add(s.source);continue;}
   const e={a,b,sources:new Set([s.source]),active:true};byEdge.set(key,edges.length);nodes[a].edges.push(edges.length);nodes[b].edges.push(edges.length);edges.push(e);
  }}

  if(!nodes.length)throw Error('No connected wire-cut geometry.');
  const root=nodes.reduce((best,n,i)=>dist(n.p,[-128,-128])<dist(nodes[best].p,[-128,-128])?i:best,0);
  const seen=new Set([root]),queue=[root];for(let k=0;k<queue.length;k++)for(const eid of nodes[queue[k]].edges){tick();const e=edges[eid],v=e.a===queue[k]?e.b:e.a;if(!seen.has(v)){seen.add(v);queue.push(v);}}
  if(seen.size!==nodes.length){
   const labels=new Array(nodes.length).fill(-1);let count=0;
   for(let i=0;i<nodes.length;i++)if(labels[i]<0){const q=[i];labels[i]=count;for(let k=0;k<q.length;k++)for(const eid of nodes[q[k]].edges){tick();const e=edges[eid],v=e.a===q[k]?e.b:e.a;if(labels[v]<0){labels[v]=count;q.push(v);}}count++;}
   const joined=new Set([labels[root]]),connections=[];
   while(joined.size<count){let best=null,bestDistance=Infinity;
    for(let i=0;i<nodes.length;i++)if(joined.has(labels[i]))for(let j=0;j<nodes.length;j++)if(!joined.has(labels[j])){
     tick();const a=nodes[i].p,b=nodes[j].p,d=dist(a,b);if(d>=bestDistance)continue;
     const direction=sub(b,a);let clear=true;
     for(const e of edges){tick();const c=nodes[e.a].p,z=nodes[e.b].p,edge=sub(z,c),den=cross(direction,edge),q=sub(c,a);
      if(Math.abs(den)<1e-9){if(Math.abs(cross(q,direction))<1e-8){const t=dot(q,direction)/d,u=dot(sub(z,a),direction)/d;if(Math.min(1,Math.max(t,u))-Math.max(0,Math.min(t,u))>1e-7){clear=false;break;}}}
      else{const t=cross(q,edge)/den,u=cross(q,direction)/den;if(t>1e-7&&t<1-1e-7&&u>=-1e-7&&u<=1+1e-7){clear=false;break;}}
     }
     if(clear){best=[i,j];bestDistance=d;}
    }
    if(!best)break;connections.push(best.map(i=>nodes[i].p.slice()));joined.add(labels[best[1]]);
   }
   const error=Error('NICHROME SLIT ROUTE: '+count+' disconnected artwork groups. '+(joined.size===count?'Review '+connections.length+' proposed access slit(s) in the 3D simulator.':'No clear connecting slit was found; revise the artwork or use LIFT & VERTICAL ENTRY.'));
   if(joined.size===count)error.foamConnections=connections;throw error;
  }
  let current=root;const route=[nodes[root].p],used=new Set();
  function emit(eid,to){tick();used.add(eid);route.push(nodes[to].p);current=to;if(route.length>250000)throw Error('Wire route exceeds 250,000 points including retracing.');}
  function walkTo(target,segment=null){if(current===target)return;const prev=new Map([[current,null]]),q=[current];for(let k=0;k<q.length&&!prev.has(target);k++)for(const eid of nodes[q[k]].edges){tick();const e=edges[eid],v=e.a===q[k]?e.b:e.a;if(prev.has(v))continue;if(segment){const [a,b]=segment,dir=sub(b,a),rel=sub(nodes[v].p,a);if(Math.abs(cross(dir,rel))>1e-5||dot(rel,dir)<-1e-6||dot(rel,dir)>dot(dir,dir)+1e-6)continue;}prev.set(v,[q[k],eid]);q.push(v);}if(!prev.has(target))throw Error('An artwork segment cannot be followed on the connected wire route.');const steps=[];for(let v=target;prev.get(v);){const [u,eid]=prev.get(v);steps.push([eid,v]);v=u;}for(const [eid,v]of steps.reverse())emit(eid,v);}
  const find=p=>byPoint.get(p.map(v=>Math.round(v*1e6)/1e6).join(','));
  // Visit resolved hole-first contours through existing graph edges only.
  for(const contour of contours){const ids=contour.map(find),at=ids.findIndex(v=>v!==undefined);if(at<0)continue;const p=contour.slice(at).concat(contour.slice(0,at));const closed=dist(contour[0],contour.at(-1))<1e-12;const points=p.filter(q=>find(q)!==undefined);if(!points.length)continue;walkTo(find(points[0]));for(let i=1;i<points.length;i++)walkTo(find(points[i]),[points[i-1],points[i]]);if(closed&&current!==find(points[0]))walkTo(find(points[0]),[points.at(-1),points[0]]);}
  walkTo(root);
  // Retain explicit access branches/tails; return along the same vector edges.
  const stack=[{node:root,index:0,back:null}];while(stack.length){const top=stack.at(-1);let eid;while(top.index<nodes[top.node].edges.length){const candidate=nodes[top.node].edges[top.index++];if(!used.has(candidate)){eid=candidate;break;}}if(eid===undefined){stack.pop();if(top.back!==null)emit(top.back,stack.at(-1).node);continue;}const e=edges[eid],v=e.a===top.node?e.b:e.a;emit(eid,v);stack.push({node:v,index:0,back:eid});}
  return route;
 };
 window.ldmBuildFoamCanvasJob=function(canvas,s){
  const entryMode=s.entry_mode||'slit',vertical=entryMode==='vertical';
  if(!['slit','vertical'].includes(entryMode))throw Error('Choose a valid FOAM entry mode.');
  const w=Number(canvas.width),h=Number(canvas.height);
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>256||h>256)throw Error('FOAM CANVAS must fit the A1 256 × 256 mm area.');
  if(Number(s.kerf)!==0)throw Error('CANVAS FOAM kerf compensation is not implemented. Set measured kerf to 0 for this trial.');
  const paths=[];let count=0;
  for(const stroke of canvas.paths||[]){if(!Array.isArray(stroke)||stroke.length<2)continue;const p=[];for(const q of stroke){if(!Array.isArray(q)||q.length<2||!Number.isFinite(q[0])||!Number.isFinite(q[1])||q[0]<0||q[0]>w||q[1]<0||q[1]>h)throw Error('FOAM path escaped CANVAS bounds.');p.push([q[0]-w/2,h/2-q[1]]);if(++count>250000)throw Error('FOAM CANVAS trial limit: 250,000 points. Simplify the composition first.');}paths.push(p);}
  if(!paths.length)throw Error('CANVAS is empty. Place VECTOR artwork onto CANVAS first.');
  const wireSource=paths.map(p=>p.map(q=>q.slice()));
  const resolved=window.ldmResolveFoamClosedLoops(paths);paths.splice(0,paths.length,...resolved.paths);
  if(paths.reduce((n,p)=>n+p.length,0)>250000)throw Error('FOAM crossing resolution exceeds 250,000 points. Simplify the artwork.');
  // Preserve topology: rotate closed polylines at the nearest boundary point;
  // open polylines can only reverse, never start midway and lose a branch.
  const anchor=[-128,-128],distance=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
  const nearest=p=>{
   if(distance(p[0],p[p.length-1])>1e-12)return distance(anchor,p[p.length-1])<distance(anchor,p[0])?p.slice().reverse():p;
   let best=Infinity,index=0,point=p[0];
   for(let i=0;i<p.length-1;i++){
    const a=p[i],b=p[i+1],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
    const t=length?Math.max(0,Math.min(1,((anchor[0]-a[0])*dx+(anchor[1]-a[1])*dy)/length)):0;
    const q=[a[0]+t*dx,a[1]+t*dy],d=distance(anchor,q);
    if(d<best){best=d;index=i;point=q;}
   }
   const rotated=[point,...p.slice(index+1,-1),...p.slice(0,index+1),point];
   return rotated.filter((q,i)=>i===0||distance(q,rotated[i-1])>1e-16);
  };
  // Containment is geometric, independent of colour and winding direction.
  // Touching/crossing visible contours remain independent cut outlines; only disjoint boundaries receive containment ordering.
  const records=paths.map((p,index)=>{
   let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;
   for(const q of p){minx=Math.min(minx,q[0]);miny=Math.min(miny,q[1]);maxx=Math.max(maxx,q[0]);maxy=Math.max(maxy,q[1]);}
   return {p,index,group:resolved.groups[index],closed:p.length>=4&&distance(p[0],p.at(-1))<=1e-12,box:[minx,miny,maxx,maxy],depth:0};
  });
  const closed=records.filter(r=>r.closed);
  if(closed.length>500)throw Error('FOAM hole ordering supports up to 500 closed contours. Simplify the composition first.');
  let work=0;
  const tick=()=>{if(++work>4000000)throw Error('FOAM hole analysis is too complex. Simplify contours or split the job before generating the route.');};
  const cell=v=>Math.max(0,Math.min(31,Math.floor((v+128)/8)));
  function cells(a,b,visit){for(let x=cell(Math.min(a[0],b[0]));x<=cell(Math.max(a[0],b[0]));x++)for(let y=cell(Math.min(a[1],b[1]));y<=cell(Math.max(a[1],b[1]));y++){tick();visit(x*32+y);}}
  function indexSegments(r){if(r.grid)return r.grid;const grid=new Map();for(let i=0;i<r.p.length-1;i++)cells(r.p[i],r.p[i+1],key=>{if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);});return r.grid=grid;}
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  function intersects(a,b,c,d){
   if(Math.max(a[0],b[0])+1e-9<Math.min(c[0],d[0])||Math.max(c[0],d[0])+1e-9<Math.min(a[0],b[0])||Math.max(a[1],b[1])+1e-9<Math.min(c[1],d[1])||Math.max(c[1],d[1])+1e-9<Math.min(a[1],b[1]))return false;
   const sign=v=>Math.abs(v)<1e-9?0:Math.sign(v);
   return sign(cross(a,b,c))*sign(cross(a,b,d))<=0&&sign(cross(c,d,a))*sign(cross(c,d,b))<=0;
  }
  function touches(a,b){const grid=indexSegments(a);for(let j=0;j<b.p.length-1;j++){let found=false;const seen=new Set();cells(b.p[j],b.p[j+1],key=>{if(found)return;for(const i of grid.get(key)||[]){if(seen.has(i))continue;seen.add(i);tick();if(intersects(a.p[i],a.p[i+1],b.p[j],b.p[j+1])){found=true;break;}}});if(found)return true;}return false;}
  function inside(q,r){let yes=false;for(let i=0;i<r.p.length-1;i++){tick();const a=r.p[i],b=r.p[i+1];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  let touchingPairs=0;
  for(let i=0;i<closed.length;i++)for(let j=i+1;j<closed.length;j++){
   tick();const a=closed[i],b=closed[j],A=a.box,B=b.box;
   if(A[2]<B[0]||B[2]<A[0]||A[3]<B[1]||B[3]<A[1])continue;
   // Preserve repeated identical paths as independent outlines, never as holes.
   if(a.p.length===b.p.length&&a.p.every((q,k)=>{tick();return distance(q,b.p[k])<=1e-12;}))continue;
   if(touches(a,b)){touchingPairs++;continue;}
   if(inside(a.p[0],b))a.depth++;
   else if(inside(b.p[0],a))b.depth++;
  }
  for(const r of records)r.p=nearest(r.p);
  records.sort((a,b)=>b.depth-a.depth||distance(anchor,a.p[0])-distance(anchor,b.p[0])||a.index-b.index);
  paths.splice(0,paths.length,...records.map(r=>r.p));
  const transitions=[];
  function checkAccess(a,b,label){
   if(distance(a,b)<=1e-12)return;
   const eps=1e-8;
   for(const p of paths)for(let k=1;k<p.length;k++){
    tick();const c=p[k-1],d=p[k];if(!intersects(a,b,c,d))continue;
    const collinear=Math.abs(cross(a,b,c))<eps&&Math.abs(cross(a,b,d))<eps;
    if(collinear){const axis=Math.abs(b[0]-a[0])>Math.abs(b[1]-a[1])?0:1;const overlap=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]))-Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis]));if(overlap>eps)throw Error(label+' slit overlaps artwork. Use LIFT & VERTICAL ENTRY or revise the artwork.');}
    const end=label==='ENTRY'?b:a;
    const onEnd=Math.abs(cross(c,d,end))<eps&&end[0]>=Math.min(c[0],d[0])-eps&&end[0]<=Math.max(c[0],d[0])+eps&&end[1]>=Math.min(c[1],d[1])-eps&&end[1]<=Math.max(c[1],d[1])+eps;
    if(!onEnd)throw Error(label+' slit crosses artwork. No clear straight access route; use LIFT & VERTICAL ENTRY or revise the artwork.');
   }
  }
  let outlines=records.map((r,i)=>({number:i+1,sourceIndex:resolved.sources[r.index][0],sourceIndices:resolved.sources[r.index],colour:canvas.pathColours?.[resolved.sources[r.index][0]]||'#df625c',depth:r.depth,role:!r.closed?'OPEN PATH':r.depth%2?'HOLE':r.depth?'INNER ISLAND':'OUTER',closed:r.closed}));
  const holeCount=outlines.filter(r=>r.role==='HOLE').length;
  if(!vertical){let wire;try{wire=window.ldmFoamWireRoute(wireSource,paths);}catch(error){if(error.foamConnections)error.foamSnapshot={canvas:structuredClone(canvas),settings:structuredClone(s)};throw error;}paths.splice(0,paths.length,wire);checkAccess(anchor,wire[0],'ENTRY');checkAccess(wire.at(-1),anchor,'RETURN');outlines=[{number:1,role:'CONNECTED WIRE ROUTE',depth:0,colour:outlines[0]?.colour||'#df625c'}];transitions.push('entry');}
  const routeWarnings=holeCount&&!vertical?['Connected nichrome route only: explicit vector slits are retained and may be retraced; no contour-to-contour shortcuts or lifts.']:[];
  if(touchingPairs)routeWarnings.push('VISIBLE CONTOURS: '+touchingPairs+' touching/crossing pair(s) are cut as independent outlines. Shared edges can be cut more than once. No automatic merge or geometry removal. Hole ordering applies only to separated nested boundaries.');
  if(vertical&&resolved.extractedLoops)routeWarnings.push('Crossing strokes resolved into '+resolved.extractedLoops+' closed loop(s). '+resolved.ignoredSegments.length+' tail/bridge segment(s) are shown for review and EXCLUDED from cutting. Review all numbered loops before sending.');
  count=paths.reduce((n,p)=>n+p.length,0);
  if(count>250000)throw Error('FOAM routed job exceeds 250,000 points. Simplify the composition first.');

  const ft=s.foam_top_z+s.rod_length,tcm=s.clearance_z+s.rod_length,tcd=s.foam_top_z-s.cut_depth+s.rod_length;
  if(![ft,tcm,tcd].every(v=>Number.isFinite(v)&&v>=0&&v<=256)||tcm<=tcd)throw Error('Calculated hotend Z exceeds the A1 range. Check foam and rod measurements.');
  if((vertical||transitions.includes('lift'))&&!(tcm>ft&&ft>tcd))throw Error('Vertical entry requires TCM above FTSZ and TCD below FTSZ. Check material setup.');
  if(vertical)routeWarnings.push('VERTICAL ENTRY: cutter must support plunging through foam. XY travel is at TCM; each outline lowers through FTSZ to TCD, cuts, then lifts to TCM. No entry/return slits. Only H1 at bottom-left TCM occurs before the first outline. H2 and the bottom-left TCD descent are skipped. Heat stays on until cutting finishes.');
  if(!Number.isFinite(s.machine_speed)||!Number.isFinite(s.feed_rate)||s.machine_speed<=0||s.feed_rate<=0)throw Error('Confirm valid machine and cutting speeds.');
  const timed=s.hold_mode==='timed';
  if(timed&&!(vertical?[s.bottom_hold_seconds]:[s.bottom_hold_seconds,s.tcd_hold_seconds]).every(v=>Number.isInteger(v)&&v>=1&&v<=600))throw Error('Timed holds must be whole seconds from 1 to 600.');
  const beep=['M17','M1006 S1','M1006 A0 B0 L45 C72 D8 M100 E72 F8 N100','M1006 W','M400'];
  const hold=seconds=>timed?'G4 P'+(seconds*1000):'M400 U1';
  const lines=['; LDM CANVAS FOAM — starts at confirmed center; no HOME or coordinate reset','M104 S0','M140 S0','G21','G90',`G1 Z${f(ft)} F${s.machine_speed}`,'M400',`G1 Z${f(tcm)} F${s.machine_speed}`,'M400','G91'];
  let cur=[0,0];const start=[-128,-128],park=[-128,128],connectors=[];
  const move=(q,speed)=>{const target=q.map(v=>Math.round(v*1000));lines.push(`G1 X${f((target[0]-cur[0])/1000)} Y${f((target[1]-cur[1])/1000)} F${speed}`);cur=target;};
  move(start,s.machine_speed);
  if(vertical){
   lines.push('; VERTICAL ENTRY preparation: H1 at bottom-left TCM only','M400',...beep,hold(s.bottom_hold_seconds));
   if(s.temperature>0)lines.push(`M109 S${s.temperature}`);
   for(let i=0;i<paths.length;i++){const p=paths[i];lines.push(`; OUTLINE ${i+1}: ${outlines[i].role}; vertical entry`);move(p[0],s.machine_speed);lines.push('M400','G90',`G1 Z${f(ft)} F${s.machine_speed}`,'M400',`G1 Z${f(tcd)} F${s.machine_speed}`,'M400','G91');for(let k=1;k<p.length;k++)move(p[k],s.feed_rate);lines.push('M400','G90',`G1 Z${f(tcm)} F${s.machine_speed}`,'M400','G91');}
  }else for(let i=0;i<paths.length;i++){
   const p=paths[i];lines.push(`; OUTLINE ${i+1}: ${outlines[i].role}; nesting depth ${outlines[i].depth}; continuous slit route`);if(i===0)lines.push('M400',...beep,hold(s.bottom_hold_seconds),'G90',`G1 Z${f(tcd)} F${s.machine_speed}`,'M400',...beep,hold(s.tcd_hold_seconds)+' ; TCD hold; heat-up before entry','G91');
   if(i===0&&s.temperature>0)lines.push(`M109 S${s.temperature}`);
   if(i===0){connectors.push([start,p[0]]);move(p[0],s.feed_rate);}
   else if(transitions[i]==='lift'){lines.push('M400','G90',`G1 Z${f(tcm)} F${s.machine_speed}`,'M400','G91');move(p[0],s.machine_speed);lines.push('M400','G90',`G1 Z${f(ft)} F${s.machine_speed}`,`G1 Z${f(tcd)} F${s.machine_speed}`,'M400','G91');}
   if(i===paths.length-1)connectors.push([p[p.length-1],start]);
   for(let k=1;k<p.length;k++)move(p[k],s.feed_rate);
   if(i===paths.length-1){move(start,s.feed_rate);lines.push('M400','G90',`G1 Z${f(tcm)} F${s.machine_speed}`,'M400','M104 S0','G91');}
  }
  move(park,s.machine_speed);lines.push('M400','M104 S0','M140 S0','G90');
  return {gcode:lines.join('\n')+'\n',paths,connectors,count,ft,tcm,tcd,entryMode,transitions,outlines,holeCount,routeWarnings,ignoredSegments:vertical?resolved.ignoredSegments:[],extractedLoops:resolved.extractedLoops};
 };
 function start(){
  // FOAM owns its async validation lifecycle. Intercept before document
  // capture listeners disable the native button and suppress its onclick.
  window.addEventListener('click',function(e){
   const button=e.target.closest?.('#v3SvgSaveStartJobBtn');
   if(!button||!window.ldmFoamMaterialActive?.())return;
   e.preventDefault();e.stopImmediatePropagation();
   if(button.disabled||window.ldmStep5SendGateBlocked?.())return;
   window.v3SvgSaveStartJob?.();
  },true);

  const previous=window.v3SvgSaveStartJob;
  if(typeof previous==='function')window.v3SvgSaveStartJob=function(...args){
   if(!window.ldmFoamMaterialActive?.())return previous.apply(this,args);
   if((typeof V3_JOB_MOTION_LOCK!=='undefined'&&V3_JOB_MOTION_LOCK)||(typeof V3_SD_TRANSFER_ACTIVE!=='undefined'&&V3_SD_TRANSFER_ACTIVE)||(typeof V3_SVG_SAVE_START_MOVING_LOCK!=='undefined'&&V3_SVG_SAVE_START_MOVING_LOCK))return window.ldmAlert('FOAM CANVAS is blocked while a machine job or SD transfer is active.');
   return window.ldmFoamSaveCanvas?.();
  };
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
