# ListCheck · 清单核对

A local web tool for comparing two recurring property or supplier lists. CSV/XLSX import, explicit column mapping, character TF-IDF candidate matching, human decisions, and safe CSV/recipe export.

## Run

```bash
cd /home/yap/Hack/ForgeHacks/listcheck-mvp-20261010
python3 server.py
```

Open http://127.0.0.1:8765. No installation, CDN, API key or paid service is required. Files are processed in memory on this machine; data is not sent to an external service. Do not expose this local server publicly.

## Verify

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
node tests/core.test.mjs
```

## Limits

10 MiB per file, 20,000 data rows, 100 columns, 500,000 populated cells per worksheet; XLSX expansion up to 100 MiB. CSV supports UTF-8, UTF-16 BOM and GB18030. First row is the default header; it can be changed. XLS, XLSM and password-protected workbooks are unsupported. XLSX uses cached formula results; missing formula caches block the selected worksheet. Common dates/leading-zero number formats are supported, not arbitrary Excel display formats. Exports are review reports, not edited workbooks.

Similarity is not a probability. Every suggested match requires confirmation. Missing records are only missing from the supplied list, not proven additions/deletions. CSV fields starting with formula/control prefixes are apostrophe-prefixed to prevent spreadsheet formula execution.

Candidate retrieval examines at most 100 records before returning the top three suggestions and skips character fragments shared by more than 1,500 records. It is not exhaustive: common names or large lists can hide a valid counterpart. Use manual search to review uncertain records. Refreshing or closing the page discards the current work; export before leaving. The saved field recipe contains settings only, not review decisions or records.

No customer benchmark or recurring-use validation has been performed. See SPEC.md for validation targets and AGENTS.md for development constraints.

## Hosted preview and video

The GitHub Pages version in `docs/` supports the built-in synthetic example and the real matching/review engine. CSV/XLSX import requires the local Python service; the hosted preview labels this limitation explicitly. `docs/video.html` presents the narrated live demonstration. The recorder scene specification lives in `submission/live-demo/scenes.cjs`.
