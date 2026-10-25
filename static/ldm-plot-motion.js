/* GUI.58: shared plot motion builder for machine jobs and read-only simulation. */
(()=>{'use strict';
 window.ldmThinPlotPaths=paths=>paths.map(path=>{if(path.length<=2)return path.map(p=>[...p]);const out=[[...path[0]]];for(let i=1;i<path.length-1;i++)if(Math.hypot(path[i][0]-out.at(-1)[0],path[i][1]-out.at(-1)[1])>=.12)out.push([...path[i]]);const p=path.at(-1),q=out.at(-1);if(p[0]!==q[0]||p[1]!==q[1])out.push([...p]);return out;});
 window.ldmBuildPlotMotion=function({paths:pp,pw,ph,isVinyl,lift,cutDepth,zf,df,tf,liftDuring,endPos,endClearance,meshOn=false,meshAt=()=>0,meshCeiling=0,colourPlan=null}){
  if(!Array.isArray(pp)||!pp.some(p=>p.length>1)||!(pw>0&&ph>0))throw Error('Place drawable artwork on CANVAS first.');
  for(const p of pp)for(const q of p)if(q.length<2||!q.every(Number.isFinite)||q[0]<-.02||q[0]>pw+.02||q[1]<-.02||q[1]>ph+.02)throw Error('Plot artwork exceeds CANVAS bounds.');
  if(![lift,cutDepth,zf,df,tf,endClearance,meshCeiling].every(Number.isFinite)||lift<0||cutDepth<0||Math.min(zf,df,tf)<=0||endClearance<.001||endClearance>256||endClearance<meshCeiling+.001)throw Error('END Z LIFT must be positive, at most 256 mm, and above the highest saved mesh surface. Check lift and speed values.');
  if(!['topLeft','center'].includes(endPos))throw Error('Choose a valid plot end position.');
  const zMeshDeltaAt=(x,y)=>{const n=meshOn?meshAt(x,y):0;if(!Number.isFinite(n))throw Error('Invalid mesh height.');return n;};
 let g=['G91'];
 let cur=[0,0], penIsUp=false;
 let meshDelta=0; // START is the taught BED/PLATE CENTER contact plane.

 const drawable=pp.filter(path=>path && path.length>=2);
 for(let pi=0;pi<drawable.length;pi++){
   const path=drawable[pi];
   if(colourPlan?.starts.has(pi)){
     const name=colourPlan.starts.get(pi);
     if(pi>0){window.ldmVectorColourPause(g,name,lift,zf,penIsUp);penIsUp=true;}
     else g.push('; LDM FIRST PEN - '+name);
   }
   // Lift is always relative to the LOCAL compensated surface.
   if(liftDuring && !penIsUp){
     const upAmount=(isVinyl && pi>0)?(lift+cutDepth):lift;
     g.push('G91');g.push(`G1 Z${upAmount.toFixed(3)} F${zf}`);g.push('M400');penIsUp=true;
   }
   const first=[path[0][0]-pw/2,-(path[0][1]-ph/2)];
   const firstDelta=meshOn?zMeshDeltaAt(first[0],first[1],pw,ph):0;
   const travelDz=firstDelta-meshDelta;
   if(meshOn && Math.abs(travelDz)>0.0005)
     g.push(`G1 X${(first[0]-cur[0]).toFixed(3)} Y${(first[1]-cur[1]).toFixed(3)} Z${travelDz.toFixed(3)} F${tf}`);
   else
     g.push(`G1 X${(first[0]-cur[0]).toFixed(3)} Y${(first[1]-cur[1]).toFixed(3)} F${tf}`);
   cur=first;meshDelta=firstDelta;g.push('M400');
   if(liftDuring){
     const downAmount=isVinyl?(lift+cutDepth):lift;
     g.push('G91');g.push(`G1 Z${(-downAmount).toFixed(3)} F${zf}`);g.push('M400');penIsUp=false;
   }
   for(let i=1;i<path.length;i++){
     const q=[path[i][0]-pw/2,-(path[i][1]-ph/2)];
     const qDelta=meshOn?zMeshDeltaAt(q[0],q[1],pw,ph):0;
     const dz=qDelta-meshDelta;
     if(meshOn && Math.abs(dz)>0.0005)
       g.push(`G1 X${(q[0]-cur[0]).toFixed(3)} Y${(q[1]-cur[1]).toFixed(3)} Z${dz.toFixed(3)} F${df}`);
     else
       g.push(`G1 X${(q[0]-cur[0]).toFixed(3)} Y${(q[1]-cur[1]).toFixed(3)} F${df}`);
     cur=q;meshDelta=qDelta;
   }
   g.push('M400');
 }

 // End-of-plot behavior is explicit and independent of inter-path pen lift.
 // Top Left means preview/paper top-left relative to taught BED/PLATE CENTER:
 // X=-paperW/2, Y=+paperH/2 in the established preview-corrected machine mapping.
 // One vertical move to an independent fixed clearance plane, then XY only.
 const finalDz=endClearance-meshDelta-(penIsUp?lift:-cutDepth);
 if(!(finalDz>0))throw Error('END Z LIFT must raise the tool above its final cutting/contact position.');
 g.push('; LDM END Z LIFT '+endClearance.toFixed(3)+' ABOVE SURFACE Z');
 g.push('G91');g.push(`G1 Z${finalDz.toFixed(3)} F${zf}`);g.push('M400');penIsUp=true;meshDelta=0;
 if(endPos==='topLeft'){
   const target=[-pw/2,ph/2];
   const targetDelta=0;
   const dz=targetDelta-meshDelta;
   g.push('G91');
   g.push(`G1 X${(target[0]-cur[0]).toFixed(3)} Y${(target[1]-cur[1]).toFixed(3)}${meshOn&&Math.abs(dz)>0.0005?' Z'+dz.toFixed(3):''} F${tf}`);
   g.push('M400');cur=target;meshDelta=targetDelta;
 }
 if(endPos==='center'){
   const target=[0,0];
   const targetDelta=0;
   const dz=targetDelta-meshDelta;
   g.push('G91');
   g.push(`G1 X${(target[0]-cur[0]).toFixed(3)} Y${(target[1]-cur[1]).toFixed(3)}${meshOn&&Math.abs(dz)>0.0005?' Z'+dz.toFixed(3):''} F${tf}`);
   g.push('M400');cur=target;meshDelta=targetDelta;
 }
 // Save the generated physical endpoint relative to BED/PLATE CENTER.

 // PEN UP deliberately remains lifted; STAY AS IS adds no final Z move.

 g.unshift('M104 S0','M140 S0');return {gcode:g.join('\n'),lines:g,end:{x:cur[0],y:cur[1],z:endClearance,endPos}};

 };
})();
