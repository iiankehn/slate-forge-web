import {reviewAttrs} from './review.mjs';
const TEXT='urn:oasis:names:tc:opendocument:xmlns:text:1.0',OFFICE='urn:oasis:names:tc:opendocument:xmlns:office:1.0';
const fail=message=>{throw Error(message||'Decide unsupported structural revisions before ODT export, or use DOCX/HTML to retain them.')};
const paragraph=node=>['paragraph','heading'].includes(node?.type);
const info=(a,esc)=>'<office:change-info><dc:creator>'+esc(a.author)+'</dc:creator><dc:date>'+esc(a.date)+'</dc:date>'+(a.body?'<text:p>'+esc(a.body)+'</text:p>':'')+'</office:change-info>';
const insert=(xml,value,edge)=>edge==='before'?xml.replace(/^(<text:(?:p|h)\b[^>]*>)/,'$1'+value):xml.replace(/(<\/text:(?:p|h)>)$/,value+'$1');
const emptyLike=xml=>xml.match(/^<text:(p|h)\b[^>]*>/)[0]+'</text:'+xml.match(/^<text:(p|h)\b/)[1]+'>';

export function odtBlockChanges(content,esc){
 const records=new Map(),groups=new Map();let visited=0;
 function scan(node,parent,inside=false,depth=0){if(++visited>100000||depth>100)fail('ODT structural revisions exceed document complexity limits.');if(node.attrs?.rowChange||node.attrs?.paragraphBoundaryChange)fail('Decide table-row and paragraph-boundary revisions before ODT export, or use DOCX/HTML to retain them.');
  if(node.type==='blockRevision'){
   if(inside||parent!==content||node.attrs?.operation==='move'||!node.content?.length||!node.content.every(paragraph))fail();
   if(parent.content.length===1&&node.content.length===1&&!node.content[0].content?.some(n=>n.type==='hardBreak'||n.type==='text'&&n.text))fail('An empty whole-document structural suggestion requires a decision before ODT export.');
   const attrs=reviewAttrs(node.attrs);let group=groups.get(attrs.id);if(!group){group={index:groups.size+1,attrs};groups.set(attrs.id,group)}else if(['author','date','body'].some(key=>group.attrs[key]!==attrs[key]))fail('An ODT structural revision has inconsistent author/date metadata.');
   if(records.size>=1000)fail('ODT supports up to 1,000 structural revision ranges.');records.set(node,{attrs,name:'ForgeBlockChange_'+group.index+'_'+(records.size+1)+'_'+attrs.kind,parts:''});inside=true;
  }else if(inside&&!paragraph(node)&&!['text','hardBreak','commentAnchor'].includes(node.type))fail();
  if(inside&&(node.attrs?.paragraphChange||node.marks?.some(m=>['reviewChange','formatChange'].includes(m.type))))fail('Decide nested text or formatting changes inside structural revisions before ODT export, or use HTML.');
  for(const child of node.content||[])scan(child,node,inside,depth+1);
 }scan(content,null);
 if(records.size&&!content.content.every(node=>paragraph(node)||records.has(node)))fail('Native ODT structural revisions currently require a body of top-level paragraphs and headings. Use DOCX/HTML for lists, tables, sections or objects.');
 function render(renderNode){if(!records.size)return null;
  const units=[],deletions=[];
  for(const node of content.content){const record=records.get(node);if(!record){units.push({xml:renderNode(node),node});continue}if(record.attrs.kind==='delete'){record.parts=node.content.map(renderNode).join('');deletions.push({record,at:units.length});continue}record.first=units.length;for(const child of node.content)units.push({xml:renderNode(child),node:child,record});record.end=units.length}
  const insertions=[...records.values()].filter(r=>r.attrs.kind==='insert');
  if(records.size>1&&!units.some(unit=>!unit.record))fail('Whole-document replacements or independent changes need an unchanged paragraph anchor before ODT export, or use DOCX/HTML.');
  if(!units.length){if(deletions.length!==1)fail('Decide multiple whole-document deletions before ODT export, or use DOCX/HTML.');units.push({xml:'<text:p></text:p>',placeholder:true})}
  for(const record of insertions){let end=record.end;while(end<units.length&&units[end].record)end=units[end].record.end;record.mode=end<units.length?'right':record.first>0?'left':'sole';if(record.mode==='sole'&&insertions.length>1)fail('Independent insertions covering the whole document need decisions before ODT export, or use DOCX/HTML.');}
  const events=new Map();function event(at,edge,priority,xml){const key=at+':'+edge;if(!events.has(key))events.set(key,[]);events.get(key).push({priority,xml})}
  for(const record of insertions){const start='<text:change-start text:change-id="'+record.name+'"/>',end='<text:change-end text:change-id="'+record.name+'"/>';if(record.mode==='left'){event(record.first-1,'after',2,start);event(record.end-1,'after',0,end)}else{event(record.first,'before',2,start);event(record.end<units.length?record.end:record.end-1,record.end<units.length?'before':'after',0,end)}}
  for(const {record,at}of deletions){let index,edge;if(units[0].placeholder){index=0;edge='before'}else if(at>0&&units[at-1].record?.mode!=='right'&&(!units[at-1].xml.includes('<office:annotation')||units[at-1].node.content?.some(n=>n.type==='hardBreak'||n.type==='text'&&n.text))){index=at-1;edge='after';record.parts=emptyLike(units[index].xml)+record.parts}else if(at<units.length&&units[at].record?.mode!=='left'){index=at;edge='before';if(emptyLike(record.parts)!==emptyLike(units[index].xml))fail('A leading paragraph deletion needs a compatible paragraph anchor to retain its formatting in ODT. Use DOCX/HTML or decide the change.');record.parts+=emptyLike(units[index].xml)}else fail('An ODT paragraph deletion has no safe unchanged anchor. Use DOCX/HTML or decide the change.');event(index,edge,1,'<text:change text:change-id="'+record.name+'"/>')}
  return units.map((unit,i)=>{let xml=unit.xml;for(const edge of ['before','after']){const values=events.get(i+':'+edge);if(values)xml=insert(xml,values.sort((a,b)=>a.priority-b.priority).map(e=>e.xml).join(''),edge)}return xml}).join('');
 }
 function xml(){return [...records.values()].map(r=>{const kind=r.attrs.kind==='delete'?'deletion':'insertion';return '<text:changed-region xml:id="'+r.name+'" text:id="'+r.name+'"><text:'+kind+'>'+info(r.attrs,esc)+(kind==='deletion'?r.parts:'')+'</text:'+kind+'></text:changed-region>'}).join('')}
 return {size:records.size,handles:node=>records.has(node),render,xml};
}

