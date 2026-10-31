export const PDF_FONT_LIMIT=10000000;
export function normalizePDFFont(value){
 if(value==null)return null;
 if(typeof value!=='object'||typeof value.data!=='string'||value.data.length>Math.ceil(PDF_FONT_LIMIT/3)*4)throw Error('PDF font exceeds 10 MB or is invalid.');
 let binary;try{binary=atob(value.data)}catch{throw Error('Invalid PDF font encoding.')}
 if(binary.length<12||binary.length>PDF_FONT_LIMIT||!['\x00\x01\x00\x00','OTTO','true'].includes(binary.slice(0,4)))throw Error('Choose a TrueType or OpenType font under 10 MB.');
 return {name:String(value.name||'Custom font').slice(0,180),data:value.data};
}
export function encodePDFFont(bytes,name){let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return normalizePDFFont({name,data:btoa(binary)})}
export function decodePDFFont(value){return Uint8Array.from(atob(normalizePDFFont(value).data),c=>c.charCodeAt(0))}
