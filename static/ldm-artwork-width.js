/* GUI170: browser-width artwork toggle beside EXIT GUIDE. */
(function(){'use strict';let wide=false;
 function sync(shell){shell?.classList.toggle('ldmArtworkWide',wide);const b=document.getElementById('ldmArtworkBrowserWidth');if(b){b.setAttribute('aria-pressed',String(wide));b.textContent='⛶';b.title='Full browser width: '+(wide?'ON':'OFF');b.setAttribute('aria-label',b.title)}}
 window.ldmArtworkWidthMount=sync;
 window.ldmToggleArtworkWidth=function(){const shell=document.querySelector('#v3ShowStage .v3Direct-artwork');if(!shell)return;wide=!wide;sync(shell);window.dispatchEvent(new Event('resize'))};
})();
