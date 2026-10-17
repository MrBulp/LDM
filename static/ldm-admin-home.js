(()=>{'use strict';
 const state=window.LDM_ACCESS;if(!state?.local)return;
 async function loginPopup(){
   const popup=document.createElement('div');popup.id='ldmAdminLoginPopup';popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-labelledby','ldmAdminHomeTitle');
   popup.innerHTML='<div class="ldm-modal-card"><h2 id="ldmAdminHomeTitle">ADMINISTRATOR LOGIN</h2><p id="ldmAdminHomeHint"></p><form><label>Password<input type="password" minlength="8" maxlength="256" required></label><p role="status"></p><button type="submit">LOGIN</button></form></div>';
   const form=popup.querySelector('form'),input=form.querySelector('input'),button=form.querySelector('button'),message=form.querySelector('[role=status]');
   popup.querySelector('#ldmAdminHomeTitle').textContent=state.setup_required?'CREATE ADMINISTRATOR PASSWORD':'ADMINISTRATOR LOGIN';
   popup.querySelector('#ldmAdminHomeHint').textContent=state.setup_required?'Create your administrator password (at least 8 characters).':'Enter your administrator password to unlock LDM.';
   input.autocomplete=state.setup_required?'new-password':'current-password';button.textContent=state.setup_required?'CREATE PASSWORD':'LOGIN';
   form.onsubmit=async e=>{e.preventDefault();if(button.disabled)return;button.disabled=true;message.textContent='';try{
     const response=await fetch(state.setup_required?'/api/admin/setup':'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input.value})});
     const data=await response.json();if(!response.ok)throw new Error(data.error||'Login failed');
     input.value='';try{sessionStorage.setItem('ldmAdminLoginHomeOnce','1')}catch(_){}location.replace('/');
   }catch(err){message.textContent=err.message;button.disabled=false;input.focus()}};
   document.body.appendChild(popup);input.focus();
 }
 let loading,initialized=false;
 function selectAdministrator(){
   const pane=document.getElementById('ldmAdministratorPane');if(!pane||!pane.closest('#v3StepShow.open .v3Direct-advanced'))return;
   document.querySelectorAll('#rightPanel .v3AdvancedPane').forEach(p=>p.style.setProperty('display','none','important'));
   pane.hidden=false;pane.style.removeProperty('display');
   pane.querySelectorAll('.ldmAdminCollapsible,#machineSizeSection').forEach(section=>{section.open=false;});
   document.querySelectorAll('#v3AdvancedTabs [data-advtab]').forEach(b=>b.classList.toggle('active',b.dataset.advtab==='administrator'));
   document.body.classList.add('v3-advanced');
   if(!loading)loading=(async()=>{try{
     const response=await fetch('static/ldm-admin-panel.html?v7gui144',{cache:'no-store'});if(!response.ok)throw new Error('Administrator panel unavailable');pane.innerHTML=await response.text();window.ldmMountSharedRecovery?.();const machineSettings=document.getElementById('machineSizeSection'),machineDock=pane.querySelector('#ldmAdminMachineSettingsDock');if(machineSettings&&machineDock){machineDock.appendChild(machineSettings);machineSettings.open=false;}const remote= document.querySelector('#v3RemoteModal .v3RemoteCard, #v3AdvancedRemotePane .v3RemoteCard');const remoteHost=pane.querySelector('#ldmAdminRemoteViewTools');if(remote&&remoteHost){remoteHost.appendChild(remote);remote.querySelector('.v3RemoteHead h2').textContent='iPAD / REMOTE VIEW';window.v3LoadRemoteUrls?.();}
     const script=document.createElement('script');script.src='static/ldm-admin.js?v7gui144';pane.appendChild(script);
   }catch(err){pane.textContent=err.message;loading=null}})();
 }
 function start(){
   if(!state.admin){if(window.ldmStartEntry)window.ldmStartEntry();else loginPopup();return;}
   if(initialized)return;const tabs=document.getElementById('v3AdvancedTabs');if(!tabs)return;initialized=true;tabs.querySelector('[data-advtab="remote"]')?.remove();window.v3FUVShowRemoteAdvanced=selectAdministrator;window.v3OpenRemoteView=selectAdministrator;
   tabs.hidden=true; // SETTING opens the existing Administrator content directly.
   const pane=document.createElement('section');pane.id='ldmAdministratorPane';pane.className='v3AdvancedPane';pane.hidden=true;tabs.insertAdjacentElement('afterend',pane);
   document.addEventListener('click',e=>{const tab=e.target.closest?.('#v3AdvancedTabs [data-advtab]');if(tab&&tab.dataset.advtab!=='administrator'){pane.hidden=true;pane.style.removeProperty('display')}},true);
   const previous=window.v3SetAdvancedTab;if(typeof previous==='function')window.v3SetAdvancedTab=function(tab){return selectAdministrator()};
   const exit=window.v3PresentationExit;if(typeof exit==='function')window.v3PresentationExit=function(){pane.hidden=true;pane.style.removeProperty('display');return exit.apply(this,arguments)};
   const openSetting=window.v3PresentationOpenTab;if(typeof openSetting==='function')window.v3PresentationOpenTab=async function(kind,...args){const result=await openSetting.call(this,kind,...args);if(kind==='advanced')selectAdministrator();return result;};
   if(new URLSearchParams(location.search).has('administrator')){window.v3PresentationOpenTab('advanced').then(selectAdministrator);history.replaceState(null,'',location.pathname)}
 }
 document.addEventListener('ldm-administrator-unlocked',start);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
