import test from 'node:test';import assert from 'node:assert/strict';import {compareDocuments} from '../src/document-comparison.mjs';
const t=(text,marks=[])=>({type:'text',text,marks}),p=(text,attrs={})=>({type:'paragraph',attrs,content:typeof text==='string'?[t(text)]:text}),doc=(...content)=>({type:'doc',content});
test('design comparison identifies formatting even when all visible text is identical',()=>{const before=doc(p('Same')),after=doc(p([t('Same',[{type:'bold'}])],{textAlign:'center'})),result=compareDocuments(before,after);assert.equal(result.counts.formatting,2);assert.equal(result.counts.structure,0);assert.equal(result.hasDifferences,true)});
test('comparison includes object/structure/page changes without exposing embedded source data',()=>{const before=doc(p('Body'),{type:'image',attrs:{src:'data:image/png;base64,SECRET',alt:'Before'}}),after=doc(p('Body'),{type:'image',attrs:{src:'data:image/png;base64,CHANGED',alt:'After'}},{type:'horizontalRule'}),result=compareDocuments(before,after,{size:'A4'},{size:'Letter',header:'Header'});assert.equal(result.counts.objects,1);assert.equal(result.counts.structure,1);assert.equal(result.counts.page,2);assert.ok(!JSON.stringify(result.details).includes('base64'));assert.ok(!JSON.stringify(result.details).includes('SECRET'))});
test('equivalent mark splits/default attrs and review metadata do not invent design changes',()=>{const before=doc(p([t('Same ',[{type:'bold'}]),t('text',[{type:'bold'}])])),after=doc(p([t('Same text',[{type:'bold'},{type:'formatChange',attrs:{id:'review',before:[]}}])],{paragraphLine:null,indent:0,keepTogether:false,widowControl:true,paragraphChange:{id:'paragraph',before:{}}}));assert.equal(compareDocuments(before,after).hasDifferences,false)});
test('comparison is bounded and labels shared-text formatting scope for changed-text blocks',()=>{const before=doc(...Array.from({length:500},()=>p('Before'))),after=doc(...Array.from({length:500},()=>({type:'heading',attrs:{level:2},content:[t('After')]}))),result=compareDocuments(before,after,{}, {},{maxNodes:100,maxDetails:10});assert.equal(result.limited,true);assert.equal(result.details.length,10);assert.match(result.formattingScope,/aligned shared text/);assert.equal(compareDocuments(doc(p('Old')),doc(p([t('New',[{type:'bold'}])]))).counts.formatting,0)});
test('inline objects and breaks retain their comparison positions across mark splitting',()=>{const br={type:'hardBreak'},note={type:'footnote',attrs:{text:'Same note',number:1}},before=doc(p([t('Same '),t('text'),br,note])),after=doc(p([t('Same text'),br,{...note,attrs:{...note.attrs,number:3}}]));assert.equal(compareDocuments(before,after).hasDifferences,false)});

