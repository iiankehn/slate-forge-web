import {DOMSerializer} from '@tiptap/pm/model';

export function plainTextContent(text){return String(text).replace(/\r\n?/g,'\n').split('\n').map(line=>({type:'paragraph',...(line?{content:[{type:'text',text:line}]}:{})}))}
export function mergePasteHTML(html,document){
 const template=document.createElement('template');template.innerHTML=html;
 const allowed=new Set(['P','DIV','BR','STRONG','B','EM','I','U','S','DEL','SUP','SUB','UL','OL','LI','BLOCKQUOTE','PRE','CODE','TABLE','THEAD','TBODY','TR','TD','TH','A','IMG','HR']);
 for(const element of [...template.content.querySelectorAll('*')].reverse()){
  if(['SCRIPT','STYLE','IFRAME','OBJECT'].includes(element.tagName)){element.remove();continue}
  if(/^H[1-6]$/.test(element.tagName)){const p=document.createElement('p');p.append(...element.childNodes);element.replaceWith(p);continue}
  if(!allowed.has(element.tagName)){element.replaceWith(...element.childNodes);continue}
  for(const attr of [...element.attributes])if(!(element.tagName==='A'&&attr.name==='href'||['TD','TH'].includes(element.tagName)&&['rowspan','colspan'].includes(attr.name)||element.tagName==='OL'&&attr.name==='start'||element.tagName==='IMG'&&['src','alt'].includes(attr.name)))element.removeAttribute(attr.name);
 }
 return template.innerHTML;
}
export function createWritingClipboard({getEditor,getSession,sanitize,notify,navigator=globalThis.navigator,document=globalThis.document}){
 let epoch=0,plainIntent=false;
 function cancel(){epoch++;plainIntent=false}
 function keydown(event){if(event.key==='Escape')cancel();if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='v'&&!event.altKey&&!event.isComposing)plainIntent=event.shiftKey}
 function capture(){const editor=getEditor();if(!editor||editor.isDestroyed)return null;return {editor,doc:editor.state.doc,selection:editor.state.selection,session:getSession(),epoch}}
 function valid(token){return !document.querySelector('dialog[open]')&&!document.activeElement?.closest?.('input,textarea,select')&&token&&getEditor()===token.editor&&!token.editor.isDestroyed&&getSession()===token.session&&token.epoch===epoch&&token.editor.state.doc===token.doc&&token.editor.state.selection.eq(token.selection)}
 function insert(data,mode='original',token=capture()){
  if(!valid(token)){notify('Paste was cancelled or the document/selection changed. Paste again at the intended position.');return false}
  const html=data.getData('text/html'),text=data.getData('text/plain');
  if(!html&&!text){notify('No supported text on the clipboard. Use your browser’s Paste command for files.');return false}
  let cleaned=html?sanitize(html):'';const parsed=document.createElement('template');parsed.innerHTML=cleaned;
  const meaningful=parsed.content.textContent.length||parsed.content.querySelector('img[src],hr,table,[data-forge-design],[data-forge-footnote],[data-forge-toc]');
  if(!meaningful)cleaned='';
  if(mode==='merge'&&parsed.content.querySelector('[data-forge-design],[data-forge-footnote],[data-forge-toc]')){notify('Merge formatting cannot preserve this embedded object. Choose Paste · keep original.');return false}
  if((mode==='text'||!cleaned)&&!text){notify('The clipboard has no supported text. Choose Keep original for supported embedded objects.');return false}
  const content=mode==='text'||!cleaned?plainTextContent(text):mode==='merge'?mergePasteHTML(cleaned,document):cleaned;
  try{return token.editor.chain().focus().insertContent(content).run()}catch{notify('This clipboard content could not be inserted. Try Paste · text only.');return false}
 }
 async function copy(cut=false){
  const token=capture();if(!token||token.selection.empty)return false;
  const {editor,selection,doc}=token,fragment=selection.content().content;
  const container=document.createElement('div');container.append(DOMSerializer.fromSchema(editor.schema).serializeFragment(fragment,{document}));
  const text=doc.textBetween(selection.from,selection.to,'\n');
  try{
   if(navigator.clipboard?.write&&globalThis.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([container.innerHTML],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})})])}
   else if(text&&navigator.clipboard?.writeText){if(cut){let rich=false;fragment.descendants(node=>{if(node.isText){if(node.marks.length)rich=true}else if(node.type.name!=='paragraph'||node.marks.length||JSON.stringify(node.attrs)!==JSON.stringify(node.type.create().attrs))rich=true});if(rich)throw Error('Use Ctrl/⌘ X in the document to cut while preserving formatting and objects.')}await navigator.clipboard.writeText(text);if(!cut)notify('Copied text. Rich clipboard access is unavailable.')}
   else throw Error('Clipboard access is unavailable. Use Ctrl/⌘ '+(cut?'X':'C')+' in the document.');
   if(cut){if(!valid(token)){notify('Copied, but the operation was cancelled or the document changed; nothing was cut.');return false}editor.chain().focus().deleteSelection().run()}
   return true;
  }catch(error){notify(error.message||'Clipboard access was denied. Use your keyboard shortcut in the document.');return false}
 }
 async function paste(mode='original'){
  const token=capture();try{
   let html='',text='';if(navigator.clipboard?.read){for(const item of await navigator.clipboard.read()){if(item.types.includes('text/html'))html=await(await item.getType('text/html')).text();if(item.types.includes('text/plain'))text=await(await item.getType('text/plain')).text()}}
   else if(navigator.clipboard?.readText)text=await navigator.clipboard.readText();else throw Error('Clipboard reading is unavailable.');
   return insert({getData:type=>type==='text/html'?html:text},mode,token);
  }catch{notify('Paste permission is unavailable. Focus the document and use Ctrl/⌘ V (Ctrl/⌘ Shift V for text only).');return false}
 }
 return {copy,paste,insert,cancel,keydown,handlePaste(data){const mode=plainIntent?'text':'original';plainIntent=false;return insert(data,mode)}};
}
