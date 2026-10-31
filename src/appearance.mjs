import {applyThemeChrome} from './theme-chrome.mjs';
export const UI_THEMES=['system','white','colored','grey','dark'];
export const normalizeUITheme=value=>UI_THEMES.includes(value)?value:'system';
export const resolveUITheme=(value,dark)=>normalizeUITheme(value)==='system'?(dark?'dark':'white'):normalizeUITheme(value);
export const normalizeAccent=value=>/^#[\da-f]{6}$/i.test(value||'')?value.toLowerCase():'#286453';
const rgb=hex=>hex.slice(1).match(/../g).map(n=>parseInt(n,16));
function luminance(hex){return rgb(hex).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0)}
export function accentColors(value,dark){const original=normalizeAccent(value);let channels=rgb(original),accent=original;const target=dark?1:0;for(let i=0;i<100;i++){let light=luminance(accent),ratio=dark?(light+.05)/(.034+.05):(1.05)/(light+.05);if(ratio>=4.5)break;channels=channels.map(n=>n+(target*255-n)*.06);accent='#'+channels.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('')}return {accent,contrast:luminance(accent)>.179?'#102019':'#ffffff'}}
export function initAppearance(){const media=matchMedia('(prefers-color-scheme: dark)');let preference='system',accent='#286453',darkPage=false,saved=true;
 try{preference=normalizeUITheme(localStorage.getItem('document-studio.appearance'));const options=JSON.parse(localStorage.getItem('document-studio.preferences')||'{}');accent=normalizeAccent(options?.accent);darkPage=options?.darkPage===true}catch{}
 function apply(){const theme=resolveUITheme(preference,media.matches),colors=accentColors(accent,theme==='dark');document.body.dataset.uiTheme=theme;document.body.dataset.themePreference=preference;document.body.dataset.darkPage=String(darkPage&&theme==='dark');for(const [name,value] of Object.entries({'--accent':colors.accent,'--accent-contrast':colors.contrast,'--chosen-accent':accent}))document.body.style.setProperty(name,value);applyThemeChrome(document,theme,accent)}
 function persist(){saved=true;try{localStorage.setItem('document-studio.appearance',preference);localStorage.setItem('document-studio.preferences',JSON.stringify({accent,darkPage}))}catch{saved=false}apply();return saved}
 media.addEventListener('change',apply);apply();return {get:()=>preference,options:()=>({accent,darkPage,saved}),set(value){preference=normalizeUITheme(value);return persist()},setAccent(value){accent=normalizeAccent(value);return persist()},setDarkPage(value){darkPage=value===true;return persist()}}}
