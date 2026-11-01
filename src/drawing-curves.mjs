// Flatten drawing curves in normalized coordinates. Keep the tolerance below
// a quarter pixel on the largest supported canvas, with a strict point budget.
const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);return length?Math.abs(dx*(a[1]-p[1])-(a[0]-p[0])*dy)/length:Math.hypot(p[0]-a[0],p[1]-a[1])};
const middle=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
export function flattenDrawingBezier(points,append,{tolerance=1/5600,maxDepth=16}={}){
 if(![3,4].includes(points.length)||points.some(point=>point.length!==2||point.some(value=>!Number.isFinite(value))))throw Error('Invalid native drawing curve.');
 function split(curve,depth){
  const first=curve[0],last=curve.at(-1),chord=Math.hypot(last[0]-first[0],last[1]-first[1]),polygon=curve.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-curve[i][0],p[1]-curve[i][1]),0);
  if(curve.slice(1,-1).every(point=>distance(point,first,last)<=tolerance)&&polygon-chord<=tolerance*2){append(last);return}
  if(depth>=maxDepth)throw Error('A native drawing curve exceeds the subdivision limit.');
  const levels=[curve];while(levels.at(-1).length>1){const previous=levels.at(-1);levels.push(previous.slice(1).map((point,i)=>middle(previous[i],point)))}
  split(levels.map(level=>level[0]),depth+1);split(levels.map(level=>level.at(-1)).reverse(),depth+1);
 }
 split(points,0);
}

// DrawingML angles describe rays from the center rather than parametric
// ellipse angles. Convert each ray before sampling an elliptical arc.
export function flattenDrawingArc(start,rx,ry,startAngle,sweep,append,{tolerance=1/5600,coordinateAspect=1}={}){
 if(![rx,ry,startAngle,sweep,...start].every(Number.isFinite)||rx<=0||ry<=0||Math.abs(sweep)>Math.PI*2+.000001)throw Error('Invalid native drawing arc.');
 const offset=angle=>{const theta=Math.atan2(rx*coordinateAspect*Math.sin(angle),ry*Math.cos(angle));return [rx*Math.cos(theta),ry*Math.sin(theta)]};
 const initial=offset(startAngle),center=[start[0]-initial[0],start[1]-initial[1]],point=angle=>{const p=offset(angle);return [center[0]+p[0],center[1]+p[1]]};
 function segment(a,b,first,last,depth){const mid=(a+b)/2,p=point(mid),q1=point((3*a+b)/4),q3=point((a+3*b)/4);if([p,q1,q3].every(p=>distance(p,first,last)<=tolerance)){append(last);return}if(depth>=16)throw Error('A native drawing arc exceeds the subdivision limit.');segment(a,mid,first,p,depth+1);segment(mid,b,p,last,depth+1)}
 const pieces=Math.max(1,Math.ceil(Math.abs(sweep)/(Math.PI/2)));for(let i=0;i<pieces;i++){const a=startAngle+sweep*i/pieces,b=startAngle+sweep*(i+1)/pieces;segment(a,b,point(a),point(b),0)}
}
