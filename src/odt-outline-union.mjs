import Clipper from 'clipper-lib';
import {normalizeOutlines} from './design-outlines.mjs';
const fail=()=>{throw Error('Unsupported or oversized native ODT stroke geometry. Use a preview-image ODT or HTML/workspace backup.');};
// Canonical nonzero contours render consistently in editors that apply even-odd
// filling to ODF paths. Integer coordinates keep errors below 0.0001 canvas px.
export function canonicalOdtOutlines(value,budget={points:0,intersections:0},verifyEvenOdd=false){
 const loops=normalizeOutlines(value);if(!loops)fail();const count=loops.reduce((sum,p)=>sum+p.length,0);if(count>12000||(budget.points+=count)>50000)fail();const paths=loops.map(p=>p.map(([x,y])=>({X:Math.round(x*1e7),Y:Math.round(y*1e7)})));
 const execute=(fill,subject=paths,clip=null,type=Clipper.ClipType.ctUnion)=>{const c=new Clipper.Clipper(Clipper.Clipper.ioStrictlySimple);for(const name of ['IntersectPoint','IntersectEdges']){const operation=c[name];c[name]=(...args)=>{if(++budget.intersections>100000)fail();return operation.apply(c,args)}}c.AddPaths(subject,Clipper.PolyType.ptSubject,true);if(clip)c.AddPaths(clip,Clipper.PolyType.ptClip,true);const result=[];if(!c.Execute(type,result,fill,fill))fail();if(result.reduce((sum,p)=>sum+p.length,0)>44000)fail();return result};
 const nonzero=execute(Clipper.PolyFillType.pftNonZero);if(!nonzero.length)fail();if(verifyEvenOdd){const odd=execute(Clipper.PolyFillType.pftEvenOdd);if(execute(Clipper.PolyFillType.pftNonZero,nonzero,odd,Clipper.ClipType.ctXor).length)fail();return loops}
 const result=normalizeOutlines(nonzero.map(p=>p.map(({X,Y})=>[X/1e7,Y/1e7])));if(!result)fail();return result;
}
