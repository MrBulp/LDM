/* GUI.75: shared local raster framing before ART LAB algorithms. */
(()=>{'use strict';
 const selector='#ldmAlgImage,#ldmQDMImage,#ldmTclFile';let current=null,serial=0;const passing=new WeakSet();
 const defaults=()=>({left:0,right:0,top:0,bottom:0,zoom:100,x:0,y:0,rotate:0,outputEdge:0});
 function plan(width,height,s,limit=0){
  if(![width,height,limit,...Object.values(s)].every(Number.isFinite)||width<=0||height<=0||limit<0)throw Error('Invalid image framing values.');
  for(const k of ['left','right','top','bottom'])if(s[k]<0||s[k]>95)throw Error('Crop edges must be between 0 and 95%.');
  if(s.left+s.right>=99||s.top+s.bottom>=99)throw Error('Leave at least 1% of the image after cropping.');
  if(s.zoom<100||s.zoom>400||Math.abs(s.x)>100||Math.abs(s.y)>100||Math.abs(s.rotate)>180)throw Error('Check zoom, position and rotation limits.');
  const sx=width*s.left/100,sy=height*s.top/100,sw=width*(1-(s.left+s.right)/100),sh=height*(1-(s.top+s.bottom)/100),angle=s.rotate*Math.PI/180;
  const rw=Math.abs(sw*Math.cos(angle))+Math.abs(sh*Math.sin(angle)),rh=Math.abs(sw*Math.sin(angle))+Math.abs(sh*Math.cos(angle)),scale=Math.min(1,limit>0?limit/Math.max(rw,rh):1);
  return {sx,sy,sw,sh,angle,scale,width:Math.max(1,Math.round(rw*scale)),height:Math.max(1,Math.round(rh*scale)),zoom:s.zoom/100,x:s.x/100,y:s.y/100};
 }
 function render(image,settings,limit=0,canvas=document.createElement('canvas')){
  const p=plan(image.naturalWidth||image.width,image.naturalHeight||image.height,settings,limit);canvas.width=p.width;canvas.height=p.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image editing is unavailable in this browser.');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,p.width,p.height);ctx.save();ctx.translate(p.width/2+p.x*p.width/2,p.height/2+p.y*p.height/2);ctx.scale(p.scale*p.zoom,p.scale*p.zoom);ctx.rotate(p.angle);ctx.drawImage(image,p.sx,p.sy,p.sw,p.sh,-p.sw/2,-p.sh/2,p.sw,p.sh);ctx.restore();return canvas;
 }
 window.ldmArtImageFramePlan=plan;window.ldmArtImageFrameRender=render;
 const active=state=>current===state&&state.input.isConnected&&state.panel.isConnected;
 const blocked=()=>!!(window.V3_LDM_ENDING||window.ldmArtworkPreparationBusy?.()||window.ldmCanvasImportBusy);
 function close(){serial++;if(current){URL.revokeObjectURL(current.url);current.panel.remove();current=null;}}
 function stateText(s,text){s.message.textContent=text;}
 function values(s){const out={};for(const [key,input]of Object.entries(s.fields)){if(input.value.trim()==='')throw Error('Fill every framing value.');out[key]=Number(input.value);}if(!Number.isSafeInteger(out.outputEdge)||out.outputEdge<0)throw Error('OUTPUT longest edge must be a nonnegative whole number.');return out;}
 function preview(s){if(!active(s))return;try{render(s.image,values(s),768,s.canvas);stateText(s,'Preview only — APPLY IMAGE, then regenerate the algorithm preview.');s.apply.disabled=false;}catch(e){stateText(s,e.message);s.apply.disabled=true;}}
 async function apply(s,reset=false){if(!active(s)||s.busy)return;if(blocked()){stateText(s,'Wait until the current artwork capture / import finishes.');return;}
  s.busy=true;s.apply.disabled=true;const epoch=++s.epoch;
  try{
   const original=reset,settings=values(s);let file=s.file;
   if(!original){const c=render(s.image,settings,settings.outputEdge);const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Could not prepare the edited image.')),'image/png'));file=new File([blob],s.file.name.replace(/\.[^.]+$/,'')+'-framed.png',{type:'image/png'});}
   if(!active(s)||epoch!==s.epoch)return;if(blocked())throw Error('Artwork capture began. Apply the image again after capture finishes.');
   const dt=new DataTransfer();dt.items.add(file);s.input.files=dt.files;
   passing.add(s.input);try{s.input.dispatchEvent(new Event('change',{bubbles:true}));}finally{passing.delete(s.input);}
   stateText(s,(original?'Original image restored.':'Edited image applied.')+' Regenerate the algorithm preview. Existing CANVAS layers stay unchanged.');
  }catch(e){if(active(s))stateText(s,e.message||'Image framing failed.');}finally{if(active(s)){s.busy=false;s.apply.disabled=false;}}
 }
 async function open(input,file){close();if(!file)return;const token=serial,url=URL.createObjectURL(file);
  try{
   if(file.size>20*1024*1024)throw Error('Image framing limit: 20 MiB. Resize the image first.');
   const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Could not decode image.'));im.src=url;});
   if(token!==serial||!input.isConnected){URL.revokeObjectURL(url);return;}if((image.naturalWidth||image.width)*(image.naturalHeight||image.height)>40000000)throw Error('Resize this image below 40 megapixels first.');
   const panel=document.createElement('details');panel.id='ldmArtImageFrame';panel.open=true;panel.className='toolbox';const summary=document.createElement('summary');summary.textContent='IMAGE · CROP / ZOOM / ROTATE';panel.append(summary);
   const text=document.createElement('p');text.className='tiny';text.textContent='Edit the imported image before generating. Crops use percentages of the original image. White fills exposed edges. OUTPUT 0 keeps full-size pixels; enter a positive pixel limit to downsample. The original remains available until you switch algorithm or load another image.';panel.append(text);
   const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Edited ART LAB source image preview');Object.assign(canvas.style,{display:'block',width:'100%',maxHeight:'320px',objectFit:'contain',background:'#fff'});panel.append(canvas);
   const grid=document.createElement('div');grid.className='ldmAlgGrid';panel.append(grid);const fields={};
   for(const [key,label,min,max,step]of [['left','CROP LEFT (%)',0,95,1],['right','CROP RIGHT (%)',0,95,1],['top','CROP TOP (%)',0,95,1],['bottom','CROP BOTTOM (%)',0,95,1],['zoom','ZOOM (%)',100,400,5],['x','LEFT / RIGHT POSITION (%)',-100,100,1],['y','UP / DOWN POSITION (%)',-100,100,1],['rotate','ROTATE (°)',-180,180,1],['outputEdge','OUTPUT LONGEST EDGE (px) · 0 = full size',0,null,1]]){const labelNode=document.createElement('label');labelNode.textContent=label;const n=document.createElement('input');n.type='number';n.min=min;if(max!==null)n.max=max;n.step=step;n.value=defaults()[key];n.dataset.frameField=key;fields[key]=n;labelNode.append(n);grid.append(labelNode);}
   const row=document.createElement('div');row.className='row';row.style.flexWrap='wrap';const add=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.frameAction=action;row.append(b);return b;};const left=add('↶ 90°','left'),right=add('↷ 90°','right'),reset=add('RESET ORIGINAL','reset'),commit=add('APPLY IMAGE','apply');panel.append(row);const message=document.createElement('p');message.className='tiny';message.setAttribute('role','status');panel.append(message);
   const s={input,file,image,url,panel,canvas,message,fields,apply:commit,busy:false,epoch:0};current=s;
   const host=input.closest('.ldmAlgDrop')||input;host.after(panel);
   for(const field of Object.values(fields))field.oninput=()=>{s.epoch++;preview(s);};
   const rotate=delta=>{if(s.busy)return;fields.rotate.value=String(((Number(fields.rotate.value)+delta+540)%360)-180);preview(s);};left.onclick=()=>rotate(-90);right.onclick=()=>rotate(90);commit.onclick=()=>apply(s);
   reset.onclick=()=>{if(s.busy)return;for(const [key,n]of Object.entries(fields))n.value=defaults()[key];preview(s);apply(s,true);};preview(s);
  }catch(e){URL.revokeObjectURL(url);if(token===serial&&input.isConnected){const n=document.createElement('p');n.className='tiny';n.textContent=e.message+' The original file is unchanged.';input.after(n);}}
 }
 document.addEventListener('change',e=>{const input=e.target;if(!input.matches?.(selector)||passing.has(input))return;open(input,input.files?.[0]);},true);
 new MutationObserver(()=>{if(current&&!current.input.isConnected)close();}).observe(document.body,{subtree:true,childList:true});
 document.addEventListener('ldm-ending',close);
})();
