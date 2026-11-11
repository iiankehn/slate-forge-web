import {readNativeBox,readOdtTransform,odtPoint} from './odt-transforms.mjs';
import {strokeCapSteps,strokePoint,outlinedLine,validateRigidPaint,transformedPath,directedLineBox,resetStrokeTransform} from './odt-stroke-transforms.mjs';
import {canonicalOdtOutlines} from './odt-outline-union.mjs';
import {normalizeOutlines,pressureOutlines,outlinePath} from './design-outlines.mjs';
import {odtAttr as attr,odtLength} from './odt-styles.mjs';
export const ODT_ARROW_MARKER='<draw:marker draw:name="SlateForgeArrow" svg:viewBox="0 0 1000000 915244" svg:d="M500000 0 L0 915244 L1000000 915244 Z"/>';
export const arrowWidth=stroke=>(12+stroke)*2*Math.sin(.5);
const error=()=>{throw Error('Unsupported or oversized native ODT stroke geometry. Use a preview-image ODT or HTML/workspace backup.');};
const numeric=/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i;
function tokens(source){if(typeof source!=='string'||source.length>2000000)error();const result=[],pattern=/[a-zA-Z]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/gy;let at=0;while(at<source.length){const gap=/^[\s,]+/.exec(source.slice(at));if(gap){at+=gap[0].length;continue}pattern.lastIndex=at;const m=pattern.exec(source);if(!m||result.length>=150000)error();const value=numeric.test(m[0])?Number(m[0]):m[0];if(typeof value==='number'&&(!Number.isFinite(value)||Math.abs(value)>1e12))error();result.push(value);at=pattern.lastIndex}return result}
function viewbox(node){const v=tokens(attr(node,'svg','viewBox'));if(v.length!==4||v.some(n=>typeof n!=='number')||v[2]<0||v[3]<0)error();return v}
function normalized(points,v){return points.map(pair=>pair.map((p,i)=>{if(!v[i+2]&&p!==v[i])error();const n=(p-v[i])/(v[i+2]||1);if(n<-.00001||n>1.00001||!Number.isFinite(n))error();return Math.max(0,Math.min(1,n))}))}
export function readLinearOdtPath(node){
 const v=viewbox(node);let paths=[],count=0;
 if(['polyline','polygon'].includes(node.localName)){const values=tokens(attr(node,'draw','points'));if(values.length%2||values.some(n=>typeof n!=='number'))error();const points=[];for(let i=0;i<values.length;i+=2)points.push(values.slice(i,i+2));paths=[{closed:node.localName==='polygon',points}];count=points.length}
 else {const values=tokens(attr(node,'svg','d'));let at=0,command=null,current=[0,0],start=null,path=null;const finish=closed=>{if(!path)error();paths.push({closed,points:path});path=null;if(paths.length>2000)error()};
  while(at<values.length){if(typeof values[at]==='string'){command=values[at++];if(!/^[MLHVZ]$/i.test(command))error();if(command.toUpperCase()==='Z'){finish(true);current=[...start];command=null;continue}}if(!command)error();const upper=command.toUpperCase(),relative=command!==upper,n=upper==='M'||upper==='L'?2:1,args=values.slice(at,at+n);if(args.length!==n||args.some(a=>typeof a!=='number'))error();at+=n;let next;if(upper==='M'||upper==='L')next=args.map((p,i)=>p+(relative?current[i]:0));else next=upper==='H'?[args[0]+(relative?current[0]:0),current[1]]:[current[0],args[0]+(relative?current[1]:0)];if(upper==='M'){if(path)finish(false);path=[];start=[...next];command=relative?'l':'L'}if(!path||++count>44000)error();path.push(next);current=next;
  }if(path)finish(false);
 }
 if(!paths.length||count>44000)error();paths=paths.map(p=>({...p,points:normalized(p.points,v)}));
 if(paths.every(p=>p.closed)){const outlines=normalizeOutlines(paths.map(p=>p.points));if(!outlines)error();return {outlines,count}}
 if(paths.length!==1||paths[0].closed||paths[0].points.length<2||paths[0].points.length>2000)error();return {points:paths[0].points,count};
}
export function nativeStrokeObjects(scene){
 let count=0;const budget={points:0,intersections:0},objects=[];
 for(const object of scene.objects){
  if(object.hidden)continue;let o=object;
  if(['line','arrow'].includes(o.type)){
   if(o.skewX){if(o.stroke==='none')error();o=outlinedLine(o,scene.height)}
   else {const a=strokePoint(o,0,0),b=strokePoint(o,o.width,o.height);directedLineBox(...a,...b,scene.height);validateRigidPaint(o,scene.height)}
  }
  if(o.type==='path'){
   if(o.outlines&&(o.rotation||o.skewX||o.flipX||o.flipY)){if(o.stroke!=='none'&&o.strokeWidth)error();o=transformedPath(o,scene.height)}
   if(o.outlines){if(o.fill!=='none')o={...o,outlines:canonicalOdtOutlines(o.outlines,budget,o.stroke!=='none'&&o.strokeWidth>0)};count+=o.outlines.reduce((sum,p)=>sum+p.length,0)}
   else if(o.points.some(p=>p.length>2)||o.skewX){
    if(o.points.length>512)error();const source=o.points.some(p=>p.length>2)?o:{...o,strokeWidth:Math.max(1,o.strokeWidth)},steps=strokeCapSteps(o.skewX),geometry=pressureOutlines(source,scene.height,steps);
    if(!geometry?.outlines)error();o={...o,...geometry,...resetStrokeTransform,outlines:canonicalOdtOutlines(geometry.outlines,budget),fill:o.stroke,stroke:'none',strokeWidth:0,points:[]};count+=o.outlines.reduce((sum,p)=>sum+p.length,0);
   }else{if(o.rotation||o.flipX||o.flipY)o=transformedPath(o,scene.height);if(o.points.length<2)error();validateRigidPaint(o,scene.height);count+=o.points.length;o={...o,fill:'none',strokeWidth:Math.max(1,o.strokeWidth)}}
  }
  if(count>500000)error();objects.push(o);
 }
 return objects;
}
export function nativeStrokeXML(o,common,scale,graphic,mm){
 if(o.type==='line'||o.type==='arrow'){const p={...o,fill:'none',strokeWidth:Math.max(1,o.strokeWidth)},style=graphic(p,o.type==='arrow'?o.strokeWidth:null),a=strokePoint(o,0,0),b=strokePoint(o,o.width,o.height);return '<draw:line draw:name="'+common+'" draw:style-name="'+style+'" svg:x1="'+mm(a[0]*scale)+'" svg:y1="'+mm(a[1]*scale)+'" svg:x2="'+mm(b[0]*scale)+'" svg:y2="'+mm(b[1]*scale)+'"/>'}
 if(o.type!=='path')return null;
 // Writer normalizes path extents on save without adding a nonzero vertex
 // minimum to svg:x/y. Emit the occupied frame so that normalization cannot
 // move the visible vertices. This projection affects native XML only.
 let minX=1,minY=1,maxX=0,maxY=0;for(const loop of o.outlines||[o.points])for(const p of loop){minX=Math.min(minX,p[0]);minY=Math.min(minY,p[1]);maxX=Math.max(maxX,p[0]);maxY=Math.max(maxY,p[1])}
 const dx=maxX-minX,dy=maxY-minY;
 if(dx<1e-10||dy<1e-10){
  if(o.outlines||dx<1e-10&&dy<1e-10)error();
  return '<draw:line draw:name="'+common+'" draw:style-name="'+graphic(o,null,true)+'" svg:x1="'+mm((o.x+minX*o.width)*scale)+'" svg:y1="'+mm((o.y+minY*o.height)*scale)+'" svg:x2="'+mm((o.x+maxX*o.width)*scale)+'" svg:y2="'+mm((o.y+maxY*o.height)*scale)+'"/>';
 }
 const map=loop=>loop.map(p=>[(p[0]-minX)/dx,(p[1]-minY)/dy]);
 o={...o,x:o.x+minX*o.width,y:o.y+minY*o.height,width:o.width*dx,height:o.height*dy,...(o.outlines?{outlines:o.outlines.map(map)}:{points:map(o.points)})};
 const data=o.outlines?' svg:d="'+outlinePath(o.outlines,1000000,1000000)+'"':' draw:points="'+o.points.map(p=>p.slice(0,2).map(n=>Math.round(n*1000000)).join(',')).join(' ')+'"';return '<draw:'+(o.outlines?'path':'polyline')+' draw:name="'+common+'" draw:style-name="'+graphic(o,null,true)+'" svg:x="'+mm(o.x*scale)+'" svg:y="'+mm(o.y*scale)+'" svg:width="'+mm(o.width*scale)+'" svg:height="'+mm(o.height*scale)+'" svg:viewBox="0 0 1000000 1000000"'+data+'/>';
}
function length(node,key){const n=odtLength(attr(node,'svg',key));if(n===null)error();return n}
export function readOdtStroke(node,g,left,top,scale,canvasHeight,styles){
 const props=g.props;if(props['draw:marker-start'])error();const end=props['draw:marker-end'];
 if(node.localName==='line'){
  if(g.stroke!=='none'&&props['svg:stroke-linecap']&&!['butt','round'].includes(props['svg:stroke-linecap']))error();const matrix=readOdtTransform(attr(node,'draw','transform')),sx=Math.hypot(matrix[0],matrix[1]),dot=matrix[0]*matrix[2]+matrix[1]*matrix[3],det=matrix[0]*matrix[3]-matrix[1]*matrix[2];if(Math.abs(sx-1)>1e-6||Math.abs(Math.abs(det)-1)>1e-6||Math.abs(dot)>1e-6)error();const a=odtPoint(matrix,length(node,'x1'),length(node,'y1')),b=odtPoint(matrix,length(node,'x2'),length(node,'y2')),x1=(a[0]-left)*scale,y1=(a[1]-top)*scale,x2=(b[0]-left)*scale,y2=(b[1]-top)*scale,w=Math.abs(x2-x1),h=Math.abs(y2-y1);if(!end&&props['svg:stroke-linecap']==='round'){const width=Math.max(20,w),height=Math.max(20,h),x=Math.min(x1,x2,900-width),y=Math.min(y1,y2,canvasHeight-height);if(g.stroke!=='none'&&g.strokeWidth*scale<.9)error();const result={type:'path',x,y,width,height,fill:'none',stroke:g.stroke,strokeWidth:g.strokeWidth*scale,points:[[x1,y1],[x2,y2]].map(p=>[(p[0]-x)/width,(p[1]-y)/height]),geometryPoints:2};validateRigidPaint(result,canvasHeight);return result}if(g.stroke!=='none'&&g.strokeWidth*scale<.9||end&&props['svg:stroke-linecap']==='round')error();let stroke=g.strokeWidth*scale;
  if(end){const markers=styles.markers(end);if(markers.length!==1)error();const m=markers[0],box=viewbox(m),path=readLinearOdtPath(m),loop=path.outlines?.[0]?.filter((p,i,a)=>i!==a.length-1||Math.hypot(p[0]-a[0][0],p[1]-a[0][1])>1e-6);if(path.outlines?.length!==1||loop?.length!==3||Math.abs(box[3]/box[2]-.915244)>1e-4||![[.5,0],[0,1],[1,1]].every(p=>loop.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<1e-5))||props['draw:marker-end-center']&&!['false','0'].includes(props['draw:marker-end-center']))error();const size=odtLength(props['draw:marker-end-width']);if(size===null)error();if(Math.abs(size*scale-arrowWidth(stroke))>.15){if(Math.abs(stroke-1)<.1&&Math.abs(size*scale-arrowWidth(0))<.15)stroke=0;else error()}}
  const result={type:end?'arrow':'line',...directedLineBox(x1,y1,x2,y2,canvasHeight),fill:'none',stroke:g.stroke,strokeWidth:stroke};validateRigidPaint(result,canvasHeight);return result;
 }
 if(end)error();const data=readLinearOdtPath(node),source=attr(node,'draw','transform'),box=source?readNativeBox(node,left,top,scale):null,w=box?box.width:length(node,'width')*scale,h=box?box.height:length(node,'height')*scale,x=box?box.x:(length(node,'x')-left)*scale,y=box?box.y:(length(node,'y')-top)*scale;if(data.points&&g.stroke!=='none'&&g.strokeWidth*scale<.9)error();if(w<0||h<0||data.points&&g.fill!=='none'||props['svg:fill-rule']&&props['svg:fill-rule']!=='nonzero')error();if(g.stroke!=='none'&&(props['draw:stroke-linejoin']&&props['draw:stroke-linejoin']!=='round'||data.points&&props['svg:stroke-linecap']&&props['svg:stroke-linecap']!=='round'))error();
 if(box){if(data.outlines&&g.stroke!=='none'&&g.strokeWidth>0)error();if(g.stroke!=='none'&&(Math.abs(box.skewX||0)>.00001||Math.abs((box.transformScale||1)-1)>1e-6))error();const o={...box,type:'path',fill:g.fill,stroke:g.stroke,strokeWidth:g.strokeWidth*scale,...(data.points?{points:data.points}:{outlines:data.outlines})};const result={...transformedPath(o,canvasHeight),geometryPoints:data.count};if(data.points)validateRigidPaint(result,canvasHeight);return result}
 const width=Math.max(20,w),height=Math.max(20,h),ox=Math.min(x,900-width),oy=Math.min(y,canvasHeight-height),unit=n=>{if(n<-.00001||n>1.00001)error();return Math.round(Math.max(0,Math.min(1,n))*1e7)/1e7},map=points=>points.map(p=>[unit((x+p[0]*w-ox)/width),unit((y+p[1]*h-oy)/height)]);const result={type:'path',x:ox,y:oy,width,height,stroke:g.stroke,strokeWidth:g.strokeWidth*scale,...(data.points?{points:map(data.points)}:{outlines:mapLoops(data.outlines,map)}),geometryPoints:data.count};if(data.points)validateRigidPaint(result,canvasHeight);return result;
}
function mapLoops(loops,map){const value=normalizeOutlines(loops.map(map));if(!value)error();return value}
