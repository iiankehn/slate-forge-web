// One command catalog supplies the desktop menu bar and the mobile menu dialog.
export const APP_MENUS=[
 ['File',[
  ['New document','new'],['Open a file…','import'],['Save on this device','saveNow','Ctrl/⌘ S'],['Documents…','documents'],null,
  ['Export document…','export'],['Print / Save as PDF…','export:print'],['Version history…','export:history'],['Duplicate document','export:duplicate'],null,
  ['Export workspace backup','backup'],['Encrypted workspace backup…','encryptedBackup'],['Device storage…','deviceStorage'],['Encrypted recovery…','recovery'],['Recently deleted…','trash'],['End session…','end']]],
 ['Edit',[
  ['Undo','command:undo','Ctrl/⌘ Z'],['Redo','command:redo','Ctrl/⌘ Shift Z'],null,['Find and replace','find','Ctrl/⌘ F'],['Select all text','selectAll','Ctrl/⌘ A'],['Command search…','commands','Ctrl/⌘ K']]],
 ['View',[
  ['Paged editing','pagedEditing'],['Continuous editing','continuousEditing'],['Go to page…','goToPage'],['Previous page','previousPage'],['Next page','nextPage'],['Page preview…','pagePreview'],['Appearance…','appearance'],['Focus mode','focus'],['Document outline','outline'],['Documents…','documents'],null,['Fit page width','zoomFit'],['Zoom in','zoomIn'],['Zoom out','zoomOut'],['Actual size · 100%','zoomReset']]],
 ['Insert',[
  ['Image…','insert:image'],['Table','insert:table'],['Link…','link'],['Design canvas / drawing…','designCanvas'],null,
  ['Table of contents…','insert:insertTOC'],['Footnote…','insert:insertFootnote'],['Symbols and date…','insert:insertSymbol'],['Section / columns…','productivity:insertColumnSection'],null,
  ['Quotation','insert:quote'],['Divider','insert:rule'],['Page break','insert:pageBreak']]],
 ['Format',[
  ['Bold','command:bold','Ctrl/⌘ B'],['Italic','command:italic','Ctrl/⌘ I'],['Underline','command:underline','Ctrl/⌘ U'],['Strikethrough','command:strike'],['Superscript','command:superscript'],['Subscript','command:subscript'],['Code block','command:codeBlock'],null,
  ['Font and text style…','fontSettings'],['Paragraph settings','paragraph'],['Document styles and page design','layout'],['Heading color…','productivity']]],
 ['Tools',[
  ['Word count and writing goal…','stats'],['Document checks…','documentChecks'],['Writing tools…','writingTools'],['Snippets and custom templates…','productivity'],['Design templates…','productivity:openDesignTemplates'],null,
  ['PDF & forms…','pdfTools'],['Scan & OCR…','ocrTools'],null,
  ['Getting started…','gettingStarted'],['Offline preparation…','offlineTools'],['App status…','appStatus'],['Install app…','installApp'],['Update app','updateApp'],['Workspace privacy…','privacy'],['Open-source licenses','licenses'],['Keyboard shortcuts…','shortcuts']]],
 ['Review',[
  ['Comments and tracked changes…','reviewTools'],['Comment on selection…','reviewTools:addComment'],['Track changes settings…','reviewTools'],['Compare documents…','reviewTools:compareDocs']]]
];
export function initAppMenus({onAction,isAvailable=()=>true}){
 const nav=document.createElement('nav');nav.id='applicationMenus';nav.setAttribute('aria-label','Application menus');
 const mount=document.getElementById('menuMount'),dialog=document.getElementById('menuDialog'),toggle=document.getElementById('menuToggle'),mobile=matchMedia('(max-width:760px)');
 let active=-1,origin=null;const categories=[];
 for(const [index,[name,items]]of APP_MENUS.entries()){
  const group=document.createElement('div');group.className='app-menu-group';const trigger=document.createElement('button');trigger.className='app-menu-trigger';trigger.textContent=name;trigger.setAttribute('aria-label',name);trigger.id='app-menu-'+index;trigger.setAttribute('aria-controls','app-menu-panel-'+index);trigger.setAttribute('aria-expanded','false');
  const panel=document.createElement('div');panel.className='app-menu-panel';panel.id='app-menu-panel-'+index;panel.hidden=true;panel.setAttribute('role','menu');panel.setAttribute('aria-labelledby',trigger.id);
  for(const item of items){if(!item){const separator=document.createElement('div');separator.setAttribute('role','separator');panel.append(separator);continue}const [label,action,shortcut]=item,button=document.createElement('button');button.setAttribute('role','menuitem');button.setAttribute('aria-label',label);button.dataset.menuAction=action;const text=document.createElement('span');text.textContent=label;button.append(text);if(shortcut){const hint=document.createElement('kbd');hint.textContent=shortcut;button.append(hint)}button.onclick=()=>{close(true);onAction(action)};panel.append(button)}
  trigger.onclick=()=>active===index?collapse():open(index);trigger.onpointerenter=()=>{if(!mobile.matches&&active>=0&&active!==index)open(index)};trigger.onfocus=()=>{if(!mobile.matches)categories.forEach((c,i)=>c.trigger.tabIndex=i===index?0:-1)};group.append(trigger,panel);nav.append(group);categories.push({trigger,panel});
 }
 function refresh(){nav.querySelectorAll('[data-menu-action]').forEach(button=>button.disabled=!isAvailable(button.dataset.menuAction))}
 function collapse(){for(const {trigger,panel}of categories){trigger.setAttribute('aria-expanded','false');panel.hidden=true}active=-1}
 function open(index,focusItem=false){if(active<0&&!dialog.open)origin=document.activeElement;collapse();refresh();active=index;const {trigger,panel}=categories[index];trigger.setAttribute('aria-expanded','true');panel.hidden=false;if(focusItem)panel.querySelector('button:not(:disabled)')?.focus()}
 function close(restore=false){const previous=active;collapse();if(dialog.open)dialog.close();toggle.setAttribute('aria-expanded','false');if(restore){if(mobile.matches)toggle.focus();else if(origin?.isConnected)origin.focus();else categories[previous]?.trigger.focus()}}
 function layout(){close();if(mobile.matches){dialog.querySelector('.mobile-menu-content').append(nav);nav.removeAttribute('role')}else{mount.append(nav);nav.setAttribute('role','menubar')}categories.forEach(({trigger},i)=>{if(mobile.matches){trigger.removeAttribute('role');trigger.removeAttribute('aria-haspopup')}else{trigger.setAttribute('role','menuitem');trigger.setAttribute('aria-haspopup','menu')}trigger.tabIndex=mobile.matches||i===0?0:-1})}
 toggle.onclick=()=>{origin=document.activeElement;dialog.showModal();toggle.setAttribute('aria-expanded','true');collapse();refresh();categories[0].trigger.focus()};document.getElementById('closeMenu').onclick=()=>close(true);dialog.addEventListener('cancel',event=>{event.preventDefault();close(true)});dialog.addEventListener('click',event=>{if(event.target===dialog)close(true)});dialog.addEventListener('close',()=>{collapse();toggle.setAttribute('aria-expanded','false')});
 nav.addEventListener('keydown',event=>{const trigger=event.target.closest('.app-menu-trigger'),panel=event.target.closest('.app-menu-panel'),index=categories.findIndex(c=>c.trigger===trigger);if(event.key==='Escape'){event.preventDefault();if(mobile.matches)close(true);else{const button=categories[active]?.trigger;collapse();button?.focus()}return}if(!mobile.matches&&event.key==='Tab'){close();return}
  if(trigger){if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open(index,true);if(event.key==='ArrowUp')categories[index].panel.querySelectorAll('button:not(:disabled)').item(categories[index].panel.querySelectorAll('button:not(:disabled)').length-1)?.focus()}if(!mobile.matches&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?categories.length-1:(index+(event.key==='ArrowRight'?1:-1)+categories.length)%categories.length;if(active>=0)open(next);categories[next].trigger.focus()}return}
  if(panel){const buttons=[...panel.querySelectorAll('button:not(:disabled)')],position=buttons.indexOf(event.target);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(position+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()}if(!mobile.matches&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();open((active+(event.key==='ArrowRight'?1:-1)+categories.length)%categories.length,true)}}
 });
 document.addEventListener('pointerdown',event=>{if(!mobile.matches&&!nav.contains(event.target))close()});document.addEventListener('focusin',event=>{if(!mobile.matches&&active>=0&&!nav.contains(event.target))close()});mobile.addEventListener('change',layout);layout();return {close,refresh};
}
