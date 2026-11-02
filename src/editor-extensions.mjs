import {textDirection} from './text-direction.mjs';
import {Extension,Node,mergeAttributes} from '@tiptap/core';
import {Plugin,PluginKey} from '@tiptap/pm/state';
import {Decoration,DecorationSet} from '@tiptap/pm/view';
import {findMatches} from './document-model.mjs';
export const searchKey=new PluginKey('documentSearch');
export const SearchHighlight=Extension.create({name:'searchHighlight',addProseMirrorPlugins(){return [new Plugin({key:searchKey,state:{init:()=>({query:'',matchCase:false,wholeWord:false,scope:null,capture:null,decorations:DecorationSet.empty}),apply(tr,previous){
 const meta=tr.getMeta(searchKey),options={...previous,...meta};
 if(tr.docChanged&&options.capture&&!(meta&&Object.hasOwn(meta,'capture')))options.capture={from:tr.mapping.map(options.capture.from,-1),to:tr.mapping.map(options.capture.to,1)};
 if(tr.docChanged&&options.scope&&!(meta&&Object.hasOwn(meta,'scope')))options.scope={from:tr.mapping.map(options.scope.from,-1),to:tr.mapping.map(options.scope.to,1)};
 if(!tr.docChanged&&options.query===previous.query&&options.matchCase===previous.matchCase&&options.wholeWord===previous.wholeWord&&options.scope===previous.scope&&options.capture===previous.capture)return previous;
 return {...options,decorations:DecorationSet.create(tr.doc,findMatches(tr.doc,options.query,options.matchCase,options).map(m=>Decoration.inline(m.from,m.to,{class:'search-match'})))}
 }},props:{decorations(state){return searchKey.getState(state).decorations}}})]}});
export const ParagraphDesign=Extension.create({name:'paragraphDesign',addGlobalAttributes(){return [{types:['paragraph','heading'],attributes:{
  textDirection:{default:'auto',parseHTML:el=>textDirection(el.getAttribute('dir')),renderHTML:a=>({dir:textDirection(a.textDirection)})},
  widowControl:{default:true,parseHTML:el=>el.getAttribute('data-widow-control')!=='false',renderHTML:a=>a.widowControl===false?{'data-widow-control':'false',style:'orphans:1;widows:1'}:{style:'orphans:2;widows:2'}},
  keepTogether:{default:false,parseHTML:el=>el.getAttribute('data-keep-together')==='true',renderHTML:a=>a.keepTogether===true?{'data-keep-together':'true',style:'break-inside:avoid'}:{}},
  keepWithNext:{default:false,parseHTML:el=>el.getAttribute('data-keep-next')==='true',renderHTML:a=>a.keepWithNext===true?{'data-keep-next':'true',style:'break-after:avoid'}:{}},
  pageBreakBefore:{default:false,parseHTML:el=>el.getAttribute('data-break-before')==='true',renderHTML:a=>a.pageBreakBefore===true?{'data-break-before':'true',style:'break-before:page'}:{}},
  paragraphSpacing:{default:null,parseHTML:el=>['0pt','6pt','12pt','18pt','24pt'].includes(el.style.marginBottom)?el.style.marginBottom:null,renderHTML:a=>a.paragraphSpacing?{style:`margin-bottom:${a.paragraphSpacing}`} :{}},
  paragraphLine:{default:null,parseHTML:el=>['1.3','1.65','2'].includes(el.style.lineHeight)?el.style.lineHeight:null,renderHTML:a=>a.paragraphLine?{style:`line-height:${a.paragraphLine}`} :{}},
  indent:{default:0,parseHTML:el=>Math.min(6,Math.max(0,Math.round(parseFloat(el.style.marginLeft||'0')/24))),renderHTML:a=>a.indent?{style:`margin-left:${Math.min(6,Math.max(0,a.indent))*24}pt`}: {}}
}}]}});
export const PageBreak=Node.create({name:'pageBreak',group:'block',atom:true,selectable:true,parseHTML(){return [{tag:'div[data-page-break]'}]},renderHTML({HTMLAttributes}){return ['div',mergeAttributes(HTMLAttributes,{'data-page-break':'true',class:'page-break',contenteditable:'false','aria-label':'Page break'}),['span','Page break']]}});
export const FocusParagraph=Extension.create({name:'focusParagraph',addProseMirrorPlugins(){return [new Plugin({props:{decorations(state){let from=state.selection.$from;if(!from.depth)return null;let start=from.before(1),node=state.doc.nodeAt(start);return node?DecorationSet.create(state.doc,[Decoration.node(start,start+node.nodeSize,{class:'focus-block'})]):null}}})]}});
