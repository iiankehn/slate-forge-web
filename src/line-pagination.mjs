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
export function textCoordinates(element){
 const owner=element.ownerDocument,range=owner.createRange();
 if(typeof range.getBoundingClientRect!=='function')return null;
 const spans=[],walker=owner.createTreeWalker(element,4);let node,length=0;
 while(node=walker.nextNode()){if(node.length){spans.push({node,from:length,to:length+node.length});length+=node.length}}
 if(!length)return null;const cache=new Map();
 return {length,coords(offset){offset=Math.max(0,Math.min(length-1,offset));if(cache.has(offset))return cache.get(offset);let low=0,high=spans.length-1;while(low<high){const mid=Math.floor((low+high)/2);if(spans[mid].to<=offset)low=mid+1;else high=mid}const span=spans[low];let start=offset-span.from;if(start>0&&/[\uDC00-\uDFFF]/.test(span.node.data[start]))start--;let end=start+1;if(/[\uD800-\uDBFF]/.test(span.node.data[start])&&end<span.node.length)end++;range.setStart(span.node,start);range.setEnd(span.node,end);const rect=range.getBoundingClientRect(),box={top:rect.top,bottom:rect.bottom};if(!Number.isFinite(box.top)||!Number.isFinite(box.bottom)||box.bottom<=box.top)throw Error('Text lines could not be measured for page preview.');cache.set(offset,box);return box}};
}
