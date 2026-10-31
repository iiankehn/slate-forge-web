export const OCR_LANGUAGES=Object.freeze([
 ['eng','English'],['ara','Arabic'],['chi_sim','Chinese · simplified'],['fra','French'],
 ['deu','German'],['ita','Italian'],['jpn','Japanese'],['por','Portuguese'],['rus','Russian'],['spa','Spanish']
].map(([code,label])=>Object.freeze({code,label})));
export function ocrLanguage(value){return OCR_LANGUAGES.some(item=>item.code===value)?value:'eng'}
export function recognitionLanguages(language,includeEnglish=false){const selected=ocrLanguage(language);return includeEnglish&&selected!=='eng'?[selected,'eng']:[selected]}
// Some trained models name optional external user dictionaries. This app has
// none; do not request absent .special-words/.user-patterns files at startup.
export const OCR_ENGINE_CONFIG=Object.freeze({user_words_suffix:'',user_patterns_suffix:''});
