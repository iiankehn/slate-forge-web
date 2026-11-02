import test from 'node:test';import assert from 'node:assert/strict';import {navigationChannel} from '../src/tab-channel.mjs';
function fixture(){const connections=new Set(),host=new EventTarget();let opened=0;class Channel{constructor(name){this.name=name;this.closed=false;connections.add(this);opened++}postMessage(data){if(this.closed)throw Error('Closed');for(const peer of connections)if(peer!==this&&peer.name===this.name)queueMicrotask(()=>{if(!peer.closed)peer.onmessage?.({data})})}close(){this.closed=true;connections.delete(this)}}const show=()=>{const event=new Event('pageshow');Object.defineProperty(event,'persisted',{value:true});host.dispatchEvent(event)};return {host,Channel,show,opened:()=>opened}}
const drain=()=>new Promise(resolve=>setImmediate(resolve));
test('an unloading page cannot claim ownership from the document replacing it',async()=>{
 const f=fixture(),owner=navigationChannel('tabs',f),probe=new f.Channel('tabs'),replies=[];owner.onmessage=e=>{if(e.data.kind==='probe')owner.postMessage({kind:'owned',token:e.data.token})};probe.onmessage=e=>replies.push(e.data);
 probe.postMessage({kind:'probe',token:'duplicate'});await drain();assert.deepEqual(replies,[{kind:'owned',token:'duplicate'}]);f.host.dispatchEvent(new Event('pagehide'));probe.postMessage({kind:'probe',token:'reload'});await drain();assert.equal(replies.length,1);owner.close();probe.close();
});
test('back-forward restoration reconnects once and uses the latest workspace handler',async()=>{
 const f=fixture(),owner=navigationChannel('tabs',f),probe=new f.Channel('tabs'),replies=[];probe.onmessage=e=>replies.push(e.data);owner.onmessage=()=>owner.postMessage('old workspace');f.host.dispatchEvent(new Event('pagehide'));owner.onmessage=()=>owner.postMessage('current workspace');owner.postMessage('must not send while hidden');f.show();f.show();assert.equal(f.opened(),3);probe.postMessage('probe');await drain();assert.deepEqual(replies,['current workspace']);owner.close();probe.close();
});
test('explicit disposal removes lifecycle listeners and never reopens a channel',()=>{
 const f=fixture(),owner=navigationChannel('tabs',f);owner.close();f.show();f.host.dispatchEvent(new Event('pagehide'));owner.postMessage('ignored');assert.equal(f.opened(),1);
});
