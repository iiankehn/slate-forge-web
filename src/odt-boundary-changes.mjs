import {reviewAttrs} from './review.mjs';
import {collectOdtChangeMarkers} from './odt-change-markers.mjs';
const TEXT='urn:oasis:names:tc:opendocument:xmlns:text:1.0',OFFICE='urn:oasis:names:tc:opendocument:xmlns:office:1.0';
const fail=()=>{throw Error('Native ODT paragraph-boundary revisions require adjacent top-level paragraphs with matching design and no nested text/format revisions. Decide unsupported boundary changes first, or use DOCX/HTML.');};
const opening=xml=>/^<text:p\b[^>]*>/.exec(xml)?.[0];
const inner=xml=>xml.slice(opening(xml).length,-'</text:p>'.length);
const emptyLike=xml=>opening(xml)+'</text:p>';

export function odtBoundaryChanges(content,esc,layout={}){
 const records=new Map(),groups=new Map(),textNodes=new WeakSet();let visited=0;
 function safe(node,depth=0){if(++visited>100000||depth>100)fail();if(!['paragraph','text','hardBreak','commentAnchor'].includes(node.type)||node.attrs?.paragraphChange||node.marks?.some(m=>['reviewChange','formatChange'].includes(m.type)))fail();if(node.type==='text')textNodes.add(node);for(const child of node.content||[])safe(child,depth+1)}
 function scan(node,parent,depth=0){
  if(++visited>100000||depth>100)fail();
  if(node.attrs?.paragraphBoundaryChange){
   const index=parent?.content?.indexOf(node),right=parent?.content?.[index+1];
   if(parent!==content||node.type!=='paragraph'||right?.type!=='paragraph')fail();safe(node);safe(right);
   const attrs=reviewAttrs(node.attrs.paragraphBoundaryChange);if(attrs.body)fail();
   let group=groups.get(attrs.id);if(!group){group={index:groups.size+1,attrs};groups.set(attrs.id,group)}else if(['author','date'].some(k=>group.attrs[k]!==attrs[k]))throw Error('An ODT boundary revision has inconsistent author/date metadata.');
   if(records.size>=1000)throw Error('ODT supports up to 1,000 paragraph-boundary revisions.');
   const inheritsText=attrs.kind==='delete'&&(right.content||[]).some(n=>(n.marks||[]).some(m=>m.type!=='comment'&&(m.type!=='textStyle'||Object.entries(m.attrs||{}).some(([key,value])=>value&&({fontFamily:layout.font,fontSize:'12pt',color:'#000000'})[key]!==value))));
   if(inheritsText&&[node,right].some(p=>p.attrs?.keepTogether||p.attrs?.keepWithNext||p.attrs?.pageBreakBefore))throw Error('Native ODT cannot safely combine a paragraph join, rich text and paragraph keep/page-break settings. Decide that boundary first, or use DOCX/HTML.');
   records.set(node,{attrs,right,inheritsText,name:'ForgeBoundaryChange_'+group.index+'_'+(records.size+1)+'_'+attrs.kind,payload:''});
  }
  for(const child of node.content||[])scan(child,node,depth+1);
 }
 scan(content,null);
 function finish(units,values){
  const representatives=values.map((_,i)=>i),parts=values.map(xml=>opening(xml)?[inner(xml)]:null),hidden=new Set();
  for(let i=0;i<units.length;i++){
   const record=records.get(units[i].node);if(!record)continue;
   if(units[i+1]?.node!==record.right||!opening(units[i].xml)||opening(units[i].xml)!==opening(units[i+1].xml))fail();
   const at=representatives[i],next=i+1;
   if(record.attrs.kind==='insert'){
    parts[at].push('<text:change-start text:change-id="'+record.name+'"/>');
    parts[next].unshift('<text:change-end text:change-id="'+record.name+'"/>');
   }else{
    // The trailing paragraph inherits the current run context. Giving it a
    // named style makes Writer reset character formatting after the break.
    record.payload=emptyLike(units[i].xml)+(record.inheritsText?'<text:p/>':emptyLike(units[next].xml));
    parts[at].push('<text:change text:change-id="'+record.name+'"/>',...parts[next]);
    hidden.add(next);representatives[next]=at;
   }
  }
  return values.map((xml,i)=>hidden.has(i)?'':parts[i]?opening(xml)+parts[i].join('')+'</text:p>':xml).join('');
 }
 function xml(){return [...records.values()].map(r=>{const a=r.attrs,kind=a.kind==='delete'?'deletion':'insertion';return '<text:changed-region xml:id="'+r.name+'" text:id="'+r.name+'"><text:'+kind+'><office:change-info><dc:creator>'+esc(a.author)+'</dc:creator><dc:date>'+esc(a.date)+'</dc:date></office:change-info>'+r.payload+'</text:'+kind+'></text:changed-region>'}).join('')}
 return {size:records.size,preservesText:node=>textNodes.has(node),handles:node=>records.has(node),finish,xml};
}

