import {FONTS} from './document-model.mjs';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main',A='http://schemas.openxmlformats.org/drawingml/2006/main';
const attr=(n,k)=>n?.getAttributeNS(W,k)||'';
export function readDocxTheme(source,Parser){
 if(!source)return null;
 const doc=new Parser().parseFromString(source,'application/xml');
 if(doc.doctype||doc.querySelector('parsererror'))throw Error('Invalid DOCX theme XML.');
 const colors=new Map(),fonts=new Map(),scheme=doc.getElementsByTagNameNS(A,'clrScheme')[0];
 for(const item of scheme?.children||[]){const value=item.firstElementChild;const hex=value?.localName==='sysClr'?value.getAttribute('lastClr'):value?.localName==='srgbClr'?value.getAttribute('val'):'';if(/^[a-f\d]{6}$/i.test(hex||''))colors.set(item.localName,hex.toUpperCase())}
 for(const kind of ['major','minor']){const group=doc.getElementsByTagNameNS(A,kind+'Font')[0],latin=group?.getElementsByTagNameNS(A,'latin')[0];if(latin)fonts.set(kind,latin.getAttribute('typeface'))}
 return {colors,fonts};
}
export function resolveThemeRun(props,theme,warnings=[]){
 if(!theme)return;
 const font=[...props.children].find(n=>n.localName==='rFonts'),color=[...props.children].find(n=>n.localName==='color');
 if(font){for(const [slot,key]of [['ascii','asciiTheme'],['hAnsi','hAnsiTheme']]){const reference=attr(font,key);if(!reference)continue;const name=theme.fonts.get(/^(major|minor)(Ascii|HAnsi)$/.exec(reference)?.[1]);if(name&&FONTS.includes(name))font.setAttributeNS(W,'w:'+slot,name);else warnings.push('An unsupported theme font uses a supported fallback.');font.removeAttributeNS(W,key)}}
 const reference=attr(color,'themeColor');if(!reference)return;
 const aliases={dark1:'dk1',light1:'lt1',dark2:'dk2',light2:'lt2',text1:'dk1',background1:'lt1',text2:'dk2',background2:'lt2',hyperlink:'hlink',followedHyperlink:'folHlink'};
 const hex=theme.colors.get(aliases[reference]||reference);if(!hex){warnings.push('An unresolved theme color uses its stored fallback.');return}
 const tint=attr(color,'themeTint'),shade=attr(color,'themeShade'),channels=hex.match(/../g).map(v=>parseInt(v,16));
 const result=channels.map(v=>{if(/^[a-f\d]{2}$/i.test(shade))v*=parseInt(shade,16)/255;if(/^[a-f\d]{2}$/i.test(tint))v=255-(255-v)*parseInt(tint,16)/255;return Math.round(v).toString(16).padStart(2,'0')}).join('').toUpperCase();
 color.setAttributeNS(W,'w:val',result);for(const key of ['themeColor','themeTint','themeShade'])color.removeAttributeNS(W,key);
}
