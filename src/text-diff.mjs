// Bounded word diff. Exact reconstruction is preserved, including whitespace.
export function compareText(before,after){
 const tokens=s=>String(s).match(/\s+|[\p{L}\p{N}\p{M}_]+|[^\s\p{L}\p{N}\p{M}_]/gu)||[],a=tokens(before),b=tokens(after);let start=0,endA=a.length,endB=b.length;
 while(start<endA&&start<endB&&a[start]===b[start])start++;
 while(endA>start&&endB>start&&a[endA-1]===b[endB-1]){endA--;endB--}
 const parts=[];function emit(kind,text){if(!text)return;const last=parts.at(-1);if(last?.kind===kind)last.text+=text;else parts.push({kind,text})}
 emit('equal',a.slice(0,start).join(''));const n=endA-start,m=endB-start,coarse=(n+1)*(m+1)>1000000;
 if(coarse){emit('delete',a.slice(start,endA).join(''));emit('insert',b.slice(start,endB).join(''))}else{const width=m+1,grid=new Uint32Array((n+1)*width);for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)grid[i*width+j]=a[start+i]===b[start+j]?1+grid[(i+1)*width+j+1]:Math.max(grid[(i+1)*width+j],grid[i*width+j+1]);let i=0,j=0;while(i<n||j<m){if(i<n&&j<m&&a[start+i]===b[start+j]){emit('equal',a[start+i]);i++;j++}else if(i<n&&(j===m||grid[(i+1)*width+j]>=grid[i*width+j+1]))emit('delete',a[start+i++]);else emit('insert',b[start+j++])}}
 emit('equal',a.slice(endA).join(''));return {parts,coarse};
}
