import {graphemeRange} from './text-boundaries.mjs';
// Bounded line-boundary searches shared by live editing and measured preview.
// Positions must be monotonic in visual line order, as in ordinary text flow.
export function lineStart(from,pos,coords){
 const top=coords(pos).top;let low=from,high=pos;
 while(low<high){const mid=Math.floor((low+high)/2);if(coords(mid).top<top-.5)low=mid+1;else high=mid}
 return low;
}
export function nextLineStart(from,to,coords){
 const top=coords(from).top;let low=from+1,high=to+1;
 while(low<high){const mid=Math.floor((low+high)/2);if(coords(mid).top<=top+.5)low=mid+1;else high=mid}
 return low;
}
export function firstLinesBottom(from,to,coords,count=2){
 let start=from;for(let i=1;i<count;i++){const next=nextLineStart(start,to,coords);if(next>to)break;start=next}
 return coords(start).bottom;
}

export function firstBalancedLinesBottom(from,to,coords){
 let start=from;for(let i=1;i<4;i++){const next=nextLineStart(start,to,coords);if(next>to)return coords(to).bottom;start=next}
 return firstLinesBottom(from,to,coords);
}
// Leave at least two lines on each side. Returning `from` requests moving
// this remaining paragraph intact; callers handle impossible page capacity.
export function balanceLineBreak(from,to,cut,coords){
 if(cut<=from||cut>to)return cut;
 let balanced=lineStart(from,cut,coords);if(balanced===from)return from;
 if(lineStart(balanced,to,coords)===balanced)balanced=lineStart(from,balanced-1,coords);
 const second=nextLineStart(from,to,coords);
 return balanced<=second?from:balanced;
}
// Preview offsets refer to UTF-16 text, matching splitTextBlock. A one-character
// Range measures the following glyph rather than the preceding caret line.
export function textCoordinates(element,{columnRoot=null}={}){
 const owner=element.ownerDocument,range=owner.createRange();
 if(typeof range.getBoundingClientRect!=='function')return null;
 const spans=[],walker=owner.createTreeWalker(element,4);let node,length=0;
 while(node=walker.nextNode()){if(node.length){spans.push({node,from:length,to:length+node.length});length+=node.length}}
 if(!length)return null;const cache=new Map(),text=element.textContent;
 const rootBox=columnRoot?.getBoundingClientRect(),computed=columnRoot?owner.defaultView.getComputedStyle(columnRoot):null,columnCount=Math.max(1,Number.parseInt(computed?.columnCount)||1),gap=Number.parseFloat(computed?.columnGap)||0,columnWidth=columnRoot?(columnRoot.clientWidth-gap*(columnCount-1))/columnCount:0,columnHeight=columnRoot?.clientHeight||0;
 function locate(offset,end=false){let low=0,high=spans.length-1;while(low<high){const mid=Math.floor((low+high)/2);if(end?spans[mid].to<offset:spans[mid].to<=offset)low=mid+1;else high=mid}return spans[low]}
 return {length,coords(offset){
  offset=Math.max(0,Math.min(length-1,offset));if(cache.has(offset))return cache.get(offset);
  const glyph=graphemeRange(text,offset),first=locate(glyph.from),last=locate(glyph.to,true);range.setStart(first.node,glyph.from-first.from);range.setEnd(last.node,glyph.to-last.from);
  const rect=range.getBoundingClientRect();let top=rect.top,bottom=rect.bottom;
  if(columnRoot&&columnCount>1&&columnWidth>0&&columnHeight>0){const center=(rect.left+rect.right)/2,fromEdge=computed.direction==='rtl'?rootBox.right-center:center-rootBox.left,column=Math.max(0,Math.floor(fromEdge/(columnWidth+gap)));top=column*columnHeight+rect.top-rootBox.top;bottom=column*columnHeight+rect.bottom-rootBox.top}
  const box={top,bottom};if(!Number.isFinite(box.top)||!Number.isFinite(box.bottom)||box.bottom<=box.top)throw Error('Text lines could not be measured for page preview.');cache.set(offset,box);return box;
 }};
}
