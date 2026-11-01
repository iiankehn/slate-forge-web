const rtl=/[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Adlam}\p{Script=Mandaic}]/u,letter=/\p{L}/u;
export const textDirection=value=>['auto','ltr','rtl'].includes(value)?value:'auto';
export function resolveTextDirection(text,mode='auto'){if(mode==='ltr'||mode==='rtl')return mode;for(const char of String(text)){if(rtl.test(char))return 'rtl';if(letter.test(char))return 'ltr'}return 'ltr'}
export function paragraphTextDirection(node){let text='';function visit(item){if(text.length>200000)return;if(item.type==='text')text+=item.text||'';else for(const child of item.content||[])visit(child)}visit(node);return resolveTextDirection(text,textDirection(node.attrs?.textDirection))}
