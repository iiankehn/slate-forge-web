// The document library is an on-demand dialog, never persistent application navigation.
export function initSidebar(){const dialog=document.getElementById('libraryDialog'),toggle=document.getElementById('sidebarToggle'),close=document.getElementById('closeLibrary');
 function dismiss(restore=false){if(dialog.open)dialog.close();toggle.setAttribute('aria-expanded','false');if(restore)toggle.focus()}
 function open(){if(!dialog.open)dialog.showModal();toggle.setAttribute('aria-expanded','true');document.getElementById('search').focus()}
 toggle.onclick=open;close.onclick=()=>dismiss(true);dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss(true)});dialog.addEventListener('click',event=>{if(event.target===dialog)dismiss(true)});dialog.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));return {open,closeMobile:dismiss};
}
