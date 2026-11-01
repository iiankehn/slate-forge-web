import {finalDocumentJSON} from './review.mjs';
import {formattingSnapshot} from './format-review.mjs';
import {normalizeLayout} from './document-model.mjs';
import {compareText} from './text-diff.mjs';
const stable=value=>{if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value};
const signature=value=>JSON.stringify(stable(value));
const paragraphTypes=new Set(['paragraph','heading','codeBlock']);
const objectNames={image:'Image',designCanvas:'Design canvas',footnote:'Note',tableOfContents:'Contents'};
const designKeys=['notePlacement','size','orientation','margin','font','line','theme','headingColor','header','footer','pageNumbers','language'];

// A longest ordered subset distinguishes a move from offsets caused by insertion.
function orderedMatches(pairs){
 const tails=[],indices=[],previous=new Map();
 for(const pair of pairs){let lo=0,hi=tails.length;while(lo<hi){const mid=(lo+hi)>>1;if(tails[mid]<pair.j)lo=mid+1;else hi=mid}previous.set(pair,lo?indices[lo-1]:null);tails[lo]=pair.j;indices[lo]=pair}
 const result=new Set();let item=indices.at(-1);while(item){result.add(item);item=previous.get(item)}return result;
}
export function compareDocuments(before,after,beforeLayout={},afterLayout={}, {maxNodes=10000,maxDetails=200,maxCharacters=200000,maxWork=2000000}={}){
 const counts={structure:0,formatting:0,objects:0,page:0},details=[],removed=[],added=[];let limited=false,work=maxWork,indexLimited=false;const comparedA=new Set(),comparedB=new Set();
 const emit=(kind,path,description,extra={})=>{counts[kind]++;if(details.length<maxDetails)details.push({kind,path,description,...extra});else limited=true};
 function index(source){let visited=0,characters=0;function visit(node,path,depth){
  if(!node||typeof node!=='object')return null;if(++visited>maxNodes||depth>100){limited=true;return null}
  if(node.type==='commentAnchor')return null;
  if(node.marks?.some(m=>m.type==='reviewChange'&&m.attrs?.kind==='delete'))return null;
  const attrs={...node.attrs};delete attrs.paragraphChange;for(const key of Object.keys(attrs))if(attrs[key]===null||attrs[key]===undefined||attrs[key]===false||key==='indent'&&attrs[key]===0||key==='widowControl'&&attrs[key]===true||key==='textDirection'&&attrs[key]==='auto'||node.type==='tableOfContents'&&key==='startDepth'&&attrs[key]===1)delete attrs[key];if(node.attrs?.widowControl===false)attrs.widowControl=false;if(node.type==='tableOfContents')delete attrs.entries;if(node.type==='footnote')delete attrs.number;
  if(node.type==='text'){const available=Math.max(0,maxCharacters-characters),text=String(node.text||'').slice(0,available);characters+=text.length;if(text.length!==String(node.text||'').length)limited=true;return {type:'text',text,marks:formattingSnapshot(node.marks)}}
  const children=[],inline=[];let text='',offset=0;
  for(let i=0;i<(node.content?.length||0);i++){if(visited>=maxNodes){limited=true;break}const child=node.content[i],entry=visit(child,path+'/'+(paragraphTypes.has(node.type)?'inline@'+offset:i+1),depth+1);offset+=child.type==='text'?String(child.text||'').length:1;if(!entry)continue;if(entry.type==='text'){if(paragraphTypes.has(node.type)){const start=text.length;text+=entry.text;const marks=signature(entry.marks),last=inline.at(-1);if(last?.marks===marks)last.to=text.length;else if(entry.text)inline.push({from:start,to:text.length,marks})}continue}children.push(entry);if(paragraphTypes.has(node.type)){const start=text.length;text+=entry.type==='hardBreak'?'\n':'\uFFFC';inline.push({from:start,to:text.length,marks:'[]'})}}
  const type=node.type,key=signature(paragraphTypes.has(type)?['textblock',text,children.map(c=>c.key)]:[type,objectNames[type]?attrs:null,children.map(c=>c.key)]);
  return {type,attrs,text,inline,children,path,key};
 }return visit(source,'Document',0)}
 function formattingChanged(a,b){
  if(a.text===b.text)return signature(a.inline)!==signature(b.inline);
  // Bound the shared word alignment budget across the entire report, not per block.
  let start=0,ea=a.text.length,eb=b.text.length;while(start<ea&&start<eb&&a.text[start]===b.text[start])start++;while(ea>start&&eb>start&&a.text[ea-1]===b.text[eb-1]){ea--;eb--}
  const tokens=s=>s.match(/\s+|[\p{L}\p{N}\p{M}_]+|[^\s\p{L}\p{N}\p{M}_]/gu)?.length||0;
  const cost=(tokens(a.text.slice(start,ea))+2)*(tokens(b.text.slice(start,eb))+2)+a.text.length+b.text.length;
  let parts;if(cost>work){limited=true;parts=[{kind:'equal',text:a.text.slice(0,start)},{kind:'delete',text:a.text.slice(start,ea)},{kind:'insert',text:b.text.slice(start,eb)},{kind:'equal',text:a.text.slice(ea)}]}else{work-=cost;const diff=compareText(a.text,b.text);parts=diff.parts;if(diff.coarse)limited=true}
  let oldOffset=0,newOffset=0,oldIndex=0,newIndex=0;
  for(const part of parts){if(part.kind==='equal'){let remaining=part.text.length;while(remaining){while(a.inline[oldIndex]?.to<=oldOffset)oldIndex++;while(b.inline[newIndex]?.to<=newOffset)newIndex++;const old=a.inline[oldIndex],current=b.inline[newIndex];if(!old||!current)break;const length=Math.min(remaining,old.to-oldOffset,current.to-newOffset);if(old.marks!==current.marks)return true;oldOffset+=length;newOffset+=length;remaining-=length}}else if(part.kind==='delete')oldOffset+=part.text.length;else newOffset+=part.text.length}
  return false;
 }
 function compareNode(a,b){
  comparedA.add(a);comparedB.add(b);
  if(a.type!==b.type)emit('structure',b.path,a.type+' → '+b.type,{beforePath:a.path});
  if(signature(a.attrs)!==signature(b.attrs)){if(paragraphTypes.has(a.type)&&paragraphTypes.has(b.type))emit('formatting',b.path,'Paragraph design or heading level changed',{beforePath:a.path});else if(objectNames[a.type]&&a.type===b.type)emit('objects',b.path,objectNames[a.type]+' content or design changed',{beforePath:a.path});else emit('structure',b.path,a.type+' properties changed',{beforePath:a.path})}
  if(paragraphTypes.has(a.type)&&paragraphTypes.has(b.type)&&formattingChanged(a,b))emit('formatting',b.path,'Text formatting changed on aligned text',{beforePath:a.path});
  compareChildren(a.children,b.children);
 }
 function compareChildren(a,b){
  const oldGroups=new Map(),newGroups=new Map();for(const [items,groups]of [[a,oldGroups],[b,newGroups]])for(let i=0;i<items.length;i++){const group=groups.get(items[i].key)||[];group.push(i);groups.set(items[i].key,group)}
  const pairs=[],usedA=new Set(),usedB=new Set(),occurrences=new Map();
  for(let i=0;i<a.length;i++){const targets=newGroups.get(a[i].key),olds=oldGroups.get(a[i].key);if(!targets?.length)continue;const occurrence=occurrences.get(a[i].key)||0;occurrences.set(a[i].key,occurrence+1);const j=targets[occurrence];if(j===undefined)continue;pairs.push({i,j,unique:olds.length===1&&targets.length===1});usedA.add(i);usedB.add(j)}
  const ordered=orderedMatches(pairs);
  for(const pair of pairs){if(!ordered.has(pair)){if(pair.unique)emit('structure',b[pair.j].path,'Moved '+a[pair.i].type+' from '+a[pair.i].path,{beforePath:a[pair.i].path,moved:true});else limited=true}compareNode(a[pair.i],b[pair.j])}
  // Pair changed blocks only inside stable ordered anchors. Unmatched insertions
  // cannot shift formatting/object reports for the following exact matches.
  const anchors=[{i:-1,j:-1},...pairs.filter(p=>ordered.has(p)),{i:a.length,j:b.length}];
  // Do not consume a globally unique exact counterpart as a rewritten local
  // block. This preserves cross-container swaps and moves beside replacements.
  const reserved=node=>!indexLimited&&(oldIdentities.get(node.key)===1&&newIdentities.get(node.key)===1||rewrites.has(node)||reverseRewrites.has(node));
  for(let k=1;k<anchors.length;k++){const left=anchors[k-1],right=anchors[k],old=[],current=[];for(let i=left.i+1;i<right.i;i++)if(!usedA.has(i))old.push(i);for(let j=left.j+1;j<right.j;j++)if(!usedB.has(j))current.push(j);const compatible=(i,j)=>!reserved(a[i])&&!reserved(b[j])&&(a[i].type===b[j].type||paragraphTypes.has(a[i].type)&&paragraphTypes.has(b[j].type));
   // Confident rewritten counterparts within this ordered gap are edits,
   // rather than moves caused merely by inserted siblings.
   for(const i of old){const match=rewrites.get(a[i]),j=current.find(j=>b[j]===match);if(j!==undefined&&!usedA.has(i)&&!usedB.has(j)){usedA.add(i);usedB.add(j);compareNode(a[i],b[j])}}
   // A single compatible candidate per side is unambiguous even when an
   // unrelated object was inserted into the gap. Equal-size replacement gaps
   // otherwise retain order; we do not guess changed-text moves.
   if(old.length*current.length<=10000)for(const i of old){if(usedA.has(i))continue;const candidates=current.filter(j=>!usedB.has(j)&&compatible(i,j));if(candidates.length!==1)continue;const j=candidates[0];if(old.filter(n=>!usedA.has(n)&&compatible(n,j)).length!==1)continue;usedA.add(i);usedB.add(j);compareNode(a[i],b[j])}
   const restA=old.filter(i=>!usedA.has(i)),restB=current.filter(j=>!usedB.has(j));if(restA.length!==restB.length)continue;for(let n=0;n<restA.length;n++){const i=restA[n],j=restB[n];if(compatible(i,j)){usedA.add(i);usedB.add(j);compareNode(a[i],b[j])}}}
  for(let i=0;i<a.length;i++)if(!usedA.has(i))removed.push(a[i]);
  for(let j=0;j<b.length;j++)if(!usedB.has(j))added.push(b[j]);
 }
 const a=index(finalDocumentJSON(before)),b=index(finalDocumentJSON(after));indexLimited=limited;
 // Count identities in the complete indexes. A repeated block elsewhere must
 // not become a supposedly unique move just because its local copy matched.
 const identities=root=>{const groups=new Map();function visit(node){if(!node)return;groups.set(node.key,(groups.get(node.key)||0)+1);for(const child of node.children)visit(child)}visit(root);return groups};
 const oldIdentities=identities(a),newIdentities=identities(b);
 const flatten=root=>{const result=[];function walk(node){if(!node)return;result.push(node);for(const child of node.children)walk(child)}walk(root);return result},oldNodes=flatten(a),newNodes=flatten(b),rewrites=new Map(),reverseRewrites=new Map();
 // Lexical similarity is an explicit bounded heuristic, not semantic inference.
 // Require mutual best candidates with a margin; do not guess between repeats.
 if(!indexLimited){const tokens=node=>new Set(node.text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}\p{M}_]+/gu)||[]),eligible=(node,own,other)=>paragraphTypes.has(node.type)&&own.get(node.key)===1&&!other.has(node.key),olds=oldNodes.filter(node=>eligible(node,oldIdentities,newIdentities)),news=newNodes.filter(node=>eligible(node,newIdentities,oldIdentities)),sets=new Map([...olds,...news].map(node=>[node,tokens(node)])),rankA=new Map(),rankB=new Map();let complete=true;
  const rank=(map,node,candidate,score)=>{const top=map.get(node)||[];top.push({node:candidate,score});top.sort((a,b)=>b.score-a.score);map.set(node,top.slice(0,2))};
  outer:for(const old of olds){const left=sets.get(old);if(left.size<5)continue;for(const current of news){const right=sets.get(current);if(right.size<5)continue;const cost=left.size+right.size+1;if(cost>work){limited=true;complete=false;break outer}work-=cost;let shared=0;for(const word of left)if(right.has(word))shared++;const score=2*shared/(left.size+right.size);if(shared>=4&&score>=.6){rank(rankA,old,current,score);rank(rankB,current,old,score)}}}
  if(complete)for(const [old,top]of rankA){const current=top[0].node,back=rankB.get(current);if(back?.[0].node===old&&top[0].score-(top[1]?.score||0)>=.12&&back[0].score-(back[1]?.score||0)>=.12){rewrites.set(old,current);reverseRewrites.set(current,old)}else limited=true}
 }

 if(a&&b)compareNode(a,b);
 // Descend unmatched containers as well: a removed wrapper can contain a
 // paragraph moved into a newly added wrapper. Compare matched roots only once.
 const movedA=new Set(),movedB=new Set(),pendingKeys=new Set(added.map(node=>node.key));
 for(const node of removed)if(pendingKeys.has(node.key)&&(oldIdentities.get(node.key)!==1||newIdentities.get(node.key)!==1))limited=true;
 if(!indexLimited){const oldCandidates=()=>removed.flatMap(flatten).filter(node=>!comparedA.has(node)),newCandidates=()=>added.flatMap(flatten).filter(node=>!comparedB.has(node));let rounds=0,changed=true;
  while(changed&&rounds++<100){changed=false;const targets=new Map(newCandidates().filter(node=>newIdentities.get(node.key)===1).map(node=>[node.key,node]));
   for(const old of oldCandidates()){if(comparedA.has(old))continue;const exact=oldIdentities.get(old.key)===1?targets.get(old.key):null,current=exact||rewrites.get(old);if(!current||comparedB.has(current))continue;
    movedA.add(old);movedB.add(current);targets.delete(old.key);emit('structure',current.path,'Moved '+old.type+(exact?'':' with edited text')+' from '+old.path,{beforePath:old.path,moved:true,...(!exact?{match:'text-similarity'}:{})});compareNode(old,current);changed=true;
   }
  }
  if(changed)limited=true;
 }
 for(const node of removed)if(!movedA.has(node))emit('structure',node.path,'Removed '+node.type);
 for(const node of added)if(!movedB.has(node))emit('structure',node.path,'Added '+node.type);
 const oldLayout=normalizeLayout(beforeLayout),newLayout=normalizeLayout(afterLayout);for(const key of designKeys)if(signature(oldLayout[key])!==signature(newLayout[key]))emit('page','Page design',key+' changed');
 return {counts,details,limited,hasDifferences:Object.values(counts).some(Boolean),formattingScope:'Exact-content blocks match within and across containers, including unmatched wrappers. Edited paragraphs can match by bounded word overlap when each is the other’s clear best candidate; this is text similarity, not inferred meaning. Formatting is compared on aligned shared text; added or removed text has no counterpart. Repeated, weakly related or similarly scored candidates remain ambiguous.'};
}
