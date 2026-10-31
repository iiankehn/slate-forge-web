import {persistSession} from './document-model.mjs';
export const MAX_DOCUMENTS=200,MAX_TRASH=200,LIBRARY_BATCH=50;
export function validateWorkspaceCounts(workspace,{existingDocuments=0,existingDeleted=0,requireDocuments=false}={}){if(!Array.isArray(workspace?.docs)||requireDocuments&&!workspace.docs.length||!Number.isInteger(existingDocuments)||existingDocuments<0||!Number.isInteger(existingDeleted)||existingDeleted<0)throw Error('Invalid workspace documents.');if(workspace.docs.length+existingDocuments>MAX_DOCUMENTS)throw Error('A workspace holds up to '+MAX_DOCUMENTS+' documents.');if(workspace.trash!==undefined&&(!Array.isArray(workspace.trash)||workspace.trash.length+existingDeleted>MAX_TRASH))throw Error('A workspace holds up to '+MAX_TRASH+' deleted documents.');return workspace}
export const isDevicePointer=value=>value?.format==='slate-forge-device-pointer'&&value.version===1&&typeof value.id==='string';
export class TabSessionCache{
 constructor(){this.reduced=false}
 save(storage,key,state,{deviceAvailable=false}={}){if(!this.reduced||!deviceAvailable){const full=persistSession(storage,key,state);if(full.saved||!deviceAvailable)return {...full,reduced:false};this.reduced=true}try{storage.setItem(key,JSON.stringify({format:'slate-forge-device-pointer',version:1,id:state.id}));return {saved:true,reduced:true}}catch(error){return {saved:false,reduced:true,error}}}
}
export class LibraryBodyIndex{
 constructor(){this.values=new WeakMap()}
 read(content,extract){if(!content||typeof content!=='object')return '';if(!this.values.has(content))this.values.set(content,extract(content));return this.values.get(content)}
}
export function workspaceUsage(state){const docs=state.docs||[],trash=state.trash||[];return {documents:docs.length,deleted:trash.length,historyEntries:[...docs,...trash].reduce((n,d)=>n+(d.history?.length||0),0),bytes:new TextEncoder().encode(JSON.stringify(state)).length,documentLimit:MAX_DOCUMENTS}}
export function deviceSaveFailure(error){return error?.name==='QuotaExceededError'?'Device storage is full. Export a backup and remove unused files or workspaces. Your last saved copy was kept.':'Device save failed. Your last saved copy was kept. Export a backup.'}
