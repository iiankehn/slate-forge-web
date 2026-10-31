import {referenceIndex} from './references.mjs';
import {pageNoteSection} from './page-notes.mjs';
import {balanceLineBreak,firstBalancedLinesBottom,lineStart,nextLineStart} from './line-pagination.mjs';
import {Extension} from '@tiptap/core';
import {Plugin,PluginKey} from '@tiptap/pm/state';
import {Decoration,DecorationSet} from '@tiptap/pm/view';
import {pageGeometry} from './pagination.mjs';
import {rowSpanGroups} from './table-pagination.mjs';
export const livePageKey=new PluginKey('slateForgeLivePages');
export const PAGE_GAP=28;
// All coordinates are natural, undecorated document coordinates in CSS pixels.
export function planPageBreaks(blocks,geometry,coords,{maxPages=100,reserves=[]}={}){
 const measured=new Map(),read=coords;coords=pos=>{if(!measured.has(pos))measured.set(pos,read(pos));return measured.get(pos)};
 const {height,margin}=geometry,content=height-2*margin,breaks=[];let index=0,shift=0;
 const bottom=()=>index*(height+PAGE_GAP)+height-margin-Math.max(0,Number(reserves[index])||0);
 function advance(pos,y,kind='block',header=null,columns=1,target=null){if(++index>=maxPages)throw Error('Live editing is limited to '+maxPages+' pages. Use Page preview for this document.');const targetY=index*(height+PAGE_GAP)+margin+(header?.height||0),size=Math.max(0,targetY-y-shift);breaks.push({pos,height:size,page:index+1,kind,header,columns,target});shift+=size}
 for(const [blockIndex,block]of blocks.entries()){if(block.type==='pageBreak'){if(block.top+shift>index*(height+PAGE_GAP)+margin+1)advance(block.pos,block.top);continue}
  if(block.bottom-block.top+(block.header?.height||0)>content+2&&!block.textblock)throw Error(block.type==='note'?'A note is taller than a page. Shorten it or use Page preview.':block.type==='wrapGroup'?'A wrapped image and its surrounding text are taller than a page. Shorten the text, resize the image or use continuous editing.':'An object or table row group is taller than a page. Use Page preview or resize it.');
  if(block.pageBreakBefore&&block.top+shift>index*(height+PAGE_GAP)+margin+1)advance(block.from,block.top,'inline');
  if(block.keepTogether){if(block.bottom-block.top>content+2)throw Error('A paragraph marked Keep together is taller than a page. Turn off Keep together or shorten it.');while(block.bottom+shift>bottom()+1)advance(block.from,block.top,'inline')}
  if(!block.textblock){while(block.bottom+shift>bottom()+1)advance(block.pos,block.top,block.type==='row'?'row':'block',block.header,block.columns,block.target);continue}
  if(block.heading||block.keepWithNext){
   let following=blockIndex+1;while(blocks[following]&&(blocks[following].heading||blocks[following].keepWithNext)&&!blocks[following].pageBreakBefore)following++;
   const next=blocks[following];
   if(next&&!next.pageBreakBefore&&!['pageBreak','note'].includes(next.type)){
    const startBox=coords(block.from),neededBottom=next.textblock&&!next.keepTogether?(next.widowControl===false?coords(next.from).bottom:firstBalancedLinesBottom(next.from,next.to,coords)):next.bottom;
    if(neededBottom-startBox.top>content+2)throw Error('A heading group is too tall to keep with following content. Shorten it or use continuous editing.');
    while(neededBottom+shift>bottom()+1)advance(block.from,startBox.top,'inline');
   }
  }
  let start=block.from,guard=0;
  while(block.bottom+shift>bottom()+1){if(++guard>maxPages)throw Error('This paragraph is too large for live page editing.');let low=start,high=block.to,cut=block.to+1;const limit=bottom()-shift;
   while(low<=high){const mid=Math.floor((low+high)/2),box=coords(mid);if(box.bottom>limit+1){cut=mid;high=mid-1}else low=mid+1}
   if(cut>block.to)break;const lineTop=coords(cut).top;low=start;high=cut;while(low<high){const mid=Math.floor((low+high)/2);if(coords(mid).top<lineTop-.5)low=mid+1;else high=mid}cut=low;
   if(block.widowControl!==false)cut=balanceLineBreak(start,block.to,cut,coords);
   if(block.widowControl!==false&&cut===start&&coords(start).top+shift<=index*(height+PAGE_GAP)+margin+1)throw Error('This paragraph cannot keep two lines on each side of a page break. Reduce its font size or use continuous editing.');
   const line=coords(cut);advance(cut,line.top,'inline');if(cut===start&&line.bottom-line.top>content)throw Error('A text line is taller than a page.');start=cut;if(block.bottom+shift<=bottom()+1)break;
  }
 }
 return {breaks,pages:index+1,height:(index+1)*height+index*PAGE_GAP};
}
export function planFootnotedPages(blocks,geometry,coords,notes,measure,{maxPages=100}={}){
 if(notes.length>500)throw Error('Page-bottom notes are limited to 500 references. Use endnotes for this document.');
 const reserves=[],cache=new Map(),read=coords;coords=pos=>{if(!cache.has(pos))cache.set(pos,read(pos));return cache.get(pos)};
 for(let pass=0;pass<=maxPages;pass++){
  const plan=planPageBreaks(blocks,geometry,coords,{maxPages,reserves}),groups=Array.from({length:plan.pages},()=>[]);
  for(const note of notes){let page=0;for(const gap of plan.breaks){if(gap.pos<=note.pos)page=gap.page-1;else break}groups[page].push(note)}
  let changed=false;const notePages=groups.map((items,index)=>{const height=items.length?measure(items):0;if(!Number.isFinite(height)||height<0||height>geometry.height-2*geometry.margin-48)throw Error('Page footnotes leave too little room for text. Shorten notes or choose endnotes.');if(height>(reserves[index]||0)+.5){reserves[index]=height;changed=true}return {notes:items,height}});
  // Keep reservations monotonic. Releasing a previous page's space could pull
  // the same reference backwards forever. Unused reserved space is harmless.
  if(!changed)return {...plan,notePages,reserves:reserves.slice()};
 }
 throw Error('Page-bottom note layout did not stabilize. Shorten notes or choose endnotes.');
}
// Float geometry depends on the surrounding lines. Keep the complete connected
// flow together so inserting a page gap cannot change its wrapping width.
export function groupWrappedBlocks(input,coords=null){
 const blocks=input.slice();
 const grouped=[];
 for(let i=0;i<blocks.length;){
  const first=blocks[i++];if(!first.wrapped){grouped.push(first);continue}
  const group={type:'wrapGroup',pos:first.pos,top:first.top,bottom:first.flowBottom??first.bottom,members:[first]};let flowEnd=group.bottom;
  while(i<blocks.length&&blocks[i].top<flowEnd-.5){
   const next=blocks[i];
   if(next.type==='pageBreak')throw Error('A wrapped image crosses an explicit page break. Move the image or use continuous editing.');
   if(next.type==='note')break;
   if(next.type==='row')throw Error('Wrapped images beside tables currently use continuous editing. Move the image above or below the table.');
   if(next.wrapped)flowEnd=Math.max(flowEnd,next.flowBottom??next.bottom);
   // Once the float ends, subsequent paragraph lines have the ordinary full
   // width. Keep the wrapped prefix with the image but paginate that remaining
   // text normally. Never split through the float itself or a keep rule.
   if(coords&&next.textblock&&!next.keepTogether&&!next.keepWithNext&&!next.pageBreakBefore&&!next.heading&&next.bottom>flowEnd+.5){
    let low=next.from,high=next.to+1;while(low<high){const mid=Math.floor((low+high)/2);if(coords(mid).top<flowEnd-.5)low=mid+1;else high=mid}
    if(low>next.from&&low<=next.to){let cut=lineStart(next.from,low,coords);if(next.widowControl!==false){const second=nextLineStart(next.from,next.to,coords);if(second<=next.to)cut=Math.max(cut,nextLineStart(second,next.to,coords))}
     if(cut>next.from&&cut<=next.to&&(next.widowControl===false||nextLineStart(cut,next.to,coords)<=next.to)){
      const prefix={...next,to:cut-1,bottom:coords(cut-1).bottom,measuredText:true};group.members.push(prefix);group.top=Math.min(group.top,prefix.top);group.bottom=Math.max(group.bottom,prefix.bottom);
      blocks[i]={...next,from:cut,top:coords(cut).top};break;
     }
    }
   }
   group.members.push(next);group.top=Math.min(group.top,next.top);group.bottom=Math.max(group.bottom,next.flowBottom??next.bottom);i++;
  }
  grouped.push(group);
 }
 return grouped;
}
export function wrappedGroupFits(top,bottom,{height,margin},tolerance=2){
 const stride=height+PAGE_GAP,page=Math.max(0,Math.floor((top-margin+tolerance)/stride));
 return top>=page*stride+margin-tolerance&&bottom<=page*stride+height-margin+tolerance;
}
export function pageDecorations(doc,breaks,owner=document){return DecorationSet.create(doc,breaks.filter(item=>!item.target).map(item=>Decoration.widget(item.pos,()=>{
 const gap=owner.createElement(item.kind==='row'?'tr':'span');gap.className=item.kind==='row'?'live-page-gap-row':'live-page-gap';gap.dataset.liveBreak=String(item.page);gap.setAttribute('aria-hidden','true');gap.contentEditable='false';
 if(item.kind==='row'){const cell=owner.createElement('td');cell.colSpan=item.columns||1;cell.style.cssText='height:'+item.height+'px;padding:0;border:0;position:relative;line-height:0';if(item.header?.html){const wrap=owner.createElement('div');wrap.className='live-repeated-header';wrap.style.height=item.header.height+'px';const table=owner.createElement('table');table.setAttribute('aria-hidden','true');table.innerHTML=item.header.html;wrap.append(table);cell.append(wrap)}gap.append(cell)}else gap.style.height=item.height+'px';return gap;
 },{side:-1,key:'page-'+item.page+'-'+item.pos,ignoreSelection:true})))}
