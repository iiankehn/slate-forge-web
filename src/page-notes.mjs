import {decodeNote} from './references.mjs';
export function collectPageNotes(root){const notes=new Map();for(const marker of root.querySelectorAll('[data-forge-footnote]')){const number=Number(marker.getAttribute('data-note-number')||marker.textContent),text=decodeNote(marker.getAttribute('data-note-text'));if(!Number.isInteger(number)||number<1||number>10000)throw Error('Footnote numbering is invalid. Reopen the document before previewing.');if(notes.has(number)&&notes.get(number).text!==text)throw Error('Conflicting footnote numbers. Reopen the document before previewing.');notes.set(number,{number,text})}if(notes.size>500)throw Error('Page-bottom notes are limited to 500 references. Use endnotes for this document.');return [...notes.values()]}
export function pageNoteSection(notes,owner=document){const section=owner.createElement('section');section.className='forge-footnotes preview-page-notes';section.setAttribute('aria-label','Page footnotes');const heading=owner.createElement('h2');heading.textContent='Notes';const list=owner.createElement('ol');for(const note of notes){const item=owner.createElement('li');item.value=note.number;item.dataset.noteNumber=String(note.number);if(note.continued){item.dataset.noteContinued='true';item.setAttribute('aria-label','Note '+note.number+' continued');const label=owner.createElement('span');label.className='note-continuation-label';label.textContent='(continued) ';item.append(label)}const text=owner.createElement('span');text.className='note-fragment';text.textContent=note.text;item.append(text);list.append(item)}section.append(heading,list);return section}

export const PAGE_NOTE_CSS='.live-page-notes-accessible:not(:focus-within){position:absolute!important;width:1px;height:1px;padding:0!important;margin:0!important;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap}';

// Fit literal note fragments by measured height. No saved note text is changed.
// Continuations retain the number and position of their original reference.
export function allocatePageNotes(notes,limit,measure){
 if(!Number.isFinite(limit)||limit<=0)throw Error('Page footnotes have no available space. Increase the page size or reduce margins.');
 const items=[];let pending=[];const height=value=>{const result=value.length?measure(value):0;if(!Number.isFinite(result)||result<0)throw Error('Page footnotes could not be measured.');return result};
 for(let index=0;index<notes.length;index++){
  const note=notes[index];if(height([...items,note])<=limit+.5){items.push({...note});continue}
  const text=String(note.text||'');let low=1,high=text.length,best=0;
  while(low<=high){let cut=Math.floor((low+high)/2);if(cut<text.length&&/[\uDC00-\uDFFF]/.test(text[cut]))cut--;if(cut===0){low=2;continue}if(height([...items,{...note,text:text.slice(0,cut)}])<=limit+.5){best=cut;low=Math.max(low+1,cut+1)}else high=cut-1}
  if(best){const boundary=text.slice(0,best).search(/\s+\S*$/u);if(boundary>best*.65)best=boundary+1;items.push({...note,text:text.slice(0,best)});if(best<text.length)pending.push({...note,text:text.slice(best),continued:true})}
  else if(!items.length)throw Error('A footnote line is taller than the available note area. Reduce the note font or page margins.');
  else pending.push({...note});
  pending.push(...notes.slice(index+1).map(item=>({...item})));break;
 }
 return {notes:items,pending,height:height(items)};
}
