const TEXT='urn:oasis:names:tc:opendocument:xmlns:text:1.0',OFFICE='urn:oasis:names:tc:opendocument:xmlns:office:1.0';
const names=new Set(['change','change-start','change-end']);
// Validate every marker before a reader consumes any subset of revisions.
export function collectOdtChangeMarkers(root,records){
 const byKey=new Map(),ordered=[],starts=new Map(),ends=new Map();let visited=0,active=null;
 function walk(node,depth=0){
  if(++visited>100000||depth>100)throw Error('ODT structural revisions exceed complexity limits.');
  if(node.nodeType!==1)return;
  if(node.namespaceURI===TEXT&&node.localName==='tracked-changes'||node.namespaceURI===OFFICE&&['annotation','annotation-end'].includes(node.localName))return;
  if(node.namespaceURI===TEXT&&names.has(node.localName)){
   if(node.childNodes.length)throw Error('ODT revision markers must be empty.');
   const key=node.getAttributeNS(TEXT,'change-id');if(!records.has(key))throw Error('An ODT text revision references a missing change definition.');
   if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(node);const at=ordered.length;ordered.push(node);
   if(node.localName==='change-start'){if(active)throw Error('Overlapping or repeated ODT text revision ranges are unsupported.');active=key;starts.set(key,at)}
   else if(node.localName==='change-end'){if(active!==key)throw Error('ODT text revision ranges must be balanced within one paragraph or a supported whole-paragraph range.');active=null;ends.set(key,at)}
   else if(active)throw Error('Nested or repeated ODT deletion markers are unsupported.');
   return;
  }
  for(const child of node.children)walk(child,depth+1);
 }
 walk(root);if(active)throw Error('An ODT insertion has no matching end marker.');
 return {byKey,ordered,starts,ends,visited};
}
