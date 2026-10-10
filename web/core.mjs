export const normalized = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const keyValue = value => String(value ?? '').trim();
export const grams = value => {
  const text = normalized(value), tokens = new Map();
  if (!text) return tokens;
  for (const word of text.split(' ')) {
    const wrapped = `^${word}$`;
    for (let n = 2; n <= 3; n++) for (let i = 0; i <= wrapped.length - n; i++) {
      const token = wrapped.slice(i, i + n);
      tokens.set(token, (tokens.get(token) || 0) + 1);
    }
  }
  return tokens;
};

// IDF is learned from both files. Similarity scores are not probabilities.
export function fitField(values) {
  const bags = values.map(grams), df = new Map();
  for (const bag of bags) for (const token of bag.keys()) df.set(token, (df.get(token) || 0) + 1);
  const vector = bag => {
    const result = new Map(); let norm = 0;
    for (const [token, count] of bag) {
      const weight = (1 + Math.log(count)) * (1 + Math.log((values.length + 1) / ((df.get(token) || 0) + 1)));
      result.set(token, weight); norm += weight * weight;
    }
    if (norm) for (const [token, weight] of result) result.set(token, weight / Math.sqrt(norm));
    return result;
  };
  return bags.map(vector);
}
export function cosine(a, b) {
  if (a.size > b.size) [a, b] = [b, a];
  let sum = 0;
  for (const [token, weight] of a) sum += weight * (b.get(token) || 0);
  return Math.min(1, sum);
}
export function differences(left, right, mappings) {
  return mappings.filter(m => m.compare && String(left.values[m.left] ?? '') !== String(right.values[m.right] ?? '')).map(m => ({field: m.label, left: left.values[m.left] ?? '', right: right.values[m.right] ?? ''}));
}
export function createEngine(left, right, mappings, uniqueKey = null) {
  const identity = mappings.filter(m => m.identity && m.left !== uniqueKey);
  if (!identity.length && uniqueKey === null) throw new Error('Choose at least one matching field or a unique ID.');
  const keyMapping = mappings.find(m => m.left === uniqueKey);
  if (uniqueKey !== null && !keyMapping) throw new Error('Map the unique ID to a field in the other list.');
  const exact = new Map(), warnings = [];
  if (keyMapping) {
    const index = (rows, col) => {
      const result = new Map(); let blanks = 0;
      rows.forEach((r, i) => { const k = keyValue(r.values[col]); if (!k) { blanks++; return; } const found = result.get(k) || []; found.push(i); result.set(k, found); });
      return {result, blanks, duplicates: [...result.values()].filter(v => v.length > 1).length};
    };
    const a = index(left.rows, keyMapping.left), b = index(right.rows, keyMapping.right);
    for (const [key, indices] of a.result) if (indices.length === 1 && b.result.get(key)?.length === 1) exact.set(indices[0], b.result.get(key)[0]);
    if (a.duplicates || b.duplicates) warnings.push(`Duplicate IDs: ${a.duplicates} groups in A, ${b.duplicates} in B. These records will not auto-match.`);
    if (a.blanks || b.blanks) warnings.push(`Blank IDs: ${a.blanks} records in A, ${b.blanks} in B. These records will not auto-match.`);
  }
  const fitted = identity.map(m => ({m, vectors: fitField([...left.rows.map(r => r.values[m.left]), ...right.rows.map(r => r.values[m.right])])}));
  const posting = new Map();
  fitted.forEach((f, field) => {
    right.rows.forEach((r, ri) => {
      for (const token of f.vectors[left.rows.length + ri].keys()) {
        const name = `${field}:${token}`, found = posting.get(name) || [];
        found.push(ri); posting.set(name, found);
      }
    });
  });
  function score(li, ri) {
    if (!fitted.length) return 0;
    let sum = 0;
    for (const {m, vectors} of fitted) {
      const av = normalized(left.rows[li].values[m.left]), bv = normalized(right.rows[ri].values[m.right]);
      if (!av || !bv) continue;
      sum += av === bv ? 1 : (/^\d+$/.test(av) || /^\d+$/.test(bv)) ? 0 : cosine(vectors[li], vectors[left.rows.length + ri]);
    }
    return sum / fitted.length;
  }
  function candidates(li, used, threshold) {
    const hits = new Map();
    fitted.forEach((f, field) => {
      for (const [token, weight] of f.vectors[li]) {
        const records = posting.get(`${field}:${token}`) || [];
        // Ignore ubiquitous n-grams in large lists to avoid quadratic work.
        if (records.length > 1500) continue;
        for (const ri of records) if (!used.has(ri)) hits.set(ri, (hits.get(ri) || 0) + weight);
      }
    });
    return [...hits].sort((a, b) => b[1] - a[1]).slice(0, 100).map(([ri]) => ({ri, score: score(li, ri)})).filter(c => c.score >= threshold).sort((a, b) => b.score - a.score || a.ri - b.ri).slice(0, 3);
  }
  function report(decisions = new Map(), threshold = .6) {
    const used = new Set(exact.values());
    for (const [li, ri] of decisions) {
      if (!Number.isInteger(li) || li < 0 || li >= left.rows.length || exact.has(li)) throw new Error('Invalid record decision.');
      if (ri === null) continue;
      if (!Number.isInteger(ri) || ri < 0 || ri >= right.rows.length || used.has(ri)) throw new Error('This B record is already linked. Undo its existing match first.');
      used.add(ri);
    }
    const rows = left.rows.map((row, li) => {
      const automatic = exact.has(li), decided = decisions.has(li), ri = automatic ? exact.get(li) : decisions.get(li);
      if (ri !== undefined && ri !== null) {
        const changes = differences(row, right.rows[ri], mappings);
        return {li, ri, status: changes.length ? 'changed' : 'same', method: automatic ? 'exact' : 'human', changes, candidates: []};
      }
      if (decided) return {li, ri: null, status: 'left-only', method: 'human', changes: [], candidates: []};
      const found = candidates(li, used, threshold);
      return {li, ri: null, status: found.length ? 'review' : 'unresolved', method: 'pending', changes: [], candidates: found};
    });
    const rightOnly = right.rows.map((row, ri) => ({ri})).filter(({ri}) => !used.has(ri));
    const counts = {same: 0, changed: 0, review: 0, unresolved: 0, 'left-only': 0, 'right-only': rightOnly.length};
    for (const row of rows) counts[row.status]++;
    return {rows, rightOnly, counts, used, warnings};
  }
  return {report, score, exact, warnings, left, right, mappings};
}

