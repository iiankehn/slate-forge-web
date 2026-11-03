// Check before opening the workspace; never reload over a failed or pending save.
export function automaticUpdates({serviceWorker=globalThis.navigator?.serviceWorker,enabled=globalThis.isSecureContext,beforeReload=async()=>true,reload=()=>globalThis.location.reload(),target=globalThis.window,online=()=>globalThis.navigator?.onLine!==false,timeout=12000,retryDelay=4000}={}){
 let registration=null,stopped=false,reloading=false,activating=false,needsReload=false,timer=null,checking=null,lastController=serviceWorker?.controller;
 const controlled=!!lastController,listeners=[];
 const listen=(object,event,fn)=>{object?.addEventListener(event,fn);listeners.push(()=>object?.removeEventListener(event,fn))};
 const later=()=>{if(!stopped&&!timer)timer=setTimeout(()=>{timer=null;(needsReload?reloadWhenSafe():attempt()).catch(()=>{})},retryDelay)};
 async function reloadWhenSafe(){
  if(stopped||reloading)return;
  try{if(!await beforeReload()){later();return}if(stopped||reloading)return;reloading=true;reload()}catch{later()}
 }
 function changed(){const next=serviceWorker.controller;if(next===lastController)return;const previous=lastController;lastController=next;if(!previous)return;needsReload=true;reloadWhenSafe().catch(()=>{})}
 async function attempt(){
  if(stopped||reloading||activating||!registration?.waiting)return;
  activating=true;
  try{if(!await beforeReload()){later();return}if(!stopped)registration.waiting?.postMessage({type:'ACTIVATE'})}catch{later()}finally{activating=false}
 }
 function watch(worker){if(!worker)return;listen(worker,'statechange',()=>{if(worker.state==='installed')attempt().catch(()=>{})});if(worker.state==='installed')attempt().catch(()=>{})}
 async function check(){
  if(stopped||!online()||!registration)return;if(checking)return checking;
  checking=Promise.resolve().then(async()=>{try{await registration.update();watch(registration.installing);await attempt()}catch{}}).finally(()=>{checking=null});return checking;
 }
 let ready=Promise.resolve();
 if(enabled&&serviceWorker){
  listen(serviceWorker,'controllerchange',changed);
  const boot=(async()=>{try{
   registration=await serviceWorker.register('./sw.js',{updateViaCache:'none'});
   listen(registration,'updatefound',()=>watch(registration.installing));watch(registration.installing);
   await check();
   // A bounded wait keeps offline or unreachable launches usable.
   const worker=registration.installing;
   if(worker&&controlled)await new Promise(resolve=>{if(['redundant','activated'].includes(worker.state))resolve();else listen(worker,'statechange',()=>{if(['redundant','activated'].includes(worker.state))resolve()})});
   if(registration.waiting&&controlled){const switched=new Promise(resolve=>listen(serviceWorker,'controllerchange',resolve));await attempt();await switched}
  }catch{}})();
  ready=new Promise(resolve=>{const limit=setTimeout(resolve,timeout);boot.finally(()=>{clearTimeout(limit);resolve()})});
  listen(target,'online',()=>check());listen(target,'pageshow',event=>{if(event.persisted)check()});listen(target,'focus',()=>check());
 }
 return {ready,get registration(){return registration},get reloading(){return reloading},check,dispose(){stopped=true;clearTimeout(timer);listeners.splice(0).forEach(remove=>remove())}};
}
