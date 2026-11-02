import {PDFDocument,PDFDict,PDFArray,PDFName,PDFRawStream,decodePDFRawStream} from 'pdf-lib';
const XDP='http://ns.adobe.com/xdp/',DATA='http://www.xfa.org/schema/xfa-data/1.0/',MAX_XML=16000000,MAX_PDF=40*1024*1024;
function parseXML(text){
 if(text.length>MAX_XML||/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text))throw Error('This submission has unsupported XML declarations or exceeds the 16 MB XML limit.');
 const xml=new DOMParser().parseFromString(text,'application/xml');if(xml.getElementsByTagName('parsererror').length)throw Error('The XFA submission XML could not be read.');
 const stack=[{node:xml.documentElement,depth:0}];let count=0;
 while(stack.length){const {node,depth}=stack.pop();if(++count>100000||depth>100)throw Error('The XFA submission exceeds the XML complexity limit.');for(const child of node.children)stack.push({node:child,depth:depth+1})}
 return xml;
}
function streamText(stream){
 if(!(stream instanceof PDFRawStream)||stream.dict.has(PDFName.of('F')))throw Error('This XFA packet is not stored in a supported local stream.');
 const bytes=decodePDFRawStream(stream).getBytes(MAX_XML+1);if(bytes.length>MAX_XML)throw Error('An XFA submission packet exceeds 16 MB.');
 const encoding=bytes[0]===255&&bytes[1]===254?'utf-16le':bytes[0]===254&&bytes[1]===255?'utf-16be':'utf-8';return new TextDecoder(encoding,{fatal:true}).decode(bytes);
}
async function readXDP(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>MAX_PDF)throw Error('XFA submission PDFs are limited to 40 MB.');
 const pdf=await PDFDocument.load(bytes,{updateMetadata:false,ignoreEncryption:true});if(pdf.isEncrypted)throw Error('Unlock this PDF before preparing its form data.');
 const form=pdf.context.lookup(pdf.catalog.get(PDFName.of('AcroForm')));if(!(form instanceof PDFDict))throw Error('No XFA form was found.');const xfa=pdf.context.lookup(form.get(PDFName.of('XFA')));
 let text='';
 if(xfa instanceof PDFArray){
  if(xfa.size()%2||xfa.size()>200)throw Error('This XFA packet list is unsupported.');const parts=[];let size=0,hasPreamble=false;
  for(let i=0;i<xfa.size();i+=2){const name=pdf.context.lookup(xfa.get(i))?.decodeText?.();if(typeof name!=='string')throw Error('An XFA packet has no supported name.');const part=streamText(pdf.context.lookup(xfa.get(i+1)));size+=part.length;if(size>MAX_XML)throw Error('XFA submission XML exceeds 16 MB.');if(name==='preamble')hasPreamble=true;parts.push(part.replace(/^\s*<\?xml[^?]*\?>/i,''))}
  text=parts.join('');if(!hasPreamble)text='<xdp:xdp xmlns:xdp="'+XDP+'" xmlns:xfa="'+DATA+'">'+text+'</xdp:xdp>';
 }else text=streamText(xfa);
 const xml=parseXML(text),root=xml.documentElement;if(!(root.localName==='xdp'&&root.namespaceURI===XDP)&&!(root.localName==='datasets'&&root.namespaceURI===DATA))throw Error('Unsupported XFA submission package.');return xml;
}
function serialize(node){return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(node)}
function copyNamespacePrefixes(source,target){for(let node=source;node?.nodeType===1;node=node.parentElement)for(const attribute of node.attributes)if(attribute.name.startsWith('xmlns:')&&!target.hasAttribute(attribute.name))target.setAttributeNS('http://www.w3.org/2000/xmlns/',attribute.name,attribute.value)}
export function describeXFASubmission(submit){
 if(!submit||submit.unsupported)throw Error(submit?.unsupported||'No supported submission action was found.');
 const format=submit.format||'xdp';if(!['xml','xdp','pdf'].includes(format))throw Error('The '+format+' submission format is not supported.');
 if(submit.encoding&&!['utf-8','none'].includes(submit.encoding))throw Error('This form requests an unsupported submission text encoding.');
 if(submit.embedPDF)throw Error('Embedded-PDF XDP submissions are not supported. Use a PDF submission or save the form instead.');
 if(typeof submit.target!=='string'||submit.target.length>4096||/[\u0000-\u001f\u007f]/u.test(submit.target))throw Error('This form has an unsupported submission destination.');
 let destination=null;try{destination=new URL(submit.target)}catch{}
 if(destination?.username||destination?.password)throw Error('Submission destinations containing passwords are unsupported.');
 if(destination&&!['https:','mailto:'].includes(destination.protocol))throw Error('Only HTTPS delivery and email attachments are supported.');
 if(destination?.protocol==='mailto:'&&/%(?:0a|0d)/i.test(destination.pathname))throw Error('Unsupported email recipient.');
 return {format,destination};
}
export async function prepareXFASubmission(bytes,submit){
 const {format,destination}=describeXFASubmission(submit);let body,type,extension;
 if(format==='pdf'){
  if(!(bytes instanceof Uint8Array)||bytes.length>MAX_PDF)throw Error('XFA submission PDFs are limited to 40 MB.');body=new Uint8Array(bytes);type='application/pdf';extension='pdf';
 }else{
  const xml=await readXDP(bytes),root=xml.documentElement;let payload;
  if(format==='xml'){
   const datasets=root.localName==='datasets'?root:[...root.children].find(node=>node.localName==='datasets'&&node.namespaceURI===DATA),data=datasets&&[...datasets.children].find(node=>node.localName==='data'&&node.namespaceURI===DATA);
   if(!data||data.children.length!==1)throw Error('XML submission requires one data root. Save the PDF or use an XDP submission for this form.');
   payload=data.firstElementChild.cloneNode(true);copyNamespacePrefixes(data.firstElementChild,payload);type='application/xml';extension='xml';
  }else{
   const requested=(submit.xdpContent||'').trim().split(/\s+/).filter(Boolean);if(requested.includes('pdf'))throw Error('Embedded-PDF XDP submissions are unsupported.');
   const packets=root.localName==='datasets'?[root]:[...root.children],selected=requested.length&&!requested.includes('*')?packets.filter(packet=>requested.includes(packet.localName)):packets.filter(packet=>packet.localName!=='pdf');
   for(const name of requested)if(name!=='*'&&!selected.some(packet=>packet.localName===name))throw Error('The requested '+name+' XDP packet is unavailable.');
   if(!selected.length)throw Error('No XDP packets were selected for submission.');
   const output=document.implementation.createDocument(XDP,'xdp:xdp');payload=output.documentElement;copyNamespacePrefixes(root,payload);for(const packet of selected)payload.append(output.importNode(packet,true));type='application/vnd.adobe.xdp+xml';extension='xdp';
  }
  body=new TextEncoder().encode(serialize(payload));if(body.length>MAX_XML)throw Error('The encoded XFA submission exceeds 16 MB.');
 }
 return {body,type,extension,destination,preview:format==='pdf'?'This attachment contains the complete PDF, including all pages and form data.':new TextDecoder().decode(body.subarray(0,12000))+(body.length>12000?'\n… Preview shortened. Save the attachment to inspect the complete data.':'')};
}
export async function sendXFASubmission(payload,{signal}={}){
 if(payload.destination?.protocol!=='https:')throw Error('This destination requires an email attachment or submission outside the browser.');
 const response=await fetch(payload.destination.href,{method:'POST',body:payload.body,headers:{'Content-Type':payload.type},mode:'cors',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store',signal});
 response.body?.cancel().catch(()=>{});if(!response.ok)throw Error('The server responded with HTTP '+response.status+'. Check with the recipient before sending again.');return response.status;
}
export function xfaEmailDraft(destination){
 if(destination?.protocol!=='mailto:')return null;const url=new URL('mailto:'+destination.pathname),subject=destination.searchParams.get('subject');if(subject)url.searchParams.set('subject',subject.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,500));return url.href;
}
