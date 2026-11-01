import {PDFArray,PDFDict,PDFName,PDFRawStream,decodePDFRawStream} from 'pdf-lib';
import {pdfContentTokens} from './pdf-content-tokens.mjs';
export const PDF_TEXT_STREAM_LIMIT=2000000,PDF_FORM_DEPTH=8;
const name=value=>PDFName.of(value),decoded=new WeakMap();
export function pdfPageStreams(page){const raw=page.node.get(name('Contents')),contents=raw&&page.doc.context.lookup(raw);return contents instanceof PDFArray?Array.from({length:contents.size()},(_,index)=>({raw:contents.get(index),stream:contents.lookup(index)})):contents?[{raw,stream:contents}]:[]}
export function pdfStreamContent(stream){
 if(!(stream instanceof PDFRawStream)||stream.dict.has(name('F')))throw Error('This PDF content stream cannot be edited.');
 if(decoded.has(stream))return decoded.get(stream);
 const bytes=decodePDFRawStream(stream).getBytes(PDF_TEXT_STREAM_LIMIT+1);if(bytes.length>PDF_TEXT_STREAM_LIMIT)throw Error('Page content exceeds the 2 MB text-editing stream limit.');
 let source='';for(let index=0;index<bytes.length;index+=16384)source+=String.fromCharCode(...bytes.subarray(index,index+16384));
 const result={source,tokens:pdfContentTokens(source)};decoded.set(stream,result);return result;
}
export const pdfResourceView=resources=>({node:{Resources:()=>resources}});
export function pdfFormTarget(resources,key){
 const objects=resources?.lookupMaybe(name('XObject'),PDFDict),stream=objects?.lookup(name(key));
 if(!stream)throw Error('A referenced PDF page object is missing.');
 if(!(stream instanceof PDFRawStream)||stream.dict.lookupMaybe(name('Subtype'),PDFName)?.decodeText()!=='Form')return null;
 const own=stream.dict.lookupMaybe(name('Resources'),PDFDict);return {stream,resources:own||resources};
}
export function normalizePDFFormPath(value){
 if(value===undefined)return [];if(!Array.isArray(value)||value.length>PDF_FORM_DEPTH)throw Error('PDF text form paths are limited to eight levels.');
 return value.map(step=>{if(!step||typeof step.name!=='string'||!step.name.length||step.name.length>256||/[\u0000-\u001f\u007f]/u.test(step.name)||!Number.isInteger(step.start)||step.start<0||!Number.isInteger(step.end)||step.end<=step.start||step.end>PDF_TEXT_STREAM_LIMIT)throw Error('Invalid PDF text form-object path.');return {name:step.name,start:step.start,end:step.end}});
}
export function pdfTextEditIdentity(edit){const path=edit.path||[];return edit.page+':'+edit.stream+(path.length?':form:'+path.map(step=>step.start+'-'+step.end+'@'+encodeURIComponent(step.name)).join('/'):'')+':'+edit.start}
function copyResources(context,resources){const copy=resources?resources.clone(context):context.obj({});for(const key of ['Font','XObject']){const existing=copy.lookupMaybe(name(key),PDFDict);copy.set(name(key),existing?existing.clone(context):context.obj({}))}return copy}
function streamCopy(pdf,original,source,resources){
 const result=pdf.context.flateStream(Uint8Array.from(source,char=>char.charCodeAt(0)));
 for(const [key,value]of original.dict.entries())if(!['Length','Filter','DecodeParms','Resources'].includes(key.decodeText()))result.dict.set(key,value);
 if(resources)result.dict.set(name('Resources'),resources);return result;
}

// Copy only the selected invocation's branch. Reused forms on other pages or
// elsewhere on the same page retain their original bytes and resource bindings.
export function preparePDFTextPage(pdf,pageIndex,edits,patchText){
 const page=pdf.getPage(pageIndex),entries=pdfPageStreams(page),originalResources=page.node.Resources(),pageResources=copyResources(pdf.context,originalResources),fonts=new WeakMap(),groups=new Map();
 for(const edit of edits){const group=groups.get(edit.stream)||[];group.push(edit);groups.set(edit.stream,group)}
 function rewrite(stream,originalScope,scope,changes,depth){
  if(depth>PDF_FORM_DEPTH)throw Error('PDF text form nesting exceeds eight levels.');
  const {source}=pdfStreamContent(stream),direct=[],children=new Map();
  for(const edit of changes){const path=edit.path||[];if(path.length===depth)direct.push(edit);else{const step=path[depth],key=step.start+':'+step.end+':'+step.name,group=children.get(key)||{step,edits:[]};group.edits.push(edit);children.set(key,group)}}
  function fontResource(font){let registered=fonts.get(scope);if(!registered){registered=new Map();fonts.set(scope,registered)}const id=font.ref.toString();if(!registered.has(id)){const dictionary=scope.lookup(name('Font'),PDFDict),key=dictionary.uniqueKey('SlateForgeEdit');dictionary.set(key,font.ref);registered.set(id,key.toString())}return registered.get(id)}
  const patches=patchText(source,direct,fontResource);
  for(const {step,edits:childEdits}of children.values()){
   const invocation=pdfContentTokens(source.slice(step.start,step.end));if(invocation.length!==2||invocation[0].type!=='name'||invocation[0].value!==step.name||invocation[1].value!=='Do')throw Error('The PDF form invocation no longer matches its source.');
   const child=pdfFormTarget(originalScope,step.name);if(!child)throw Error('A PDF text form no longer matches its source.');
   const childResources=copyResources(pdf.context,child.resources),rewritten=rewrite(child.stream,child.resources,childResources,childEdits,depth+1),clone=streamCopy(pdf,child.stream,rewritten,childResources),ref=pdf.context.register(clone),objects=scope.lookup(name('XObject'),PDFDict),key=objects.uniqueKey('SlateForgeForm');objects.set(key,ref);patches.push({from:step.start,to:step.end,value:key.toString()+' Do'});
  }
  let rewritten=source,last=source.length;
  for(const patch of patches.sort((a,b)=>b.from-a.from)){if(patch.from<0||patch.to>last||patch.to<=patch.from)throw Error('Overlapping PDF text replacement ranges.');rewritten=rewritten.slice(0,patch.from)+patch.value+rewritten.slice(patch.to);last=patch.from}
  if(rewritten.length>PDF_TEXT_STREAM_LIMIT)throw Error('The edited content stream exceeds the 2 MB text-editing limit.');return rewritten;
 }
 const replacements=new Map();
 for(const [index,changes]of groups){const original=entries[index]?.stream;if(!original)throw Error('A PDF content stream no longer matches its source.');const rewritten=rewrite(original,originalResources,pageResources,changes,0);replacements.set(index,streamCopy(pdf,original,rewritten,null))}
 return ()=>{const contents=entries.map((entry,index)=>replacements.has(index)?pdf.context.register(replacements.get(index)):entry.raw);page.node.set(name('Contents'),pdf.context.obj(contents));page.node.set(name('Resources'),pageResources)};
}
