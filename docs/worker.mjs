import {createEngine} from './core.mjs';
let engine;
self.onmessage = ({data}) => {
  try {
    if (data.type === 'init') engine = createEngine(data.left, data.right, data.mappings, data.uniqueKey);
    if (!engine) throw new Error('Import the lists first.');
    self.postMessage({id: data.id, report: engine.report(new Map(data.decisions || []), data.threshold)});
  } catch (error) { self.postMessage({id: data.id, error: error.message}); }
};
