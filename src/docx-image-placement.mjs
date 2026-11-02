import {imagePlacement} from './image-placement.mjs';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main',WP='http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
export function wordPageImages(xml){
 const result=new WeakMap(),first=(node,name)=>node?.getElementsByTagNameNS(WP,name)[0];
 for(const drawing of xml.getElementsByTagNameNS(W,'drawing')){
  const name=first(drawing,'docPr')?.getAttribute('name')||'';const match=/^SlateForgePageImage(?:_(overlay|both|left|right|block)(?:_gap(\d{1,2}))?)?$/.exec(name);if(!match)continue;const anchor=first(drawing,'anchor'),horizontal=first(anchor,'positionH'),vertical=first(anchor,'positionV'),extent=first(anchor,'extent');
  if(!anchor||horizontal?.getAttribute('relativeFrom')!=='page'||vertical?.getAttribute('relativeFrom')!=='page'||['1','true'].includes(anchor.getAttribute('behindDoc')))continue;
  const x=Number(first(horizontal,'posOffset')?.textContent),y=Number(first(vertical,'posOffset')?.textContent),width=Number(extent?.getAttribute('cx'));if(![x,y,width].every(Number.isFinite)||x<0||y<0||width<=0)continue;
  let run=drawing.parentElement;while(run&&!(run.namespaceURI===W&&run.localName==='r'))run=run.parentElement;if(!run||run.getElementsByTagNameNS(W,'drawing').length!==1||run.getElementsByTagNameNS(W,'t').length)continue;
  result.set(run,{...imagePlacement({imagePlacement:'page',imagePageFlow:match[1],imageX:x/36000,imageY:y/36000,imagePageWidth:width/36000}),imageGap:match[2]===undefined?18:Math.min(48,Number(match[2]))});
 }
 return result;
}
