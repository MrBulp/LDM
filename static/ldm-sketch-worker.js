importScripts('vendor/rough-4.6.6.js','ldm-sketch-core.js');
self.onmessage=e=>{try{self.postMessage({ok:true,result:self.ldmSketchGeometry(e.data.paths,e.data.settings,rough.generator())});}catch(error){self.postMessage({ok:false,error:error.message});}};
