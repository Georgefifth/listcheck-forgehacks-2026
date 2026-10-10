# Verification · 2026-10-10

## Automated

- 8 Python parser tests passed: CSV encodings/header handling, XLSX strings/leading zeros/dates/formula caches, malformed or unsafe inputs, size limits.
- 10 JavaScript core tests passed: unique-key matching, duplicates/blank keys, case sensitivity, one-to-one decisions and undo, uncertain statuses, candidate thresholds, raw differences, CSV formula protection, sample workflow.
- JavaScript syntax checks passed.

## Browser

Verified using only synthetic fixtures created for this project:

- Imported actual CSV files from both sides and an XLSX fixture; XLSX ID `001` was preserved.
- Mapped fields and explicitly selected a unique key; ran the worker-based comparison.
- Confirmed fuzzy suggestions, undid a decision, marked one record as having no counterpart, filtered changes and inspected raw field differences.
- Final six-row example: 2 unchanged, 3 changed, 0 pending, 1 manually unmatched A, 1 unlinked B.
- Tested desktop 1280×900 and phone 390×844; phone document width did not exceed its viewport.
- No captured browser console warnings or errors.
- Report export handler displayed success, and generated report structure/CSV escaping passed unit tests. The in-app browser download event timed out; downloaded files were not independently verified. Field-recipe export/import and maximum-size performance are not end-to-end verified.

Screenshot: `results-preview.jpg`.

## Boundaries

No external deployment, contest submission or customer validation. Existing local projects were not read or reused. No API keys, paid dependencies or remote processing. See README.md for data lifecycle and matching limits.

## English submission update

The interface, import warnings, export labels and synthetic examples were localized into English. Core and parser tests passed after localization. The English example completed candidate confirmation and raw-field inspection in the browser; no Chinese text was present in the displayed result. English layout checked at 1200×800, 1440×960 and 390×844. Gallery assets show actual synthetic-data UI states. The demo is a silent, captioned screenshot walkthrough, not a continuous recording.
