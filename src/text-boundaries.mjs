const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
export function graphemeRange(value,offset){
 const text=String(value),position=Math.max(0,Math.min(text.length,Math.trunc(Number(offset)||0)));
 if(position===text.length)return {from:position,to:position};
 if(segmenter){const segment=segmenter.segment(text).containing(position);return {from:segment.index,to:segment.index+segment.segment.length}}
 let from=position;if(from&&/[\uDC00-\uDFFF]/u.test(text[from]))from--;let to=from+1;if(/[\uD800-\uDBFF]/u.test(text[from])&&to<text.length)to++;while(to<text.length&&/\p{M}/u.test(text[to]))to++;return {from,to};
}
export const graphemeBoundary=(text,offset)=>graphemeRange(text,offset).from;
