import {fontFamily,fontCSS} from './font-families.mjs';
import {unzipSync} from 'fflate';
import {parseImageContour} from './image-shapes.mjs';
import {FONTS} from './document-model.mjs';
export function safeLink(value){if(typeof value==='string'&&/^#sf-(heading|note|ref)-[1-9]\d*$/.test(value))return true;if(typeof value!=='string'||/[\u0000-\u0020\u007f]/u.test(value))return false;try{let url=new URL(value);return ['http:','https:'].includes(url.protocol)?!!url.hostname:url.protocol==='mailto:'&&value.length>7}catch{return false}}
export function safeImage(value){return typeof value==='string'&&value.length<=2100000&&/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)}
function safeContourStyle(value){const match=/^polygon\(([^()]+)\)$/.exec(value);if(!match)return false;const pairs=match[1].split(',').map(pair=>pair.trim().split(/\s+/));if(pairs.some(pair=>pair.length!==2||pair.some(n=>!/^\d+(?:\.\d{1,2})?%$/.test(n))))return false;return !!parseImageContour(pairs.map(pair=>pair.map(n=>n.slice(0,-1)).join(',')).join(' '))}
export function safeStyle(style){let declarations=[];for(let [name,valid]of Object.entries({
 'font-family':v=>!!fontFamily(v),
 'font-size':v=>/^(\d+(\.\d+)?)pt$/.test(v)&&parseFloat(v)>=8&&parseFloat(v)<=72||/^(\d+(\.\d+)?)px$/.test(v)&&parseFloat(v)>=10&&parseFloat(v)<=96,
 'color':v=>/^#[a-f\d]{3,8}$/i.test(v)||/^rgba?\([\d\s.,%]+\)$/i.test(v),
 'background-color':v=>/^#[a-f\d]{3,8}$/i.test(v)||/^rgba?\([\d\s.,%]+\)$/i.test(v)||['yellow','transparent'].includes(v),
 'text-align':v=>['left','right','center','justify'].includes(v),
 'line-height':v=>['1.3','1.65','2'].includes(v),
 'margin-bottom':v=>['0pt','6pt','12pt','18pt','24pt'].includes(v),
 'clip-path':v=>safeContourStyle(v),
 'shape-outside':v=>safeContourStyle(v.replace(/ border-box$/,'')),
 'margin-left':v=>/^\d+pt$/.test(v)&&parseFloat(v)<=144
})){let value=style.getPropertyValue(name).trim();if(valid(value))declarations.push(name+':'+value)}return declarations.join(';')}
export function createSanitizer(purifier){
 purifier.addHook('uponSanitizeAttribute',(node,data)=>{
  if(data.attrName==='href'&&!safeLink(data.attrValue))data.keepAttr=false;
  if(data.attrName==='dir'&&!['ltr','rtl','auto'].includes(data.attrValue))data.keepAttr=false;
  if(data.attrName==='src'&&!safeImage(data.attrValue))data.keepAttr=false;
  if(data.attrName==='style'){let span=node.ownerDocument.createElement('span');span.style.cssText=data.attrValue;data.attrValue=safeStyle(span.style);if(!data.attrValue)data.keepAttr=false}
  if(data.attrName==='id'&&!/^sf-(heading|note|ref)-[1-9]\d*$/.test(data.attrValue))data.keepAttr=false;
  if(['rowspan','colspan','start'].includes(data.attrName)){let n=Number(data.attrValue);if(!Number.isInteger(n)||n<1||n>100)data.keepAttr=false}
 });
 return html=>purifier.sanitize(html,{ALLOWED_TAGS:['p','h1','h2','h3','h4','h5','h6','strong','b','em','i','u','s','strike','mark','code','pre','blockquote','ul','ol','li','br','hr','div','span','table','thead','tbody','tr','td','th','a','img','sup','sub','section'],ALLOWED_ATTR:['data-forge-block-change','data-forge-paragraph-change','data-forge-format-change','data-widow-control','data-image-shape','data-image-contour','data-keep-together','data-keep-next','data-break-before','dir','href','title','alt','src','style','colspan','rowspan','start','data-page-break','data-image-width','data-image-gap','data-image-align','data-image-wrap','data-table-style','data-table-palette','data-table-density','id','data-forge-toc','data-toc-title','data-toc-depth','data-toc-start','data-forge-footnote','data-note-text','data-forge-design','data-forge-comment','data-forge-comment-anchor','data-forge-change','data-forge-section','data-forge-section-content'],ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,KEEP_CONTENT:true});
}
export function validateDocxArchive(bytes){
 let files=0,total=0,hasDocument=false,hasTypes=false;
 try{unzipSync(bytes,{filter(file){files++;total+=file.originalSize;if(files>1000||file.originalSize>20000000||total>30000000)throw Error('Document expands beyond the 30 MB safety limit.');if(file.name==='word/document.xml')hasDocument=true;if(file.name==='[Content_Types].xml')hasTypes=true;return false}})}catch(error){throw Error('Cannot open this DOCX: '+error.message)}
 if(!hasDocument||!hasTypes)throw Error('This file is not a supported DOCX document.');return {files,total};
}

export const DOCX_INPUT_LIMIT=20000000;
