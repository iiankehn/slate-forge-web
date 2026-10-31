import {FORMAT_REVIEW_CSS} from './format-review.mjs';
import {REVIEW_CSS} from './review.mjs';
import {SECTION_CSS} from './sections.mjs';
import {DESIGN_CSS} from './design-model.mjs';
import {exportedNotesHTML,REFERENCE_CSS} from './references.mjs';
import {normalizeLayout} from './document-model.mjs';
import {typographyCSS} from './document-styles.mjs';
import {OBJECT_CSS} from './object-design.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function exportHTMLDocument(content,title,settings){const l=normalizeLayout(settings);return `<!doctype html><html lang="${l.language}"><head><meta charset="utf-8"><meta name="generator" content="Slate Forge"><title>${escape(title)}</title><meta name="document-studio-layout" content="${escape(JSON.stringify(l))}"><style>body{max-width:170mm;margin:24mm auto;font:12pt/${l.line} '${l.font}',serif;color:#242d2c}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:8px}h1,h2,h3{line-height:1.2}a{color:#286453}[data-page-break]{break-before:page}[data-page-break] span{display:none}header,footer{font:10pt system-ui;color:#68746e;margin:16px 0}@page{size:${l.size==='Letter'?'letter':'A4'} ${l.orientation};margin:${l.margin}mm}@media print{body{margin:0}}${OBJECT_CSS}${REFERENCE_CSS}${DESIGN_CSS}${REVIEW_CSS}${FORMAT_REVIEW_CSS}${SECTION_CSS}${typographyCSS(l)}</style></head><body><header>${escape(l.header)}</header><article>${content}</article>${exportedNotesHTML(content)}<footer>${escape(l.footer)}</footer></body></html>`}
export function readHTMLDocument(input,sanitize,Parser=DOMParser){const doc=new Parser().parseFromString(input,'text/html');let settings={};try{settings=JSON.parse(doc.querySelector('meta[name="document-studio-layout"]')?.content||'{}')}catch{}return {title:doc.title,layout:normalizeLayout(settings),content:sanitize(doc.querySelector('article')?.innerHTML||doc.body.innerHTML)}}
