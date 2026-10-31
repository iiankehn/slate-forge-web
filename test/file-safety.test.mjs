import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import createDOMPurify from 'dompurify';
import {zipSync,strToU8} from 'fflate';
import {createSanitizer,safeLink,validateDocxArchive} from '../src/file-safety.mjs';
import {persistSession} from '../src/document-model.mjs';
const window=new JSDOM('').window;
const sanitize=createSanitizer(createDOMPurify(window));
test('HTML import removes scripts, handlers, active embeds and external images',()=>{
 const result=sanitize('<p onclick="alert(1)">Hello<script>alert(1)</script></p><svg onload="alert(1)"></svg><iframe src="https://example.com"></iframe><img src="https://example.com/track" onerror="alert(1)"><a href="javascript:alert(1)">Unsafe</a>');
 assert.doesNotMatch(result,/script|onclick|onerror|onload|iframe|javascript:|https:\/\/example/);assert.match(result,/Hello/);assert.match(result,/Unsafe/);
});
test('HTML import retains supported formatting and embedded raster images',()=>{
 const result=sanitize('<h1>Heading</h1><p style="text-align:center;line-height:2;margin-bottom:18pt"><span style="font-family:Arial;font-size:18pt;color:#123456">Text</span></p><table><tr><td colspan="2">Cell</td></tr></table><a href="https://example.com">Link</a><img src="data:image/png;base64,YWJj" alt="Pixel"><div data-page-break="true">Page break</div>');
 for(let text of ['<h1>','text-align:center','line-height:2','font-size:18pt','colspan="2"','href="https://example.com"','data:image/png;base64,YWJj','data-page-break="true"'])assert.ok(result.includes(text),text);
});
test('HTML import rejects CSS URLs, positioning and unsupported attributes',()=>{
 const result=sanitize('<p style="background-image:url(https://evil.example);position:fixed;color:red;text-align:right" data-secret="abc" id="attack"><span style="font-family:evil;font-size:1000pt">Text</span></p>');
 assert.doesNotMatch(result,/evil|background-image|position|data-secret|id=|1000pt/);assert.match(result,/text-align:right/);
});
test('links reject obfuscated and unsupported schemes',()=>{
 for(let url of ['javascript:alert(1)','data:text/html,bad','//evil.example',' java\nscript:alert(1)','file:///etc/passwd'])assert.equal(safeLink(url),false,url);
 for(let url of ['https://example.com/path','http://example.com','mailto:hello@example.com'])assert.equal(safeLink(url),true,url);
});
test('DOCX archive validation accepts core parts without decompressing them',()=>{
 const bytes=zipSync({'[Content_Types].xml':strToU8('<Types/>'),'word/document.xml':strToU8('<document/>')});
 assert.equal(validateDocxArchive(bytes).files,2);
});
test('DOCX archive validation rejects non-Word and oversized archives',()=>{
 assert.throws(()=>validateDocxArchive(zipSync({'readme.txt':strToU8('hello')})),/not a supported DOCX/);
 assert.throws(()=>validateDocxArchive(new Uint8Array([1,2,3])),/Cannot open/);
 const bytes=zipSync({'[Content_Types].xml':strToU8('<Types/>'),'word/document.xml':new Uint8Array(20000001)},{level:1});
 assert.throws(()=>validateDocxArchive(bytes),/safety limit/);
});
test('quota failure preserves the last saved session and reports unsaved changes',()=>{
 let data='previous session';let storage={setItem(key,value){throw Object.assign(new Error('Full'),{name:'QuotaExceededError'})},removeItem(){throw Error('Must not clear data')}};
 assert.equal(persistSession(storage,'session',{docs:['new changes']}).saved,false);assert.equal(data,'previous session');
});
test('successful save serializes documents, trash and history together',()=>{
 let saved;const state={docs:[{title:'Current',history:[{title:'Earlier'}]}],trash:[{title:'Deleted'}]};
 assert.equal(persistSession({setItem(key,value){saved=value}},'session',state).saved,true);assert.deepEqual(JSON.parse(saved),state);
});
