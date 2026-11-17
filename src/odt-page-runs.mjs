import {ODT_NS as NS,odtAttr as attr} from './odt-styles.mjs';
import {nativePageStart} from './sections.mjs';
// Project direct body assignments only. Restarts are boundary events, never
// inherited master properties; nested assignments retain the warned fallback.
export function odtPageRuns(root,styles,base){
 if(!base||root.getElementsByTagNameNS(NS.text,'section').length||root.getElementsByTagNameNS(NS.text,'tracked-changes').length)return null;
 const properties=node=>styles.resolve(node.localName==='table'?'table':'paragraph',attr(node,node.localName==='table'?'table':'text','style-name'));
 let blocks=0;for(const [namespace,name]of [[NS.text,'p'],[NS.text,'h'],[NS.table,'table']])for(const node of root.getElementsByTagNameNS(namespace,name)){if(++blocks>100000)throw Error('ODT page-run content exceeds safety limits.');if(node.parentNode!==root){const props=properties(node);if(props['style:master-page-name']||props['style:page-number']&&props['style:page-number']!=='auto')return null;}}
 const key=page=>JSON.stringify([page.size,page.margin,page.orientation,page.columns,page.header,page.footer,page.pageNumbers]);
 let page=base,interesting=base.columns>1,runs=[],nodes=[],first=true,breakBefore=false,masterNode=null,pageStart;
 const hasContent=()=>nodes.some(n=>n.nodeType===1&&['p','h','table','list','table-of-content','frame'].includes(n.localName)||n.nodeType===3&&n.nodeValue.trim());
 const flush=()=>{if(nodes.length){runs.push({nodes,page,breakBefore,masterNode,first,pageStart});first=false;nodes=[];if(runs.length>100&&interesting)throw Error('ODT exceeds 100 top-level page runs.');}};
 let direct=0;for(const node of root.childNodes){
  if(++direct>100000)throw Error('ODT page-run content exceeds safety limits.');
  const block=node.nodeType===1&&['p','h','table'].includes(node.localName),props=block?properties(node):{},master=props['style:master-page-name'],value=props['style:page-number'],restart=value&&value!=='auto',start=nativePageStart(value);
  if(restart&&(start===undefined||!master&&props['fo:break-before']!=='page')){styles.warnings.add('ODT page changes with unsupported page-number restarts use document defaults.');return null;}
  if(master||restart){const next=master?styles.masterLayout(master):page;if(!next)return null;if((next.header!==base.header||next.footer!==base.footer||next.pageNumbers!==base.pageNumbers||restart)&&(!styles.plainFurniture?.()||!styles.plainFurniture?.(master))){styles.warnings.add('ODT page changes with formatted or complex furniture keep the document fallback.');return null;}if((interesting||key(next)!==key(base)||restart)&&(!styles.pageGeometrySupported?.()||!styles.pageGeometrySupported?.(master))){styles.warnings.add('ODT page changes with unsupported paper or margins use the document fallback.');return null;}if(hasContent())flush();page=next;breakBefore=!first||!!restart;masterNode=node;pageStart=restart?start:undefined;if(key(page)!==key(base)||restart)interesting=true;}
  nodes.push(node);
 }
 flush();if(runs.some(run=>run.page.columns>1&&run.nodes.some(node=>node.nodeType===1&&(node.localName==='table'||node.getElementsByTagNameNS(NS.draw,'frame').length||node.getElementsByTagNameNS(NS.table,'table').length||node.getElementsByTagNameNS(NS.text,'note').length)))){styles.warnings.add('ODT sequential page columns with objects or notes keep the existing layout fallback.');return null;}return interesting?runs:null;
}
