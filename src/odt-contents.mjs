import {DOCUMENT_STYLES,styleKey} from './document-styles.mjs';

// Native index sources keep the contents editable in ODF word processors.
export function odtContents(content,layout,esc){
 const headings=[],byNode=new Map(),usedStyles=Array.from({length:6},()=>new Set());
 function text(node){if(node.marks?.some(mark=>mark.type==='reviewChange'&&mark.attrs?.kind==='delete'))return '';if(node.type==='text')return node.text||'';return (node.content||[]).map(text).join('')}
 function collect(node){if(node.type==='heading'){const item={level:Math.max(1,Math.min(6,Number(node.attrs?.level)||1)),title:text(node),bookmark:'ForgeHeading'+(headings.length+1)};headings.push(item);byNode.set(node,item)}for(const child of node.content||[])collect(child)}
 collect(content);let indexes=0;const sources=[];
 const headingName=level=>'Heading_20_'+level;
 function heading(node,style){const item=byNode.get(node);if(!item)return '';usedStyles[item.level-1].add(style);return '<text:bookmark text:name="'+item.bookmark+'"/>'}
 function render(attrs,titleStyle,entryStyle){
  const depth=Math.max(1,Math.min(6,Number(attrs?.depth)||3)),start=Math.max(1,Math.min(depth,Number(attrs?.startDepth)||1));
  const title=String(attrs?.title||'Contents'),name='ForgeContents'+(++indexes),token='<!--ForgeIndexSources'+indexes+'-->';
  sources.push({token,start,depth});
  const templates=Array.from({length:depth-start+1},(_,i)=>{const level=start+i;return '<text:table-of-content-entry-template text:outline-level="'+level+'" text:style-name="'+entryStyle+'"><text:index-entry-text/><text:index-entry-tab-stop style:type="right"/><text:index-entry-page-number/></text:table-of-content-entry-template>'}).join('');
  const entries=headings.filter(item=>item.level>=start&&item.level<=depth).slice(0,500).map(item=>'<text:p text:style-name="'+entryStyle+'"><text:a xlink:href="#'+item.bookmark+'">'+esc(item.title)+'</text:a><text:tab/><text:bookmark-ref text:reference-format="page" text:ref-name="'+item.bookmark+'">1</text:bookmark-ref></text:p>').join('');
  return '<text:table-of-content text:name="'+name+'" text:protected="true"><text:table-of-content-source text:outline-level="'+depth+'" text:use-outline-level="'+(start===1)+'" text:use-index-source-styles="'+(start>1)+'"><text:index-title-template text:style-name="'+titleStyle+'">'+esc(title)+'</text:index-title-template>'+templates+token+'</text:table-of-content-source><text:index-body><text:index-title text:name="'+name+'Title"><text:p text:style-name="'+titleStyle+'">'+esc(title)+'</text:p></text:index-title>'+entries+'</text:index-body></text:table-of-content>';
 }
 function finish(body){for(const {token,start,depth} of sources){const source=start===1?'':Array.from({length:depth-start+1},(_,i)=>{const level=start+i;return '<text:index-source-styles text:outline-level="'+level+'">'+[headingName(level),...usedStyles[level-1]].map(name=>'<text:index-source-style text:style-name="'+name+'"/>').join('')+'</text:index-source-styles>'}).join('');body=body.replace(token,source)}return body}
 const theme=DOCUMENT_STYLES[styleKey(layout.theme)],color=/^#[a-f\d]{6}$/i.test(layout.headingColor||'')?layout.headingColor:'#'+theme.color;
 const namedStyles=Array.from({length:6},(_,i)=>'<style:style style:name="'+headingName(i+1)+'" style:display-name="Heading '+(i+1)+'" style:family="paragraph" style:default-outline-level="'+(i+1)+'"><style:paragraph-properties fo:keep-with-next="always" fo:margin-top="12pt" fo:margin-bottom="6pt"/><style:text-properties fo:font-family="'+esc(theme.headingFont)+'" fo:font-size="'+(theme.sizes[i]||12)+'pt" fo:font-weight="bold" fo:color="'+color+'"/></style:style>').join('');
 return {heading,headingName,render,finish,namedStyles};
}

export function importOdtContents(node,attr,esc){
 const source=[...node.children].find(child=>child.localName==='table-of-content-source');
 if(!source)return null;
 const depth=Math.max(1,Math.min(6,Number(attr(source,'text','outline-level'))||3));
 const levels=[...source.children].filter(child=>child.localName==='index-source-styles').map(child=>Number(attr(child,'text','outline-level'))).filter(level=>level>=1&&level<=depth);
 const start=attr(source,'text','use-outline-level')==='false'&&levels.length?Math.min(...levels):1;
 const title=[...source.children].find(child=>child.localName==='index-title-template')?.textContent||'Contents';
 return '<div data-forge-toc="true" data-toc-title="'+esc(title)+'" data-toc-depth="'+depth+'" data-toc-start="'+start+'"></div>';
}
