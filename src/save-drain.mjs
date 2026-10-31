// Coalesce concurrent flushes and acknowledge only the snapshot actually saved.
export class SaveDrain{
 constructor({read,onSaved,onError}){Object.assign(this,{read,onSaved,onError});this.flight=null;this.writer=null}
 flush(){const first=this.read();if(!first.writer||!first.dirty)return Promise.resolve();if(this.flight&&this.writer===first.writer)return this.flight;const writer=first.writer;this.writer=writer;const task=(async()=>{try{for(;;){const snapshot=this.read();if(snapshot.writer!==writer||!snapshot.dirty)return;await writer.save(snapshot.value);if(this.read().writer!==writer)return;this.onSaved(snapshot.version,writer)}}catch(error){if(this.read().writer===writer)this.onError(error,writer);throw error}})();this.flight=task;task.finally(()=>{if(this.flight===task){this.flight=null;this.writer=null}}).catch(()=>{});return task}
}
