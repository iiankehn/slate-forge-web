import {nativeObjectTransform} from './design-affine.mjs';
import {outlinePath,pressureOutlines} from './design-outlines.mjs';
import {ShapeGroupRun} from 'docx/shapes';
import {Paragraph,TextRun,ImportedXmlComponent} from 'docx';
import {normalizeScene} from './design-model.mjs';
const rgb=value=>value.slice(1),fill=(value,opacity)=>value==='none'?'none':{color:rgb(value),transparency:100-opacity};
function picture(source){const match=/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+=*)$/i.exec(source);if(!match)throw Error('A canvas picture cannot be exported as a native Word object.');if(match[1].toLowerCase()==='webp')throw Error('Native Word objects require PNG, JPEG or GIF pictures. Use the preview-image export for this canvas.');return {type:match[1].toLowerCase()==='jpeg'?'jpg':match[1].toLowerCase(),data:Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0))}}
function nativeText(text,o){const run=new TextRun({text,font:o.font,size:o.fontSize*1.5,bold:o.bold,color:rgb(o.textColor)});if(o.opacity<100)run.properties.addChildElement(ImportedXmlComponent.fromXmlString('<w14:textFill xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:solidFill><a:srgbClr val="'+rgb(o.textColor)+'"><a:alpha val="'+Math.round(o.opacity*1000)+'"/></a:srgbClr></a:solidFill></w14:textFill>'));return run}
export function nativeCanvasOptions(input,width,height){
 const scene=normalizeScene(input),sourceById=new Map(scene.objects.map(object=>[object.id,object])),reserved=new Set(scene.objects.map(object=>object.id));let serial=0;const unique=()=>{let id;do{id='forge-native-'+(++serial)}while(reserved.has(id));reserved.add(id);return id};const children=[{id:unique(),type:'rectangle',transformation:{width:900,height:scene.height,offset:{left:0,top:0}},fill:scene.background==='none'?'none':rgb(scene.background),line:'none',altText:{name:'SlateForgeCanvasBackground'}}];
 for(const object of scene.objects){if(object.hidden)continue;const o=object,transformation={width:o.width,height:o.height,offset:{left:o.x,top:o.y},rotation:o.rotation,...(o.flipX||o.flipY?{flip:{horizontal:o.flipX===true,vertical:o.flipY===true}}:{})},line=o.stroke==='none'||!o.strokeWidth?'none':{color:rgb(o.stroke),width:o.strokeWidth*.75,transparency:100-o.opacity},base={id:o.id,transformation,fill:fill(o.fill,o.opacity),line,altText:{name:o.id,title:o.type==='text'?o.text.slice(0,100):o.type}};
  if(o.type==='rect')children.push({...base,type:o.radius?'roundedRectangle':'rectangle',...(o.radius?{adjustments:{cornerRadius:Math.min(50,o.radius/Math.min(o.width,o.height)*100)}}:{})});
  else if(o.type==='ellipse')children.push({...base,type:'ellipse'});
  else if(o.type==='text'){children.push({...base,type:'rectangle',children:o.text.split('\n').map(text=>new Paragraph({alignment:o.align,spacing:{after:0,before:0},children:[nativeText(text,o)]})),textOptions:{verticalAlignment:'top',margins:{left:7.5,right:7.5,top:6,bottom:0},wrap:true}})}
  else if(o.type==='line'||o.type==='arrow')children.push({...base,type:'line',fill:'none',line:line==='none'?'none':{...line,...(o.type==='arrow'?{endArrow:'triangle'}:{})}});
  else if(o.type==='path'){
   if(o.outlines)children.push({...base,type:'custom',path:outlinePath(o.outlines,o.width,o.height)});
   else if(o.points.some(point=>point.length>2)){const geometry=pressureOutlines(o,scene.height);if(geometry){if(!geometry.outlines)throw Error('Native pressure outline exceeds the geometry limit.');children.push({...base,type:'custom',transformation:{width:geometry.width,height:geometry.height,offset:{left:geometry.x,top:geometry.y}},fill:fill(o.stroke,o.opacity),line:'none',path:outlinePath(geometry.outlines,geometry.width,geometry.height)})}}
   else if(o.points.length>1)children.push({...base,type:'custom',fill:'none',line:o.stroke==='none'?'none':{color:rgb(o.stroke),width:Math.max(1,o.strokeWidth)*.75,transparency:100-o.opacity},path:o.points.map((point,index)=>(index?'L':'M')+(point[0]*o.width)+' '+(point[1]*o.height)).join(' ')});
  }else if(o.type==='image'){
   const scale=o.zoom/100,baseWidth=o.fit==='contain'?Math.min(o.width,o.height*o.aspectRatio):Math.max(o.width,o.height*o.aspectRatio),iw=baseWidth*scale,ih=iw/o.aspectRatio,x=(o.width-iw)*o.cropX/100,y=(o.height-ih)*o.cropY/100,crop={left:Math.max(0,-x/iw*100),right:Math.max(0,(iw-o.width+x)/iw*100),top:Math.max(0,-y/ih*100),bottom:Math.max(0,(ih-o.height+y)/ih*100)};
   // A picture fill keeps crop, flips and opacity independently editable in Word.
   children.push({...base,type:'rectangle',line:'none',transformation:{...transformation,width:Math.min(iw,o.width),height:Math.min(ih,o.height),offset:{left:o.x+Math.max(0,x),top:o.y+Math.max(0,y)},flip:{horizontal:o.flipX,vertical:o.flipY}},fill:{type:'picture',image:picture(o.src),crop,transparency:100-o.opacity}});
  }
 }
 for(let i=1;i<children.length;i++){const object=sourceById.get(children[i].id);if(!object||object.type==='path'&&!object.outlines&&object.points.some(point=>point.length>2))continue;const id=unique();children[i]=nativeObjectTransform(children[i],object,id);sourceById.set(children[i].id,object)}
 // Native groups must remain adjacent in the layer stack: moving a separated
 // member across another layer would change what the document displays.
 const groups=new Map(),closed=new Set();let previous='';
 for(const child of children.slice(1)){const group=sourceById.get(child.id)?.group||'';if(previous&&group!==previous)closed.add(previous);if(group&&closed.has(group))throw Error('Native Word export requires grouped layers to be adjacent. Move the layers together or use preview-image export.');previous=group;if(group){if(!groups.has(group))groups.set(group,[]);groups.get(group).push(child)}}
 const emitted=new Set(),grouped=[children[0]];
 for(const child of children.slice(1)){const group=sourceById.get(child.id)?.group||'';if(!group){grouped.push(child);continue}if(emitted.has(group))continue;emitted.add(group);const members=groups.get(group),left=Math.min(...members.map(item=>item.transformation.offset.left)),top=Math.min(...members.map(item=>item.transformation.offset.top));grouped.push({id:unique(),type:'group',transformation:{offset:{left,top}},children:members})}
 return {children:grouped,transformation:{width,height},altText:{name:'SlateForgeNativeCanvas',title:scene.title,description:scene.description||scene.title}};
}
class NativeCanvasRun extends ShapeGroupRun{
 constructor(options,height){super(options);this.canvasHeight=height}
 prepForXml(context){const result=super.prepForXml(context),height=this.canvasHeight;function patch(value){if(!value||typeof value!=='object')return false;if(value['wpg:wgp']){const props=value['wpg:wgp'].find(part=>part['wpg:grpSpPr'])?.['wpg:grpSpPr'],transform=props?.find(part=>part['a:xfrm'])?.['a:xfrm'];if(transform){for(const item of transform){if(item['a:chOff'])item['a:chOff']={_attr:{x:0,y:0}};if(item['a:chExt'])item['a:chExt']={_attr:{cx:900*9525,cy:height*9525}}}return true}}for(const item of Object.values(value))if(patch(item))return true;return false}patch(result);return result}
}
export const nativeCanvasRun=(scene,width,height)=>new NativeCanvasRun(nativeCanvasOptions(scene,width,height),normalizeScene({height:scene?.height}).height);
