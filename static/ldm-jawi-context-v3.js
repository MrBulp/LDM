/* Jawi contextual tracing reference V3 — authoring-only. */
(function(){'use strict';
const NON_DUAL=new Set(Array.from('اأإآٱدذرزژوؤءةى'));
const NO_JOIN=new Set(Array.from('ء'));
const $=id=>document.getElementById(id);
function valid(ch,form){if(form==='isolated'||form==='final')return true;return !NON_DUAL.has(ch)&&!NO_JOIN.has(ch)}
const PRESENTATION_FORMS={"ٱ":{"isolated":"ﭐ","final":"ﭑ"},"ٻ":{"isolated":"ﭒ","final":"ﭓ","initial":"ﭔ","medial":"ﭕ"},"پ":{"isolated":"ﭖ","final":"ﭗ","initial":"ﭘ","medial":"ﭙ"},"ڀ":{"isolated":"ﭚ","final":"ﭛ","initial":"ﭜ","medial":"ﭝ"},"ٺ":{"isolated":"ﭞ","final":"ﭟ","initial":"ﭠ","medial":"ﭡ"},"ٿ":{"isolated":"ﭢ","final":"ﭣ","initial":"ﭤ","medial":"ﭥ"},"ٹ":{"isolated":"ﭦ","final":"ﭧ","initial":"ﭨ","medial":"ﭩ"},"ڤ":{"isolated":"ﭪ","final":"ﭫ","initial":"ﭬ","medial":"ﭭ"},"ڦ":{"isolated":"ﭮ","final":"ﭯ","initial":"ﭰ","medial":"ﭱ"},"ڄ":{"isolated":"ﭲ","final":"ﭳ","initial":"ﭴ","medial":"ﭵ"},"ڃ":{"isolated":"ﭶ","final":"ﭷ","initial":"ﭸ","medial":"ﭹ"},"چ":{"isolated":"ﭺ","final":"ﭻ","initial":"ﭼ","medial":"ﭽ"},"ڇ":{"isolated":"ﭾ","final":"ﭿ","initial":"ﮀ","medial":"ﮁ"},"ڍ":{"isolated":"ﮂ","final":"ﮃ"},"ڌ":{"isolated":"ﮄ","final":"ﮅ"},"ڎ":{"isolated":"ﮆ","final":"ﮇ"},"ڈ":{"isolated":"ﮈ","final":"ﮉ"},"ژ":{"isolated":"ﮊ","final":"ﮋ"},"ڑ":{"isolated":"ﮌ","final":"ﮍ"},"ک":{"isolated":"ﮎ","final":"ﮏ","initial":"ﮐ","medial":"ﮑ"},"گ":{"isolated":"ﮒ","final":"ﮓ","initial":"ﮔ","medial":"ﮕ"},"ڳ":{"isolated":"ﮖ","final":"ﮗ","initial":"ﮘ","medial":"ﮙ"},"ڱ":{"isolated":"ﮚ","final":"ﮛ","initial":"ﮜ","medial":"ﮝ"},"ں":{"isolated":"ﮞ","final":"ﮟ"},"ڻ":{"isolated":"ﮠ","final":"ﮡ","initial":"ﮢ","medial":"ﮣ"},"ۀ":{"isolated":"ﮤ","final":"ﮥ"},"ہ":{"isolated":"ﮦ","final":"ﮧ","initial":"ﮨ","medial":"ﮩ"},"ھ":{"isolated":"ﮪ","final":"ﮫ","initial":"ﮬ","medial":"ﮭ"},"ے":{"isolated":"ﮮ","final":"ﮯ"},"ۓ":{"isolated":"ﮰ","final":"ﮱ"},"ڭ":{"isolated":"ﯓ","final":"ﯔ","initial":"ﯕ","medial":"ﯖ"},"ۇ":{"isolated":"ﯗ","final":"ﯘ"},"ۆ":{"isolated":"ﯙ","final":"ﯚ"},"ۈ":{"isolated":"ﯛ","final":"ﯜ"},"ٷ":{"isolated":"ﯝ"},"ۋ":{"isolated":"ﯞ","final":"ﯟ"},"ۅ":{"isolated":"ﯠ","final":"ﯡ"},"ۉ":{"isolated":"ﯢ","final":"ﯣ"},"ې":{"isolated":"ﯤ","final":"ﯥ","initial":"ﯦ","medial":"ﯧ"},"ى":{"initial":"ﯨ","medial":"ﯩ","isolated":"ﻯ","final":"ﻰ"},"ی":{"isolated":"ﯼ","final":"ﯽ","initial":"ﯾ","medial":"ﯿ"},"ء":{"isolated":"ﺀ"},"آ":{"isolated":"ﺁ","final":"ﺂ"},"أ":{"isolated":"ﺃ","final":"ﺄ"},"ؤ":{"isolated":"ﺅ","final":"ﺆ"},"إ":{"isolated":"ﺇ","final":"ﺈ"},"ئ":{"isolated":"ﺉ","final":"ﺊ","initial":"ﺋ","medial":"ﺌ"},"ا":{"isolated":"ﺍ","final":"ﺎ"},"ب":{"isolated":"ﺏ","final":"ﺐ","initial":"ﺑ","medial":"ﺒ"},"ة":{"isolated":"ﺓ","final":"ﺔ"},"ت":{"isolated":"ﺕ","final":"ﺖ","initial":"ﺗ","medial":"ﺘ"},"ث":{"isolated":"ﺙ","final":"ﺚ","initial":"ﺛ","medial":"ﺜ"},"ج":{"isolated":"ﺝ","final":"ﺞ","initial":"ﺟ","medial":"ﺠ"},"ح":{"isolated":"ﺡ","final":"ﺢ","initial":"ﺣ","medial":"ﺤ"},"خ":{"isolated":"ﺥ","final":"ﺦ","initial":"ﺧ","medial":"ﺨ"},"د":{"isolated":"ﺩ","final":"ﺪ"},"ذ":{"isolated":"ﺫ","final":"ﺬ"},"ر":{"isolated":"ﺭ","final":"ﺮ"},"ز":{"isolated":"ﺯ","final":"ﺰ"},"س":{"isolated":"ﺱ","final":"ﺲ","initial":"ﺳ","medial":"ﺴ"},"ش":{"isolated":"ﺵ","final":"ﺶ","initial":"ﺷ","medial":"ﺸ"},"ص":{"isolated":"ﺹ","final":"ﺺ","initial":"ﺻ","medial":"ﺼ"},"ض":{"isolated":"ﺽ","final":"ﺾ","initial":"ﺿ","medial":"ﻀ"},"ط":{"isolated":"ﻁ","final":"ﻂ","initial":"ﻃ","medial":"ﻄ"},"ظ":{"isolated":"ﻅ","final":"ﻆ","initial":"ﻇ","medial":"ﻈ"},"ع":{"isolated":"ﻉ","final":"ﻊ","initial":"ﻋ","medial":"ﻌ"},"غ":{"isolated":"ﻍ","final":"ﻎ","initial":"ﻏ","medial":"ﻐ"},"ف":{"isolated":"ﻑ","final":"ﻒ","initial":"ﻓ","medial":"ﻔ"},"ق":{"isolated":"ﻕ","final":"ﻖ","initial":"ﻗ","medial":"ﻘ"},"ك":{"isolated":"ﻙ","final":"ﻚ","initial":"ﻛ","medial":"ﻜ"},"ل":{"isolated":"ﻝ","final":"ﻞ","initial":"ﻟ","medial":"ﻠ"},"م":{"isolated":"ﻡ","final":"ﻢ","initial":"ﻣ","medial":"ﻤ"},"ن":{"isolated":"ﻥ","final":"ﻦ","initial":"ﻧ","medial":"ﻨ"},"ه":{"isolated":"ﻩ","final":"ﻪ","initial":"ﻫ","medial":"ﻬ"},"و":{"isolated":"ﻭ","final":"ﻮ"},"ي":{"isolated":"ﻱ","final":"ﻲ","initial":"ﻳ","medial":"ﻴ"}};
function reference(ch,form){
 // Use Unicode presentation forms where available so the selected shape
 // is explicit even without surrounding letters. Malay extensions fall back
 // to shaping with tatweel context in the browser.
 const mapped=PRESENTATION_FORMS[ch]?.[form];
 if(mapped)return mapped;
 if(form==='initial')return ch+'ـ';
 if(form==='medial')return 'ـ'+ch+'ـ';
 if(form==='final')return 'ـ'+ch;
 return ch;
}
function update(){
 const form=$('ldmJawiForm'),ch=Array.from($('glyphChar')?.value||'ب')[0];if(!form)return;
 for(const opt of form.options)opt.disabled=!valid(ch,opt.value);
 if(!valid(ch,form.value))form.value='final';
 const info=$('ldmJawiContextInfoV3');if(info)info.textContent=`${ch} · ${form.value} — ${reference(ch,form.value)} · Faint glyph is a contextual Unicode guide, not a centerline path.`;
 if(typeof drawGlyphCanvas==='function')drawGlyphCanvas();
}
window.ldmJawiContextV3={reference,valid,update};
function setup(){const panel=$('ldmJawiStudio');if(!panel)return;
 const info=document.createElement('div');info.id='ldmJawiContextInfoV3';info.className='tiny';info.style.cssText='margin:6px 0;line-height:1.4';
 const form=$('ldmJawiForm');form?.parentNode?.appendChild(info);
 form?.addEventListener('change',()=>setTimeout(update,0));
 panel.addEventListener('click',e=>{if(e.target.closest('#ldmJawiPalette'))setTimeout(update,0)});
 $('ldmJawiMode')?.addEventListener('change',()=>setTimeout(update,0));
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
