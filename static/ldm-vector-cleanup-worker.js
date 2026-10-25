/* Reuse the same numeric line/curve algorithms as ART LAB VECTOR TCL. */
importScripts('ldm-vector-tcl-worker.js?v8gui80','ldm-vector-path-tools-worker.js?v8gui80','ldm-vector-route-worker.js?v8gui81','ldm-vector-small-paths-worker.js?v8gui87');
self.onmessage=e=>{try{
 const {layers,settings:s}=e.data||{};if(!Array.isArray(layers)||!layers.length)throw Error('Select VECTOR layers first.');
 for(const [key,min,max]of [['cleanup',0,5],['softness',0,5],['quality',.001,1],['corner',10,170]])if(!Number.isFinite(s?.[key])||s[key]<min||s[key]>max)throw Error('Check line cleanup and curve settings.');
 if(!Number.isSafeInteger(s.maxPoints)||s.maxPoints<0)throw Error('MAX POINTS must be a nonnegative whole number; 0 means no cutoff.');
 if(s.operation==='scan'||s.operation==='prune'){self.postMessage(self.ldmVectorSmallPaths(layers,s));return;}
 let points=0,sourcePoints=0;const limit=s.maxPoints||Infinity;
 const operation=s.operation||'cleanup';if(!['cleanup','centreline','dash','route'].includes(operation))throw Error('Choose a VECTOR path operation.');
 const output=layers.map(layer=>{if(!Array.isArray(layer.paths))throw Error('Invalid VECTOR geometry.');for(const path of layer.paths){if(!Array.isArray(path)||path.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw Error('Invalid VECTOR coordinates.');sourcePoints+=path.length;}
 const routed=operation==='route'?self.ldmVectorLayerOptimise(layer.paths,s):null;const paths=routed?routed.paths:operation==='dash'?self.ldmVectorLayerDashPaths(layer.paths,s):operation==='centreline'?self.ldmVectorLayerCentrePaths(layer.paths,s):layer.paths.map(path=>{let next=self.ldmVectorTclSimplifyOutline(path,s.cleanup);if(s.smooth)next=self.ldmVectorTclSmoothOutline(next,s.softness,s.quality,s.corner,limit-points);return next;});
 for(const path of paths)points+=path.length;if(points>limit)throw Error('Result exceeds MAX POINTS. Raise the budget, use coarser settings or enter 0.');if(!paths.length)throw Error('No drawable result. Change the settings.');return {paths,...(routed?{travel:routed.travel}:{})};});self.postMessage({ok:true,layers:output,points,sourcePoints,strokes:output.reduce((n,l)=>n+l.paths.length,0),...(operation==='route'?{travel:output.reduce((a,l)=>{for(const k of Object.keys(a))a[k]+=l.travel[k];return a;},{before:0,after:0,saved:0,joined:0})}:{})});
 }catch(error){self.postMessage({ok:false,error:error.message})}};
