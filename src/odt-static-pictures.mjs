// Read bounded static-image containers; browsers/editors decode the bitmap.
// Animation, orientation/color metadata and nonsquare pixels require preview.
const fail=()=>{throw Error('Unsupported or oversized native ODT picture. Use a static PNG/JPEG/GIF/WebP with normal orientation, or preview-image export.');};
const word=(b,p,n)=>String.fromCharCode(...b.subarray(p,p+n));
export function staticPictureDimensions(bytes){
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),n=bytes.length;
 if(n>=6&&['GIF87a','GIF89a'].includes(word(bytes,0,6))){
  if(n<14||bytes[12])fail();const width=v.getUint16(6,true),height=v.getUint16(8,true);let at=13,frames=0,control=false,transparent=null,global=0,blocks=0;
  function palette(size){const colors=2**((size&7)+1);at+=colors*3;if(at>n)fail();return colors}
  if(bytes[10]&128)global=palette(bytes[10]);
  function subblocks(){let total=0;while(at<n){if(++blocks>100000)fail();const size=bytes[at++];if(!size)return total;at+=size;total+=size;if(at>n)fail()}fail()}
  while(at<n){const tag=bytes[at++];if(tag===0x3b){if(at!==n||frames!==1||control)fail();return {type:'gif',width,height}}
   if(tag===0x21){const label=bytes[at++];if(label===0xf9){if(control||frames||at+6>n||bytes[at]!==4||bytes[at+5]||bytes[at+1]&0xe2||(bytes[at+1]>>2&7)>3)fail();control=true;transparent=bytes[at+1]&1?bytes[at+4]:null;at+=6}else if(label===0xfe)subblocks();else fail();continue}
   if(tag!==0x2c||++frames!==1||at+9>n)fail();const x=v.getUint16(at,true),y=v.getUint16(at+2,true),w=v.getUint16(at+4,true),h=v.getUint16(at+6,true),flags=bytes[at+8];at+=9;
   if(x||y||w!==width||h!==height||flags&0x18)fail();const colors=flags&128?palette(flags):global;if(!colors||transparent!==null&&transparent>=colors||at>=n||bytes[at]<2||bytes[at]>8)fail();at++;if(!subblocks())fail();control=false;
  }fail();
 }
 if(n>=12&&word(bytes,0,4)==='RIFF'&&word(bytes,8,4)==='WEBP'){
  if(v.getUint32(4,true)!==n-8)fail();let at=12,count=0,extended=null,alpha=false,picture=null;
  while(at<n){if(++count>2048||at+8>n)fail();const kind=word(bytes,at,4),size=v.getUint32(at+4,true),p=at+8,end=p+size;if(end>n||end+(size&1)>n||size&1&&bytes[end]!==0)fail();
   if(kind==='VP8X'){if(count!==1||size!==10||bytes[p]&~0x10||bytes[p+1]||bytes[p+2]||bytes[p+3])fail();const u24=q=>bytes[q]+bytes[q+1]*256+bytes[q+2]*65536;extended={width:u24(p+4)+1,height:u24(p+7)+1,alpha:!!(bytes[p]&16)}}
   else if(kind==='ALPH'){if(!extended?.alpha||alpha||picture||size<2||bytes[p]&0xc0||(bytes[p]&3)>1||(bytes[p]>>4&3)>1)fail();alpha=true}
   else if(kind==='VP8 '){if(picture||size<10||bytes[p]&1||(bytes[p]>>1&7)>3||!(bytes[p]&16)||word(bytes,p+3,3)!=='\x9d\x01\x2a')fail();const w=v.getUint16(p+6,true),h=v.getUint16(p+8,true);if(w&0xc000||h&0xc000||extended&&extended.alpha!==alpha)fail();picture={width:w,height:h}}
   else if(kind==='VP8L'){if(picture||alpha||size<5||bytes[p]!==0x2f)fail();const bits=v.getUint32(p+1,true);if(bits>>>29||extended&&extended.alpha!==!!(bits&0x10000000))fail();picture={width:(bits&0x3fff)+1,height:(bits>>>14&0x3fff)+1}}
   else fail();at=end+(size&1);
  }
  if(!picture||extended&&(extended.width!==picture.width||extended.height!==picture.height))fail();return {type:'webp',...picture};
 }
 return null;
}
