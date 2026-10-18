/* GitHub Pages adapter: existing Remote View editor; no cloud storage or machine API. */
(()=>{'use strict';
const original=window.fetch.bind(window),access=window.LDM_ACCESS;
// Capture initial scans, scans opened into an existing tab, and restored pages.
// Keep the password in memory/form only; remove only its fragment parameter.
let scannedPassword='';
function applyScannedPassword(){
 const bar=document.getElementById('ldmOnlineConnection'),input=bar?.querySelector('[name=password]');
 if(!scannedPassword||!input)return;
 input.value=scannedPassword;const entry=document.querySelector('#ldmOnlineNameGate [name=accessPassword]');if(entry)entry.value=scannedPassword;scannedPassword='';
 bar.dataset.qrPrefilled='true';
 const username=bar.querySelector('[name=username]');if(username)username.readOnly=false;
 status('QR PASSWORD FILLED — enter your username, then CONNECT');
 document.dispatchEvent(new Event('ldm-online-qr-password'));
}
function consumeQRPassword(){
 try{const fragment=new URLSearchParams(location.hash.slice(1));if(!fragment.has('ldm_password'))return;
 const value=fragment.get('ldm_password')||'';
 fragment.delete('ldm_password');
 history.replaceState(history.state,'',location.pathname+location.search+(fragment.size?'#'+fragment.toString():''));
 if(value.length>=6&&value.length<=256&&!/[\r\n\x00]/.test(value)){scannedPassword=value;applyScannedPassword();}
 }catch(_){}
}
consumeQRPassword();
window.addEventListener('hashchange',consumeQRPassword);
window.addEventListener('pageshow',consumeQRPassword);

let accessClock=null,artOnly=false,guestPolicy=null,guestName='';
const ART_SECTIONS=['vector','text','draw','algorithm','stl','foam','inbox'];
function viewReady(ready){
 if(!ready){access.submission_authenticated=false;accessClock=null;for(const id of ['ldmOnlineAllowance','ldmOnlineDrawAllowance']){const timer=document.getElementById(id);if(timer)timer.hidden=true;}
  for(const key of ['expires_at','server_time','submission_limit','submissions_used','submissions_remaining'])delete access[key];
  if(artOnly&&guestPolicy?.enabled){Object.assign(access,{admin:false,local:false,mode:'manual',username:guestName,guest_username:guestName,inbox_enabled:guestPolicy.inbox_enabled,online_inbox_visible:guestPolicy.online_inbox_visible,sections:[...guestPolicy.sections],draw_svg_upload:guestPolicy.draw_svg_upload,draw_helpers:{...guestPolicy.draw_helpers}});ready=true;}else access.sections=[];
 }
 access.art_only=artOnly&&access.submission_authenticated!==true;access.online_view_ready=!!ready;document.documentElement.classList.toggle('ldm-online-view-ready',!!ready);document.documentElement.classList.toggle('ldm-online-art-only',access.art_only);document.dispatchEvent(new Event('ldm-online-view'));
}
function closeConnection(){const panel=document.getElementById('ldmOnlineConnection');panel?.setAttribute('data-open','false');panel?.setAttribute('aria-hidden','true');document.getElementById('ldmOnlineDrawerButton')?.setAttribute('aria-expanded','false');}
function validArtist(name){return /^[\p{L}\p{N}_ .-]{1,40}$/u.test(name);}
function normalizeGuestPolicy(p){
 if(!p||p.schema!==1||typeof p.enabled!=='boolean'||!Array.isArray(p.sections)||p.sections.length>7||p.sections.some(s=>!ART_SECTIONS.includes(s))||['inbox_enabled','online_inbox_visible','draw_svg_upload'].some(k=>typeof p[k]!=='boolean')||!p.draw_helpers||['a4','writing'].some(k=>typeof p.draw_helpers[k]!=='boolean'))return null;
 return {schema:1,enabled:p.enabled,sections:p.enabled?[...new Set(p.sections)].filter(s=>s!=='inbox'||p.inbox_enabled&&p.online_inbox_visible):[],inbox_enabled:p.inbox_enabled,online_inbox_visible:p.online_inbox_visible,draw_svg_upload:p.draw_svg_upload,draw_helpers:{a4:p.draw_helpers.a4,writing:p.draw_helpers.writing}};
}
async function loadGuestPolicy(){
 let published=null,target=endpoint;
 try{const r=await original(new URL('online-config.json',document.baseURI),{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});if(r.ok){const config=await r.json();published=normalizeGuestPolicy(config.guest_policy);try{target=validEndpoint(config.desktop_url);endpoint=target;}catch(_){target='';}}}catch(_){}
 if(target){try{const r=await original(target+'/online/guest-policy',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(4000)});if(r.ok){const live=normalizeGuestPolicy((await r.json()).policy);if(live)return live;}}catch(_){}}
 if(published)return published;
 if(guestPolicy)return guestPolicy;
 throw Error('Guest feature settings are not available yet. Ask the administrator to sync ONLINE ARTWORK ACCESS. Your artwork is unchanged.');
}
async function startArtOnly(event){
 const gate=document.getElementById('ldmOnlineNameGate'),entry=gate?.querySelector('form'),form=document.querySelector('#ldmOnlineConnection form'),name=(entry?entry.elements.artist.value:form.elements.username.value).trim(),note=entry?.querySelector('[role=status]'),trigger=event?.currentTarget;
 if(!validArtist(name)){const text='Enter a username of 1–40 letters, numbers, spaces, dots, underscores or hyphens. No password is needed to make art.';if(note)note.textContent=text;else status(text);(entry?.elements.artist||form.elements.username).focus();return;}
 if(trigger)trigger.disabled=true;
 try{if(note)note.textContent='LOADING GUEST FEATURE SETTINGS…';const policy=await loadGuestPolicy();guestPolicy=policy;if(!policy.enabled)throw Error('Guest artwork access is disabled by the administrator. Your artwork is unchanged.');guestName=name;artOnly=true;token='';form.elements.username.value=name;form.elements.username.readOnly=false;try{localStorage.setItem('ldmOnlineUsername',name)}catch(_){}viewReady(false);gate?.remove();closeConnection();document.dispatchEvent(new Event('ldm-online-identity'));status('ART ONLY · '+name+' · Administrator feature settings applied. LOGIN to submit.');requestAnimationFrame(()=>{const tab=policy.sections.includes('draw')?'draw':policy.sections[0];if(tab)document.querySelector('.v3ArtworkModeTabs [data-artmode="'+tab+'"]')?.click();});}
 catch(error){if(note)note.textContent=error.message;else status(error.message);if(artOnly)viewReady(false);}
 finally{if(trigger)trigger.disabled=false;}
}
setInterval(async()=>{if(!artOnly||token||!guestName||document.hidden)return;try{guestPolicy=await loadGuestPolicy();viewReady(false);if(!guestPolicy.enabled)status('Guest artwork access is disabled by the administrator. Your artwork is retained.');}catch(_){}},60000);

viewReady(false);
let piOffline=false;
const PI_OFFLINE_MESSAGE='Pi is currently offline or unreachable. You can keep making art. Click SAVE COMPOSITION (SVG) to download your artpiece. Your composition is unchanged.';
const networkFailure=e=>e?.ldmOffline===true||['TimeoutError','AbortError'].includes(e?.name)||/(load failed|failed to fetch|network|fetch failed|timed? out|timeout)/i.test(e?.message||'');
function showPiOffline(){piOffline=true;status(PI_OFFLINE_MESSAGE);const panel=document.getElementById('ldmOnlineConnection');if(panel&&panel.dataset.open!=='true')document.getElementById('ldmOnlineDrawerButton')?.click();}
let endpoint='',token='',connection='PI INBOX OFFLINE — SUBMISSION UNAVAILABLE';
let resume;try{resume=localStorage.getItem('ldmOnlineBrowserIdentity');}catch{}
if(!/^[a-f0-9]{64}$/.test(resume||'')){resume=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');try{localStorage.setItem('ldmOnlineBrowserIdentity',resume)}catch{}}
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
function status(text){if(text==='PI INBOX ONLINE — DIRECT INBOX')piOffline=false;connection=text;const el=document.getElementById('ldmOnlineStatus');if(el)el.textContent=text;}
function validEndpoint(text){const url=new URL(text);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Enter the Pi tunnel HTTPS origin only.');return url.origin;}
function syncAllowance(d){if(!Number.isFinite(d.expires_at)||!Number.isFinite(d.server_time))return;Object.assign(access,{expires_at:d.expires_at,submission_limit:d.submission_limit,submissions_used:d.submissions_used,submissions_remaining:d.submissions_remaining});accessClock={end:d.expires_at,server:d.server_time,at:performance.now()};tick();document.dispatchEvent(new Event('ldm-online-allowance'));}
function tick(){const box=document.getElementById('ldmOnlineAllowance');if(!box||!accessClock)return;const seconds=Math.max(0,Math.ceil(accessClock.end-accessClock.server-(performance.now()-accessClock.at)/1000));box.hidden=false;const hours=Math.floor(seconds/3600),mins=Math.floor(seconds%3600/60),secs=seconds%60;const time=(hours?String(hours).padStart(2,'0')+':':'')+String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');const quota=access.submission_limit==null?'UNLIMITED (shared LAN password)':access.submissions_used+' / '+access.submission_limit+' USED · '+access.submissions_remaining+' LEFT';const text='LOGIN TIME LEFT: '+time+' · SUBMISSIONS: '+quota;if(box.textContent!==text)box.textContent=text;const badge=document.getElementById('ldmOnlineDrawAllowance');if(badge){badge.hidden=false;const short=time+' · '+(access.submissions_remaining==null?'UNLIMITED':access.submissions_remaining+' SUBMISSIONS LEFT');if(badge.textContent!==short)badge.textContent=short;}if(!seconds){token='';viewReady(false);box.hidden=false;box.textContent='LOGIN EXPIRED — reconnect to submit. Your drawing is retained.';status('LOGIN EXPIRED — SUBMISSION UNAVAILABLE');}}
setInterval(tick,1000);
async function remote(path,init={}){if(!token)throw Error('Open LOGIN and enter your access password before submitting or viewing submissions. Your artwork is retained.');if(!endpoint){showPiOffline();throw Error(PI_OFFLINE_MESSAGE);}const headers=new Headers(init.headers);headers.set('Authorization','Bearer '+token);headers.delete('X-LDM-CSRF');try{const r=await original(endpoint+path,{...init,headers,credentials:'omit',signal:init.signal||AbortSignal.timeout(20000)});if(r.status<500)piOffline=false;if(r.status>=500){const error=Error(PI_OFFLINE_MESSAGE);error.ldmOffline=true;throw error;}if(r.status===401||r.status===403){status('PI INBOX ACCESS UNAVAILABLE — RECONNECT');if(r.status===401||path==='/api/access'){token='';viewReady(false);}}else if(r.ok)status('PI INBOX ONLINE — DIRECT INBOX');if(path==='/api/access'||path==='/api/canvas'&&String(init.method||'GET').toUpperCase()==='POST'){try{syncAllowance(await r.clone().json())}catch(_){}}return r;}catch(e){showPiOffline();throw Error(PI_OFFLINE_MESSAGE+' If a submission was interrupted, check MY SUBMISSIONS before retrying.');}}
window.fetch=async function(input,init){const url=new URL(typeof input==='string'?input:input.url,location.href),path=url.pathname,method=String(init?.method||input?.method||'GET').toUpperCase();
 if(url.origin===location.origin&&path.includes('static/'))return original(input,init);
 if(path==='/api/access'){if(!token)return response({...access,ok:true});const r=await remote(path);if(r.ok){Object.assign(access,await r.clone().json());viewReady(access.online_view_ready===true);}return r;}
 if(path==='/bridge/lan-auth-status')return response({ok:true,local:false,network_access:true,password_lock:true,authenticated:true});
 if(path==='/bridge/version')return response({success:true,version:'V8.GUI.1 · PI ARTWORK INBOX'});
 if(path==='/api/art-lab/packs'&&!token)return original(new URL('static/online-packs.json',document.baseURI));
 if(path==='/api/language-packs'&&token)return remote(path+url.search,init||{});
 if(path==='/api/canvas'||/^\/api\/canvas\/[a-f0-9]{24}(?:\/cancel)?$/.test(path)||path==='/api/art-lab/packs'||/^\/api\/art-lab\/packs\/[a-zA-Z0-9_-]+\/algorithm.js$/.test(path)){
  if(input instanceof Request) init={method:input.method,headers:input.headers,...(!['GET','HEAD'].includes(input.method)?{body:await input.text()}:{}),...init};
  return remote(path+url.search,init||{method});
 }
 // Local bundled packs remain usable offline; online server algorithms require the Pi inbox.
 if(path==='/api/language-packs')return response({ok:false,error:'Use bundled languages in this editor.'},404);
 return response({ok:false,success:false,error:'ARTWORK_ONLY',message:'This online editor has no machine controls.'},403);
};
window.ldmOnlineImportModule=async function(path){if(!path.startsWith('/api/art-lab/packs/'))return import(new URL(path,document.baseURI).href);const r=await remote(path);if(!r.ok)throw Error('Algorithm unavailable.');const blob=URL.createObjectURL(new Blob([await r.text()],{type:'text/javascript'}));try{return await import(blob);}finally{URL.revokeObjectURL(blob);}};
function download(name,value){const u=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);}
function saveCompositionSvg(){
 const canvas=window.ldmCaptureSubmissionCanvas?.();if(!canvas)throw Error('Open DRAW / WRITE or VECTOR / CANVAS, then SAVE COMPOSITION (SVG).');
 const w=Number(canvas.width),h=Number(canvas.height);if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw Error('Artwork dimensions are invalid.');
 const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('width',w+'mm');svg.setAttribute('height',h+'mm');svg.setAttribute('viewBox','0 0 '+w+' '+h);
 const layers=canvas.layers?.length?canvas.layers:[{name:'ARTWORK',colour:'#333333',visible:true,paths:canvas.paths}],valid=[];
 for(const layer of layers){if(layer.visible===false)continue;const group=document.createElementNS(NS,'g');group.setAttribute('data-layer-name',String(layer.name||'ARTWORK'));group.setAttribute('fill','none');group.setAttribute('stroke',/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(layer.colour||'')?layer.colour:'#333333');group.setAttribute('stroke-width','0.4');group.setAttribute('stroke-linecap','round');group.setAttribute('stroke-linejoin','round');
  for(const path of layer.paths||[]){if(!Array.isArray(path)||path.length<2)continue;if(path.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw Error('Artwork contains invalid coordinates.');const line=document.createElementNS(NS,'polyline');line.setAttribute('points',path.map(p=>p.join(',')).join(' '));group.append(line);}
  if(group.children.length)valid.push(group);
 }
 if(!valid.length)throw Error('No visible artwork to download. Draw or place artwork on CANVAS first.');
 svg.append(...valid);const text='<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(svg),blob=new Blob([text],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LDM-COMPOSITION-'+new Date().toISOString().replace(/[:.]/g,'-')+'.svg';document.body.append(a);try{a.click();}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}status(piOffline?'SVG download started. Pi is offline or unreachable; keep creating and submit after reconnecting.':'SVG download started. Your artwork remains in the editor.');
}
async function importDraft(d){const c=d?.canvas;if(d?.schema!==1||!c||!Number.isFinite(c.width)||!Number.isFinite(c.height)||c.width<10||c.width>1000||c.height<10||c.height>3000||!Array.isArray(c.layers)||!c.layers.length||c.layers.length>200)throw Error('Invalid LDM composition.');let count=0,paths=0;const objects=[];for(const layer of c.layers){if(typeof layer.name!=='string'||layer.name.length>120||!/^#[0-9a-f]{6}$/i.test(layer.colour)||typeof layer.visible!=='boolean'||!Array.isArray(layer.paths)||!layer.paths.length)throw Error('Invalid layer.');let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of layer.paths){if(!Array.isArray(p)||p.length<2)throw Error('Invalid path.');paths++;for(const q of p){count++;if(!Array.isArray(q)||q.length!==2||!q.every(Number.isFinite)||q[0]<0||q[0]>c.width||q[1]<0||q[1]>c.height)throw Error('Invalid coordinate.');x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}}if(count>100000||paths>20000)throw Error('Composition exceeds submission limits.');const raw=layer.paths,text='<svg xmlns="http://www.w3.org/2000/svg">'+raw.map(p=>'<polyline fill="none" stroke="black" points="'+p.map(q=>q.join(',')).join(' ')+'"/>').join('')+'</svg>';objects.push({name:layer.name,text,raw,x:(x0+x1-c.width)/2,y:(y0+y1-c.height)/2,scale:100,rot:0,mx:false,my:false,visible:layer.visible,lineColour:layer.colour});}
 if(window.ldmCanvasImportBusy)throw Error('Wait for the current import.');if(!window.ldmRestoreDrawComposition)throw Error('Refresh this page to load the updated DRAW editor.');if(document.body.classList.contains('v3PreviewEditLocked'))throw Error('Unlock the preview before loading.');if(!await window.ldmConfirm('Replace the current CANVAS and DRAW / WRITE layers with this saved composition?','LOAD COMPOSITION'))return;
 document.getElementById('paperW').value=c.width;document.getElementById('paperH').value=c.height;window.ldmSvgObjects.splice(0,window.ldmSvgObjects.length,...objects);window.ldmSelectedSvg=-1;window.ldmSelectSvgObject(objects.length-1);window.ldmRenderComposition();if(typeof FTE!=='undefined')FTE.built=false;
 if(c.vector_options&&typeof c.vector_options.multicolour==='boolean'&&Number.isInteger(c.vector_options.hold_seconds)&&c.vector_options.hold_seconds>=1&&c.vector_options.hold_seconds<=600){window.ldmSetVectorColour?.(c.vector_options.multicolour);const h=document.getElementById('ldmVectorHoldSeconds');if(h)h.value=c.vector_options.hold_seconds;}
 document.querySelector('.v3ArtworkModeTabs [data-artmode="draw"]')?.click();window.ldmRestoreDrawComposition(c);status('EDITABLE DRAFT LOADED · DRAW / WRITE PREVIEW · '+connection);
}
function rememberChoice(enabled){try{if(enabled)localStorage.setItem('ldmOnlineRemember','true');else localStorage.removeItem('ldmOnlineRemember');}catch(_){}if(!enabled)navigator.credentials?.preventSilentAccess?.().catch(()=>{});}
async function saveRemembered(form){
 const enabled=form.elements.remember.checked;rememberChoice(enabled);if(!enabled)return;
 if(!window.PasswordCredential||!navigator.credentials?.store)return;
 try{await navigator.credentials.store(new PasswordCredential({id:form.elements.username.value.trim(),password:form.elements.password.value}));}catch(_){}
}
async function restoreRemembered(form){
 if(!form.elements.remember.checked||!navigator.credentials?.get||!window.PasswordCredential)return;
 try{const credential=await navigator.credentials.get({password:true,mediation:'optional'});if(!credential||!form.elements.remember.checked||access.submission_authenticated||form.elements.password.value)return;
 const entry=document.querySelector('#ldmOnlineNameGate form');if(entry?.elements.accessPassword.value)return;
 form.elements.username.value=credential.id;form.elements.password.value=credential.password;if(entry){entry.elements.artist.value=credential.id;entry.elements.accessPassword.value=credential.password;}
 }catch(_){}
}
function mountNameGate(form){
 const gate=document.createElement('div');gate.id='ldmOnlineNameGate';gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');gate.setAttribute('aria-labelledby','ldmNameTitle');
 gate.innerHTML='<form><h2 id="ldmNameTitle">MAKE ART OR CONNECT TO SUBMIT</h2><label>Username<input name="artist" type="text" maxlength="40" autocomplete="username" required></label><label>Online access password<input name="accessPassword" type="password" maxlength="256" autocomplete="current-password" required></label><label><input name="remember" type="checkbox"> Remember me on this browser</label><p class="tiny">Uses your browser password manager. Choose only on your own device.</p><button type="submit">CONNECT</button><button type="button" data-art-only>I JUST WANT TO MAKE ART — NO LOGIN</button><p role="status">Enter your username to make art without a password. Only features enabled by the administrator are shown. LOGIN later to submit. Your artwork stays in this page.</p></form>';
 gate.querySelector('[data-art-only]').onclick=startArtOnly;document.body.append(gate);const entry=gate.querySelector('form');entry.elements.accessPassword.value=form.elements.password.value;entry.elements.artist.value=form.elements.username.value;entry.elements.artist.focus();entry.elements.remember.checked=form.elements.remember.checked;entry.elements.remember.onchange=()=>{form.elements.remember.checked=entry.elements.remember.checked;rememberChoice(form.elements.remember.checked);};
 entry.onsubmit=async e=>{e.preventDefault();const b=entry.querySelector('button'),note=entry.querySelector('[role=status]');if(b.disabled)return;b.disabled=true;try{const username=entry.elements.artist.value.trim(),password=entry.elements.accessPassword.value;if(!/^[\p{L}\p{N}_ .-]{1,40}$/u.test(username))throw Error('Enter a username of 1–40 letters, numbers, spaces, dots, underscores or hyphens.');if(!password)throw Error('Enter your access password or scan its QR code.');form.elements.username.value=username;form.elements.password.value=password;form.elements.remember.checked=entry.elements.remember.checked;note.textContent='CONNECTING TO PI INBOX…';await form.onsubmit({preventDefault(){}});if(!access.submission_authenticated)throw Error(connection||'Connection failed.');entry.elements.accessPassword.value='';gate.remove();const panel=document.getElementById('ldmOnlineConnection');panel?.setAttribute('data-open','false');panel?.setAttribute('aria-hidden','true');document.getElementById('ldmOnlineDrawerButton')?.setAttribute('aria-expanded','false');}catch(error){note.textContent=error.message;}finally{b.disabled=false;}};
}
function mount(){const bar=document.createElement('details');bar.id='ldmOnlineConnection';bar.open=true;bar.innerHTML='<summary>ONLINE ARTWORK · PI INBOX</summary><form><label>Username<input name="username" type="text" maxlength="40" autocomplete="username" required></label><label>Online access password<input name="password" type="password" maxlength="256" autocomplete="current-password" required></label><label><input name="remember" type="checkbox"> Remember me on this browser</label><p class="tiny">Uses your browser password manager. Choose only on your own device.</p><button>CONNECT</button><button type="button" data-disconnect>DISCONNECT</button></form><p id="ldmOnlineAllowance" role="status" hidden></p><p id="ldmOnlineStatus" role="status"></p><div data-composition-tools><button type="button" data-save>SAVE COMPOSITION (SVG)</button><button type="button" data-save-draft>SAVE EDITABLE DRAFT (JSON)</button><button type="button" data-load>LOAD EDITABLE DRAFT (JSON)</button><input type="file" accept=".json,application/json" hidden></div><button type="button" data-art-only>I JUST WANT TO MAKE ART — NO LOGIN</button><p class="tiny">A username is required to make art; no password is needed. Administrator feature settings apply. Pi must be online and LOGIN is required to submit. Desktop can be off. Keep this page open until your artwork is submitted. DRAW / WRITE submits directly; other artwork tabs use CANVAS.</p>';
 document.body.appendChild(bar);const bed=document.getElementById('bed');if(bed){const badge=document.createElement('span');badge.id='ldmOnlineDrawAllowance';badge.hidden=true;badge.setAttribute('aria-label','Remaining login time and submissions');bed.append(badge);}
 const form=bar.querySelector('form'),connect=form.querySelector('button');connect.disabled=false;form.elements.password.disabled=false;try{form.elements.username.value=localStorage.getItem('ldmOnlineUsername')||''}catch{}
 try{form.elements.remember.checked=localStorage.getItem('ldmOnlineRemember')==='true';}catch(_){}
 form.elements.remember.onchange=()=>{rememberChoice(form.elements.remember.checked);const entry=document.querySelector('#ldmOnlineNameGate form');if(entry)entry.elements.remember.checked=form.elements.remember.checked;};
 applyScannedPassword();mountNameGate(form);
 restoreRemembered(form);

 const configure=async()=>{try{const r=await original(new URL('online-config.json',document.baseURI),{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Configuration unavailable.');const config=await r.json();if(!config.desktop_url)throw Error('Admin has not configured online submissions yet. You can compose and save locally.');endpoint=validEndpoint(config.desktop_url);connect.disabled=false;form.elements.password.disabled=false;status(artOnly&&!token?'ART ONLY — NO LOGIN · LOGIN when Pi is online to submit.':bar.dataset.qrPrefilled==='true'?'QR PASSWORD FILLED — enter your username, then CONNECT':'ENTER REMOTE PASSWORD TO CONNECT');}catch(e){endpoint='';if(networkFailure(e))showPiOffline();else status(e.message||'Online submissions are not configured. You can compose and save locally.');}};
 form.onsubmit=async e=>{e.preventDefault();const b=form.querySelector('button');b.disabled=true;try{await configure();b.disabled=true;if(!endpoint){if(piOffline){const error=Error(PI_OFFLINE_MESSAGE);error.ldmOffline=true;throw error;}throw Error('Admin has not configured online submissions yet. You can compose and save locally.');}token='';viewReady(false);status('CONNECTING TO PI INBOX…');const r=await original(endpoint+'/online/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify({username:form.elements.username.value.trim(),password:form.elements.password.value,resume_key:resume}),signal:AbortSignal.timeout(20000)});if(r.status<500)piOffline=false;if(r.status>=500){const error=Error(PI_OFFLINE_MESSAGE);error.ldmOffline=true;throw error;}const d=await r.json();if(!r.ok)throw Error(d.error||'Connection failed.');await saveRemembered(form);token=d.token;Object.assign(access,d);delete access.token;syncAllowance(d);access.submission_authenticated=true;guestName=d.username;guestPolicy=normalizeGuestPolicy({schema:1,enabled:true,sections:d.sections,inbox_enabled:d.inbox_enabled,online_inbox_visible:d.online_inbox_visible,draw_svg_upload:d.draw_svg_upload,draw_helpers:d.draw_helpers})||guestPolicy;artOnly=true;viewReady(access.online_view_ready===true);try{localStorage.setItem('ldmOnlineUsername',d.username)}catch{}form.elements.username.value=d.username;form.elements.username.readOnly=true;document.dispatchEvent(new Event('ldm-online-identity'));form.elements.password.value='';status('PI INBOX ONLINE — DIRECT INBOX');await window.ldmRefreshOwnCanvasSubmissions?.();document.dispatchEvent(new Event('change'));}catch(e){if(networkFailure(e))showPiOffline();else status(e.message||'Pi login failed. Your artwork is retained.');}finally{b.disabled=false;}};
 bar.querySelector('[data-art-only]').onclick=startArtOnly;
 bar.querySelector('[data-disconnect]').onclick=()=>{token='';access.submission_authenticated=false;viewReady(false);delete access.username;form.elements.username.readOnly=false;document.dispatchEvent(new Event('ldm-online-identity'));status('DISCONNECTED — KEEP MAKING ART · LOGIN to submit. Your composition is retained.');};
 bar.querySelector('[data-save]').onclick=()=>{try{saveCompositionSvg();}catch(e){status(e.message)}};
 bar.querySelector('[data-save-draft]').onclick=()=>{try{const canvas=window.ldmCaptureSubmissionCanvas();if(!canvas.layers)throw Error('Place artwork into VECTOR layers first.');download('LDM-COMPOSITION-'+Date.now()+'.json',{schema:1,canvas});}catch(e){status(e.message)}};
 const file=bar.querySelector('[type=file]');bar.querySelector('[data-load]').onclick=()=>file.click();file.onchange=async()=>{try{const f=file.files[0];if(!f)return;if(f.size>4*1024*1024)throw Error('Composition exceeds 4 MB.');await importDraft(JSON.parse(await f.text()));}catch(e){status(e.message)}finally{file.value='';}};status('LOADING CONNECTION SETTINGS…');configure();
 window.addEventListener('beforeunload',e=>{if(window.ldmSvgObjects?.length){e.preventDefault();e.returnValue='';}});
}
document.addEventListener('DOMContentLoaded',mount,{once:true});
})();