const isParagraph=n=>n?.namespaceURI===TEXT&&['p','h'].includes(n.localName);
const inlineNames=new Set(['span','a','s','tab','line-break','bookmark','bookmark-start','bookmark-end','reference-mark','reference-mark-start','reference-mark-end']);
const markers=new Set(['change','change-start','change-end']);
// Only complete paragraph boundaries can be mapped to whole-block decisions.
// Leave ambiguous partial ranges to the inline reader's explicit refusal.
export function prepareOdtBlockChanges(root,records,styles,esc,bounded){
 const byKey=new Map(),ordered=[],starts=new Map(),ends=new Map();let visited=0,active=null;
 function collect(node,depth=0){if(++visited>100000||depth>100)throw Error('ODT structural revisions exceed complexity limits.');if(node.nodeType!==1)return;if(node.namespaceURI===TEXT&&node.localName==='tracked-changes'||node.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(node.localName))return;
  if(node.namespaceURI===TEXT&&markers.has(node.localName)){if(node.childNodes.length)throw Error('ODT revision markers must be empty.');const key=node.getAttributeNS(TEXT,'change-id'),record=records.get(key);if(!record)throw Error('An ODT text revision references a missing change definition.');if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(node);const at=ordered.length;ordered.push(node);if(node.localName==='change-start'){if(active)throw Error('Overlapping or repeated ODT text revision ranges are unsupported.');active=key;starts.set(key,at)}else if(node.localName==='change-end'){if(active!==key)throw Error('ODT text revision ranges must be balanced within one paragraph or a supported whole-paragraph range.');active=null;ends.set(key,at)}else if(active)throw Error('Nested or repeated ODT deletion markers are unsupported.');return}
  for(const child of node.children)collect(child,depth+1);
 }collect(root);if(active)throw Error('An ODT insertion has no matching end marker.');
 function host(marker){let p=marker.parentElement;while(p&&p!==root&&!isParagraph(p))p=p.parentElement;return isParagraph(p)&&p.parentElement===root?p:null}
 function edge(marker,p,side){let found=false,ink=false;function walk(n){if(++visited>100000)throw Error('ODT structural revisions exceed complexity limits.');if(n===marker){found=true;return}if(n.nodeType===3){if(n.nodeValue.length&&(side==='before'?!found:found))ink=true;return}if(n.nodeType!==1)return;if(n.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(n.localName)||n.namespaceURI===TEXT&&(markers.has(n.localName)||/^(?:bookmark|reference-mark)(?:-start|-end)?$/.test(n.localName)))return;if(n!==p&&!(n.namespaceURI===TEXT&&['span','a'].includes(n.localName))&&(side==='before'?!found:found))ink=true;for(const child of n.childNodes)walk(child)}walk(p);return found&&!ink}
 function safe(p,allowMarkers=true){function walk(n,depth=0){if(++visited>100000||depth>100)throw Error('ODT structural revisions exceed complexity limits.');if(n.nodeType===3)return;if(n.nodeType!==1)return;if(n.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(n.localName))return;if(n.namespaceURI!==TEXT||n!==p&&isParagraph(n)||!(isParagraph(n)||inlineNames.has(n.localName)||allowMarkers&&markers.has(n.localName)))throw Error('An ODT structural revision contains unsupported objects, fields or nested changes.');for(const child of n.childNodes)walk(child,depth+1)}walk(p)}
 function empty(p){function noInk(n){if(++visited>100000)throw Error('ODT structural revisions exceed complexity limits.');if(n.nodeType===3)return !n.nodeValue;if(n.nodeType!==1)return true;if(n.namespaceURI===TEXT&&(markers.has(n.localName)||/^(?:bookmark|reference-mark)(?:-start|-end)?$/.test(n.localName)))return true;return (isParagraph(n)||n.namespaceURI===TEXT&&['span','a'].includes(n.localName))&&[...n.childNodes].every(noInk)}return noInk(p)}
 function sameParagraph(a,b){const props=n=>JSON.stringify(Object.entries(styles.resolve('paragraph',n.getAttributeNS(TEXT,'style-name'))).sort(([a],[b])=>a.localeCompare(b)));return a.localName===b.localName&&(a.localName!=='h'||a.getAttributeNS(TEXT,'outline-level')===b.getAttributeNS(TEXT,'outline-level'))&&props(a)===props(b)}
 const before=new Map(),after=new Map(),drop=new Set(),plans=[];const add=(map,node,value)=>map.set(node,(map.get(node)||'')+value);
 const body=[...root.children].filter(n=>isParagraph(n)||!(n.namespaceURI===TEXT&&['tracked-changes','sequence-decls','variable-decls','user-field-decls','dde-connection-decls'].includes(n.localName)));
 const opening=r=>bounded('<div data-forge-block-change="'+r.encoded+'">'),closing=()=>bounded('</div>');
 function stored(p,depth=0,props={}){if(++visited>100000||depth>100)throw Error('ODT deleted paragraphs exceed complexity limits.');if(p.nodeType===3)return styles.inline(esc(p.nodeValue),props);if(p.nodeType!==1)return '';if(p.namespaceURI===OFFICE){styles.warnings.add('Comments inside deleted ODT text were omitted.');return ''}
  const name=p.localName,paragraph=isParagraph(p),styleName=p.getAttributeNS(TEXT,'style-name'),style=paragraph?styles.combine(styles.resolve('text',''),styles.resolve('paragraph',styleName)):name==='span'&&styleName?styles.combine(props,styles.resolve('text',styleName)):props,children=()=>[...p.childNodes].map(n=>stored(n,depth+1,style)).join('');
  if(name==='s'){const count=Number(p.getAttributeNS(TEXT,'c')||1);if(!Number.isInteger(count)||count<1||count>1000)throw Error('ODT deleted whitespace exceeds safety limits.');return styles.inline(' '.repeat(count),props)}if(name==='tab')return '\t';if(name==='line-break')return '<br>';if(name==='a'){const href=p.getAttributeNS('http://www.w3.org/1999/xlink','href')||'';return /^(https?:|mailto:)/i.test(href)?'<a href="'+esc(href)+'">'+children()+'</a>':children()}if(paragraph){const tag=name==='h'?'h'+Math.min(6,Math.max(1,Number(p.getAttributeNS(TEXT,'outline-level'))||1)):'p';return '<'+tag+styles.paragraphAttrs(style)+'>'+children()+'</'+tag+'>'}return children();
 }
 for(const [key,record]of records){const list=byKey.get(key)||[];if(record.kind==='insert'&&list.length===2&&list[0].localName==='change-start'&&list[1].localName==='change-end'){
   const [start,end]=list,p=host(start),q=host(end);if(!p||!q||ends.get(key)!==starts.get(key)+1)continue;const i=body.indexOf(p),j=body.indexOf(q);let members;
   if(p!==q&&edge(start,p,'before')&&edge(end,q,'before'))members=body.slice(i,j);
   else if(p!==q&&edge(start,p,'after')&&edge(end,q,'after'))members=body.slice(i+1,j+1);
   else if(i===0&&j===body.length-1&&(p!==q||key.startsWith('ForgeBlockChange_'))&&edge(start,p,'before')&&edge(end,q,'after'))members=body.slice(i,j+1);
   if(!members?.length||!members.every(isParagraph))continue;for(const node of members)safe(node);plans.push({key,list});add(before,members[0],opening(record));add(after,members.at(-1),closing());
  }else if(record.kind==='delete'&&list.length===1&&list[0].localName==='change'){
   const marker=list[0],p=host(marker);if(!p)continue;const paragraphs=[...record.node.children].filter(n=>!(n.namespaceURI===OFFICE&&n.localName==='change-info'));if(!paragraphs.length||!paragraphs.every(isParagraph))continue;let members,side;
   const right=paragraphs.length>1&&edge(marker,p,'before')&&empty(paragraphs.at(-1)),left=paragraphs.length>1&&edge(marker,p,'after')&&empty(paragraphs[0]);
   if(left&&right&&sameParagraph(p,paragraphs[0])&&sameParagraph(p,paragraphs.at(-1))&&p.getElementsByTagNameNS(OFFICE,'annotation').length)continue;
   if(left&&(!right||sameParagraph(p,paragraphs[0])&&!sameParagraph(p,paragraphs.at(-1)))){members=paragraphs.slice(1);side='after'}else if(right){members=paragraphs.slice(0,-1);side='before'}else if((paragraphs.length>1||key.startsWith('ForgeBlockChange_'))&&body.length===1&&empty(p)){members=paragraphs;side='before';drop.add(p)}
   if(!members?.length)continue;for(const node of paragraphs)safe(node,false);plans.push({key,list});add(side==='before'?before:after,p,opening(record)+bounded(members.map(n=>stored(n)).join(''))+closing());
  }
 }
 // Consume only after all supported ranges have passed validation. Remaining
 // records are still checked by the inline reader before a document is returned.
 for(const {key,list}of plans){records.delete(key);for(const marker of list)marker.remove()}
 return (node,value)=>(before.get(node)||'')+(drop.has(node)?'':value)+(after.get(node)||'');
}
