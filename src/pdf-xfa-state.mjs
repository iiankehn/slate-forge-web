export function normalizeXFAValues(value){
 if(value===undefined)return {};if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>1000)throw Error('XFA edits are limited to 1,000 fields.');let total=0;const entries=[];
 for(const [id,data]of Object.entries(value)){
  if(!id.length||id.length>512||/[\u0000-\u001f\u007f]/u.test(id))throw Error('Invalid XFA field identifier.');
  const strings=Array.isArray(data)?data:[data];if(strings.length>100||strings.some(item=>typeof item!=='string'&&typeof item!=='boolean'||typeof item==='string'&&(item.length>4000||/[\u0000\uD800-\uDFFF]/u.test(item))))throw Error('Invalid XFA field value.');
  for(const item of strings)total+=String(item).length;if(total>250000)throw Error('XFA field edits exceed 250,000 characters.');entries.push([id,Array.isArray(data)?[...data]:data]);
 }
 return Object.fromEntries(entries);
}
export function assertXFAFieldOnly(state){
 if(state.annotations?.length||state.textEdits?.length||state.widgetRects?.length||state.font||Object.keys(state.values||{}).length||state.rotations?.some(angle=>angle!==0)||state.order?.some((value,index)=>value!==index))throw Error('XFA documents use their own field editor. Page, text, drawing and ordinary form edits require a standard PDF copy.');
}
