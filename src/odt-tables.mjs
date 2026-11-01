import {normalizeTableDesign,TABLE_PALETTES,TABLE_PADDING} from './object-design.mjs';
import {odtAttr,odtLength} from './odt-styles.mjs';

export function odtTableCellStyle(design,header,row,styleId){
 const palette=TABLE_PALETTES[design.tablePalette],edge='0.5pt solid #'+palette.border,none='none';
 let border=design.tableStyle==='minimal'?` fo:border="none"${header?' fo:border-bottom="1.5pt solid #'+palette.accent+'"':''}`:design.tableStyle==='striped'?` fo:border-top="${edge}" fo:border-bottom="${edge}" fo:border-left="${none}" fo:border-right="${none}"`:` fo:border="${edge}"`;
 const background=design.tableStyle==='minimal'?null:header?palette.tint:design.tableStyle==='striped'&&row%2===1?palette.stripe:null;
 if(background)border+=' fo:background-color="#'+background+'"';
 return styleId('table-cell','<style:table-cell-properties fo:padding="'+(TABLE_PADDING[design.tableDensity]*.75)+'pt"'+border+'/>'+(header?'<style:text-properties fo:font-weight="bold" fo:color="#'+palette.accent+'"/>':''));
}

export function odtTableDesign(node,styles){
 const cells=[...node.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:table:1.0','table-cell')].filter(cell=>{let parent=cell.parentElement;while(parent&&parent!==node){if(parent.localName==='table')return false;parent=parent.parentElement}return parent===node}).slice(0,100);
 const properties=cells.map(cell=>styles.resolve('table-cell',odtAttr(cell,'table','style-name'))),values=properties.flatMap(props=>Object.values(props));
 let tablePalette='sage';
 for(const [name,palette]of Object.entries(TABLE_PALETTES))if(values.some(value=>[palette.tint,palette.stripe,palette.accent,palette.border].some(color=>String(value).toLowerCase().includes('#'+color.toLowerCase())))){tablePalette=name;break}
 const noSides=properties.length&&properties.every(props=>props['fo:border']==='none'||props['fo:border-left']==='none'&&props['fo:border-right']==='none');
 const horizontal=properties.some(props=>props['fo:border-top']&&props['fo:border-top']!=='none');
 const tableStyle=noSides?(horizontal?'striped':'minimal'):'grid';
 const padding=properties.map(props=>odtLength(props['fo:padding'])).find(value=>value!==null),tableDensity=Object.entries(TABLE_PADDING).find(([,value])=>padding!==undefined&&Math.abs(value*.75-padding)<.1)?.[0]||'comfortable';
 return normalizeTableDesign({tableStyle,tablePalette,tableDensity});
}
