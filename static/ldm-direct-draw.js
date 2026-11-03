/* Direct DRAW ledger: reservation precedes any network submission. No motion APIs. */
(()=>{'use strict';
 const KEY='ldmV9DirectDrawLedger';let ledger={};
 try{ledger=JSON.parse(localStorage.getItem(KEY)||'{}');if(!ledger||typeof ledger!=='object'||Array.isArray(ledger))throw Error();}catch{ledger=null;}
 function persist(){if(!ledger)throw Error('Drawing send history is unreadable. Restore browser storage before direct drawing.');localStorage.setItem(KEY,JSON.stringify(ledger));}
 window.ldmDirectDraw={
  capture(settings,options={}){
   if(!ledger)throw Error('Drawing send history is unreadable. Direct drawing is blocked.');
   const snap=window.ldmCaptureDrawJobCanvas?.({direct:true,inspect:!!options.inspect});if(!snap)throw Error('DRAW / WRITE preview is unavailable.');
   if(Math.abs(snap.width-settings.width)>.05||Math.abs(snap.height-settings.height)>.05)throw Error('Paper dimensions changed. End the direct session and complete setup again.');
   const unique=new Map(),geometries=new Set(Object.values(ledger).map(v=>v.geometry));
   let excluded=0;
   for(const stroke of snap.directStrokes){const geometry=JSON.stringify(stroke.path);if(ledger[stroke.id]||geometries.has(geometry)){excluded++;continue;}if(!unique.has(stroke.id)){unique.set(stroke.id,{...stroke,geometry});geometries.add(geometry);}}
   const strokes=[...unique.values()];if(!options.inspect&&!strokes.length)throw Error('No new strokes to write. Already accepted / uncertain strokes stay excluded. Draw a new stroke.');
   const budget={strokes:strokes.reduce((n,s)=>n+(s.passes||1),0),points:strokes.reduce((n,s)=>n+s.path.length*(s.passes||1),0)};if(!options.inspect&&(budget.strokes>500||budget.points>10000))throw Error('Current drawing: '+budget.strokes+' / 500 strokes · '+budget.points+' / 10,000 points. Hide unneeded layers or simplify the drawing first.');
   return {strokes,excluded,budget,paths:strokes.map(s=>s.path),stroke_ids:strokes.map(s=>s.id),stroke_passes:strokes.map(s=>s.passes||1)};
  },
  reserve(snapshot,request){if(Object.keys(ledger).length+snapshot.strokes.length>10000)throw Error('Drawing history limit reached. Save your artwork before starting a fresh browser workspace.');for(const s of snapshot.strokes)ledger[s.id]={request,geometry:s.geometry,state:'RESERVED'};persist();},
  rejected(request){for(const [id,s]of Object.entries(ledger||{}))if(s.request===request&&s.state==='RESERVED')delete ledger[id];persist();},
  complete(request){for(const s of Object.values(ledger||{}))if(s.request===request)s.state='WRITTEN';persist();},
  count(){return Object.keys(ledger||{}).length;}
 };
})();
