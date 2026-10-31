// A break is legal only when no cell from an earlier row spans across it.
// Groups use half-open row indexes, allowing the same plan in editor and preview.
export function rowSpanGroups(spans) {
 const groups=[];
 for(let from=0;from<spans.length;){
  let to=from+1;
  for(let row=from;row<to;row++)for(const value of spans[row]){
   const length=Math.max(1,Math.trunc(Number(value))||1);
   to=Math.min(spans.length,Math.max(to,row+length));
  }
  groups.push({from,to});from=to;
 }
 return groups;
}
