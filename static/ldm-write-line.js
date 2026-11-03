/* V9.51: one setup, Enter writes one immutable line through direct MQTT. */
(()=>{'use strict';
 const KEY='ldmV9TextLinePending',id=x=>document.getElementById(x),editor=()=>window.ldmLiveTypewriterEditor;
 const admin=()=>window.LDM_ACCESS?.local===true&&window.LDM_ACCESS?.admin===true;
 const remote=()=>!admin()&&window.LDM_ACCESS?.typewriter_lan===true;
 const local=()=>admin()||remote();
 const apiBase=()=>remote()?'/api/typewriter/':'/api/admin/typewriter/';
 let hostMachineBusy84=false,hostIdleVerified84=false,penPause85=null,beeped85='';let audio85=null;
 function primeAudio85(){try{audio85=audio85||new (window.AudioContext||window.webkitAudioContext)();audio85.resume().catch(()=>{});}catch{}}
 function beep85(){try{if(!audio85)return;const osc=audio85.createOscillator(),gain=audio85.createGain();osc.connect(gain);gain.connect(audio85.destination);osc.frequency.value=880;gain.gain.value=.12;osc.start();osc.stop(audio85.currentTime+.3);}catch{}}
 async function resumePen85(){if(busy||!armed||!penPause85||penPause85.resumed)return;busy=true;sync();try{await api('resume-pen',{session_token:token,line_id:pending?.line_id,pause_id:penPause85.id});penPause85=null;message('RESUMED — continuing the same frozen text job.');}catch(e){message(e.message+' Check status before trying again.');}finally{busy=false;sync();check();}}
 const localMachineBusy84=()=>!!((typeof V3_JOB_MOTION_LOCK!=='undefined'&&V3_JOB_MOTION_LOCK)||(typeof V3_SVG_SAVE_START_MOVING_LOCK!=='undefined'&&V3_SVG_SAVE_START_MOVING_LOCK)||(typeof V3_SD_TRANSFER_ACTIVE!=='undefined'&&V3_SD_TRANSFER_ACTIVE)||window.ldmArtworkPreparationBusy?.());
 window.ldmLiveJobStartBlocked=()=>hostMachineBusy84||localMachineBusy84();
 const liveBudgets83={text:{strokes:0,points:0},draw:{strokes:0,points:0}};
 window.ldmSetLiveBudget83=(kind,value)=>{if(JSON.stringify(liveBudgets83[kind])!==JSON.stringify(value)){liveBudgets83[kind]=value;schedule();}};
 let writingKind='text',hostOwned=false,lastOwnership=null,finishPower={};
 window.ldmDirectSessionOwnsMachine=()=>!!(armed||serverArmed||hostOwned||pending||busy);
 let remoteReady=false,remoteClaimed=false,grantChecking=false;
 const mode=()=>document.querySelector('.v3ArtworkModeTabs [data-artmode].active')?.dataset.artmode;
 const nonce=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),profile=s=>{const {gates,content_type,...cfg}=s;return JSON.stringify(cfg);};
 let token='',armed=false,serverArmed=false,busy=false,pending=null,settings=null,loaded=false,queued=false,recovered=false,setupDirty=false,checking=false,beating=false,heartbeatWorker=null;
 try{pending=JSON.parse(localStorage.getItem(KEY)||'null');recovered=!!pending;}catch{}
 let heartbeatNote='No heartbeat response yet.';
 function heartbeatStatus(text){heartbeatNote=text;const el=id('ldmTypewriterHeartbeatStatus73');if(el&&el.textContent!==text)el.textContent=text;}
 function message(text){if(id('ldmWriteLineStatus'))id('ldmWriteLineStatus').textContent=text;}
 function save(){if(pending)localStorage.setItem(KEY,JSON.stringify(pending));else localStorage.removeItem(KEY);}
 async function api(action,data,signal){
  const response=await fetch(apiBase()+action,data===undefined?{cache:'no-store',signal}:{signal,method:'POST',headers:{'Content-Type':'application/json','X-LDM-CSRF':window.LDM_ACCESS?.csrf||''},body:JSON.stringify(data)});
  const body=await response.text();let value;
  try{value=JSON.parse(body);}catch{throw Error('Typewriter '+action+' returned HTTP '+response.status+' instead of JSON. Check the LDM terminal. No automatic retry was sent.');}
  if(!response.ok||!value.success){const error=Error(value.error||'Typewriter request rejected.');error.result=value;error.httpStatus=response.status;throw error;}return value;
 }
 window.ldmWriteLineEditingBlocked=()=>!!pending;
 async function arm(){
  if(window.ldmLiveJobStartBlocked()){message('JOB IN PROCESS — Live start/end is temporarily disabled.');return;}
  if(!local()||busy||pending)return;let claimedHere=false;busy=true;sync();
  try{
   if(armed||serverArmed){await api('disarm',{});stopHeartbeat();armed=false;serverArmed=false;token='';settings=null;editor()?.releaseBaseline?.();message('Direct Typewriter ended. Normal machine controls are available.');return;}
   if(localStorage.getItem('ldmV9WriteLineJournal'))throw Error('Resolve the older Canvas-line attempt before starting this session.');
   let cfg;const requestedKind=mode()==='draw'?'draw':'text';
   if(remote()){
    if(!remoteReady){const req=await api('request',{content_type:requestedKind});message('Request '+req.request_code+' — ask Desktop to approve this code.');return;}
    const grant=await api('claim',{});claimedHere=true;token=grant.session_token;cfg=grant.settings;if((cfg.content_type||'text')!==requestedKind){await api('disarm',{});throw Error('Desktop approved a different mode. Request access again from this tab.');}
    try{for(const [key,value]of [['paperW',cfg.width],['paperH',cfg.height]]){if(id(key)){id(key).value=value;id(key).dispatchEvent(new Event('change',{bubbles:true}));}}window.ldmApplyWritingGuideSettings?.({spacing:cfg.gap});}
    catch(error){await api('disarm',{});throw error;}
   }else cfg={...editor().machineSettings(true),content_type:requestedKind};
   if(requestedKind==='text'){
    if(!editor().read().enabled){if(typeof editor().start==='function')editor().start();else id('ldmTypewriterStart')?.click();}
    if(!editor().read().enabled)throw Error(editor().lastError?.()||'Start Live Typing and select its draft first.');
    editor().pinBaseline();
   }
   const value=remote()?{session_token:token}:await api('arm',cfg);token=value.session_token;settings=cfg;writingKind=requestedKind;armed=true;window.ldmTableGuides?.reset();claimedHere=false;serverArmed=true;setupDirty=false;recovered=false;startHeartbeat();
   message(writingKind==='draw'?'DIRECT DRAWING ON — draw, release the pointer, then WRITE NEW STROKES. All visible new strokes are sent; images and guides are excluded.':window.ldmTableGuides?.active()?(window.ldmTableGuides.isCustom?.()?'DIRECT BOXES ON — Enter / WRITE BOX sends the selected box only. Next box is selected after verified completion.':'DIRECT TABLE ON — Enter / WRITE CELL sends this cell, then advances after verified completion.'): 'DIRECT ON — Enter writes this line to the A1. No Canvas, SD upload or second confirmation. STOP SENDING cancels unsent movements.');
   if(writingKind==='text')id('ldmTypewriterText')?.focus({preventScroll:true});
  }catch(error){if(claimedHere&&!armed&&!pending){try{await api('disarm',{});token='';remoteClaimed=false;remoteReady=false;}catch{}}message(error.message);}finally{busy=false;sync();}
 }
 // Same protected text geometry used by the previous TEXT-only writer.
 function captureCell93(){
  if(!armed||!token||mode()!=='text')throw Error('Start an approved Direct TEXT session first.');
  const draft=editor().read(),o=draft.object;if(!draft.enabled||!o||!draft.text.trim())throw Error('Type text in the current cell first.');
  if(o.ldmCreativeGuideId||o.ldmTextDrawing||o.ldmCreativeGuideData)throw Error('Cell writing cannot use Creative Guides.');
  if(o.locked||o.rot||o.mx||o.my||Number(o.scale)!==1||Number(o.x)||Number(o.y))throw Error('Cell writing requires an unlocked TEXT draft at 100%, without rotation, mirrors or offsets.');
  const b=id('art').viewBox.baseVal;if(Math.abs(b.width-settings.width)>.001||Math.abs(b.height-settings.height)>.001)throw Error('Table paper size differs from the approved setup.');
  const cell=window.ldmTableGuides.cell();if(window.ldmTableGuides.isWritten(cell.index))throw Error('Cell already written in this session. Nothing was resent.');
  editor().validateCurrent();const l=window.ldmLiveTypewriterLayout(o);if(l.error||l.overflow)throw Error(l.error||'Text exceeds this cell. Reduce font size/spacing or split the text.');
  if(!l.paths.length||l.paths.length>1000||l.paths.reduce((n,p)=>n+p.length,0)>20000)throw Error('Cell limit: 1–1,000 strokes / 20,000 points, including passes.');
  if(!o.ldmWriteLineOwner)o.ldmWriteLineOwner=nonce();
  return {owner:o.ldmWriteLineOwner,text:draft.text,request_id:nonce(),cell_index:cell.index,table:cell.table,pen_changes:l.penChanges||[],paths:l.paths.map(st=>st.map(([x,y])=>[b.width/2+x,b.height/2+y]))};
 }
 function capture(paragraph=false){primeAudio85();if(window.ldmTableGuides?.active())return captureCell93();if(!armed||!token||!local()||mode()!=='text')throw Error('DIRECT TEXT BLOCKED [NOT_ARMED]: Open Desktop TEXT and START DIRECT TYPEWRITER after machine setup. No commands were sent.');const s=editor().read(),o=s.object;if(o?.ldmCreativeGuideId||o?.ldmTextDrawing||o?.ldmCreativeGuideData)throw Error('Creative guide artwork uses TEXT → SEND TO CANVAS. Direct Typewriter requires straight writing baselines.');if(!s.enabled||!o)throw Error('Start Live Typing first.');if(!s.text.trim())throw Error('DIRECT TEXT BLOCKED [EMPTY_DRAFT]: Enter text before sending.');if(!paragraph&&(/[\r\n]/.test(s.text)||s.geometry?.lines!==1))throw Error('DIRECT TEXT BLOCKED [MULTILINE_WRITE_LINE]: This draft contains a newline or wraps across '+(s.geometry?.lines||'multiple')+' guide rows. Use WRITE PARAGRAPH for this draft; WRITE LINE accepts one physical row only. No commands were sent.');editor().validateCurrent();const l=window.ldmLiveTypewriterLayout(o);if(l.paths.length>1000||l.paths.reduce((n,p)=>n+p.length,0)>20000)throw Error('Current text: '+l.paths.length+' / 1,000 strokes · '+l.paths.reduce((n,p)=>n+p.length,0)+' / 20,000 points. Split the text or reduce repeat passes.');if(l.error||l.overflow)throw Error('DIRECT TEXT BLOCKED [GUIDE_GEOMETRY]: '+(l.error||l.warning||'Generated paths extend outside the Writing Guidelines.')+' Check font size, wrap, guide margins, and line spacing. No commands were sent.');if(o.locked||o.rot||o.mx||o.my||Number(o.scale)!==1)throw Error('Use an unlocked, unrotated, unmirrored live draft at 100%.');if(!remote()&&profile(editor().machineSettings(false))!==profile(settings))throw Error('Machine settings changed. END SESSION and reconfirm the Step Gate.');const b=id('art').viewBox.baseVal;if(remote()&&(Math.abs(b.width-settings.width)>.05||Math.abs(b.height-settings.height)>.05||Math.abs(window.ldmGetWritingGuideSettings().spacing-settings.gap)>.05))throw Error('Match the approved Desktop paper size and writing-guide spacing before writing.');const g=window.ldmWritingGuideLayout(b.width,b.height,window.ldmGetWritingGuideSettings());if(paragraph&&(l.lines>50||g.bounds.y0+l.firstBaseline+(Number(o.y)||0)+(l.lines-1)*settings.gap>g.bounds.y1))throw Error('Paragraph exceeds the bottom Writing Guide or 50-line limit. Split the paragraph.');if(!o.ldmWriteLineOwner)o.ldmWriteLineOwner=nonce();return {pen_changes:l.penChanges||[],owner:o.ldmWriteLineOwner,text:s.text,request_id:nonce(),gap:settings.gap*(paragraph?l.lines:1),lines:paragraph?l.linePaths.map(row=>row.map(st=>st.map(([x,y])=>[b.width/2+(Number(o.x)||0)+x,b.height/2+(Number(o.y)||0)+y]))):undefined,baseline:g.bounds.y0+l.firstBaseline+(Number(o.y)||0),paths:l.paths.map(st=>st.map(([x,y])=>[b.width/2+(Number(o.x)||0)+x,b.height/2+(Number(o.y)||0)+y]))};}
 async function write(paragraph=false){
  if(window.ldmLiveJobStartBlocked()&&!pending){message('JOB IN PROCESS — wait for completion before writing.');return false;}
  if(!armed)return false;
  if(busy||pending){message('This line is still in flight. No next line was queued.');return true;}
  try{
   if(setupDirty)throw Error('Setup changed. End Direct Typewriter and complete setup again.');
   if(!remote()&&profile(editor().machineSettings(false))!==profile(settings))throw Error('Machine settings changed. End this direct session and complete setup again.');
   if(mode()!==writingKind)throw Error('Return to '+writingKind.toUpperCase()+' to use this direct session.');
   const draft=writingKind==='draw'?{...window.ldmDirectDraw.capture(settings),request_id:nonce(),draw:true}:capture(paragraph);
   if(draft.draw)window.ldmDirectDraw.reserve(draft,draft.request_id);
   pending={request_id:draft.request_id,state:'DIRECT_REQUESTED',owner:draft.owner,gap:draft.gap,cell_index:draft.cell_index,draw:!!draft.draw};save();busy=true;sync();
   message('Writing directly… No automatic retry.');
   const value=await api(draft.draw?'direct-strokes':draft.cell_index!==undefined?'direct-cell':paragraph?'direct-paragraph':'direct-line',{session_token:token,request_id:draft.request_id,paths:draft.paths,baseline:draft.baseline,stroke_ids:draft.stroke_ids,stroke_passes:draft.stroke_passes,lines:draft.lines,pen_changes:draft.pen_changes,cell_index:draft.cell_index,table:draft.table});
   if(!pending||pending.request_id!==draft.request_id)return true;
   pending.line_id=value.line_id;pending.state=value.phase;save();
  }catch(error){
   if(pending){
    if(error.result&&error.result.pending===null){if(pending.draw)window.ldmDirectDraw.rejected(pending.request_id);pending=null;save();}
    else{pending.state='UNRESOLVED';if(error.result?.pending?.id)pending.line_id=error.result.pending.id;save();}
   }
   message(error.message+' Nothing will be resent automatically.');
  }finally{busy=false;sync();}
  return true;
 }
 window.ldmWriteLineEnter=()=>{if(!armed||writingKind!=='text')return false;write();return true;};
 async function check(){
  if(!local()||checking||busy)return;checking=true;
  const observedPending=pending,observedToken=token;
  try{
   const value=await api('status');
   // A pre-send / pre-arm response cannot describe the new local transaction.
   if(busy||pending!==observedPending||token!==observedToken)return;
   penPause85=value.pending?.pen_pause||null;if(penPause85&&!penPause85.resumed&&penPause85.id!==beeped85){beeped85=penPause85.id;beep85();}
   window.ldmTableGuides?.sync(value);hostMachineBusy84=value.machine_busy===true;hostIdleVerified84=value.machine_idle_verified===true;finishPower=value.finish_power||{};hostOwned=['ARMED','RECOVERY_REQUIRED'].includes(value.phase);serverArmed=!remote()&&value.phase==='ARMED';
   if(remote()){remoteReady=value.approved&&!value.claimed;remoteClaimed=!!value.claimed;if(!armed&&!value.pending){message(remoteReady?'Desktop approved this iPad. Click START DIRECT TYPEWRITER.':value.claimed?'This approved browser session is already claimed. Ask Desktop to end it before starting another tab.':value.request_code?'Request '+value.request_code+' — waiting for Desktop approval.':'Ask Desktop to enable ALLOW REMOTE DIRECT TYPEWRITER, then request access here.');return;}}
   if(value.pending){
    if(!pending){pending={line_id:value.pending.id,request_id:value.pending.request_id,state:value.pending.phase,cell_index:value.pending.cell_index,draw:value.content_type==='draw'};recovered=true;save();}
    else{pending.line_id=value.pending.id;pending.state=value.pending.phase;save();}
    if(value.phase==='RECOVERY_REQUIRED'){
     stopHeartbeat();armed=false;token='';message('INTERRUPTED — '+(value.pending.line_count?(value.pending.completed_lines||0)+' / '+value.pending.line_count+' lines complete; the next line may be partial. ':'')+(value.pending.error||'Inspect the printer and paper before recovery.')+' Already transmitted moves may finish.');
    }else if(penPause85&&!penPause85.resumed)message('PAUSED — CHANGE PEN, then click RESUME AFTER PEN CHANGE. Keep the printer and paper in place.');else message((value.pending.line_count?'PARAGRAPH · '+(value.pending.completed_lines||0)+' / '+value.pending.line_count+' lines complete · ':'')+'WRITING · '+(value.pending.sent_batches||0)+' / '+(value.pending.total_batches||'?')+' batches. Typing unlocks automatically after completion checks.');
   }else if(pending&&value.last_completed&&(value.last_completed.id===pending.line_id||value.last_completed.request_id===pending.request_id)){
    const old=pending;pending=null;save();
    if(old.draw){window.ldmDirectDraw.complete(old.request_id);message('WRITTEN — draw more, then WRITE NEW STROKES. Accepted strokes will not be sent again.');}
    else if(!recovered&&old.owner&&armed){
     try{if(old.cell_index!==undefined){editor().advanceCell93(old.owner,old.cell_index);message('CELL WRITTEN — ready for the next cell.');}else{editor().advance(old.owner,old.gap);message('READY — type the next line, then Enter.');}id('ldmTypewriterText')?.focus({preventScroll:true});}
     catch(error){armed=false;message('Line finished, but the draft changed. '+error.message+' End the session before continuing.');}
    }else{armed=false;message('Host recorded the line complete. End this recovered session and physically verify the next baseline.');}
   }else if(pending){pending.state='UNRESOLVED';save();stopHeartbeat();armed=false;token='';message('No matching active line on this host. Inspect the paper, then RECOVER INTERRUPTED SESSION. Nothing will be replayed.');}
   else if(!armed)message(value.phase==='ARMED'?'A session exists on this host. End it before starting here.':(mode()==='draw'?'Complete Step 1–5, then START DIRECT DRAWING. Draw and click WRITE NEW STROKES.':'Complete Step 1–5 once, then START DIRECT TYPEWRITER. Enter will write to the A1.'));
  }catch(error){if(pending)message(error.message+' No retry or further line was sent.');else if(!loaded)message(error.message);}
  finally{loaded=true;checking=false;sync();}
 }
 function stopHeartbeat(){if(heartbeatWorker){heartbeatWorker.terminate();heartbeatWorker=null;}}
 function startHeartbeat(){
  stopHeartbeat();
  if(typeof Worker==='undefined')return;
  try{
   const worker=new Worker('/static/ldm-typewriter-heartbeat.js?v9experiment54');heartbeatWorker=worker;
   worker.onmessage=event=>{if(heartbeatWorker!==worker)return;if(event.data?.kind==='alive')heartbeatStatus('HEARTBEAT · background worker received host confirmation.');if(event.data?.kind==='network')heartbeatStatus('HEARTBEAT · worker network request failed; page fallback remains active.');if(event.data?.kind==='ended'){heartbeatStatus('HEARTBEAT · '+event.data.error);stopHeartbeat();armed=false;token='';message(event.data.error+' No line will resume automatically.');sync();}};
   worker.onerror=()=>{if(heartbeatWorker!==worker)return;stopHeartbeat();message('Background heartbeat unavailable; using the page heartbeat. Keep this tab active.');};
   heartbeatWorker.postMessage({kind:'start',url:new URL(apiBase()+'heartbeat',location.href).href,csrf:window.LDM_ACCESS?.csrf||'',token});
  }catch(error){stopHeartbeat();}
 }
 async function heartbeat(){
  // Independent page fallback remains active even when a worker exists.
  if(!armed||!token||beating)return;beating=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3000);const beatToken=token;
  try{await api('heartbeat',{session_token:beatToken},controller.signal);if(token===beatToken)heartbeatStatus('HEARTBEAT · page received host confirmation.');}
  catch(error){if(token===beatToken){heartbeatStatus('HEARTBEAT · '+(error.httpStatus?'HTTP '+error.httpStatus+' · ':'')+error.message);const phase=error.result?.phase;if([401,403].includes(error.httpStatus)||(phase&&phase!=='ARMED')){stopHeartbeat();armed=false;token='';message(error.message+' No movement will resume automatically.');}}}
  finally{clearTimeout(timeout);beating=false;}
 }
 async function stop(){
  stopHeartbeat();
  try{await api('direct-stop',{});armed=false;token='';message('STOP SENDING — unsent movements discarded. Already transmitted moves may finish; use the printer STOP if needed.');await check();}
  catch(error){armed=false;token='';message(error.message+' Use the printer STOP if motion must stop immediately.');}
  sync();
 }
 async function recover(){
  if(window.ldmLiveJobStartBlocked()||!hostIdleVerified84){message('RESET LOCKED — wait for verified printer idle, then CHECK STATUS.');return;}
  if(!admin()||busy)return;
  if(!await window.ldmConfirm('Inspect the paper and printer. Is the machine physically idle? Discard this uncertain line without replay or baseline advance, then re-home and set the origin again.','RECOVER DIRECT TYPEWRITER','IDLE — RESET SESSION','CANCEL'))return;
  busy=true;sync();
  try{
   if(!pending)await api('disarm',{});
   const recovery=await api('resolve',{line_id:pending?.line_id,abandon:true,confirmed_idle:true,paper_checked:true});
   pending=null;save();stopHeartbeat();armed=false;serverArmed=false;token='';settings=null;recovered=false;editor()?.releaseBaseline?.();
   if(recovery.setup_recovery&&recovery.printer_idle_verified&&admin())window.ldmTypewriterRestoreSetup?.();
   message('Session reset. STEP 2 HOME XYZ is available; complete setup again. No line was replayed.');
  }catch(error){message(error.message);}finally{busy=false;sync();}
 }
 function sync(){window.ldmTableGuides?.updateLocks();
  const ownership=window.ldmDirectSessionOwnsMachine();if(ownership!==lastOwnership){lastOwnership=ownership;document.dispatchEvent(new Event('ldm-direct-ownership-change'));}
  const controls=id('ldmWriteLineControls');if(!controls)return;controls.hidden=!local();if(id('ldmLiveDirectFold88'))id('ldmLiveDirectFold88').hidden=!local();let hb=id('ldmTypewriterHeartbeatStatus73');if(!hb){hb=document.createElement('small');hb.id='ldmTypewriterHeartbeatStatus73';hb.setAttribute('role','status');(id('ldmLiveFilesBody88')||controls).append(hb);}if(hb.textContent!==heartbeatNote)hb.textContent=heartbeatNote;
  const draw=mode()==='draw',jobLocked=window.ldmLiveJobStartBlocked();const liveStart=id('ldmTypewriterStart');if(liveStart)liveStart.disabled=jobLocked&&liveStart.textContent.startsWith('START');let jobNote=id('ldmLiveJobLock84');if(!jobNote){jobNote=document.createElement('p');jobNote.id='ldmLiveJobLock84';jobNote.className='ltw-status';jobNote.setAttribute('role','status');controls.prepend(jobNote);}jobNote.hidden=!jobLocked;if(jobLocked&&jobNote.textContent!=='JOB IN PROCESS — Live start/send and setup reset are temporarily locked. Artwork editing and saving remain available.')jobNote.textContent='JOB IN PROCESS — Live start/send and setup reset are temporarily locked. Artwork editing and saving remain available.';
  if(draw&&!pending){try{const b=id('art')?.viewBox?.baseVal;if(b)liveBudgets83.draw=window.ldmDirectDraw.capture({width:b.width,height:b.height},{inspect:true}).budget;}catch(error){liveBudgets83.draw={strokes:0,points:0,error:error.message};}}
  let penButton=id('ldmPenResume85');if(!penButton){penButton=document.createElement('button');penButton.id='ldmPenResume85';penButton.type='button';penButton.textContent='RESUME AFTER PEN CHANGE';penButton.onclick=resumePen85;id('ldmWriteLineStop').before(penButton);}penButton.hidden=!penPause85||penPause85.resumed;penButton.disabled=busy||!armed||recovered;
  const budget=liveBudgets83[draw?'draw':'text'],strokeLimit=draw?500:1000,pointLimit=draw?10000:20000,over=budget.strokes>strokeLimit||budget.points>pointLimit,at=budget.strokes===strokeLimit||budget.points===pointLimit,near=budget.strokes>=strokeLimit*.9||budget.points>=pointLimit*.9;let meter=id('ldmLiveBudget83');if(!meter){meter=document.createElement('p');meter.id='ldmLiveBudget83';meter.className='ltw-status';meter.setAttribute('role','status');id('ldmWriteLineDirect').parentElement.after(meter);}const prefix=over?'LIMIT EXCEEDED — ':at?'LIMIT REACHED — ':near?'NEAR LIMIT — ':'';const label=prefix+budget.strokes.toLocaleString()+' / '+strokeLimit.toLocaleString()+' strokes · '+budget.points.toLocaleString()+' / '+pointLimit.toLocaleString()+' points'+(over?' · Split the text/drawing or reduce repeat passes before sending.':at?' · No room for more; current job can still be sent.':' · Includes repeat passes; per submission.')+(budget.error?' · '+budget.error:'');if(meter.textContent!==label)meter.textContent=label;meter.classList.toggle('ldmLiveBudgetOver83',over);meter.classList.toggle('ldmLiveBudgetNear83',!over&&(near||at));
  const power=id('ldmLiveFinishPower82');if(power){power.hidden=!admin();const choice=id('ldmLiveFinishChoice82');choice.querySelector('[value=shutdown]').disabled=!finishPower.windows;if(document.activeElement!==choice)choice.value=finishPower.choice||'none';id('ldmLiveFinishStatus82').textContent=finishPower.pending?('JOB COMPLETE — '+(finishPower.action==='shutdown'?'PC shutdown':'LDM exit')+' in '+finishPower.seconds+'s. CANCEL remains available.'):(finishPower.message||'Off by default. Applies once, after successful completion only.');}
  let count=id('ldmDirectDrawCount');if(!count){count=document.createElement('small');count.id='ldmDirectDrawCount';controls.append(count);}count.hidden=!draw;count.textContent=(window.ldmDirectDraw?.count()||0)+' accepted / uncertain strokes excluded from sending';
  id('ldmWriteLineDirect').textContent=draw?'WRITE NEW STROKES':window.ldmTableGuides?.active()?(window.ldmTableGuides.isCustom?.()?'WRITE BOX ↵':'WRITE CELL ↵'):'WRITE LINE ↵';
  id('ldmWriteLineMode').textContent=armed||serverArmed?(draw?'END DIRECT DRAWING':'END DIRECT TYPEWRITER'):remote()&&!remoteReady?(draw?'REQUEST DIRECT DRAWING':'REQUEST DIRECT TYPEWRITER'):(draw?'START DIRECT DRAWING':'START DIRECT TYPEWRITER');
  id('ldmWriteLineMode').disabled=jobLocked||busy||!!pending||(remote()&&remoteClaimed&&!armed);
  id('ldmWriteLineDirect').disabled=jobLocked||over||!!finishPower.pending||!armed||busy||!!pending||mode()!==writingKind;
  id('ldmWriteParagraph78').hidden=draw||!!window.ldmTableGuides?.active();id('ldmWriteParagraph78').disabled=jobLocked||over||!!finishPower.pending||!armed||busy||!!pending||mode()!==writingKind;
  id('ldmWriteLineStop').disabled=!armed&&!pending&&!busy;const clear=id('ldmWriteLineClearDrawing'),original=id('ldmDrawClearBtn');clear.hidden=!draw;clear.disabled=busy||!!pending||!original||original.disabled;
  id('ldmWriteLineRecover').hidden=!admin()||!!pending&&['DIRECT_RUNNING','DIRECT_REQUESTED'].includes(pending.state);
  id('ldmWriteLineRecover').disabled=jobLocked||!hostIdleVerified84||busy;
  id('ldmWriteLineRecover').textContent=pending?'RECOVER INTERRUPTED SESSION':'RESET SESSION / UNLOCK SETUP';
 }
 function mount(){
  const footer=document.querySelector('#ldmTypewriterKeyboard .ltw-bottom');if(!footer||id('ldmWriteLineControls'))return;
  const controls=document.createElement('div');controls.id='ldmWriteLineControls';
  controls.innerHTML='<div class="ltw-bottom"><button type="button" id="ldmWriteLineMode">START DIRECT TYPEWRITER</button><button type="button" id="ldmWriteLineDirect">WRITE LINE ↵</button><button type="button" id="ldmWriteParagraph78">WRITE PARAGRAPH</button><button type="button" id="ldmWriteLineStop">STOP SENDING</button><button type="button" id="ldmWriteLineClearDrawing" hidden>CLEAR DRAWING</button></div><p class="ltw-status">TEXT: Enter writes one line. NEW LINE / Shift+Enter edits a paragraph; WRITE PARAGRAPH sends it. DRAW: WRITE NEW STROKES sends visible new strokes. One snapshot at a time.</p><p id="ldmWriteLineStatus" class="ltw-status" role="status" aria-live="polite"></p><div class="ltw-bottom"><button type="button" id="ldmWriteLineCheck">CHECK STATUS</button><button type="button" id="ldmWriteLineRecover" hidden>RECOVER INTERRUPTED SESSION</button></div>';
  const groups=document.createElement('div');groups.id='ldmLiveToolsGroups88';groups.innerHTML='<details id="ldmLiveDirectFold88" class="toolbox ldmArtworkFold" open><summary>DIRECT TYPEWRITER / DRAW</summary><div class="ldmArtworkFoldBody" id="ldmLiveDirectBody88"></div></details><details id="ldmLiveFilesFold88" class="toolbox ldmArtworkFold" open><summary>AFTER JOB &amp; SAVE</summary><div class="ldmArtworkFoldBody" id="ldmLiveFilesBody88"></div></details>';footer.after(groups);id('ldmLiveDirectBody88').append(controls);id('ldmWriteLineMode').onclick=arm;id('ldmWriteLineDirect').onclick=()=>write(false);id('ldmWriteParagraph78').onclick=()=>write(true);id('ldmWriteLineStop').onclick=stop;id('ldmWriteLineClearDrawing').onclick=()=>{const b=id('ldmDrawClearBtn');if(mode()==='draw'&&!busy&&!pending&&b&&!b.disabled)b.click();};id('ldmWriteLineCheck').onclick=check;id('ldmWriteLineRecover').onclick=recover;
  const power=document.createElement('div');power.id='ldmLiveFinishPower82';power.hidden=!admin();power.innerHTML='<label>AFTER THIS JOB<select id="ldmLiveFinishChoice82"><option value="none">Keep LDM open</option><option value="quit">QUIT LDM</option><option value="shutdown">QUIT LDM + SHUT DOWN PC</option></select></label><div class="ltw-bottom"><button type="button" id="ldmLiveFinishApply82">APPLY</button><button type="button" id="ldmLiveFinishCancel82">CANCEL EXIT / SHUTDOWN</button></div><p class="ltw-status" id="ldmLiveFinishStatus82" role="status"></p>';id('ldmLiveFilesBody88').append(power);const finishOption=async action=>{try{const value=await api('finish-option',{action});finishPower=value.finish_power||{};sync();}catch(error){message(error.message);}};id('ldmLiveFinishApply82').onclick=()=>finishOption(id('ldmLiveFinishChoice82').value);id('ldmLiveFinishCancel82').onclick=()=>finishOption('none');
  message('Complete Step 1–5 once, then START DIRECT TYPEWRITER.');sync();
 }
 async function pollGrants(){
  if(grantChecking||!id('ldmRemoteTypewriterAllow'))return;grantChecking=true;
  try{const value=await api('remote-access');id('ldmRemoteTypewriterAllow').checked=value.enabled;const list=id('ldmRemoteTypewriterRequests');list.replaceChildren();for(const req of value.requests){const button=document.createElement('button');button.type='button';button.textContent='APPROVE iPAD '+(req.content_type==='draw'?'DRAW':'TEXT')+' · '+req.code;button.onclick=async()=>{try{await api('remote-access',{approve:req.code,settings:{...editor().machineSettings(true),content_type:req.content_type||'text'}});message('iPad approved. Only that browser can claim this writer.');await pollGrants();await check();}catch(error){message(error.message);}};list.append(button);}}catch(error){message(error.message);}finally{grantChecking=false;}
 }
 function mountGrants(){
  if(id('ldmRemoteTypewriterAllow'))return;const host=id('ldmWriteLineControls');if(!host)return;
  const panel=document.createElement('div');panel.className='ltw-bottom';panel.innerHTML='<label style="display:inline-flex;align-items:center;gap:6px;font-size:11px"><input type="checkbox" id="ldmRemoteTypewriterAllow" style="width:14px;height:14px;min-width:14px;margin:0">ALLOW REMOTE DIRECT TYPEWRITER / DRAW</label><div id="ldmRemoteTypewriterRequests" class="ltw-bottom"></div>';
  host.prepend(panel);id('ldmRemoteTypewriterAllow').onchange=async event=>{try{const enabled=event.target.checked;await api('remote-access',{enabled});await check();message(enabled?'Remote requests enabled. On iPad, request access; approve its matching code here.':'Remote access revoked. For Desktop setup, click '+(pending?'RECOVER INTERRUPTED SESSION':'RESET SESSION / UNLOCK SETUP')+'. Confirm the printer is physically idle; then HOME XYZ and complete Steps 2–5.');}catch(error){message(error.message);}pollGrants();};pollGrants();
 }
 function placeControls(){
  const controls=id('ldmLiveToolsGroups88'),footer=document.querySelector('#ldmTypewriterKeyboard .ltw-bottom');if(!controls||!footer)return;
  if(mode()==='draw'){let host=id('ldmDirectDrawPanel');const anchor=id('ldmDrawLayers');if(!anchor)return;if(!host){host=document.createElement('details');host.id='ldmDirectDrawPanel';host.className='toolbox ldmArtworkFold';host.open=true;const heading=document.createElement('summary');heading.textContent='LIVE DRAW';const body=document.createElement('div');body.className='ldmArtworkFoldBody';host.append(heading,body);anchor.prepend(host);}const body=host.querySelector(':scope > .ldmArtworkFoldBody');if(controls.parentElement!==body)body.append(controls);host.hidden=false;
  }else{if(controls.previousElementSibling!==footer)footer.after(controls);if(id('ldmDirectDrawPanel'))id('ldmDirectDrawPanel').hidden=true;}
  const files=id('ldmLiveFilesBody88');for(const key of ['ldmTypewriterHeartbeatStatus73','ldmTypewriterStatus','ldmLiveSaveBar80_text','ldmLiveSaveBar80_draw']){const n=id(key);if(n&&files){if(n.parentElement!==files)files.append(n);if(key==='ldmTypewriterStatus'||key==='ldmLiveSaveBar80_text')n.hidden=mode()==='draw';else if(key==='ldmLiveSaveBar80_draw')n.hidden=mode()!=='draw';}}
 }
 window.ldmPlaceLiveControls88=placeControls;
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();placeControls();sync();if(local()&&!loaded&&!checking)check();if(admin()&&window.LDM_ACCESS?.typewriter_lan)mountGrants();});}
 window.addEventListener('pointerdown',event=>{if(mode()==='draw'&&pending&&event.target?.closest?.('#art,#ldmDrawDraftSurface')){event.preventDefault();event.stopImmediatePropagation();message('Wait for the current strokes to finish. No additional stroke was queued.');}},true);
 document.addEventListener('keydown',event=>{
  if(event.target?.id!=='ldmTypewriterText'||event.key!=='Enter'||event.shiftKey||!armed||writingKind!=='text'||event.isComposing)return;
  event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)write();
 },true);
 document.addEventListener('click',schedule);window.addEventListener('pointerup',schedule);window.addEventListener('pointercancel',schedule);document.addEventListener('ldm-online-view',schedule);
 document.addEventListener('change',event=>{
  if(event.isTrusted&&armed&&['v3QuickMaterialCheck','v3QuickSurfaceCheck'].includes(event.target?.id)){setupDirty=true;message('Setup changed. End Direct Typewriter and complete setup again.');if(pending)stop();}
  schedule();
 });
 window.setInterval(()=>{if(local())check();if(admin()&&window.LDM_ACCESS?.typewriter_lan)pollGrants();},1000);
 window.setInterval(heartbeat,1000);
 window.addEventListener('pagehide',()=>{const wasArmed=armed;stopHeartbeat();armed=false;token='';if(wasArmed)fetch(apiBase()+'direct-stop',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','X-LDM-CSRF':window.LDM_ACCESS?.csrf||''},body:'{}'}).catch(()=>{});});
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
 window.ldmWriteLineState=()=>({armed,busy,pending:pending?{state:pending.state,line_id:pending.line_id}:null,recovered,transport:'direct',content_type:writingKind});
})();
