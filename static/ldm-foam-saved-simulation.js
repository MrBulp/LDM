/* Read-only stages from the checksum-verified executable saved on SD. */
(()=>{'use strict';window.ldmBuildSavedFoamSimulation=setup=>{
 if(!setup?.simulation_gcode||!setup.settings)throw Error('Saved executable is unavailable. Read the SD file again.');
 const s={...setup.settings},ft=s.foam_top_z+s.rod_length,tcm=s.clearance_z+s.rod_length,tcd=s.cut_z+s.rod_length;
 let pos=[0,0,ft],absolute=true,feed=s.machine_speed,total=0,outlineCount=0;const stages=[];
 function add(name,to,kind,seconds,unknown=false){if(stages.length>=25000)throw Error('Saved simulation exceeds 25,000 stages. File remains unchanged.');const points=[pos.slice(),to.slice()],length=Math.hypot(...to.map((v,i)=>v-pos[i])),duration=seconds??length/feed*60;stages.push({name,points,previewPoints:points.map(p=>[p[0],p[1],p[2]-s.rod_length]),kind,speed:feed,colour:'#df625c',duration,unknown,start:total,distances:new Float64Array([0,length])});total+=duration;pos=to.slice();}
 add('SAVED SD JOB · '+setup.filename,pos,'home',1,true);
 for(const raw of setup.simulation_gcode.split(/\r?\n/)){
  if(/^;\s*OUTLINE\b/i.test(raw))outlineCount++;
  const line=raw.split(';')[0].trim().toUpperCase();if(!line)continue;
  const command=line.split(/\s/)[0],args=Object.fromEntries([...line.matchAll(/([XYZFSPU])\s*([-+]?\d+(?:\.\d*)?)/g)].map(m=>[m[1],Number(m[2])]));
  if(command==='G90'){absolute=true;continue;}if(command==='G91'){absolute=false;continue;}
  if(command==='G0'||command==='G1'){
   if(args.F!==undefined){if(!(args.F>0))throw Error('Invalid saved movement feed.');feed=args.F;}
   if(!['X','Y','Z'].some(k=>args[k]!==undefined))continue;
   const to=pos.map((v,i)=>args['XYZ'[i]]===undefined?v:absolute?args['XYZ'[i]]:v+args['XYZ'[i]]);
   if(!to.every(Number.isFinite))throw Error('Invalid saved coordinate.');
   const cut=to[2]<=tcd+.001&&pos[2]<=tcd+.001;
   add('SAVED '+(cut?'CUT':'TRAVEL')+' · '+line,to,cut?'cut':'travel');
  }else if(command==='G4'){add('SAVED TIMED HOLD',pos,'hold',args.P!==undefined?args.P/1000:args.S||0);}
  else if(command==='M400'&&args.U===1)add('SAVED MACHINE PAUSE · manual duration unknown',pos,'hold',2,true);
  else if(command==='M109'&&args.S>0)add('SAVED HEATING · '+args.S+' °C · duration unknown',pos,'heat',2,true);
  else if(/^G/.test(command)&&!['G21'].includes(command))throw Error('Unsupported saved simulation command: '+command);
 }
 if(stages.length<2)throw Error('No saved movement to simulate.');
 return {stages,total,settings:s,canvas:{width:256,height:256},job:{ft,tcm,tcd},outlineCount,entryMode:s.entry_mode||'slit',outlines:[],holeCount:0,routeWarnings:['Saved executable preview; foam footprint is schematic.'],ignoredCount:0,ignoredPreview:[],savedFile:setup.filename};
};})();
