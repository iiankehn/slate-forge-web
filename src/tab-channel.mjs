// Ownership belongs to a live page, not an unloading document. In particular,
// a reload must not hear its previous document claim the same workspace.
export function navigationChannel(name,{host=window,Channel=BroadcastChannel}={}){
 let current=null,handler=null,active=false,disposed=false;
 function connect(){current=new Channel(name);current.onmessage=handler;active=true}
 function leave(){if(active)current.close();active=false}
 function resume(event){if(event.persisted&&!active&&!disposed)connect()}
 host.addEventListener('pagehide',leave);host.addEventListener('pageshow',resume);connect();
 return {
  set onmessage(value){handler=value;if(active)current.onmessage=value},get onmessage(){return handler},
  postMessage(value){if(active&&!disposed)current.postMessage(value)},
  close(){disposed=true;leave();host.removeEventListener('pagehide',leave);host.removeEventListener('pageshow',resume)}
 };
}
