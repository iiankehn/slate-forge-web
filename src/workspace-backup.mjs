import {PDF_FILE_LIMIT,PDF_WORKSPACE_LIMIT} from './pdf-capacity.mjs';
import {validateWorkspaceCounts} from './workspace-capacity.mjs';
import {validateOCRBackup} from './ocr-backup.mjs';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
const MAX_TOTAL=120000000,MAX_JSON=50000000;
export function createWorkspaceBackup(workspace,pdfs=[],ocr=null){
 validateWorkspaceCounts(workspace);const text={ocrDraft:validateOCRBackup(ocr),format:'document-studio-backup',version:1,docs:workspace.docs,trash:workspace.trash,snippets:workspace.snippets||[],templates:workspace.templates||[]};
 const files={'workspace.json':strToU8(JSON.stringify(text))};if(files['workspace.json'].length>MAX_JSON)throw Error('Text workspace exceeds the 50 MB backup limit.');let total=files['workspace.json'].length;
 const entries=pdfs.map((item,i)=>{const bytes=new Uint8Array(item.bytes);if(bytes.length>PDF_FILE_LIMIT)throw Error('A PDF exceeds the 40 MB limit.');const source='pdfs/'+i+'.pdf',edits='pdfs/'+i+'.json';files[source]=bytes;files[edits]=strToU8(JSON.stringify(item.state||{}));total+=bytes.length+files[edits].length;return {name:String(item.name||'Document.pdf').slice(0,180),source,edits}});
 if(total>MAX_TOTAL||entries.length>100)throw Error('Workspace backup exceeds the size or file-count limit.');files['manifest.json']=strToU8(JSON.stringify({format:'slate-forge-workspace',version:2,pdfs:entries}));return zipSync(files,{level:1});
}
export function readWorkspaceBackup(bytes){
 let count=0,total=0;unzipSync(bytes,{filter(file){count++;total+=file.originalSize;if(count>205||file.originalSize>MAX_JSON||total>MAX_TOTAL)throw Error('Backup expands beyond its safety limit.');return false}});
 const files=unzipSync(bytes),json=name=>{if(!files[name])throw Error('Backup is missing '+name);return JSON.parse(strFromU8(files[name]))},manifest=json('manifest.json'),workspace=json('workspace.json');
 if(manifest.format!=='slate-forge-workspace'||manifest.version!==2||!Array.isArray(manifest.pdfs)||manifest.pdfs.length>100||workspace.format!=='document-studio-backup'||workspace.version!==1)throw Error('Unsupported workspace backup.');
 let pdfTotal=0;const pdfs=manifest.pdfs.map((entry,i)=>{if(entry.source!=='pdfs/'+i+'.pdf'||entry.edits!=='pdfs/'+i+'.json')throw Error('Invalid PDF paths in backup.');const source=files[entry.source];if(!source||source.length>PDF_FILE_LIMIT||!strFromU8(source.subarray(0,5)).startsWith('%PDF-'))throw Error('Invalid PDF in backup.');pdfTotal+=source.length;return {name:String(entry.name||'Restored.pdf').slice(0,180),bytes:source,state:json(entry.edits)}});if(pdfTotal>PDF_WORKSPACE_LIMIT)throw Error('Saved PDFs exceed the 40 MB workspace limit.');validateWorkspaceCounts(workspace);return {workspace,pdfs,ocr:validateOCRBackup(workspace.ocrDraft)};
}