export function safeCell(value) {
  const text = String(value ?? '');
  return /^[\s\u0000-\u001f]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text) ? `'${text}` : text;
}
export function toCSV(rows) {
  return '\ufeff' + rows.map(row => row.map(value => `"${safeCell(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}
export function exportRows(engine, report) {
  const labels = {same: 'Unchanged', changed: 'Changed', review: 'Unconfirmed candidate', unresolved: 'No candidate found (unreviewed)', 'left-only': 'Confirmed: no counterpart in B', 'right-only': 'B unlinked (may be an unconfirmed candidate)'};
  const output = [['Status', 'Match evidence', 'A source row', 'B source row', 'Changed fields', 'Candidate B source rows (unconfirmed)', 'Candidate similarity (not probability)', ...engine.mappings.flatMap(m => [`A · ${m.label}`, `B · ${m.label}`])]];
  for (const row of report.rows) output.push([labels[row.status], row.method === 'exact' ? 'Unique ID' : row.method === 'human' ? 'Human confirmed' : 'Unreviewed', engine.left.rows[row.li].line, row.ri === null ? '' : engine.right.rows[row.ri].line, row.changes.map(c => c.field).join(', '), row.candidates.map(c => engine.right.rows[c.ri].line).join(' / '), row.candidates.map(c => `${Math.round(c.score*100)}%`).join(' / '), ...engine.mappings.flatMap(m => [engine.left.rows[row.li].values[m.left], row.ri === null ? '' : engine.right.rows[row.ri].values[m.right]])]);
  for (const {ri} of report.rightOnly) output.push([labels['right-only'], 'Unlinked', '', engine.right.rows[ri].line, '', '', '', ...engine.mappings.flatMap(m => ['', engine.right.rows[ri].values[m.right]])]);
  return output;
}

export const sample = {
  left: {headers: ['Property ID', 'Property name', 'Address', 'Owner', 'Status'], rows: [
    ['P001', 'Maple Court', '18 Maple Road', 'Maya Chen', 'Active'],
    ['P002', 'River View', '26 River Lane', 'Alex Tan', 'Active'],
    ['P003', 'Cedar House', '8 Cedar Avenue', 'Jamie Lee', 'Active'],
    ['', 'Oak Garden', '32 Oak Street', 'Sam Wong', 'Active'],
    ['P005', 'Sunrise Tower', '66 Sunrise Road', 'Taylor Lim', 'Active'],
    ['P006', 'West Park', '12 West Avenue', 'Jordan Ng', 'Active']
  ].map((values, i) => ({line: i + 2, values})), warnings: [], sheets: []},
  right: {headers: ['Property ID', 'Property name', 'Location', 'Contact', 'Status'], rows: [
    ['P003', 'Cedar House', '8 Cedar Avenue', 'Jamie Lee', 'Active'],
    ['P001', 'Maple Court', '18 Maple Road', 'Maya Chen', 'Active'],
    ['P002', 'River View', '26 River Lane', 'Chris Park', 'Paused'],
    ['P004', 'Oak Gardens', '32 Oak St', 'Sam Wong', 'Active'],
    ['P007', 'East Gate', '70 East Road', 'Morgan Teo', 'Active'],
    ['P008', 'Sunrise Towers', '66 Sunrise Rd', 'Taylor Lim', 'Active']
  ].map((values, i) => ({line: i + 2, values})), warnings: [], sheets: []}
};
