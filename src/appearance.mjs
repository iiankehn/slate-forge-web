import {applyThemeChrome} from './theme-chrome.mjs';
export const THEME_PRESETS={
 system:{label:'Match system'},white:{label:'Porcelain'},colored:{label:'Soft accent'},grey:{label:'Graphite light'},dark:{label:'Charcoal'},
 linen:{label:'Linen',mode:'white',colors:{bg:'#ece7df',surface:'#fffcf6',panel:'#f7f1e8',ink:'#342d29',muted:'#71645b',line:'#d6cbbd'}},
 mist:{label:'Mist',mode:'white',colors:{bg:'#e6edf1',surface:'#f9fcff',panel:'#edf4f8',ink:'#263845',muted:'#566e7d',line:'#c8d7e0'}},
 sage:{label:'Sage',mode:'white',colors:{bg:'#e4ebe3',surface:'#f9fcf6',panel:'#edf3e9',ink:'#2d3b2d',muted:'#4e624d',line:'#c9d6c4'}},
 midnight:{label:'Midnight',mode:'dark',colors:{bg:'#111b2b',surface:'#1b2a40',panel:'#172338',ink:'#e5edf8',muted:'#a7b8d0',line:'#344861'}},
 plum:{label:'Dusk',mode:'dark',colors:{bg:'#251d2b',surface:'#362b3e',panel:'#2e2535',ink:'#f3e9f4',muted:'#c3aec9',line:'#58445f'}},
 forest:{label:'Evergreen',mode:'dark',colors:{bg:'#12251f',surface:'#20392f',panel:'#193027',ink:'#e4f1e9',muted:'#abc5b5',line:'#3b5a49'}}
};
export const UI_THEMES=Object.keys(THEME_PRESETS);
export const normalizeUITheme=value=>UI_THEMES.includes(value)?value:'system';
export const resolveUITheme=(value,dark)=>normalizeUITheme(value)==='system'?(dark?'dark':'white'):(THEME_PRESETS[normalizeUITheme(value)].mode||normalizeUITheme(value));
export const normalizeAccent=value=>/^#[\da-f]{6}$/i.test(value||'')?value.toLowerCase():'#286453';
const rgb=hex=>hex.slice(1).match(/../g).map(n=>parseInt(n,16));
function luminance(hex){return rgb(hex).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0)}
export function accentColors(value,dark){const original=normalizeAccent(value);let channels=rgb(original),accent=original;const target=dark?1:0;for(let i=0;i<100;i++){let light=luminance(accent),ratio=dark?(light+.05)/(.034+.05):(1.05)/(light+.05);if(ratio>=4.5)break;channels=channels.map(n=>n+(target*255-n)*.06);accent='#'+channels.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('')}return {accent,contrast:luminance(accent)>.179?'#102019':'#ffffff'}}
export function initAppearance(){const media=matchMedia('(prefers-color-scheme: dark)');let preference='system',accent='#286453',darkPage=false,saved=true;
 try{preference=normalizeUITheme(localStorage.getItem('document-studio.appearance'));const options=JSON.parse(localStorage.getItem('document-studio.preferences')||'{}');accent=normalizeAccent(options?.accent);darkPage=options?.darkPage===true}catch{}
 function apply(){const theme=resolveUITheme(preference,media.matches),colors=accentColors(accent,theme==='dark');document.body.dataset.uiTheme=theme;document.body.dataset.themePreference=preference;document.body.dataset.darkPage=String(darkPage&&theme==='dark');for(const [name,value] of Object.entries({'--accent':colors.accent,'--accent-contrast':colors.contrast,'--chosen-accent':accent}))document.body.style.setProperty(name,value);applyThemeChrome(document,theme,accent);document.body.dataset.uiPalette=preference;const palette=THEME_PRESETS[preference].colors;for(const name of ['bg','surface','panel','ink','muted','line']){if(palette)document.body.style.setProperty('--'+name,palette[name]);else document.body.style.removeProperty('--'+name)}if(palette){document.documentElement.style.backgroundColor=palette.surface;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',palette.surface)}}
 function persist(){saved=true;try{localStorage.setItem('document-studio.appearance',preference);localStorage.setItem('document-studio.preferences',JSON.stringify({accent,darkPage}))}catch{saved=false}apply();return saved}
 media.addEventListener('change',apply);apply();return {get:()=>preference,options:()=>({accent,darkPage,saved}),set(value){preference=normalizeUITheme(value);return persist()},setAccent(value){accent=normalizeAccent(value);return persist()},setDarkPage(value){darkPage=value===true;return persist()}}}
