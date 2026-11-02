import {structuralDiff,movedBlockPlan} from './structural-diff.mjs';
import {ReplaceStep,ReplaceAroundStep} from '@tiptap/pm/transform';
import {Extension,Node} from '@tiptap/core';
import {Plugin,Selection,NodeSelection} from '@tiptap/pm/state';
import {Fragment} from '@tiptap/pm/model';
import {closeHistory} from '@tiptap/pm/history';
import {reviewAttrs,reviewKey} from './review.mjs';
const attrs=value=>{const a=reviewAttrs(value);return {id:a.id,author:a.author,date:a.date,kind:a.kind,...(value?.operation==='move'?{operation:'move'}:{})}};
const decode=value=>{try{return attrs(JSON.parse(decodeURIComponent(value)))}catch{return attrs()}};
export const BlockRevision=Node.create({name:'blockRevision',group:'block',content:'block+',defining:true,isolating:true,
 addAttributes(){return {...Object.fromEntries(Object.keys(attrs()).map(key=>[key,{default:attrs()[key],parseHTML:el=>decode(el.getAttribute('data-forge-block-change'))[key],renderHTML:()=>({})}])),operation:{default:'edit',parseHTML:el=>decode(el.getAttribute('data-forge-block-change')).operation||'edit',renderHTML:()=>({})}}},
 parseHTML(){return [{tag:'div[data-forge-block-change]'}]},
 renderHTML({node}){const a=attrs(node.attrs);return ['div',{'data-forge-block-change':encodeURIComponent(JSON.stringify(a)),class:'forge-block-revision forge-change '+a.kind,...(a.kind==='delete'?{contenteditable:'false'}:{}),title:a.author+' · '+a.kind+' blocks'},0]}
});
export function blockReviewItems(doc){
 const items=new Map();let visited=0;
 function walk(parent,base,ancestors){if(ancestors.length>20)throw Error('Structural review supports up to 20 nested suggestion layers.');parent.forEach((node,offset)=>{if(++visited>100000)throw Error('Structural review exceeds 100,000 nodes.');const pos=base+offset;let next=ancestors;
  if(node.type.name==='blockRevision'){const a=attrs(node.attrs),item=items.get(a.id)||{...a,from:pos,to:pos+node.nodeSize,inserted:0,deleted:0,text:'',depth:ancestors.length,parents:[],dormant:true};item.to=Math.max(item.to,pos+node.nodeSize);item.depth=Math.min(item.depth,ancestors.length);item.dormant&&=ancestors.some(parent=>parent.kind==='delete');item[a.kind==='delete'?'deleted':'inserted']+=node.childCount;const text=node.textContent.slice(0,160);if(text&&!item.text.includes(text))item.text+=(item.text?' · ':'')+text;for(const parent of ancestors)if(!item.parents.includes(parent.id))item.parents.push(parent.id);items.set(a.id,item);next=[...ancestors,a]}
  if(node.childCount)walk(node,pos+1,next);
 })}walk(doc,0,[]);return [...items.values()];
}
function decidedContent(parent,accept,depth=0,id=null){
 if(depth>100)throw Error('Structural review exceeds the document depth limit.');const content=[];
 parent.forEach(node=>{
  if(node.type.name==='blockRevision'){if(id===null||node.attrs.id===id){const keep=node.attrs.kind==='delete'?!accept:accept;if(keep)content.push(...decidedContent(node,accept,depth+1,id))}else{const children=Fragment.fromArray(decidedContent(node,accept,depth+1,id));if(children.size)content.push(node.copy(children))}return}
  if(!node.childCount){content.push(node);return}const children=Fragment.fromArray(decidedContent(node,accept,depth+1,id));if(node.type.validContent(children))content.push(node.copy(children));else if(['table','bulletList','orderedList'].includes(node.type.name)&&!children.size)return;else{const filled=node.type.createAndFill(node.attrs,children,node.marks);if(!filled)throw Error('This structural decision cannot retain a valid '+node.type.name+' container.');content.push(filled)}
 });return content;
}
export function decideBlocks(state,id,accept){
 const tr=state.tr,content=Fragment.fromArray(decidedContent(state.doc,accept,0,id));if(!content.eq(state.doc.content)){tr.replaceWith(0,state.doc.content.size,content);tr.setSelection(Selection.near(tr.doc.resolve(Math.min(state.selection.anchor,tr.doc.content.size))))}return closeHistory(tr.setMeta('forgeReviewApplying',true));
}
export function assertNoBlockRevisions(node){if(node.attrs?.rowChange||node.attrs?.paragraphBoundaryChange)throw Error('Decide table-row and paragraph-boundary revisions before ODT export, or use DOCX/HTML to retain them.');if(node.type==='blockRevision')throw Error('Accept or reject structural/object changes before ODT export, or use DOCX/HTML to retain supported review.');for(const child of node.content||[])assertNoBlockRevisions(child)}
const changed=structuralDiff;
function shape(nodes){let count=0;function visit(node){if(node.type.name!=='blockRevision'&&++count>10000)throw Error('This structural change exceeds 10,000 nodes. Turn off tracking or use smaller changes.');if(node.isText||node.type.name==='commentAnchor')return null;const a={...node.attrs};for(const key of ['referenceIndex','entries','number','paragraphChange'])delete a[key];const properties=['paragraph','heading','codeBlock'].includes(node.type.name)?null:a;return [node.type.name,properties,node.content.content.map(visit).filter(Boolean)]}return JSON.stringify(nodes.map(visit).filter(Boolean))}
const replacesBlocks=transactions=>transactions.some(tr=>tr.steps.some(step=>(step instanceof ReplaceStep||step instanceof ReplaceAroundStep)&&step.slice.content.content.some(node=>node.isBlock&&(step instanceof ReplaceStep||!node.isTextblock))));
function projectedDepth(doc,diff){let ancestors=0;const position=doc.resolve(diff.from);for(let depth=1;depth<=position.depth;depth++)if(position.node(depth).type.name==='blockRevision')ancestors++;let nested=0;function walk(node,depth){const next=depth+(node.type.name==='blockRevision'?1:0);nested=Math.max(nested,next);node.forEach(child=>walk(child,next))}for(const node of [...diff.a,...diff.b])walk(node,0);return ancestors+nested+1}
export const TrackBlockChanges=Extension.create({name:'trackBlockChanges',addOptions(){return {onBlocked:()=>{}}},addProseMirrorPlugins(){const notify=this.options?.onBlocked||(()=>{});return [new Plugin({
 filterTransaction(tr,state){if(!tr.docChanged||tr.getMeta('forgeReviewApplying')||tr.getMeta('history$'))return true;
  let protectedCopy=false;state.doc.descendants((node,pos)=>{if(node.type.name!=='blockRevision'||node.attrs.kind!=='delete')return;const at=tr.mapping.map(pos,1);if(!tr.doc.nodeAt(at)?.eq(node))protectedCopy=true;return false});
  if(protectedCopy){notify('Decide this structural change before editing its deleted copy.');return false}
  const enabled=reviewKey.getState(state)?.enabled;if(!enabled&&!blockReviewItems(state.doc).length)return true;const diff=changed(state.doc,tr.doc);try{blockReviewItems(tr.doc);if(shape(diff.a)===shape(diff.b)&&!replacesBlocks([tr]))return true;if(!enabled){const before=new Map(blockReviewItems(state.doc).map(item=>[item.id,item.inserted+':'+item.deleted])),after=new Map(blockReviewItems(tr.doc).map(item=>[item.id,item.inserted+':'+item.deleted]));if([...before].some(([id,count])=>after.get(id)!==count)){notify('Decide the affected structural changes before removing their pending review metadata.');return false}return true}if(projectedDepth(tr.doc,diff)>20)throw Error('Structural review supports up to 20 nested suggestion layers.');if(JSON.stringify([diff.a.map(n=>n.toJSON()),diff.b.map(n=>n.toJSON())]).length>10000000)throw Error('This structural change exceeds 10 MB. Turn off tracking or use smaller changes.')}catch(error){notify(error.message);return false}return true;
 },
 // Housekeeping such as TrailingNode must not recursively create revisions.
 appendTransaction(transactions,old,state){const setting=reviewKey.getState(state);if(!setting?.enabled||transactions.every(t=>t.getMeta('appendedTransaction'))||!transactions.some(t=>t.docChanged)||transactions.some(t=>t.getMeta('forgeReviewApplying')||t.getMeta('history$')))return null;const diff=changed(old.doc,state.doc);if(!diff.a.length&&!diff.b.length||shape(diff.a)===shape(diff.b)&&!replacesBlocks(transactions))return null;
  const info={id:'blocks-'+crypto.getRandomValues(new Uint32Array(3)).join('-'),author:setting.author,date:new Date().toISOString()},type=state.schema.nodes.blockRevision,plan=movedBlockPlan(diff.a,diff.b);let removed=null,inserted=null,replacement,targets=null;
  if(plan){const ids=new Map();targets=new Map();let offset=0;replacement=plan.map(entry=>{let node=entry.node;if(entry.kind!=='keep'){if(!ids.has(entry.move))ids.set(entry.move,'move-'+crypto.getRandomValues(new Uint32Array(3)).join('-'));node=type.create({...info,id:ids.get(entry.move),kind:entry.kind,operation:'move'},[node])}if(entry.newIndex!==undefined)targets.set(entry.newIndex,offset+(entry.kind==='insert'?1:0));offset+=node.nodeSize;return node})}else{removed=diff.a.length?type.create({...info,kind:'delete'},diff.a):null;inserted=diff.b.length?type.create({...info,kind:'insert'},diff.b):null;replacement=[removed,inserted].filter(Boolean)}const tr=state.tr.replaceWith(diff.from,diff.to,replacement);
  if(targets&&state.selection.from>=diff.from&&state.selection.to<=diff.to){let offset=0;for(let i=0;i<diff.b.length;i++){const end=offset+diff.b[i].nodeSize;if(state.selection.from-diff.from<end){const at=diff.from+targets.get(i)+state.selection.from-diff.from-offset;tr.setSelection(state.selection instanceof NodeSelection&&tr.doc.nodeAt(at)?.isAtom?NodeSelection.create(tr.doc,at):Selection.near(tr.doc.resolve(at)));break}offset=end}}
  if(inserted&&state.selection.from>=diff.from&&state.selection.to<=diff.to){const start=diff.from+(removed?.nodeSize||0)+1,at=Math.min(start+inserted.content.size,start+state.selection.from-diff.from);tr.setSelection(state.selection instanceof NodeSelection&&tr.doc.nodeAt(at)?.isAtom?NodeSelection.create(tr.doc,at):Selection.near(tr.doc.resolve(at)))}return tr.setMeta('forgeReviewApplying',true);
 }
 })]}});
export const BLOCK_REVIEW_CSS='.forge-block-revision{border-left:3px solid #28834d;padding:6px 12px;margin:8px 0}.forge-block-revision.delete{border-color:#b33c3c;opacity:.65;pointer-events:none}.forge-block-revision.insert{border-color:#28834d}@media print{.forge-block-revision.insert{border:0;padding:0;margin:0}}';
