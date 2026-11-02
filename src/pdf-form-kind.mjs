import {hasMarkedPDFSignatureHistory} from './pdf-signature-history.mjs';
import {PDFName,PDFDict,PDFArray,PDFNull} from 'pdf-lib';
const name=value=>PDFName.of(value);
export const hasXFA=pdf=>pdf.context.lookup(pdf.catalog.get(name('AcroForm')))?.has?.(name('XFA'))===true;
// Inspect fields without calling getForm(), which can remove the XFA entry.
export function hasPDFSignature(pdf){
 if(hasMarkedPDFSignatureHistory(pdf))return true;for(const [,object]of pdf.context.enumerateIndirectObjects())if(object instanceof PDFDict&&object.has(name('ByteRange'))&&object.has(name('Contents')))return true;
 if(pdf.context.lookup(pdf.catalog.get(name('Perms')))?.has?.(name('DocMDP')))return true;
 const form=pdf.context.lookup(pdf.catalog.get(name('AcroForm'))),fields=form?.lookupMaybe?.(name('Fields'),PDFArray);if(!fields)return false;
 const seen=new Set();let count=0;
 function visit(field,inherited,depth){if(!(field instanceof PDFDict)||seen.has(field))return false;if(++count>10000||depth>64)throw Error('PDF field nesting exceeds supported limits.');seen.add(field);const type=field.lookupMaybe(name('FT'),PDFName)||inherited;if(type?.decodeText()==='Sig'){const value=field.lookup(name('V'));if(value&&value!==PDFNull)return true;}const children=field.lookupMaybe(name('Kids'),PDFArray);if(children)for(let i=0;i<children.size();i++)if(visit(children.lookup(i),type,depth+1))return true;return false}
 for(let i=0;i<fields.size();i++)if(visit(fields.lookup(i),null,0))return true;return false;
}
