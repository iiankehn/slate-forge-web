// Deterministic, local suggestions. No network requests or document mutations.
const PLACEHOLDERS=/\b(?:TODO|TBD|FIXME)\b|\bLorem ipsum\b|\[(?:insert|add|your)\s[^\]\n\ufffc]{1,100}\]|\{\{[^{}\n\ufffc]{1,100}\}\}/gi;
function inlineMap(node,pos){const parts=[],segments=[];let length=0;node.descendants((child,offset)=>{if(child.isText||child.isLeaf){const value=child.isText?child.text:child.type.name==='hardBreak'?'\n':'\ufffc';parts.push(value);segments.push({start:length,end:length+value.length,from:pos+1+offset});length+=value.length;return false}});return {text:parts.join(''),position(offset){let low=0,high=segments.length-1;while(low<=high){const mid=(low+high)>>1,segment=segments[mid];if(offset<segment.start)high=mid-1;else if(offset>=segment.end)low=mid+1;else return segment.from+offset-segment.start}return pos+1}}}
export function checkDocument(doc,{title='',maxIssues=200}={}){
 const limit=Math.max(1,Math.min(500,Math.trunc(maxIssues)||200)),issues=[];let truncated=false,previousLevel=0;
 function add(category,message,detail,from,to,target='text',excerpt=''){if(issues.length>=limit){truncated=true;return false}issues.push({id:'check-'+issues.length,category,message,detail,from,to,target,excerpt:String(excerpt).slice(0,140)});return true}
 if(!String(title).trim()||/^untitled(?: document)?(?: \d+)?$/i.test(String(title).trim()))add('structure','Give this document a title','A descriptive title makes saved documents easier to find.',0,0,'title');
 doc.descendants((node,pos)=>{
  if(issues.length>=limit){truncated=true;return false}
  if(node.type.name==='footnote'||node.type.name==='designCanvas'){
   const texts=node.type.name==='footnote'?[String(node.attrs.text||'')]:(node.attrs.scene?.objects||[]).filter(o=>o.type==='text').map(o=>String(o.text||''));
   for(const text of texts){const pattern=new RegExp(PLACEHOLDERS.source,PLACEHOLDERS.flags);let match;while((match=pattern.exec(text))){if(!add('writing','Possible unfinished placeholder in '+(node.type.name==='footnote'?'a note':'a design'),'Open this object to review its text.',pos,pos+node.nodeSize,node.type.name==='footnote'?'footnote':'canvas',match[0]))break}}
  }
  if(node.type.name==='image'&&!String(node.attrs.alt||'').trim())add('images','Image has no description','Add a description if this image conveys information.',pos,pos+node.nodeSize,'image');
  if(node.type.name==='table'){const first=node.firstChild;if(first&&first.childCount&&!first.content.content.some(cell=>cell.type.name==='tableHeader'))add('structure','Table has no header cells in its first row','If this row labels columns, mark it as a header in Table design.',pos,pos+node.nodeSize,'table')}
  if(node.type.name==='heading'){
   const level=Number(node.attrs.level)||1;
   if(!node.textContent.trim())add('structure','Empty heading','Add heading text or change this paragraph to Body text.',pos+1,pos+node.nodeSize-1);
   else if(level>previousLevel+1)add('structure',previousLevel?'Heading jumps from level '+previousLevel+' to '+level:'Outline starts at Heading '+level,'Consider using consecutive heading levels to keep the outline easy to follow.',pos+1,pos+node.nodeSize-1,'text',node.textContent);
   previousLevel=level;
  }
  if(node.isTextblock){
   if(node.type.name!=='codeBlock'){
    const mapped=inlineMap(node,pos),pattern=new RegExp(PLACEHOLDERS.source,PLACEHOLDERS.flags);let match;
    while((match=pattern.exec(mapped.text))){const from=mapped.position(match.index),to=mapped.position(match.index+match[0].length-1)+1;if(!add('writing','Possible unfinished placeholder','Review this text; it may be intentional.',from,to,'text',match[0]))break}
   }
  }
 });
 const counts={images:0,structure:0,writing:0};for(const issue of issues)counts[issue.category]++;
 return {issues,counts,truncated};
}
