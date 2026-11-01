import {env,pipeline} from '@huggingface/transformers';
self.onmessage=async event=>{
 const {texts,base}=event.data;
 try{
  env.allowRemoteModels=false;env.allowLocalModels=true;env.useBrowserCache=true;
  env.localModelPath=new URL('vendor/semantic/',base).href;
  env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
  env.backends.onnx.wasm.wasmPaths={mjs:new URL('vendor/onnx/ort-wasm-simd-threaded.mjs',base).href,wasm:new URL('vendor/onnx/ort-wasm-simd-threaded.wasm',base).href};
  self.postMessage({status:'loading'});
  const model=await pipeline('feature-extraction','all-MiniLM-L6-v2',{dtype:'q8',device:'wasm',local_files_only:true});
  const vectors=[];
  for(let start=0;start<texts.length;start+=8){const output=await model(texts.slice(start,start+8),{pooling:'mean',normalize:true,truncation:true,max_length:256});vectors.push(...output.tolist());self.postMessage({status:'progress',done:vectors.length,total:texts.length})}
  self.postMessage({status:'complete',vectors});await model.dispose();
 }catch(error){self.postMessage({status:'error',message:error.message||'Semantic comparison could not run on this browser.'})}
};
