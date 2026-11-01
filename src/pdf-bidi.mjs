import bidiFactory from 'bidi-js';
import {PDFHexString,PDFContentStream,PDFName,PDFDict,PDFArray,setTextMatrix,showText} from 'pdf-lib';
const bidi=bidiFactory(),controls=/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;
const scripts=['Arabic','Hebrew','Devanagari','Bengali','Gurmukhi','Gujarati','Oriya','Tamil','Telugu','Kannada','Malayalam','Sinhala','Thai','Lao','Tibetan','Myanmar','Khmer','Syriac','Thaana','Latin','Greek','Cyrillic','Han','Hiragana','Katakana','Hangul'].map(script=>[script,new RegExp('\\p{Script='+script+'}','u')]);
export const isPDFBidiControl=char=>controls.test(char);
// Runs stay in logical order internally so fontkit can shape Arabic/Indic and
// reverse RTL glyphs itself. Only the order of runs follows UAX #9 levels.
export function pdfTextRuns(value,direction='auto'){const text=String(value);if(text.length>20000)throw Error('PDF text shaping is limited to 20,000 characters per segment.');if(!text)return [];if(/^[\x20-\x7e]*$/.test(text))return [{text,level:0,script:'Latin'}];const embedding=bidi.getEmbeddingLevels(text,direction==='auto'?undefined:direction),result=[];
 for(const paragraph of embedding.paragraphs){const runs=[];let current=null;for(let index=paragraph.start;index<=paragraph.end;){const char=String.fromCodePoint(text.codePointAt(index)),level=embedding.levels[index];index+=char.length;if(isPDFBidiControl(char))continue;const script=scripts.find(([,match])=>match.test(char))?.[0]||null,mirrored=level%2?(bidi.getMirroredCharacter(char)||char):char;if(!current||current.level!==level||script&&current.script&&script!==current.script){current={text:'',level,script};runs.push(current)}else if(script&&!current.script)current.script=script;current.text+=mirrored}
  const levels=runs.map(run=>run.level),max=Math.max(0,...levels),odd=levels.filter(level=>level%2),minimum=odd.length?Math.min(...odd):max+1;
  for(let level=max;level>=minimum;level--){let start=0;while(start<runs.length){if(runs[start].level<level){start++;continue}let end=start+1;while(end<runs.length&&runs[end].level>=level)end++;const reversed=runs.slice(start,end).reverse();runs.splice(start,end-start,...reversed);start=end}}
  result.push(...runs);
 }
 return result;
}
export function bidiPDFFont(font){const wrapped=Object.create(font),encode=font.encodeText.bind(font),width=font.widthOfTextAtSize.bind(font);wrapped.encodeText=text=>PDFHexString.of(pdfTextRuns(text).map(run=>encode(run.text).asString()).join(''));wrapped.widthOfTextAtSize=(text,size)=>pdfTextRuns(text).reduce((sum,run)=>sum+width(run.text,size),0);return wrapped}
const shapedFonts=new WeakMap();
function shape(font,text,encode,direction='auto'){const toolkit=font.embedder?.font;if(typeof toolkit?.layout!=='function')return null;const glyphs=[];let advance=0,positioned=false;for(const run of pdfTextRuns(text,direction)){const layout=toolkit.layout(run.text,font.embedder.fontFeatures),hex=encode?font.encodeText(run.text).asString():null,units=toolkit.unitsPerEm;if(hex&&hex.length!==layout.glyphs.length*4)throw Error('PDF shaping returned inconsistent glyph encoding.');for(let index=0;index<layout.glyphs.length;index++){const position=layout.positions[index],glyph=layout.glyphs[index];if(position.xOffset||position.yOffset||position.yAdvance||Math.abs(position.xAdvance-glyph.advanceWidth)>.01)positioned=true;glyphs.push({hex:hex?.slice(index*4,index*4+4),x:advance+position.xOffset/units,y:position.yOffset/units,width:glyph.advanceWidth/units,space:glyph.codePoints?.includes(32)===true});advance+=position.xAdvance/units}}
 return {glyphs,advance,positioned};
}
export function shapedPDFFont(font){
 const records=new Map();let stored=0;
 function directional(direction){const wrapped=Object.create(font);
  wrapped.encodeText=text=>{const layout=shape(font,text,true,direction);if(!layout)return PDFHexString.of(pdfTextRuns(text,direction).map(run=>font.encodeText(run.text).asString()).join(''));const hex=layout.glyphs.map(glyph=>glyph.hex).join('');if(layout.positioned){if(!records.has(hex)){stored+=layout.glyphs.length;if(stored>50000)throw Error('Positioned PDF text exceeds 50,000 glyphs. Split the export into smaller files.')}records.set(hex,layout)}return PDFHexString.of(hex)};
  wrapped.widthOfTextAtSize=(text,size)=>{const layout=shape(font,text,false,direction);return layout?layout.advance*size:pdfTextRuns(text,direction).reduce((sum,run)=>sum+font.widthOfTextAtSize(run.text,size),0)};
  wrapped.shapeText=text=>shape(font,text,true,direction);
  wrapped.forDirection=value=>directional(['ltr','rtl'].includes(value)?value:'auto');shapedFonts.set(wrapped,records);return wrapped;
 }
 return directional('auto');
}