const paragraph=n=>n?.namespaceURI===TEXT&&n.localName==='p';
const markers=new Set(['change','change-start','change-end']);
const inert=name=>/^(?:bookmark|reference-mark)(?:-start|-end)?$/.test(name);
export function prepareOdtBoundaryChanges(root,records,styles,esc,bounded){
 const attributes=new WeakMap();if(!records.size)return ()=>'';
 const order=collectOdtChangeMarkers(root,records),analyses=new WeakMap(),safeBody=new WeakSet(),safeStored=new WeakSet();let visited=order.visited;
 function budget(depth=0){if(++visited>100000||depth>100)throw Error('ODT paragraph-boundary revisions exceed complexity limits.');}
 function host(marker){let p=marker.parentElement;while(p&&p!==root&&!paragraph(p))p=p.parentElement;return paragraph(p)&&p.parentElement===root?p:null}
 function analyse(p){
  if(analyses.has(p))return analyses.get(p);const positions=new Map();let ink=0;
  function walk(n,depth=0){budget(depth);if(n.nodeType===3){if(n.nodeValue)ink++;return}if(n.nodeType!==1)return;
   if(n.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(n.localName))return;
   if(n.namespaceURI===TEXT){if(markers.has(n.localName)){positions.set(n,ink);return}if(inert(n.localName))return;if(['s','tab','line-break'].includes(n.localName)){ink++;return}}
   if(n!==p&&!(n.namespaceURI===TEXT&&['span','a'].includes(n.localName)))ink++;
   for(const child of n.childNodes)walk(child,depth+1);
  }
  walk(p);const result={positions,total:ink};analyses.set(p,result);return result;
 }
 function safe(p,stored=false){const checked=stored?safeStored:safeBody;if(checked.has(p))return;function walk(n,depth=0){budget(depth);if(n.nodeType!==1)return;if(!stored&&n.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(n.localName))return;
   if(n.namespaceURI!==TEXT||n!==p&&!['span','a','s','tab','line-break'].includes(n.localName)&&!inert(n.localName)&&!(!stored&&markers.has(n.localName)))throw Error('An ODT paragraph-boundary revision contains unsupported fields, objects or nested changes.');
   if(n.localName==='s'){const count=Number(n.getAttributeNS(TEXT,'c')||1);if(!Number.isInteger(count)||count<1||count>1000)throw Error('ODT boundary whitespace exceeds safety limits.');}
   for(const child of n.children)walk(child,depth+1);
  }walk(p);checked.add(p)}
 const characterProperties=new Set(['fo:font-weight','fo:font-style','style:text-underline-style','style:text-line-through-style','fo:font-family','style:font-name','fo:font-size','fo:color','fo:background-color','style:text-position']);
 function same(a,b){const props=p=>JSON.stringify(Object.entries(styles.resolve('paragraph',p.getAttributeNS(TEXT,'style-name'))).filter(([key])=>!characterProperties.has(key)).sort(([a],[b])=>a.localeCompare(b)));return paragraph(a)&&paragraph(b)&&props(a)===props(b)}
 const plans=[];
 for(const [key,record]of records){
  const list=order.byKey.get(key)||[],native=/^ForgeBoundaryChange_\d+_\d+_(?:insert|delete)$/.test(key);
  if(record.kind==='insert'&&list.length===2&&list[0].localName==='change-start'&&list[1].localName==='change-end'){
   const [start,end]=list,p=host(start),q=host(end);if(!p||!q||p.nextElementSibling!==q||order.ends.get(key)!==order.starts.get(key)+1)continue;
   const a=analyse(p),b=analyse(q);if(a.positions.get(start)!==a.total||b.positions.get(end)!==0||!native&&(!a.total||!b.total))continue;
   if(!same(p,q)){if(native)fail();continue}safe(p);safe(q);if(record.attrs.body)throw Error('ODT boundary changes with notes require a compatible editor.');plans.push({key,record,list,left:p});
  }else if(record.kind==='delete'&&list.length===1&&list[0].localName==='change'){
   const marker=list[0],p=host(marker);if(!p)continue;const payload=[...record.node.children].filter(n=>!(n.namespaceURI===OFFICE&&n.localName==='change-info'));
   if(payload.length!==2||!payload.every(paragraph))continue;const a=analyse(p),position=a.positions.get(marker);
   if(!native&&(!position||position===a.total))continue;
   const inheritedTail=native&&[...payload[1].attributes].every(a=>a.namespaceURI==='http://www.w3.org/2000/xmlns/')&&!payload[1].childNodes.length;
   if(payload.some(n=>analyse(n).total)||!same(p,payload[0])||!inheritedTail&&!same(p,payload[1])){if(native)fail();continue}
   safe(p);for(const n of payload)safe(n,true);if(record.attrs.body)throw Error('ODT boundary changes with notes require a compatible editor.');plans.push({key,record,list,left:p,rightStyle:payload[1].getAttributeNS(TEXT,'style-name')});
  }
 }
 // Split right-to-left. Each extracted tail is moved once; partial spans retain
 // their formatting and existing comment-marker identities, without HTML slicing.
 const positions=new Map(order.ordered.map((node,i)=>[node,i]));
 for(const plan of plans.sort((a,b)=>positions.get(b.list[0])-positions.get(a.list[0]))){
  const {key,record,list,left,rightStyle}=plan;
  if(record.kind==='delete'){
   const marker=list[0],right=left.cloneNode(false),range=root.ownerDocument.createRange();right.removeAttributeNS('http://www.w3.org/XML/1998/namespace','id');
   if(rightStyle)right.setAttributeNS(TEXT,'text:style-name',rightStyle);
   range.selectNodeContents(left);range.setStartAfter(marker);right.append(range.extractContents());left.after(right);
   if(attributes.has(left))attributes.set(right,attributes.get(left));
  }
  attributes.set(left,bounded(' data-forge-boundary-change="'+record.encoded+'"'));records.delete(key);for(const marker of list)marker.remove();
 }
 const attribute=node=>attributes.get(node)||'';attribute.count=plans.length;return attribute;
}
