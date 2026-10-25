/* GUI.58: read-only plot simulation using the same builder as production. */
(()=>{'use strict';const $=id=>document.getElementById(id);let model=null,elapsed=0,playing=false,frame=0,last=0,popup=null,focusBefore=null,overflow='',yaw=Math.PI/4,pitch=.85,zoom=1,side='3d',drag=null;
 const currentMode=()=>document.querySelector('.v3ArtworkModeTabs [data-artmode].active')?.dataset.artmode||'';const simulationTab=()=>['vector','foam','cncfoam'].includes(currentMode());let watchedTabs=null,tabObserver=null;
 const allowed=()=>{const a=window.LDM_ACCESS;return !a||a.local||a.admin||(a.remote_enabled!==false&&a.sections?.includes('simulation'));};
 function number(id,fallback){const n=$(id),raw=n?.value;if(raw==null)return fallback;if(raw.trim()===''||!Number.isFinite(Number(raw)))throw Error('Enter a valid '+id+'.');return Number(raw);}
 function simulationMeshRaw(mode,vals,pw,ph){return function(x,y){
 const nx=Math.max(-1,Math.min(1,x/(pw/2||1))), ny=Math.max(-1,Math.min(1,y/(ph/2||1)));
 const v=k=>Number(vals[k]);
 const lerp=(a,b,t)=>a+(b-a)*t;
 if(mode==='3') return ny>=0?lerp(v('C'),v('B'),ny):lerp(v('C'),v('F'),-ny);
 if(mode==='4'){
   const top=lerp(v('BL'),v('BR'),(nx+1)/2), bot=lerp(v('FL'),v('FR'),(nx+1)/2);
   return lerp(bot,top,(ny+1)/2);
 }
 if(mode==='5'){
   // Four triangular planes meeting at the taught center; continuous on center-to-corner rays.
   const C=v('C');
   if(ny>=Math.abs(nx)) return C + ny*((nx>=0?v('BR'):v('BL'))-C) + (Math.abs(nx))*((nx>=0?v('BR'):v('BL'))-(nx>=0?v('BR'):v('BL')));
   if(ny<=-Math.abs(nx)) return C + (-ny)*((nx>=0?v('FR'):v('FL'))-C);
   if(nx>=0){
     const edge=lerp(v('FR'),v('BR'),(ny+1)/2);
     return lerp(C,edge,nx);
   }else{
     const edge=lerp(v('FL'),v('BL'),(ny+1)/2);
     return lerp(C,edge,-nx);
   }
 }
 if(mode==='6'){
   const leftMid=v('ML'),rightMid=v('MR'), t=(nx+1)/2;
   const mid=lerp(leftMid,rightMid,t);
   if(ny>=0)return lerp(mid,lerp(v('BL'),v('BR'),t),ny);
   return lerp(mid,lerp(v('FL'),v('FR'),t),-ny);
 }
 if(mode==='9'){
   let left,mid,right;
   if(ny>=0){
     left=lerp(v('ML'),v('BL'),ny);mid=lerp(v('C'),v('BC'),ny);right=lerp(v('MR'),v('BR'),ny);
   }else{
     left=lerp(v('ML'),v('FL'),-ny);mid=lerp(v('C'),v('FC'),-ny);right=lerp(v('MR'),v('FR'),-ny);
   }
   return nx>=0?lerp(mid,right,nx):lerp(mid,left,-nx);
 }
 return 0;
 };}
 // Copy geometry/settings without sourcePaths(), ldmSnapshot(), FTE or DOM rendering.
 function vectorSnapshot(pw,ph){
  const objects=window.ldmSvgObjects||[],index=window.ldmSelectedSvg;
  return objects.map((source,i)=>{const o={...source,raw:(source.raw||[]).map(p=>p.map(q=>q.slice()))};
   if(i===index&&!o.locked){for(const [key,id]of [['x','svgX'],['y','svgY'],['scale','scale'],['rot','rotate']])if($(id))o[key]=number(id,o[key]);if($('mirrorX'))o.mx=$('mirrorX').checked;if($('mirrorY'))o.my=$('mirrorY').checked;}
   const all=o.raw.flat();if(!all.length)return {...o,paths:[]};let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const [x,y]of all){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
   const cx=(x0+x1)/2,cy=(y0+y1)/2,scale=Number(o.scale)/100,angle=Number(o.rot)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
   let paths=o.visible===false?[]:o.raw.map(path=>path.map(([x,y])=>{const lx=(x-cx)*scale*(o.mx?-1:1),ly=(y-cy)*scale*(o.my?-1:1);return [pw/2+Number(o.x)+lx*c-ly*s,ph/2+Number(o.y)+lx*s+ly*c];}));
   if(window.ldmClipPathsToPaper)paths=window.ldmClipPathsToPaper(paths);return {...o,paths};
  });
 }
 window.ldmPlotSimulationSnapshot=()=>{
  if(!allowed())throw Error('Remote simulation is not enabled by the administrator.');
  if(window.ldmCanvasImportBusy||window.ldmArtworkPreparationBusy?.())throw Error('Wait until artwork preparation / import / transfer finishes.');
  if(window.ldmFoamMaterialActive?.())throw Error('Use the FOAM CUT movement simulator for this tool.');
  const endClearance=window.ldmRequireEndLift(false),pw=number('paperW'),ph=number('paperH'),isVinyl=$('toolMode')?.value==='vinyl';
  if(!['pen','vinyl'].includes($('toolMode')?.value))throw Error('Choose PEN / PLOT or VINYL mode.');
  const surface=number('v3QuickSurfaceValue'),lift=Math.abs(number(isVinyl?'bladeLift':'penLift',1)),cutDepth=isVinyl?Math.max(0,Math.min(.3,number('cutDepth',0))):0,zf=number('zSpeed',number('zFeed',300)),df=isVinyl?Math.max(100,number('cutFeed',300)):Math.max(100,Math.min(20000,number('plotSpeed',3000))),tf=number('travelSpeed',number('travelFeed',1500)),liftDuring=isVinyl||($('penLiftDuringPlot')?.value||'on')==='on',endPos=$(isVinyl?'cutEndPosition':'plotEndPosition')?.value||'topLeft';
  const meshOn=typeof LDM_ZMESH!=='undefined'&&LDM_ZMESH.mode!=='off';let meshAt=()=>0,meshCeiling=0;
  if(meshOn){
   const saved=LDM_ZMESH.saved,mode=String(LDM_ZMESH.mode);
   if(!saved||LDM_ZMESH.editing||String(saved.mode)!==mode||!zMeshDefs(mode).every(d=>Number.isFinite(Number(saved.points[d[0]]))))throw Error('Save the current complete Z mesh before simulating it.');
   if(!saved.centerDeferred&&(!paperCenterSet||['x','y','z'].some(k=>!Number.isFinite(saved.center?.[k])||!Number.isFinite(paperCenterMachine?.[k])||Math.abs(saved.center[k]-paperCenterMachine?.[k])>.001)))throw Error('Save the current complete Z mesh before simulating it.');
   const points={...saved.points},raw=simulationMeshRaw(mode,points,pw,ph),zero=raw(0,0);meshAt=(x,y)=>raw(x,y)-zero;meshCeiling=Math.max(0,...Object.values(points).map(Number).map(v=>v-zero));
  }
  const files=vectorSnapshot(pw,ph),tol=Math.max(0,number('fteTol',0));let paths=[],colourPlan=null;
  if(window.ldmVectorColourEnabled){
   if(isVinyl||!liftDuring)throw Error('Multicolour simulation requires PEN and lift ON.');
   window.ldmVectorColourHoldSeconds();const starts=new Map(),palette=['#e53935','#1976d2','#43a047','#8e24aa','#fb8c00','#00838f','#c2185b','#795548'];
   files.forEach((o,i)=>{const pp=o.paths.filter(p=>p.length>1).map(p=>fteS(p,tol));if(!pp.length)return;const colour=/^#[0-9a-f]{6}$/i.test(o.lineColour||'')?o.lineColour:palette[i%palette.length];starts.set(paths.length,String((o.name||'VECTOR')+' '+colour).replace(/[^a-zA-Z0-9 ._-]/g,' ').slice(0,70));paths.push(...pp);});colourPlan={paths,starts};
  }else paths=files.flatMap(o=>o.paths).filter(p=>p.length>1).map(p=>fteS(p,tol));
  paths=window.ldmThinPlotPaths(paths);
  const built=window.ldmBuildPlotMotion({paths,pw,ph,isVinyl,lift,cutDepth,zf,df,tf,liftDuring,endPos,endClearance,meshOn,meshAt,meshCeiling,colourPlan});
  return {built,pw,ph,surface,meshAt,cutDepth,endClearance};
 };
 window.ldmBuildPlotSimulation=snapshot=>{const stages=[];let current=[0,0,0],feed=1500,total=0,ending=false;for(const raw of snapshot.built.lines){if(raw.startsWith('; LDM END Z LIFT'))ending=true;const line=raw.split(';')[0].trim();if(/^G4\b/.test(line)){const p=Number(line.match(/P([\d.]+)/)?.[1]||0)/1000,s=Number(line.match(/S([\d.]+)/)?.[1]||0);stages.push({name:'TIMED PEN CHANGE HOLD',points:[[...current]],duration:p+s,start:total,kind:'hold'});total+=p+s;continue;}if(!/^G[01]\b/.test(line))continue;const words=Object.fromEntries([...line.matchAll(/([XYZF])\s*(-?[\d.]+)/g)].map(m=>[m[1],Number(m[2])]));if(words.F)feed=words.F;const target=current.map((v,i)=>v+(words['XYZ'[i]]||0));if(!target.every(Number.isFinite))throw Error('Invalid generated simulation coordinate.');const distance=Math.hypot(...target.map((v,i)=>v-current[i]));if(!distance)continue;const vertical=words.X===undefined&&words.Y===undefined,kind=ending?(vertical?'endLift':'return'):vertical?'lift':current[2]<=snapshot.meshAt(current[0],current[1])-snapshot.cutDepth+.001?'draw':'travel',name=ending?(vertical?'END Z LIFT · vertical clearance before XY':'RETURN · '+snapshot.built.end.endPos.toUpperCase()):vertical?(target[2]>current[2]?'Z LIFT':'LOWER TO SURFACE'):(kind==='draw'?'PLOT / CUT':'XY TRAVEL');const duration=distance/feed*60;stages.push({name,points:[[...current],target],kind,duration,start:total});total+=duration;current=target;}if(!stages.length)throw Error('No simulation motion generated.');return {...snapshot,stages,total};};
 function stop(){playing=false;cancelAnimationFrame(frame);frame=0;last=0;if($('ldmPlotSimPlay'))$('ldmPlotSimPlay').textContent='PLAY';}
 function at(){let lo=0,hi=model.stages.length-1;while(lo<hi){const m=(lo+hi)>>1,st=model.stages[m];if(elapsed>=st.start+st.duration)lo=m+1;else hi=m;}const i=lo;const st=model.stages[i],f=st.duration?Math.max(0,Math.min(1,(elapsed-st.start)/st.duration)):1,p=st.points.length>1?st.points[0].map((v,k)=>v+(st.points[1][k]-v)*f):st.points[0];return {st,i,p};}
 function draw(){if(!model||!$('ldmPlotSimCanvas'))return;const canvas=$('ldmPlotSimCanvas'),ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,style=getComputedStyle(canvas),fg=style.color||'#222';ctx.fillStyle=style.backgroundColor||'#fff';ctx.fillRect(0,0,W,H);const zmax=model.stages.reduce((n,st)=>st.points.reduce((m,p)=>Math.max(m,p[2]),n),model.endClearance),w=model.pw,h=model.ph;const raw=p=>side==='3d'?window.ldmFoamSimCameraPoint(p,yaw,pitch,zmax*.4):window.ldmFoamSimOrthoPoint(p,side);const bounds=[];for(const x of [-w/2,w/2])for(const y of [-h/2,h/2])for(const z of [0,zmax])bounds.push(raw([x,y,z]));const xs=bounds.map(p=>p[0]),ys=bounds.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),fit=Math.min((W-100)/Math.max(1,xmax-xmin),(H-110)/Math.max(1,ymax-ymin))*zoom;const project=p=>{const q=raw(p);return [W/2+(q[0]-(xmin+xmax)/2)*fit,H/2-(q[1]-(ymin+ymax)/2)*fit];};function line(points,colour,dash=[],width=1){ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(...q):ctx.moveTo(...q)});ctx.stroke();ctx.setLineDash([]);}const rect=z=>[[-w/2,-h/2,z],[w/2,-h/2,z],[w/2,h/2,z],[-w/2,h/2,z],[-w/2,-h/2,z]];ctx.globalAlpha=.3;line(rect(0),fg);line(rect(model.endClearance),'#429bd5',[4,4]);for(let i=0;i<=8;i++){line([[-w/2,-h/2+i*h/8,0],[w/2,-h/2+i*h/8,0]],fg);line([[-w/2+i*w/8,-h/2,0],[-w/2+i*w/8,h/2,0]],fg);}ctx.globalAlpha=.65;const stride=Math.max(1,Math.ceil(model.stages.length/6000));model.stages.forEach((st,i)=>{if(i%stride&&st.kind!=='endLift'&&st.kind!=='return')return;line(st.points,st.kind==='draw'?'#df625c':st.kind==='endLift'?'#19a76f':'#429bd5',st.kind==='draw'?[]:[4,3],st.kind==='endLift'||st.kind==='return'?2:1);});ctx.globalAlpha=1;const {st,i,p}=at(),q=project(p);ctx.fillStyle='#19a76f';ctx.beginPath();ctx.arc(q[0],q[1],6,0,Math.PI*2);ctx.fill();line([[p[0],p[1],0],p],'#19a76f',[2,3]);ctx.fillStyle=fg;ctx.font='13px '+style.fontFamily;ctx.fillText('SURFACE Z '+model.surface.toFixed(3)+' mm · END CLEARANCE +'+model.endClearance.toFixed(3)+' mm',12,22);$('ldmPlotSimStep').textContent=`${i+1} / ${model.stages.length} · ${st.name} · X ${p[0].toFixed(3)} Y ${p[1].toFixed(3)} · Z above Surface ${p[2].toFixed(3)} · Surface Z + offset ${(model.surface+p[2]).toFixed(3)} mm`;$('ldmPlotSimProgress').value=String(elapsed);$('ldmPlotSimInfo').textContent=`DRAFT SIMULATION ONLY · ${model.pw} × ${model.ph} mm Canvas · ${model.stages.length} motion stages · ${model.total.toFixed(1)} s estimated movement time\nFinal: Surface Z + ${model.endClearance.toFixed(3)} mm, then ${model.built.end.endPos==='topLeft'?'TOP LEFT':'CENTER'} at fixed height.\nStarts at the saved plot-origin/contact reference. Physical HOME / initial approach and network delays are not simulated. Blue dashed: travel · red: drawing · green: final Z lift. Regenerate after edits. This is the current draft, not live progress or the submitted machine program.`;}
 function tick(t){if(!playing)return;if(last)elapsed=Math.min(model.total,elapsed+(t-last)/1000*Number($('ldmPlotSimSpeed').value));last=t;draw();if(elapsed>=model.total)stop();else frame=requestAnimationFrame(tick);}
 function generate(){stop();$('ldmPlotSimError').hidden=true;try{model=window.ldmBuildPlotSimulation(window.ldmPlotSimulationSnapshot());elapsed=0;$('ldmPlotSimProgress').max=String(model.total);for(const id of ['Play','Reset','Prev','Next','Progress'])$('ldmPlotSim'+id).disabled=false;draw();}catch(e){model=null;for(const id of ['Play','Reset','Prev','Next','Progress'])$('ldmPlotSim'+id).disabled=true;$('ldmPlotSimError').textContent='SIMULATION NOT GENERATED · '+e.message;$('ldmPlotSimError').hidden=false;}}
 function close(){stop();popup?.remove();popup=null;model=null;document.body.style.overflow=overflow;focusBefore?.focus();}
 function open(){if(!allowed()||!simulationTab())return;if(currentMode()==='cncfoam'){const b=$('ldmCncSimFull');if(b){$('ldmCncSimBuild')?.click();b.click();}else window.ldmAlert?.('Open CNC FOAM to use its movement simulator.');return;}if(currentMode()==='foam'||window.ldmFoamMaterialActive?.()){const b=$('ldmFoamSimFull');if(b){$('ldmFoamSimBuild')?.click();b.click();}else window.ldmAlert?.('Open FOAM CUT to use its movement simulator.');return;}if(popup)return;focusBefore=document.activeElement;overflow=document.body.style.overflow;popup=document.createElement('div');popup.id='ldmPlotSimPopup';popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-labelledby','ldmPlotSimTitle');popup.innerHTML='<header><b id="ldmPlotSimTitle">3D PLOT · MOVEMENT SIMULATOR</b><button type="button" id="ldmPlotSimClose">CLOSE ×</button></header><div class="ldmPlotSimControls"><button id="ldmPlotSimBuild" type="button">REGENERATE SIMULATION</button><label>View<select id="ldmPlotSimSide"><option value="3d">3D PERSPECTIVE</option><option value="top">TOP</option><option value="bottom">BOTTOM</option><option value="front">FRONT</option><option value="back">BACK</option><option value="left">LEFT</option><option value="right">RIGHT</option></select></label><button id="ldmPlotSimViewReset" type="button">RESET VIEW</button><button id="ldmPlotSimPlay" type="button">PLAY</button><button id="ldmPlotSimReset" type="button">RESET</button><button id="ldmPlotSimPrev" type="button">PREVIOUS</button><button id="ldmPlotSimNext" type="button">NEXT</button><label>Playback<select id="ldmPlotSimSpeed"><option value="1">1×</option><option value="5">5×</option><option value="10" selected>10×</option><option value="30">30×</option></select></label></div><div id="ldmPlotSimError" role="alert" hidden></div><canvas id="ldmPlotSimCanvas" width="1000" height="580" aria-label="Plot movement simulation; drag to orbit, wheel to zoom"></canvas><input id="ldmPlotSimProgress" type="range" min="0" max="1" step="0.01" value="0" aria-label="Simulation position"><div id="ldmPlotSimStep" role="status"></div><div id="ldmPlotSimInfo"></div>';document.body.append(popup);document.body.style.overflow='hidden';$('ldmPlotSimClose').onclick=close;$('ldmPlotSimBuild').onclick=generate;$('ldmPlotSimSide').value=side;$('ldmPlotSimSide').onchange=()=>{side=$('ldmPlotSimSide').value;draw();};$('ldmPlotSimViewReset').onclick=()=>{yaw=Math.PI/4;pitch=.85;zoom=1;draw();};$('ldmPlotSimPlay').onclick=()=>{if(!model)return;if(playing){stop();return;}if(elapsed>=model.total)elapsed=0;playing=true;last=0;$('ldmPlotSimPlay').textContent='PAUSE SIMULATION';frame=requestAnimationFrame(tick);};$('ldmPlotSimReset').onclick=()=>{stop();elapsed=0;draw();};$('ldmPlotSimProgress').oninput=()=>{stop();elapsed=Number($('ldmPlotSimProgress').value);draw();};for(const [name,delta]of [['Prev',-1],['Next',1]])$('ldmPlotSim'+name).onclick=()=>{if(!model)return;stop();elapsed=model.stages[Math.max(0,Math.min(model.stages.length-1,at().i+delta))].start;draw();};const canvas=$('ldmPlotSimCanvas');canvas.onpointerdown=e=>{if(side!=='3d')return;drag=[e.clientX,e.clientY];canvas.setPointerCapture?.(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.008;pitch=Math.max(.15,Math.min(1.4,pitch+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];draw();};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;canvas.onwheel=e=>{e.preventDefault();zoom=Math.max(.5,Math.min(2.5,zoom*Math.exp(-e.deltaY*.001)));draw();};generate();$('ldmPlotSimClose').focus();}
 function mount(){const tabs=document.querySelector('.v3ArtworkModeTabs [data-artmode]')?.closest('.v3ArtworkModeTabs');if(tabs&&tabs!==watchedTabs){tabObserver?.disconnect();watchedTabs=tabs;tabObserver=new MutationObserver(mount);tabObserver.observe(tabs,{attributes:true,subtree:true,attributeFilter:['class']});}const guide=$('v3ArtworkWorkflowGuide');if(guide&&!$('ldmPlotSimOpen')){const b=document.createElement('button');b.id='ldmPlotSimOpen';b.type='button';b.textContent='GENERATE 3D SIMULATION';b.onclick=open;guide.before(b);}const button=$('ldmPlotSimOpen');if(button){if(guide&&button.nextElementSibling!==guide)guide.before(button);const hidden=!allowed()||!simulationTab();if(button.hidden!==hidden)button.hidden=hidden;}}
 document.addEventListener('keydown',e=>{if(!popup)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}if(e.key==='Tab'){const nodes=[...popup.querySelectorAll('button,select,input')].filter(n=>!n.disabled),a=nodes[0],b=nodes.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus();}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus();}}},true);document.addEventListener('ldm-access-updated',mount);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});function boot(){mount();new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
