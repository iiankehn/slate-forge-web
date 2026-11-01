import {Extension} from '@tiptap/core';
import {Plugin,Selection,EditorState} from '@tiptap/pm/state';
import {closeHistory} from '@tiptap/pm/history';
import {TableMap,removeRow} from '@tiptap/pm/tables';
import {reviewAttrs,reviewKey} from './review.mjs';
import {decideBlocks} from './block-review.mjs';
import {structuralDiff,containsBlockRevision} from './structural-diff.mjs';
const definitions=[{types:['tableRow'],key:'rowChange',attribute:'data-forge-row-change'},{types:['paragraph','heading'],key:'paragraphBoundaryChange',attribute:'data-forge-boundary-change'}];
const normalize=value=>value?(({id,author,date,kind})=>({id,author,date,kind}))(reviewAttrs(value)):null;
function decode(value){try{return value?normalize(JSON.parse(decodeURIComponent(value))):null}catch{return null}}
function counts(doc){const found=new Map();doc.descendants(node=>{for(const {key}of definitions)if(node.attrs[key]){const a=normalize(node.attrs[key]),id=key+':'+a.id+':'+a.kind;found.set(id,(found.get(id)||0)+1)}});return JSON.stringify([...found].sort())}
const rich=node=>['paragraph','heading'].includes(node.type.name);
export const BoundaryReview=Extension.create({name:'boundaryReview',priority:1100,addOptions(){return {onBlocked:()=>{}}},addGlobalAttributes(){return definitions.map(({types,key,attribute})=>({types,attributes:{[key]:{default:null,parseHTML:el=>decode(el.getAttribute(attribute)),renderHTML:attrs=>{const a=normalize(attrs[key]);return a?{[attribute]:encodeURIComponent(JSON.stringify(a)),class:(key==='rowChange'?'forge-row-change':'forge-boundary-change')+' '+a.kind,...(key==='rowChange'&&a.kind==='delete'?{contenteditable:'false'}:{}),title:a.author+' · '+(key==='rowChange'?'table row':'paragraph boundary')+' '+a.kind}:{}}}}}))},addProseMirrorPlugins(){const notify=this.options.onBlocked;return [new Plugin({
 filterTransaction(tr,state){if(!tr.docChanged||tr.getMeta('forgeReviewApplying')||tr.getMeta('history$'))return true;let protectedCopy=false;state.doc.descendants((node,pos)=>{if(node.attrs.rowChange?.kind!=='delete')return;const mapped=tr.mapping.mapResult(pos,1);if(mapped.deleted||!tr.doc.nodeAt(mapped.pos)?.eq(node))protectedCopy=true;return false});if(protectedCopy||counts(state.doc)!==counts(tr.doc)){notify(protectedCopy?'Decide the deleted table row before editing its protected copy.':'Decide the affected row or paragraph-boundary change before removing or splitting it.');return false}return true},
 appendTransaction(transactions,old,state){const setting=reviewKey.getState(state);if(!setting?.enabled||!transactions.some(tr=>tr.docChanged)||transactions.some(tr=>tr.getMeta('forgeReviewApplying')||tr.getMeta('history$')||tr.getMeta('appendedTransaction')))return null;const diff=structuralDiff(old.doc,state.doc);if(containsBlockRevision([...diff.a,...diff.b])||[...diff.a,...diff.b].some(node=>node.attrs.paragraphBoundaryChange))return null;
  const split=diff.a.length===1&&diff.b.length===2&&[...diff.a,...diff.b].every(rich)&&diff.a[0].content.eq(diff.b[0].content.append(diff.b[1].content)),join=diff.a.length===2&&diff.b.length===1&&[...diff.a,...diff.b].every(rich)&&diff.b[0].content.eq(diff.a[0].content.append(diff.a[1].content));if(!split&&!join)return null;
  const change=normalize({id:'boundary-'+crypto.getRandomValues(new Uint32Array(3)).join('-'),author:setting.author,date:new Date().toISOString(),kind:split?'insert':'delete'}),tr=state.tr;
  if(split)tr.setNodeMarkup(diff.from,undefined,{...diff.b[0].attrs,paragraphBoundaryChange:change});
  else{tr.replaceWith(diff.from,diff.to,[diff.a[0].type.create({...diff.a[0].attrs,paragraphBoundaryChange:change},diff.a[0].content),diff.a[1]]);tr.setSelection(Selection.near(tr.doc.resolve(diff.from+1+diff.a[0].content.size)))}
  return tr.setMeta('forgeReviewApplying',true);
 }
 })]}});
