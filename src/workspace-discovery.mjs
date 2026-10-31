// Search and navigation stay local. Never index deleted revisions or generated contents.
export const searchText=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().trim();
const hidden=node=>(node.type?.name||node.type)==='blockRevision'&&node.attrs?.kind==='delete'||node.marks?.some(mark=>(mark.type.name||mark.type)==='reviewChange'&&mark.attrs?.kind==='delete');
export function bodyText(node){
 if(!node||hidden(node))return '';
 const type=node.type?.name||node.type;
 if(['tableOfContents','designCanvas','footnote','image'].includes(type))return '';
 if(type==='text')return node.text||'';
 if(type==='hardBreak')return '\n';
 const children=Array.isArray(node.content)?node.content:node.content?.content||[];
 return children.filter(child=>!hidden(child)).map(bodyText).join(node.isTextblock||['paragraph','heading','codeBlock'].includes(type)?'':'\n');
}
export function commandCatalog(menus){
 const seen=new Set(),result=[];
 for(const [category,items]of menus)for(const item of items){if(!item)continue;const [label,action,shortcut='']=item;if(action==='commands'||seen.has(action))continue;seen.add(action);result.push({label,action,shortcut,category})}
 return result;
}
const aliases={import:'open import file docx html text',export:'download save word docx html text', 'export:print':'print pdf',designCanvas:'draw drawing shapes canvas',ocrTools:'recognize scan image text ocr',deviceStorage:'storage persistence permission',appearance:'theme dark light accent color colour',stats:'word count statistics reading goal'};
export function searchCommands(catalog,query){
 const q=searchText(query),terms=q.split(/\s+/).filter(Boolean);
 return catalog.map((item,index)=>{const label=searchText(item.label),haystack=searchText([item.label,item.category,aliases[item.action]||''].join(' '));return {...item,index,score:label===q?0:label.startsWith(q)?1:label.includes(q)?2:3,match:terms.every(term=>haystack.includes(term))}}).filter(item=>item.match).sort((a,b)=>a.score-b.score||a.index-b.index);
}
export function libraryDocuments(docs,{query='',sort='updated',scope='all',readBody=bodyText,bodyIsNormalized=false}={}){
 const terms=searchText(query).split(/\s+/).filter(Boolean);
 return docs.filter(doc=>{const title=searchText(doc.title),tags=searchText((doc.tags||[]).join(' '));const haystack=scope==='title'?title:scope==='tags'?tags:title+' '+tags+' '+(terms.length?(bodyIsNormalized?readBody(doc.content):searchText(readBody(doc.content))):'');return terms.every(term=>haystack.includes(term))}).sort((a,b)=>sort==='title'?String(a.title||'Untitled document').localeCompare(String(b.title||'Untitled document'))||String(a.id).localeCompare(String(b.id)):sort==='oldest'?(a.updated||0)-(b.updated||0): (b.updated||0)-(a.updated||0));
}
export function filterOutline(headings,query='',depth=6){const terms=searchText(query).split(/\s+/).filter(Boolean);return headings.filter(h=>h.level<=depth&&terms.every(term=>searchText(h.title).includes(term)))}
