import {fontCSS} from './font-families.mjs';
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
const split=text=>segmenter?[...segmenter.segment(text)].map(item=>item.segment):Array.from(text);
let measuring;
function width(text,size,font,bold,italic){
 if(typeof document!=='undefined'){
  if(measuring===undefined){try{measuring=document.createElement('canvas').getContext('2d')||null}catch{measuring=null}}
  if(measuring){measuring.font=(italic?'italic ':'')+(bold?'bold ':'')+size+'px '+fontCSS(font);return measuring.measureText(text).width}
 }
 return split(text).reduce((sum,char)=>sum+(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(char)?size:size*.56),0);
}
export function layoutDesignText(value,boxWidth,size,font='Arial',bold=false,italic=false){
 const limit=Math.max(1,boxWidth-20),lines=[];
 for(const paragraph of String(value).replace(/\r\n?/g,'\n').split('\n')){
  let line='';
  for(const word of paragraph.split(/\s+/u)){
   if(!word)continue;
   if(line&&width(line+' '+word,size,font,bold,italic)>limit){lines.push(line);line=''}
   if(width(word,size,font,bold,italic)<=limit){line+=(line?' ':'')+word;continue}
   if(line){lines.push(line);line=''}
   for(const character of split(word)){if(line&&width(line+character,size,font,bold,italic)>limit){lines.push(line);line=''}line+=character}
  }
  lines.push(line);if(lines.length>=150)break;
 }
 return lines.slice(0,150);
}
