import {hasOdtReviewHistory} from './odt-review-history.mjs';
import {DOMParser} from '@tiptap/pm/model';
// A reconstructed boundary can make formerly internal spaces become paragraph
// edges. Preserve those spaces while parsing into the existing document model.
export function odtEditorContent(result,schema,sanitize,document){
 if(result.retainedReview)try{const host=document.createElement('div');host.innerHTML=sanitize(result.retainedReview.html,{preserveTableWidths:true});let count=0;function check(node,depth=0,layers=0){if(++count>100000||depth>100||layers>20)throw Error('The retained review exceeds nesting limits.');for(const child of node.children)check(child,depth+1,layers+(child.hasAttribute('data-forge-block-change')?1:0))}check(host);const parsed=DOMParser.fromSchema(schema).parse(host,{preserveWhitespace:true});parsed.check();if(!hasOdtReviewHistory(parsed.toJSON()))throw Error('No supported review history remains.');result.layout=result.retainedReview.layout;result.warnings.push('Complete Slate Forge review history was restored. Other editors show the accepted document; keep a backup before editing the ODT elsewhere.');return parsed.toJSON()}catch(error){result.warnings.push('Stored review could not be restored safely: '+error.message+' The current ODT content was imported instead.')}
 const html=sanitize(result.html);if(!result.preserveReviewWhitespace)return html;
 const host=document.createElement('div');host.innerHTML=html;
 return DOMParser.fromSchema(schema).parse(host,{preserveWhitespace:true}).toJSON();
}
