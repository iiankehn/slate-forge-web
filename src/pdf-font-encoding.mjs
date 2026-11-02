import {PDFDict,PDFName,PDFRawStream,decodePDFRawStream} from 'pdf-lib';
import {pdfContentTokens} from './pdf-content-tokens.mjs';
const MAX_CMAP_BYTES=2000000,MAX_CODES=65536,name=value=>PDFName.of(value),cache=new WeakMap();
const standardFonts=new Set(['Helvetica','Helvetica-Bold','Helvetica-Oblique','Helvetica-BoldOblique','Times-Roman','Times-Bold','Times-Italic','Times-BoldItalic','Courier','Courier-Bold','Courier-Oblique','Courier-BoldOblique']);
export const validPDFEditText=text=>typeof text==='string'&&text.length<=2000&&!/[\u0000-\u001f\u007f-\u009f\uD800-\uDFFF]/u.test(text);
const hex=bytes=>Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
const numeric=bytes=>bytes.reduce((total,value)=>total*256+value,0);
const codeBytes=(number,length)=>{const bytes=new Uint8Array(length);for(let index=length-1;index>=0;index--){bytes[index]=number%256;number=Math.floor(number/256)}if(number)throw Error('PDF character code exceeds its range.');return bytes};
function unicode(bytes){if(!bytes.length||bytes.length%2||bytes.length>128)throw Error('Unsupported PDF Unicode mapping.');return new TextDecoder('utf-16be',{fatal:true}).decode(bytes)}
function increment(bytes,offset){const result=bytes.slice();let carry=offset;for(let index=result.length-1;index>=0&&carry;index--){const next=result[index]+carry;result[index]=next%256;carry=Math.floor(next/256)}if(carry)throw Error('PDF Unicode range exceeds its destination.');return result}

export function readPDFUnicodeMap(source){
 const tokens=pdfContentTokens(source),map=new Map(),spaces=[];
 const add=(code,value)=>{if(!code.length||code.length>4)throw Error('Unsupported PDF character-code width.');const key=hex(code),text=unicode(value);if(map.has(key)&&map.get(key)!==text)throw Error('Conflicting PDF Unicode mapping.');map.set(key,text);if(map.size>MAX_CODES)throw Error('PDF Unicode map exceeds 65,536 codes.')};
 for(let index=0;index<tokens.length;index++){
  const token=tokens[index];if(token.type!=='operator')continue;
  if(token.value==='usecmap')throw Error('Inherited PDF Unicode maps need a replacement font.');
  if(!['beginbfchar','beginbfrange','begincodespacerange'].includes(token.value))continue;
  const count=Number(tokens[index-1]?.value);if(!Number.isInteger(count)||count<0||count>MAX_CODES)throw Error('Invalid PDF Unicode map count.');
  const take=()=>{const next=tokens[++index];if(!next)throw Error('Incomplete PDF Unicode map.');return next};
  for(let entry=0;entry<count;entry++){
   const first=take();if(first.type!=='string'||first.bytes.length<1||first.bytes.length>4)throw Error('Invalid PDF Unicode source code.');
   if(token.value==='beginbfchar'){const target=take();if(target.type!=='string')throw Error('Invalid PDF Unicode destination.');add(first.bytes,target.bytes);continue}
   const last=take();if(last.type!=='string'||last.bytes.length!==first.bytes.length)throw Error('Invalid PDF character range.');const from=numeric(first.bytes),to=numeric(last.bytes);if(to<from)throw Error('Reversed PDF character range.');
   if(token.value==='begincodespacerange'){if(spaces.length>=100)throw Error('Too many PDF character-code ranges.');spaces.push({length:first.bytes.length,from,to});continue}
   if(to-from+1>MAX_CODES)throw Error('PDF Unicode range exceeds 65,536 codes.');
   const target=take();if(target.type==='array'&&target.items.length!==to-from+1)throw Error('PDF Unicode destination count does not match its range.');
   for(let value=from;value<=to;value++){const destination=target.type==='array'?target.items[value-from]:target;if(destination.type!=='string')throw Error('Invalid PDF Unicode range destination.');add(codeBytes(value,first.bytes.length),target.type==='array'?destination.bytes:increment(destination.bytes,value-from))}
  }
  const end=take(),expected=token.value.replace('begin','end');if(end.type!=='operator'||end.value!==expected)throw Error('Unterminated PDF Unicode map block.');
 }
 if(!map.size)throw Error('PDF font has no usable Unicode map.');
 const lengths=[...new Set([...map.keys()].map(key=>key.length/2))].sort((a,b)=>b-a),inverse=new Map();
 for(const [code,text]of map){const choices=inverse.get(text)||[];choices.push(code);inverse.set(text,choices)}
 const alternatives=new Map();for(const text of inverse.keys()){if(!text)continue;const first=String.fromCodePoint(text.codePointAt(0)),values=alternatives.get(first)||[];values.push(text);alternatives.set(first,values)}for(const values of alternatives.values())values.sort((a,b)=>b.length-a.length);
 const inSpace=bytes=>!spaces.length||spaces.some(range=>range.length===bytes.length&&numeric(bytes)>=range.from&&numeric(bytes)<=range.to);
 return {
  kind:'mapped',characters:inverse.size,
  decode(bytes){let text='',at=0;while(at<bytes.length){const matches=[];for(const length of lengths){if(at+length>bytes.length)continue;const code=bytes.subarray(at,at+length),key=hex(code);if(inSpace(code)&&map.has(key))matches.push({length,text:map.get(key)})}if(matches.length!==1)throw Error('PDF text has missing or ambiguous Unicode character codes.');text+=matches[0].text;at+=matches[0].length;if(text.length>2000)throw Error('PDF text segment exceeds 2,000 characters.')}return text},
  encode(text,original=new Uint8Array()){
   if(/[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Thai}\p{Script=Myanmar}\p{Script=Khmer}\p{Script=Syriac}\p{M}\u200c\u200d]/u.test(text))throw Error('This replacement requires text shaping. Choose a local replacement font.');
   const preferred=new Map();let offset=0;
   while(offset<original.length){let found=false;for(const length of lengths){const code=original.subarray(offset,offset+length),key=hex(code);if(code.length===length&&inSpace(code)&&map.has(key)){preferred.set(map.get(key),key);offset+=length;found=true;break}}if(!found)break}
   let encoded='',at=0;
   while(at<text.length){const first=String.fromCodePoint(text.codePointAt(at)),match=alternatives.get(first)?.find(candidate=>text.startsWith(candidate,at));if(!match)throw Error('The existing PDF font does not contain '+first+'. Choose a local replacement font.');encoded+=preferred.get(match)||inverse.get(match)[0];at+=match.length}
   return encoded;
  }
 };
}

