import forge from 'node-forge';
import {PDFDocument,PDFName,PDFString,PDFHexString} from 'pdf-lib';
import {inspectPDFSignaturePolicy} from './pdf-signature-policy.mjs';
import {readCMSContainer,verifyCMSIntegrity,binaryBytes} from './pdf-signature-integrity.mjs';
import {readTrustedCertificates,trustTimestampCertificate} from './pdf-certificate-trust.mjs';
const A=forge.asn1,U=A.Class.UNIVERSAL,C=A.Class.CONTEXT_SPECIFIC,OID={sha256:'2.16.840.1.101.3.4.2.1',info:'1.2.840.113549.1.9.16.1.4',timestamp:'1.2.840.113549.1.9.16.2.14',ess:'1.2.840.113549.1.9.16.2.12',ess2:'1.2.840.113549.1.9.16.2.47'};
const node=(type,value,constructed=false)=>A.create(U,type,constructed,value),seq=values=>node(A.Type.SEQUENCE,values,true),oid=value=>node(A.Type.OID,A.oidToDer(value).getBytes()),der=value=>A.toDer(value).getBytes(),array=value=>Uint8Array.from(value,char=>char.charCodeAt(0)),hash=value=>forge.md.sha256.create().update(value).digest().getBytes();
function integer(value,max=32){if(!value||value.type!==A.Type.INTEGER||value.constructed||typeof value.value!=='string'||!value.value.length||value.value.length>max||value.value.charCodeAt(0)&128)throw Error('Unsupported timestamp integer.');return forge.util.bytesToHex(value.value).replace(/^(00)+/,'')||'00'}
function small(value){const hex=integer(value,6),number=Number.parseInt(hex,16);if(!Number.isSafeInteger(number))throw Error('Timestamp integer exceeds the supported range.');return number}
function parse(bytes,max=1000000){if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>max)throw Error('Timestamp files exceed the supported size.');return A.fromDer(forge.util.createBuffer(binaryBytes(bytes)),{strict:true,parseAllBytes:true})}
function sequence(value){if(!value||value.tagClass!==U||value.type!==A.Type.SEQUENCE||!Array.isArray(value.value))throw Error('Invalid timestamp structure.');return value.value}
function imprint(value){const fields=sequence(value),algorithm=sequence(fields[0]);if(fields.length!==2||algorithm.length>2||algorithm[0]?.type!==A.Type.OID||A.derToOid(algorithm[0].value)!==OID.sha256||algorithm[1]&&algorithm[1].type!==A.Type.NULL||fields[1]?.type!==A.Type.OCTETSTRING||fields[1].value.length!==32)throw Error('Timestamp requests require SHA-256 message imprints.');return fields[1].value}
export function parseTimestampRequest(bytes){
 const values=sequence(parse(bytes,100000));if(small(values[0])!==1)throw Error('Unsupported timestamp request version.');const digest=imprint(values[1]);let nonce=null,policy=null,certRequested=false;
 for(const value of values.slice(2)){if(value.tagClass!==U)throw Error('Timestamp request extensions are unsupported.');if(value.type===A.Type.OID&&!policy)policy=A.derToOid(value.value);else if(value.type===A.Type.INTEGER&&nonce===null)nonce=integer(value);else if(value.type===A.Type.BOOLEAN&&!certRequested&&[String.fromCharCode(0),String.fromCharCode(255)].includes(value.value))certRequested=true;else throw Error('Unsupported timestamp request option.')}
 if(nonce===null||nonce==='00')throw Error('Timestamp requests must contain a nonzero nonce.');return {digest,nonce,policy};
}
async function latestSignature(bytes,onProgress=()=>{}){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>42000000)throw Error('Timestamping is limited to signed PDFs up to 42 MB.');const pdf=await PDFDocument.load(bytes,{updateMetadata:false}),policy=await inspectPDFSignaturePolicy(bytes,{pdf,onProgress}),latest=policy.history.at(-1);if(!latest)throw Error('Sign the PDF before requesting a timestamp.');
 const field=policy.metadata.fields.find(field=>field.name===latest.field),contents=field?.value?.lookup(PDFName.of('Contents'));if(!(contents instanceof PDFHexString||contents instanceof PDFString))throw Error('The latest signature container is unsupported.');const cms=readCMSContainer(contents.asBytes()),signer=cms.parts.at(-1).value[0],unsigned=signer.value.find(value=>value.tagClass===C&&value.type===1);
 for(const attribute of unsigned?.value||[]){const id=A.derToOid(sequence(attribute)[0].value);if(id===OID.timestamp)throw Error('The latest signature already contains a timestamp.');if(id!=='1.2.840.113549.1.9.6')throw Error('This signature has unsupported unsigned CMS evidence.');}
 return {pdf,latest,cms,signer,unsigned,digest:hash(cms.capture.signature)};
}
export async function createPDFTimestampRequest(bytes,{random=crypto,onProgress=()=>{}}={}){
 const signature=await latestSignature(bytes,onProgress),nonce=random.getRandomValues(new Uint8Array(16));if(nonce.every(value=>value===0))nonce[15]=1;let encoded=binaryBytes(nonce);if(nonce[0]&128)encoded=String.fromCharCode(0)+encoded;
 const request=seq([node(A.Type.INTEGER,String.fromCharCode(1)),seq([seq([oid(OID.sha256),node(A.Type.NULL,'')]),node(A.Type.OCTETSTRING,signature.digest)]),node(A.Type.INTEGER,encoded),node(A.Type.BOOLEAN,String.fromCharCode(255))]);
 return {request:array(der(request)),field:signature.latest.field,signatureDigest:forge.util.bytesToHex(signature.digest)};
}
function generalizedTime(value){
 if(value?.type!==A.Type.GENERALIZEDTIME)throw Error('The TSA response has no supported generation time.');const match=/^([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})(?:\.([0-9]{1,9}))?Z$/.exec(value.value);if(!match)throw Error('Unsupported TSA time encoding.');
 const parts=match.slice(1,7).map(Number),date=new Date(Date.UTC(parts[0],parts[1]-1,parts[2],parts[3],parts[4],parts[5],Number((match[7]||'').padEnd(3,'0').slice(0,3))));if(date.getUTCFullYear()!==parts[0]||date.getUTCMonth()+1!==parts[1]||date.getUTCDate()!==parts[2]||date.getUTCHours()!==parts[3]||date.getUTCMinutes()!==parts[4]||date.getUTCSeconds()!==parts[5])throw Error('Invalid TSA generation time.');return date;
}
function timestampInfo(bytes){
 const values=sequence(parse(bytes,65536));if(values.length<5||small(values[0])!==1||values[1]?.type!==A.Type.OID)throw Error('Unsupported timestamp information.');const result={policy:A.derToOid(values[1].value),digest:imprint(values[2]),serial:integer(values[3]),time:generalizedTime(values[4]),encodedTime:values[4].value,precisionTolerance:/\.[0-9]{3}[0-9]*[1-9][0-9]*Z$/.test(values[4].value)?1:0,accuracy:0,nonce:null,tsa:null};
 let accuracy=false,ordering=false;
 for(const value of values.slice(5)){
  if(value.tagClass===U&&value.type===A.Type.SEQUENCE&&!accuracy){accuracy=true;const seen=new Set();for(const part of value.value){const id=part.tagClass===U&&part.type===A.Type.INTEGER?'seconds':part.tagClass===C&&[0,1].includes(part.type)?part.type===0?'millis':'micros':null;if(!id||seen.has(id))throw Error('Unsupported timestamp accuracy.');seen.add(id);const number=small({...part,type:A.Type.INTEGER});if(id==='seconds'&&number>86400||id!=='seconds'&&(number<1||number>999))throw Error('Timestamp accuracy exceeds supported limits.');result.accuracy+=number*({seconds:1000,millis:1,micros:.001}[id])}}
  else if(value.tagClass===U&&value.type===A.Type.BOOLEAN&&!ordering)ordering=true;
  else if(value.tagClass===U&&value.type===A.Type.INTEGER&&result.nonce===null)result.nonce=integer(value);
  else if(value.tagClass===C&&value.type===0&&result.tsa===null&&value.value?.length===1)result.tsa=value.value[0];
  else throw Error('Unsupported or repeated timestamp extension.');
 }
 return result;
}
function octets(value){if(value?.type!==A.Type.OCTETSTRING)throw Error('Timestamp content is not an octet string.');if(!value.constructed)return value.value;const content=value.value.map(octets).join('');if(content.length>65536)throw Error('Timestamp information exceeds 64 KB.');return content}
function signedAttributes(cms){const values=new Map();for(const attribute of cms.capture.authenticatedAttributes||[]){const pair=sequence(attribute);if(pair[1]?.type!==A.Type.SET)throw Error('Invalid signed timestamp attribute.');values.set(A.derToOid(pair[0].value),pair[1].value)}return values}
function certificateBinding(cms){
 const attributes=signedAttributes(cms);if(!attributes.has(OID.ess)&&!attributes.has(OID.ess2))throw Error('The timestamp must bind its signing certificate.');
 for(const [id,v2]of [[OID.ess,false],[OID.ess2,true]]){
  const entry=attributes.get(id);if(!entry)continue;if(entry.length!==1)throw Error('Ambiguous timestamp certificate binding.');const container=sequence(entry[0]),certs=sequence(container[0]),identifier=sequence(certs[0]);let index=0,algorithm=v2?'sha256':'sha1';
  if(v2&&identifier[0]?.type===A.Type.SEQUENCE){const id=A.derToOid(sequence(identifier[index++])[0].value);algorithm=({'2.16.840.1.101.3.4.2.1':'sha256','2.16.840.1.101.3.4.2.2':'sha384','2.16.840.1.101.3.4.2.3':'sha512'})[id];if(!algorithm)throw Error('Unsupported timestamp certificate hash.')}
  const digest=identifier[index++];if(digest?.type!==A.Type.OCTETSTRING||digest.value!==forge.md[algorithm].create().update(cms.certificateDER).digest().getBytes())throw Error('The timestamp signing-certificate hash does not match.');
  if(identifier.length>index+1)throw Error('Unsupported timestamp certificate identifier.');
  if(identifier[index]){const issuer=sequence(identifier[index]),names=sequence(issuer[0]),expected=forge.util.bytesToHex(cms.capture.serial).replace(/^(00)+/,'')||'00';if(issuer.length!==2||integer(issuer[1])!==expected||!names.some(name=>name.tagClass===C&&name.type===4&&name.value?.length===1&&der(name.value[0])===der(cms.capture.issuer)))throw Error('The timestamp issuer binding does not match its certificate.');}
 }
}

