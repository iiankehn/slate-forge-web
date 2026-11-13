import {collectOdtChangeMarkers} from './odt-change-markers.mjs';
const TEXT='urn:oasis:names:tc:opendocument:xmlns:text:1.0',TABLE='urn:oasis:names:tc:opendocument:xmlns:table:1.0',OFFICE='urn:oasis:names:tc:opendocument:xmlns:office:1.0';
const paragraph=n=>n?.namespaceURI===TEXT&&['p','h'].includes(n.localName),container=n=>n?.namespaceURI===TEXT&&n.localName==='list'||n?.namespaceURI===TABLE&&n.localName==='table',block=n=>paragraph(n)||container(n);
const markers=new Set(['change','change-start','change-end']),inert=name=>/^(?:bookmark|reference-mark)(?:-start|-end)?$/.test(name);
const textNames=new Set(['p','h','list','list-item','span','a','s','tab','line-break']);
const key=n=>(n.namespaceURI===TEXT?'text:':n.namespaceURI===TABLE?'table:':'other:')+n.localName;
const childTypes={
 'text:list':new Set(['text:list-item']),
 'text:list-item':new Set(['text:p','text:h','text:list','table:table']),
 'table:table':new Set(['table:table-column','table:table-columns','table:table-row','table:table-rows','table:table-header-rows']),
 'table:table-columns':new Set(['table:table-column']),
 'table:table-rows':new Set(['table:table-row']),
 'table:table-header-rows':new Set(['table:table-row']),
 'table:table-row':new Set(['table:table-cell','table:covered-table-cell']),
 'table:table-cell':new Set(['text:p','text:h','text:list','table:table'])
};
const tableNames=new Set(['table','table-column','table-columns','table-row','table-rows','table-header-rows','table-cell','covered-table-cell']);
// Whole-container boundaries are resolved before the paragraph/inline readers.
// Deleted children use the normal renderer and its existing style/expansion limits.
export function prepareOdtContainerChanges(root,records,styles,bounded){
 if(!records.size){const render=(_node,html)=>html;render.count=0;return render}
 const order=collectOdtChangeMarkers(root,records);let visited=order.visited;const before=new WeakMap(),after=new WeakMap(),plans=[];
 const budget=depth=>{if(++visited>100000||depth>100)throw Error('ODT list/table revisions exceed complexity limits.')};
 const annotation=n=>n.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(n.localName);
 function host(n){while(n&&n.parentElement!==root)n=n.parentElement;return n?.parentElement===root?n:null}
 function ink(n,depth=0){budget(depth);if(n.nodeType===3)return !!n.nodeValue&&(paragraph(n.parentElement)||['span','a'].includes(n.parentElement?.localName)||!!n.nodeValue.trim());if(n.nodeType!==1||annotation(n)||n.namespaceURI===TEXT&&(markers.has(n.localName)||inert(n.localName)))return false;if(block(n)||n.namespaceURI===TEXT&&['s','tab','line-break','list-item'].includes(n.localName))return true;return [...n.childNodes].some(c=>ink(c,depth+1))}
 function edge(marker,unit,side){let node=marker;while(node!==unit){if(!node.parentNode)return false;for(let sibling=side==='before'?node.previousSibling:node.nextSibling;sibling;sibling=side==='before'?sibling.previousSibling:sibling.nextSibling)if(ink(sibling))return false;node=node.parentNode}return true}
 function empty(p){return paragraph(p)&&[...p.childNodes].every(n=>!ink(n))}
 function same(a,b){const props=n=>JSON.stringify(Object.entries(styles.resolve('paragraph',n.getAttributeNS(TEXT,'style-name'))).sort(([a],[b])=>a.localeCompare(b)));return paragraph(a)&&paragraph(b)&&a.localName===b.localName&&props(a)===props(b)}
 function safe(node,allowed,depth=0){budget(depth);if(node.nodeType!==1)return;if(node.namespaceURI===TEXT&&node.localName==='list-item'&&node.hasAttributeNS(TEXT,'start-value')){const start=Number(node.getAttributeNS(TEXT,'start-value'));if(!Number.isInteger(start)||start<1||start>100)throw Error('ODT list revisions support start values from 1 to 100.')}if(node.namespaceURI===TEXT&&node.localName==='list'&&(node.getAttributeNS(TEXT,'continue-numbering')==='true'||node.hasAttributeNS(TEXT,'continue-list'))&&![...node.children].find(n=>n.namespaceURI===TEXT&&n.localName==='list-item')?.hasAttributeNS(TEXT,'start-value'))throw Error('A continued ODT list revision requires an explicit start value.');if(annotation(node))return;if(node.namespaceURI===TEXT&&markers.has(node.localName)){if(!allowed.has(node))throw Error('Nested ODT list/table revisions require a compatible editor.');return}if(!(node.namespaceURI===TEXT&&(textNames.has(node.localName)||inert(node.localName))||node.namespaceURI===TABLE&&tableNames.has(node.localName)))throw Error('An ODT list/table revision contains unsupported fields, objects or nested changes.');const shape=childTypes[key(node)];for(const child of node.childNodes){if(child.nodeType===1&&!annotation(child)&&!(child.namespaceURI===TEXT&&(markers.has(child.localName)||inert(child.localName)))&&(shape?!shape.has(key(child)):block(child)||child.namespaceURI===TABLE||child.namespaceURI===TEXT&&child.localName==='list-item'))throw Error('An ODT list/table revision has unsupported container structure.');safe(child,allowed,depth+1)}}
 const body=[...root.children].filter(n=>!(n.namespaceURI===TEXT&&(['tracked-changes','sequence-decls','variable-decls','user-field-decls','dde-connection-decls'].includes(n.localName)||markers.has(n.localName))));
 function endpoint(marker,start){const unit=host(marker);if(!unit)return null;if(unit===marker){const neighbor=start?marker.nextElementSibling:marker.previousElementSibling,index=body.indexOf(neighbor);return index<0?null:index+(start?0:1)}const i=body.indexOf(unit);if(i<0||!block(unit))return null;if(edge(marker,unit,'before'))return i;if(edge(marker,unit,'after'))return i+1;return null}
 for(const [key,record]of records){const list=order.byKey.get(key)||[];
  if(record.kind==='insert'&&list.length===2&&order.ends.get(key)===order.starts.get(key)+1){const a=endpoint(list[0],true),b=endpoint(list[1],false);if(a===null||b===null||b<=a)continue;const members=body.slice(a,b);if(!members.some(container)||!members.every(block))continue;for(const n of members)safe(n,new Set(list));if(record.attrs.body)throw Error('ODT list/table changes with notes require a compatible editor.');plans.push({key,record,list,members});
  }else if(record.kind==='delete'&&list.length===1&&list[0].localName==='change'){
   const marker=list[0],left=host(marker),right=left?.nextElementSibling,payload=[...record.node.children].filter(n=>!(n.namespaceURI===OFFICE&&n.localName==='change-info'));if(!paragraph(left)||left.localName!=='p'||!paragraph(right)||!edge(marker,left,'after')||payload.length<3||!empty(payload[0])||!empty(payload.at(-1)))continue;const members=payload.slice(1,-1);if(!members.some(container)||!members.every(block))continue;if(!same(left,payload[0])||!same(right,payload.at(-1)))throw Error('An ODT list/table deletion has incompatible paragraph boundary styles.');for(const n of payload)safe(n,new Set());if(record.attrs.body)throw Error('ODT list/table changes with notes require a compatible editor.');plans.push({key,record,list,members,left,deleted:true});
  }
 }
 const opening=r=>bounded('<div data-forge-block-change="'+r.encoded+'">'),closing=()=>bounded('</div>');
// Mutate only after every candidate is validated, in actual reverse marker order.
 const positions=new Map(order.ordered.map((n,i)=>[n,i]));
 for(const plan of plans.sort((a,b)=>positions.get(b.list[0])-positions.get(a.list[0]))){let members=plan.members;if(plan.deleted){members=members.map(n=>n.cloneNode(true));function clean(n){budget(0);if(n.nodeType!==1)return;if(annotation(n)){styles.warnings.add('Comments inside deleted ODT text were omitted.');n.remove();return}n.removeAttributeNS('http://www.w3.org/XML/1998/namespace','id');for(const child of [...n.childNodes])clean(child)}for(const node of members)clean(node);plan.left.after(...members)}before.set(members[0],opening(plan.record)+(before.get(members[0])||''));after.set(members.at(-1),(after.get(members.at(-1))||'')+closing());records.delete(plan.key);for(const marker of plan.list)marker.remove()}
 const render=(node,html)=>(before.get(node)||'')+html+(after.get(node)||'');render.count=plans.length;return render;
}
