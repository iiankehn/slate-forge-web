import {PDFString,PDFHexString} from 'pdf-lib';
const decodeName=text=>text.replace(/#([a-f\d]{2})/ig,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
export function pdfContentTokens(source){let at=0,count=0;const white=c=>/[\s\x00]/.test(c||'');function token(depth=0){if(depth>16)throw Error('PDF content nesting exceeds the text-editing limit.');while(at<source.length){if(white(source[at])){at++;continue}if(source[at]==='%'){while(at<source.length&&!/[\r\n]/.test(source[at]))at++;continue}break}if(at>=source.length)return null;if(++count>100000)throw Error('PDF content exceeds the text-editing operation limit.');const start=at,c=source[at++];
  if(c==='('){let nesting=1;while(at<source.length&&nesting){const next=source[at++];if(next==='\\'){if(source[at]==='\r'&&source[at+1]==='\n')at+=2;else at++}else if(next==='(')nesting++;else if(next===')')nesting--;if(nesting>16)throw Error('PDF text-string nesting exceeds the limit.')}if(nesting)throw Error('Unterminated PDF string.');const raw=source.slice(start+1,at-1);return {type:'string',start,end:at,bytes:PDFString.of(raw).asBytes()}}
  if(c==='<'&&source[at]!=='<'){while(at<source.length&&source[at]!=='>')at++;if(at>=source.length)throw Error('Unterminated PDF hex string.');const raw=source.slice(start+1,at++).replace(/\s/g,'');if(!/^[a-f\d]*$/i.test(raw))throw Error('Invalid PDF hex string.');return {type:'string',start,end:at,bytes:PDFHexString.of(raw).asBytes()}}
  if(c==='['){const items=[];while(at<source.length){const item=token(depth+1);if(item?.type==='closeArray')return {type:'array',start,end:at,items};if(!item)break;items.push(item)}throw Error('Unterminated PDF text array.')}
  if(c===']')return {type:'closeArray',start,end:at};
  if(c==='<'&&source[at]==='<'){at++;return {type:'dictionary',start,end:at}}if(c==='>'&&source[at]==='>'){at++;return {type:'dictionaryEnd',start,end:at}}
  while(at<source.length&&!white(source[at])&&!/[()[\]<>/%]/.test(source[at]))at++;
  if(c==='/'){while(at<source.length&&!white(source[at])&&!/[()[\]<>/%]/.test(source[at]))at++;return {type:'name',value:decodeName(source.slice(start+1,at)),start,end:at}}
  const value=source.slice(start,at);return {type:/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)?'number':'operator',value,start,end:at};
 }const result=[];while(at<source.length){const item=token();if(item)result.push(item)}return result}
