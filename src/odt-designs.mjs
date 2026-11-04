import forge from 'node-forge';
import {strToU8,strFromU8} from 'fflate';
import {normalizeScene,encodeScene} from './design-model.mjs';
const PART='SlateForge/designs.json',DRAW='urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',TEXT='urn:oasis:names:tc:opendocument:xmlns:text:1.0',SVG='urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0',LINK='http://www.w3.org/1999/xlink',STYLE='urn:oasis:names:tc:opendocument:xmlns:style:1.0',MAX=10000000;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
function hash(bytes){const md=forge.md.sha256.create();for(let i=0;i<bytes.length;i+=16384)md.update(String.fromCharCode(...bytes.subarray(i,i+16384)));return md.digest().toHex()}
function sceneData(scene){if(!scene||!same(scene,normalizeScene(scene))||encodeScene(scene).length>15000000)throw Error('Invalid editable ODT canvas data.');return scene}
export function odtDesigns(enabled){const records=[];let size=0;return {
 retain(scene,html,files){if(!enabled)return html;if(records.length>=50)throw Error('ODT retains up to 50 editable canvases. Choose an image-only copy for more.');const name='SlateForgeCanvas_'+(records.length+1),path=/xlink:href="([^"]+)"/.exec(html)?.[1],width=/svg:width="([^"]+)"/.exec(html)?.[1],height=/svg:height="([^"]+)"/.exec(html)?.[1];if(!path||!width||!height||!files[path])throw Error('An ODT canvas preview is missing.');sceneData(scene);size+=strToU8(JSON.stringify(scene)).length;if(size>MAX)throw Error('Editable ODT canvas data exceeds 10 MB. Choose an image-only copy.');records.push({name,path,width,height,hash:hash(files[path]),scene});return html.replace('<draw:frame ','<draw:frame draw:name="'+name+'" ')},
 finish(files){if(!records.length)return '';const data=strToU8(JSON.stringify({version:1,canvases:records}));if(data.length>MAX)throw Error('Editable ODT canvas data exceeds 10 MB. Choose an image-only copy.');files[PART]=data;return '<manifest:file-entry manifest:full-path="'+PART+'" manifest:media-type="application/json"/>'}
}}
// Metadata is a reopening aid, not an authority over the visible document.
// Restore only unique, unchanged, standalone previews; otherwise retain the image.
export function importOdtDesigns(files,xml,warnings,escape,Parser){const restored=new Map(),data=files[PART];if(!data)return restored;const warn=()=>warnings.add('An editable ODT canvas could not be safely restored; its preview remains an image.');let records;
 try{if(data.length>MAX)throw Error();const payload=JSON.parse(strFromU8(data));if(payload.version!==1||!Array.isArray(payload.canvases)||payload.canvases.length>50)throw Error();records=payload.canvases}catch{warn();return restored}
 const graphicDefaults=document=>[...document.getElementsByTagNameNS(STYLE,'default-style')].some(n=>n.getAttributeNS(STYLE,'family')==='graphic');
 const hasGraphicDefaults=graphicDefaults(xml)||!!(files['styles.xml']&&graphicDefaults(new Parser().parseFromString(strFromU8(files['styles.xml']),'application/xml')));
 const frames=[...xml.getElementsByTagNameNS(DRAW,'frame')],names=new Map();for(const r of records)names.set(r?.name,(names.get(r?.name)||0)+1);let expanded=0;
 for(const r of records)try{if(!r||!/^SlateForgeCanvas_[1-9]\d*$/.test(r.name)||names.get(r.name)!==1||!/^Pictures\/[a-zA-Z0-9_.-]+\.png$/.test(r.path)||!/^([0-9]+(?:\.[0-9]+)?)mm$/.test(r.width)||!/^([0-9]+(?:\.[0-9]+)?)mm$/.test(r.height)||!/^[a-f0-9]{64}$/.test(r.hash))throw Error();const matches=frames.filter(f=>f.getAttributeNS(DRAW,'name')===r.name);if(!matches.length)continue;if(matches.length!==1)throw Error();const frame=matches[0],parent=frame.parentElement,image=frame.children[0],desc=frame.children[1];sceneData(r.scene);
  const attrs=[[DRAW,'name',r.name],[TEXT,'anchor-type','as-char'],[SVG,'width',r.width],[SVG,'height',r.height]];if(frame.attributes.length!==4||attrs.some(([ns,key,value])=>frame.getAttributeNS(ns,key)!==value)||frame.children.length!==2||image?.namespaceURI!==DRAW||image.localName!=='image'||image.children.length||image.textContent.trim()||image.attributes.length!==2||image.getAttributeNS(LINK,'href')!==r.path||image.getAttributeNS(LINK,'type')!=='simple'||desc?.namespaceURI!==SVG||desc.localName!=='desc'||desc.attributes.length||desc.children.length||desc.textContent!==(r.scene.description||r.scene.title))throw Error();
  if(!parent||parent.namespaceURI!==TEXT||parent.localName!=='p'||parent.children.length!==1||[...parent.childNodes].some(n=>n!==frame&&n.textContent.trim())||[...frame.childNodes].some(n=>n!==image&&n!==desc&&n.textContent.trim()))throw Error();
  // Graphic defaults may alter opacity, cropping or positioning on a resave.
  if(hasGraphicDefaults)throw Error();
  const preview=files[r.path];if(!preview||preview.length>1500000||hash(preview)!==r.hash)throw Error();const encoded=encodeScene(r.scene);expanded+=encoded.length;if(expanded>20000000)throw Error();restored.set(parent,'<div data-forge-design="'+escape(encoded)+'"></div>');
 }catch{warn()}return restored}
