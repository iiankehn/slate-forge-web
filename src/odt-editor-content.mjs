import {DOMParser} from '@tiptap/pm/model';
// A reconstructed boundary can make formerly internal spaces become paragraph
// edges. Preserve those spaces while parsing into the existing document model.
export function odtEditorContent(result,schema,sanitize,document){
 const html=sanitize(result.html);if(!result.preserveReviewWhitespace)return html;
 const host=document.createElement('div');host.innerHTML=html;
 return DOMParser.fromSchema(schema).parse(host,{preserveWhitespace:true}).toJSON();
}