function tsaNameMatches(info,cms){
 const name=info.tsa;if(!name)return;if(name.tagClass!==C)throw Error('Unsupported timestamp authority name.');
 if(name.type===4&&name.value?.length===1){const tbs=forge.pki.certificateToAsn1(cms.certificate).value[0],offset=tbs.value[0].tagClass===C?1:0;if(der(name.value[0])===der(tbs.value[offset+4]))return}
 if([1,2,6].includes(name.type)&&cms.certificate.getExtension('subjectAltName')?.altNames.some(alt=>alt.type===name.type&&(name.type===2?String(alt.value).toLowerCase()===name.value.toLowerCase():alt.value===name.value)))return;
 throw Error('The timestamp authority name does not match its signing certificate.');
}
export async function attachPDFTimestamp(bytes,requestBytes,responseBytes,trustCertificates,{now=new Date(),onProgress=()=>{}}={}){
 if(!Number.isFinite(now.getTime()))throw Error('Invalid current time.');const signature=await latestSignature(bytes,onProgress),request=parseTimestampRequest(requestBytes);if(request.digest!==signature.digest)throw Error('The timestamp request belongs to another PDF signature.');
 const response=sequence(parse(responseBytes)),status=small(sequence(response[0])[0]);if(![0,1].includes(status)||response.length!==2)throw Error('The TSA did not grant this timestamp request (status '+status+').');
 const token=response[1],cms=readCMSContainer(array(der(token))),encapsulated=cms.parts[2].value[1];if(cms.contentType!==OID.info||encapsulated?.tagClass!==C||encapsulated.type!==0||encapsulated.value?.length!==1)throw Error('The response does not contain an RFC 3161 timestamp token.');const payload=octets(encapsulated.value[0]),info=timestampInfo(array(payload));
 if(info.digest!==request.digest||info.nonce!==request.nonce||request.policy&&request.policy!==info.policy)throw Error('The TSA response does not match the request hash, nonce or policy.');if(info.time.getTime()>now.getTime()+300000)throw Error('The TSA time is more than five minutes ahead of this device.');
 verifyCMSIntegrity(cms,{contentType:OID.info,contentDigest:forge.md[cms.algorithm].create().update(payload).digest().getBytes(),requireAttributes:true});certificateBinding(cms);tsaNameMatches(info,cms);
 const anchors=readTrustedCertificates(trustCertificates),authority=trustTimestampCertificate(cms,anchors,info.time,info.accuracy+info.precisionTolerance),unsigned=signature.unsigned||A.create(C,1,true,[]);if(!signature.unsigned)signature.signer.value.push(unsigned);unsigned.value.push(seq([oid(OID.timestamp),node(A.Type.SET,[token],true)]));
 const encoded=forge.util.bytesToHex(der(signature.cms.root)),[start,first,end,last]=signature.latest.range,gap=binaryBytes(bytes.subarray(first,end)),match=/^([\x00\t\n\f\r ]*)<([0-9a-fA-F\x00\t\n\f\r ]*)>([\x00\t\n\f\r ]*)$/.exec(gap);if(!match)throw Error('Timestamp attachment requires a reserved hexadecimal signature container.');const available=gap.length-match[1].length-match[3].length-2,capacity=available-available%2;if(encoded.length>capacity)throw Error('The signature has insufficient reserved space for this timestamp.');
 const replacement=match[1]+'<'+encoded.padEnd(capacity,'0')+(available%2?' ':'')+'>'+match[3],output=new Uint8Array(bytes);output.set(new TextEncoder().encode(replacement),first);
 return {bytes:output,time:info.time.toISOString(),encodedTime:info.encodedTime,accuracyMilliseconds:info.accuracy,field:signature.latest.field,policy:info.policy,authority,revocationChecked:false};
}
