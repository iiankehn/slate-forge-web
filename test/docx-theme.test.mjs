import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {zipSync,strToU8} from 'fflate';
import {importDOCX} from '../src/docx-import.mjs';
import {readDocxTheme,resolveThemeRun} from '../src/docx-theme.mjs';
import {enrichDocxStructure} from '../src/docx-structure.mjs';
import {createSanitizer} from '../src/file-safety.mjs';
import createDOMPurify from 'dompurify';
import {getSchema} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {ParagraphDesign} from '../src/editor-extensions.mjs';
import {DOMParser as PMParser} from '@tiptap/pm/model';
const window=new JSDOM('').window,Parser=window.DOMParser,W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const theme='<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Test"><a:dk1><a:sysClr val="windowText" lastClr="102030"/></a:dk1><a:accent1><a:srgbClr val="204060"/></a:accent1></a:clrScheme><a:fontScheme name="Test"><a:majorFont><a:latin typeface="Verdana"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme></a:themeElements></a:theme>';
function parse(content){return new Parser().parseFromString(content,'application/xml')}
function fixture(body,styles='',themeXML=theme,target='theme/custom.xml',mode=''){
 const entries={'[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>','_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>','word/document.xml':`<w:document xmlns:w="${W}"><w:body>${body}</w:body></w:document>`,'word/styles.xml':`<w:styles xmlns:w="${W}">${styles}</w:styles>`,'word/_rels/document.xml.rels':`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="${target}" ${mode}/></Relationships>`,'word/theme/custom.xml':themeXML};return zipSync(Object.fromEntries(Object.entries(entries).map(([k,v])=>[k,strToU8(v)])))}
test('theme relationship selects custom part, resolves major/minor fonts and color tint/shade with cached values overridden',async()=>{
 const body='<w:p><w:r><w:rPr><w:rFonts w:ascii="Georgia" w:asciiTheme="majorHAnsi"/><w:color w:val="FF0000" w:themeColor="accent1" w:themeTint="80"/></w:rPr><w:t>Heading font</w:t></w:r><w:r><w:rPr><w:rFonts w:asciiTheme="minorHAnsi"/><w:color w:themeColor="text1" w:themeShade="80"/></w:rPr><w:t>Body font</w:t></w:r></w:p>';
 const result=await importDOCX(fixture(body),Parser),d=new JSDOM(result.html).window.document,spans=[...d.querySelectorAll('span')];
 assert.ok(spans.some(n=>n.style.fontFamily==='Verdana'&&n.style.color==='rgb(143, 159, 175)'));
 assert.ok(spans.some(n=>n.style.fontFamily==='Arial'&&n.style.color==='rgb(8, 16, 24)'));
});
test('default styles and partially overridden compound properties retain inherited attributes while direct font wins',()=>{
 const xml=parse(`<w:document xmlns:w="${W}"><w:body><w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New"/></w:rPr><w:t>Body</w:t></w:r></w:p></w:body></w:document>`);
 const styles=`<w:styles xmlns:w="${W}"><w:docDefaults><w:pPrDefault><w:pPr><w:spacing w:line="396"/></w:pPr></w:pPrDefault><w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="majorHAnsi" w:hAnsi="Arial"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:pPr><w:spacing w:before="120"/><w:keepNext/></w:pPr><w:rPr><w:sz w:val="32"/></w:rPr></w:style></w:styles>`;
 enrichDocxStructure(xml,styles,Parser,[],readDocxTheme(theme,Parser));
 const spacing=xml.getElementsByTagNameNS(W,'spacing')[0],fonts=xml.getElementsByTagNameNS(W,'rFonts')[0];
 assert.equal(spacing.getAttributeNS(W,'after'),'240');assert.equal(spacing.getAttributeNS(W,'before'),'120');assert.equal(spacing.getAttributeNS(W,'line'),'396');
 assert.equal(fonts.getAttributeNS(W,'ascii'),'Courier New');assert.equal(fonts.getAttributeNS(W,'hAnsi'),'Arial');assert.equal(xml.getElementsByTagNameNS(W,'sz')[0].getAttributeNS(W,'val'),'32');assert.equal(xml.getElementsByTagNameNS(W,'keepNext').length,1);
});
test('supported spacing and paragraph keep rules survive conversion, sanitizer and editor parsing including headings and false overrides',async()=>{
 const style='<w:style w:type="paragraph" w:styleId="Base"><w:pPr><w:spacing w:after="240" w:line="480"/><w:keepLines/><w:keepNext/><w:pageBreakBefore/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Custom"><w:basedOn w:val="Base"/><w:pPr><w:outlineLvl w:val="2"/></w:pPr></w:style>';
 const result=await importDOCX(fixture('<w:p><w:pPr><w:pStyle w:val="Custom"/></w:pPr><w:r><w:t>Heading</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Base"/><w:keepNext w:val="0"/><w:keepLines w:val="false"/><w:pageBreakBefore w:val="off"/><w:spacing w:after="0"/></w:pPr><w:r><w:t>Body</w:t></w:r></w:p>',style),Parser);
 const host=window.document.createElement('div');host.innerHTML=createSanitizer(createDOMPurify(window))(result.html);const schema=getSchema([StarterKit,ParagraphDesign]),doc=PMParser.fromSchema(schema).parse(host);
 assert.equal(doc.firstChild.type.name,'heading');assert.equal(doc.firstChild.attrs.level,3);assert.equal(doc.firstChild.attrs.keepTogether,true);assert.equal(doc.firstChild.attrs.keepWithNext,true);assert.equal(doc.firstChild.attrs.pageBreakBefore,true);assert.equal(doc.firstChild.attrs.paragraphSpacing,'12pt');assert.equal(doc.firstChild.attrs.paragraphLine,'2');
 assert.equal(doc.lastChild.attrs.keepTogether,false);assert.equal(doc.lastChild.attrs.keepWithNext,false);assert.equal(doc.lastChild.attrs.pageBreakBefore,false);assert.equal(doc.lastChild.attrs.paragraphSpacing,'0pt');assert.equal(doc.lastChild.attrs.paragraphLine,'2');
});
test('unsupported fonts, unresolved colors and unsupported paragraph spacing produce bounded fallback warnings',async()=>{
 const props=parse(`<w:rPr xmlns:w="${W}"><w:rFonts w:asciiTheme="majorHAnsi"/><w:color w:val="123456" w:themeColor="accent9"/></w:rPr>`).documentElement,warnings=[];
 resolveThemeRun(props,readDocxTheme(theme.replace('Verdana','Unavailable Typeface'),Parser),warnings);assert.equal(warnings.length,2);assert.equal(props.lastElementChild.getAttributeNS(W,'val'),'123456');
 const result=await importDOCX(fixture('<w:p><w:pPr><w:spacing w:after="123" w:line="240"/></w:pPr><w:r><w:t>Keep content</w:t></w:r></w:p>'),Parser);assert.ok(result.warnings.some(w=>w.includes('paragraph spacing')));assert.ok(result.warnings.some(w=>w.includes('line spacing')));assert.match(result.html,/Keep content/);
});
test('external theme links are not followed and malformed selected theme XML is rejected',async()=>{
 const body='<w:p><w:r><w:rPr><w:rFonts w:ascii="Georgia" w:asciiTheme="majorHAnsi"/></w:rPr><w:t>Local</w:t></w:r></w:p>';
 const external=await importDOCX(fixture(body,'','<!DOCTYPE bad><x/>','https://example.invalid/theme.xml','TargetMode="External"'),Parser);assert.match(external.html,/Georgia/);
 await assert.rejects(importDOCX(fixture(body,'','<!DOCTYPE bad><x/>'),Parser),/Invalid DOCX theme/);
 assert.throws(()=>readDocxTheme('<a:theme>',Parser),/Invalid DOCX theme/);
});

