// The editor appends a plain caret paragraph after a terminal block container.
// Keep editing/storage intact, but do not turn that single empty tail into a
// new default-orientation output page. Explicit breaks/formatting stay real.
export function sectionOutputDocument(doc){
 const nodes=doc?.content;if(doc?.type!=='doc'||!Array.isArray(nodes)||nodes.length<2)return doc;
 const tail=nodes.at(-1),before=nodes.at(-2),defaults={textDirection:'auto',widowControl:true,keepTogether:false,keepWithNext:false,pageBreakBefore:false,paragraphSpacing:null,paragraphLine:null,indent:0,textAlign:null};
 if(before?.type!=='columnSection'||tail?.type!=='paragraph'||tail.content?.length||tail.marks?.length||Object.entries(tail.attrs||{}).some(([key,value])=>value!==null&&(!Object.hasOwn(defaults,key)||value!==defaults[key])))return doc;
 return {...doc,content:nodes.slice(0,-1)};
}
export function trimSectionCursorTail(article){
 const tail=article.lastElementChild;if(tail?.localName!=='p'||!tail.previousElementSibling?.hasAttribute('data-forge-section')||tail.textContent!==''||tail.children.length&&!(tail.children.length===1&&tail.firstElementChild.localName==='br'&&tail.firstElementChild.className==='ProseMirror-trailingBreak'))return false;
 for(const attribute of tail.attributes){if(attribute.name==='dir'&&attribute.value==='auto'||attribute.name==='style')continue;return false}
 for(let i=0;i<tail.style.length;i++){const key=tail.style.item(i);if(!['orphans','widows'].includes(key)||tail.style.getPropertyValue(key)!=='2'||tail.style.getPropertyPriority(key))return false}
 tail.remove();return true;
}
