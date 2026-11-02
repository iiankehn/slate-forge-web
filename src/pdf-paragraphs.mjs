import {resolveTextDirection} from './text-direction.mjs';

export function pdfParagraphStyle(value={}){
 return {paragraph:value.paragraph===true,align:['left','center','right','start','end'].includes(value.align)?value.align:'start',direction:['ltr','rtl'].includes(value.direction)?value.direction:'auto',lineHeight:Math.max(1,Math.min(3,Number(value.lineHeight)||1.2)),paragraphSpacing:Math.max(0,Math.min(144,Number(value.paragraphSpacing)||0))};
}
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
const graphemes=text=>segmenter?[...segmenter.segment(text)].map(item=>item.segment):Array.from(text);
export function pdfParagraphLines(text,baseFont,size,width,direction='auto'){
 const lines=[];
 for(const paragraph of String(text).replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n')){
  const resolved=resolveTextDirection(paragraph,direction),font=baseFont.forDirection?.(resolved)||baseFont;
  let line='';const tokens=paragraph.match(/\s+|\S+/gu)||[];
  for(const token of tokens){
   if(font.widthOfTextAtSize(line+token,size)<=width){line+=token;continue}
   if(line.trim()){lines.push({text:line.trimEnd(),last:false,direction:resolved});line=''}
   if(!token.trim())continue;
   for(const char of graphemes(token)){
    if(line&&font.widthOfTextAtSize(line+char,size)>width){lines.push({text:line,last:false,direction:resolved});line=''}
    line+=char;
   }
  }
  lines.push({text:line.trimEnd(),last:true,direction:resolved});
 }
 return lines;
}

export function drawPDFParagraph(page,annotation,baseFont,options){
 const style=pdfParagraphStyle(annotation),width=annotation.width,size=annotation.size;
 const lines=pdfParagraphLines(annotation.text,baseFont,size,width,style.direction),radians=annotation.angle*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians);
 let offsetY=0;
 for(const line of lines){
  const direction=line.direction,font=baseFont.forDirection?.(direction)||baseFont;
  const measure=font.widthOfTextAtSize(line.text,size),align=style.align==='start'?(direction==='rtl'?'right':'left'):style.align==='end'?(direction==='rtl'?'left':'right'):style.align;
  const offsetX=align==='right'?Math.max(0,width-measure):align==='center'?Math.max(0,(width-measure)/2):0;
  const draw=(text,x)=>page.drawText(text,{...options,font,size,x:annotation.x+cos*x+sin*offsetY,y:annotation.y+sin*x-cos*offsetY});
  if(line.text)draw(line.text,offsetX);
  offsetY+=size*style.lineHeight+(line.last?style.paragraphSpacing:0);
 }
}