test('inserted and removed paragraphs do not shift later design reports',()=>{
 const a=doc(p('One'),p('Two'),p('Three')),b=doc(p('Inserted'),p('One'),p('Two'),p('Three'));
 const added=compareDocuments(a,b),removed=compareDocuments(b,a);assert.equal(added.counts.structure,1);assert.equal(added.counts.formatting,0);assert.match(added.details[0].description,/Added paragraph/);assert.equal(removed.counts.structure,1);assert.match(removed.details[0].description,/Removed paragraph/);
});
test('a moved unique block retains formatting comparison and reports both positions',()=>{
 const a=doc(p('Alpha'),p('Beta'),p('Gamma')),b=doc(p('Beta'),p('Gamma'),p([t('Alpha',[{type:'bold'}])],{textAlign:'center'}));
 const result=compareDocuments(a,b);assert.equal(result.counts.structure,1);assert.equal(result.counts.formatting,2);const moved=result.details.find(d=>d.moved);assert.equal(moved.beforePath,'Document/1');assert.equal(moved.path,'Document/3');assert.match(moved.description,/Moved paragraph/);
});
test('shared text formatting is compared across inserted/deleted words and multiple marks',()=>{
 const a=doc(p([t('The quick '),t('brown fox',[{type:'bold'}]),t(' jumps today.')]));
 const b=doc(p([t('The very quick '),t('brown fox',[{type:'italic'}]),t(' jumps tomorrow.')]));
 assert.equal(compareDocuments(a,b).counts.formatting,1);assert.equal(compareDocuments(b,a).counts.formatting,1);
 const preserved=doc(p([t('The very quick '),t('brown fox',[{type:'bold'}]),t(' jumps tomorrow.')]));assert.equal(compareDocuments(a,preserved).counts.formatting,0);
});
test('formatting only on entirely new or removed text has no counterpart',()=>{
 const a=doc(p('Keep old end')),b=doc(p([t('Keep '),t('new',[{type:'bold'}]),t(' end')]));assert.equal(compareDocuments(a,b).counts.formatting,0);assert.equal(compareDocuments(b,a).counts.formatting,0);
 const c=doc(p([t('Keep '),t('old',[{type:'italic'}]),t(' end')]));assert.equal(compareDocuments(c,b).counts.formatting,0);
});
test('nested moved table rows keep their contents and shared formatting correspondence',()=>{
 const row=(...cells)=>({type:'tableRow',content:cells.map(text=>({type:'tableCell',content:[p(text)]}))});
 const a=doc({type:'table',content:[row('One','First'),row('Two','Second'),row('Three','Third')]}),b=doc({type:'table',content:[row('Two','Second'),row('Three','Third'),row('One',[t('First',[{type:'bold'}])])]});
 const result=compareDocuments(a,b);assert.equal(result.counts.structure,1);assert.equal(result.counts.formatting,1);assert.ok(result.details.some(d=>d.moved&&/tableRow/.test(d.description)));
});
test('repeated paragraphs remain ordered without invented shifts or unique move claims',()=>{
 const a=doc(p('Repeated'),p('Repeated'),p('Anchor')),b=doc(p('Inserted'),p('Repeated'),p('Repeated'),p('Anchor'));const r=compareDocuments(a,b);assert.equal(r.counts.structure,1);assert.equal(r.counts.formatting,0);assert.equal(r.details.some(d=>d.moved),false);
 const ambiguous=compareDocuments(doc(p('Repeat'),p('Unique'),p('Repeat')),doc(p('Repeat'),p('Repeat'),p('Unique')));assert.ok(ambiguous.limited||ambiguous.details.some(d=>d.moved));assert.ok(!ambiguous.details.some(d=>d.moved&&d.beforePath==='Document/3'));
});
test('changed objects pair within gaps beside unrelated inserted blocks',()=>{
 const image=src=>({type:'image',attrs:{src,alt:'Private image'}}),r=compareDocuments(doc(p('Start'),image('SECRET-A'),p('End')),doc(p('Start'),image('SECRET-B'),{type:'horizontalRule'},p('End')));assert.equal(r.counts.objects,1);assert.equal(r.counts.structure,1);assert.equal(JSON.stringify(r.details).includes('SECRET'),false);
});
test('Unicode and inline objects do not offset shared-text formatting comparison',()=>{
 const note={type:'footnote',attrs:{text:'Note',number:1}},a=doc(p([t('📝 café '),note,t(' 東京 end')])),b=doc(p([t('📝 new café '),{...note,attrs:{...note.attrs,number:9}},t(' 東京',[{type:'bold'}]),t(' end')]));const r=compareDocuments(a,b);assert.equal(r.counts.formatting,1);assert.equal(r.counts.objects,0);assert.equal(r.counts.structure,0);
});
test('format alignment work and character bounds produce explicit partial results',()=>{
 const a=doc(p('Same old words shared tail')),b=doc(p([t('Same new words '),t('shared tail',[{type:'bold'}])])),r=compareDocuments(a,b,{}, {},{maxWork:0});assert.equal(r.limited,true);assert.equal(r.counts.formatting,1);
 assert.equal(compareDocuments(a,b,{}, {},{maxCharacters:5}).limited,true);
 const many=doc(...Array.from({length:9000},()=>p('Repeated')));assert.equal(compareDocuments(many,many,{}, {},{maxNodes:10000}).limited,true);
});
test('input documents and review metadata remain unchanged by comparison',()=>{
 const a=doc(p([t('Keep',[{type:'reviewChange',attrs:{kind:'insert',id:'i'}},{type:'comment',attrs:{id:'c'}}]),t('gone',[{type:'reviewChange',attrs:{kind:'delete',id:'d'}}])])),b=doc(p([t('New '),t('Keep',[{type:'bold'}])]));const snapshot=JSON.stringify([a,b]);assert.equal(compareDocuments(a,b).counts.formatting,1);assert.equal(JSON.stringify([a,b]),snapshot);
});

