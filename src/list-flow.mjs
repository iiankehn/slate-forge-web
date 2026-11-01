// Fragment list contents without losing nesting, starts, or continuation labels.
export function listFlowUnits(list){
 const units=[];
 for(const [index,item]of [...list.children].entries()){
  if(item.localName!=='li')continue;let first=true;
  for(const child of item.children){
   const pieces=child.matches('ol,ul')?listFlowUnits(child):[child.cloneNode(true)];
   for(const piece of pieces){
    const wrapper=list.cloneNode(false),entry=item.cloneNode(false);if(wrapper.localName==='ol')wrapper.setAttribute('start',String((Number(list.getAttribute('start'))||1)+index));
    if(!first)entry.style.listStyle='none';entry.append(piece);wrapper.append(entry);
    const leaf=listFlowLeaf(wrapper);for(const attr of ['data-keep-together','data-keep-next','data-break-before','data-widow-control'])if(leaf?.hasAttribute(attr))wrapper.setAttribute(attr,leaf.getAttribute(attr));
    if(leaf?.matches('h1,h2,h3,h4,h5,h6'))wrapper.setAttribute('data-keep-next','true');
    units.push(wrapper);first=false;
   }
  }
  if(first){const wrapper=list.cloneNode(false);if(wrapper.localName==='ol')wrapper.setAttribute('start',String((Number(list.getAttribute('start'))||1)+index));wrapper.append(item.cloneNode(true));units.push(wrapper)}
 }
 return units;
}
export function listFlowLeaf(element){let leaf=element;while(leaf?.matches('ol,ul,li')&&leaf.children.length===1)leaf=leaf.firstElementChild;return leaf?.matches('p,h1,h2,h3,h4,h5,h6,pre')?leaf:null}
