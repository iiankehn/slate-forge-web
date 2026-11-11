// Group paths run from outermost to innermost. Legacy single groups remain valid.
export const MAX_GROUP_DEPTH=8;
const valid=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(id);
export function objectGroupPath(object){
 if(!valid(object?.group))return [];
 const path=object.groupPath;
 return Array.isArray(path)&&path.length>1&&path.length<=MAX_GROUP_DEPTH&&path[0]===object.group&&path.every(valid)&&new Set(path).size===path.length?[...path]:[object.group];
}
export function groupFields(path){return {group:path[0]||'',...(path.length>1?{groupPath:[...path]}:{groupPath:undefined})}}
// A depth-first tree must preserve the existing paint order. Reopened or
// reparented IDs would require moving layers, so refuse them rather than sort.
export function orderedGroupTree(items,pathFor=objectGroupPath){
 const root={children:[]},stack=[root],active=[],seen=new Set();
 for(const item of items){const path=pathFor(item);let common=0;while(common<active.length&&common<path.length&&active[common]===path[common])common++;
  stack.length=common+1;active.length=common;
  for(let i=common;i<path.length;i++){const id=path[i];if(seen.has(id))throw Error('Native groups require adjacent layers and consistent nested membership.');seen.add(id);if(seen.size>100)throw Error('Native canvases support up to 100 groups.');const node={id,children:[]};stack.at(-1).children.push(node);stack.push(node);active.push(id)}
  stack.at(-1).children.push({item});
 }return root.children;
}
export function nestSelectedGroups(objects,ids,id){
 const chosen=new Set(ids),members=objects.filter(o=>chosen.has(o.id));
 if(members.some(o=>objectGroupPath(o).length>=MAX_GROUP_DEPTH))throw Error('Canvas groups support up to eight nested levels.');
 return objects.map(o=>chosen.has(o.id)?{...o,...groupFields([id,...objectGroupPath(o)])}:o);
}
export function ungroupSelected(objects,ids){const chosen=new Set(ids);return objects.map(o=>chosen.has(o.id)?{...o,...groupFields(objectGroupPath(o).slice(1))}:o)}
export function remapObjectGroups(object,groups,makeId){const path=objectGroupPath(object).map(id=>{if(!groups.has(id))groups.set(id,makeId());return groups.get(id)});return {...object,...groupFields(path)}}
