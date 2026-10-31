import {attachEditableDesigns} from './docx-designs.mjs';
import {formatAttrs,formattingSnapshot,paragraphChangeAttrs} from './format-review.mjs';
export function docxTextColor(value){if(/^#[a-f\d]{6}$/i.test(value||''))return value.slice(1);const match=/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(value||'');return match&&match.slice(1).every(n=>Number(n)<=255)?match.slice(1).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):null}
import {imageExportKey} from './image-shapes.mjs';
import {reviewAttrs} from './review.mjs';
import {sectionAttrs} from './sections.mjs';
import {normalizeScene,sceneKey} from './design-model.mjs';
import {XmlComponent,InsertedTextRun,DeletedTextRun,CommentRangeStart,CommentRangeEnd,CommentReference,SectionType,FootnoteReferenceRun,TableOfContents,Bookmark,Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,ExternalHyperlink,ImageRun,Header,Footer,PageNumber,AlignmentType,BorderStyle,PageOrientation,LevelFormat,HorizontalPositionRelativeFrom,VerticalPositionRelativeFrom,TextWrappingType} from 'docx';
import {noteText,tocDepth} from './references.mjs';
import {DOCUMENT_STYLES} from './document-styles.mjs';
import {normalizeLayout} from './document-model.mjs';
import {normalizeImageDesign,normalizeTableDesign,TABLE_PALETTES,TABLE_PADDING} from './object-design.mjs';
const twips=mm=>Math.round(mm*1440/25.4);
export function docxRunProperties(marks=[],ctx={}){
  let style=marks.find(m=>m.type==='textStyle')?.attrs||{};
  let font=style.fontFamily||ctx.font,size=parseFloat(style.fontSize||String(ctx.defaultSize||12));
  if((style.fontSize||'').endsWith('px'))size*=.75;if(font==='system-ui')font='Arial';
  let props={font:marks.some(m=>m.type==='code')?'Courier New':font,size:Math.max(12,Math.min(192,Math.round(size*2))),bold:ctx.heading||ctx.headerCell||marks.some(m=>m.type==='bold'),italics:marks.some(m=>m.type==='italic'),strike:marks.some(m=>m.type==='strike')};
  if(marks.some(m=>m.type==='superscript'))props.superScript=true;if(marks.some(m=>m.type==='subscript'))props.subScript=true;
  if(marks.some(m=>m.type==='underline'))props.underline={};
  if(marks.some(m=>m.type==='highlight'))props.highlight='yellow';
  if(ctx.defaultColor)props.color=ctx.defaultColor;if(ctx.headerCell)props.color=ctx.headerColor;if(docxTextColor(style.color))props.color=docxTextColor(style.color);
 return props;
}
function runs(nodes=[],ctx){return nodes.flatMap(n=>{
  if(n.type==='commentAnchor'){const entry=ctx.commentRanges.get(reviewAttrs(n.attrs).id);return entry?[new TextRun({children:[new CommentReference(entry.id)]})]:[]}
  if(n.type==='footnote'){const id=++ctx.referenceCounters.noteIndex;ctx.footnotes[id]={children:noteText(n.attrs?.text).split('\n').map(text=>new Paragraph({children:[new TextRun({text,font:ctx.font,size:20})]}))};return [new FootnoteReferenceRun(id)]}
  if(n.type==='hardBreak')return [new TextRun({break:1})];
  if(n.type!=='text')return [];
  const marks=n.marks||[],props={text:n.text,...docxRunProperties(marks,ctx)},format=marks.find(m=>m.type==='formatChange');if(format){const before=formatAttrs(format.attrs);const oldLink=before.before.find(m=>m.type==='link')?.attrs?.href,newLink=formattingSnapshot(marks).find(m=>m.type==='link')?.attrs?.href;if(oldLink!==newLink)throw Error('Accept or reject tracked link-target changes before DOCX export, or use HTML.');props.revision={...docxRunProperties(before.before,ctx),id:ctx.referenceCounters.changeIndex++,author:before.author,date:before.date}}
  if(ctx.code&&/[\n\t]/.test(n.text)){delete props.text;props.children=n.text.split(/([\n\t])/).filter(Boolean).map(part=>part==='\n'?new XmlComponent('w:br'):part==='\t'?new XmlComponent('w:tab'):part)}
  const change=marks.find(m=>m.type==='reviewChange');let run=change?new (change.attrs.kind==='delete'?DeletedTextRun:InsertedTextRun)({...props,id:ctx.referenceCounters.changeIndex++,author:reviewAttrs(change.attrs).author,date:reviewAttrs(change.attrs).date}):new TextRun(props),href=marks.find(m=>m.type==='link')?.attrs?.href;
  let result=/^(https?:|mailto:)/i.test(href||'')&&!change?[new ExternalHyperlink({link:href,children:[run]})]:[run];const comments=marks.filter(m=>m.type==='comment').map(m=>ctx.commentRanges.get(reviewAttrs(m.attrs).id)).filter(Boolean);result=[...comments.filter(c=>c.first===n).map(c=>new CommentRangeStart(c.id)),...result,...comments.filter(c=>c.last===n).flatMap(c=>[new CommentRangeEnd(c.id),new TextRun({children:[new CommentReference(c.id)]})])];return result;
})}
function paragraph(node,ctx,options={}){
  let a=node.attrs||{},line=Number(a.paragraphLine||ctx.layout.line);
  let props={widowControl:a.widowControl!==false,keepNext:node.type==='heading'||a.keepWithNext===true,keepLines:a.keepTogether===true,pageBreakBefore:a.pageBreakBefore===true,children:runs(node.content,{...ctx,heading:node.type==='heading',font:node.type==='heading'?DOCUMENT_STYLES[ctx.layout.theme].headingFont:ctx.font,defaultColor:node.type==='heading'?(ctx.layout.headingColor?.slice(1)||DOCUMENT_STYLES[ctx.layout.theme].color):undefined,defaultSize:node.type==='heading'?(DOCUMENT_STYLES[ctx.layout.theme].sizes[(node.attrs?.level||1)-1]||15):12}),alignment:({left:AlignmentType.LEFT,right:AlignmentType.RIGHT,center:AlignmentType.CENTER,justify:AlignmentType.JUSTIFIED})[a.textAlign]||AlignmentType.LEFT,
    spacing:{after:Math.round(parseFloat(a.paragraphSpacing??'8')*20),line:Math.round(line*240)},indent:{left:Math.min(6,Math.max(0,Number(a.indent||0)))*480},...options};
  if(a.paragraphChange){const change=paragraphChangeAttrs(a.paragraphChange),before=change.before;if(node.type==='heading'&&before.level!==undefined&&before.level!==a.level)throw Error('Accept or reject tracked heading-level changes before DOCX export, or use HTML.');props.revision={id:ctx.referenceCounters.changeIndex++,author:change.author,date:change.date,alignment:({left:AlignmentType.LEFT,right:AlignmentType.RIGHT,center:AlignmentType.CENTER,justify:AlignmentType.JUSTIFIED})[before.textAlign]||AlignmentType.LEFT,spacing:{after:Math.round(parseFloat(before.paragraphSpacing??'8')*20),line:Math.round(Number(before.paragraphLine||ctx.layout.line)*240)},indent:{left:before.indent*480},keepNext:node.type==='heading'||before.keepWithNext,keepLines:before.keepTogether,pageBreakBefore:before.pageBreakBefore,widowControl:before.widowControl}}
  if(node.type==='heading'){props.heading='Heading'+Math.min(6,Math.max(1,a.level||1));props.children=[new Bookmark({id:'sf-heading-'+(++ctx.headingIndex),children:props.children})]}
  if(node.type==='codeBlock'){props.style='ForgeCode';props.children=runs(node.content,{...ctx,font:'Courier New',heading:false,defaultSize:12,code:true})}
  return new Paragraph(props);
}
function blocks(nodes,ctx,list={}){return (nodes||[]).flatMap(node=>{
  switch(node.type){
    case 'paragraph':case 'heading':case 'codeBlock': return [paragraph(node,ctx,list)];
    case 'designCanvas':{const scene=normalizeScene(node.attrs?.scene),image=ctx.images.get(sceneKey(scene));if(!image)throw Error('The design canvas must be rendered before DOCX export.');const width=Math.min(ctx.contentWidth,(ctx.contentHeight-24)*900/scene.height);return [new Paragraph({children:[new ImageRun({type:'png',data:image.data,transformation:{width,height:width*scene.height/900},altText:{title:scene.title,description:scene.description||scene.title,name:'SlateForgeDesign_'+(++ctx.designIndex)}})]})]}
    case 'tableOfContents':return [new Paragraph({children:[new TextRun({text:String(node.attrs?.title||'Contents').slice(0,80),bold:true,size:30})]}),new TableOfContents('Contents',{hyperlink:true,headingStyleRange:'1-'+tocDepth(node.attrs?.depth),cachedEntries:ctx.headings.filter(h=>h.level<=tocDepth(node.attrs?.depth)),beginDirty:true})];
    case 'pageBreak':return [new Paragraph({children:[new TextRun({text:'',break:1})],pageBreakBefore:true})];
    case 'horizontalRule':return [new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'9BAE9C'}},children:[]})];
    case 'blockquote':return blocks(node.content,ctx).map(p=>p instanceof Paragraph?p:new Paragraph({text:'Quotation'}));
    case 'bulletList':case 'orderedList':{
      let level=Math.min(8,list._level||0),reference='ordered-'+ctx.nextList++;
      if(node.type==='orderedList')ctx.numbering.push({reference,levels:Array.from({length:9},(_,i)=>({level:i,format:LevelFormat.DECIMAL,text:'%'+(i+1)+'.',start:node.attrs?.start||1,alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720*(i+1),hanging:360}}}}))});
      return (node.content||[]).flatMap(item=>(item.content||[]).flatMap((child,index)=>{
        if(['bulletList','orderedList'].includes(child.type))return blocks([child],ctx,{_level:level+1});
        return blocks([child],ctx,index===0?(node.type==='bulletList'?{bullet:{level}}:{numbering:{reference,level}}):{});
      }));
    }
    case 'table':{
      const design=normalizeTableDesign(node.attrs),palette=TABLE_PALETTES[design.tablePalette],padding=TABLE_PADDING[design.tableDensity]*15;
      const edge={style:BorderStyle.SINGLE,size:4,color:palette.border},none={style:BorderStyle.NONE,size:0,color:palette.border};
      const borders=design.tableStyle==='grid'?{top:edge,bottom:edge,left:edge,right:edge,insideHorizontal:edge,insideVertical:edge}:design.tableStyle==='striped'?{top:edge,bottom:edge,left:none,right:none,insideHorizontal:edge,insideVertical:none}:{top:none,bottom:none,left:none,right:none,insideHorizontal:none,insideVertical:none};
      const columns=Math.max(1,(node.content?.[0]?.content||[]).reduce((sum,cell)=>sum+(cell.attrs?.colspan||1),0));
      return [new Table({width:{size:100,type:WidthType.PERCENTAGE},borders,rows:(node.content||[]).map((row,index)=>new TableRow({cantSplit:true,tableHeader:(row.content||[]).every(cell=>cell.type==='tableHeader'),children:(row.content||[]).map(cell=>{
        const header=cell.type==='tableHeader',previousHeader=ctx.headerCell,previousHeaderColor=ctx.headerColor;ctx.headerCell=header;ctx.headerColor=palette.accent;const width=ctx.contentWidth;ctx.contentWidth=Math.max(20,width*(cell.attrs?.colspan||1)/columns-2*TABLE_PADDING[design.tableDensity]);const children=blocks(cell.content,ctx);ctx.contentWidth=width;ctx.headerCell=previousHeader;ctx.headerColor=previousHeaderColor;
        let shade=header?palette.tint:design.tableStyle==='striped'&&index%2===1?palette.stripe:undefined;if(design.tableStyle==='minimal')shade=undefined;
        return new TableCell({columnSpan:cell.attrs?.colspan||1,rowSpan:cell.attrs?.rowspan||1,children:children.length?children:[new Paragraph('')],margins:{top:padding,bottom:padding,left:padding,right:padding},shading:shade?{fill:shade}:undefined,borders:design.tableStyle==='minimal'?{top:none,left:none,right:none,bottom:header?{style:BorderStyle.SINGLE,size:12,color:palette.accent}:none}:undefined})
      })}))})];
    }
    case 'image':{
      const match=/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/i.exec(node.attrs?.src||'');
      if(!match)return [new Paragraph({text:'[Image omitted: unsupported source]'})];
      // DOCX supports PNG/JPEG/GIF; WebP needs conversion before export.
      const binary=ctx.images.get(imageExportKey(node.attrs));if(!binary)throw Error('An image could not be decoded for DOCX export.');
      const design=normalizeImageDesign(node.attrs);const width=Math.min(ctx.contentWidth*design.imageWidth/100,(ctx.contentHeight-24)*binary.width/binary.height),height=width*binary.height/binary.width;return [new Paragraph({alignment:({left:AlignmentType.LEFT,center:AlignmentType.CENTER,right:AlignmentType.RIGHT})[design.imageAlign],children:[new ImageRun({type:binary.type,data:binary.data,transformation:{width,height},floating:design.imageWrap!=='none'?{horizontalPosition:{relative:HorizontalPositionRelativeFrom.COLUMN,align:design.imageWrap},verticalPosition:{relative:VerticalPositionRelativeFrom.PARAGRAPH,offset:0},wrap:{type:TextWrappingType.SQUARE},margins:{left:design.imageGap*9525,right:design.imageGap*9525,top:57150,bottom:95250},allowOverlap:false,layoutInCell:true}:undefined,altText:{title:node.attrs.alt||'Image',description:node.attrs.alt||'Image',name:'Image'}})]})];
    }
    default:return blocks(node.content,ctx);
  }
})}
export function buildDocx(content,settings,title,images=new Map()){
  const layout=normalizeLayout(settings),font=layout.font==='system-ui'?'Arial':layout.font;
  const paper=layout.size==='Letter'?[215.9,279.4]:[210,297];const contentWidth=((layout.orientation==='landscape'?paper[1]:paper[0])-2*layout.margin)*96/25.4;const contentHeight=((layout.orientation==='landscape'?paper[0]:paper[1])-2*layout.margin)*96/25.4;const ctx={font,layout,images,contentWidth,contentHeight,numbering:[],nextList:1,referenceCounters:{noteIndex:0,changeIndex:1},comments:[],commentRanges:new Map(),footnotes:{},designIndex:0,headingIndex:0,headings:[]};
  function indexComments(node){const marks=node.type==='commentAnchor'?[{attrs:node.attrs}]:node.type==='text'?(node.marks||[]).filter(m=>m.type==='comment'):[];for(const mark of marks){const a=reviewAttrs(mark.attrs),existing=ctx.commentRanges.get(a.id);if(existing)existing.last=node;else{if(ctx.comments.length>=300)throw Error('DOCX supports up to 300 comments in this export.');const id=ctx.comments.length;ctx.commentRanges.set(a.id,{id,first:node,last:node});ctx.comments.push({id,author:a.author,date:new Date(a.date),resolved:a.resolved,children:a.body.split('\n').map(text=>new Paragraph(text))})}}for(const child of node.content||[])indexComments(child)}indexComments(content);
  function headings(nodes){for(const node of nodes||[]){if(node.type==='heading')ctx.headings.push({title:(node.content||[]).map(n=>n.text||'').join(''),level:node.attrs?.level||1,href:'sf-heading-'+(ctx.headings.length+1)});headings(node.content)}}headings(content.content);
  const sections=[];function section(nodes,attributes={}){const attrs=sectionAttrs({...attributes,orientation:attributes.orientation||layout.orientation,columns:attributes.columns||1});const [pw,ph]=paper;ctx.contentWidth=((attrs.orientation==='landscape'?ph:pw)-2*layout.margin)*96/25.4;ctx.contentHeight=((attrs.orientation==='landscape'?pw:ph)-2*layout.margin)*96/25.4;const children=blocks(nodes,ctx),footerRuns=[new TextRun(attrs.footer||layout.footer)];if(layout.pageNumbers)footerRuns.push(new TextRun('   '),new TextRun({children:[PageNumber.CURRENT]}));sections.push({properties:{type:sections.length?(attrs.pageBreak?SectionType.NEXT_PAGE:SectionType.CONTINUOUS):undefined,column:{count:attrs.columns,space:360},page:{size:{width:twips(pw),height:twips(ph),orientation:attrs.orientation==='landscape'?PageOrientation.LANDSCAPE:PageOrientation.PORTRAIT},margin:{top:twips(layout.margin),bottom:twips(layout.margin),left:twips(layout.margin),right:twips(layout.margin)}}},headers:attrs.header||layout.header?{default:new Header({children:[new Paragraph(attrs.header||layout.header)]})}:undefined,footers:attrs.footer||layout.footer||layout.pageNumbers?{default:new Footer({children:[new Paragraph({children:footerRuns,alignment:AlignmentType.RIGHT})]})}:undefined,children:children.length?children:[new Paragraph('')]})}let buffer=[];for(const node of content.content||[]){if(node.type==='columnSection'){if(buffer.length){section(buffer);buffer=[]}section(node.content,node.attrs)}else buffer.push(node)}if(buffer.length||!sections.length)section(buffer);
  const [width,height]=layout.size==='Letter'?[215.9,279.4]:[210,297];
  const footerRuns=[new TextRun(layout.footer)];if(layout.pageNumbers)footerRuns.push(new TextRun('   '),new TextRun({children:[PageNumber.CURRENT]}));
  return new Document({creator:'Slate Forge',title,description:'Created with Slate Forge',
    comments:{children:ctx.comments},footnotes:ctx.footnotes,features:{updateFields:true,trackRevisions:layout.trackChanges},styles:{paragraphStyles:[{id:'ForgeCode',name:'Slate Forge Code',basedOn:'Normal',run:{font:'Courier New'}}],default:{document:{run:{font,size:24,language:{value:layout.language}},paragraph:{spacing:{line:Math.round(Number(layout.line)*240)}}}}},
    numbering:{config:ctx.numbering},sections});
}
export async function exportDocx(content,settings,title,images,options={}){const blob=await Packer.toBlob(buildDocx(content,settings,title,images));if(options.editableDesigns===false)return blob;const bytes=await attachEditableDesigns(new Uint8Array(await blob.arrayBuffer()),content,options);return new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
