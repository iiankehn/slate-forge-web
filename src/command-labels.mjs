// Icons accompany familiar text labels; they never carry the accessible name alone.
const paths={
 'clipboard:cut':'M7 7 17 17M7 17 17 7M9 7 15 1M9 17 15 23M7 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0M7 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 'clipboard:copy':'M8 8h12v13H8zM16 8V3H3v13h5',
 'clipboard:paste':'M8 4H4v17h16V4h-4M8 2h8v5H8z',
 'clipboard:merge':'M8 4H4v17h16V4h-4M8 2h8v5H8zM8 12h8M8 16h5',
 'clipboard:text':'M8 4H4v17h16V4h-4M8 2h8v5H8zM8 11h8M12 11v7',
 'selectAll':'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M7 8h10M7 12h10M7 16h7',
 'command:undo':'M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12',
 'command:redo':'M16 4 21 9l-5 5M21 9H10a6 6 0 0 0 0 12',
 'find':'M16 16l6 6M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 'link':'m10 14 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
 'clearFormatting':'m5 3 12 0M11 3 7 18M13 15l7 7M20 15l-7 7'
};
export function commandLabel(button,label,action,shortcut=''){
 const document=button.ownerDocument;if(paths[action]){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-1 -1 26 26');svg.setAttribute('class','command-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[action]);svg.append(path);button.append(svg)}
 const text=document.createElement('span');text.textContent=label;button.append(text);button.title=label+(shortcut?' · '+shortcut:'');
}
