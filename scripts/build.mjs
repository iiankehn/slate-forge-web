import fs from 'node:fs';import {build} from 'esbuild';import {OCR_LANGUAGES} from '../src/ocr-languages.mjs';
fs.rmSync('dist/chunks',{recursive:true,force:true});
await build({entryPoints:{app:'app.mjs','pdf-workspace':'src/pdf-workspace.mjs','ocr-workspace':'src/ocr-workspace.mjs'},bundle:true,minify:true,format:'esm',splitting:true,outdir:'dist',chunkNames:'chunks/[name]-[hash]',platform:'browser',target:['es2022'],logLevel:'info'});
function copy(source,target){fs.mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});fs.cpSync(source,target,{recursive:true})}
copy('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','dist/vendor/pdf/pdf.worker.min.mjs');for(const dir of ['standard_fonts','cmaps','wasm'])copy('node_modules/pdfjs-dist/'+dir,'dist/vendor/pdf/'+(dir==='standard_fonts'?'fonts':dir));
copy('node_modules/tesseract.js/dist/worker.min.js','dist/vendor/ocr/worker.min.js');fs.mkdirSync('dist/vendor/ocr/core',{recursive:true});for(const file of fs.readdirSync('node_modules/tesseract.js-core'))if(/lstm\.(wasm|wasm.js)$/.test(file))copy('node_modules/tesseract.js-core/'+file,'dist/vendor/ocr/core/'+file);
for(const {code} of OCR_LANGUAGES)copy('node_modules/@tesseract.js-data/'+code+'/4.0.0_best_int/'+code+'.traineddata.gz','dist/vendor/ocr/lang/'+code+'.traineddata.gz');
