const s=require('./scenes.cjs');
for(const name of ['exact','candidate']){
 const scene=s.find(x=>x.name===name);const i=scene.actions.findIndex(a=>a.type==='wait');
 scene.actions.splice(i,0,{type:'exec',js:"document.querySelector('#detail').scrollIntoView({block:'start',behavior:'smooth'});"},{type:'wait',ms:700},{type:'hover',sel:name==='exact'?'#detail .compare-field:last-of-type':'#detail .pair-card'});
}
module.exports=[{name:'setup',url:'http://127.0.0.1:8765/',session:'listcheck',actions:[{type:'waitFor',sel:'#sample'},{type:'click',sel:'#sample'},{type:'waitFor',sel:'#next'},{type:'click',sel:'#next'},{type:'waitFor',sel:'#unique-key'},{type:'exec',js:"const s=document.querySelector('#unique-key');s.value='0';s.dispatchEvent(new Event('change',{bubbles:true}));"},{type:'waitFor',sel:'#run'},{type:'click',sel:'#run'},{type:'waitFor',sel:'#results-section:not([hidden])'}]},s.find(x=>x.name==='exact'),s.find(x=>x.name==='candidate')];
