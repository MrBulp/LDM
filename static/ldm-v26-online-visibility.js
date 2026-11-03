/* LDM V26 online visibility: UI presentation only; server authorization is separate. */
(()=>{'use strict';
const defaults={"text_preview": true, "text_presets": true, "handwriting_variation": true, "send_to_canvas": true, "jawi_authoring": false, "vector_tab": true, "text_tab": true, "draw_write_tab": true, "gallery_tab": true};
const selectors={"text_preview": [".ldmTextStageWrap", "#ldmTextStage"], "text_presets": ["#ldmTextPresets", "#ldmTextPresetsPanel"], "handwriting_variation": ["#ldmHandwritingVariation", "#ldmHandwritingVariationPanel"], "send_to_canvas": ["#ldmSendToCanvas", "#ldmTextSendToCanvas"], "jawi_authoring": ["#ldmJawiStudio", "#ldmJawiSidebar", "#ldmJawiFloating"], "vector_tab": ["[data-artmode=\"vector\"]"], "text_tab": ["[data-artmode=\"text\"]"], "draw_write_tab": ["[data-artmode=\"draw\"]"], "gallery_tab": ["[data-artmode=\"gallery\"]"]};
let policy={...defaults};
const style=document.createElement('style');style.id='ldmV26VisibilityCSS';document.head.append(style);
function apply(){let rules=[];for(const [key,enabled] of Object.entries(policy)){if(enabled===false){for(const sel of selectors[key]||[])rules.push(sel+'{display:none!important}')}}style.textContent=rules.join('\\n');document.documentElement.dataset.ldmV26Visibility='loaded';}
function accept(data){if(!data||data.schema!=='ldm-online-visibility-v26'||!data.features||typeof data.features!=='object')return false;for(const key of Object.keys(defaults))if(typeof data.features[key]==='boolean')policy[key]=data.features[key];apply();return true;}
window.LDM_V26_VISIBILITY={get:()=>({...policy}),apply:accept};
apply();
// Heading-based section visibility for legacy controls whose IDs vary between editions.
function applyHeadings(){const terms={'text_presets':'TEXT PRESETS','handwriting_variation':'HANDWRITING VARIATION'};for(const [key,title] of Object.entries(terms)){document.querySelectorAll('summary').forEach(el=>{if(el.textContent.trim().toUpperCase()===title){const host=el.closest('details')||el.parentElement;if(host)host.style.display=policy[key]===false?'none':''}})}}
const originalApply=apply;apply=function(){originalApply();applyHeadings()};applyHeadings();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyHeadings,{once:true});
fetch('./online-visibility.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(accept).catch(()=>{});
})();