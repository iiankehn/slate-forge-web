import fs from 'node:fs';
import {transform} from 'esbuild';

// Adapt the pinned PDF.js worker at packaging time. Keep node_modules intact.
export function extendXFAWorker(source){
 const choiceStart=source.indexOf('class ChoiceList extends '),choiceEnd=source.indexOf('\nclass ',choiceStart+1);
 if(choiceStart<0||choiceEnd<0)throw Error('Update the XFA choice-list adapter for this PDF.js version.');
 let choice=source.slice(choiceStart,choiceEnd);
 const selected='if (values[i] === value) {',empty='if (!selected) {';
 if(!choice.includes(selected)||!choice.includes(empty))throw Error('Update the XFA selection adapter for this PDF.js version.');
 choice=choice.replace(selected,'if (this.open === "multiSelect" ? (field[$data] ? field[$data][$getChildren]().map(node => node[$content].trim()) : value ? value.split("\\n") : []).includes(option.attributes.value) : values[i] === value) {').replace(empty,'if (!selected && this.open !== "multiSelect") {');
 source=source.slice(0,choiceStart)+choice+source.slice(choiceEnd);
 const handlerStart=source.indexOf('class DataHandler {'),handlerEnd=source.indexOf('\nclass ',handlerStart+1),handler=source.slice(handlerStart,handlerEnd<0?undefined:handlerEnd),original='if (storageEntry) {\n        child[$setValue](storageEntry);';
 if(handlerStart<0||!handler.includes(original))throw Error('Update the XFA dataset adapter for this PDF.js version.');
 const replacement=`if (storageEntry) {
        if (storageEntry.xfaMultiSelect === true) {
          const values = storageEntry.value;
          if (!(child instanceof XmlObject) || !Array.isArray(values) || values.length > 100 || values.some(value => typeof value !== "string" || value.length > 4000)) {
            throw new Error("Invalid XFA multiple-selection dataset value.");
          }
          const previous = child[$getChildren]().find(node => node[$nodeName] !== "#text");
          const valueName = previous?.[$nodeName] || "value";
          const valueNamespace = previous?.[$namespaceId] ?? child[$namespaceId];
          for (const value of [...child[$getChildren]()]) child[$removeChild](value);
          child[$content] = "";
          child[_dataValue] = false;
          for (const value of values) {
            const selected = new XmlObject(valueNamespace, valueName, {});
            selected[$content] = value;
            child[$appendChild](selected);
          }
        } else {
          child[$setValue](storageEntry);
        }`;
 return source.slice(0,handlerStart)+handler.replace(original,replacement)+source.slice(handlerEnd<0?source.length:handlerEnd);
}
export async function writePDFWorker(){
 const source=fs.readFileSync('node_modules/pdfjs-dist/build/pdf.worker.mjs','utf8'),extended=extendXFAWorker(source),license=source.slice(0,source.indexOf('*/')+2),result=await transform(extended,{format:'esm',target:['es2022'],minify:true,legalComments:'eof'});
 fs.mkdirSync('dist/vendor/pdf',{recursive:true});fs.writeFileSync('dist/vendor/pdf/pdf.worker.min.mjs',license+'\n/* Slate Forge: multiple-selection XFA control and dataset support. */\n'+result.code);
}
