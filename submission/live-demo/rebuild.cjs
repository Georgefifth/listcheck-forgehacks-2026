const fs=require('fs');const path=require('path');
const {post}=require('/home/yap/tools/demo-recorder/lib/post');
const original=require('./scenes.cjs');const repaired=require('./repair.cjs');
const root=path.resolve('submission/listcheck-live-demo.work');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'timestamps.json')));
const repairManifest=JSON.parse(fs.readFileSync('submission/live-demo/repair/timestamps.json'));
for(const name of ['exact','candidate']){
 const index=original.findIndex(s=>s.name===name);const source=repairManifest.find(m=>m.name===name);if(!source||source.error)throw Error('Repair failed: '+name);
 original[index]=repaired.find(s=>s.name===name);Object.assign(manifest.find(m=>m.name===name),source,{idx:index});
}
fs.writeFileSync('submission/live-demo/final-manifest.json',JSON.stringify(manifest,null,2));
post(original,manifest,{outDir:root,width:1920,height:1080,voice:'en-US-AriaNeural',outFile:path.resolve('submission/listcheck-live-demo.mp4'),log:console.log}).catch(e=>{console.error(e);process.exit(1)});
