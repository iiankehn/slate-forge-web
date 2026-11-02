// Complete command catalog retained for search; the ribbon curates everyday tasks.
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
// The catalog remains the source for command search. The ribbon presents a
// smaller set of everyday tasks without duplicating editor controls or state.
export const RIBBON_TABS=[
 ['Home',[['Document',[['Save','saveNow'],['Undo','command:undo'],['Redo','command:redo']]],['Writing',[['Find & replace','find'],['Link','link'],['Word count','stats']]]]],
 ['Insert',[['Add to your page',[['Image','insert:image'],['Table','insert:table'],['Link','link']]],['Structure',[['Page break','insert:pageBreak'],['Contents','insert:insertTOC'],['Footnote','insert:insertFootnote']]]]],
 ['Layout',[['Page',[['Page design','layout'],['Paragraph','paragraph'],['Sections & columns','productivity:insertColumnSection']]],['Output',[['Page preview','pagePreview'],['Print / PDF','export:print']]]]],
 ['Review',[['Review your writing',[['Comments & changes','reviewTools'],['Add comment','reviewTools:addComment'],['Compare','reviewTools:compareDocs']]],['Finish',[['Document checks','documentChecks'],['Writing tools','writingTools']]]]],
 ['View',[['Workspace',[['Continuous','continuousEditing'],['Paged','pagedEditing'],['Focus','focus']]],['Comfort',[['Appearance','appearance'],['Fit width','zoomFit'],['100%','zoomReset'],['Outline','outline']]],['Navigate',[['Go to page','goToPage'],['Previous','previousPage'],['Next','nextPage']]]]],
 ['Tools',[['Other file tools',[['PDF & forms','pdfTools'],['Scan & OCR','ocrTools'],['Drawing','designCanvas']]],['Reusable work',[['Snippets & templates','productivity'],['Design templates','productivity:openDesignTemplates']]],['App',[['Prepare offline','offlineTools'],['App status','appStatus'],['Install','installApp'],['Update','updateApp'],['Command search','commands']]]]]
];
export function initAppMenus({onAction,isAvailable=()=>true}){
 const mount=document.getElementById('menuMount'),nav=document.createElement('section');nav.id='applicationMenus';nav.className='forge-ribbon';nav.setAttribute('aria-label','Writing ribbon');
 const tabs=document.createElement('div');tabs.className='ribbon-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Ribbon sections');
 const file=document.createElement('button');file.type='button';file.className='ribbon-workspace';file.id='backstageToggle';file.textContent='Workspace';file.setAttribute('aria-haspopup','dialog');file.onclick=()=>onAction('backstage');nav.append(file,tabs);
 const panels=document.createElement('div');panels.className='ribbon-panels';nav.append(panels);let active='Home';
 const categories=[];
 function refresh(){nav.querySelectorAll('[data-menu-action]').forEach(button=>button.disabled=!isAvailable(button.dataset.menuAction))}
 function select(name,focus=false){active=name;nav.classList.remove('ribbon-collapsed');for(const entry of categories){const selected=entry.name===name;entry.trigger.setAttribute('aria-selected',String(selected));entry.trigger.tabIndex=selected?0:-1;entry.panel.hidden=!selected;if(selected&&focus)entry.trigger.focus()}refresh();toggle?.setAttribute('aria-expanded','true')}
 for(const [index,[name,groups]]of RIBBON_TABS.entries()){
  const trigger=document.createElement('button');trigger.type='button';trigger.className='app-menu-trigger';trigger.id='ribbon-tab-'+index;trigger.textContent=name;trigger.setAttribute('role','tab');trigger.setAttribute('aria-controls','ribbon-panel-'+index);trigger.onclick=()=>select(name);
  const panel=document.createElement('div');panel.className='ribbon-panel';panel.id='ribbon-panel-'+index;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',trigger.id);
  if(name==='Home'){const formatting=document.querySelector('.toolbar');if(formatting){const group=document.createElement('div');group.className='ribbon-group ribbon-formatting';const label=document.createElement('span');label.className='ribbon-group-label';label.textContent='Text & paragraph';group.append(formatting,label);panel.append(group)}}
  for(const [label,commands]of groups){const group=document.createElement('div');group.className='ribbon-group';group.setAttribute('role','group');group.setAttribute('aria-label',label);const controls=document.createElement('div');controls.className='ribbon-commands';
   for(const [title,action]of commands){const button=document.createElement('button');button.type='button';button.dataset.menuAction=action;button.textContent=title;button.onclick=()=>onAction(action);controls.append(button)}const caption=document.createElement('span');caption.className='ribbon-group-label';caption.textContent=label;group.append(controls,caption);panel.append(group)}
  tabs.append(trigger);panels.append(panel);categories.push({name,trigger,panel});
 }
 const toggle=document.getElementById('menuToggle');if(toggle){toggle.textContent='⌃';toggle.setAttribute('aria-label','Collapse or expand ribbon');toggle.setAttribute('aria-controls','applicationMenus');toggle.onclick=()=>{const collapsed=nav.classList.toggle('ribbon-collapsed');toggle.setAttribute('aria-expanded',String(!collapsed))}}
 tabs.addEventListener('keydown',event=>{const index=categories.findIndex(entry=>entry.trigger===event.target);if(index<0)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?categories.length-1:(index+(event.key==='ArrowRight'?1:-1)+categories.length)%categories.length;select(categories[next].name,true)}if(event.key==='Escape'){event.preventDefault();document.getElementById('document-content')?.focus()}});
 mount.append(nav);select(active);return {close(){},refresh,select,get active(){return active}};
}
