import {PDFHexString} from 'pdf-lib';
import {pdfParagraphLines} from './pdf-paragraphs.mjs';
import {pdfContentTokens} from './pdf-content-tokens.mjs';
import {pdfFontEncoding,validPDFEditText} from './pdf-font-encoding.mjs';
import {pdfPageStreams,pdfStreamContent,pdfResourceView,pdfFormTarget,normalizePDFFormPath,pdfTextEditIdentity,preparePDFTextPage,PDF_TEXT_STREAM_LIMIT,PDF_FORM_DEPTH} from './pdf-content-forms.mjs';
export {pdfContentTokens} from './pdf-content-tokens.mjs';
export {pdfTextEditIdentity} from './pdf-content-forms.mjs';
const MAX_BYTES=PDF_TEXT_STREAM_LIMIT,MAX_ITEMS=300;

export function editablePDFText(pdf,pageIndex){
 const page=pdf.getPage(pageIndex),items=[],skipped=new Set(),entries=pdfPageStreams(page);let limited=false,reason='',visits=0,bytes=0;
 if(entries.length>50)return {items,limited:true,reason:'Too many content streams for existing-text editing.'};
 function scan(stream,streamIndex,path,resources,state,graphics,ancestors){
  if(path.length>PDF_FORM_DEPTH||++visits>150)throw Error('PDF text form traversal exceeds its depth or object limit.');
  if(ancestors.has(stream))throw Error('A recursive PDF form cannot be listed for text editing.');
  const {source,tokens}=pdfStreamContent(stream);bytes+=source.length;if(bytes>12000000)throw Error('PDF page text traversal exceeds 12 MB.');
  const nextAncestors=new Set(ancestors);nextAncestors.add(stream);const view=pdfResourceView(resources),operands=[];
  for(const token of tokens){
   if(items.length>=MAX_ITEMS){limited=true;reason='Only the first 300 text segments on a page are listed.';break}
   if(token.type!=='operator'){operands.push(token);continue}const operator=token.value;
   if(operator==='BI')throw Error('Inline-image content streams are not supported for existing-text editing.');
   if(operator==='q'){if(graphics.length>=128)throw Error('PDF graphics-state nesting exceeds the text-editing limit.');graphics.push({...state})}
   if(operator==='Q'){const prior=graphics.pop();if(prior){const inText=state.inText;Object.assign(state,prior);state.inText=inText}else state.font=null}
   if(operator==='gs')state.font=null;if(operator==='BT')state.inText=true;if(operator==='ET')state.inText=false;
   if(operator==='Tf'){state.font=operands.at(-2)?.type==='name'?operands.at(-2).value:null;state.fontSize=Number(operands.at(-1)?.value)||0;state.fontScope=view}
   if(operator==='Ts')state.rise=Number(operands.at(-1)?.value)||0;if(operator==='Tc')state.characterSpacing=Number(operands.at(-1)?.value)||0;if(operator==='Tw')state.wordSpacing=Number(operands.at(-1)?.value)||0;
   if(operator===String.fromCharCode(34)){state.wordSpacing=Number(operands.at(-3)?.value)||0;state.characterSpacing=Number(operands.at(-2)?.value)||0}
   if(operator==='Do'&&operands.at(-1)?.type==='name'){
    const key=operands.at(-1).value;
    try{const form=pdfFormTarget(resources,key);if(form)scan(form.stream,streamIndex,[...path,{name:key,start:operands.at(-1).start,end:token.end}],form.resources,{...state,inText:false},[],nextAncestors)}catch(error){skipped.add(error.message)}
   }
   const target=operator==='TJ'?operands.at(-1)?.items:operator==='Tj'||operator===String.fromCharCode(39)||operator===String.fromCharCode(34)?[operands.at(-1)]:[];
   if(state.inText&&state.font&&target?.some(part=>part?.type==='string')){
    let encoding;try{encoding=pdfFontEncoding(state.fontScope||view,state.font)}catch(error){skipped.add(error.message)}
    if(encoding)for(const part of target){
     if(part?.type!=='string')continue;let text;try{text=encoding.decode(part.bytes)}catch(error){skipped.add(error.message);continue}
     if(!text)continue;if(!validPDFEditText(text)){skipped.add('Some text contains unsupported control characters or exceeds 2,000 characters.');continue}
     if(items.length>=MAX_ITEMS){limited=true;reason='Only the first 300 text segments on a page are listed.';break}
     const item={page:pageIndex,stream:streamIndex,start:part.start,end:part.end,text,font:state.font,fontScope:state.fontScope||view,encoding:encoding.kind,characters:encoding.characters,vertical:encoding.vertical,fontSize:state.fontSize,rise:state.rise,characterSpacing:state.characterSpacing,wordSpacing:state.wordSpacing,operator,operatorStart:operands[0]?.start??part.start,operatorEnd:token.end,parts:target,...(path.length?{path}:{}),location:path.map(step=>step.name).join(' → ')};item.id=pdfTextEditIdentity(item);items.push(item);
    }
   }
   operands.length=0;
  }
 }
 const resources=page.node.Resources(),state={font:null,fontSize:0,rise:0,characterSpacing:0,wordSpacing:0,inText:false,fontScope:pdfResourceView(resources)},graphics=[];
 for(const [index,entry]of entries.entries())try{scan(entry.stream,index,[],resources,state,graphics,new Set())}catch(error){skipped.add(error.message);state.font=null;state.inText=false}
 if(skipped.size){limited=true;reason=[reason,...skipped].filter(Boolean).join(' ')}return {items,limited,reason};
}