test('exported paragraph design survives DOCX reimport and a second export',async()=>{
 const {buildDocx}=await import('../src/docx-export.mjs'),{Packer}=await import('docx'),{unzipSync,strFromU8}=await import('fflate');
 const source={type:'doc',content:[{type:'paragraph',attrs:{keepTogether:true,keepWithNext:true,pageBreakBefore:true,paragraphSpacing:'18pt',paragraphLine:'1.65'},content:[{type:'text',text:'Designed paragraph'}]}]};
 const first=await Packer.toBuffer(buildDocx(source,{},'Paragraph')),result=await importDOCX(first,Parser),host=window.document.createElement('div');host.innerHTML=createSanitizer(createDOMPurify(window))(result.html);const schema=getSchema([StarterKit,ParagraphDesign]),doc=PMParser.fromSchema(schema).parse(host);
 assert.equal(doc.firstChild.attrs.paragraphSpacing,'18pt');assert.equal(doc.firstChild.attrs.paragraphLine,'1.65');assert.equal(doc.firstChild.attrs.keepTogether,true);assert.equal(doc.firstChild.attrs.keepWithNext,true);assert.equal(doc.firstChild.attrs.pageBreakBefore,true);
 const xml=strFromU8(unzipSync(await Packer.toBuffer(buildDocx(doc.toJSON(),{},'Again')))['word/document.xml']);assert.match(xml,/<w:keepLines[^>]*\/>/);assert.match(xml,/<w:keepNext[^>]*\/>/);assert.match(xml,/<w:pageBreakBefore[^>]*\/>/);assert.match(xml,/w:after="360"/);assert.match(xml,/w:line="396"/);
});
