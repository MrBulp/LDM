/* One read-only downloader shared by both OPEN FILES lists. */
(()=>{'use strict';let busy=false;
 const bytes=n=>((Number(n)||0)/1048576).toFixed(2)+' MiB';
 function mount(listId){const list=document.getElementById(listId);if(!list)return;
  const row=document.createElement('div'),button=document.createElement('button'),status=document.createElement('div'),track=document.createElement('div'),bar=document.createElement('div');
  row.style.marginTop='10px';button.type='button';button.textContent='DOWNLOAD SELECTED FILE';status.className='tiny';status.setAttribute('role','status');
  track.style.cssText='height:4px;background:var(--bp-line);margin-top:6px';bar.style.cssText='height:100%;width:0%;background:currentColor';track.appendChild(bar);row.append(button,status,track);list.after(row);
  button.addEventListener('click',async()=>{
   if(busy)return;if(list.disabled){status.textContent='Wait until the current job/transfer releases file selection.';return;}
   const options=Array.from(list.selectedOptions||[]);if(options.length!==1){status.textContent='Select exactly one file to download.';return;}
   const name=options[0].value;busy=true;button.disabled=true;window.v4chLockSdFilesDuringJob?.();bar.style.width='0%';status.textContent='READING PRINTER SD CARD — '+name;
   let polling=false;const timer=setInterval(async()=>{if(polling)return;polling=true;try{const r=await fetch('/api/admin/sd/download-progress',{cache:'no-store'}),p=await r.json();if(p.filename===name){status.textContent=p.status+' · '+bytes(p.sent)+' / '+bytes(p.total);bar.style.width=(p.total?Math.min(100,p.sent*100/p.total):0)+'%';}}catch(_){}finally{polling=false}},500);
   try{
    const r=await fetch('/api/admin/sd/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:name})});
    if(!r.ok){const d=await r.json();throw Error(d.error||'SD download failed.');}
    clearInterval(timer);const total=Number(r.headers.get('Content-Length'))||0,chunks=[];let received=0;
    if(r.body?.getReader){const reader=r.body.getReader();for(;;){const part=await reader.read();if(part.done)break;chunks.push(part.value);received+=part.value.byteLength;status.textContent='RECEIVING FILE — '+bytes(received)+' / '+bytes(total);bar.style.width=(total?Math.min(100,received*100/total):0)+'%';}}
    else{const blob=await r.blob();chunks.push(blob);received=blob.size;}
    if(total&&received!==total)throw Error('Incomplete download; the file was not saved.');
    const url=URL.createObjectURL(new Blob(chunks,{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    status.textContent='DOWNLOAD COMPLETE — '+name+' · '+bytes(received);bar.style.width='100%';
   }catch(e){status.textContent='DOWNLOAD ERROR — '+e.message;}
   finally{clearInterval(timer);busy=false;button.disabled=false;window.v4chUnlockSdFilesAfterJob?.();window.v3SyncSdFilesActiveJobLock?.();}
  });
 }
 const start=()=>{mount('sdPlotFiles');mount('ldmSlicedFiles');};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
