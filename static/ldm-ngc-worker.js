/* Geometry import only. Never executes source machine commands. */
function parseLdmNgc(text){
 let x=0,y=0,z=1,absolute=true,unit=1,motion=0,stroke=null,paths=[],segments=0;
 const finish=()=>{if(stroke&&stroke.length>1)paths.push(stroke);stroke=null;};
 const lines=text.split(/\r?\n/);
 for(let lineNo=0;lineNo<lines.length;lineNo++){
  let line=lines[lineNo].replace(/\([^)]*\)/g,'').split(';')[0].trim().toUpperCase();if(!line)continue;
  if(/[#$\[\]]/.test(line))throw Error('Expressions/macros are unsupported (line '+(lineNo+1)+').');
  const words=[...line.matchAll(/([A-Z])\s*([-+]?(?:\d*\.\d+|\d+\.?)(?:E[-+]?\d+)?)/g)];
  let axes={};
  for(const w of words){const n=Number(w[2]);if(!Number.isFinite(n))throw Error('Invalid number');
   if(w[1]==='G'){
    if(n===0||n===1)motion=n;else if(n===20)unit=25.4;else if(n===21)unit=1;else if(n===90)absolute=true;else if(n===91)absolute=false;
    else if(![4,17,40,49,54,94].includes(n))throw Error('Unsupported G'+n+' on line '+(lineNo+1)+'. Import stopped to avoid changing geometry.');
   }else if(w[1]==='M'){if(![2,30].includes(n))throw Error('M'+n+' pen/control mode is unsupported; this importer uses Z pen commands.');finish();return result();}
   else if('XYZ'.includes(w[1]))axes[w[1]]=n*unit;
  }
  const nx=axes.X===undefined?x:absolute?axes.X:x+axes.X,ny=axes.Y===undefined?y:absolute?axes.Y:y+axes.Y,nz=axes.Z===undefined?z:absolute?axes.Z:z+axes.Z;
  if(nz>0||motion===0)finish();
  if((axes.X!==undefined||axes.Y!==undefined)&&motion===1&&nz<=0&&(nx!==x||ny!==y)){
   if(!stroke)stroke=[[x,y]];stroke.push([nx,ny]);segments++;
   if(segments>2000000)throw Error('NGC exceeds 2 million drawing segments.');
  }
  x=nx;y=ny;z=nz;
 }
 finish();return result();
 function result(){if(!paths.length)throw Error('No drawing strokes found. Expected G1 XY moves with Z at or below zero.');return {paths,segments};}
}
if(typeof module!=='undefined')module.exports={parseLdmNgc};
if(typeof self!=='undefined')self.onmessage=e=>{try{const result=parseLdmNgc(e.data.text);let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;for(const st of result.paths)for(const [x,y]of st){minx=Math.min(minx,x);miny=Math.min(miny,y);maxx=Math.max(maxx,x);maxy=Math.max(maxy,y);}result.svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+[minx,miny,maxx-minx,maxy-miny].join(' ')+'">'+result.paths.map(st=>'<polyline fill="none" stroke="black" points="'+st.map(p=>p.join(',')).join(' ')+'"/>').join('')+'</svg>';self.postMessage({ok:true,...result})}catch(error){self.postMessage({ok:false,error:error.message})}};