export function pdfFontEncoding(page,key){
 const fonts=page.node.Resources()?.lookupMaybe(name('Font'),PDFDict),font=fonts?.lookupMaybe(name(key),PDFDict);if(!font)throw Error('The PDF text font is missing.');if(cache.has(font)){const result=cache.get(font);if(result instanceof Error)throw result;return result}
 try{
  const unicodeMap=font.lookup(name('ToUnicode'));let result;
  if(unicodeMap){if(!(unicodeMap instanceof PDFRawStream))throw Error('Unsupported PDF Unicode map stream.');const bytes=decodePDFRawStream(unicodeMap).getBytes(MAX_CMAP_BYTES+1);if(bytes.length>MAX_CMAP_BYTES)throw Error('PDF Unicode map exceeds 2 MB.');let source='';for(let i=0;i<bytes.length;i+=16384)source+=String.fromCharCode(...bytes.subarray(i,i+16384));result=readPDFUnicodeMap(source)}
  else{
   const base=font.lookupMaybe(name('BaseFont'),PDFName)?.decodeText(),subtype=font.lookupMaybe(name('Subtype'),PDFName)?.decodeText(),encoding=font.lookup(name('Encoding'));
   if(subtype!=='Type1'||!standardFonts.has(base)||font.has(name('FontDescriptor'))||encoding&&(!(encoding instanceof PDFName)||!['WinAnsiEncoding','StandardEncoding'].includes(encoding.decodeText())))throw Error('This font needs a Unicode map or a local replacement font.');
   const winAnsi=encoding instanceof PDFName&&encoding.decodeText()==='WinAnsiEncoding',decoder=new TextDecoder('windows-1252'),inverse=new Map();for(let byte=32;byte<=(winAnsi?255:126);byte++){const char=winAnsi?decoder.decode(Uint8Array.of(byte)):String.fromCharCode(byte);if(validPDFEditText(char))inverse.set(char,byte)}
   result={kind:winAnsi?'winansi':'standard',characters:inverse.size,decode(bytes){let text='';for(const byte of bytes){const char=winAnsi?decoder.decode(Uint8Array.of(byte)):String.fromCharCode(byte);if(!inverse.has(char))throw Error('Unsupported PDF text character.');text+=char}return text},encode(text){return Array.from(text,char=>{const byte=inverse.get(char);if(byte===undefined)throw Error('The existing PDF font cannot encode '+char+'. Choose a local replacement font.');return byte.toString(16).padStart(2,'0')}).join('')}};
  }
  const sourceEncoding=font.lookup(name('Encoding'));let vertical=sourceEncoding instanceof PDFName&&sourceEncoding.decodeText().endsWith('-V');
  if(sourceEncoding instanceof PDFRawStream){const bytes=decodePDFRawStream(sourceEncoding).getBytes(MAX_CMAP_BYTES+1);if(bytes.length>MAX_CMAP_BYTES)throw Error('PDF character encoding exceeds 2 MB.');let source='';for(let index=0;index<bytes.length;index+=16384)source+=String.fromCharCode(...bytes.subarray(index,index+16384));const tokens=pdfContentTokens(source);vertical=tokens.some((token,index)=>token.type==='name'&&token.value==='WMode'&&tokens[index+1]?.value==='1')}
  result={...result,vertical};cache.set(font,result);return result;
 }catch(error){cache.set(font,error);throw error}
}
