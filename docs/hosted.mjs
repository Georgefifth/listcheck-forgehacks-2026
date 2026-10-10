// GitHub Pages cannot run the Python XLSX importer. This hosted example
// uses the same matching engine and review workflow without an API server.
const $=id=>document.getElementById(id);
for(const side of ['left','right']){
  $(`${side}-file`).disabled=true;
  $(`${side}-drop`).addEventListener('drop',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
  $(`${side}-name`).textContent='Use the built-in example';
}
document.querySelector('.local-badge').textContent='Browser-only example · No data uploads';
const note=document.createElement('p');note.className='notice';note.textContent='Hosted preview: use “Try the property example” to explore matching and review. CSV/XLSX imports require the local Python app. Source and setup: ';
const a=document.createElement('a');a.href='https://github.com/Georgefifth/listcheck-forgehacks-2026';a.textContent='GitHub';note.append(a);
document.querySelector('.workspace-head').after(note);
const video=document.createElement('a');video.href='./video.html';video.className='button secondary';video.textContent='Watch the narrated demo';document.querySelector('footer').append(video);
