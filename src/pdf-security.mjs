import {containsPDFSignatureHistory} from './pdf-signature-history.mjs';
import {PDFDocument,PDFName,PDFString,PDFHexString,PDFDict,PDFArray,PDFStream,PDFWriter,PDFInvalidObject,PDFNull} from '@cantoo/pdf-lib';
function checkBytes(bytes){if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>40000000)throw Error('PDF security operations are limited to 40 MB.')}
function checkUnsigned(pdf,bytes){
 if(containsPDFSignatureHistory(bytes))throw Error('Changing encryption would invalidate PDF signature history. Use an unsigned copy.');
 const key=value=>PDFName.of(value),form=pdf.context.lookup(pdf.catalog.get(key('AcroForm'))),fields=form?.lookupMaybe?.(key('Fields'),PDFArray),seen=new Set();let count=0;
 if(pdf.context.lookup(pdf.catalog.get(key('Perms')))?.has?.(key('DocMDP')))throw Error('Changing encryption would invalidate this PDF certification. Use an unsigned copy.');
 function visit(field,inherited,depth){if(!(field instanceof PDFDict)||seen.has(field))return;seen.add(field);if(++count>10000||depth>64)throw Error('PDF field nesting exceeds supported limits.');const type=field.lookupMaybe(key('FT'),PDFName)||inherited;if(type?.decodeText()==='Sig'){const value=field.lookup(key('V'));if(value&&value!==PDFNull)throw Error('Changing encryption would invalidate this PDF signature. Use an unsigned copy.');}const children=field.lookupMaybe(key('Kids'),PDFArray);if(children)for(let index=0;index<children.size();index++)visit(children.lookup(index),type,depth+1)}
 if(fields)for(let index=0;index<fields.size();index++)visit(fields.lookup(index),null,0);
}

export async function protectPDF(bytes,password){
 checkBytes(bytes);if(typeof password!=='string'||password.length<12||new TextEncoder().encode(password).length>127)throw Error('Use a PDF password of at least 12 characters and no more than 127 UTF-8 bytes.');
 const pdf=await PDFDocument.load(bytes,{updateMetadata:false,preserveXFA:true});checkUnsigned(pdf,bytes);pdf.encrypt({userPassword:password,ownerPassword:password,algorithm:'AES-256'});await pdf.flush();
 // The pinned writer encrypts streams, but does not encrypt standalone string
 // objects or strings in dictionaries. Encrypt those with the same per-object
 // transform before its non-object-stream save. Clone direct containers so
 // shared dictionaries cannot be encrypted twice under different references.
 const context=pdf.context,security=context.security;
 for(const [ref,object]of context.enumerateIndirectObjects()){
  if(ref===context.trailerInfo.Encrypt)continue;if(object instanceof PDFInvalidObject)throw Error('PDF contains an unparsed object and cannot be encrypted safely.');const encrypt=security.getEncryptFn(ref.objectNumber,ref.generationNumber);
  function strings(value,depth=0){if(depth>100)throw Error('PDF dictionaries are too deeply nested to encrypt safely.');
   if(value instanceof PDFString||value instanceof PDFHexString)return PDFHexString.fromBytes(encrypt(value.asBytes()));
   if(value instanceof PDFStream){const copy=value.clone(context);copy.dict=strings(value.dict,depth+1);return copy}
   if(value instanceof PDFDict){const copy=value.clone(context);for(const [name,entry]of value.entries())copy.set(name,strings(entry,depth+1));return copy}
   if(value instanceof PDFArray){const copy=PDFArray.withContext(context);for(let i=0;i<value.size();i++)copy.push(strings(value.get(i),depth+1));return copy}return value;
  }
  context.assign(ref,strings(object));
 }
 return PDFWriter.forContext(context,50).serializeToBuffer();
}
export async function unlockPDF(bytes,password){
 checkBytes(bytes);if(typeof password!=='string'||new TextEncoder().encode(password).length>127)throw Error('Enter the PDF password, up to 127 UTF-8 bytes.');
 let pdf;try{pdf=await PDFDocument.load(bytes,{password,updateMetadata:false,preserveXFA:true})}catch{throw Error('PDF could not be unlocked. Check its password and encryption format.')}
 checkUnsigned(pdf,bytes);return pdf.save({useObjectStreams:false,updateFieldAppearances:false});
}
