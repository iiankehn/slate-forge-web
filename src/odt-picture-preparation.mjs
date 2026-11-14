import {normalizeScene} from './design-model.mjs';
import {nativePictureInfo} from './odt-pictures.mjs';
const failure=()=>Error('This WebP picture could not be prepared for native ODT. Use a smaller static picture or preview export.');
async function browserPNG(src){
 const image=new Image();let canvas;
 try{image.src=src;await image.decode();if(image.naturalWidth*image.naturalHeight>24000000)throw failure();canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');if(!context)throw failure();context.drawImage(image,0,0);return Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0))}
 finally{image.src='';if(canvas)canvas.width=canvas.height=0}
}
// Normalize WebP pixels to PNG: Writer uses inconsistent WebP crop densities
// between rendering and resaving. Keep the editor/review snapshot untouched.
export async function prepareOdtNativePictures(content,images=new Map(),{encode=browserPNG}={}){
 const sources=new Set();let nodes=0,pixels=0;
 function visit(node,depth=0){if(!node||++nodes>100000||depth>100)throw failure();if(node.type==='designCanvas')for(const o of normalizeScene(node.attrs?.scene).objects)if(!o.hidden&&o.type==='image'&&/^data:image\/webp;/i.test(o.src))sources.add(o.src);for(const child of node.content||[])visit(child,depth+1)}visit(content);
 const prepared=new Map();for(const src of sources){let bytes;try{bytes=Uint8Array.from(atob(src.split(',')[1]),c=>c.charCodeAt(0))}catch{throw failure()}const info=nativePictureInfo(bytes);if(info.type!=='webp'||info.width*info.height>24000000||(pixels+=info.width*info.height)>60000000)throw failure();const png=await encode(src),result=nativePictureInfo(png);if(result.type!=='png'||result.width!==info.width||result.height!==info.height)throw failure();prepared.set(src,{type:'png',width:result.width,height:result.height,data:png})}
 for(const [src,image]of prepared)images.set(src,image);return images;
}
