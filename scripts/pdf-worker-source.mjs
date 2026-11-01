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
 const buttonStart=source.indexOf('class Button extends '),buttonEnd=source.indexOf('\nclass ',buttonStart+1),button=source.slice(buttonStart,buttonEnd),buttonAnchor='class: ["xfaButton"],';
 if(buttonStart<0||buttonEnd<0||!button.includes(buttonAnchor))throw Error('Update the XFA button adapter for this PDF.js version.');
 source=source.slice(0,buttonStart)+button.replace(buttonAnchor,'class: ["xfaButton"], fieldId: grandpa[$uid], dataId: grandpa[$data]?.[$uid] || grandpa[$uid],')+source.slice(buttonEnd);

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
 return extendXFAScripts(source.slice(0,handlerStart)+handler.replace(original,replacement)+source.slice(handlerEnd<0?source.length:handlerEnd));
}
export async function writePDFWorker(){
 const source=fs.readFileSync('node_modules/pdfjs-dist/build/pdf.worker.mjs','utf8'),extended=extendXFAWorker(source),license=source.slice(0,source.indexOf('*/')+2),result=await transform(extended,{format:'esm',target:['es2022'],minify:true,legalComments:'eof'});
 fs.mkdirSync('dist/vendor/pdf',{recursive:true});fs.writeFileSync('dist/vendor/pdf/pdf.worker.min.mjs',license+'\n/* Slate Forge: XFA multi-selection datasets and local script metadata. */\n'+result.code);
}

function extendXFAScripts(source){
 const start=source.indexOf('class XFAFactory {'),end=source.indexOf('\nclass ',start+1),factory=source.slice(start,end<0?undefined:end),anchor='this.pages = await this._createPagesHelper();';
 if(start<0||!factory.includes(anchor))throw Error('Update the XFA script metadata adapter for this PDF.js version.');
 const metadata=`this.pages = await this._createPagesHelper();
      const fields = [], stack = [{node: this.form, path: [], depth: 0}];
      let visited = 0, scriptSize = 0;
      while (stack.length) {
        const {node, path, depth} = stack.pop();
        if (++visited > 100000 || depth > 100) throw new Error("XFA script metadata exceeds layout limits.");
        if (node[$nodeName] === "field") {
          if (fields.length >= 5000) throw new Error("XFA script metadata exceeds field limits.");
          const scripts = [], submissions = [];
          const addScript = (activity, script) => {
            if (!script) return;
            const text = script[$content];
            if (typeof text !== "string" || !text.trim()) return;
            scriptSize += text.length;
            if (text.length > 8000 || scriptSize > 250000) {
              scripts.push({activity, language: "unsupported", runAt: script.runAt, source: "Script exceeds local limits."});
              return;
            }
            scripts.push({activity, language: script.contentType, runAt: script.runAt, source: text});
          };
          addScript("calculate", node.calculate?.script);
          addScript("validate", node.validate?.script);
          for (const event of node.event?.children || []) {
            addScript(event.activity, event.script);
            if (event.execute || event.signData || event.encryptData) scripts.push({activity: event.activity, language: "unsupported", source: "This event requires an external action."});
            if (event.submit) {
              const submit = event.submit;
              submissions.push({activity: event.activity, format: submit.format, target: submit.target, encoding: submit.textEncoding, xdpContent: submit.xdpContent, embedPDF: submit.embedPDF === 1, unsupported: submit.encrypt || submit.encryptData?.children.length || submit.signData?.children.length ? "Encrypted or signed submission payloads are unsupported." : event.activity !== "click" ? "Automatic submissions are not run. Use a click submission action." : ""});
            }
          }
          fields.push({id: node[$data]?.[$uid] || node[$uid], fieldId: node[$uid], path, value: node.value?.[$text]() || "", numeric: ["decimal", "float", "integer"].some(type => !!node.value?.[type]), button: !!node.ui?.button, label: (node.caption?.value?.[$text]() || node.name || "Form button").slice(0,200), required: node.validate?.nullTest === "error", submissions, scripts});
        }
        const counts = new Map(), children = node[$getChildren]();
        const next = [];
        for (const child of children) {
          const kind = child[$nodeName];
          let childPath = path;
          if (["subform", "exclGroup", "field"].includes(kind)) {
            const name = child.name || "#" + kind, index = counts.get(name) || 0;
            counts.set(name, index + 1);
            childPath = [...path, {name, index}];
          }
          next.push({node: child, path: childPath, depth: depth + 1});
        }
        for (let i = next.length - 1; i >= 0; i--) stack.push(next[i]);
      }
      this.pages.slateXFA = fields;`;
 return source.slice(0,start)+factory.replace(anchor,metadata)+source.slice(end<0?source.length:end);
}
