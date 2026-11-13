import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import DOMPurify from 'dompurify';
import {decodeScene,sceneKey} from './design-model.mjs';
import {createSanitizer,validateDocxArchive,DOCX_INPUT_LIMIT} from './file-safety.mjs';
import {normalizeLayout} from './document-model.mjs';
import {finalDocumentJSON} from './review.mjs';
const PART='customXml/slateForgeReview.xml',NS='urn:slate-forge:review:1',REL='http://schemas.openxmlformats.org/package/2006/relationships',TYPES='http://schemas.openxmlformats.org/package/2006/content-types',MAX_DATA=10000000;
const sanitizers=new WeakMap();
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
function parse(text,Parser){if(/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text))throw Error('Review metadata XML declarations are unsupported.');const xml=new Parser().parseFromString(text,'application/xml');if(xml.doctype||xml.getElementsByTagName('parsererror').length)throw Error('Review metadata XML is invalid.');return xml}
const serialize=xml=>globalThis.XMLSerializer?new XMLSerializer().serializeToString(xml):xml.documentElement.outerHTML;
async function fingerprint(files,api){
 if(!api?.subtle)throw Error('DOCX review metadata requires local hashing support.');const hashes=[];let total=0;
 for(const name of Object.keys(files).filter(name=>name!==PART).sort()){total+=files[name].length;if(total>30000000)throw Error('The DOCX package exceeds the 30 MB import limit.');const hash=new Uint8Array(await api.subtle.digest('SHA-256',files[name]));hashes.push([name,Array.from(hash,byte=>byte.toString(16).padStart(2,'0')).join('')])}
 return Array.from(new Uint8Array(await api.subtle.digest('SHA-256',strToU8(JSON.stringify(hashes)))),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function needsReviewTree(content){let found=false,visited=0;function walk(node,inside=false,depth=0){if(depth>100||++visited>100000)throw Error('Document review structure exceeds supported limits.');if(inside&&(node.type==='blockRevision'||node.attrs?.rowChange||node.attrs?.paragraphBoundaryChange||node.marks?.some(mark=>mark.type==='reviewChange')))found=true;for(const child of node.content||[])walk(child,inside||node.type==='blockRevision',depth+1)}walk(content);return found}
export function wordReviewProjection(content){
 function visit(node){if(node.type==='blockRevision'){const view=finalDocumentJSON({type:'doc',content:node.content||[]});return {...node,content:view.content?.length?view.content:[{type:'paragraph'}]}}return {...node,...(node.content?{content:node.content.map(visit)}:{})}}return visit(content);
}
export function reviewHTMLSnapshot(html,images,{Parser=globalThis.DOMParser,nativeDesigns=false,editableDesigns=true}={}){
 if(typeof html!=='string'||!html)throw Error('Nested DOCX review requires the current HTML snapshot.');if(!nativeDesigns&&editableDesigns!==false)return html;if(!Parser)throw Error('Image-only nested review export is unavailable.');const xml=new Parser().parseFromString(html,'text/html');
 for(const canvas of xml.querySelectorAll('[data-forge-design]')){const scene=decodeScene(canvas.getAttribute('data-forge-design')),preview=images.get(sceneKey(scene));if(!preview?.data)throw Error('A canvas preview is required for nested review in image-only or native mode.');let binary='';for(let index=0;index<preview.data.length;index+=16384)binary+=String.fromCharCode(...preview.data.subarray(index,index+16384));const image=xml.createElement('img');image.setAttribute('src','data:image/'+(preview.type||'png')+';base64,'+btoa(binary));image.setAttribute('alt',scene.title);canvas.replaceWith(image)}return xml.body.innerHTML;
}
export async function attachReviewTree(bytes,html,layout,{Parser=globalThis.DOMParser,api=globalThis.crypto}={}){
 if(!Parser||typeof html!=='string'||!html||strToU8(html).length>MAX_DATA)throw Error('Nested DOCX review requires an HTML snapshot under 10 MB.');validateDocxArchive(bytes);const files=unzipSync(bytes);
 const relPath='word/_rels/document.xml.rels',rels=parse(files[relPath]?strFromU8(files[relPath]):'<Relationships xmlns="'+REL+'"/>',Parser),ids=new Set([...rels.documentElement.children].map(node=>node.getAttribute('Id')));let id='rIdSlateForgeReview';while(ids.has(id))id+='X';const relationship=rels.createElementNS(REL,'Relationship');relationship.setAttribute('Id',id);relationship.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml');relationship.setAttribute('Target','../'+PART);rels.documentElement.append(relationship);files[relPath]=strToU8(serialize(rels));
 const types=parse(strFromU8(files['[Content_Types].xml']),Parser);if(![...types.documentElement.children].some(node=>node.getAttribute('PartName')==='/'+PART)){const type=types.createElementNS(TYPES,'Override');type.setAttribute('PartName','/'+PART);type.setAttribute('ContentType','application/xml');types.documentElement.append(type)}files['[Content_Types].xml']=strToU8(serialize(types));
 const hash=await fingerprint(files,api);files[PART]=strToU8('<sf:review xmlns:sf="'+NS+'" version="1" package-sha256="'+hash+'"><sf:html>'+escape(html)+'</sf:html><sf:layout>'+escape(JSON.stringify(normalizeLayout(layout)))+'</sf:layout></sf:review>');
 if(files[PART].length>MAX_DATA||Object.values(files).reduce((size,file)=>size+file.length,0)>30000000)throw Error('Nested review data exceeds the supported DOCX package size. Reduce embedded images or use a workspace backup.');
 const result=zipSync(files);if(result.length>DOCX_INPUT_LIMIT)throw Error('The DOCX exceeds the 20 MB import limit. Reduce embedded images or use a workspace backup.');validateDocxArchive(result);return result;
}
export async function restoreReviewTree(files,Parser,warnings=[],{api=globalThis.crypto,purifier=DOMPurify}={}){
 if(!files[PART])return null;
 try{
  if(files[PART].length>MAX_DATA)throw Error('The review snapshot exceeds 10 MB.');const xml=parse(strFromU8(files[PART]),Parser),root=xml.documentElement;
  if(root.namespaceURI!==NS||root.localName!=='review'||root.getAttribute('version')!=='1')throw Error('Unsupported review metadata version.');
  const hash=root.getAttribute('package-sha256');if(!/^[a-f\d]{64}$/.test(hash||'')||await fingerprint(files,api)!==hash)throw Error('The DOCX was changed outside this review snapshot.');
  const html=[...root.children].filter(node=>node.namespaceURI===NS&&node.localName==='html'),layout=[...root.children].filter(node=>node.namespaceURI===NS&&node.localName==='layout');if(html.length!==1||layout.length!==1||!purifier?.sanitize)throw Error('The review snapshot cannot be restored safely in this environment.');
  if(!sanitizers.has(purifier))sanitizers.set(purifier,createSanitizer(purifier));const sanitized=sanitizers.get(purifier)(html[0].textContent,{preserveTableWidths:true}),document=new Parser().parseFromString(sanitized,'text/html'),stack=[{node:document.body,depth:0,layers:0}];let count=0;
  while(stack.length){const {node,depth,layers}=stack.pop();if(++count>100000||depth>100||layers>20)throw Error('The review snapshot exceeds supported nesting limits.');for(const child of node.children)stack.push({node:child,depth:depth+1,layers:layers+(child.hasAttribute('data-forge-block-change')?1:0)})}
  if(!document.querySelector('[data-forge-block-change]'))throw Error('The review snapshot has no structural suggestions.');
  warnings.push('Nested Slate Forge review was restored. Word presents the outer review layer; review the full suggestion tree in Slate Forge.');return {html:document.body.innerHTML,layout:normalizeLayout(JSON.parse(layout[0].textContent))};
 }catch(error){warnings.push('Stored nested review was ignored: '+error.message+' The current Word content was imported instead.');return null}
}