export function boundaryReviewItems(doc){const items=new Map();doc.descendants((node,pos)=>{if(node.type.name==='blockRevision'&&node.attrs.kind==='delete')return false;for(const {key}of definitions){const a=normalize(node.attrs[key]);if(!a)continue;const id=key+':'+a.id,entry=items.get(id)||{...a,id,changeId:a.id,type:key,from:pos,to:pos+node.nodeSize,count:0,text:''};entry.to=pos+node.nodeSize;entry.count++;entry.text+=(entry.text?' · ':'')+node.textContent.slice(0,160);items.set(id,entry)}if(node.attrs.rowChange?.kind==='delete')return false});return [...items.values()]}
export function decideBoundaries(state,id,accept){const tr=state.tr,rows=[],paragraphs=[];state.doc.descendants((node,pos)=>{if(node.type.name==='blockRevision'&&node.attrs.kind==='delete')return false;for(const {key}of definitions){const a=normalize(node.attrs[key]);if(a&&(id===null||key+':'+a.id===id))(key==='rowChange'?rows:paragraphs).push({pos,key,a})}if(node.attrs.rowChange?.kind==='delete'&&id!==null)return false});
 for(const {pos,key,a}of rows.reverse()){
  const mapped=tr.mapping.mapResult(pos,1);if(mapped.deleted)continue;const at=mapped.pos,node=tr.doc.nodeAt(at);if(!node?.attrs[key])continue;const keep=a.kind==='delete'?!accept:accept;
  if(keep){tr.setNodeMarkup(at,undefined,{...node.attrs,[key]:null});continue}
  const $at=tr.doc.resolve(at),table=$at.parent;if(table.type.name!=='table')throw Error('This row is outside a supported table.');const tablePos=$at.before($at.depth),row=$at.index();if(table.childCount===1)tr.delete(tablePos,tablePos+table.nodeSize);else{const map=TableMap.get(table);if(map.problems?.length)throw Error('This table needs its merged cells repaired before deciding a row change.');removeRow(tr,{table,map,tableStart:tablePos+1},row)}
 }
 for(const {pos,key,a}of paragraphs.reverse()){
  const mapped=tr.mapping.mapResult(pos,1);if(mapped.deleted)continue;const at=mapped.pos,left=tr.doc.nodeAt(at);if(!left?.attrs[key])continue;const merge=a.kind==='delete'?accept:!accept;
  if(!merge){tr.setNodeMarkup(at,undefined,{...left.attrs,[key]:null});continue}
  const next=at+left.nodeSize,$at=tr.doc.resolve(at),right=$at.parent.maybeChild($at.index()+1);if(!right||!rich(left)||!rich(right))throw Error('This paragraph boundary cannot be joined across its current container. Keep it pending or decide it in Word.');
  tr.join(next);tr.setNodeMarkup(at,right.type,{...right.attrs});
 }
 return closeHistory(tr.setMeta('forgeReviewApplying',true));
}
export function decideStructuralReview(state,id,accept){
 if(id!==null)return /^(rowChange|paragraphBoundaryChange):/.test(id)?decideBoundaries(state,id,accept):decideBlocks(state,id,accept);
 const tr=decideBlocks(state,null,accept),snapshot=EditorState.create({schema:state.schema,doc:tr.doc}),extra=decideBoundaries(snapshot,null,accept);for(const step of extra.steps)tr.step(step);return closeHistory(tr.setMeta('forgeReviewApplying',true));
}
export const BOUNDARY_REVIEW_CSS='.forge-row-change.insert{outline:2px solid #28834d}.forge-row-change.delete{opacity:.65;text-decoration:line-through;background:#f0b3b344}.forge-boundary-change::after{content:" ¶";font-size:.8em;color:#28834d}.forge-boundary-change.delete::after{color:#b33c3c;text-decoration:line-through}@media print{.forge-row-change.delete{display:none}.forge-row-change.insert{outline:0}.forge-boundary-change::after{display:none}}';
