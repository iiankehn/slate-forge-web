import {ODT_NS as NS,odtAttr as attr} from './odt-styles.mjs';
// Ordinary Writer page changes need no text:section. Project compatible direct
// body assignments into the existing section model, without guessing nested
// page changes, mixed furniture/paper designs or existing section semantics.
export function odtPageRuns(root,styles,base){
 if(!base||root.getElementsByTagNameNS(NS.text,'section').length||root.getElementsByTagNameNS(NS.text,'tracked-changes').length)return null;
 const properties=node=>styles.resolve(node.localName==='table'?'table':'paragraph',attr(node,node.localName==='table'?'table':'text','style-name'));
 for(const [namespace,name]of [[NS.text,'p'],[NS.text,'h'],[NS.table,'table']])for(const node of root.getElementsByTagNameNS(namespace,name))if(node.parentNode!==root&&properties(node)['style:master-page-name'])return null;
 const compatible=page=>page&&['size','margin','pageNumbers','header','footer'].every(key=>page[key]===base[key]);
 const key=page=>JSON.stringify([page.orientation,page.columns]);
 let page=base,interesting=false,restart=false,runs=[],nodes=[],first=true,breakBefore=false,masterNode=null;
 const flush=()=>{if(nodes.length){runs.push({nodes,page,breakBefore,masterNode,first});first=false;nodes=[];if(runs.length>100&&interesting)throw Error('ODT exceeds 100 top-level page runs.');}};
 for(const node of root.childNodes){
  const block=node.nodeType===1&&['p','h','table'].includes(node.localName),props=block?properties(node):{},master=props['style:master-page-name'];
  if(props['style:page-number']&&props['style:page-number']!=='auto')restart=true;
  if(master){const next=styles.masterLayout(master);if(!next)return null;if(base.columns!==1||next?.columns!==1){styles.warnings.add('ODT page-level columns keep their existing fallback; balanced text sections do not preserve sequential page-column flow.');return null;}if(!compatible(next)){if(next)styles.warnings.add('ODT page changes with different paper, margins, numbering or furniture use document defaults.');return null;}if(nodes.some(n=>n.nodeType===1&&['p','h','table','list','table-of-content','frame'].includes(n.localName)||n.nodeType===3&&n.nodeValue.trim()))flush();page=next;breakBefore=!first;masterNode=node;if(key(page)!==key(base))interesting=true}
  nodes.push(node);
 }
 flush();if(interesting&&restart){styles.warnings.add('ODT page changes with page-number restarts use document defaults.');return null}return interesting?runs:null;
}
