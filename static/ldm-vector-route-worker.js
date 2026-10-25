/* Deterministic nearest-endpoint routing. No new pen-down connector is created. */
(()=>{'use strict';
const exact=(a,b)=>a[0]===b[0]&&a[1]===b[1],distance=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
function optimise(paths,s){
 if(!Array.isArray(paths)||!paths.length||paths.some(p=>p.length<2))throw Error('Each optimised path must have at least two points.');
 const cost=rr=>{let n=0;for(let i=1;i<rr.length;i++)n+=Math.hypot(rr[i][0][0]-rr[i-1].at(-1)[0],rr[i][0][1]-rr[i-1].at(-1)[1]);return n;};
 const copy=p=>p.map(q=>q.slice()),closed=p=>p.length>2&&exact(p[0],p.at(-1)),records=paths.map((p,i)=>({p,i,closed:closed(p),nodes:[],used:false}));
 // Preserve the first/last paths exactly so transitions between layers and the
 // original job entry/exit are unaffected, even when only some layers are selected.
 const fixed=new Set([0,paths.length-1]),candidates=[],waiting=[];
 function choices(r){if(r.closed&&s.moveSeam)return r.p.slice(0,-1).map((p,v)=>({p,r,v,reverse:false}));const out=[{p:r.p[0],r,v:0,reverse:false}];if(!r.closed&&s.reverseOpen)out.push({p:r.p.at(-1),r,v:r.p.length-1,reverse:true});return out;}
 for(const r of records)if(!fixed.has(r.i)){if(r.closed&&s.preserveClosed)waiting.push(r);else for(const c of choices(r))candidates.push(c);}
 const tie=(a,b)=>a.r.i-b.r.i||a.v-b.v||Number(a.reverse)-Number(b.reverse);
 function build(list,depth=0,parent=null){if(!list.length)return null;const axis=depth%2;list.sort((a,b)=>a.p[axis]-b.p[axis]||tie(a,b));const mid=list.length>>1,node={c:list[mid],axis,parent,count:list.length};node.c.r.nodes.push(node);node.left=build(list.slice(0,mid),depth+1,node);node.right=build(list.slice(mid+1),depth+1,node);return node;}
 const root=build(candidates);let current=paths[0].at(-1),queue=0;const route=[copy(paths[0])];
 function nearest(q){let best=null,dist=Infinity;function consider(c){const d=distance(q,c.p);if(d<dist||(d===dist&&(!best||tie(c,best)<0))){best=c;dist=d;}}
  function visit(node){if(!node||node.count===0)return;if(!node.c.r.used)consider(node.c);const delta=q[node.axis]-node.c.p[node.axis],first=delta<=0?node.left:node.right,second=delta<=0?node.right:node.left;visit(first);if(delta*delta<=dist)visit(second);}
  visit(root);if(queue<waiting.length)for(const c of choices(waiting[queue]))consider(c);return best;
 }
 while(route.length<paths.length-1){const c=nearest(current);if(!c)throw Error('Path routing is incomplete. No artwork changed.');const r=c.r;r.used=true;for(const node of r.nodes)for(let p=node;p;p=p.parent)p.count--;if(waiting[queue]===r)queue++;
  const p=r.closed&&s.moveSeam?r.p.slice(c.v,-1).concat(r.p.slice(0,c.v),[r.p[c.v]]):c.reverse?r.p.slice().reverse():r.p;
  route.push(copy(p));current=p.at(-1);
 }
 if(paths.length>1)route.push(copy(paths.at(-1)));
 const before=cost(paths),candidate=cost(route);if(!Number.isFinite(before+candidate))throw Error('VECTOR coordinates exceed routing precision. Scale the artwork first.');let result=candidate<before-1e-9?route:paths.map(copy),after=cost(result),joined=0;
 if(s.joinTouching){const out=[];for(const p of result){const last=out.at(-1);if(last&&!closed(last)&&!closed(p)&&exact(last.at(-1),p[0])){for(let i=1;i<p.length;i++)last.push(p[i]);joined++;}else out.push(p);}result=out;}
 return {paths:result,travel:{before,after,saved:Math.max(0,before-after),joined,sourceStrokes:paths.length,resultStrokes:result.length}};
}
self.ldmVectorLayerOptimise=optimise;
})();
