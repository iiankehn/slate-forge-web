import {reviewAttrs} from './review.mjs';
const TEXT='urn:oasis:names:tc:opendocument:xmlns:text:1.0',OFFICE='urn:oasis:names:tc:opendocument:xmlns:office:1.0',DC='http://purl.org/dc/elements/1.1/',XML='http://www.w3.org/XML/1998/namespace';
const MAX_REGIONS=1000,MAX_HTML=20000000;
const direct=(node,ns,name)=>[...node.children].filter(child=>child.namespaceURI===ns&&child.localName===name);

export function odtChanges(content,escape,{trackChanges=false}={}){
 const groups=new Map(),regions=[],byNode=new WeakMap();let previous=null,visited=0;
 function scan(node,depth=0){
  if(++visited>100000||depth>100)throw Error('ODT text revisions exceed document complexity limits.');
  if(node.attrs?.paragraphChange||node.marks?.some(mark=>mark.type==='formatChange'))throw Error('Decide formatting revisions before ODT export, or use DOCX/HTML to retain them.');
  if(node.type!=='text'&&node.marks?.some(mark=>mark.type==='reviewChange'))throw Error('Decide object or line-break revisions before ODT export, or use DOCX/HTML.');
  if(node.type!=='text'){previous=null;for(const child of node.content||[])scan(child,depth+1);previous=null;return}
  const marks=(node.marks||[]).filter(mark=>mark.type==='reviewChange');if(!marks.length){previous=null;return}if(marks.length!==1)throw Error('Overlapping text revisions cannot be exported to ODT.');
  const attrs=reviewAttrs(marks[0].attrs);if((node.text||'').includes('\n'))throw Error('Decide text revisions containing line breaks before ODT export, or use DOCX/HTML.');
  let group=groups.get(attrs.id);if(!group){group={index:groups.size+1,attrs};groups.set(attrs.id,group)}else if(['author','date','body'].some(key=>group.attrs[key]!==attrs[key]))throw Error('An ODT text revision has inconsistent author/date metadata.');
  if(!previous||previous.group!==group||previous.attrs.kind!==attrs.kind){if(regions.length>=MAX_REGIONS)throw Error('ODT supports up to 1,000 text revision ranges.');previous={group,attrs,first:node,last:node,name:'ForgeTextChange_'+group.index+'_'+(regions.length+1)+'_'+attrs.kind,parts:[]};regions.push(previous)}else previous.last=node;
  byNode.set(node,previous);
 }scan(content);
 function text(node,value){const record=byNode.get(node);if(!record)return value;if(record.attrs.kind==='delete'){record.parts.push(value);return record.first===node?'<text:change text:change-id="'+record.name+'"/>':''}return (record.first===node?'<text:change-start text:change-id="'+record.name+'"/>':'')+value+(record.last===node?'<text:change-end text:change-id="'+record.name+'"/>':'')}
 function xml(){if(!regions.length&&!trackChanges)return '';return '<text:tracked-changes text:track-changes="'+(trackChanges===true)+'">'+regions.map(record=>{const a=record.attrs,kind=a.kind==='delete'?'deletion':'insertion',info='<office:change-info><dc:creator>'+escape(a.author)+'</dc:creator><dc:date>'+escape(a.date)+'</dc:date>'+(a.body?'<text:p>'+escape(a.body)+'</text:p>':'')+'</office:change-info>';return '<text:changed-region xml:id="'+record.name+'" text:id="'+record.name+'"><text:'+kind+'>'+info+(kind==='deletion'?'<text:p>'+record.parts.join('')+'</text:p>':'')+'</text:'+kind+'></text:changed-region>'}).join('')+'</text:tracked-changes>'}
 return {text,xml};
}

