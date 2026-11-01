import {PDFArray,PDFName,PDFRawStream,decodePDFRawStream} from 'pdf-lib';
import {pdfContentTokens} from './pdf-content-tokens.mjs';
import {pdfFontEncoding,validPDFEditText} from './pdf-font-encoding.mjs';
export {pdfContentTokens} from './pdf-content-tokens.mjs';
const MAX_BYTES=2000000,MAX_ITEMS=300,name=value=>PDFName.of(value);
function streams(page){const raw=page.node.get(name('Contents')),contents=raw&&page.doc.context.lookup(raw);return contents instanceof PDFArray?Array.from({length:contents.size()},(_,index)=>({raw:contents.get(index),stream:contents.lookup(index)})):contents?[{raw,stream:contents}]:[]}
function sourceText(stream){if(!(stream instanceof PDFRawStream))throw Error('This content stream cannot be edited.');const bytes=decodePDFRawStream(stream).getBytes(MAX_BYTES+1);if(bytes.length>MAX_BYTES)throw Error('Page content exceeds the text-editing size limit.');let source='';for(let i=0;i<bytes.length;i+=16384)source+=String.fromCharCode(...bytes.subarray(i,i+16384));return source}

export function editablePDFText(pdf,pageIndex){
 const page=pdf.getPage(pageIndex),items=[],skipped=new Set();let limited=false,reason='',font=null,fontSize=0,rise=0,characterSpacing=0,wordSpacing=0,inText=false;const graphics=[],entries=streams(page);
 if(entries.length>50)return {items,limited:true,reason:'Too many content streams for existing-text editing.'};
 try{
  for(const [streamIndex,entry]of entries.entries()){
   const source=sourceText(entry.stream),tokens=pdfContentTokens(source),operands=[];
   for(const token of tokens){
    if(token.type!=='operator'){operands.push(token);continue}const operator=token.value;
    if(operator==='BI')throw Error('Inline-image content streams are not supported for existing-text editing.');
    if(operator==='q')graphics.push({font,fontSize,rise,characterSpacing,wordSpacing});
    if(operator==='Q'){const prior=graphics.pop();if(prior)({font,fontSize,rise,characterSpacing,wordSpacing}=prior);else font=null;}
    if(operator==='gs')font=null;if(operator==='BT')inText=true;if(operator==='ET')inText=false;
    if(operator==='Tf'){font=operands.at(-2)?.type==='name'?operands.at(-2).value:null;fontSize=Number(operands.at(-1)?.value)||0}
    if(operator==='Ts')rise=Number(operands.at(-1)?.value)||0;
    if(operator==='Tc')characterSpacing=Number(operands.at(-1)?.value)||0;
    if(operator==='Tw')wordSpacing=Number(operands.at(-1)?.value)||0;
    if(operator===String.fromCharCode(34)){wordSpacing=Number(operands.at(-3)?.value)||0;characterSpacing=Number(operands.at(-2)?.value)||0}
    const target=operator==='TJ'?operands.at(-1)?.items:operator==='Tj'||operator===String.fromCharCode(39)||operator===String.fromCharCode(34)?[operands.at(-1)]:[];
    if(inText&&font&&target?.some(part=>part?.type==='string')){
     let encoding;try{encoding=pdfFontEncoding(page,font)}catch(error){skipped.add(error.message)}
     if(encoding)for(const part of target){
      if(part?.type!=='string')continue;let text;
      try{text=encoding.decode(part.bytes)}catch(error){skipped.add(error.message);continue}
      if(!text)continue;if(!validPDFEditText(text)){skipped.add('Some text contains unsupported control characters or exceeds 2,000 characters.');continue}
      if(items.length>=MAX_ITEMS){limited=true;reason='Only the first 300 text segments on a page are listed.';break}
      items.push({id:pageIndex+':'+streamIndex+':'+part.start,page:pageIndex,stream:streamIndex,start:part.start,end:part.end,text,font,encoding:encoding.kind,characters:encoding.characters,vertical:encoding.vertical,fontSize,rise,characterSpacing,wordSpacing,operator,operatorStart:operands[0]?.start??part.start,operatorEnd:token.end,parts:target});
     }
    }
    operands.length=0;
   }
  }
 }catch(error){return {items:[],limited:true,reason:error.message}}
 if(skipped.size){limited=true;reason=[reason,...skipped].filter(Boolean).join(' ')}
 return {items,limited,reason};
}