export function normalizePDFTextEdits(value,count){
 if(value===undefined)return [];if(!Array.isArray(value)||value.length>200)throw Error('Existing PDF text edits are limited to 200 segments.');const seen=new Set();
 return value.map(edit=>{
  if(!edit||!Number.isInteger(edit.page)||edit.page<0||edit.page>=count||!Number.isInteger(edit.stream)||edit.stream<0||edit.stream>=50||!Number.isInteger(edit.start)||edit.start<0||!Number.isInteger(edit.end)||edit.end<=edit.start||edit.end>MAX_BYTES||!validPDFEditText(edit.before)||!validPDFEditText(edit.fontMode==='local'&&edit.wrap===true?(typeof edit.text==='string'?edit.text.replaceAll(String.fromCharCode(10),''):edit.text):edit.text))throw Error('An existing PDF text edit is invalid or uses unsupported characters.');
  if(edit.size!==undefined&&(!Number.isFinite(edit.size)||edit.size<1||edit.size>200)||edit.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(edit.color))throw Error('An existing PDF text replacement has invalid typography.');
  const path=normalizePDFFormPath(edit.path),wrap=edit.fontMode==='local'&&edit.wrap===true;
  if(wrap&&(path.length||!Number.isFinite(edit.width)||edit.width<20||edit.width>2000||!Number.isFinite(edit.lineHeight)||edit.lineHeight<1||edit.lineHeight>3||!Number.isFinite(edit.paragraphSpacing)||edit.paragraphSpacing<0||edit.paragraphSpacing>144))throw Error('Wrapped replacements require page-stream text, a width of 20–2,000 points and supported paragraph spacing.');
  if(wrap&&edit.text.length>2000)throw Error('Wrapped replacement text exceeds 2,000 characters.');
  const id=pdfTextEditIdentity({...edit,path});if(seen.has(id))throw Error('An existing PDF text segment has duplicate edits.');seen.add(id);
  return {page:edit.page,stream:edit.stream,start:edit.start,end:edit.end,before:edit.before,text:edit.text,...(path.length?{path}:{}),...(edit.fontMode==='local'?{fontMode:'local',...(wrap?{wrap:true,width:edit.width,lineHeight:edit.lineHeight,paragraphSpacing:edit.paragraphSpacing}:{}),...(edit.size!==undefined?{size:edit.size}:{}),...(edit.color?{color:edit.color}:{})}:{})};
 });
}
const decimal=value=>{if(!Number.isFinite(value)||Math.abs(value)>100000000)throw Error('PDF text positioning exceeds the supported range.');return String(Math.round(value*1000000)/1000000)};
function shapedReplacement(font,text,item,resource,budget,{rewind=false}={}){
 if(!font)throw Error('Keep a local font selected for these replacements, or restore their original segments.');
 if(item.vertical)throw Error('Local-font replacement of vertical PDF text is not supported.');
 if(item.fontSize<=0||item.fontSize>1000)throw Error('This PDF text size is not supported for font replacement.');
 const layout=font.shapeText?.(text);if(!layout)throw Error('Choose a supported local TrueType or OpenType font for this replacement.');
 budget.glyphs+=layout.glyphs.length;if(budget.glyphs>50000)throw Error('Existing-text font replacement exceeds 50,000 glyphs.');
 const operators=['q',resource+' '+decimal(item.fontSize)+' Tf','0 Tc','0 Tw'];let cursor=0,extra=0,activeRise=null,run=[];
 if(item.color){const components=[1,3,5].map(offset=>decimal(parseInt(item.color.slice(offset,offset+2),16)/255)).join(' ');operators.push(components+' rg',components+' RG')}
 function flush(){if(run.length){operators.push('['+run.join(' ')+'] TJ');run=[]}}
 function glyphHex(value){if(run.at(-1)?.startsWith('<'))run[run.length-1]=run.at(-1).slice(0,-1)+value+'>';else run.push('<'+value+'>')}
 for(const glyph of layout.glyphs){
  const x=glyph.x+extra,delta=x-cursor,nextRise=item.rise+glyph.y*item.fontSize;
  if(nextRise!==activeRise){flush();operators.push(decimal(nextRise)+' Ts');activeRise=nextRise}
  if(Math.abs(delta)>.0000001)run.push(decimal(-delta*1000));glyphHex(glyph.hex);cursor=x+glyph.width;
  extra+=item.characterSpacing/item.fontSize+(glyph.space?item.wordSpacing/item.fontSize:0);
 }
 const end=layout.advance+extra;if(Math.abs(end-cursor)>.0000001)run.push(decimal((cursor-end)*1000));if(rewind)run.push(decimal(end*1000));flush();operators.push('Q');return operators.join(String.fromCharCode(10));
}
function wrappedReplacement(font,edit,item,resource,budget){
 const size=edit.size??item.fontSize,lines=pdfParagraphLines(edit.text,font,size,edit.width);if(lines.length>100)throw Error('This replacement needs more than 100 lines. Widen its box or reduce the text size.');
 const operators=[];let offset=0,firstAdvance=0;
 for(const [index,line]of lines.entries()){
  const directional=font.forDirection?.(line.direction)||font;
  if(index===0)firstAdvance=directional.widthOfTextAtSize(line.text,size)/size;
  if(line.text)operators.push(shapedReplacement(directional,line.text,{...item,fontSize:size,rise:item.rise-offset,color:edit.color,characterSpacing:0,wordSpacing:0},resource,budget,{rewind:true}));
  offset+=size*edit.lineHeight+(line.last?edit.paragraphSpacing:0);
 }
 // Return subsequent source operators to the end of the first replacement
 // line. The original text-line matrix and surrounding graphics state survive.
 if(firstAdvance)operators.push('q',resource+' '+decimal(size)+' Tf','['+decimal(-firstAdvance*1000)+'] TJ','Q');
 return operators.join(String.fromCharCode(10));
}
export function applyPDFTextEdits(pdf,edits,{font:replacementFont=null}={}){
 const pages=new Map(),availablePages=new Map(),budget={glyphs:0};
 for(const edit of edits){
  let available=availablePages.get(edit.page);if(!available){available=new Map(editablePDFText(pdf,edit.page).items.map(item=>[item.id,item]));availablePages.set(edit.page,available)}
  const item=available.get(pdfTextEditIdentity(edit));if(!item||item.end!==edit.end||item.text!==edit.before)throw Error('An existing PDF text edit no longer matches its source. Reopen the original PDF.');
  const group=pages.get(edit.page)||[];group.push({...edit,item});pages.set(edit.page,group);
 }
 function patchesFor(source,group,fontResource){
  const operators=new Map(),patches=[];
  for(const edit of group){const changes=operators.get(edit.item.operatorStart)||[];changes.push(edit);operators.set(edit.item.operatorStart,changes)}
  for(const changes of operators.values()){
   const item=changes[0].item;
   if(!changes.some(edit=>edit.fontMode==='local')){
    for(const edit of changes){if(edit.text===edit.before)continue;const token=pdfContentTokens(source.slice(edit.start,edit.end));if(token.length!==1||token[0].type!=='string')throw Error('An existing PDF text source token is invalid.');patches.push({from:edit.start,to:edit.end,value:'<'+pdfFontEncoding(item.fontScope,item.font).encode(edit.text,token[0].bytes)+'>'})}continue;
   }
   if(!replacementFont)throw Error('Choose a local PDF font before applying these replacements.');
   const changesByStart=new Map(changes.map(edit=>[edit.start,edit])),output=[];
   if(item.operator===String.fromCharCode(39))output.push('T*');if(item.operator===String.fromCharCode(34))output.push(decimal(item.wordSpacing)+' Tw',decimal(item.characterSpacing)+' Tc','T*');
   for(const part of item.parts){
    if(part.type==='number'){output.push('['+part.value+'] TJ');continue}if(part.type!=='string')throw Error('Unsupported PDF text-array operand.');const edit=changesByStart.get(part.start);
    if(edit?.fontMode==='local'){const resource=fontResource(replacementFont),replacement=edit.wrap?wrappedReplacement(replacementFont,edit,item,resource,budget):shapedReplacement(replacementFont,edit.text,{...item,fontSize:edit.size??item.fontSize,color:edit.color},resource,budget);output.push('/Span << /ActualText '+PDFHexString.fromText(edit.text).toString()+' >> BDC',replacement,'EMC');}
    else{const encoded=edit&&edit.text!==edit.before?pdfFontEncoding(item.fontScope,item.font).encode(edit.text,part.bytes):Array.from(part.bytes,byte=>byte.toString(16).padStart(2,'0')).join('');output.push('<'+encoded+'> Tj')}
   }
   patches.push({from:item.operatorStart,to:item.operatorEnd,value:output.join(String.fromCharCode(10))});
  }
  return patches;
 }
 const commits=[];for(const [page,group]of pages)commits.push(preparePDFTextPage(pdf,page,group,patchesFor));for(const commit of commits)commit();
}
