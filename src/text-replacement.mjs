import {closeHistory} from '@tiptap/pm/history';
import {Fragment} from '@tiptap/pm/model';
import {reviewKey,reviewAttrs} from './review.mjs';
// Validate the complete pass before making one undoable transaction.
export function replaceTextEdits(state,edits,{acceptExisting=false}={}){
 if(edits.length>5000)throw Error('Replace up to 5,000 matches per pass. Narrow the search or selected text.');
 const setting=reviewKey.getState(state),tracked=setting?.enabled&&state.schema.marks.reviewChange;
 const ordered=[...edits].sort((a,b)=>a.from-b.from);let end=-1;const affected=new Set();
 for(const edit of ordered){if(!Number.isInteger(edit.from)||!Number.isInteger(edit.to)||edit.from<0||edit.to>state.doc.content.size||edit.to<=edit.from||edit.from<end)throw Error('The text selection changed. Run the search again.');end=edit.to;if(tracked&&!state.doc.resolve(edit.from).parent.type.allowsMarkType(state.schema.marks.reviewChange))throw Error('Tracked replacement is unavailable in this block. Turn off Track changes to edit code blocks.');const slice=state.doc.slice(edit.from,edit.to);let valid=!slice.openStart&&!slice.openEnd;slice.content.forEach(node=>{if(!node.isText)valid=false;for(const mark of node.marks)if(mark.type.name==='reviewChange'){affected.add(mark.attrs.id);if(acceptExisting&&mark.attrs.kind==='delete')throw Error('Replacement cannot target deleted revision text.');}});if(!valid)throw Error('Replacement supports inline text. Select text without objects or paragraph breaks.');if(typeof edit.replacement!=='string')throw Error('Replacement must be text.')}
 if(affected.size&&!acceptExisting){const error=Error('Accept or reject existing changes in matched text before replacing it.');error.code='review-conflict';error.revisionIds=[...affected];throw error}
 const tr=state.tr;
 if(affected.size){const spans=[];state.doc.descendants((node,pos)=>{const mark=node.marks?.find(m=>m.type.name==='reviewChange'&&affected.has(m.attrs.id));if(node.isText&&mark)spans.push({pos,node,mark})});for(const {pos,node,mark}of spans.reverse()){if(mark.attrs.kind==='delete')tr.delete(pos,pos+node.nodeSize);else tr.removeMark(pos,pos+node.nodeSize,state.schema.marks.reviewChange)}tr.setMeta('forgeReviewApplying',true);const intermediate=state.apply(tr),mapped=ordered.map(edit=>({...edit,from:tr.mapping.map(edit.from,1),to:tr.mapping.map(edit.to,-1),...(edit.marks?{marks:edit.marks.filter(m=>m.type.name!=='reviewChange')}: {})}));const replacement=replaceTextEdits(intermediate,mapped);for(const step of replacement.steps)tr.step(step);return closeHistory(tr.setMeta('forgeAcceptedChanges',[...affected]).setMeta('forgeReviewApplying',true))}
 for(const edit of ordered.reverse()){
  if(!tracked){if(edit.marks)tr.replaceWith(edit.from,edit.to,edit.replacement?state.schema.text(edit.replacement,edit.marks):Fragment.empty);else tr.insertText(edit.replacement,edit.from,edit.to);continue}
  const before=state.doc.slice(edit.from,edit.to).content,id=crypto.getRandomValues(new Uint32Array(3)).join('-'),attrs={id,author:setting.author,date:new Date().toISOString()},deleted=[];
  before.forEach(node=>deleted.push(node.mark([...node.marks,state.schema.marks.reviewChange.create(reviewAttrs({...attrs,kind:'delete'}))])));
  const marks=(edit.marks||before.firstChild.marks).filter(mark=>mark.type.name!=='reviewChange'),inserted=edit.replacement?[state.schema.text(edit.replacement,[...marks,state.schema.marks.reviewChange.create(reviewAttrs({...attrs,kind:'insert'}))])]:[];
  tr.replaceWith(edit.from,edit.to,Fragment.fromArray([...deleted,...inserted]));
 }
 return tr.setMeta('forgeReviewApplying',true);
}

export function clearFormattingTransaction(state,range=state.selection){
 const tr=state.tr,keep=mark=>['comment','reviewChange','formatChange'].includes(mark.type.name);
 if(range.from===range.to)return tr.setStoredMarks((state.storedMarks||state.doc.resolve(range.from).marks()).filter(keep));
 state.doc.nodesBetween(range.from,range.to,(node,pos)=>{if(!node.isText)return;for(const mark of node.marks)if(!keep(mark))tr.removeMark(Math.max(range.from,pos),Math.min(range.to,pos+node.nodeSize),mark.type)});
 return tr.setMeta('forgeReviewApplying',true).setMeta('forgeTrackFormatting',true);
}
