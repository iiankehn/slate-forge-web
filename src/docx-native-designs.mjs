import {ShapeGroupRun} from 'docx/shapes';
import {Paragraph,TextRun} from 'docx';
import {normalizeScene} from './design-model.mjs';
const rgb=value=>value.slice(1),fill=(value,opacity)=>value==='none'?'none':{color:rgb(value),transparency:100-opacity};
function picture(source){const match=/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+=*)$/i.exec(source);if(!match)throw Error('A canvas picture cannot be exported as a native Word object.');if(match[1].toLowerCase()==='webp')throw Error('Native Word objects require PNG, JPEG or GIF pictures. Use the preview-image export for this canvas.');return {type:match[1].toLowerCase()==='jpeg'?'jpg':match[1].toLowerCase(),data:Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0))}}
export function nativeCanvasOptions(input,width,height){
 const scene=normalizeScene(input),children=[{id:'canvas-background',type:'rectangle',transformation:{width:900,height:scene.height,offset:{left:0,top:0}},fill:scene.background==='none'?'none':rgb(scene.background),line:'none',altText:{name:'SlateForgeCanvasBackground'}}];
 for(const object of scene.objects){if(object.hidden)continue;const o=object,transformation={width:o.width,height:o.height,offset:{left:o.x,top:o.y},rotation:o.rotation},line=o.stroke==='none'||!o.strokeWidth?'none':{color:rgb(o.stroke),width:o.strokeWidth*.75,transparency:100-o.opacity},base={id:o.id,transformation,fill:fill(o.fill,o.opacity),line,altText:{name:o.id,title:o.type==='text'?o.text.slice(0,100):o.type}};
  if(o.type==='rect')children.push({...base,type:o.radius?'roundedRectangle':'rectangle',...(o.radius?{adjustments:{cornerRadius:Math.min(50,o.radius/Math.min(o.width,o.height)*100)}}:{})});
  else if(o.type==='ellipse')children.push({...base,type:'ellipse'});
  else if(o.type==='text'){if(o.opacity<100)throw Error('Translucent canvas text currently requires preview-image DOCX export.');children.push({...base,type:'rectangle',children:o.text.split('\n').map(text=>new Paragraph({alignment:o.align,spacing:{after:0,before:0},children:[new TextRun({text,font:o.font,size:o.fontSize*1.5,bold:o.bold,color:rgb(o.textColor)})]})),textOptions:{verticalAlignment:'top',margins:{left:7.5,right:7.5,top:6,bottom:0},wrap:true}})}
  else if(o.type==='line'||o.type==='arrow')children.push({...base,type:'line',fill:'none',line:line==='none'?'none':{...line,...(o.type==='arrow'?{endArrow:'triangle'}:{})}});
  else if(o.type==='path'){
   if(o.points.some(point=>point.length>2&&point[2]!==1))throw Error('Pressure-varying strokes currently require preview-image DOCX export. Native fixed-width paths are supported.');
   if(o.points.length>1)children.push({...base,type:'custom',fill:'none',path:o.points.map((point,index)=>(index?'L':'M')+(point[0]*o.width)+' '+(point[1]*o.height)).join(' ')});
  }else if(o.type==='image'){
   const scale=o.zoom/100,baseWidth=o.fit==='contain'?Math.min(o.width,o.height*o.aspectRatio):Math.max(o.width,o.height*o.aspectRatio),iw=baseWidth*scale,ih=iw/o.aspectRatio,x=(o.width-iw)*o.cropX/100,y=(o.height-ih)*o.cropY/100,crop={left:Math.max(0,-x/iw*100),right:Math.max(0,(iw-o.width+x)/iw*100),top:Math.max(0,-y/ih*100),bottom:Math.max(0,(ih-o.height+y)/ih*100)};
   // A picture fill keeps crop, flips and opacity independently editable in Word.
   children.push({...base,type:'rectangle',transformation:{...transformation,width:Math.min(iw,o.width),height:Math.min(ih,o.height),offset:{left:o.x+Math.max(0,x),top:o.y+Math.max(0,y)},flip:{horizontal:o.flipX,vertical:o.flipY}},fill:{type:'picture',image:picture(o.src),crop,transparency:100-o.opacity}});
  }
 }
 return {children,transformation:{width,height},altText:{name:'SlateForgeNativeCanvas',title:scene.title,description:scene.description||scene.title}};
}
export const nativeCanvasRun=(scene,width,height)=>new ShapeGroupRun(nativeCanvasOptions(scene,width,height));