export function importOdtChanges(root,styles,escape){
 const containers=[...root.getElementsByTagNameNS(TEXT,'tracked-changes')],records=new Map(),byNode=new WeakMap(),byMarker=new WeakMap(),groups=new Map();let visited=0,outputSize=0;
 if(containers.length>1||containers.some(node=>node.parentElement!==root))throw Error('Nested or duplicate ODT revision stores are unsupported.');
 const container=containers[0],regions=container?direct(container,TEXT,'changed-region'):[];if(regions.length>MAX_REGIONS)throw Error('ODT supports up to 1,000 text revision ranges.');
 for(const [index,region]of regions.entries()){
  const key=region.getAttributeNS(XML,'id')||region.getAttributeNS(TEXT,'id'),legacy=region.getAttributeNS(TEXT,'id');if(!key||key.length>200||records.has(key)||legacy&&legacy!==key)throw Error('ODT revision IDs are missing, duplicated or ambiguous.');
  const kinds=[...region.children].filter(child=>child.namespaceURI===TEXT&&['insertion','deletion','format-change'].includes(child.localName));if(kinds.length!==1||region.children.length!==1)throw Error('An ODT revision has an unsupported change definition.');const node=kinds[0],kind=node.localName==='insertion'?'insert':node.localName==='deletion'?'delete':'format',info=direct(node,OFFICE,'change-info')[0];if(!info||direct(node,OFFICE,'change-info').length!==1||kind==='insert'&&node.children.length!==1)throw Error('An ODT revision has invalid change metadata.');
  const native=/^ForgeTextChange_(\d+)_(\d+)_(insert|delete)$/.exec(key),groupKey=native?'native:'+native[1]:'external:'+index,prior=groups.get(groupKey),id=prior?.id||'odt-change-'+groups.size;if(native&&native[3]!==kind)throw Error('An ODT revision has inconsistent group metadata.');
  const attrs=reviewAttrs({id,kind,author:info?.getElementsByTagNameNS(DC,'creator')[0]?.textContent,date:info?.getElementsByTagNameNS(DC,'date')[0]?.textContent,body:info?direct(info,TEXT,'p').map(p=>p.textContent).join('\n'):''});if(prior&&['author','date','body'].some(key=>prior[key]!==attrs[key]))throw Error('An ODT revision group has conflicting metadata.');groups.set(groupKey,attrs);
  records.set(key,{node,kind,attrs,encoded:escape(encodeURIComponent(JSON.stringify(attrs))),starts:0,ends:0,points:0,textNodes:0,paragraph:null});
 }
 function bounded(value){outputSize+=value.length;if(outputSize>MAX_HTML)throw Error('Expanded ODT text revisions exceed the 20 MB import limit.');return value}
 function paragraph(node){for(let parent=node.parentElement;parent&&parent!==root;parent=parent.parentElement)if(parent.namespaceURI===TEXT&&['p','h'].includes(parent.localName))return parent;return null}
 let active=null;
 function walk(node,depth=0){
  if(++visited>100000||depth>100)throw Error('ODT text revisions exceed document complexity limits.');
  if(node.nodeType===3){if(active){byNode.set(node,active);if(node.nodeValue.length)active.textNodes++}return}if(node.nodeType!==1||node===container)return;
  if(node.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(node.localName))return;
  if(node.namespaceURI===TEXT&&['note','table-of-content'].includes(node.localName)){if(active||[...node.getElementsByTagNameNS(TEXT,'change'),...node.getElementsByTagNameNS(TEXT,'change-start'),...node.getElementsByTagNameNS(TEXT,'change-end')].length)throw Error('ODT revisions in notes or generated contents require a compatible editor.');return}
  if(node.namespaceURI===TEXT&&['change','change-start','change-end'].includes(node.localName)){
   const record=records.get(node.getAttributeNS(TEXT,'change-id'));if(!record)throw Error('An ODT text revision references a missing change definition.');if(record.kind==='format')throw Error('Decide native ODT formatting revisions in a compatible editor before importing.');
   const parent=paragraph(node);if(!parent)throw Error('Structural ODT revisions require a compatible editor.');
   if(node.localName==='change'){if(record.kind!=='delete'||++record.points!==1||active)throw Error('Nested or repeated ODT deletion markers are unsupported.');record.paragraph=parent;byMarker.set(node,record);return}
   if(record.kind!=='insert')throw Error('An ODT deletion must use a point marker.');
   if(node.localName==='change-start'){if(active||++record.starts!==1)throw Error('Overlapping or repeated ODT text revision ranges are unsupported.');record.paragraph=parent;active=record}else{if(active!==record||++record.ends!==1||parent!==record.paragraph)throw Error('ODT text revision ranges must be balanced within one paragraph.');active=null}return;
  }
  if(active){if(node.namespaceURI===TEXT&&['p','h'].includes(node.localName))throw Error('ODT text revision ranges must be balanced within one paragraph.');if(node.namespaceURI!==TEXT||!['span','a','s','tab','bookmark','bookmark-start','bookmark-end','reference-mark','reference-mark-start','reference-mark-end'].includes(node.localName))throw Error('ODT revisions containing fields, line breaks or objects require a compatible editor.');if(['s','tab'].includes(node.localName))active.textNodes++;byNode.set(node,active)}
  for(const child of node.childNodes)walk(child,depth+1);
 }walk(root);
 if(active)throw Error('An ODT insertion has no matching end marker.');
 for(const record of records.values()){if(record.kind==='insert'&&(record.starts!==1||record.ends!==1||record.textNodes===0)||record.kind==='delete'&&record.points!==1)throw Error('An ODT text revision is missing its body marker.');}
 function deleted(record){
  const paragraphs=direct(record.node,TEXT,'p'),other=[...record.node.children].filter(node=>!(node.namespaceURI===OFFICE&&node.localName==='change-info')&&!(node.namespaceURI===TEXT&&node.localName==='p'));
  if(paragraphs.length!==1||other.length)throw Error('Only single-paragraph inline ODT deletions are supported; use a compatible editor for structural revisions.');
  function inline(node,props={},depth=0){if(++visited>100000||depth>100)throw Error('ODT deleted text exceeds complexity limits.');if(node.nodeType===3)return styles.inline(escape(node.nodeValue),props);if(node.nodeType!==1)return '';
   if(node.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(node.localName)){styles.warnings.add('Comments inside deleted ODT text were omitted.');return ''}
   if(node.namespaceURI!==TEXT||!['p','span','a','s','tab'].includes(node.localName))throw Error('An ODT deletion contains unsupported objects, fields or line breaks.');
   if(node.localName==='s'){const count=Number(node.getAttributeNS(TEXT,'c')||1);if(!Number.isInteger(count)||count<1||count>1000)throw Error('ODT deleted whitespace exceeds safety limits.');return styles.inline(' '.repeat(count),props)}if(node.localName==='tab')return styles.inline('\t',props);
   const family=node.localName==='p'?'paragraph':'text',name=node.getAttributeNS(TEXT,'style-name'),next=['p','span'].includes(node.localName)&&name?styles.combine(props,styles.resolve(family,name)):props;let result=[...node.childNodes].map(child=>inline(child,next,depth+1)).join('');if(node.localName==='a'){const href=node.getAttributeNS('http://www.w3.org/1999/xlink','href')||'';if(/^(https?:|mailto:)/i.test(href))result='<a href="'+escape(href)+'">'+result+'</a>'}return result;
  }
  const value=inline(paragraphs[0],styles.combine(styles.resolve('text',''),styles.resolve('paragraph',record.paragraph?.getAttributeNS(TEXT,'style-name'))));if(!value)throw Error('Empty or structural ODT deletions require a compatible editor.');return bounded('<span data-forge-change="'+record.encoded+'">'+value+'</span>');
 }
 const deletionHTML=new Map();for(const record of records.values())if(record.kind==='delete')deletionHTML.set(record,deleted(record));
 function marker(node){if(node.namespaceURI!==TEXT||!['change','change-start','change-end'].includes(node.localName))return null;return node.localName==='change'?deletionHTML.get(byMarker.get(node))||'':''}
 function wrap(node,value){const record=byNode.get(node);return bounded(record?'<span data-forge-change="'+record.encoded+'">'+value+'</span>':value)}
 return {marker,wrap,trackChanges:!!container&&(!container.hasAttributeNS(TEXT,'track-changes')||['true','1'].includes(container.getAttributeNS(TEXT,'track-changes')))};
}
