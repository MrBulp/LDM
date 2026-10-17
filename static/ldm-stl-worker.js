'use strict';
function parseSTLFlat(buf){
 const size=(buf.byteLength/1048576).toFixed(2)+' MiB';if(buf.byteLength>50*1048576)throw Error('File size '+size+' exceeds the 50 MiB limit.');
 const dv=new DataView(buf),n=buf.byteLength>=84?dv.getUint32(80,true):0,binary=n>0&&84+50*n<=buf.byteLength;
 let flat;
 if(binary){if(n>250000)throw Error('File size '+size+' passes the 50 MiB limit, but '+n.toLocaleString('en-US')+' triangles exceeds the 250,000-triangle limit. Import rejected. Simplify or split the STL.');flat=new Float64Array(n*9);for(let i=0;i<n;i++)for(let j=0;j<9;j++)flat[i*9+j]=dv.getFloat32(84+i*50+12+j*4,true);}
 else{let values=[],m,re=/vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/g,txt=new TextDecoder().decode(buf);while((m=re.exec(txt))){values.push(+m[1],+m[2],+m[3]);if(values.length>250000*9)throw Error('File size '+size+' passes the 50 MiB limit, but this ASCII STL contains more than 250,000 triangles. Import rejected. Simplify or split the STL.');}if(values.length%9)throw Error('Incomplete STL triangle');flat=new Float64Array(values);}
 if(!flat.length)throw Error('No STL triangles found');for(let v of flat)if(!Number.isFinite(v))throw Error('Invalid STL vertex coordinates');return flat;
}
self.onmessage=e=>{try{const flat=parseSTLFlat(e.data);self.postMessage({flat},[flat.buffer]);}catch(e){self.postMessage({error:e.message});}};
