import {XmlComponent} from 'docx';
import {reviewAttrs} from './review.mjs';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const children=(node,key)=>Array.isArray(node[key])?node[key]:(node[key]=[]);
const property=(node,key,name)=>{const list=children(node,key);let found=list.find(item=>item&&typeof item==='object'&&Object.hasOwn(item,name));if(!found){found={[name]:[]};if(name==='w:rPr'){const at=list.findIndex(item=>item&&typeof item==='object'&&(Object.hasOwn(item,'w:sectPr')||Object.hasOwn(item,'w:pPrChange')));list.splice(at<0?list.length:at,0,found)}else list.unshift(found)}return found};
function deletionText(value){if(Array.isArray(value))return value.map(deletionText);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).map(([key,child])=>[key==='w:t'?'w:delText':key,deletionText(child)]))}

export function assertExportableBlockRevisions(node,inside=false){
 if(node.type==='blockRevision'){if(inside)throw Error('Decide nested structural suggestions before DOCX export.');inside=true}
 else if(inside&&(node.type==='columnSection'||node.marks?.some(mark=>mark.type==='reviewChange')))throw Error('Decide text revisions or section changes inside a structural suggestion before DOCX export, or use HTML to retain them.');
 for(const child of node.content||[])assertExportableBlockRevisions(child,inside);
}

export class NativeBlockRevision extends XmlComponent{
 constructor(blocks,attributes,counters){super('w:sdt');this.blocks=blocks;this.attributes=reviewAttrs(attributes);this.move=attributes?.operation==='move';this.counters=counters}
 prepForXml(context){
  const a=this.attributes,kind=a.kind==='delete'?'del':'ins',move=this.move&&!this.blocks.some(block=>block.rootKey==='w:tbl'),revision=move?(kind==='del'?'moveFrom':'moveTo'):kind;
  const marker=name=>({['w:'+name]:[{_attr:{'w:id':this.counters.changeIndex++,'w:author':a.author,'w:date':a.date}}]});
  function revise(node,inTable=false){
   if(!node||typeof node!=='object')return node;
   if(Object.hasOwn(node,'w:p')&&!inTable){
    const props=property(node,'w:p','w:pPr'),runProps=property(props,'w:pPr','w:rPr');children(runProps,'w:rPr').push(marker(revision));
    node['w:p']=children(node,'w:p').map(item=>{if(!item||typeof item!=='object'||Object.hasOwn(item,'w:pPr')||Object.keys(item).some(key=>/bookmark|commentRange|proofErr/.test(key)))return item;return {['w:'+revision]:[...marker(revision)['w:'+revision],...(kind==='del'?[deletionText(item)]:[item])]}});return node;
   }
   if(Object.hasOwn(node,'w:tr')){const props=property(node,'w:tr','w:trPr');children(props,'w:trPr').push(marker(kind))}
   for(const [key,value]of Object.entries(node))if(Array.isArray(value))node[key]=value.map(child=>revise(child,inTable||key==='w:tbl'));return node;
  }
  const content=this.blocks.map(block=>revise(block.prepForXml(context)));
  if(move){const id=this.counters.changeIndex++,name='SlateForgeMove_'+a.id;content.unshift({['w:'+revision+'RangeStart']:[{_attr:{'w:id':id,'w:name':name,'w:author':a.author,'w:date':a.date}}]});content.push({['w:'+revision+'RangeEnd']:[{_attr:{'w:id':id}}]})}
  return {'w:sdt':[{'w:sdtPr':[{'w:alias':[{_attr:{'w:val':'Tracked block change'}}]},{'w:tag':[{_attr:{'w:val':'SlateForgeRevision:'+a.id+':'+(this.move?'move':'edit')}}]}]},{'w:sdtContent':content}]};
 }
}
const direct=(node,name)=>[...node?.children||[]].find(child=>child.namespaceURI===W&&child.localName===name),all=(node,name)=>[...node.getElementsByTagNameNS(W,name)],val=(node,key)=>node?.getAttributeNS(W,key)||'';
const revisionNames=new Set(['ins','del','moveFrom','moveTo']);
function nativeBlockChange(node){
 let marker;
 if(node.localName==='p'){
  marker=[...direct(direct(node,'pPr'),'rPr')?.children||[]].find(child=>child.namespaceURI===W&&revisionNames.has(child.localName));if(!marker)return null;
  for(const run of all(node,'r')){
   let owner=run.parentElement;while(owner&&owner!==node&&!revisionNames.has(owner.localName))owner=owner.parentElement;
   if(owner===node||!owner||owner.localName!==marker.localName||val(owner,'author')!==val(marker,'author')||val(owner,'date')!==val(marker,'date'))return null;
  }
 }else if(node.localName==='tbl'){
  const rows=[...node.children].filter(child=>child.localName==='tr');if(!rows.length)return null;
  for(const row of rows){const mark=[...direct(row,'trPr')?.children||[]].find(child=>child.namespaceURI===W&&['ins','del'].includes(child.localName));if(!mark||marker&&(mark.localName!==marker.localName||val(mark,'author')!==val(marker,'author')||val(mark,'date')!==val(marker,'date')))return null;marker=mark}
 }else return null;
 if(!/^-?\d{1,50}$/.test(val(marker,'id')))return null;
 return {...reviewAttrs({id:'word-block-'+val(marker,'id'),author:val(marker,'author'),date:val(marker,'date'),kind:['del','moveFrom'].includes(marker.localName)?'delete':'insert'}),...(marker.localName.startsWith('move')?{operation:'move'}:{})};
}

