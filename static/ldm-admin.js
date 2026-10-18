(()=>{'use strict';
 const root=document.getElementById('ldmAdministratorPane');
 const el=id=>root.querySelector('#'+id);let access={},busy=false;
 function message(text,error=false){el('message').textContent=text;el('message').classList.toggle('error',error)}
 async function call(path,body){
   const r=await fetch(path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-LDM-CSRF':access.csrf||''},body:body===undefined?undefined:JSON.stringify(body)});
   const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');if(d.csrf){access.csrf=d.csrf;if(window.LDM_ACCESS)window.LDM_ACCESS.csrf=d.csrf}return d;
 }
 async function refreshAccess(){access=await call('/api/access');return access}
 async function load(){
   await refreshAccess();el('loginPanel').hidden=access.admin;el('adminPanels').hidden=!access.admin;el('adminNav').hidden=!access.admin;
   if(!access.local){el('loginPanel').hidden=true;message('Administrator access is available only on the Desktop at http://127.0.0.1:5426/admin.',true);return;}
   if(!access.admin){
     el('loginTitle').textContent=access.setup_required?'CREATE ADMINISTRATOR PASSWORD':'UNLOCK ADMINISTRATOR';
     el('loginHint').textContent=access.setup_required?'Create a password of at least eight characters. There is no default password.':'Enter your administrator password on this Desktop.';
     el('loginButton').textContent=access.setup_required?'CREATE PASSWORD':'UNLOCK';el('loginPassword').autocomplete=access.setup_required?'new-password':'current-password';
     message('Machine controls require administrator login.');return;
   }
   const s=await call('/api/admin/settings');el('remoteEnabled').checked=s.remote_enabled;if(el('onlineInboxVisible'))el('onlineInboxVisible').checked=s.online_inbox_visible!==false;el('inboxEnabled').checked=s.inbox_enabled!==false;el('submissionMode').value=s.mode;
   for(const [prefix,key] of [['remote','remote_draw_helpers'],['online','online_draw_helpers']]){if(el(prefix+'DrawA4'))el(prefix+'DrawA4').checked=s[key]?.a4!==false;if(el(prefix+'DrawWriting'))el(prefix+'DrawWriting').checked=s[key]?.writing!==false;}
   root.querySelectorAll('[name=onlineSection]').forEach(c=>c.checked=(s.online_sections||[]).includes(c.value));
   root.querySelectorAll('[name=section]').forEach(c=>c.checked=s.sections.includes(c.value));
   const lan=await call('/bridge/lan-security');el('lanEnabled').checked=lan.network_access;el('lanLocked').checked=lan.password_lock;el('lanStatus').textContent=lan.password_set?'Remote password is configured.':'No remote password configured.';
   const online=await call('/api/admin/online-artwork');if(el('onlineArtworkEnabled')){el('onlineArtworkEnabled').checked=online.enabled;el('onlineArtworkOrigin').value=online.origin;el('onlineArtworkStatus').textContent=online.enabled?'Artwork gateway enabled · '+online.gateway:'Artwork gateway disabled';}
   message('Administrator unlocked.');
 }
 function form(id,fn){if(!el(id))return;el(id).onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;const b=e.currentTarget.querySelector('button');b.disabled=true;try{await fn()}catch(err){message(err.message,true)}finally{busy=false;b.disabled=false}}}
 form('loginForm',async()=>{await call(access.setup_required?'/api/admin/setup':'/api/admin/login',{password:el('loginPassword').value});el('loginPassword').value='';location.replace('/')});
 form('settingsForm',async()=>{await call('/api/admin/settings',{remote_draw_helpers:{a4:el('remoteDrawA4').checked,writing:el('remoteDrawWriting').checked},online_draw_helpers:{a4:el('onlineDrawA4').checked,writing:el('onlineDrawWriting').checked},mode:el('submissionMode').value,remote_enabled:el('remoteEnabled').checked,online_inbox_visible:el('onlineInboxVisible').checked,online_sections:Array.from(root.querySelectorAll('[name=onlineSection]:checked')).map(c=>c.value),inbox_enabled:el('inboxEnabled').checked,sections:Array.from(root.querySelectorAll('[name=section]:checked')).map(c=>c.value)});message('Workspace settings saved. Pending submissions keep their existing status.');});
 form('lanForm',async()=>{const payload={network_access:el('lanEnabled').checked,password_lock:el('lanLocked').checked};if(el('lanPassword').value)payload.password=el('lanPassword').value;const d=await call('/bridge/lan-security',payload);el('lanPassword').value='';el('lanStatus').textContent=d.password_set?'Remote password is configured.':'No remote password configured.';message('Remote access settings saved.');});
 form('onlineArtworkForm',async()=>{const d=await call('/api/admin/online-artwork',{enabled:el('onlineArtworkEnabled').checked,origin:el('onlineArtworkOrigin').value});el('onlineArtworkStatus').textContent=d.enabled?'Artwork gateway enabled · '+d.gateway:'Artwork gateway disabled. Remote sessions revoked.';});
 form('passwordForm',async()=>{await call('/api/admin/password',{current_password:el('currentPassword').value,password:el('newPassword').value});el('currentPassword').value='';el('newPassword').value='';message('Administrator password changed. Other administrator sessions are locked.');});
 el('lanResetPassword').onclick=async()=>{try{if(!await window.ldmConfirm('Clear the mobile / LAN password and turn password protection OFF?','RESET REMOTE PASSWORD','RESET','CANCEL'))return;await call('/bridge/lan-security/reset-password',{});await load();}catch(e){message(e.message,true)}};
 el('logout').onclick=async()=>{try{await call('/api/admin/logout',{});location.replace('/')}catch(e){message(e.message,true)}};
 load().catch(e=>message(e.message,true));
 setInterval(async()=>{if(busy||!access.admin)return;try{const a=await refreshAccess();if(!a.admin){location.replace('/');return;}}catch(e){message(e.message,true)}},10000);
})();
