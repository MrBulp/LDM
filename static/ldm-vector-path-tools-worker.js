/* Numeric selected-layer centreline masks and physical dash paths, in CANVAS mm. */
(()=>{'use strict';
const EPS=1e-9,same=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<EPS;
function dashPaths(paths,s){
 const pattern=s.pattern;if(!Array.isArray(pattern)||!pattern.length||pattern.length>6||pattern.length%2||pattern.some(n=>!Number.isFinite(n)||n<=0))throw Error('Enter one to three positive DASH / GAP pairs.');
 if(!Number.isFinite(s.offset))throw Error('Enter a finite DASH OFFSET.');
 const cycle=pattern.reduce((a,b)=>a+b,0),limit=s.maxPoints||Infinity;let count=0,output=[];
 const add=path=>{if(path.length<2)return;if((count+=path.length)>limit)throw Error('Dashes exceed MAX POINTS. Increase dash/gap lengths or the budget.');output.push(path)};
 for(const path of paths){
  let current=null,firstOutput=output.length;
  function run(a,b,state){const length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<EPS)return;let at=0;
   while(at<length-EPS){const take=Math.min(state.remaining,length-at);if(!(take>0)||at+take===at)throw Error('Dash lengths are too small for this geometry.');
    const point=t=>[a[0]+(b[0]-a[0])*t/length,a[1]+(b[1]-a[1])*t/length],p=point(at),q=point(at+take);
    if(state.i%2===0){if(!current)current=[p];else if(!same(current.at(-1),p)){add(current);current=[p]}current.push(q);}
    else if(current){add(current);current=null;}
    at+=take;state.remaining-=take;if(state.remaining<EPS*Math.min(1,state.pattern[state.i])){state.i=(state.i+1)%state.pattern.length;state.remaining=state.pattern[state.i];}
   }
  }
  function state(p,offset){const total=p.reduce((a,b)=>a+b,0);let phase=((offset%total)+total)%total,i=0;while(phase>=p[i]){phase-=p[i];i=(i+1)%p.length;}return {pattern:p,i,remaining:p[i]-phase};}
  if(s.align){for(let i=1;i<path.length;i++){const length=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);if(length<EPS)continue;const n=Math.max(1,Math.round(length/cycle)),factor=length/(n*cycle),p=pattern.map(v=>v*factor);run(path[i-1],path[i],state(p,p[0]/2));}}
  else {const st=state(pattern,s.offset);for(let i=1;i<path.length;i++)run(path[i-1],path[i],st);}
  if(current)add(current);
  // A closed contour can have one dash across its seam. Keep it one stroke.
  if(path.length>2&&same(path[0],path.at(-1))&&output.length-firstOutput>1){const first=output[firstOutput],last=output.at(-1);if(same(last.at(-1),first[0])){output[firstOutput]=last.concat(first.slice(1));output.pop();}}
 }
 return output;
}
function centrePaths(paths,s){
 if(!Number.isSafeInteger(s.detail)||s.detail<16)throw Error('CENTRELINE DETAIL must be a whole number of at least 16 px.');
 if(!['lift','retrace'].includes(s.branches)||!Number.isFinite(s.spur)||s.spur<0||s.spur>20||!['evenodd','nonzero'].includes(s.fillRule))throw Error('Check centreline branch, spur and fill settings.');
 const closed=[],open=[];for(const p of paths){if(p.length>3&&same(p[0],p.at(-1)))closed.push(p);else open.push(p.map(q=>q.slice()));}
 if(!closed.length)return open;
 let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;for(const p of closed)for(const [x,y]of p){minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);}
 const step=Math.max(maxx-minx,maxy-miny)/s.detail;if(!(step>0&&Number.isFinite(step)))throw Error('Closed outlines have no area.');
 const w=Math.ceil((maxx-minx)/step)+4,h=Math.ceil((maxy-miny)/step)+4,total=w*h;
 if(!Number.isSafeInteger(total)||total>2147483647)throw Error('Centreline sample is too large for the browser. Lower DETAIL.');
 const ox=minx-2*step,oy=miny-2*step,mask=new Int8Array(total);mask.fill(-1);const rows=new Map();
 for(const p of closed)for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];if(a[1]===b[1])continue;const low=Math.min(a[1],b[1]),high=Math.max(a[1],b[1]),start=Math.max(0,Math.ceil((low-oy)/step-.5)),end=Math.min(h,Math.ceil((high-oy)/step-.5));if(start>=end)continue;const edge={a,b,end,sign:b[1]>a[1]?1:-1};if(!rows.has(start))rows.set(start,[]);rows.get(start).push(edge);}
 let active=[],ink=0;
 for(let y=0;y<h;y++){active=active.filter(e=>e.end>y);for(const e of rows.get(y)||[])active.push(e);const yy=oy+(y+.5)*step,xs=active.map(e=>({x:e.a[0]+(yy-e.a[1])*(e.b[0]-e.a[0])/(e.b[1]-e.a[1]),sign:e.sign})).sort((a,b)=>a.x-b.x);let winding=0;
  for(let i=0;i<xs.length-1;i++){winding=s.fillRule==='evenodd'?1-winding:winding+xs[i].sign;if(!winding)continue;const left=Math.max(0,Math.ceil((xs[i].x-ox)/step-.5)),right=Math.min(w,Math.ceil((xs[i+1].x-ox)/step-.5));if(right>left){mask.fill(0,y*w+left,y*w+right);ink+=right-left;}}
 }
 if(!ink)throw Error('No filled outline region. Raise DETAIL or check closed outlines / fill rule.');
 const result=[];self.ldmVectorTclTraceCentreline(mask,w,h,0,s.branches,s.spur,p=>result.push(p.map(([x,y])=>[ox+x*step,oy+y*step])),s.maxPoints||Infinity);
 if(!result.length)throw Error('No centreline survived. Raise DETAIL or reduce SPUR removal.');return open.concat(result);
}
self.ldmVectorLayerDashPaths=dashPaths;self.ldmVectorLayerCentrePaths=centrePaths;
})();
