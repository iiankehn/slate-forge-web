const marked=new WeakSet(),pattern=Array.from('/ByteRange',char=>char.charCodeAt(0)),space=byte=>[0,9,10,12,13,32].includes(byte);
export function containsPDFSignatureHistory(bytes){
 for(let at=0;at<bytes.length-pattern.length;at++){if(bytes[at]!==47)continue;let same=true;for(let i=1;i<pattern.length;i++)if(bytes[at+i]!==pattern[i]){same=false;break}if(!same)continue;let end=at+pattern.length;while(end<bytes.length&&space(bytes[end]))end++;if(bytes[end++]!==91)continue;while(end<bytes.length&&space(bytes[end]))end++;if(bytes[end]===48)return true}return false;
}
export function markPDFSignatureHistory(pdf,bytes){if(containsPDFSignatureHistory(bytes))marked.add(pdf)}
export const hasMarkedPDFSignatureHistory=pdf=>marked.has(pdf);
