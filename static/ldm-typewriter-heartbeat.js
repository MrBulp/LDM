/* Heartbeat only. This worker cannot submit, start or replay a line. */
(()=>{'use strict';
 let timer=0,config=null,busy=false,controller=null;
 function stop(){clearInterval(timer);timer=0;config=null;controller?.abort();controller=null;}
 async function beat(){
  if(!config||busy)return;busy=true;
  const current=config;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),3000);
  try{
   const response=await fetch(current.url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-LDM-CSRF':current.csrf},body:JSON.stringify({session_token:current.token}),signal:controller.signal});
   const value=await response.json();
   if(current!==config)return;
   if(response.ok&&value.success){postMessage({kind:'alive'});}
   else if(response.status===401||response.status===403||value.phase&&value.phase!=='ARMED'){
    postMessage({kind:'ended',error:value.error||'Typewriter session ended.'});stop();
   }
   // Busy/timeout responses may trigger another heartbeat, never a line retry.
  }catch(error){if(current===config)postMessage({kind:'network',error:'Heartbeat unavailable; no line will be retried.'});}
  finally{clearTimeout(timeout);controller=null;busy=false;}
 }
 onmessage=event=>{
  if(event.data?.kind==='stop'){stop();return;}
  if(event.data?.kind!=='start')return;
  stop();const url=new URL(event.data.url);
  if(url.origin!==self.location.origin||!['/api/admin/typewriter/heartbeat','/api/typewriter/heartbeat'].includes(url.pathname))return;
  config={url:url.href,csrf:event.data.csrf,token:event.data.token};beat();timer=setInterval(beat,1000);
 };
})();
