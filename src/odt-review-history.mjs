import forge from 'node-forge';
import {unzipSync,zipSync,strToU8,strFromU8} from 'fflate';
import {normalizeLayout} from './document-model.mjs';
export const ODT_REVIEW_PART='SlateForge/review.json';
const MANIFEST='urn:oasis:names:tc:opendocument:xmlns:manifest:1.0',MAX=10000000;
const flags=new Set(['reviewChange','comment','formatChange']);
export function hasOdtReviewHistory(content){let found=false,count=0;function walk(n,depth=0,layers=0){if(!n||typeof n!=='object'||++count>100000||depth>100||layers>20)throw Error('ODT review history exceeds document complexity limits.');if(n.type==='blockRevision'||n.type==='commentAnchor'||n.attrs?.rowChange||n.attrs?.paragraphBoundaryChange||n.attrs?.paragraphChange||n.marks?.some(m=>flags.has(m.type)))found=true;for(const child of n.content||[])walk(child,depth+1,layers+(n.type==='blockRevision'?1:0))}walk(content);return found}
function hash(bytes){const md=forge.md.sha256.create();for(let i=0;i<bytes.length;i+=16384)md.update(String.fromCharCode(...bytes.subarray(i,i+16384)));return md.digest().toHex()}
function fingerprint(files){return hash(strToU8(JSON.stringify(Object.keys(files).filter(name=>name!==ODT_REVIEW_PART).sort().map(name=>[name,hash(files[name])]))))}
export function retainOdtReview(bytes,html,layout){
 if(typeof html!=='string'||!html||!(/data-forge-(?:block-change|row-change|boundary-change|paragraph-change|format-change|change|comment(?:-anchor)?)=/.test(html))||strToU8(html).length>MAX)throw Error('ODT review retention needs the current HTML snapshot under 10 MB.');
 const files=unzipSync(bytes),manifest=files['META-INF/manifest.xml']&&strFromU8(files['META-INF/manifest.xml']);if(!manifest||manifest.split('</manifest:manifest>').length!==2||files[ODT_REVIEW_PART])throw Error('ODT review metadata cannot be attached to this package.');
 files['META-INF/manifest.xml']=strToU8(manifest.replace('</manifest:manifest>','<manifest:file-entry manifest:full-path="'+ODT_REVIEW_PART+'" manifest:media-type="application/json"/></manifest:manifest>'));
 files[ODT_REVIEW_PART]=strToU8(JSON.stringify({version:1,packageSHA256:fingerprint(files),html,layout:normalizeLayout(layout)}));
 const parts=Object.values(files);if(files[ODT_REVIEW_PART].length>MAX||parts.length>1000||parts.some(p=>p.length>20000000)||parts.reduce((total,p)=>total+p.length,0)>50000000)throw Error('Retained ODT review history exceeds archive limits. Reduce embedded data or use a workspace backup.');
 const {mimetype,...rest}=files,result=zipSync({mimetype:[mimetype,{level:0}],...rest},{level:1});if(result.length>5000000)throw Error('Retained ODT review exceeds the 5 MB opening limit. Reduce embedded data or use a workspace backup.');return result;
}
// A package fingerprint prevents stale automatic restoration after external edits.
// It is a reopening aid, not authentication; restored HTML is sanitized separately.
export function restoreOdtReview(files,Parser,warnings){
 if(!files[ODT_REVIEW_PART])return null;
 try{
  if(files[ODT_REVIEW_PART].length>MAX)throw Error('The retained review exceeds 10 MB.');const data=JSON.parse(strFromU8(files[ODT_REVIEW_PART]));
  if(data.version!==1||typeof data.html!=='string'||!data.html||strToU8(data.html).length>MAX||!/^[a-f0-9]{64}$/.test(data.packageSHA256||''))throw Error('Invalid or unsupported review metadata.');
  if(fingerprint(files)!==data.packageSHA256)throw Error('The ODT package changed outside its retained history.');
  const source=files['META-INF/manifest.xml']&&strFromU8(files['META-INF/manifest.xml']);if(!source||/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(source))throw Error('Invalid review manifest.');const manifest=new Parser().parseFromString(source,'application/xml');if(manifest.doctype||manifest.getElementsByTagName('parsererror').length)throw Error('Invalid review manifest.');
  const entries=[...manifest.getElementsByTagNameNS(MANIFEST,'file-entry')].filter(n=>n.getAttributeNS(MANIFEST,'full-path')===ODT_REVIEW_PART);if(entries.length!==1||entries[0].getAttributeNS(MANIFEST,'media-type')!=='application/json')throw Error('The review manifest entry is missing or ambiguous.');
  return {html:data.html,layout:normalizeLayout(data.layout)};
 }catch(error){warnings.add('Stored Slate Forge review history was ignored: '+error.message+' The current ODT content was imported instead.');return null}
}