export function normalizePDFTextEdits(value,count){
 if(value===undefined)return [];if(!Array.isArray(value)||value.length>200)throw Error('Existing PDF text edits are limited to 200 segments.');const seen=new Set();
 return value.map(edit=>{
  if(!edit||!Number.isInteger(edit.page)||edit.page<0||edit.page>=count||!Number.isInteger(edit.stream)||edit.stream<0||edit.stream>=50||!Number.isInteger(edit.start)||edit.start<0||!Number.isInteger(edit.end)||edit.end<=edit.start||edit.end>MAX_BYTES||!validPDFEditText(edit.before)||!validPDFEditText(edit.text))throw Error('An existing PDF text edit is invalid or uses unsupported characters.');
  if(edit.size!==undefined&&(!Number.isFinite(edit.size)||edit.size<1||edit.size>200)||edit.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(edit.color))throw Error('An existing PDF text replacement has invalid typography.');
  const id=edit.page+':'+edit.stream+':'+edit.start;if(seen.has(id))throw Error('An existing PDF text segment has duplicate edits.');seen.add(id);
  return {page:edit.page,stream:edit.stream,start:edit.start,end:edit.end,before:edit.before,text:edit.text,...(edit.fontMode==='local'?{fontMode:'local',...(edit.size!==undefined?{size:edit.size}:{}),...(edit.color?{color:edit.color}:{})}:{})};
 });
}
const decimal=value=>{if(!Number.isFinite(value)||Math.abs(value)>100000000)throw Error('PDF text positioning exceeds the supported range.');return String(Math.round(value*1000000)/1000000)};
function shapedReplacement(font,text,item,resource,budget){
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
 const end=layout.advance+extra;if(Math.abs(end-cursor)>.0000001)run.push(decimal((cursor-end)*1000));flush();operators.push('Q');return operators.join(String.fromCharCode(10));
}
export function applyPDFTextEdits(pdf,edits,{font:replacementFont=null}={}){
 const groups=new Map(),pages=new Map(),resources=new Map(),budget={glyphs:0};
 for(const edit of edits){
  let available=pages.get(edit.page);if(!available){available=new Map(editablePDFText(pdf,edit.page).items.map(item=>[item.id,item]));pages.set(edit.page,available)}
  const item=available.get(edit.page+':'+edit.stream+':'+edit.start);if(!item||item.end!==edit.end||item.text!==edit.before)throw Error('An existing PDF text edit no longer matches its source. Reopen the original PDF.');
  const key=edit.page+':'+edit.stream,group=groups.get(key)||[];group.push({...edit,item});groups.set(key,group);
 }
 const replacements=[];
 for(const group of groups.values()){
  const first=group[0],page=pdf.getPage(first.page),entries=streams(page),entry=entries[first.stream],source=sourceText(entry.stream),operators=new Map(),patches=[];
  for(const edit of group){const changes=operators.get(edit.item.operatorStart)||[];changes.push(edit);operators.set(edit.item.operatorStart,changes)}
  for(const changes of operators.values()){
   const item=changes[0].item;
   if(!changes.some(edit=>edit.fontMode==='local')){
    for(const edit of changes){if(edit.text===edit.before)continue;const token=pdfContentTokens(source.slice(edit.start,edit.end));if(token.length!==1||token[0].type!=='string')throw Error('An existing PDF text source token is invalid.');patches.push({from:edit.start,to:edit.end,value:'<'+pdfFontEncoding(page,item.font).encode(edit.text,token[0].bytes)+'>'})}
    continue;
   }
   if(!replacementFont)throw Error('Choose a local PDF font before applying these replacements.');
   const changesByStart=new Map(changes.map(edit=>[edit.start,edit])),output=[];
   if(item.operator===String.fromCharCode(39))output.push('T*');if(item.operator===String.fromCharCode(34))output.push(decimal(item.wordSpacing)+' Tw',decimal(item.characterSpacing)+' Tc','T*');
   for(const part of item.parts){
    if(part.type==='number'){output.push('['+part.value+'] TJ');continue}if(part.type!=='string')throw Error('Unsupported PDF text-array operand.');
    const edit=changesByStart.get(part.start);
    if(edit?.fontMode==='local'){
     if(!resources.has(page))resources.set(page,page.node.newFontDictionary('SlateForgeEdit',replacementFont.ref).toString());
     output.push(shapedReplacement(replacementFont,edit.text,{...item,fontSize:edit.size??item.fontSize,color:edit.color},resources.get(page),budget));
    }else{const encoded=edit&&edit.text!==edit.before?pdfFontEncoding(page,item.font).encode(edit.text,part.bytes):Array.from(part.bytes,byte=>byte.toString(16).padStart(2,'0')).join('');output.push('<'+encoded+'> Tj')}
   }
   patches.push({from:item.operatorStart,to:item.operatorEnd,value:output.join(String.fromCharCode(10))});
  }
  let rewritten=source;for(const patch of patches.sort((a,b)=>b.from-a.from))rewritten=rewritten.slice(0,patch.from)+patch.value+rewritten.slice(patch.to);
  if(rewritten.length>MAX_BYTES)throw Error('The edited content stream exceeds the 2 MB text-editing limit.');replacements.push({page,stream:first.stream,source:rewritten});
 }
 for(const {page,stream,source}of replacements){const entries=streams(page),bytes=Uint8Array.from(source,char=>char.charCodeAt(0)),replacement=pdf.context.register(pdf.context.flateStream(bytes));entries[stream]={raw:replacement};page.node.set(name('Contents'),pdf.context.obj(entries.map(item=>item.raw)))}
}
