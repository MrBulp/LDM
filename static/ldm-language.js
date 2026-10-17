/* LDM interface localization. Machine values and user artwork never enter translation. */
(()=>{'use strict';
const languages=[['en','English'],['zh','中文'],['fr','Français'],['ko','한국어'],['ja','日本語'],['ar','العربية'],['es','Español']];
const $=id=>document.getElementById(id),originals=new WeakMap(),attributes=new WeakMap(),pending=new Set(),cache=new Map(),requests=new Map();
let redrawPending=false,offlineOnly=false,buildingOffline=false;const offlinePacks=new Map();let catalog=[];
const normalizeUi=text=>String(text).trim().replace(/\s+/g,' ').toUpperCase();
let language='en',dictionary={},scheduled=false,translator=null,engineLanguage='',creating=null,revision=0,active=0,failed=0;
try{language=localStorage.getItem('ldm-language')||'en';}catch(_){}if(!languages.some(([code])=>code===language))language='en';
const exclude='script,style,textarea,svg,canvas,pre,code,[contenteditable],#ldmLanguageControls,#ldmEntryConnectionGuide,#glyphPalette,#glyphPreview,#ldmSvgList,#ldmHomeInboxList,#canvasPreview,[data-ldm-no-translate]';
const fileSelects='#sdPlotFiles,#ldmSlicedFiles,#sdFiles,#sdFileList';
const protectedPattern=/(?:\b(?:https?:\/\/|file:\/\/)[^\s<>]+|\b[\w().-]+\.(?:gcode(?:\.3mf)?|3mf|stl|svg|png|jpe?g|ngc|json|zip)\b|\b(?:G\d+|M\d+)(?:\s+[XYZEFSP][+-]?[\d.]+)*|\b(?:LDM|Bambu|A1|P1S|A1mini|MQTT|FTPS|XYZ|SVG|STL|PNG|SD|LAN|IP|TCM|TCD|FTSZ|SZ|ZLS|ZL|CNC|AMS)\b|\b\d+(?:\.\d+){3}\b|\b\d+(?:\.\d+)?\s*(?:mm\/min|mm|MiB|MB|KiB|KB|ms|°C|C|%)\b)/gi;
function readOriginal(node){let record=originals.get(node);if(!record||node.nodeValue!==record.rendered)record={original:node.nodeValue};originals.set(node,record);return record;}
function permitted(node){const element=node.nodeType===3?node.parentElement:node;if(!element||element.closest(exclude))return false;if(element.closest('option')?.parentElement?.matches(fileSelects))return false;return true;}
function basic(text){const index=languages.findIndex(([code])=>code===language)-1;if(index<0)return text;const key=normalizeUi(text),saved=offlinePacks.get(language)?.[key];if(saved)return text.replace(text.trim(),saved);const entry=dictionary[key];if(Array.isArray(entry))return text.replace(text.trim(),entry[index]);const count=key.match(/^INBOX\s*(\(\d+\))$/);if(count&&dictionary.INBOX)return text.replace(text.trim(),dictionary.INBOX[index]+' '+count[1]);return null;}
function status(message){const node=$('ldmLanguageStatus');if(node&&node.textContent!==message)node.textContent=message;}
function progress(){if(buildingOffline)return;if(language==='en'){status('English');return;}if(!translator){return;}status(active||requests.size?'TRANSLATING… '+requests.size+' pending':failed?'TRANSLATION INCOMPLETE · '+failed+' messages failed. Select the language again to retry.':'LANGUAGE READY · '+languages.find(([c])=>c===language)[1]);}
function cacheKey(code,text){return code+'\u0000'+text;}
async function translateProtected(engine,text){
 const parts=text.split(protectedPattern),matches=text.match(protectedPattern)||[];let result='';
 for(let i=0;i<parts.length;i++){const part=parts[i];if(/[A-Za-z]{2}/.test(part)){const lead=part.match(/^\s*/)[0],tail=part.match(/\s*$/)[0];result+=lead+await engine.translate(part.trim())+tail;}else result+=part;if(i<matches.length)result+=matches[i];}
 return result;
}
function requestTranslation(text,apply){
 if(!translator||engineLanguage!==language||!/[A-Za-z]{2}/.test(text)||text.length>12000)return;
 const code=language,key=cacheKey(code,text);if(cache.has(key)){apply(cache.get(key));return;}
 let request=requests.get(key);if(request){request.callbacks.add(apply);return;}
 request={code,text,callbacks:new Set([apply]),engine:translator,revision};requests.set(key,request);pump();
}
async function pump(){if(active)return;active=1;progress();try{
 while(requests.size){const [key,request]=requests.entries().next().value;
  if(request.revision!==revision||request.code!==language){requests.delete(key);continue;}
  try{const value=await translateProtected(request.engine,request.text);if(request.revision===revision){cache.set(key,value);for(const apply of request.callbacks)apply(value);}}
  catch(error){if(request.revision===revision){failed++;console.warn('LDM UI translation failed',error?.name||'Error');}}
  finally{requests.delete(key);}
  await new Promise(resolve=>setTimeout(resolve,0));
 }
}finally{active=0;progress();}}
function nodeText(node){if(!permitted(node))return;const record=readOriginal(node),source=record.original,code=language;const quick=basic(source);const apply=value=>{if(language!==code||!node.isConnected||originals.get(node)!==record||(node.nodeValue!==record.rendered&&record.rendered!==undefined))return;record.rendered=value;if(node.nodeValue!==value)node.nodeValue=value;};apply(quick??source);if(quick===null)requestTranslation(source,apply);}
function elementAttributes(element){if(!permitted(element))return;if(element.tagName==='OPTION'&&!element.hasAttribute('value'))element.setAttribute('value',element.value);let records=attributes.get(element)||{};attributes.set(element,records);for(const name of ['title','placeholder','aria-label','alt']){if(!element.hasAttribute(name))continue;const current=element.getAttribute(name);let record=records[name];if(!record||record.rendered!==current)record={original:current};records[name]=record;const code=language,apply=value=>{if(language!==code||records[name]!==record||!element.isConnected)return;if(element.getAttribute(name)!==record.rendered&&record.rendered!==undefined)return;record.rendered=value;if(element.getAttribute(name)!==value)element.setAttribute(name,value);};const quick=basic(record.original);apply(quick??record.original);if(quick===null)requestTranslation(record.original,apply);}}
// Reject excluded subtrees before traversal: SVG geometry has no UI translation work.
function walk(root){if(!permitted(root))return;if(root.nodeType===3){nodeText(root);return;}if(root.nodeType!==1)return;elementAttributes(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode(node){if(node.nodeType===1&&node.matches(exclude))return NodeFilter.FILTER_REJECT;if(node.nodeType===3&&!/[\S]/.test(node.nodeValue||''))return NodeFilter.FILTER_SKIP;return NodeFilter.FILTER_ACCEPT;}});let node;while(node=walker.nextNode()){if(node.nodeType===3)nodeText(node);else elementAttributes(node);}}
function translateConnectionGuide(){const guide=$('ldmEntryConnectionGuide'),lines=dictionary.__connectionGuide?.[language];if(!guide||!lines)return;const heading=guide.querySelector('b');if(heading&&heading.textContent!==lines[0])heading.textContent=lines[0];guide.querySelectorAll('li').forEach((line,index)=>{if(lines[index+1]&&line.textContent!==lines[index+1])line.textContent=lines[index+1];});const direction=language==='ar'?'rtl':'ltr';if(guide.dir!==direction)guide.dir=direction;}
function flush(){scheduled=false;translateConnectionGuide();const roots=new Set(pending);pending.clear();for(const root of roots){if(!root.isConnected)continue;let parent=root.parentNode,covered=false;while(parent){if(roots.has(parent)){covered=true;break;}parent=parent.parentNode;}if(!covered)walk(root);}}
function queue(root){if(!root?.isConnected||!permitted(root))return;if(root.nodeType===3&&!/\S/.test(root.nodeValue||''))return;pending.add(root);if(!scheduled){scheduled=true;requestAnimationFrame(flush);}}
async function enableFullTranslation(userGesture=false){
 if(language==='en')return;
 if(offlineOnly){status('OFFLINE LANGUAGE FILES · Unlisted text remains English.');return;}
 if(!('Translator' in window)){status('BASIC PACK ONLY · Full translation needs desktop Chrome with built-in Translator.');return;}
 const code=language,version=revision;if(engineLanguage===code&&translator){queue(document.body);return;}
 if(creating===code)return;creating=code;status('CHECKING LANGUAGE PACK…');
 try{const options={sourceLanguage:'en',targetLanguage:code};const availability=await window.Translator.availability(options);if(version!==revision)return;
  if(availability==='unavailable')throw Error('This language pair is unavailable in this browser.');
  if(availability!=='available'&&!userGesture){status('CLICK ENABLE FULL TRANSLATION · first use may download a language pack.');return;}
  const next=await window.Translator.create({...options,monitor(m){m.addEventListener('downloadprogress',event=>{if(version===revision)status('DOWNLOADING LANGUAGE PACK… '+Math.round(event.loaded*100)+'%');});}});
  if(version!==revision){next.destroy?.();return;}translator?.destroy?.();translator=next;engineLanguage=code;failed=0;queue(document.body);progress();
 }catch(error){if(version===revision)status('BASIC PACK ONLY · '+(error?.message||'Language pack unavailable.'));}
 finally{if(creating===code)creating=null;}
}
function setLanguage(code,userGesture=false){if(!languages.some(([value])=>value===code))return;revision++;requests.clear();language=code;failed=0;try{localStorage.setItem('ldm-language',code);}catch(_){}document.documentElement.lang=code;document.documentElement.classList.toggle('ldm-language-ar',code==='ar');const select=$('ldmLanguageSelect');if(select)select.value=code;queue(document.body);redrawUi();if(code==='en')status('English');else loadOfflinePack(code,revision).then(found=>{if(code!==language)return;if(offlineOnly||found){status('OFFLINE LANGUAGE FILE · '+Object.keys(offlinePacks.get(code)||{}).length+' entries');}else enableFullTranslation(userGesture);});}
async function loadOfflinePack(code,version){
 try{const response=await fetch('/api/language-packs?locale='+encodeURIComponent(code),{cache:'no-store'}),pack=await response.json();if(!response.ok||!pack.ok)return false;offlinePacks.set(code,pack.entries||{});if(version===revision)queue(document.body);return Object.keys(pack.entries||{}).length>0;}catch(_){return false;}
}
async function saveOfflinePack(){
 const code=language,version=revision,button=$('ldmLanguageSavePack');if(code==='en'){status('Choose a non-English language to create its offline file.');return;}if(!window.LDM_ACCESS?.admin){status('Administrator login is required to save language files.');return;}
 if(buildingOffline)return;buildingOffline=true;if(button)button.disabled=true;
 try{
  if(!catalog.length)throw Error('UI text catalog is unavailable. Reload LDM.');
  const entries={...(offlinePacks.get(code)||{})},needed=catalog.filter(text=>!basic(text)&&!cache.has(cacheKey(code,text)));
  if(needed.length){await enableFullTranslation(true);if(!translator||engineLanguage!==code)throw Error('Enable this language with your downloaded browser pack before building its offline file.');}
  let done=0;for(const source of catalog){if(version!==revision)throw Error('Language changed; offline file was not saved.');const key=normalizeUi(source);if(!entries[key])entries[key]=basic(source)??cache.get(cacheKey(code,source))??await translateProtected(translator,source);if(++done%10===0){status('BUILDING OFFLINE FILE… '+done+' / '+catalog.length);await new Promise(resolve=>setTimeout(resolve,0));}}
  if(version!==revision)throw Error('Language changed; offline file was not saved.');
  const pack={format:'ldm-ui-language-v1',source:'en',locale:code,entries};
  status('SAVING OFFLINE LANGUAGE FILE…');const response=await fetch('/api/admin/language-packs/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pack)}),result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'Language file could not be saved.');
  offlinePacks.set(code,entries);queue(document.body);
  const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=code+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('OFFLINE FILE SAVED · '+result.filename+' · '+result.entries+' entries · '+result.missing+' catalog entries missing');
 }catch(error){status('OFFLINE FILE NOT SAVED · '+error.message);}finally{buildingOffline=false;if(button)button.disabled=false;}
}
function mount(){if($('ldmLanguageControls'))return;const head=document.querySelector('#v3GoldenConnectModal .gc-head');if(!head)return;const box=document.createElement('div');box.id='ldmLanguageControls';box.className='ldmEntrySection';box.innerHTML='<div class="ldmLanguageRow"><label for="ldmLanguageSelect"><span>LANGUAGE</span><select id="ldmLanguageSelect" aria-label="LDM language"></select></label><button id="ldmLanguageEnable" type="button">ENABLE FULL TRANSLATION</button></div><button id="ldmLanguageSavePack" type="button">BUILD &amp; SAVE OFFLINE LANGUAGE PACK</button><small id="ldmLanguageStatus" role="status"></small>';const select=box.querySelector('select');for(const [code,name]of languages){const option=document.createElement('option');option.value=code;option.textContent=name;select.appendChild(option);}select.value=language;select.onchange=()=>setLanguage(select.value,true);box.querySelector('button').onclick=()=>{failed=0;enableFullTranslation(true);};box.querySelector('#ldmLanguageSavePack').onclick=saveOfflinePack;head.after(box);}
async function start(){mount();new MutationObserver(records=>{mount();for(const record of records){if(record.type==='characterData'){if(originals.get(record.target)?.rendered===record.target.nodeValue)continue;queue(record.target);}else if(record.type==='attributes'){if(attributes.get(record.target)?.[record.attributeName]?.rendered===record.target.getAttribute(record.attributeName))continue;queue(record.target);}else for(const node of record.addedNodes)queue(node);}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt']});try{const response=await fetch('static/ldm-language-data.json?v7gui50');if(!response.ok)throw Error('Language pack unavailable');dictionary=await response.json();}catch(error){console.error(error);}try{const loaded=await Promise.all([fetch('static/ldm-language-catalog.json?v7gui50').then(r=>r.json()),fetch('static/ldm-language-config.json?v7gui50').then(r=>r.json())]);catalog=loaded[0].strings||[];offlineOnly=loaded[1].offline_only===true;}catch(_){offlineOnly=true;status('Offline language configuration unavailable; browser model disabled.');}setLanguage(language);}
function redrawUi(){if(redrawPending)return;redrawPending=true;requestAnimationFrame(()=>{redrawPending=false;document.dispatchEvent(new Event('ldm-language-redraw'));});}
window.ldmLocalizePreviewContext=function(context){return new Proxy(context,{get(target,key){if(['fillText','strokeText','measureText'].includes(key))return function(text,...args){const source=String(text),translated=window.ldmTranslateUiText(source);if(basic(source)===null&&!cache.has(cacheKey(language,source)))requestTranslation(source,redrawUi);return target[key](translated,...args);};const value=target[key];return typeof value==='function'?value.bind(target):value;},set(target,key,value){target[key]=value;return true;}});};
window.ldmUiSourceText=function(node){if(!node)return '';if(node.nodeType===3){const record=originals.get(node);return record&&node.nodeValue===record.rendered?record.original:node.nodeValue||'';}if(!node.childNodes)return node.textContent||'';return Array.from(node.childNodes).map(child=>child.nodeType===8?'':window.ldmUiSourceText(child)).join('');};
window.ldmBuildOfflineLanguagePack=saveOfflinePack;window.ldmSetLanguage=setLanguage;window.ldmTranslateUiText=text=>basic(String(text))??cache.get(cacheKey(language,String(text)))??String(text);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
