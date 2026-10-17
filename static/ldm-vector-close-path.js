(function(root){'use strict';function closeDrawPaths(paths){
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
}
if(typeof module!=='undefined')module.exports={closeDrawPaths};else root.ldmCloseDrawPaths=closeDrawPaths;
})(typeof self==='undefined'?globalThis:self);