export function prepareDocxBlockRevisions(xml,warnings=[]){
 const boundaries=new Map(),covered=new Set(),reserved=new Set(all(xml,'pStyle').map(style=>val(style,'val')));let count=0;
 function clean(node){
  for(const wrapper of [...node.getElementsByTagNameNS(W,'ins'),...node.getElementsByTagNameNS(W,'del'),...node.getElementsByTagNameNS(W,'moveFrom'),...node.getElementsByTagNameNS(W,'moveTo')].reverse()){
   // Keep formatting-property revisions separate from structural decisions.
   if(['pPrChange','rPrChange','trPrChange'].some(name=>{let p=wrapper.parentElement;while(p&&p!==node){if(p.localName===name)return true;p=p.parentElement}return false}))continue;
   wrapper.replaceWith(...wrapper.childNodes);
  }
  for(const text of all(node,'delText')){const replacement=xml.createElementNS(W,'w:t');for(const attr of text.attributes)replacement.setAttributeNS(attr.namespaceURI,attr.name,attr.value);replacement.textContent=text.textContent;text.replaceWith(replacement)}
  for(const name of ['moveFromRangeStart','moveFromRangeEnd','moveToRangeStart','moveToRangeEnd'])for(const range of all(node,name))range.remove();
 }
 function boundary(attrs,edge){if(++count>2000)throw Error('DOCX has too many structural revision boundaries.');let id='ForgeBlockBoundary'+count;while(reserved.has(id))id+='X';reserved.add(id);const p=xml.createElementNS(W,'w:p'),props=xml.createElementNS(W,'w:pPr'),style=xml.createElementNS(W,'w:pStyle');style.setAttributeNS(W,'w:val',id);props.append(style);p.append(props);boundaries.set(id,{attrs,edge});return p}
 function surround(nodes,attrs){if(!nodes.length)return;nodes[0].before(boundary(attrs,'start'));nodes.at(-1).after(boundary(attrs,'end'));for(const node of nodes){clean(node);covered.add(node);for(const paragraph of all(node,'p'))covered.add(paragraph);for(const table of all(node,'tbl'))covered.add(table)}}
 for(const sdt of all(xml,'sdt')){
  const match=/^SlateForgeRevision:([a-zA-Z0-9_-]{1,80}):(move|edit)$/.exec(val(direct(direct(sdt,'sdtPr'),'tag'),'val'));if(!match)continue;
  const body=direct(sdt,'sdtContent');if(!body)continue;const nodes=[...body.children].filter(node=>['p','tbl'].includes(node.localName)),changes=nodes.map(nativeBlockChange);
  if(nodes.length&&changes.every(Boolean)&&changes.every(change=>change.kind===changes[0].kind&&change.author===changes[0].author&&change.date===changes[0].date)){
   const attrs={...changes[0],id:match[1],...(match[2]==='move'?{operation:'move'}:{})};surround(nodes,attrs);
  }
  sdt.replaceWith(...body.childNodes);
 }
 const moveNames=new Map(),activeMoves=new Map(),moveOwners=new Map(),moveRuns=new WeakMap();
 for(const element of xml.getElementsByTagName('*')){
  if(element.namespaceURI!==W)continue;
  const start=/^(moveFrom|moveTo)RangeStart$/.exec(element.localName),end=/^(moveFrom|moveTo)RangeEnd$/.exec(element.localName);
  if(start){const name=val(element,'name');if(name&&!moveNames.has(name))moveNames.set(name,'word-move-'+(moveNames.size+1));if(name)activeMoves.set(start[1]+':'+val(element,'id'),{id:moveNames.get(name),kind:start[1]==='moveFrom'?'delete':'insert'});continue}
  if(end){activeMoves.delete(end[1]+':'+val(element,'id'));continue}
  if(['p','r'].includes(element.localName)&&activeMoves.size){let p=element;while(p&&p.localName!=='p')p=p.parentElement;if(p){const matches=[...activeMoves.values()];if(matches.length===1){moveOwners.set(p,matches[0]);if(element.localName==='r')moveRuns.set(element,matches[0])}}}
 }
 for(const node of [...all(xml,'p'),...all(xml,'tbl')]){
  if(covered.has(node)||!xml.documentElement.contains(node))continue;let ancestor=node.parentElement,skip=false;while(ancestor&&ancestor!==xml.documentElement){if(['txbxContent','p','tbl'].includes(ancestor.localName)){skip=true;break}ancestor=ancestor.parentElement}if(skip)continue;
  const attrs=nativeBlockChange(node);if(attrs){const move=moveOwners.get(node);surround([node],move&&attrs.operation==='move'&&move.kind===attrs.kind?{...attrs,id:move.id}:attrs);}
 }
 if(all(xml,'trPr').some(props=>[...props.children].some(child=>child.namespaceURI===W&&['ins','del'].includes(child.localName))))warnings.push('Partially revised Word tables were imported with their current rows; row-level review decisions could not be retained.');
 if(all(xml,'pPr').some(props=>[...direct(props,'rPr')?.children||[]].some(child=>child.namespaceURI===W&&revisionNames.has(child.localName))))warnings.push('Word paragraph split/join revisions retained supported text changes, but their paragraph-boundary decisions could not be retained.');
 boundaries.moveRuns=moveRuns;return boundaries;
}

export function restoreDocxBlockBoundaries(html){
 const markers=[...html.querySelectorAll('[data-forge-block-boundary]')];
 for(const start of markers){let data;try{data=JSON.parse(decodeURIComponent(start.getAttribute('data-forge-block-boundary')))}catch{start.remove();continue}if(data.edge!=='start'||!start.parentNode)continue;
  const siblings=[];let end=start.nextSibling;while(end){if(end.nodeType===1&&end.hasAttribute('data-forge-block-boundary')){let value;try{value=JSON.parse(decodeURIComponent(end.getAttribute('data-forge-block-boundary')))}catch{}if(value?.edge==='end'&&value.attrs.id===data.attrs.id)break}siblings.push(end);end=end.nextSibling}
  if(!end)throw Error('A DOCX structural revision has unmatched content boundaries.');
  const wrapper=html.createElement('div');wrapper.setAttribute('data-forge-block-change',encodeURIComponent(JSON.stringify(data.attrs)));start.before(wrapper);for(const sibling of siblings)wrapper.append(sibling);if(!wrapper.children.length){const p=html.createElement('p');wrapper.append(p)}start.remove();end.remove();
 }
 for(const marker of html.querySelectorAll('[data-forge-block-boundary]'))marker.remove();
}