export class LivePageController{
 constructor(view,options){this.view=view;this.options=options;this.root=view.dom.closest('#page');this.timer=null;this.dead=false;this.measuring=false;this.lastDoc=null;this.configKey='';this.observer=null;this.composeEnd=()=>this.refresh();view.dom.addEventListener('compositionend',this.composeEnd);this.imageLoad=()=>this.refresh();view.dom.addEventListener('load',this.imageLoad,true);this.fonts=view.dom.ownerDocument.fonts;this.fonts?.addEventListener('loadingdone',this.imageLoad);if(typeof ResizeObserver!=='undefined'&&this.root){this.observer=new ResizeObserver(()=>{const width=this.root.clientWidth;if(width!==this.lastWidth){this.lastWidth=width;this.refresh()}});this.observer.observe(this.root)}options.onReady?.(this);this.refresh()}
 clear(){if(!this.dead&&livePageKey.getState(this.view.state)?.find().length)this.view.dispatch(this.view.state.tr.setMeta(livePageKey,DecorationSet.empty).setMeta('addToHistory',false));this.root?.querySelectorAll('.live-note-break').forEach(el=>{el.classList.remove('live-note-break');el.style.removeProperty('--live-note-gap');el.style.removeProperty('--live-note-base-margin')});this.root?.querySelector('#page-notes')?.classList.remove('live-page-notes-accessible');this.root?.querySelector('.live-page-backgrounds')?.remove();this.root?.classList.remove('live-pages-enabled');if(this.root){this.root.style.removeProperty('--live-page-width');this.root.style.removeProperty('--live-page-margin');this.root.style.removeProperty('--live-editor-height')}}
 refresh(){if(this.dead||this.measuring)return;clearTimeout(this.timer);this.timer=setTimeout(()=>this.measure(),100)}
 update(view,previous){if(this.measuring||this.dead)return;if(view.state.doc!==previous.doc)this.refresh()}
 measure(){if(this.dead||!this.root)return;if(this.view.composing){this.refresh();return}this.measuring=true;const view=this.view;
 try{this.clear();if(!this.options.enabled()){this.options.onStatus?.({enabled:false,pages:0});return}let unsupported='';view.state.doc.descendants((node,pos,parent)=>{if(node.type.name==='columnSection')unsupported='Mixed sections currently use continuous editing. Page preview keeps their section layout.';if(node.type.name==='image'&&['left','right'].includes(node.attrs.imageWrap)&&parent.type.name!=='doc')unsupported='Wrapped images inside lists, tables or nested blocks currently use continuous editing. Page preview keeps their text flow.'});if(unsupported)throw Error(unsupported);
  const settings=this.options.layout(),geometry=pageGeometry(settings);this.root.classList.add('live-pages-enabled');this.root.style.setProperty('--live-page-width',geometry.width+'px');this.root.style.setProperty('--live-page-margin',geometry.margin+'px');
  const rootBox=this.root.getBoundingClientRect(),scale=rootBox.width/this.root.offsetWidth||1,offset=rect=>({top:(rect.top-rootBox.top)/scale,bottom:(rect.bottom-rootBox.top)/scale}),blocks=[];
  function visit(node,pos,parent){const dom=view.nodeDOM(pos);if(!dom||!dom.getBoundingClientRect)return false;const box=offset(dom.getBoundingClientRect());if(node.type.name==='pageBreak'){blocks.push({type:'pageBreak',pos,...box});return false}if(node.type.name==='table'){
   const rows=[];let rowPos=pos+1;
   node.forEach(row=>{const rowDOM=view.nodeDOM(rowPos);if(!rowDOM)throw Error('A table could not be measured. Use continuous editing.');rows.push({node:row,pos:rowPos,dom:rowDOM,...offset(rowDOM.getBoundingClientRect())});rowPos+=row.nodeSize});
   const groups=rowSpanGroups(rows.map(row=>row.node.content.content.map(cell=>cell.attrs.rowspan))),columns=node.firstChild.content.content.reduce((n,cell)=>n+(cell.attrs.colspan||1),0);let header=null;
   for(const [i,group]of groups.entries()){
    const items=rows.slice(group.from,group.to),first=items[0],last=items.at(-1);
    if(i===0&&items.every(row=>row.node.content.content.every(cell=>cell.type.name==='tableHeader')))header={height:last.bottom-first.top,html:'<tbody>'+items.map(row=>row.dom.outerHTML).join('')+'</tbody>'};
    blocks.push({type:'row',pos:first.pos,top:first.top,bottom:last.bottom,header:i?header:null,columns});
   }
   return false;
  }if(node.isTextblock){blocks.push({type:'text',heading:node.type.name==='heading',widowControl:node.attrs.widowControl!==false,keepTogether:node.attrs.keepTogether===true,keepWithNext:node.attrs.keepWithNext===true,pageBreakBefore:node.attrs.pageBreakBefore===true,dom,pos,from:pos+1,to:pos+node.nodeSize-1,textblock:true,...box});return false}if(node.isAtom||node.type.name==='image'||node.type.name==='designCanvas'){const wrapped=node.type.name==='image'&&['left','right'].includes(node.attrs.imageWrap),marginBottom=wrapped?parseFloat(view.dom.ownerDocument.defaultView.getComputedStyle(dom).marginBottom)||0:0;blocks.push({type:'block',pos,dom,wrapped,flowBottom:box.bottom+marginBottom,...box});return false}return true}
  view.state.doc.descendants(visit);
  const notes=this.root.querySelector('#page-notes'),items=notes?[...notes.querySelectorAll(':scope > ol > li')]:[];
  if(settings.notePlacement!=='page')for(const [i,item]of items.entries())blocks.push({type:'note',target:i?item:notes,pos:view.state.doc.content.size,top:offset((i?item:notes).getBoundingClientRect()).top,bottom:offset(item.getBoundingClientRect()).bottom});
  const coords=pos=>offset(view.coordsAtPos(Math.min(pos,view.state.doc.content.size),1)),grouped=groupWrappedBlocks(blocks,coords),measurements=new Map(),measureNotes=entries=>{const key=entries.map(note=>note.number).join(',');if(measurements.has(key))return measurements.get(key);const section=pageNoteSection(entries,view.dom.ownerDocument);section.style.cssText='position:absolute;left:-100000px;top:0;width:'+geometry.contentWidth+'px;margin:0;visibility:hidden';this.root.append(section);let height;try{height=section.getBoundingClientRect().height/scale+12}finally{section.remove()}measurements.set(key,height);return height},plan=settings.notePlacement==='page'?planFootnotedPages(grouped,geometry,coords,this.options.references?this.options.references():referenceIndex(view.state.doc).notes,measureNotes):planPageBreaks(grouped,geometry,coords);
  view.dispatch(view.state.tr.setMeta(livePageKey,pageDecorations(view.state.doc,plan.breaks,view.dom.ownerDocument)).setMeta('addToHistory',false));if(settings.notePlacement==='page'&&plan.notePages?.some(page=>page.notes.length))notes?.classList.add('live-page-notes-accessible');
  // Inserting gaps can trigger browser scroll anchoring. Re-read the origin
  // before checking rendered bounds rather than mixing two scroll positions.
  const renderedRoot=this.root.getBoundingClientRect(),renderedScale=renderedRoot.width/this.root.offsetWidth||1;
  for(const group of grouped.filter(block=>block.type==='wrapGroup')){
   const boxes=group.members.filter(block=>block.dom).map(block=>{if(block.measuredText){const first=view.coordsAtPos(block.from,1),last=view.coordsAtPos(block.to,1);return {top:(first.top-renderedRoot.top)/renderedScale,bottom:(last.bottom-renderedRoot.top)/renderedScale}}const box=block.dom.getBoundingClientRect();return {top:(box.top-renderedRoot.top)/renderedScale,bottom:(box.bottom-renderedRoot.top)/renderedScale}});
   if(!wrappedGroupFits(Math.min(...boxes.map(box=>box.top)),Math.max(...boxes.map(box=>box.bottom)),geometry))throw Error('This wrapped layout could not fit safely inside page boundaries. Use continuous editing or adjust the image and text.');
  }
  for(const item of plan.breaks.filter(item=>item.target)){
   item.target.style.setProperty('--live-note-base-margin',view.dom.ownerDocument.defaultView.getComputedStyle(item.target).marginTop);
   item.target.style.setProperty('--live-note-gap',item.height+'px');item.target.classList.add('live-note-break');
  }
  this.root.style.setProperty('--live-editor-height',plan.height+'px');
  const backgrounds=view.dom.ownerDocument.createElement('div');backgrounds.className='live-page-backgrounds';backgrounds.setAttribute('aria-hidden','true');backgrounds.contentEditable='false';for(let i=0;i<plan.pages;i++){const sheet=view.dom.ownerDocument.createElement('div');sheet.className='live-edit-sheet';sheet.style.top=i*(geometry.height+PAGE_GAP)+'px';sheet.style.height=geometry.height+'px';for(const kind of ['header','footer']){const part=view.dom.ownerDocument.createElement('div');part.className='live-edit-'+kind;part.style.left=part.style.right=geometry.margin+'px';part.textContent=settings[kind]||'';if(kind==='footer'&&settings.pageNumbers){const number=view.dom.ownerDocument.createElement('span');number.textContent=String(i+1);part.append(number)}sheet.append(part)}if(plan.notePages?.[i]?.notes.length){const area=pageNoteSection(plan.notePages[i].notes,view.dom.ownerDocument);area.classList.add('live-edit-footnotes');area.style.cssText='position:absolute;left:'+geometry.margin+'px;width:'+geometry.contentWidth+'px;bottom:'+geometry.margin+'px;margin:0';sheet.append(area)}backgrounds.append(sheet)}this.root.prepend(backgrounds);this.lastDoc=view.state.doc;this.options.onStatus?.({enabled:true,pages:plan.pages});
 }catch(error){this.clear();this.options.onStatus?.({enabled:false,pages:0,warning:error.message})}finally{this.measuring=false}}
 destroy(){this.dead=true;clearTimeout(this.timer);this.observer?.disconnect();this.view.dom.removeEventListener('compositionend',this.composeEnd);this.view.dom.removeEventListener('load',this.imageLoad,true);this.fonts?.removeEventListener('loadingdone',this.imageLoad);this.clear()}
}
export const LivePagination=Extension.create({name:'livePagination',addOptions(){return {enabled:()=>false,layout:()=>({}),references:null,onReady:()=>{},onStatus:()=>{}}},addProseMirrorPlugins(){const options=this.options;return [new Plugin({key:livePageKey,state:{init:()=>DecorationSet.empty,apply(tr,previous){const next=tr.getMeta(livePageKey);return next||previous.map(tr.mapping,tr.doc)}},props:{decorations(state){return livePageKey.getState(state)}},view:view=>new LivePageController(view,options)})]}});