const quote=(...content)=>({type:'blockquote',content});
test('unique paragraphs moved between matched quotations retain formatting and both paths',()=>{
 const before=doc(quote(p('Left anchor'),p('Move me')),quote(p('Right anchor')));
 const after=doc(quote(p('Left anchor')),quote(p('Right anchor'),p([t('Move me',[{type:'bold'}])],{textAlign:'center'})));
 const snapshot=JSON.stringify([before,after]),result=compareDocuments(before,after);
 assert.equal(result.counts.structure,1);assert.equal(result.counts.formatting,2);
 const move=result.details.find(d=>d.moved);assert.equal(move.beforePath,'Document/1/2');assert.equal(move.path,'Document/2/2');assert.equal(result.limited,false);
 assert.equal(JSON.stringify([before,after]),snapshot);
 const reverse=compareDocuments(after,before);assert.equal(reverse.counts.structure,1);assert.equal(reverse.counts.formatting,2);assert.equal(reverse.details.find(d=>d.moved).path,'Document/1/2');
});
test('cross-cell moves are reported once without moving the matching table containers',()=>{
 const table=(left,right)=>({type:'table',content:[{type:'tableRow',content:[{type:'tableCell',content:left},{type:'tableCell',content:right}]}]});
 const result=compareDocuments(doc(table([p('Left'),p('Transfer')],[p('Right')])),doc(table([p('Left')],[p('Right'),p('Transfer')])));
 assert.equal(result.counts.structure,1);assert.equal(result.counts.formatting,0);assert.equal(result.details[0].beforePath,'Document/1/1/1/2');assert.equal(result.details[0].path,'Document/1/1/2/2');assert.ok(result.details[0].moved);
});
test('cross-container swaps are not consumed as unrelated local replacements',()=>{
 const result=compareDocuments(doc(quote(p('Left'),p('Alpha')),quote(p('Right'),p('Beta'))),doc(quote(p('Left'),p('Beta')),quote(p('Right'),p([t('Alpha',[{type:'bold'}])]))));
 assert.equal(result.counts.structure,2);assert.equal(result.counts.formatting,1);assert.equal(result.details.filter(d=>d.moved).length,2);
});
test('a local replacement does not steal a unique exact counterpart in another container',()=>{
 const result=compareDocuments(doc(quote(p('Left'),p('Transfer')),quote(p('Right'))),doc(quote(p('Left'),p('Replacement')),quote(p('Right'),p('Transfer'))));
 assert.equal(result.counts.structure,2);assert.equal(result.details.filter(d=>d.moved).length,1);assert.equal(result.details.filter(d=>/Added paragraph/.test(d.description)).length,1);
});
test('moved nested containers produce one move while retaining descendant formatting checks',()=>{
 const list=marks=>({type:'bulletList',content:[{type:'listItem',content:[p([t('Nested unique',marks)])]}]});
 const result=compareDocuments(doc(quote(p('Left'),list([])),quote(p('Right'))),doc(quote(p('Left')),quote(p('Right'),list([{type:'italic'}]))));
 assert.equal(result.counts.structure,1);assert.equal(result.counts.formatting,1);assert.match(result.details.find(d=>d.moved).description,/Moved bulletList/);
});
test('cross-container object moves do not reveal embedded data',()=>{
 const image={type:'image',attrs:{src:'data:image/png;base64,PRIVATE',alt:'Picture'}};
 const result=compareDocuments(doc(quote(p('Left'),image),quote(p('Right'))),doc(quote(p('Left')),quote(p('Right'),image)));
 assert.equal(result.counts.structure,1);assert.equal(result.counts.objects,0);assert.ok(result.details[0].moved);assert.ok(!JSON.stringify(result.details).includes('PRIVATE'));
});
test('global repeats cannot become unique moves when another occurrence matched locally',()=>{
 const result=compareDocuments(doc(quote(p('Left'),p('Repeat')),quote(p('Right')),p('Repeat')),doc(quote(p('Left')),quote(p('Right'),p('Repeat')),p('Repeat')));
 assert.equal(result.details.some(d=>d.moved),false);assert.equal(result.counts.structure,2);assert.equal(result.limited,true);
});
test('new and deleted whole containers remain aggregate changes',()=>{
 const result=compareDocuments(doc(quote(p('Left'),p('Transfer')),quote(p('Right'))),doc(quote(p('Left')),quote(p('Right')),{type:'bulletList',content:[{type:'listItem',content:[p('Transfer')]}]}));
 assert.equal(result.details.some(d=>d.moved),false);assert.equal(result.counts.structure,2);
});
test('rewritten cross-container paragraphs remain additions and removals',()=>{
 const result=compareDocuments(doc(quote(p('Left'),p('Old wording')),quote(p('Right'))),doc(quote(p('Left')),quote(p('Right'),p('New wording'))));
 assert.equal(result.details.some(d=>d.moved),false);assert.equal(result.counts.structure,2);
});
test('truncated indexes do not claim globally unique moves',()=>{
 const before=doc(quote(p('Left'),p('Transfer')),quote(p('Right')),p('Tail')),after=doc(quote(p('Left')),quote(p('Right'),p('Transfer')),p('Tail'));
 for(const options of [{maxNodes:10},{maxCharacters:15}]){const result=compareDocuments(before,after,{}, {},options);assert.ok(result.limited);assert.equal(result.details.some(d=>d.moved),false)}
 const limited=compareDocuments(before,after,{}, {},{maxDetails:0});assert.equal(limited.counts.structure,1);assert.equal(limited.details.length,0);assert.ok(limited.limited);
});
