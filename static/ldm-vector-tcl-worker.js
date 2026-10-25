/* GUI.68: deterministic local colour quantisation and numeric vector tracing. */
(function(root){'use strict';
 function budget(value,fallback){const n=value===undefined?fallback:Number(value);if(!Number.isSafeInteger(n)||n<0)throw Error('Trace budgets must be nonnegative whole numbers; 0 means no LDM cutoff.');return n===0?Infinity:n;}
/* Colour-mask thinning and graph routing. Every connector follows an ink edge. */
function traceCentreline(mask,w,h,label,branches,spur,emit,limit=180000){
 const stride=w+2,pixels=new Uint8Array((w+2)*(h+2)),positions=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]===label){const p=(y+1)*stride+x+1;pixels[p]=1;positions.push(p);}
 const offsets=[-stride,-stride+1,1,stride+1,stride,stride-1,-1,-stride-1];
 let changed=true,iterations=0;
 while(changed){changed=false;if(++iterations>w+h+2)throw Error('Centreline thinning did not converge. Lower DETAIL.');
  for(let pass=0;pass<2;pass++){const remove=[];
   for(const p of positions){if(!pixels[p])continue;const n=offsets.map(d=>pixels[p+d]);let count=0,transitions=0;for(let i=0;i<8;i++){count+=n[i];if(!n[i]&&n[(i+1)%8])transitions++;}
    if(count<2||count>6||transitions!==1)continue;
    if(pass===0?(n[0]*n[2]*n[4]||n[2]*n[4]*n[6]):(n[0]*n[2]*n[6]||n[0]*n[4]*n[6]))continue;
    remove.push(p);
   }if(remove.length){changed=true;for(const p of remove)pixels[p]=0;}
  }
 }
 // Avoid diagonal shortcuts through an already connected orthogonal corner.
 const neighbours=p=>{const out=[];for(let i=0;i<8;i++){const q=p+offsets[i];if(!pixels[q])continue;if(i%2&&(pixels[p+offsets[(i+7)%8]]||pixels[p+offsets[(i+1)%8]]))continue;out.push(q);}return out;};
 if(spur>0){for(let pass=0;pass<4;pass++){const remove=new Set();for(const p of positions){if(!pixels[p]||neighbours(p).length!==1)continue;const path=[p];let prev=-1,current=p,length=0;
   while(length<=spur){const next=neighbours(current).filter(q=>q!==prev);if(next.length!==1)break;const q=next[0],step=(Math.abs(q-current)===1||Math.abs(q-current)===stride)?1:Math.SQRT2;length+=step;const degree=neighbours(q).length;if(degree>=3){if(length<=spur)for(const v of path)remove.add(v);break;}if(degree!==2)break;path.push(q);prev=current;current=q;}
  }if(!remove.size)break;for(const p of remove)pixels[p]=0;}}
 const ids=positions.filter(p=>pixels[p]),index=new Int32Array(pixels.length);index.fill(-1);if(ids.length>Math.max(1,Math.floor(limit/2)))throw Error('Centreline is too detailed. Raise MAX POINTS, lower DETAIL or raise MIN REGION.');ids.forEach((p,i)=>index[p]=i);
 const adj=ids.map(()=>[]),edges=[];for(let v=0;v<ids.length;v++)for(const q of neighbours(ids[v])){const u=index[q];if(u<=v)continue;if(edges.length>=limit)throw Error('Centreline has too many branches. Raise MAX POINTS or lower DETAIL.');const e=edges.length;edges.push([v,u]);adj[v].push(e);adj[u].push(e);}
 const point=v=>{const p=ids[v];return [(p%stride)-.5,Math.floor(p/stride)-.5];},other=(edge,v)=>edges[edge][0]===v?edges[edge][1]:edges[edge][0];
 const simplify=path=>{const out=[];for(const p of path){if(out.length>1){const a=out.at(-2),b=out.at(-1),ax=b[0]-a[0],ay=b[1]-a[1],bx=p[0]-b[0],by=p[1]-b[1];if(ax*by===ay*bx&&ax*bx+ay*by>0)out.pop();}out.push(p);}return out;};
 const stats={components:0,junctions:adj.filter(a=>a.length>2).length,retracedEdges:0,isolatedDots:0,paths:0,skeletonPixels:ids.length};
 const output=vertices=>{emit(simplify(vertices.map(point)));stats.paths++;};
 if(branches==='lift'){
  const used=new Uint8Array(edges.length);const walk=(start,first)=>{const path=[start];let v=start,e=first;
   while(!used[e]){used[e]=1;v=other(e,v);path.push(v);if(adj[v].length!==2)break;const next=adj[v].find(q=>!used[q]);if(next===undefined)break;e=next;}output(path);
  };
  for(const v of ids.map((_,i)=>i).filter(i=>adj[i].length!==2).sort((a,b)=>(adj[a].length===1?0:1)-(adj[b].length===1?0:1)||a-b))for(const e of adj[v])if(!used[e])walk(v,e);
  for(let e=0;e<edges.length;e++)if(!used[e])walk(edges[e][0],e);
 }
 // Discover components and a spanning tree once. Parity balancing duplicates
 // only existing tree edges, then an Euler walk covers every edge continuously.
 const seen=new Uint8Array(ids.length),parent=new Int32Array(ids.length),parentEdge=new Int32Array(ids.length),remaining=new Uint8Array(edges.length),cursor=new Uint8Array(ids.length),mismatch=new Uint8Array(ids.length);parent.fill(-1);
 for(let root=0;root<ids.length;root++){
  if(seen[root])continue;stats.components++;const order=[root];seen[root]=1;
  for(let i=0;i<order.length;i++){const v=order[i];for(const e of adj[v]){const u=other(e,v);if(!seen[u]){seen[u]=1;parent[u]=v;parentEdge[u]=e;order.push(u);}}}
  if(!adj[root].length){const [x,y]=point(root);emit([[x-.15,y],[x+.15,y]]);stats.isolatedDots++;stats.paths++;continue;}
  if(branches==='lift')continue;
  const odd=order.filter(v=>adj[v].length%2),far=(from,items)=>{const p=point(from);let best=items[0],distance=-1;for(const v of items){const q=point(v),d=(q[0]-p[0])**2+(q[1]-p[1])**2;if(d>distance){distance=d;best=v;}}return best;};
  const start=odd.length?far(odd[0],odd):root,end=odd.length?far(start,odd):start;
  for(const v of order){mismatch[v]=(adj[v].length%2)^((v===start&&start!==end)||(v===end&&start!==end)?1:0);for(const e of adj[v])remaining[e]=1;}
  for(let i=order.length-1;i>0;i--){const v=order[i];if(mismatch[v]){remaining[parentEdge[v]]++;stats.retracedEdges++;mismatch[parent[v]]^=1;}}
  if(mismatch[root])throw Error('Centreline branch routing failed. Try LIFT AT BRANCHES.');
  let steps=0;for(const v of order)for(const e of adj[v])steps+=remaining[e];steps=steps/2+1;if(steps>limit)throw Error('Continuous centreline is too dense. Raise MAX POINTS, lower DETAIL or choose LIFT AT BRANCHES.');
  const stack=[start],route=[];while(stack.length){const v=stack.at(-1);while(cursor[v]<adj[v].length&&!remaining[adj[v][cursor[v]]])cursor[v]++;if(cursor[v]===adj[v].length)route.push(stack.pop());else{const e=adj[v][cursor[v]];remaining[e]--;stack.push(other(e,v));}}
  route.reverse();if(route.length!==steps||route.at(-1)!==end)throw Error('Centreline is incomplete. Try LIFT AT BRANCHES.');output(route);
 }
 return stats;
}

 root.ldmVectorTclTraceCentreline=traceCentreline;
 // Iterative, bounded-deviation polyline cleanup in output millimetres.
 function cleanOutline(path,tolerance){
  if(!(tolerance>0)||path.length<3)return path;
  const distance2=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return (p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;};
  function simplify(points){if(points.length<3)return points;const keep=new Uint8Array(points.length),stack=[[0,points.length-1]],limit=tolerance*tolerance;keep[0]=keep[points.length-1]=1;while(stack.length){const [a,b]=stack.pop();let far=-1,max=limit;for(let i=a+1;i<b;i++){const d=distance2(points[i],points[a],points[b]);if(d>max){max=d;far=i;}}if(far>=0){keep[far]=1;stack.push([a,far],[far,b]);}}return points.filter((_,i)=>keep[i]);}
  const first=path[0],last=path.at(-1),closed=first[0]===last[0]&&first[1]===last[1];if(!closed)return simplify(path);
  let split=1,best=-1;for(let i=1;i<path.length-1;i++){const d=(path[i][0]-first[0])**2+(path[i][1]-first[1])**2;if(d>best){best=d;split=i;}}
  const a=simplify(path.slice(0,split+1)),b=simplify(path.slice(split)),out=a.slice(0,-1).concat(b);
  const area=p=>{let n=0;for(let i=1;i<p.length;i++)n+=p[i-1][0]*p[i][1]-p[i][0]*p[i-1][1];return n;};
  if(out.length<4||Math.abs(area(out))<1e-12||Math.sign(area(out))!==Math.sign(area(path)))return path;
  return out;
 }
 root.ldmVectorTclSimplifyOutline=cleanOutline;
 // Corner-aware cubic interpolation, sampled to the selected chord-error tolerance.
 function smoothOutline(path,softness,quality,cornerAngle,maxPoints=Infinity,box=null){
  if(path.length<3||!(softness>0))return path;
  const same=(a,b)=>a[0]===b[0]&&a[1]===b[1],closed=same(path[0],path.at(-1));let pts=path.filter((p,i)=>!i||!same(p,path[i-1]));if(closed)pts=pts.slice(0,-1);if(pts.length<(closed?3:2))return path;
  const count=pts.length,sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],norm=v=>Math.hypot(...v),dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
  const tangents=pts.map((p,i)=>{
   if(!closed&&(i===0||i===count-1))return null;
   const prev=pts[(i+count-1)%count],next=pts[(i+1)%count],a=sub(p,prev),b=sub(next,p),la=norm(a),lb=norm(b);if(!la||!lb)return null;
   const u=a.map(v=>v/la),v=b.map(n=>n/lb),turn=Math.acos(Math.max(-1,Math.min(1,dot(u,v))))*180/Math.PI;if(turn>=cornerAngle)return null;
   let t=[u[0]+v[0],u[1]+v[1]],length=norm(t);if(!length)return null;t=t.map(n=>n/length*Math.min(la,lb)/3);
   const du=Math.abs(cross(t,u)),dv=Math.abs(cross(t,v));let factor=Math.min(1,du>1e-12?softness/du:1,dv>1e-12?softness/dv:1);
   // Parallel tangents have zero deviation and need no reduction.
   if(Math.abs(cross(t,u))<1e-12&&Math.abs(cross(t,v))<1e-12)factor=1;
   if(box)for(let axis=0;axis<2;axis++)if(Math.abs(t[axis])>1e-12)factor=Math.min(factor,Math.max(0,Math.min(p[axis],(axis?box.height:box.width)-p[axis]))/Math.abs(t[axis]));
   return t.map(n=>n*factor);
  });
  const out=[pts[0].slice()],distance2=(p,a,b)=>{const d=sub(b,a),l=dot(d,d),t=Math.max(0,Math.min(1,dot(sub(p,a),d)/(l||1)));return (p[0]-a[0]-t*d[0])**2+(p[1]-a[1]-t*d[1])**2;},mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  for(let i=0;i<(closed?count:count-1);i++){
   const j=(i+1)%count,a=pts[i],b=pts[j],d=sub(b,a),t=tangents[i]||d.map(n=>n/3),u=tangents[j]||d.map(n=>n/3),c=[a[0]+t[0],a[1]+t[1]],e=[b[0]-u[0],b[1]-u[1]],stack=[[a,c,e,b,0]];
   while(stack.length){const [p,q,r,s,depth]=stack.pop();if(Math.max(distance2(q,p,s),distance2(r,p,s))<=quality*quality){out.push(s.map(n=>+n.toFixed(5)));if(out.length>maxPoints)throw Error('Smoothed outline exceeds MAX POINTS. Raise the budget or use coarser CURVE QUALITY.');continue;}if(depth>=20)throw Error('Curve sampling could not meet CURVE QUALITY. Use a larger error value.');const pq=mid(p,q),qr=mid(q,r),rs=mid(r,s),x=mid(pq,qr),y=mid(qr,rs),m=mid(x,y);stack.push([m,y,rs,s,depth+1],[p,pq,x,m,depth+1]);}
  }
  if(closed)out[out.length-1]=out[0].slice();else out[out.length-1]=pts.at(-1).slice();return out;
 }
 root.ldmVectorTclSmoothOutline=smoothOutline;
 function trace(input){
  const LIMIT=budget(input.maxPoints,180000),MAX_STROKES=budget(input.maxStrokes,60000),lineCleanup=input.lineCleanup===undefined?0:Number(input.lineCleanup);if(!Number.isFinite(lineCleanup)||lineCleanup<0||lineCleanup>5)throw Error('OUTLINE cleanup must be between 0 and 5 mm (0 = exact trace).');
  const {width:w,height:h,paperWidth:pw,paperHeight:ph}=input,rgba=input.rgba instanceof Uint8ClampedArray?input.rgba:new Uint8ClampedArray(input.rgba);
  const smoothing=!!input.smoothCurves&&['outline','both'].includes(input.style),curveTolerance=input.curveTolerance===undefined?.2:Number(input.curveTolerance),curveQuality=input.curveQuality===undefined?.03:Number(input.curveQuality),curveCorner=input.curveCorner===undefined?55:Number(input.curveCorner);if(smoothing&&(![curveTolerance,curveQuality,curveCorner].every(Number.isFinite)||curveTolerance<0||curveTolerance>5||curveQuality<.001||curveQuality>1||curveCorner<10||curveCorner>170))throw Error('Check curve softness (0–5 mm), quality (0.001–1 mm) and corner angle (10–170 degrees).');
  const colours=Number(input.colours),gap=Number(input.gap),margin=Number(input.margin),angle=Number(input.angle),minRegion=Number(input.minRegion),style=input.style;
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>2147483647||!Number.isSafeInteger(w*h*4)||rgba.length!==w*h*4)throw Error('Invalid image sample dimensions or RGBA buffer.');
  if(![pw,ph,gap,margin,angle].every(Number.isFinite)||pw<=0||ph<=0||pw>2500||ph>2500||gap<.15||gap>10||margin<0||margin*2>=Math.min(pw,ph)||angle<0||angle>180||!Number.isInteger(colours)||colours<2||colours>12||!Number.isInteger(minRegion)||minRegion<0||minRegion>100||!['hatch','outline','both','centreline'].includes(style))throw Error('Check colour count, paper size, margin and trace settings.');
  const branches=input.branches??'retrace',spur=input.spur===undefined?2:Number(input.spur);if(style==='centreline'&&(!['retrace','lift'].includes(branches)||!Number.isFinite(spur)||spur<0||spur>20))throw Error('Check centreline branch and spur settings.');
  const hist=new Map(),pixelKeys=new Int32Array(w*h);pixelKeys.fill(-1);
  for(let i=0;i<w*h;i++){const n=i*4,a=rgba[n+3]/255;if(a<.1)continue;const c=[0,1,2].map(j=>Math.round(rgba[n+j]*a+255*(1-a)));if(input.skipWhite&&Math.min(...c)>=245)continue;const k=(c[0]>>3)*1024+(c[1]>>3)*32+(c[2]>>3);pixelKeys[i]=k;let b=hist.get(k);if(!b){b={n:0,c:[0,0,0],key:k};hist.set(k,b)}b.n++;for(let j=0;j<3;j++)b.c[j]+=c[j];}
  const bins=[...hist.values()];if(!bins.length)throw Error('No drawable colours. Try turning off SKIP WHITE or use a different image.');
  for(const b of bins)b.c=b.c.map(v=>v/b.n);bins.sort((a,b)=>b.n-a.n||a.key-b.key);
  const dist=(a,b)=>a.reduce((sum,v,i)=>sum+(v-b[i])**2,0),centres=[bins[0].c.slice()];
  while(centres.length<Math.min(colours,bins.length)){let best=null,score=-1;for(const b of bins){const d=Math.min(...centres.map(c=>dist(c,b.c))),s=d*b.n;if(s>score){score=s;best=b}}if(score<1e-8)break;centres.push(best.c.slice());}
  const nearest=c=>{let best=0,d=Infinity;for(let i=0;i<centres.length;i++){const v=dist(c,centres[i]);if(v<d){d=v;best=i}}return best;};
  for(let iteration=0;iteration<10;iteration++){const sums=centres.map(()=>({n:0,c:[0,0,0]}));for(const b of bins){const s=sums[nearest(b.c)];s.n+=b.n;for(let j=0;j<3;j++)s.c[j]+=b.c[j]*b.n;}let change=0;for(let i=0;i<centres.length;i++)if(sums[i].n){const c=sums[i].c.map(v=>v/sums[i].n);change+=dist(c,centres[i]);centres[i]=c;}if(change<.01)break;}
  // Use the most common sampled tone in each cluster, so antialiased edges
  // do not wash out the intended pen colours.
  const representatives=centres.map((c,i)=>bins.find(b=>nearest(b.c)===i)?.c.slice()||c);for(let i=0;i<centres.length;i++)centres[i]=representatives[i];
  const assignments=new Map(bins.map(b=>[b.key,nearest(b.c)])),mask=new Int16Array(w*h);for(let i=0;i<mask.length;i++)mask[i]=pixelKeys[i]<0?-1:assignments.get(pixelKeys[i]);
  if(minRegion>1){const seen=new Uint8Array(mask.length),queue=new Int32Array(mask.length);for(let i=0;i<mask.length;i++){if(mask[i]<0||seen[i])continue;const colour=mask[i];let end=1;queue[0]=i;seen[i]=1;for(let start=0;start<end;start++){const p=queue[start],x=p%w,y=(p/w)|0;for(const q of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1,...(style==='centreline'?[x&&y?p-w-1:-1,x<w-1&&y?p-w+1:-1,x&&y<h-1?p+w-1:-1,x<w-1&&y<h-1?p+w+1:-1]:[])])if(q>=0&&!seen[q]&&mask[q]===colour){seen[q]=1;queue[end++]=q;}}if(end<minRegion)for(let j=0;j<end;j++)mask[queue[j]]=-1;}}
  const scale=Math.min((pw-2*margin)/w,(ph-2*margin)/h),ox=(pw-w*scale)/2,oy=(ph-h*scale)/2;
  const layers=centres.map(c=>({colour:'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''),paths:[],pixels:0}));for(const v of mask)if(v>=0)layers[v].pixels++;
  let points=0,strokes=0;const add=(label,path,outline=false)=>{if(path.length<2)return;const mapped=path.map(p=>[+(ox+p[0]*scale).toFixed(5),+(oy+p[1]*scale).toFixed(5)]);let cleaned=outline?cleanOutline(mapped,lineCleanup):mapped;if(outline&&smoothing)cleaned=smoothOutline(cleaned,curveTolerance,curveQuality,curveCorner,LIMIT-points,{width:pw,height:ph});points+=cleaned.length;strokes++;if(points>LIMIT||strokes>MAX_STROKES)throw Error(style==='centreline'?'Centreline is too dense. Lower DETAIL or choose LIFT AT BRANCHES. Raise MAX POINTS / MAX STROKES to allow more output. Nothing was added to CANVAS.':'Trace is too dense. Increase hatch GAP, lower DETAIL or use fewer colours. Raise MAX POINTS / MAX STROKES to allow more output. Nothing was added to CANVAS.');layers[label].paths.push(cleaned);};
  function hatch(degrees){const a=degrees*Math.PI/180,dx=Math.abs(Math.cos(a))<1e-10?0:Math.cos(a),dy=Math.abs(Math.sin(a))<1e-10?0:Math.sin(a),nx=-dy,ny=dx,projections=[0,nx*w,ny*h,nx*w+ny*h],lo=Math.min(...projections),hi=Math.max(...projections),step=gap/scale;
   if((hi-lo)/step>Math.max(1,MAX_STROKES/3))throw Error('Too many hatch rows. Raise MAX STROKES or increase GAP.');
   for(let offset=lo+step/2;offset<hi;offset+=step){const bx=nx*offset,by=ny*offset;let t0=-Infinity,t1=Infinity;for(const [base,dir,max] of [[bx,dx,w],[by,dy,h]]){if(!dir){if(base<0||base>max){t1=-Infinity;break}}else{const u=-base/dir,v=(max-base)/dir;t0=Math.max(t0,Math.min(u,v));t1=Math.min(t1,Math.max(u,v));}}if(t1-t0<1e-8)continue;
    let t=t0,label=-1,start=t0,guard=0;const point=t=>[bx+dx*t,by+dy*t];
    while(t<t1-1e-9){if(++guard>w+h+4)throw Error('Hatch traversal failed. Try another angle.');const eps=Math.min(1e-7,(t1-t)/4),p=point(t+eps),x=Math.max(0,Math.min(w-1,Math.floor(p[0]))),y=Math.max(0,Math.min(h-1,Math.floor(p[1]))),colour=mask[y*w+x];
     if(colour!==label){if(label>=0&&t-start>1e-8)add(label,[point(start),point(t)]);label=colour;start=t;}
     const tx=dx?((dx>0?x+1:x)-bx)/dx:Infinity,ty=dy?((dy>0?y+1:y)-by)/dy:Infinity,next=Math.min(t1,tx>t+1e-10?tx:Infinity,ty>t+1e-10?ty:Infinity);if(!Number.isFinite(next)||next<=t)throw Error('Invalid hatch boundary.');t=next;
    }if(label>=0&&t1-start>1e-8)add(label,[point(start),point(t1)]);
   }
  }
  if(style==='hatch'||style==='both'){hatch(angle);if(input.cross)hatch((angle+90)%180);}
  if(style==='outline'||style==='both'){
   for(let label=0;label<layers.length;label++){if(!layers[label].pixels)continue;const edges=[],at=new Map();const edge=(x,y,u,v,d)=>{if(edges.length>Math.ceil(LIMIT*5/3))throw Error('Outline is too detailed. Raise MAX POINTS, lower DETAIL or increase MIN REGION.');const e={x,y,u,v,d,used:false};edges.push(e);const key=y*(w+1)+x;if(!at.has(key))at.set(key,[]);at.get(key).push(e);};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(mask[y*w+x]!==label)continue;if(!y||mask[(y-1)*w+x]!==label)edge(x,y,x+1,y,0);if(x===w-1||mask[y*w+x+1]!==label)edge(x+1,y,x+1,y+1,1);if(y===h-1||mask[(y+1)*w+x]!==label)edge(x+1,y+1,x,y+1,2);if(!x||mask[y*w+x-1]!==label)edge(x,y+1,x,y,3);}
    for(const first of edges){if(first.used)continue;let e=first,path=[[e.x,e.y]],guard=0;while(e&&!e.used){e.used=true;const p=[e.u,e.v];if(path.length>1){const a=path.at(-2),b=path.at(-1);if((b[0]-a[0])*(p[1]-b[1])===(b[1]-a[1])*(p[0]-b[0]))path.pop();}path.push(p);if(e.u===first.x&&e.v===first.y)break;const options=(at.get(e.v*(w+1)+e.u)||[]).filter(q=>!q.used),priority=[(e.d+1)%4,e.d,(e.d+3)%4,(e.d+2)%4];e=options.sort((a,b)=>priority.indexOf(a.d)-priority.indexOf(b.d))[0];if(++guard>edges.length)throw Error('Invalid outline contour.');}add(label,path,true);}
   }
  }
  let centreline;if(style==='centreline'){centreline={components:0,junctions:0,retracedEdges:0,isolatedDots:0,paths:0,skeletonPixels:0};for(let label=0;label<layers.length;label++)if(layers[label].pixels){const stats=traceCentreline(mask,w,h,label,branches,spur,path=>add(label,path),LIMIT);for(const key of Object.keys(centreline))centreline[key]+=stats[key];}}
  const unique=new Map();for(const layer of layers)if(layer.paths.length){const prior=unique.get(layer.colour);if(prior){for(const path of layer.paths)prior.paths.push(path);prior.pixels+=layer.pixels;}else unique.set(layer.colour,layer);}const output=[...unique.values()].sort((a,b)=>b.pixels-a.pixels||a.colour.localeCompare(b.colour));if(!output.length)throw Error('No drawable paths. Lower MIN REGION or GAP.');return {width:pw,height:ph,layers:output,points,strokes,sampleWidth:w,sampleHeight:h,...(centreline?{centreline}:{} )};
 }
 root.ldmVectorTclTrace=trace;
 if(typeof document==='undefined'&&typeof root.postMessage==='function')root.onmessage=e=>{try{root.postMessage({ok:true,result:trace(e.data)})}catch(error){root.postMessage({ok:false,error:error.message})}};
})(typeof self==='undefined'?globalThis:self);
