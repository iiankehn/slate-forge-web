import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import {normalizeXFAValues,assertXFAFieldOnly} from './pdf-xfa-state.mjs';
const MAX_PAGES=250,MAX_FIELDS=5000;
function options(bytes){const base=document.baseURI;pdfjs.GlobalWorkerOptions.workerSrc=new URL('vendor/pdf/pdf.worker.min.mjs',base).href;return {data:new Uint8Array(bytes),enableXfa:true,isEvalSupported:false,useSystemFonts:true,standardFontDataUrl:new URL('vendor/pdf/fonts/',base).href,cMapUrl:new URL('vendor/pdf/cmaps/',base).href,cMapPacked:true,wasmUrl:new URL('vendor/pdf/wasm/',base).href}}
function schemaForXFA(html){
 const schema=new Map(),stack=[{node:html,blocked:false,depth:0}];let nodes=0;
 while(stack.length){const {node,blocked,depth}=stack.pop();if(!node)continue;if(++nodes>100000||depth>100)throw Error('This XFA form exceeds the supported layout complexity.');
  const a=node.attributes||{},classes=a.class||[],locked=blocked||['xfaReadOnly','xfaDisabled','xfaNonInteractive'].some(value=>classes.includes(value))||Object.hasOwn(a,'disabled')||Object.hasOwn(a,'readOnly')||Object.hasOwn(a,'readonly')||Object.hasOwn(a,'hidden')||a.type==='hidden';
  if(['input','textarea','select'].includes(node.name)&&a.dataId){
   const id=String(a.dataId),pureMultiple=node.name==='select'&&!!a.multiple,kind=pureMultiple?'multiple':node.name==='select'?'select':['checkbox','radio'].includes(a.type)?'check':'text',choices=['select','multiple'].includes(kind)?(node.children||[]).filter(child=>child.name==='option'):[],allowed=kind==='check'?[a.xfaOn,a.xfaOff].filter(value=>value!==undefined&&value!==null).map(String):choices.length?choices.map(child=>child.attributes?.value).filter(value=>typeof value==='string'):kind==='select'||pureMultiple?[]:null;
   const initialValues=pureMultiple?choices.filter(child=>child.attributes?.selected).map(child=>child.attributes.value):[],unsupported=pureMultiple&&(id===String(a.fieldId)||initialValues.length>100||allowed.some(value=>/[\r\n]/.test(value)||value!==value.trim()||value.length>4000)),editable=!locked&&!unsupported,existing=schema.get(id);
   if(existing){
    existing.fieldIds.add(String(a.fieldId));existing.editable||=editable;
    if(existing.pureMultiple!==pureMultiple){existing.incompatible=true;existing.editable=false}
    else if(existing.kind==='text'||kind==='text'){existing.kind='text';existing.allowed=null}
    else if(existing.allowed&&allowed)for(const value of allowed)existing.allowed.add(value);
    existing.unsupported||=unsupported;if(existing.unsupported||existing.incompatible)existing.editable=false;
   }else schema.set(id,{id,kind,pureMultiple,editable,unsupported,fieldIds:new Set([String(a.fieldId)]),initialValues,allowed:allowed?new Set(allowed):null});
   if(schema.size>MAX_FIELDS)throw Error('XFA forms are limited to 5,000 fields.');
  }
  for(const child of node.children||[])stack.push({node:child,blocked:locked,depth:depth+1});
 }
 return schema;
}
async function describe(doc){
 if(doc.isPureXfa)return {schema:schemaForXFA(doc.allXfaHtml),groups:null};
 const groups=await doc.getFieldObjects()||{},schema=new Map();
 for(const widgets of Object.values(groups))for(const field of widgets){const kind=field.type==='text'?'text':['checkbox','radiobutton'].includes(field.type)?'boolean':['combobox','listbox'].includes(field.type)?field.multipleSelection?'multiple':'select':'unsupported';schema.set(field.id,{id:field.id,kind,allowed:['select','multiple'].includes(kind)?new Set((field.items||[]).map(item=>item.exportValue)):null,editable:field.editable!==false&&!field.hidden&&kind!=='unsupported',field});if(schema.size>MAX_FIELDS)throw Error('XFA forms are limited to 5,000 fields.')}
 return {schema,groups};
}
function applyValues(doc,schema,input){
 const values=normalizeXFAValues(input);
 for(const [id,value]of Object.entries(values)){
  const field=schema.get(id);if(!field||!field.editable)throw Error('An XFA edit targets an unknown, protected or unsupported field.');
  if(field.kind==='boolean'&&typeof value!=='boolean'||['text','select','check'].includes(field.kind)&&typeof value!=='string'||field.kind==='multiple'&&(!Array.isArray(value)||value.some(item=>typeof item!=='string')))throw Error('An XFA edit does not match its field type.');
  if(field.field?.charLimit>0&&typeof value==='string'&&value.length>field.field.charLimit)throw Error('An XFA edit exceeds its field character limit.');
  if(field.allowed&&!(Array.isArray(value)?value.every(item=>field.allowed.has(item)):field.allowed.has(value)))throw Error('An XFA edit is outside its field choices.');
 }
 for(const id of doc.annotationStorage.serializable.map?.keys()||[])doc.annotationStorage.remove(id);
 for(const [id,value]of Object.entries(values))doc.annotationStorage.setValue(id,{value,...(schema.get(id).pureMultiple?{xfaMultiSelect:true}:{})});return values;
}
export async function saveXFAPDF(bytes,state){
 assertXFAFieldOnly(state);const values=normalizeXFAValues(state.xfaValues);if(!Object.keys(values).length)return new Uint8Array(bytes);
 const task=pdfjs.getDocument(options(bytes));try{const doc=await task.promise;if(doc.numPages>MAX_PAGES)throw Error('XFA forms are limited to 250 pages.');const {schema}=await describe(doc);applyValues(doc,schema,values);return await doc.saveDocument()}finally{await task.destroy()}
}
function safeTree(input){
 const tree=structuredClone(input),stack=[tree];
 while(stack.length){const node=stack.pop(),a=node.attributes;if(a){for(const key of ['action','formaction','form','srcdoc'])delete a[key];if(a.src&&!/^(data:image\/|blob:)/i.test(a.src))delete a.src;if(a.style)for(const [key,value]of Object.entries(a.style))if(typeof value==='string'&&(/url\s*\(|@import/i.test(value)||value.includes(String.fromCharCode(92))))delete a.style[key]}
  stack.push(...node.children||[]);
 }
 return tree;
}
const links={addLinkAttributes(link,url){try{const target=new URL(url);if(!['https:','http:','mailto:'].includes(target.protocol))return;link.href=target.href;link.target='_blank';link.rel='noopener noreferrer'}catch{}}};
export async function createXFAView(root,{bytes,values={},readOnly=false,onValues=()=>true,onStatus=()=>{},signal}){
 let alive=true,index=0,serial=0,renderTask=null,applied='',current={},pending=false,queued=false,resizeObserver=null,resizeTimer=null,lastWidth=0,changeTail=Promise.resolve(),disposed=false;
 if(signal?.aborted)throw new DOMException('XFA view cancelled.','AbortError');
 const task=pdfjs.getDocument(options(bytes));
 const abort=()=>{if(disposed)return;disposed=true;alive=false;serial++;resizeObserver?.disconnect();clearTimeout(resizeTimer);renderTask?.cancel();task.destroy().catch(()=>{})};signal?.addEventListener('abort',abort,{once:true});
 root.innerHTML='<p>XFA form fields save on this browser and export back into the original form. Form scripts, calculations and automatic submissions are not run. Page and drawing tools are available for standard PDFs.</p><div class="tool-actions"><button data-xfa="previous">Previous page</button><label>Page<input data-xfa="number" type="number" min="1" step="1" value="1"></label><span data-xfa="count"></span><button data-xfa="next">Next page</button><label>Zoom<select data-xfa="zoom"><option value="fit">Fit width</option><option value="1">100%</option><option value="0.75">75%</option></select></label></div><div class="pdf-xfa-scroll"><div class="pdf-xfa-stage" data-xfa="stage"></div></div><div data-xfa="fields"></div><p data-xfa="message" role="status"></p>';
 const $=key=>root.querySelector('[data-xfa="'+key+'"]'),message=text=>{if(alive){$('message').textContent=text;onStatus(text)}};
 let doc,description;
 async function render(){
  const request=++serial;renderTask?.cancel();message('Rendering XFA page…');const page=await doc.getPage(index+1);if(!alive||request!==serial)return;const base=page.getViewport({scale:1}),available=Math.max(200,root.clientWidth-24),scale=$('zoom').value==='fit'?Math.min(1,available/base.width):Number($('zoom').value),viewport=page.getViewport({scale});
  if(viewport.width*viewport.height>16000000)throw Error('This XFA page exceeds the rendering size limit.');
  const stage=$('stage'),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
  renderTask=page.render({canvasContext:canvas.getContext('2d'),canvas,viewport,annotationMode:pdfjs.AnnotationMode.ENABLE_STORAGE});try{await renderTask.promise}catch(error){if(error.name==='RenderingCancelledException')return;throw error}if(!alive||request!==serial)return;
  stage.replaceChildren(canvas);stage.style.width=viewport.width+'px';stage.style.height=viewport.height+'px';
  if(doc.isPureXfa){const html=await page.getXfa();if(!html)throw Error('This XFA page has no supported form layout.');if(!alive||request!==serial)return;const boundary=document.createElement('fieldset');boundary.className='pdf-xfa-boundary';boundary.disabled=readOnly;const layer=document.createElement('div');boundary.append(layer);stage.append(boundary);pdfjs.XfaLayer.render({div:layer,xfaHtml:safeTree(html),viewport:viewport.clone({dontFlip:true}),annotationStorage:pureStorage(),linkService:links,intent:'display'});
   for(const control of layer.querySelectorAll('.xfaReadOnly input,.xfaReadOnly textarea,.xfaReadOnly select,.xfaDisabled input,.xfaDisabled textarea,.xfaDisabled select,.xfaNonInteractive input,.xfaNonInteractive textarea,.xfaNonInteractive select'))control.disabled=true;
   const lists=[],bindings=new Map();for(const field of description.schema.values())for(const id of field.fieldIds)bindings.set(id,field);
   for(const control of layer.querySelectorAll('input[fieldid],textarea[fieldid],select[fieldid]'))if(bindings.get(control.getAttribute('fieldId'))?.editable===false)control.disabled=true;
   for(const control of layer.querySelectorAll('select[multiple]')){
    const field=bindings.get(control.getAttribute('fieldId'));
    if(!field?.pureMultiple||!field.editable){control.disabled=true;control.title='This list has an unsupported or protected XFA data binding.';continue}
    const value=doc.annotationStorage.getRawValue(field.id)?.value??field.initialValues;for(const option of control.options)option.selected=value.includes(option.value);
    lists.push({control,field});
   }
   for(const {control,field}of lists){const select=()=>{
    if(readOnly||control.disabled)return;const value=[...control.selectedOptions].map(option=>option.value);doc.annotationStorage.setValue(field.id,{value,xfaMultiSelect:true});
    for(const sibling of lists)if(sibling.field.id===field.id&&sibling.control!==control)for(const option of sibling.control.options)option.selected=value.includes(option.value);
   };control.addEventListener('input',select);control.addEventListener('change',select)}
   for(const button of layer.querySelectorAll('button,input[type="submit"],input[type="button"],input[type="reset"]')){button.disabled=true;button.title='Form scripts and submissions are not run here.'}
  }
  $('number').value=index+1;$('number').max=doc.numPages;$('count').textContent=' / '+doc.numPages;$('previous').disabled=index===0;$('next').disabled=index===doc.numPages-1;message(readOnly?'Signed XFA form: view and export the original.':[...description.schema.values()].some(field=>field.editable)?'XFA field edits save on this browser.':'No supported editable fields were found. The original form remains available for export.');
 }
 // PDF.js treats choice-list storage as scalar. Multiple lists use canonical arrays instead.
 function pureStorage(){return {getValue(id,fallback){return description.schema.get(id)?.pureMultiple?fallback:doc.annotationStorage.getValue(id,fallback)},setValue(id,value){if(!description.schema.get(id)?.pureMultiple)doc.annotationStorage.setValue(id,value)}}}
 function snapshot(){const result={};for(const [id,value]of doc.annotationStorage.serializable.map||[])if(description.schema.has(id)&&Object.hasOwn(value,'value'))Object.defineProperty(result,id,{value:value.value,enumerable:true,writable:true,configurable:true});return normalizeXFAValues(result)}
 function changed(){
  if(!alive||readOnly)return Promise.resolve(false);if(pending){queued=true;return changeTail}const before=current;pending=true;
  changeTail=(async()=>{
   let committed=false;try{
    const next=snapshot();if(JSON.stringify(next)===applied)return true;applyValues(doc,description.schema,next);current=next;applied=JSON.stringify(next);const accepted=await onValues(next);
    if(!alive)return false;
    if(accepted===false){current=before;applyValues(doc,description.schema,before);applied=JSON.stringify(before);hybridFields();await render()}
    else{committed=true;if(!doc.isPureXfa)await render()}return accepted!==false;
   }catch(error){if(committed){message('The field edit was kept, but its preview could not render: '+error.message);return true}if(alive){current=before;applyValues(doc,description.schema,before);applied=JSON.stringify(before);hybridFields();try{await render()}catch{}message(error.message)}return false}
   finally{pending=false;if(queued){queued=false;return changed()}}
  })();return changeTail;
 }

 function hybridFields(){
  const host=$('fields');host.replaceChildren();if(doc.isPureXfa)return;const heading=document.createElement('h3');heading.textContent='XFA / PDF form fields';host.append(heading);
  for(const [name,widgets]of Object.entries(description.groups||{})){
   const usable=widgets.filter(field=>description.schema.get(field.id)?.editable),field=widgets[0];if(!field||field.hidden)continue;const label=document.createElement('label');label.textContent=name;let input;
   if(field.type==='radiobutton'){input=document.createElement('select');input.append(new Option('',''));for(const widget of widgets)input.append(new Option(widget.exportValues,widget.exportValues));input.value=widgets.find(widget=>doc.annotationStorage.getRawValue(widget.id)?.value===true)?.exportValues||field.value;input.onchange=()=>{for(const widget of usable)doc.annotationStorage.setValue(widget.id,{value:widget.exportValues===input.value});changed()}}
   else if(['combobox','listbox'].includes(field.type)){input=document.createElement('select');input.multiple=field.multipleSelection;for(const item of field.items||[])input.append(new Option(item.displayValue,item.exportValue));const value=doc.annotationStorage.getRawValue(field.id)?.value??field.value;for(const option of input.options)option.selected=Array.isArray(value)?value.includes(option.value):option.value===value;input.onchange=()=>{for(const widget of usable)doc.annotationStorage.setValue(widget.id,{value:input.multiple?[...input.selectedOptions].map(option=>option.value):input.value});changed()}}
   else{input=document.createElement(field.multiline?'textarea':'input');if(input.localName==='input')input.type=field.type==='checkbox'?'checkbox':'text';const value=doc.annotationStorage.getRawValue(field.id)?.value;if(input.type==='checkbox')input.checked=value??field.value===field.exportValues;else{input.value=value??field.value??'';input.maxLength=Math.min(4000,field.charLimit||4000);input.dir='auto'}input.addEventListener(input.type==='checkbox'?'change':'input',()=>{for(const widget of usable)doc.annotationStorage.setValue(widget.id,{value:input.type==='checkbox'?input.checked:input.value});changed()})}
   input.disabled=readOnly||!usable.length;input.setAttribute('aria-label',name);label.append(input);host.append(label);
  }
 }
 try{
  doc=await task.promise;if(!alive){await task.destroy();return null}if(!doc.numPages||doc.numPages>MAX_PAGES)throw Error('XFA forms support 1–250 pages.');description=await describe(doc);current=applyValues(doc,description.schema,readOnly?{}:values);applied=JSON.stringify(current);
  $('stage').addEventListener('input',changed);$('stage').addEventListener('change',changed);
  async function navigate(target){if(!Number.isInteger(target)||target<0||target>=doc.numPages){$('number').value=index+1;return}index=target;try{await render()}catch(error){message(error.message)}}
  $('previous').onclick=()=>navigate(index-1);$('next').onclick=()=>navigate(index+1);$('number').onchange=()=>navigate(Number($('number').value)-1);$('zoom').onchange=()=>navigate(index);hybridFields();await render();if(typeof ResizeObserver==='function'){lastWidth=root.clientWidth;resizeObserver=new ResizeObserver(()=>{if(root.clientWidth===lastWidth)return;lastWidth=root.clientWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(alive&&$('zoom').value==='fit')render().catch(error=>message(error.message))},150)});resizeObserver.observe(root)}
  return {async flush(){await changeTail;if(queued){queued=false;await changed()}},async setValues(values){if(readOnly)return;const normalized=normalizeXFAValues(values),key=JSON.stringify(normalized);if(key===applied)return;current=applyValues(doc,description.schema,normalized);applied=key;hybridFields();await render()},async export(){if(readOnly)return new Uint8Array(bytes);await changeTail;if(queued){queued=false;await changed()}return saveXFAPDF(bytes,{xfaValues:current})},dispose(){signal?.removeEventListener('abort',abort);abort()}};
 }catch(error){alive=false;signal?.removeEventListener('abort',abort);await task.destroy();throw error}
}
