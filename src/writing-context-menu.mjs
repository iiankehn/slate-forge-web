import {commandLabel} from './command-labels.mjs';
import {TextSelection} from '@tiptap/pm/state';
export function writingSelectionContext(target,root,document){
 if(!root||document.querySelector('dialog[open]'))return false;
 if(target?.closest?.('input,textarea,select,[role=dialog]'))return false;
 const editable=target?.closest?.('[contenteditable="true"],[contenteditable=""],[contenteditable="plaintext-only"]');if(editable&&editable!==root)return false;
 return root.contains(target)||!!target?.closest?.('.workspace')||!!target?.closest?.('#applicationMenus,.toolbar,.app-header,.writing-context-menu')||target===document.body;
}
export function initWritingContextMenu({getEditor,onAction,isAvailable=()=>true,document=globalThis.document}){
 const menu=document.createElement('div');menu.className='writing-context-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Writing commands');menu.hidden=true;document.body.append(menu);
 const entries=[['Undo','command:undo'],['Redo','command:redo'],['Cut','clipboard:cut'],['Copy','clipboard:copy'],['Paste · keep original','clipboard:paste'],['Paste · merge formatting','clipboard:merge'],['Paste · text only','clipboard:text'],['Select all','selectAll'],['Link…','link'],['Clear text formatting','clearFormatting']];
 function close(focus=false){if(menu.hidden)return;menu.hidden=true;if(focus)getEditor()?.view.focus()}
 function open(event,keyboard=false){const editor=getEditor(),root=editor?.view.dom;if(event.shiftKey&&!keyboard)return;if(!root||!root.contains(event.target)||!writingSelectionContext(event.target,root,document))return;event.preventDefault();
  if(!keyboard){const hit=editor.view.posAtCoords({left:event.clientX,top:event.clientY}),s=editor.state.selection;if(hit&&(hit.pos<s.from||hit.pos>s.to))editor.view.dispatch(editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(hit.pos))))}
  const capturedDoc=editor.state.doc,capturedSelection=editor.state.selection;menu.replaceChildren();for(const [label,action]of entries){const button=document.createElement('button');button.type='button';button.tabIndex=-1;commandLabel(button,label,action);button.setAttribute('role','menuitem');button.disabled=!isAvailable(action)||(['clipboard:copy','clipboard:cut'].includes(action)&&editor.state.selection.empty);button.onmousedown=e=>e.preventDefault();button.onclick=()=>{close(true);if(getEditor()===editor&&!editor.isDestroyed&&editor.state.doc===capturedDoc&&editor.state.selection.eq(capturedSelection)&&!document.querySelector('dialog[open]'))onAction(action)};menu.append(button)}
  menu.hidden=false;let x=event.clientX,y=event.clientY;if(keyboard){const rect=editor.view.coordsAtPos(editor.state.selection.from);x=rect.left;y=rect.bottom}
  const rect=menu.getBoundingClientRect(),win=document.defaultView;menu.style.left=Math.max(4,Math.min(x,win.innerWidth-rect.width-4))+'px';menu.style.top=Math.max(4,Math.min(y,win.innerHeight-rect.height-4))+'px';menu.querySelector('button:not(:disabled)')?.focus();
 }
 document.addEventListener('contextmenu',e=>open(e));document.addEventListener('keydown',e=>{if((e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey)&&!e.isComposing){open(e,true);return}if(menu.hidden)return;if(e.ctrlKey||e.metaKey){close(true);return}const buttons=[...menu.querySelectorAll('button:not(:disabled)')];if(e.key==='Escape'){e.preventDefault();close(true)}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const i=buttons.indexOf(document.activeElement);buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()}else if(e.key==='Tab')close(true)});
 document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))close()});document.addEventListener('scroll',event=>{if(!menu.contains(event.target))close()},true);document.defaultView.addEventListener('resize',()=>close());document.defaultView.addEventListener('blur',()=>close());return {close};
}
