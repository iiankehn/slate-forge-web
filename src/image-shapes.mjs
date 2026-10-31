export const imageShape=value=>['ellipse','diamond'].includes(value)?value:'rectangle';
export const imageExportKey=attrs=>imageShape(attrs?.imageShape)==='rectangle'?attrs?.src:JSON.stringify([attrs?.src,imageShape(attrs?.imageShape)]);
export function clipImageShape(ctx,width,height,shape){shape=imageShape(shape);if(shape==='rectangle')return;ctx.beginPath();if(shape==='ellipse')ctx.ellipse(width/2,height/2,width/2,height/2,0,0,Math.PI*2);else{ctx.moveTo(width/2,0);ctx.lineTo(width,height/2);ctx.lineTo(width/2,height);ctx.lineTo(0,height/2);ctx.closePath()}ctx.clip()}