// Apply fontkit's glyph advances/offsets only to content and appearance streams
// generated in this build. Existing PDF streams are never interpreted here.
export function applyPDFGlyphPositions(pdf,font){const records=shapedFonts.get(font);if(!records?.size)return;const streams=new Map(),ref=font.ref.toString(),resources=stream=>stream.dict.lookupMaybe(PDFName.of('Resources'),PDFDict);
 for(const [,object]of pdf.context.enumerateIndirectObjects())if(object instanceof PDFContentStream)streams.set(object,resources(object));
 for(const page of pdf.getPages()){const raw=page.node.Contents();if(raw instanceof PDFArray)for(let index=0;index<raw.size();index++){const object=raw.lookup(index);if(object instanceof PDFContentStream)streams.set(object,page.node.Resources())}else if(raw instanceof PDFContentStream)streams.set(raw,page.node.Resources())}
 let positioned=0;for(const [stream,resource]of streams){const fonts=resource?.lookupMaybe(PDFName.of('Font'),PDFDict),names=new Set((fonts?.entries()||[]).filter(([,value])=>value.toString()===ref).map(([key])=>key.decodeText()));if(!names.size)continue;const result=[];let matrix=[1,0,0,1,0,0],size=0,leading=0,active=false;const stack=[];
  for(const operator of stream.operators){const args=operator.args,number=index=>args[index]?.asNumber?.()??Number(args[index]);if(operator.name==='BT')matrix=[1,0,0,1,0,0];if(operator.name==='q')stack.push({size,leading,active});if(operator.name==='Q'){const prior=stack.pop();if(prior)({size,leading,active}=prior)}if(operator.name==='Tf'){active=names.has(args[0]?.decodeText?.());size=number(1)}if(operator.name==='TL')leading=number(0);if(operator.name==='Tm')matrix=args.map(arg=>arg.asNumber());if(operator.name==='T*'){matrix[4]-=matrix[2]*leading;matrix[5]-=matrix[3]*leading}if(operator.name==='Td'||operator.name==='TD'){const x=number(0),y=number(1);matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y;if(operator.name==='TD')leading=-y}
   const layout=active&&operator.name==='Tj'&&args[0] instanceof PDFHexString?records.get(args[0].asString()):null;if(layout){positioned+=layout.glyphs.length;if(positioned>50000)throw Error('Positioned PDF text exceeds 50,000 glyphs. Split the export into smaller files.');for(const glyph of layout.glyphs){const x=glyph.x*size,y=glyph.y*size;result.push(setTextMatrix(matrix[0],matrix[1],matrix[2],matrix[3],matrix[4]+matrix[0]*x+matrix[2]*y,matrix[5]+matrix[1]*x+matrix[3]*y),showText(PDFHexString.of(glyph.hex)))}result.push(setTextMatrix(...matrix))}else result.push(operator);
  }
  stream.operators=result;stream.contentsCache?.invalidate?.();
 }
}
