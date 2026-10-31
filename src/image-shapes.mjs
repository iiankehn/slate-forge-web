export const DEFAULT_CONTOUR='50,0 100,50 50,100 0,50';
export function parseImageContour(value){
 if(typeof value!=='string'||value.length>800)return null;const parts=value.trim().split(/\s+/);if(parts.length<3||parts.length>32)return null;
 const points=parts.map(part=>{const xy=part.split(',');if(xy.length!==2||xy.some(n=>!/^\d+(?:\.\d{1,2})?$/.test(n)))return null;const pair=xy.map(Number);return pair.every(n=>n>=0&&n<=100)?pair:null});if(points.some(point=>!point))return null;
 // Reject a collapsed contour; concave, clockwise and counterclockwise paths work.
 let area=0;for(let i=0;i<points.length;i++){const next=points[(i+1)%points.length];area+=points[i][0]*next[1]-next[0]*points[i][1]}if(Math.abs(area)<1)return null;
 return points.map(point=>point.join(',')).join(' ');
}
export const imageContour=value=>parseImageContour(value)||DEFAULT_CONTOUR;
export const imageContourCSS=value=>'polygon('+imageContour(value).split(' ').map(point=>point.split(',').map(n=>n+'%').join(' ')).join(',')+')';
export const imageShape=value=>['ellipse','diamond','polygon'].includes(value)?value:'rectangle';
export const imageExportKey=attrs=>imageShape(attrs?.imageShape)==='rectangle'?attrs?.src:JSON.stringify([attrs?.src,imageShape(attrs?.imageShape),...(imageShape(attrs?.imageShape)==='polygon'?[imageContour(attrs?.imageContour)]:[])]);
export function clipImageShape(ctx,width,height,shape,contour){shape=imageShape(shape);if(shape==='rectangle')return;ctx.beginPath();if(shape==='ellipse')ctx.ellipse(width/2,height/2,width/2,height/2,0,0,Math.PI*2);else if(shape==='polygon'){const points=imageContour(contour).split(' ').map(point=>point.split(',').map(Number));points.forEach(([x,y],index)=>ctx[index?'lineTo':'moveTo'](width*x/100,height*y/100));ctx.closePath()}else{ctx.moveTo(width/2,0);ctx.lineTo(width,height/2);ctx.lineTo(width/2,height);ctx.lineTo(0,height/2);ctx.closePath()}ctx.clip()}
