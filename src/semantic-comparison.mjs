const LIMIT=80;
const key=text=>String(text).normalize('NFKC').replace(/\s+/gu,' ').trim().slice(0,2000);
export async function semanticBlockMatches(candidates,{signal,onProgress=()=>{},cache=new Map()}={}){
 const before=candidates.before.slice(0,LIMIT),after=candidates.after.slice(0,LIMIT),texts=[...new Set([...before,...after].map(item=>key(item.text)))],missing=texts.filter(text=>!cache.has(text));
 if(signal?.aborted)throw new DOMException('Comparison cancelled.','AbortError');
 if(missing.length){
  const worker=new Worker(new URL('semantic-worker.js',document.baseURI),{type:'module'});
  try{
   const vectors=await new Promise((resolve,reject)=>{
    const abort=()=>reject(new DOMException('Comparison cancelled.','AbortError'));signal?.addEventListener('abort',abort,{once:true});
    const finish=(fn,value)=>{signal?.removeEventListener('abort',abort);fn(value)};
    worker.onerror=event=>finish(reject,Error(event.message||'Local semantic comparison is unavailable.'));
    worker.onmessage=event=>{const message=event.data;if(message.status==='complete')finish(resolve,message.vectors);else if(message.status==='error')finish(reject,Error(message.message));else onProgress(message)};
    worker.postMessage({texts:missing,base:document.baseURI});
   });
   for(let index=0;index<missing.length;index++){cache.set(missing[index],vectors[index])}
   const needed=new Set(texts);for(const cached of cache.keys()){if(cache.size<=500)break;if(!needed.has(cached))cache.delete(cached)}
  }finally{worker.terminate()}
 }
 const rankA=new Map(),rankB=new Map(),rank=(map,node,candidate,score)=>{const top=map.get(node)||[];top.push({node:candidate,score});top.sort((a,b)=>b.score-a.score);map.set(node,top.slice(0,2))};
 for(const old of before)for(const current of after){const left=cache.get(key(old.text)),right=cache.get(key(current.text));if(!left||!right||left.length!==right.length)continue;const score=left.reduce((sum,value,index)=>sum+value*right[index],0);if(Number.isFinite(score)){rank(rankA,old,current,score);rank(rankB,current,old,score)}}
 const matches=[];
 for(const [old,top]of rankA){const current=top[0].node,back=rankB.get(current);if(top[0].score>=.75&&back?.[0].node===old&&top[0].score-(top[1]?.score||0)>=.08&&back[0].score-(back[1]?.score||0)>=.08)matches.push({beforePath:old.path,afterPath:current.path,origin:'semantic'})}
 return {matches,limited:candidates.before.length>LIMIT||candidates.after.length>LIMIT||[...before,...after].some(item=>item.text.length>2000)};
}
