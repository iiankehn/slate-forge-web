export const DOCUMENT_STYLES={
 studio:{name:'Forge',description:'A clear, modern hierarchy with a serif body.',font:'Georgia',headingFont:'Arial',line:'1.65',sizes:[30,21,15],color:'25322F'},
 editorial:{name:'Editorial',description:'Expressive serif headings and warm accents.',font:'Georgia',headingFont:'Georgia',line:'1.65',sizes:[32,22,16],color:'79533A'},
 classic:{name:'Classic',description:'Traditional typography for formal documents.',font:'Times New Roman',headingFont:'Times New Roman',line:'1.65',sizes:[26,18,14],color:'27384A'}
};
export const styleKey=value=>Object.hasOwn(DOCUMENT_STYLES,value)?value:'studio';
export function typographyCSS(layout,prefix='article'){const style=DOCUMENT_STYLES[styleKey(layout.theme)];return style.sizes.map((size,i)=>`${prefix} h${i+1}{font-family:'${style.headingFont}',serif;font-size:${size}pt;color:${/^#[a-f\d]{6}$/i.test(layout.headingColor||'')?layout.headingColor:'#'+style.color};line-height:1.2;letter-spacing:${layout.theme==='classic'?'0':'-.5px'};margin-top:1.2em;margin-bottom:.5em}`).join('')}
export const TEMPLATES=[
 {id:'blank',name:'Blank document',description:'A clean page, ready for your ideas.',content:'<p></p>'},
 {id:'report',name:'Report',description:'Summary, findings, and next steps.',content:'<h1>Report title</h1><p>Subtitle or description</p><h2>Overview</h2><p></p><h2>Findings</h2><p></p><h2>Next steps</h2><p></p>'},
 {id:'letter',name:'Letter',description:'A considered layout for correspondence.',content:'<p>Your name<br>Your address</p><p>Date</p><p>Dear recipient,</p><p></p><p>Best regards,</p><p>Your name</p>'},
 {id:'proposal',name:'Project proposal',description:'Purpose, approach, and milestones.',content:'<h1>Project proposal</h1><p>Project name · Prepared for</p><h2>Summary</h2><p></p><h2>Objectives</h2><p></p><h2>Approach</h2><p></p><h2>Milestones</h2><table><tr><th><p>Milestone</p></th><th><p>Target date</p></th></tr><tr><td><p></p></td><td><p></p></td></tr></table><h2>Next steps</h2><p></p>'},
 {id:'brief',name:'Creative brief',description:'A focused starting point for creative work.',content:'<h1>Creative brief</h1><p>Project name · Prepared by</p><h2>Purpose</h2><p></p><h2>Audience</h2><p></p><h2>Deliverables</h2><p></p><h2>Schedule</h2><p></p>'}
];
