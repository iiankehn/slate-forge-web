import {TextSelection} from '@tiptap/pm/state';
export function validPageNumber(value,total){if(value===null||value===undefined||String(value).trim()==='')return null;const page=Number(value);return Number.isInteger(page)&&page>=1&&page<=total?page:null}
export function visiblePage(rects,viewportTop,viewportHeight){if(!rects.length)return 0;const height=rects[0].bottom-rects[0].top,point=viewportTop+Math.min(80,height*.2,viewportHeight*.25);let index=0;for(let i=0;i<rects.length;i++){if(rects[i].top<=point)index=i;else break}return index+1}

export function pageTextSelection(doc,pos){const point=doc.resolve(Math.max(0,Math.min(doc.content.size,Math.trunc(Number(pos))||0)));return TextSelection.findFrom(point,1,true)||TextSelection.findFrom(point,-1,true)}

export class PageNavigation{
 constructor({root,workspace,button,onNavigate=()=>{},window=root.ownerDocument.defaultView}){
  Object.assign(this,{root,workspace,button,onNavigate,window});this.current=0;this.total=0;this.frame=null;this.dead=false;this.requestedPage=null;
  this.onScroll=()=>this.refresh();workspace.addEventListener('scroll',this.onScroll,{passive:true});window.addEventListener('resize',this.onScroll);this.onIntent=event=>{if(event.type==='keydown'&&!['PageUp','PageDown','Home','End'].includes(event.key))return;this.reset()};for(const type of ['wheel','touchmove','pointerdown','keydown'])workspace.addEventListener(type,this.onIntent,{passive:true});
  if(window.ResizeObserver){this.observer=new window.ResizeObserver(this.onScroll);this.observer.observe(workspace)}this.refresh();
 }
 reset(){this.requestedPage=null;this.refresh()}
 sheets(){return [...this.root.querySelectorAll('.live-edit-sheet')]}
 refresh(){if(this.dead||this.frame!==null)return;this.frame=this.window.requestAnimationFrame(()=>{this.frame=null;this.update()})}
 update(){const sheets=this.sheets(),box=this.workspace.getBoundingClientRect();this.total=sheets.length;const rects=sheets.map(sheet=>sheet.getBoundingClientRect());this.current=visiblePage(rects,box.top,this.workspace.clientHeight);const requested=rects[(this.requestedPage||0)-1];if(requested&&requested.bottom>box.top&&requested.top<box.top+this.workspace.clientHeight)this.current=this.requestedPage;else this.requestedPage=null;this.button.hidden=!this.total;if(this.total){this.button.textContent=this.current+' / '+this.total;this.button.setAttribute('aria-label','Go to page. Page '+this.current+' of '+this.total);this.button.title='Page '+this.current+' of '+this.total+' · Go to page'}}
 goTo(value){const sheets=this.sheets(),number=validPageNumber(value,sheets.length);if(number===null)return false;this.requestedPage=number;const sheet=sheets[number-1],scroll=()=>{const box=sheet.getBoundingClientRect(),viewport=this.workspace.getBoundingClientRect();this.workspace.scrollTo({top:this.workspace.scrollTop+box.top-viewport.top-12,behavior:'auto'})};scroll();this.onNavigate(number,sheet);scroll();this.update();return true}
 destroy(){this.dead=true;if(this.frame!==null)this.window.cancelAnimationFrame(this.frame);this.observer?.disconnect();this.workspace.removeEventListener('scroll',this.onScroll);this.window.removeEventListener('resize',this.onScroll);for(const type of ['wheel','touchmove','pointerdown','keydown'])this.workspace.removeEventListener(type,this.onIntent)}
}
