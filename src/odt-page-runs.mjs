import {ODT_NS as NS,odtAttr as attr} from './odt-styles.mjs';
// Ordinary Writer page changes need no text:section. Project compatible direct
// body assignments into the existing section model, without guessing nested
// page changes, mixed furniture/paper designs or existing section semantics.
export function odtPageRuns(root,styles,base){
 if(!base||root.getElementsByTagNameNS(NS.text,'section').length||root.getElementsByTagNameNS(NS.text,'tracked-changes').length)return null;
 const properties=node=>styles.resolve(node.localName==='table'?'table':'paragraph',attr(node,node.localName==='table'?'table':'text','style-name'));
 let blocks=0;for(const [namespace,name]of [[NS.text,'p'],[NS.text,'h'],[NS.table,'table']])for(const node of root.getElementsByTagNameNS(namespace,name)){if(++blocks>100000)throw Error('ODT page-run content exceeds safety limits.');if(node.parentNode!==root&&properties(node)['style:master-page-name'])return null;}
 const compatible=page=>page&&['pageNumbers'].every(key=>page[key]===base[key]);
 const key=page=>JSON.stringify([page.size,page.margin,page.orientation,page.columns,page.header,page.footer]);
 let page=base,interesting=base.columns>1,restart=false,runs=[],nodes=[],first=true,breakBefore=false,masterNode=null;
 const flush=()=>{if(nodes.length){runs.push({nodes,page,breakBefore,masterNode,first});first=false;nodes=[];if(runs.length>100&&interesting)throw Error('ODT exceeds 100 top-level page runs.');}};
 let direct=0;for(const node of root.childNodes){
  if(++direct>100000)throw Error('ODT page-run content exceeds safety limits.');
  const block=node.nodeType===1&&['p','h','table'].includes(node.localName),props=block?properties(node):{},master=props['style:master-page-name'];
  if(props['style:page-number']&&props['style:page-number']!=='auto')restart=true;
  if(master){const next=styles.masterLayout(master);if(!next)return null;if((next.header!==base.header||next.footer!==base.footer)&&(!styles.plainFurniture?.()||!styles.plainFurniture?.(master))){styles.warnings.add('ODT page changes with formatted or complex furniture keep the document fallback.');return null;}if((interesting||key(next)!==key(base))&&(!styles.pageGeometrySupported?.()||!styles.pageGeometrySupported?.(master))){styles.warnings.add('ODT page changes with unsupported paper or margins use the document fallback.');return null;}if(!compatible(next)){if(next)styles.warnings.add('ODT page changes with different numbering use document defaults.');return null;}if(nodes.some(n=>n.nodeType===1&&['p','h','table','list','table-of-content','frame'].includes(n.localName)||n.nodeType===3&&n.nodeValue.trim()))flush();page=next;breakBefore=!first;masterNode=node;if(key(page)!==key(base))interesting=true}
  nodes.push(node);
 }
 flush();if(runs.some(run=>run.page.columns>1&&run.nodes.some(node=>node.nodeType===1&&(node.localName==='table'||node.getElementsByTagNameNS(NS.draw,'frame').length||node.getElementsByTagNameNS(NS.table,'table').length||node.getElementsByTagNameNS(NS.text,'note').length)))){styles.warnings.add('ODT sequential page columns with objects or notes keep the existing layout fallback.');return null}if(interesting&&restart){styles.warnings.add('ODT page changes with page-number restarts use document defaults.');return null}return interesting?runs:null;
}
