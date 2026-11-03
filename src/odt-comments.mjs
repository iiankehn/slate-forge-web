import {reviewAttrs} from './review.mjs';
const OFFICE='urn:oasis:names:tc:opendocument:xmlns:office:1.0',TEXT='urn:oasis:names:tc:opendocument:xmlns:text:1.0',DC='http://purl.org/dc/elements/1.1/',LOEXT='urn:org:documentfoundation:names:experimental:office:xmlns:loext:1.0';
export function odtComments(content,escape){
 const records=new Map();let visited=0;
 function scan(node,depth=0){if(++visited>100000||depth>100)throw Error('ODT comments exceed document complexity limits.');if(node.marks?.some(mark=>mark.type==='reviewChange'&&mark.attrs?.kind==='delete'))return;
  const comments=node.type==='commentAnchor'?[{attrs:node.attrs}]:node.type==='text'?(node.marks||[]).filter(mark=>mark.type==='comment'):[];
  for(const mark of comments){const attrs=reviewAttrs(mark.attrs),record=records.get(attrs.id);if(record){if(node.type==='commentAnchor'||record.point)throw Error('ODT comment IDs cannot combine anchors and ranges.');record.last=node}else{if(records.size>=300)throw Error('ODT supports up to 300 comments in this export.');records.set(attrs.id,{attrs,first:node,last:node,point:node.type==='commentAnchor',name:'ForgeComment'+records.size})}}
  for(const child of node.content||[])scan(child,depth+1);
 }scan(content);
 function annotation(record){const a=record.attrs;return '<office:annotation office:name="'+record.name+'" loext:resolved="'+a.resolved+'"><dc:creator>'+escape(a.author)+'</dc:creator><dc:date>'+escape(a.date)+'</dc:date>'+a.body.split('\n').map(line=>'<text:p>'+escape(line)+'</text:p>').join('')+'</office:annotation>'}
 function wrap(node,value){let before='',after='';for(const record of records.values()){if(record.first===node)before+=annotation(record);if(record.last===node&&!record.point)after+='<office:annotation-end office:name="'+record.name+'"/>'}return before+value+after}
 return {wrap};
}

export function importOdtComments(root,warnings,escape){
 const starts=[...root.getElementsByTagNameNS(OFFICE,'annotation')],ends=[...root.getElementsByTagNameNS(OFFICE,'annotation-end')];
 if(starts.length>300||ends.length>300)throw Error('ODT supports up to 300 comments on import.');
 const byStart=new Map(),byEnd=new Map(),active=new Set(),positions=new Map();let index=0,outputSize=0;for(const node of root.getElementsByTagName('*'))positions.set(node,index++);
 const name=node=>node.getAttributeNS(OFFICE,'name')||'';
 function unsupported(node){for(let parent=node.parentElement;parent&&parent!==root;parent=parent.parentElement)if(parent.namespaceURI===TEXT&&['note','tracked-changes','table-of-content'].includes(parent.localName)||parent.namespaceURI===OFFICE&&parent.localName==='annotation')return true;return false}
 for(const start of starts){const key=name(start),matching=ends.filter(end=>name(end)===key),duplicates=starts.filter(node=>name(node)===key).length;
  if(unsupported(start)||matching.some(unsupported)){warnings.add('An ODT comment in notes, generated contents or stored revision data was omitted.');continue}
  if(!key||duplicates!==1||matching.length>1||matching.length&&positions.get(matching[0])<=positions.get(start)){warnings.add('An ambiguous ODT comment range was ignored.');continue}
  const paragraphs=[...start.getElementsByTagNameNS(TEXT,'p')],attrs=reviewAttrs({id:'odt-comment-'+byStart.size,author:start.getElementsByTagNameNS(DC,'creator')[0]?.textContent,body:paragraphs.map(node=>node.textContent).join('\n'),date:start.getElementsByTagNameNS(DC,'date')[0]?.textContent,resolved:start.getAttributeNS(LOEXT,'resolved')==='true'}),record={attrs,encoded:escape(encodeURIComponent(JSON.stringify(attrs))),point:!matching.length};byStart.set(start,record);if(matching.length)byEnd.set(matching[0],record);
 }
 function bounded(value){outputSize+=value.length;if(outputSize>20000000)throw Error('Expanded ODT comments exceed the 20 MB import limit.');return value}
 function marker(node){if(node.namespaceURI!==OFFICE)return null;if(node.localName==='annotation'){const record=byStart.get(node);if(!record)return '';if(record.point)return bounded('<span data-forge-comment-anchor="'+record.encoded+'">💬</span>');active.add(record);return ''}if(node.localName==='annotation-end'){const record=byEnd.get(node);if(record)active.delete(record);else warnings.add('An unmatched ODT comment end was ignored.');return ''}return null}
 function wrap(value){for(const record of active)value='<span data-forge-comment="'+record.encoded+'">'+value+'</span>';return bounded(value)}
 return {marker,wrap};
}

export function odtNoteText(body){if(!body)return '';const copy=body.cloneNode(true);for(const node of [...copy.getElementsByTagNameNS(OFFICE,'annotation'),...copy.getElementsByTagNameNS(OFFICE,'annotation-end'),...copy.getElementsByTagNameNS(TEXT,'tracked-changes')])node.remove();return copy.textContent||''}
