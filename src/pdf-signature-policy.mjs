import {PDFDocument,PDFDict,PDFArray,PDFName,PDFNumber,PDFString,PDFHexString,PDFRef,PDFNull,PDFRawStream} from 'pdf-lib';
import {verifyPDFSignatureIntegrity,signatureRange,binaryBytes} from './pdf-signature-integrity.mjs';
import {hasXFA} from './pdf-form-kind.mjs';
const key=value=>PDFName.of(value),label=value=>value instanceof PDFString||value instanceof PDFHexString?value.decodeText():null;
export function pdfSigningFields(pdf){
 const form=pdf.context.lookup(pdf.catalog.get(key('AcroForm'))),roots=form?.lookupMaybe?.(key('Fields'),PDFArray),fields=[],nodes=[],names=new Set(),seen=new Set();
 function visit(raw,prefix,type,flags,parent,depth){
  const dict=pdf.context.lookup(raw);if(!(dict instanceof PDFDict)||seen.has(dict))throw Error('PDF fields contain invalid or repeated field dictionaries.');seen.add(dict);if(seen.size>2000||depth>64)throw Error('Signing supports up to 2,000 field nodes and 64 field levels.');
  const declaredParent=dict.get(key('Parent'));if(declaredParent&&pdf.context.lookup(declaredParent)!==parent)throw Error('PDF field parent links are inconsistent.');
  const partial=label(dict.lookup(key('T'))),name=partial!==null?(prefix?prefix+'.':'')+partial:prefix,ownType=dict.lookupMaybe(key('FT'),PDFName),ownFlags=dict.lookupMaybe(key('Ff'),PDFNumber);type=ownType?.decodeText()||type;flags=ownFlags?.asNumber()??flags;
  if(!Number.isSafeInteger(flags)||flags<0||flags>4294967295||name.length>500)throw Error('Unsupported PDF field flags or name.');if(partial!==null)names.add(name);
  const children=dict.lookupMaybe(key('Kids'),PDFArray),childFields=children?Array.from({length:children.size()},(_,i)=>pdf.context.lookup(children.get(i))).filter(child=>child instanceof PDFDict&&(child.has(key('T'))||child.has(key('FT'))&&child.lookupMaybe(key('Subtype'),PDFName)?.decodeText()!=='Widget')):[];
  nodes.push({dict,raw,name,type});
  if(type&&!childFields.length&&(partial!==null||!parent)){
   if(fields.some(field=>field.name===name))throw Error('PDF field names are ambiguous.');
   const widgets=[];if(dict.lookupMaybe(key('Subtype'),PDFName)?.decodeText()==='Widget')widgets.push({dict,raw});if(children)for(let i=0;i<children.size();i++){const raw=children.get(i),child=pdf.context.lookup(raw);if(child instanceof PDFDict&&child.lookupMaybe(key('Subtype'),PDFName)?.decodeText()==='Widget'&&!child.has(key('T')))widgets.push({dict:child,raw})}
   const value=dict.lookup(key('V'));fields.push({name,type,flags,dict,ref:raw instanceof PDFRef?raw:null,widgets,value:value===PDFNull?undefined:value});
  }
  if(children)for(let i=0;i<children.size();i++)visit(children.get(i),name,type,flags,dict,depth+1);
 }
 if(roots)for(let i=0;i<roots.size();i++)visit(roots.get(i),'',null,0,null,0);if(fields.length>1000)throw Error('Signing is limited to 1,000 fields.');return {form,roots,fields,nodes,names};
}
export function normalizeFieldLock(value,names){
 if(!value)return null;const action=value.action;if(!['All','Include','Exclude'].includes(action))throw Error('Choose a supported field-lock action.');
 if(action!=='All'&&!Array.isArray(value.fields))throw Error('Choose the PDF fields to lock.');const fields=action==='All'?[]:[...new Set(value.fields)].sort();if(fields.length>1000||action!=='All'&&!fields.length||fields.some(name=>typeof name!=='string'||!name.length||name.length>500||names&&!names.has(name)))throw Error('Field locks must name existing PDF fields.');
 const permission=value.permission??null;if(permission!==null&&![1,2,3].includes(permission))throw Error('Unsupported field-lock permission level.');return {action,fields,...(permission!==null?{permission}:{})};
}
function lockDictionary(dict,names){
 if(!(dict instanceof PDFDict))throw Error('Invalid PDF field-lock policy.');const action=dict.lookupMaybe(key('Action'),PDFName)?.decodeText(),raw=dict.lookupMaybe(key('Fields'),PDFArray),fields=raw?Array.from({length:raw.size()},(_,i)=>label(raw.lookup(i))):[];
 const permission=dict.lookupMaybe(key('P'),PDFNumber)?.asNumber();return normalizeFieldLock({action,fields,...(permission!==undefined?{permission}:{})},names);
}
export const fieldIsLocked=(name,locks)=>locks.some(lock=>lock.action==='All'||(lock.action==='Include')===lock.fields.some(parent=>name===parent||name.startsWith(parent+'.')));
function signedPolicies(pdf,signature,metadata){
 const references=signature.lookupMaybe(key('Reference'),PDFArray),locks=[];let permission=null;
 if(references){if(references.size()>10)throw Error('Too many signature permission transforms.');for(let i=0;i<references.size();i++){
  const reference=references.lookup(i,PDFDict),method=reference.lookupMaybe(key('TransformMethod'),PDFName)?.decodeText(),params=reference.lookupMaybe(key('TransformParams'),PDFDict),version=params?.lookupMaybe(key('V'),PDFName)?.decodeText();if(!params||version&&version!=='1.2')throw Error('Unsupported signature permission transform.');
  if(method==='DocMDP'){const p=params.lookupMaybe(key('P'),PDFNumber)?.asNumber()??2;if(permission!==null||![1,2,3].includes(p))throw Error('Invalid document certification permissions.');const certified=pdf.context.lookup(pdf.context.lookup(pdf.catalog.get(key('Perms')))?.get?.(key('DocMDP')));if(certified!==signature)throw Error('The certification reference does not match the signed catalog.');permission=p}
  else if(method==='FieldMDP')locks.push(lockDictionary(params,metadata.names));else throw Error('This signature uses an unsupported permission transform.');
 }}
 for(const field of metadata.fields)if(field.value===signature&&field.dict.has(key('Lock')))locks.push(lockDictionary(field.dict.lookup(key('Lock')),metadata.names));
 return {permission,locks};
}
export const signatureSlotLock=(field,names)=>field.dict.has(key('Lock'))?lockDictionary(field.dict.lookup(key('Lock')),names):null;
const signatureObjects=pdf=>[...pdf.context.enumerateIndirectObjects()].map(([,object])=>object).filter(object=>object instanceof PDFDict&&object.has(key('ByteRange'))&&object.has(key('Contents')));
function dictionaryText(dict,omit=[]){return dict.entries().filter(([name])=>!omit.includes(name.decodeText())).map(([name,value])=>[name.toString(),value.toString()]).sort((a,b)=>a[0].localeCompare(b[0])).map(pair=>pair.join(':')).join('|')}
function protectedRevisionUnchanged(original,current,certified){
 const before=pdfSigningFields(original),after=pdfSigningFields(current),excluded=new Set(),add=raw=>{if(raw instanceof PDFRef)excluded.add(raw.toString())};
 add(original.context.trailerInfo.Root);add(original.catalog.get(key('AcroForm')));add(before.form?.get(key('Fields')));
 const originalRoots=before.roots?Array.from({length:before.roots.size()},(_,i)=>before.roots.get(i).toString()):[],currentRoots=after.roots?Array.from({length:after.roots.size()},(_,i)=>after.roots.get(i).toString()):[];
 if(JSON.stringify(currentRoots.slice(0,originalRoots.length))!==JSON.stringify(originalRoots))throw Error('The signed root field array changed.');
 for(const extra of currentRoots.slice(originalRoots.length))if(certified||!after.fields.some(field=>field.type==='Sig'&&field.ref?.toString()===extra))throw Error('This document has unsupported root field additions.');
 if(dictionaryText(original.catalog,['AcroForm'])!==dictionaryText(current.catalog,['AcroForm']))throw Error('The signed catalog has unsupported changes.');
 if(dictionaryText(before.form||original.context.obj({}),['Fields','SigFlags'])!==dictionaryText(after.form||current.context.obj({}),['Fields','SigFlags']))throw Error('The signed form configuration has unsupported changes.');

 for(const field of before.fields){
  const other=after.fields.find(candidate=>candidate.name===field.name);if(!other||field.type!==other.type||field.ref?.toString()!==other.ref?.toString())throw Error('The signed field tree has unsupported changes.');
  if(field.type!=='Sig')continue;if(field.value&&field.dict.get(key('V'))?.toString()!==other.dict.get(key('V'))?.toString())throw Error('An existing signature field was replaced or cleared.');add(field.ref);const omit=['V','AP','AS'];if(!field.dict.has(key('Lock'))&&other.value)omit.push('Lock');if(dictionaryText(field.dict,omit)!==dictionaryText(other.dict,omit))throw Error('A signature slot has unsupported changes.');
  if(field.widgets.length!==other.widgets.length)throw Error('A signature widget changed after signing.');for(const widget of field.widgets){const target=other.widgets.find(candidate=>candidate.raw.toString()===widget.raw.toString());if(!target||dictionaryText(widget.dict,['V','AP','AS',...(!widget.dict.has(key('Lock'))&&target.dict.has(key('V'))?['Lock']:[])])!==dictionaryText(target.dict,['V','AP','AS',...(!widget.dict.has(key('Lock'))&&target.dict.has(key('V'))?['Lock']:[])]))throw Error('A signature widget has unsupported changes.');add(widget.raw);}
 }
 for(const field of after.fields)if(!before.fields.some(old=>old.name===field.name)){if(certified||field.type!=='Sig')throw Error('This signed document has unsupported new fields.');}
 const oldOrder=before.fields.map(field=>field.name),currentOldOrder=after.fields.filter(field=>oldOrder.includes(field.name)).map(field=>field.name);if(JSON.stringify(oldOrder)!==JSON.stringify(currentOldOrder))throw Error('The signed field order changed.');
 for(const [ref,object]of original.context.enumerateIndirectObjects()){if(excluded.has(ref.toString()))continue;const next=current.context.lookup(ref);if(!next||object.toString()!==next.toString())throw Error('This signed revision contains changes beyond supported approval signatures.');}
}
export async function inspectPDFSignaturePolicy(bytes,{pdf=null,onProgress=()=>{}}={}){
 pdf??=await PDFDocument.load(bytes,{updateMetadata:false});if(pdf.isEncrypted||hasXFA(pdf))throw Error('Signature policies require an unlocked standard PDF.');const metadata=pdfSigningFields(pdf);for(const field of metadata.fields)if(field.type==='Sig'&&field.value&&(!(field.value instanceof PDFDict)||!field.value.has(key('ByteRange'))||!field.value.has(key('Contents'))))throw Error('An existing signature field contains an unsupported signature.');const source=binaryBytes(bytes),ranges=new Map();
 for(const signature of signatureObjects(pdf)){const range=signatureRange(signature);ranges.set(range.join(','),range)}
 const pattern=/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;let match,count=0;
 while((match=pattern.exec(source))){if(++count>40)throw Error('Too many historical signature byte ranges.');const range=match.slice(1).map(Number);if(range.every(Number.isSafeInteger)&&range[0]===0&&range[1]>0&&range[2]>range[1]&&range[3]>0&&range[2]+range[3]<=bytes.length)ranges.set(range.join(','),range)}
 if(ranges.size>20)throw Error('Signing is limited to 20 existing signatures.');const history=[],locks=[];let permission=null;
 for(const range of [...ranges.values()].sort((a,b)=>a[2]+a[3]-b[2]-b[3])){
  const end=range[2]+range[3],tail=binaryBytes(bytes.subarray(Math.max(0,end-20000),end)),boundary=/startxref\s+([0-9]+)\s+%%EOF\s*$/.exec(tail);if(!boundary||!Number.isSafeInteger(Number(boundary[1]))||Number(boundary[1])>=end)throw Error('A signature does not cover a complete PDF revision.');onProgress({done:history.length,total:ranges.size});const revision=await PDFDocument.load(bytes.subarray(0,end),{updateMetadata:false}),matches=signatureObjects(revision).filter(signature=>signatureRange(signature).join(',')===range.join(','));
  if(matches.length!==1)throw Error('A historical signature is missing or ambiguous in its signed revision.');const integrity=verifyPDFSignatureIntegrity(bytes,matches[0]),signedFields=pdfSigningFields(revision),policies=signedPolicies(revision,matches[0],signedFields);
  if(policies.permission!==null){if(history.length||permission!==null)throw Error('Document certification must be the first signature.');permission=policies.permission}
  locks.push(...policies.locks);for(const lock of policies.locks)if(lock.permission)permission=permission===null?lock.permission:Math.min(permission,lock.permission);
  const bound=signedFields.fields.filter(field=>field.type==='Sig'&&field.value===matches[0]);if(bound.length!==1||!bound[0].name)throw Error('A signature is not bound to one named field in its signed revision.');protectedRevisionUnchanged(revision,pdf,permission!==null);history.push({...integrity,field:bound[0].name,permission:policies.permission});await new Promise(resolve=>setTimeout(resolve,0));
 }
 if(history.length){const end=history.at(-1).revisionEnd,tail=bytes.subarray(end);if(tail.length>1024||tail.some(byte=>![0,9,10,12,13,32].includes(byte)))throw Error('This PDF has unsigned changes after its latest signature.');for(const field of metadata.fields)if(field.type==='Sig'&&field.value&&!history.some(signature=>signature.field===field.name&&signature.range.join(',')===signatureRange(field.value).join(',')))throw Error('An existing signature changed its field binding.')}
 else if(pdf.context.lookup(pdf.catalog.get(key('Perms')))?.has?.(key('DocMDP')))throw Error('The PDF certification signature could not be read.');
 const slots=metadata.fields.filter(field=>field.type==='Sig'&&!field.value).map(field=>({name:field.name,available:!!field.name&&!!field.ref&&!(field.flags&1)&&!fieldIsLocked(field.name,locks)&&permission!==1,reason:!field.name?'Unnamed signature field.':!field.ref?'Direct signature fields are unsupported.':field.flags&1?'Readonly field.':permission===1?'Document permits no changes.':fieldIsLocked(field.name,locks)?'Locked by an earlier signature.':''}));
 return {history,permission,locks,slots,fields:metadata.fields.map(field=>({name:field.name,type:field.type})),metadata};
}
