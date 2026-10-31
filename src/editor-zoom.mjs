export const ZOOM_KEY='slate-forge.editor-zoom';
export function normalizeZoom(value){return {mode:value?.mode==='fit'?'fit':'manual',percent:Number.isFinite(value?.percent)?Math.max(10,Math.min(200,Math.round(value.percent))):100}}
export function fitWidthPercent(available,paper){if(!Number.isFinite(available)||!Number.isFinite(paper)||available<=0||paper<=0)return 100;return Math.max(10,Math.min(100,Math.floor(available/paper*100)))}

// Zoom is browser UI state, never document formatting or export metadata.
export class EditorZoom{
 constructor({page,workspace,input,label,button,onChange=()=>{},storage=()=>globalThis.localStorage,window=page.ownerDocument.defaultView}){
  Object.assign(this,{page,workspace,input,label,button,onChange,storage,window});this.frame=null;this.dead=false;
  try{this.preference=normalizeZoom(JSON.parse(storage().getItem(ZOOM_KEY)))}catch{this.preference=normalizeZoom()}
  this.percent=100;this.onInput=()=>this.setManual(Number(input.value));input.addEventListener('input',this.onInput);
  if(window.ResizeObserver){this.observer=new window.ResizeObserver(()=>this.refresh());this.observer.observe(workspace)}
  this.onResize=()=>this.refresh();window.addEventListener('resize',this.onResize);this.refresh();
 }
 save(){try{this.storage().setItem(ZOOM_KEY,JSON.stringify(this.preference))}catch{}}
 setManual(percent){this.preference=normalizeZoom({mode:'manual',percent});this.save();this.refresh()}
 step(delta){this.setManual(this.percent+delta)}
 setFit(){this.preference.mode='fit';this.save();this.refresh()}
 toggleFit(){if(this.preference.mode==='fit'){this.preference.mode='manual';this.save();this.refresh()}else this.setFit()}
 refresh(){if(this.dead||this.frame!==null)return;this.frame=this.window.requestAnimationFrame(()=>{this.frame=null;this.apply()})}
 apply(){if(this.dead)return;let percent=this.preference.percent;
  if(this.preference.mode==='fit'){
   const style=this.window.getComputedStyle(this.workspace),available=this.workspace.clientWidth-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0)-2;
   // Continuous editing already reflows to its responsive container.
   percent=this.page.classList.contains('live-pages-enabled')?fitWidthPercent(available,this.page.offsetWidth):100;
  }
  this.percent=percent;this.page.style.zoom=String(percent/100);this.input.value=String(percent);this.input.setAttribute('aria-valuetext',(this.preference.mode==='fit'?'Fit width, ':'')+percent+' percent');
  this.label.textContent=(this.preference.mode==='fit'?'Fit · ':'')+percent+'%';this.button?.setAttribute('aria-pressed',String(this.preference.mode==='fit'));this.onChange(percent);
 }
 destroy(){this.dead=true;if(this.frame!==null)this.window.cancelAnimationFrame(this.frame);this.observer?.disconnect();this.window.removeEventListener('resize',this.onResize);this.input.removeEventListener('input',this.onInput)}
}
