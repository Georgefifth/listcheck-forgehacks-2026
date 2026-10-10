import {sample, toCSV, exportRows} from './core.mjs';
const $ = id => document.getElementById(id);
const node = (tag, text, className) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
const state = {left: null, right: null, mappings: [], uniqueKey: null, threshold: .6, decisions: new Map(), report: null, selected: null, page: 0, busy: false};
const files = {left: null, right: null}, generations = {left: 0, right: 0};
let worker, requestId = 0, waiting = new Map();
function createWorker() {
  worker?.terminate();
  for (const {reject} of waiting.values()) reject(new Error('Comparison cancelled.'));
  waiting.clear();
  worker = new Worker('./worker.mjs', {type: 'module'});
  worker.onmessage = ({data}) => { const p = waiting.get(data.id); if (!p) return; waiting.delete(data.id); data.error ? p.reject(new Error(data.error)) : p.resolve(data.report); };
  worker.onerror = () => { for (const p of waiting.values()) p.reject(new Error('The comparison worker failed. Refresh the page and try again.')); waiting.clear(); };
}
function work(message) { return new Promise((resolve, reject) => { const id = ++requestId; waiting.set(id, {resolve, reject}); worker.postMessage({...message, id}); }); }
function tell(message, error = false) { $('notice').textContent = message; $('notice').className = `notice${error ? ' error' : ''}`; $('notice').hidden = !message; }
function step(number) {
  ['import', 'mapping', 'results'].forEach((name, i) => { $(`${name}-section`).hidden = number !== i + 1; $(`step${i + 1}`).classList.toggle('active', number === i + 1); if (number === i + 1) $(`step${i + 1}`).setAttribute('aria-current', 'step'); else $(`step${i + 1}`).removeAttribute('aria-current'); });
  $('step2').disabled = !state.left || !state.right;
  $('step3').disabled = !state.report;
}
function btn(text, action, cls = 'secondary') { const b = node('button', text, `button ${cls}`); b.type = 'button'; b.addEventListener('click', action); return b; }
function option(value, text) { const n = node('option', text); n.value = value; return n; }
function allowReplace() { return !state.decisions.size || window.confirm('This will clear your review decisions. Export any report you need first. Continue?'); }
function invalidate() { state.report = null; state.decisions.clear(); state.selected = null; $('step3').disabled = true; }
function preview(side) {
  const data = state[side], wrap = $(`${side}-preview`); wrap.replaceChildren();
  $(`${side}-count`).textContent = data ? `${data.rows.length.toLocaleString()} records` : 'Not imported';
  if (data) {
    const table = node('table'), head = node('thead'), tr = node('tr');
    for (const h of data.headers) tr.append(node('th', h)); head.append(tr); table.append(head);
    const body = node('tbody');
    for (const row of data.rows.slice(0, 3)) { const r = node('tr'); row.values.forEach(v => r.append(node('td', v))); body.append(r); }
    table.append(body); wrap.append(table, node('p', `Previewing ${Math.min(3, data.rows.length)} records · ${data.headers.length} fields`, 'preview-caption'));
    for (const warning of data.warnings || []) wrap.append(node('p', warning, 'warning'));
  }
  $('next').disabled = !state.left || !state.right || state.busy;
  $('step2').disabled = $('next').disabled;
}
async function loadFile(side, file, reparse = false) {
  if (!file || state.busy || !allowReplace()) return;
  const generation = ++generations[side];
  files[side] = file; invalidate(); state.mappings = []; state.uniqueKey = null; state[side] = null; preview(side);
  $(`${side}-name`).textContent = `Reading ${file.name}…`;
  $(`${side}-options`).hidden = false;
  if (!reparse) { $(`${side}-header`).value = '1'; $(`${side}-sheet`).replaceChildren(); }
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('Each file must be 10 MiB or smaller.');
    const query = new URLSearchParams({name: file.name, sheet: reparse ? $(`${side}-sheet`).value : '', header: $(`${side}-header`).value});
    const response = await fetch(`/api/parse?${query}`, {method: 'POST', headers: {'Content-Type': 'application/octet-stream'}, body: file});
    const data = await response.json();
    if (generation !== generations[side]) return;
    if (!response.ok) throw new Error(data.error || 'Could not read the file.');
    state[side] = data;
    const select = $(`${side}-sheet`); select.replaceChildren(...(data.sheets.length ? data.sheets.map(s => option(s, s)) : [option('', 'CSV (one table)')])); select.value = data.sheet; select.disabled = !data.sheets.length;
    tell(`Loaded ${file.name}. Check the preview and header row before mapping fields.`);
  } catch (error) { if (generation === generations[side]) tell(error.message, true); }
  if (generation === generations[side]) { $(`${side}-name`).textContent = file.name; preview(side); }
}
for (const side of ['left', 'right']) {
  $(`${side}-file`).addEventListener('change', e => loadFile(side, e.target.files[0]));
  $(`${side}-reparse`).addEventListener('click', () => loadFile(side, files[side], true));
  const drop = $(`${side}-drop`);
  drop.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); $(`${side}-file`).click(); } });
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('drag'); if (e.dataTransfer.files.length !== 1) tell('Drop one file at a time.', true); else loadFile(side, e.dataTransfer.files[0]); });
}
const synonyms = [['物业编号','property id','供应商编号','supplier id','id'],['物业名称','property name','供应商名称','supplier name','name','名称'],['地址','location','address'],['负责人','contact','owner'],['状态','status']];
const canonical = name => { const text = name.trim().toLowerCase(); return synonyms.findIndex(group => group.includes(text)); };
function defaults() {
  const used = new Set();
  state.mappings = state.left.headers.map((h, i) => {
    let ri = state.right.headers.findIndex((r, j) => !used.has(j) && r.toLowerCase() === h.toLowerCase());
    if (ri < 0 && canonical(h) >= 0) ri = state.right.headers.findIndex((r, j) => !used.has(j) && canonical(r) === canonical(h));
    if (ri >= 0) used.add(ri);
    return {left: i, right: ri, label: h, identity: ['name','address'].includes(['id','name','address','contact','status'][canonical(h)]), compare: true};
  });
  state.uniqueKey = null; // A unique key must be explicitly declared by the user.
}
function renderMappings() {
  const body = $('mapping-body'); body.replaceChildren();
  for (const m of state.mappings) {
    const row = node('tr'), name = node('td', state.left.headers[m.left]), selectCell = node('td'), select = node('select');
    select.setAttribute('aria-label', `${state.left.headers[m.left]}: matching field in B`);
    select.append(option('-1', 'Skip this field'), ...state.right.headers.map((h, i) => option(String(i), h))); select.value = String(m.right);
    select.addEventListener('change', () => { m.right = Number(select.value); renderMappings(); }); selectCell.append(select); row.append(name, selectCell);
    for (const field of ['identity', 'compare']) {
      const cell = node('td'), check = node('input'); check.type = 'checkbox'; check.checked = m[field]; check.disabled = m.right < 0 || (field === 'identity' && state.uniqueKey === m.left); check.setAttribute('aria-label', `${m.label} ${field === 'identity' ? 'Find candidates' : 'Compare changes'}`);
      check.addEventListener('change', () => { m[field] = check.checked; }); cell.append(check); row.append(cell);
    }
    body.append(row);
  }
  $('unique-key').replaceChildren(option('', 'Do not use a unique ID'), ...state.mappings.filter(m => m.right >= 0).map(m => option(String(m.left), m.label)));
  if (!state.mappings.some(m => m.left === state.uniqueKey && m.right >= 0)) state.uniqueKey = null;
  $('unique-key').value = state.uniqueKey === null ? '' : String(state.uniqueKey);
  $('threshold').value = String(state.threshold * 100); $('threshold-label').textContent = `${Math.round(state.threshold * 100)}%`;
}
function mappingStep() { if (!state.left || !state.right) return; if (!state.mappings.length) defaults(); renderMappings(); step(2); tell('Suggested mappings cover identical headers and a few common names. Check each mapping and select a unique ID if appropriate.'); }
$('next').addEventListener('click', mappingStep); $('step2').addEventListener('click', mappingStep);
$('step1').addEventListener('click', () => { if (!state.busy) step(1); });
$('step3').addEventListener('click', () => { if (state.report && !state.busy) { step(3); renderResults(); } });
$('back-import').addEventListener('click', () => step(1));
$('unique-key').addEventListener('change', () => { state.uniqueKey = $('unique-key').value === '' ? null : Number($('unique-key').value); renderMappings(); });
$('threshold').addEventListener('input', () => { state.threshold = Number($('threshold').value) / 100; $('threshold-label').textContent = `${Math.round(state.threshold * 100)}%`; });
$('sample').addEventListener('click', () => {
  if (state.busy || !allowReplace()) return;
  invalidate(); state.left = structuredClone(sample.left); state.right = structuredClone(sample.right); state.mappings = [];
  for (const side of ['left', 'right']) { generations[side]++; files[side] = null; $(`${side}-file`).value = ''; $(`${side}-options`).hidden = true; $(`${side}-name`).textContent = side === 'left' ? 'Internal property list · Example' : 'Client property list · Example'; preview(side); }
  step(1); tell('This example includes reordered rows, contact changes, missing IDs, shortened names and addresses, and unmatched records. Select Map fields to continue.');
});
async function run() {
  if (state.busy || !allowReplace()) return;
  const mappings = state.mappings.filter(m => m.right >= 0);
  if (!mappings.length) return tell('Map at least one field.', true);
  if (new Set(mappings.map(m => m.right)).size !== mappings.length) return tell('A field in B cannot map to multiple fields in A.', true);
  if (!mappings.some(m => m.compare)) return tell('Select at least one field to compare.', true);
  state.busy = true; $('run').disabled = true; $('run').textContent = 'Comparing…'; tell('Calculating candidates. Your original files stay unchanged.');
  invalidate();
  try {
    createWorker();
    const report = await work({type: 'init', left: state.left, right: state.right, mappings, uniqueKey: state.uniqueKey, threshold: state.threshold});
    state.activeMappings = structuredClone(mappings); state.activeUniqueKey = state.uniqueKey; state.activeThreshold = state.threshold; state.decisions.clear(); state.report = report; state.selected = null; state.page = 0; $('filter').value = 'pending'; $('search').value = '';
    step(3); renderResults(); tell('Comparison complete. Unique IDs can match automatically. Review suggested candidates before exporting.');
  } catch (error) { tell(error.message, true); }
  finally { state.busy = false; $('run').disabled = false; $('run').textContent = 'Compare lists →'; if (state.report) $('export').disabled = false; }
}
$('run').addEventListener('click', run);
$('remap').addEventListener('click', () => { if (!state.busy) { renderMappings(); step(2); tell('After editing mappings, run the comparison again. This clears review decisions, so export any report you need first.'); } });
const statusLabels = {same: 'Unchanged', changed: 'Changed', review: 'Needs review', unresolved: 'No candidate', 'left-only': 'A unmatched', 'right-only': 'B unlinked'};
function recordTitle(side, index) {
  const data = state[side], nameColumn = data.headers.findIndex(h => canonical(h) === 1), row = data.rows[index];
  return row.values[nameColumn >= 0 ? nameColumn : 0] || `Row ${row.line}`;
}
function recordMeta(side, index) { const row = state[side].rows[index]; return `Source row ${row.line} · ${row.values[0] || 'No ID'}`; }
function filteredRows() {
  const filter = $('filter').value, search = $('search').value.trim().toLowerCase();
  const rows = filter === 'right-only' ? state.report.rightOnly.map(r => ({...r, status: 'right-only'})) : state.report.rows.filter(r => filter === 'all' || (filter === 'pending' ? ['review', 'unresolved'].includes(r.status) : r.status === filter));
  return rows.filter(r => { const side = r.status === 'right-only' ? 'right' : 'left', index = side === 'right' ? r.ri : r.li; return !search || state[side].rows[index].values.some(v => v.toLowerCase().includes(search)); });
}
function renderResults() {
  if (!state.report) return;
  const counts = state.report.counts;
  $('result-subtitle').textContent = `A: ${state.left.rows.length.toLocaleString()} records · B: ${state.right.rows.length.toLocaleString()} records · ${state.activeMappings.filter(m => m.compare).length} compared fields`;
  $('warnings').replaceChildren(...[...(state.left.warnings || []), ...(state.right.warnings || []), ...state.report.warnings].map(w => node('div', w, 'warning')));
  const metricData = [['Unchanged', counts.same, 'Linked, compared values identical', ''], ['Changed', counts.changed, 'Linked, original values differ', ''], ['Needs review', counts.review + counts.unresolved, 'Includes records without candidates', 'review'], ['A unmatched', counts['left-only'], 'Human confirmed', ''], ['B unlinked', counts['right-only'], 'May include unconfirmed candidates', '']];
  $('metrics').replaceChildren(...metricData.map(([label, count, note, cls]) => { const n = node('div', undefined, `metric ${cls}`); n.append(node('span', label, 'metric-label'), node('span', String(count), 'metric-value'), node('small', note)); return n; }));
  const rows = filteredRows(); state.page = Math.min(state.page, Math.max(0, Math.ceil(rows.length / 25) - 1));
  const visible = rows.slice(state.page * 25, state.page * 25 + 25), body = $('records-body'); body.replaceChildren();
  if (!visible.length) { const tr = node('tr', undefined, 'empty-row'), td = node('td', $('filter').value === 'pending' && !$('search').value ? 'All A records have been reviewed. Check changed fields or unlinked B records.' : 'No records match this filter.'); td.colSpan = 4; tr.append(td); body.append(tr); }
  for (const r of visible) {
    const side = r.status === 'right-only' ? 'right' : 'left', index = side === 'right' ? r.ri : r.li, key = `${side}:${index}`;
    const tr = node('tr', undefined, `record-row${state.selected === key ? ' selected' : ''}`), first = node('td');
    first.append(node('span', recordTitle(side, index), 'record-title'), node('span', recordMeta(side, index), 'record-meta'));
    const status = node('td'); status.append(node('span', statusLabels[r.status], `status ${r.status}`));
    const info = node('td', r.status === 'changed' ? r.changes.map(c => c.field).join(', ') : r.method === 'exact' ? 'Unique ID' : r.method === 'human' ? 'Human confirmed' : r.candidates?.length ? `${r.candidates.length} candidate${r.candidates.length === 1 ? '' : 's'}` : '—');
    const action = node('td'); const open = btn('View', () => select(key), 'text'); open.setAttribute('aria-label', `View ${recordTitle(side, index)}`); action.append(open);
    tr.append(first, status, info, action); tr.addEventListener('click', e => { if (e.target !== open) select(key); }); body.append(tr);
  }
  $('page-info').textContent = rows.length ? `${state.page * 25 + 1}–${Math.min(rows.length, (state.page + 1) * 25)} / ${rows.length} records` : '0 records';
  $('prev-page').disabled = state.page === 0; $('next-page').disabled = (state.page + 1) * 25 >= rows.length;
  $('export').disabled = state.busy;
  renderDetail();
}
function select(key) { state.selected = key; renderResults(); }
function valuesBlock(side, index) {
  const block = node('div', undefined, 'source-values');
  state[side].headers.forEach((h, i) => { const line = node('div', undefined, 'value-line'); line.append(node('span', h), node('span', state[side].rows[index].values[i] || '(empty)')); block.append(line); });
  return block;
}
async function decision(li, ri, undo = false) {
  if (state.busy) return;
  const decisions = new Map(state.decisions); undo ? decisions.delete(li) : decisions.set(li, ri);
  state.busy = true; renderDetail();
  try {
    const report = await work({type: 'report', decisions: [...decisions], threshold: state.activeThreshold});
    state.decisions = decisions; state.report = report;
    tell(undo ? 'Decision undone. The record is back in review.' : ri === null ? 'Confirmed: this A record has no counterpart in B. You can undo this decision.' : 'Match confirmed. Differences are updated, and this B record is reserved for this A record.');
  } catch (error) { tell(error.message, true); }
  finally { state.busy = false; renderResults(); }
}
function renderDetail() {
  const panel = $('detail'); panel.replaceChildren();
  if (!state.selected) { const empty = node('div', undefined, 'detail-empty'); const title = node('h3', 'Every match is open to review'); title.id = 'detail-title'; empty.append(node('div', '≋', 'big-icon'), title, node('p', 'Select a record to inspect original fields, candidates, and changes. Similar records are never automatically merged.')); panel.append(empty); return; }
  const [side, rawIndex] = state.selected.split(':'), index = Number(rawIndex);
  if (!state[side]?.rows[index]) { state.selected = null; renderDetail(); return; }
  const title = node('h3', recordTitle(side, index)); title.id = 'detail-title'; panel.append(node('p', `${side === 'left' ? 'A · Your list' : 'B · The other list'} / Source row ${state[side].rows[index].line}`, 'detail-topline'), title);
  if (side === 'right') { panel.append(node('p', 'This B record is unlinked. It may appear as an unconfirmed candidate. Check the A records awaiting review.'), valuesBlock(side, index)); return; }
  const row = state.report.rows[index];
  panel.append(node('span', statusLabels[row.status], `status ${row.status}`));
  if (row.ri !== null) {
    panel.append(node('p', `${row.method === 'exact' ? 'Automatically matched by a unique ID in both lists.' : 'Match confirmed by you.'} B: ${recordTitle('right', row.ri)} (source row ${state.right.rows[row.ri].line})`));
    for (const m of state.activeMappings.filter(m => m.compare)) {
      const a = state.left.rows[index].values[m.left], b = state.right.rows[row.ri].values[m.right], part = node('div', undefined, `compare-field${a !== b ? ' changed' : ''}`);
      part.append(node('strong', m.label), node('span', `A · ${a || '(empty)'}`), node('span', `B · ${b || '(empty)'}`)); panel.append(part);
    }
    if (row.method === 'human') { const undo = btn('Undo this match', () => decision(index, null, true), 'text full-width'); undo.disabled = state.busy; panel.append(undo); }
    return;
  }
  panel.append(valuesBlock('left', index));
  if (row.status === 'left-only') { panel.append(node('p', 'You confirmed that this list B has no counterpart for this record.')); const undo = btn('Undo no-counterpart decision', () => decision(index, null, true), 'text full-width'); undo.disabled = state.busy; panel.append(undo); return; }
  panel.append(node('p', row.candidates.length ? 'These candidates are statistically similar, not confirmed identities. Check their names, addresses, and original fields.' : 'No candidates meet the current threshold. Search manually or confirm that no counterpart exists.'));
  for (const candidate of row.candidates) {
    const card = node('div', undefined, 'pair-card'), head = node('div', undefined, 'pair-head'); head.append(node('span', `B source row ${state.right.rows[candidate.ri].line}`), node('span', `Similarity ${Math.round(candidate.score * 100)}%`));
    card.append(head, node('strong', recordTitle('right', candidate.ri)));
    for (const m of state.activeMappings.filter(m => m.identity && m.left !== state.activeUniqueKey)) card.append(node('p', `${m.label} · ${state.right.rows[candidate.ri].values[m.right] || '(empty)'}`));
    const expand = node('details'), summary = node('summary', 'See all B fields'); expand.append(summary, valuesBlock('right', candidate.ri)); card.append(expand);
    const confirm = btn('Confirm this match', () => decision(index, candidate.ri), 'primary'); confirm.disabled = state.busy; card.append(confirm); panel.append(card);
  }
  const noMatch = btn('Confirm no counterpart in B', () => decision(index, null), 'secondary full-width'); noMatch.disabled = state.busy; panel.append(noMatch);
  const manual = node('details', undefined, 'manual-tools'), summary = node('summary', 'Choose another B record manually'); manual.append(summary);
  const search = node('input'); search.type = 'search'; search.placeholder = 'Search B by name, address, or ID'; search.setAttribute('aria-label', 'Search available B records');
  const select = node('select'); select.setAttribute('aria-label', 'Choose a B record manually');
  const info = node('small');
  const fill = () => {
    const query = search.value.trim().toLowerCase(), available = state.right.rows.map((r, ri) => ({r, ri})).filter(({r, ri}) => !state.report.used.has(ri) && (!query || r.values.some(v => v.toLowerCase().includes(query))));
    select.replaceChildren(option('', 'Select a record, then check its full fields'), ...available.slice(0, 100).map(({r, ri}) => option(String(ri), `${recordTitle('right', ri)} · Row ${r.line}`)));
    info.textContent = available.length > 100 ? `${available.length} results; showing the first 100. Narrow your search.` : `${available.length} available records`;
  };
  const manualPreview = node('div'); select.addEventListener('change', () => { manualPreview.replaceChildren(); if (select.value !== '') manualPreview.append(valuesBlock('right', Number(select.value))); });
  search.addEventListener('input', () => { fill(); manualPreview.replaceChildren(); }); fill();
  const confirm = btn('Confirm manual match', () => { if (select.value === '') return tell('Select a B record first.', true); decision(index, Number(select.value)); }, 'secondary'); confirm.disabled = state.busy;
  manual.append(search, select, info, manualPreview, confirm); panel.append(manual);
  if (state.busy) panel.querySelectorAll('button').forEach(b => b.disabled = true);
}
for (const id of ['filter', 'search']) $(id).addEventListener(id === 'filter' ? 'change' : 'input', () => { state.page = 0; renderResults(); });
$('prev-page').addEventListener('click', () => { state.page--; renderResults(); }); $('next-page').addEventListener('click', () => { state.page++; renderResults(); });
function download(content, name, type) { const url = URL.createObjectURL(new Blob([content], {type})), a = node('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function downloadReport() { const engine = {left: state.left, right: state.right, mappings: state.activeMappings}; download(toCSV(exportRows(engine, state.report)), 'listcheck-review.csv', 'text/csv;charset=utf-8'); tell('Report download requested. Unreviewed statuses are preserved; unsafe formula prefixes are escaped.'); }
$('export').addEventListener('click', () => { const count = state.report.counts.review + state.report.counts.unresolved; if (count) { $('export-message').textContent = `${count} A records still need review; ${state.report.counts['right-only']} B records remain unlinked.`; $('export-dialog').showModal(); } else downloadReport(); });
$('cancel-export').addEventListener('click', () => $('export-dialog').close()); $('confirm-export').addEventListener('click', () => { $('export-dialog').close(); downloadReport(); });
$('export-recipe').addEventListener('click', () => { const recipe = {version: 1, uniqueKey: state.activeUniqueKey === null ? null : state.left.headers[state.activeUniqueKey], threshold: state.activeThreshold, mappings: state.mappings.map(m => { const active = state.activeMappings.find(a => a.left === m.left); return {left: state.left.headers[m.left], right: active ? state.right.headers[active.right] : null, identity: active?.identity ?? false, compare: active?.compare ?? false}; })}; download(JSON.stringify(recipe, null, 2), 'listcheck-fields.json', 'application/json'); tell('Settings download requested. It contains column names and comparison settings, not record data.'); });
$('recipe-file').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 65536) throw new Error('The settings file is too large.');
    const recipe = JSON.parse(await file.text());
    if (recipe.version !== 1 || !Array.isArray(recipe.mappings) || recipe.mappings.length !== state.left.headers.length || !Number.isFinite(recipe.threshold) || recipe.threshold < .3 || recipe.threshold > .95) throw new Error('Invalid field settings format.');
    const seen = new Set(), targetSeen = new Set();
    const mappings = recipe.mappings.map(m => {
      const li = state.left.headers.indexOf(m.left), ri = m.right === null ? -1 : state.right.headers.indexOf(m.right);
      if (li < 0 || (m.right !== null && ri < 0) || seen.has(li) || (ri >= 0 && targetSeen.has(ri)) || typeof m.identity !== 'boolean' || typeof m.compare !== 'boolean') throw new Error('Column names are missing, duplicated, or invalid. Map this pair of files manually.');
      seen.add(li); if (ri >= 0) targetSeen.add(ri); return {left: li, right: ri, label: m.left, identity: m.identity, compare: m.compare};
    });
    const unique = recipe.uniqueKey === null ? null : state.left.headers.indexOf(recipe.uniqueKey);
    if (unique !== null && (unique < 0 || !mappings.some(m => m.left === unique && m.right >= 0))) throw new Error('The unique ID column is missing or unmapped.');
    state.mappings = mappings; state.uniqueKey = unique; state.threshold = recipe.threshold; renderMappings(); tell('Field settings loaded. Check the mappings for these files before comparing.');
  } catch (error) { tell(error.message, true); }
  e.target.value = '';
});
$('reset').addEventListener('click', () => { if (!state.busy) $('reset-dialog').showModal(); }); $('cancel-reset').addEventListener('click', () => $('reset-dialog').close());
$('confirm-reset').addEventListener('click', () => {
  $('reset-dialog').close(); worker?.terminate(); invalidate(); state.mappings = []; state.uniqueKey = null; state.threshold = .6;
  for (const side of ['left', 'right']) { generations[side]++; state[side] = null; files[side] = null; $(`${side}-file`).value = ''; $(`${side}-name`).textContent = 'Choose a file or drop it here'; $(`${side}-options`).hidden = true; preview(side); }
  step(1); tell('Workspace cleared. Your original files are unchanged.');
});
step(1);
