import {bodyText} from './workspace-discovery.mjs';
import {normalizeLanguage} from './writing-tools.mjs';
import {styleKey} from './document-styles.mjs';
export const FONTS = ['Georgia','Arial','Verdana','Times New Roman','Courier New','system-ui'];
export function normalizeLayout(value={}) {
  if(!value||typeof value!=='object'||Array.isArray(value))value={};
  return {headingColor:/^#[a-f\d]{6}$/i.test(value.headingColor||'')?value.headingColor:null,trackChanges:value.trackChanges===true,reviewAuthor:String(value.reviewAuthor||'Reviewer').slice(0,80),language:normalizeLanguage(value.language),theme:styleKey(value.theme),size:value.size==='Letter'?'Letter':'A4',orientation:value.orientation==='landscape'?'landscape':'portrait',
    margin:[15,22,30].includes(Number(value.margin))?Number(value.margin):22,
    font:FONTS.includes(value.font)?value.font:'Georgia',line:['1.3','1.65','2'].includes(String(value.line))?String(value.line):'1.65',
    header:String(value.header||'').slice(0,120),footer:String(value.footer||'').slice(0,120),pageNumbers:value.pageNumbers===true};
}
// Search text within a block, including across mark boundaries, without crossing
// paragraph boundaries or non-text inline nodes. Indices are ProseMirror positions.
export function findMatches(doc, query, matchCase=false, {wholeWord=false,scope=null}={}) {
  if(!query) return [];
  let matches=[];
  doc.descendants((block,pos)=>{
    if(!block.isTextblock) return;
    let text='',positions=[];
    block.descendants((node,offset)=>{
      if(node.isText){const deleted=node.marks.some(mark=>mark.type.name==='reviewChange'&&mark.attrs.kind==='delete');for(let i=0;i<node.text.length;i++){text+=deleted?'\ufffc':node.text[i];positions.push(deleted?null:pos+1+offset+i)}}
      else if(node.isLeaf){text+='\ufffc';positions.push(null)}
    });
    // Unicode regex preserves original indices even when case folding changes length.
    let escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const pattern=new RegExp(escaped,matchCase?'gu':'giu');
    for(let match of text.matchAll(pattern)){
      let start=match.index,end=start+match[0].length;
      const from=positions[start],to=positions[end-1]+1;const word=char=>!!char&&/[\p{L}\p{N}\p{M}_]/u.test(char);const before=[...text.slice(Math.max(0,start-2),start)].at(-1),after=[...text.slice(end,end+2)][0];
      if(wholeWord&&(word(before)||word(after)))continue;
      if(scope&&(from<scope.from||to>scope.to))continue;
      if(positions.slice(start,end).every(p=>p!==null))matches.push({from,to});
    }
    return false;
  });
  return matches;
}
export function persistSession(storage,key,state){try{storage.setItem(key,JSON.stringify(state));return {saved:true}}catch(error){return {saved:false,error}}}
export function normalizeWordGoal(value){let goal=Number(value);return Number.isInteger(goal)&&goal>=0&&goal<=100000?goal:0}
export function textStatistics(text){
 let words=0,characters=0,charactersWithoutSpaces=0;
 if(typeof Intl.Segmenter==='function'){
  for(let segment of new Intl.Segmenter('en',{granularity:'word'}).segment(text))if(segment.isWordLike)words++;
  for(let segment of new Intl.Segmenter('en',{granularity:'grapheme'}).segment(text)){characters++;if(!/^\s+$/u.test(segment.segment))charactersWithoutSpaces++}
 }else{words=(text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)||[]).length;for(let character of text){characters++;if(!/\s/u.test(character))charactersWithoutSpaces++}}
 return {words,characters,charactersWithoutSpaces,readingMinutes:words?Math.ceil(words/200):0};
}
export function documentOutline(doc){let result=[];doc.descendants((node,pos)=>{if(node.type.name==='heading')result.push({pos,level:node.attrs.level||1,title:bodyText(node).trim()||'Untitled heading'})});return result}
export function documentStatistics(doc){let paragraphs=0;doc.descendants(node=>{if(node.type.name==='paragraph'&&bodyText(node).trim())paragraphs++});return {...textStatistics(bodyText(doc)),paragraphs,headings:documentOutline(doc).length}}
