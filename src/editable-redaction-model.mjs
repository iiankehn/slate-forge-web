import {finalDocumentJSON} from './review.mjs';
import {formattingSnapshot,paragraphSnapshot} from './format-review.mjs';
import {normalizeLayout} from './document-model.mjs';
import {normalizeImageDesign,normalizeTableDesign} from './object-design.mjs';
import {sectionAttrs} from './sections.mjs';
import {normalizeScene} from './design-model.mjs';
export const EDITABLE_REDACTION_LIMITS=Object.freeze({nodes:30000,text:1000000,media:100,sourceBytes:40000000});
const leaves=new Set(['image','designCanvas','hardBreak','horizontalRule','pageBreak','tableOfContents']);
const containers=new Set(['doc','paragraph','heading','blockquote','bulletList','orderedList','listItem','codeBlock','table','tableRow','tableCell','tableHeader','columnSection']);
const p=text=>({type:'paragraph',content:[{type:'text',text}]});
const inline=text=>({type:'text',text:String(text||'')});
const bounded=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
export function cleanSharingScene(input){const scene=normalizeScene(input),groups=new Map();return normalizeScene({...scene,id:'sharing-canvas',title:'Sharing canvas',description:'',grid:false,snap:false,objects:scene.objects.filter(o=>!o.hidden).map((o,i)=>{if(o.group&&!groups.has(o.group))groups.set(o.group,'sharing-group-'+groups.size);return {...o,id:'sharing-object-'+i,group:o.group?groups.get(o.group):'',hidden:false,locked:false,text:o.type==='text'?o.text:'',...(o.type==='path'&&o.outlines?{points:[]}: {})}})})}
export function sharingLayout(settings){const l=normalizeLayout(settings);return {...l,header:'',footer:'',trackChanges:false,reviewAuthor:'Reviewer'}}
export async function prepareEditableSharingDocument(input,settings,{image,scene,signal}={}){
 if(!input||input.type!=='doc'||JSON.stringify(input).length>EDITABLE_REDACTION_LIMITS.sourceBytes)throw Error('The editable sharing snapshot exceeds its supported size.');
 const final=finalDocumentJSON(input);let nodes=0,text=0,media=0;
 function check(){if(signal?.aborted)throw new DOMException('Sharing copy cancelled.','AbortError');if(++nodes>EDITABLE_REDACTION_LIMITS.nodes)throw Error('The editable sharing copy exceeds 30,000 nodes.');}
 async function clean(node){check();if(!node)return null;const type=node.type,a=node.attrs||{};
  if(type==='footnote'){const value=String(a.text||'').replace(/\u0000/g,'').slice(0,4000);text+=value.length;if(text>EDITABLE_REDACTION_LIMITS.text)throw Error('The editable sharing copy exceeds one million text characters.');return inline('[Note: '+value+']')}
  if(type==='tableOfContents')return {type,attrs:{title:String(a.title||'Contents').slice(0,80),startDepth:Math.round(bounded(a.startDepth,1,6,1)),depth:Math.round(bounded(a.depth,1,6,3)),entries:[]}};
  if(type==='text'){const value=String(node.text||'');text+=value.length;if(text>EDITABLE_REDACTION_LIMITS.text)throw Error('The editable sharing copy exceeds one million text characters.');if(!value)return null;return {type:'text',text:value,marks:formattingSnapshot(node.marks||[]).filter(m=>m.type!=='link')}}
  if(type==='image'||type==='designCanvas'){if(++media>EDITABLE_REDACTION_LIMITS.media)throw Error('Use at most 100 media objects in an editable sharing copy.');if(type==='image'){if(!image)throw Error('Image sanitization is unavailable.');const attrs=await image({...normalizeImageDesign(a),src:a.src,alt:'',title:null},signal);check();return {type,attrs:{...normalizeImageDesign(attrs),src:attrs.src,alt:'',title:null}}}if(!scene)throw Error('Canvas sanitization is unavailable.');const value=await scene(cleanSharingScene(a.scene),signal);check();return {type,attrs:{scene:cleanSharingScene(value)}}}
  if(!containers.has(type)&&!leaves.has(type))throw Error('Unsupported editable sharing node: '+String(type));
  let attrs={};if(type==='paragraph'||type==='heading')attrs={...paragraphSnapshot(a),...(type==='heading'?{level:Math.round(bounded(a.level,1,6,1)),referenceIndex:0}:{})};
  if(type==='orderedList')attrs={start:Math.round(bounded(a.start,1,1000000,1))};
  if(type==='table')attrs=normalizeTableDesign(a);
  if(type==='tableCell'||type==='tableHeader')attrs={colspan:Math.round(bounded(a.colspan,1,100,1)),rowspan:Math.round(bounded(a.rowspan,1,100,1)),colwidth:Array.isArray(a.colwidth)?a.colwidth.slice(0,100).map(n=>Math.round(bounded(n,1,2000,100))):null};
  if(type==='columnSection')attrs={...sectionAttrs(a),header:'',footer:''};
  const content=[];for(const child of node.content||[]){const value=await clean(child);if(value)content.push(value)}
  if(type==='columnSection'){const furniture=sectionAttrs(a);if(furniture.header)content.unshift(await clean(p(furniture.header)));if(furniture.footer)content.push(await clean(p(furniture.footer)))}
  return {type,...(Object.keys(attrs).length?{attrs}:{}),...(containers.has(type)?{content}:{})};
 }
 const doc=await clean(final);const layout=normalizeLayout(settings);if(layout.header)doc.content.unshift(await clean(p(layout.header)));if(layout.footer)doc.content.push(await clean(p(layout.footer)));if(!doc.content.length)doc.content.push({type:'paragraph'});return {doc:rebuildSharingContents(doc),layout:sharingLayout(settings)};
}
export function sharingNodeSize(node){return node.type==='text'?node.text.length:leaves.has(node.type)?1:2+(node.content||[]).reduce((sum,n)=>sum+sharingNodeSize(n),0)}
export function redactSharingRange(input,from,to){const max=(input.content||[]).reduce((sum,n)=>sum+sharingNodeSize(n),0);if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<=from||to>max)throw Error('Select text or an object in the sharing copy.');let changed=false,inserted=false;
 function walk(node,pos){const end=pos+sharingNodeSize(node);if(end<=from||pos>=to)return structuredClone(node);if(node.type==='text'){const start=Math.max(0,from-pos),stop=Math.min(node.text.length,to-pos),before=node.text.slice(0,start),after=node.text.slice(stop);if(stop<=start)return structuredClone(node);changed=true;const marker=inserted?'':'[REDACTED]';inserted=true;const value=before+marker+after;return value?{...structuredClone(node),text:value}:null}
  if(node.type==='image'||node.type==='designCanvas'||node.type==='tableOfContents'){changed=true;return p('[REDACTED OBJECT]')}
  let at=pos+(node.type==='doc'?0:1);const content=[];for(const child of node.content||[]){const value=walk(child,at);at+=sharingNodeSize(child);if(value)content.push(value)}return {...structuredClone(node),...(containers.has(node.type)?{content}:{})};
 }
 const doc=walk(input,0);if(!changed)throw Error('The selected range contains no removable text or object.');return rebuildSharingContents(doc);
}

export function rebuildSharingContents(input){const doc=structuredClone(input),headings=[];function visit(node,pos){if(node.type==='heading'){node.attrs={...node.attrs,referenceIndex:headings.length+1};const title=(node.content||[]).map(n=>n.text||'').join('').slice(0,240)||'Untitled heading';headings.push({title,level:node.attrs.level,pos,index:headings.length+1})}let at=pos+(node.type==='doc'?0:1);for(const child of node.content||[]){visit(child,at);at+=sharingNodeSize(child)}}visit(doc,0);function rebuild(node){if(node.type==='tableOfContents'){const a=node.attrs||{},depth=Math.round(bounded(a.depth,1,6,3)),start=Math.min(depth,Math.round(bounded(a.startDepth,1,6,1)));node.attrs={title:String(a.title||'Contents').slice(0,80),depth,startDepth:start,entries:headings.filter(h=>h.level>=start&&h.level<=depth).slice(0,500)}}for(const child of node.content||[])rebuild(child)}rebuild(doc);return doc}
