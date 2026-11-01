import {prepareXFASubmission,sendXFASubmission,xfaEmailDraft} from './pdf-xfa-submit.mjs';

export function createXFASubmissionPanel(host,{onDownload,onSent,onStatus}){
 let version=0,disposed=false,flight=null,prepared=null;
 function invalidate(){version++;prepared=null;if(flight){flight.abort();flight=null;onStatus('Submission interrupted. Delivery is unconfirmed; check with the recipient before sending again.')}host.hidden=true;host.replaceChildren()}
 function dispose(){invalidate();disposed=true}
 async function review(submit,{bytes,canSend=true,reason=''}){
  invalidate();const token=version;host.hidden=false;host.textContent='Preparing submission for review…';
  try{
   const payload=await prepareXFASubmission(bytes,submit);if(disposed||token!==version)return;prepared=payload;
   host.innerHTML='<h3>Review form submission</h3><p data-part="destination"></p><p data-part="format"></p><p data-part="reason"></p><details><summary>Attachment preview</summary><pre data-part="preview" style="max-height:18em;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere"></pre></details><div class="tool-actions"><button data-part="download">Save attachment</button><button data-part="send">Send to this destination</button><a data-part="email" hidden>Open email draft · attach the saved file</a><button data-part="close">Close submission</button></div><p data-part="status" role="status"></p>';
   const $=part=>host.querySelector('[data-part="'+part+'"]');
   $('destination').textContent='Destination: '+(payload.destination?.href||submit.target||'No destination is specified.');
   $('format').textContent=payload.extension.toUpperCase()+' attachment · '+payload.body.length.toLocaleString()+' bytes. Sending includes this attachment. Browser requests omit login cookies and do not follow redirects.';
   $('reason').textContent=reason||(!payload.destination?'This destination cannot be resolved from a local PDF. Save the attachment and submit it outside the app.':payload.destination.protocol==='mailto:'?'Save the attachment, open an email draft and attach the file yourself.':'The receiving server must allow browser submissions from this site.');
   $('preview').textContent=payload.preview;$('send').disabled=!canSend||payload.destination?.protocol!=='https:';
   const draft=xfaEmailDraft(payload.destination);if(draft&&canSend){$('email').hidden=false;$('email').href=draft;$('email').rel='noopener noreferrer'}
   $('download').onclick=()=>{if(!disposed&&token===version&&prepared===payload)onDownload(payload.extension,new Uint8Array(payload.body),payload.type)};
   $('close').onclick=invalidate;
   $('send').onclick=async()=>{
    if(disposed||token!==version||prepared!==payload||flight||!canSend)return;
    const controller=new AbortController();flight=controller;$('send').disabled=true;const timer=setTimeout(()=>controller.abort(),30000);$('status').textContent='Sending the reviewed attachment…';
    try{
     const status=await sendXFASubmission(payload,{signal:controller.signal});if(disposed||token!==version)return;flight=null;$('status').textContent='The server responded with HTTP '+status+'.';
     let completion='';try{await onSent()}catch(error){completion=' A post-submit action could not finish: '+error.message}
     if(!disposed)onStatus('The submission server responded with HTTP '+status+'.'+completion);
    }catch(error){if(!disposed&&token===version){$('status').textContent=(error.name==='AbortError'?'Submission stopped or timed out.':error.message)+' Delivery is unconfirmed. Check with the recipient before opening another submission attempt.';onStatus($('status').textContent)}}
    finally{clearTimeout(timer);if(flight===controller)flight=null}
   };
   host.scrollIntoView?.({block:'nearest'});
  }catch(error){if(!disposed&&token===version){host.textContent='Submission could not be prepared: '+error.message;onStatus(host.textContent)}}
 }
 return {review,invalidate,dispose};
}
