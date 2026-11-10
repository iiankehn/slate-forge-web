import {odtAttr as attr,odtLength} from './odt-styles.mjs';
const fail=()=>{throw Error('Unsupported or oversized native ODT transform. Use preview export.');};
const rad=Math.PI/180;
const mm=n=>Number(n.toFixed(7))+'mm';
const clean=n=>Math.abs(n)<1e-10?0:Number(n.toFixed(12));
export function multiplyOdtMatrices(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]}
export const odtPoint=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
export function objectLinear(o){const a=(o.rotation||0)*rad,c=Math.cos(a),s=Math.sin(a),k=Math.tan((o.skewX||0)*rad);return [c,s,c*k-s,s*k+c,0,0]}
// Writer's native transform lists use radians, clockwise-negative rotation and negative X shear.
// Apply listed operations in order. A standalone rigid leaf matrix additionally
// accepts measured e/f translations; ambiguous unitless translations/group
// transforms and affine matrices remain refused.
function rigidLeafMatrix(source){
 const match=/^matrix\s*\(([^()]*)\)\s*$/.exec(source.trim());if(!match)fail();
 const args=match[1].trim().split(/[\s,]+/);if(args.length!==6)fail();
 const numeric=value=>{if(!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(value))fail();const n=Number(value);if(!Number.isFinite(n)||Math.abs(n)>10000)fail();return n};
 const linear=args.slice(0,4).map(numeric),[a,b,c,d]=linear;
 if(Math.abs(a*a+b*b-1)>1e-8||Math.abs(c*c+d*d-1)>1e-8||Math.abs(a*c+b*d)>1e-8||Math.abs(a*d-b*c-1)>1e-8)fail();
 const translation=args.slice(4).map(value=>{if(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(value)){if(numeric(value)!==0)fail();return 0}if(!/^-?\d+(?:\.\d+)?(?:mm|cm|in|pt)$/.test(value))fail();const n=odtLength(value);if(n===null||!Number.isFinite(n)||Math.abs(n)>100000)fail();return n});
 return [...linear,...translation];
}
export function readOdtTransform(source){let m=[1,0,0,1,0,0];if(!source)return m;if(source.length>2048)fail();if(/^\s*matrix\s*\(/.test(source))return rigidLeafMatrix(source);const re=/([a-zA-Z]+)\s*\(([^()]*)\)/gy;let at=0,count=0;while(at<source.length){const gap=/^[\s,]+/.exec(source.slice(at));if(gap)at+=gap[0].length;if(at===source.length)break;re.lastIndex=at;const match=re.exec(source);if(!match||++count>16)fail();at=re.lastIndex;const args=match[2].trim().split(/[\s,]+/);let next;
 const number=s=>{if(!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s))fail();const n=Number(s);if(!Number.isFinite(n)||Math.abs(n)>10000)fail();return n};
 if(match[1]==='translate'){if(args.length<1||args.length>2)fail();const v=args.map(s=>{if(!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:mm|cm|in|pt)$/.test(s))fail();const n=odtLength(s);if(n===null||!Number.isFinite(n)||Math.abs(n)>100000)fail();return n});next=[1,0,0,1,v[0],v[1]||0]}
 else if(match[1]==='rotate'&&args.length===1){const a=-number(args[0]);if(Math.abs(a)>2*Math.PI+.00001)fail();const c=Math.cos(a),s=Math.sin(a);next=[c,s,-s,c,0,0]}
 else if(match[1]==='skewX'&&args.length===1){const a=-number(args[0]);if(Math.abs(a)>85.01*rad)fail();next=[1,0,Math.tan(a),1,0,0]}
 else if(match[1]==='scale'&&(args.length===1||args.length===2)){const x=number(args[0]),y=args.length===2?number(args[1]):x;if(x<=0||y<=0||Math.abs(x-y)>1e-8)fail();next=[x,0,0,y,0,0]}
 else fail();m=multiplyOdtMatrices(next,m);if(m.some(n=>!Number.isFinite(n)||Math.abs(n)>1000000))fail();
 }if(!count)fail();return m}
export function nativeBox(o,paint=null,extraRotation=0){const b=paint||o,w=b.width,h=b.height,linear=objectLinear(o),delta=odtPoint(linear,b.x+w/2-o.x-o.width/2,b.y+h/2-o.y-o.height/2),cx=o.x+o.width/2+delta[0],cy=o.y+o.height/2+delta[1],rotation=(((o.rotation||0)+extraRotation+180)%360+360)%360-180,skew=o.skewX||0;return {...b,x:cx-w/2,y:cy-h/2,rotation,skewX:skew}}
export function nativeBoxXML(o,scale,paint=null,extraRotation=0){const box=nativeBox(o,paint,extraRotation),w=box.width,h=box.height,cx=box.x+w/2,cy=box.y+h/2,rotation=box.rotation,skew=box.skewX;
 if(!rotation&&!skew)return ' svg:x="'+mm(box.x*scale)+'" svg:y="'+mm(box.y*scale)+'" svg:width="'+mm(w*scale)+'" svg:height="'+mm(h*scale)+'"';
 const corner=odtPoint(objectLinear(box),-w/2,-h/2);return ' svg:width="'+mm(w*scale)+'" svg:height="'+mm(h*scale)+'" draw:transform="'+(skew?'skewX('+clean(-skew*rad)+') ':'')+'rotate('+clean(-rotation*rad)+') translate('+mm((cx+corner[0])*scale)+' '+mm((cy+corner[1])*scale)+')"';
}
export function readNativeBox(node,left,top,scale){const length=key=>{const n=odtLength(attr(node,'svg',key));if(n===null||!Number.isFinite(n))fail();return n},w=length('width'),h=length('height'),source=attr(node,'draw','transform');if(!source)return {x:(length('x')-left)*scale,y:(length('y')-top)*scale,width:w*scale,height:h*scale};
 if(attr(node,'svg','x')||attr(node,'svg','y'))fail();const m=readOdtTransform(source),sx=Math.hypot(m[0],m[1]),det=m[0]*m[3]-m[1]*m[2],sy=det/sx,dot=m[0]*m[2]+m[1]*m[3],skew=Math.atan(dot/det)/rad,rotation=Math.atan2(m[1],m[0])/rad;if(sx<1e-6||sy<1e-6||Math.abs(sx-sy)>.00001||Math.abs(skew)>85.01)fail();const center=odtPoint(m,w/2,h/2);return {x:(center[0]-left-w*sx/2)*scale,y:(center[1]-top-h*sy/2)*scale,width:w*sx*scale,height:h*sy*scale,rotation,skewX:skew,transformScale:sx};
}
export function validateNativeBox(o,height){if(!Object.values({x:o.x,y:o.y,width:o.width,height:o.height}).every(Number.isFinite)||o.x<-.1||o.y<-.1||o.width<19.9||o.height<19.9||o.x+o.width>900.1||o.y+o.height>height+.1)fail();const m=objectLinear(o),cx=o.x+o.width/2,cy=o.y+o.height/2;for(const x of [-o.width/2,o.width/2])for(const y of [-o.height/2,o.height/2]){const p=odtPoint(m,x,y);if(cx+p[0]<-.2||cx+p[0]>900.2||cy+p[1]<-.2||cy+p[1]>height+.2)fail()}}
