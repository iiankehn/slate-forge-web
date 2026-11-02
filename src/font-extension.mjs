import {FontFamily} from '@tiptap/extension-text-style';
import {fontFamily,fontCSS} from './font-families.mjs';
export const SafeFontFamily=FontFamily.extend({
 addGlobalAttributes(){
  return [{
   types:this.options.types,
   attributes:{
    fontFamily:{
     default:null,
     parseHTML:element=>fontFamily(element.style.fontFamily),
     renderHTML:attributes=>fontFamily(attributes.fontFamily)?{style:'font-family:'+fontCSS(attributes.fontFamily)}:{}
    }
   }
  }];
 }
});
