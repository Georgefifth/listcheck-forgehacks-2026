import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine, sample, toCSV, safeCell, exportRows, fitField, cosine} from '../web/core.mjs';
const data = values => ({headers: ['ID', 'Name', 'Status'], rows: values.map((values, i) => ({line: i + 2, values}))});
const maps = [{left:0,right:0,label:'ID',identity:false,compare:true},{left:1,right:1,label:'Name',identity:true,compare:true},{left:2,right:2,label:'Status',identity:false,compare:true}];
test('unique IDs match across reordering, and field changes retain exact raw values', () => {
  const engine = createEngine(data([['001','Oak','active'],['002','Maple','active']]), data([['002','Maple','paused'],['001','Oak','active']]), maps, 0);
  const result = engine.report(); assert.equal(result.counts.same,1); assert.equal(result.counts.changed,1); assert.equal(result.rows[0].ri,1); assert.deepEqual(result.rows[1].changes,[{field:'Status',left:'active',right:'paused'}]);
});
test('duplicates and blank keys never auto-match; candidates require human decisions', () => {
  const engine = createEngine(data([['1','Oak',''],['1','Maple',''],['','Cedar','']]), data([['1','Oak',''],['','Cedar','']]), maps,0);
  assert.equal(engine.exact.size,0); assert.equal(engine.report().rows[0].status,'review'); assert.equal(engine.warnings.length,2);
});
test('case-sensitive IDs preserve distinctions and empty identities never match', () => {
  const engine = createEngine(data([['a','',''],['','','']]),data([['A','','']]),maps,0);
  assert.equal(engine.exact.size,0); assert.equal(engine.report().counts.unresolved,2);
});
test('one target cannot be linked to multiple sources; undo releases it', () => {
  const engine = createEngine(data([['','Oak Garden',''],['','Oak Gardens','']]),data([['','Oak Gardens','']]),maps,null);
  const approved = engine.report(new Map([[0,0]])); assert.equal(approved.rows[1].status,'unresolved');
  assert.throws(()=>engine.report(new Map([[0,0],[1,0]])),/already linked/);
  assert.equal(engine.report().rows[1].status,'review');
});
test('human no-match is distinct from unreviewed absence, and exports preserve both', () => {
  const engine = createEngine(data([['','Oak',''],['','Cedar','']]),data([['','River','']]),maps,null);
  const report = engine.report(new Map([[0,null]])); assert.equal(report.rows[0].status,'left-only'); assert.equal(report.rows[1].status,'unresolved'); assert.equal(report.rightOnly.length,1);
  const output = exportRows(engine,report); assert.match(output[1][0],/Confirmed/); assert.match(output[2][0],/unreviewed/); assert.match(output[3][0],/unlinked/);
});
test('exact reservation blocks conflicting manual decisions', () => {
  const engine = createEngine(data([['1','Oak',''],['','Oak','']]),data([['1','Oak','']]),maps,0);
  assert.throws(()=>engine.report(new Map([[1,0]])),/already linked/);
});
test('similarity is corpus-fitted and threshold filters candidates', () => {
  const vectors = fitField(['Maple Court','Maple Courts','Riverbank']);
  assert.ok(Math.abs(cosine(vectors[0],vectors[0])-1)<1e-12); assert.ok(cosine(vectors[0],vectors[1]) > cosine(vectors[0],vectors[2]));
  const engine = createEngine(data([['','Maple Court','']]),data([['','Maple Courts','']]),maps,null);
  assert.equal(engine.report(new Map(),.3).rows[0].status,'review'); assert.equal(engine.report(new Map(),1).rows[0].status,'unresolved');
});
test('normalization helps retrieval but never hides raw comparison differences', () => {
  const engine=createEngine(data([['1','Oak Garden','active']]),data([['1','oak  garden','active']]),maps,0);
  assert.equal(engine.report().rows[0].changes[0].field,'Name');
});
test('CSV prevents formulas, escapes quotes/newlines, retains BOM and leading zeros', () => {
  for (const value of ['=HYPERLINK("x")',' +2','-3','@SUM(1)','\tcmd','\rtext']) assert.equal(safeCell(value),`'${value}`);
  assert.equal(safeCell('001'),'001'); assert.equal(safeCell('正常'),'正常');
  const csv=toCSV([['001','a"b','line\nbreak','=1+1']]); assert.ok(csv.startsWith('\ufeff')); assert.match(csv,/"a""b"/); assert.match(csv,/"'=1\+1"/);
});
test('sample has actionable changes, candidates and missing records', () => {
  const mappings=sample.left.headers.map((label,i)=>({left:i,right:i,label,identity:i===1||i===2,compare:true}));
  const engine=createEngine(sample.left,sample.right,mappings,0),report=engine.report(new Map(),.6);
  assert.equal(report.counts.same,2); assert.equal(report.counts.changed,1); assert.ok(report.counts.review>=1); assert.ok(report.counts.unresolved>=1);
});
