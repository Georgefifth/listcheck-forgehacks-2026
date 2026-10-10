# Project name

ListCheck

# Elevator pitch

Reconcile two spreadsheets, spot changes, and review uncertain matches—all on your own machine.

# About the project

## Inspiration

A recurring spreadsheet task often looks simple: compare an internal list with the latest file from a client or partner. In practice, rows move, column names differ, IDs go missing, and names or addresses get shortened. A lookup can find identical keys, but someone still has to decide what an uncertain match means.

We wanted a focused tool for operations staff who need to reconcile property or supplier lists without writing code or sending business records to a cloud service. The goal was to make each difference inspectable and each uncertain decision explicit.

## What it does

ListCheck guides users through three steps: import two CSV or XLSX files, map corresponding fields, and compare the records.

An explicitly selected unique ID links records automatically only when it is nonblank and unique in both files. For other records, character-level TF-IDF vectors and cosine similarity suggest candidates using fields such as names and addresses. Suggestions always require human confirmation.

Users can inspect original values, review changed fields, search for another counterpart manually, undo decisions, and explicitly mark a record as having no counterpart. One-to-one matching prevents the same target record from being assigned twice. CSV reports preserve unreviewed statuses, source row references, and candidate scores. Field settings can be saved for a later comparison.

Processing runs locally: a loopback Python service reads the files in memory, and a browser worker performs matching. No account, API key, or cloud AI service is needed.

## How we built it

The application uses vanilla JavaScript modules, semantic HTML, and responsive CSS. A Web Worker keeps matching computations off the interface thread.

The Python standard-library backend parses CSV and reads XLSX archives and worksheet XML. It checks file and expansion limits, preserves common leading-zero and date formats, and reads saved formula results without executing or recalculating formulas.

The matching engine fits inverse document frequencies to the two imported lists. It combines character bigrams and trigrams with cosine similarity to handle small spelling and abbreviation differences. Exact IDs and human decisions reserve target records, while field comparisons retain original values.

The interface and exports are in English. We used automated tests and synthetic browser examples to check parsing, matching, review decisions, and report generation. AI-assisted coding supported development; the product's matching uses statistical text features, not a language model.

## Challenges we ran into

The hardest design problem was distinguishing “no match found yet” from “a person confirmed there is no counterpart.” Treating both as missing records would make reports misleading, so they remain separate states.

Spreadsheet formats created another challenge: IDs may have leading zeros, formulas may lack cached values, and CSV cells can become executable formulas in spreadsheet applications. The importer reports unsupported cases, and the exporter escapes unsafe formula prefixes.

Candidate retrieval also involves a tradeoff between responsiveness and completeness. The MVP limits retrieval before ranking suggestions, so a valid counterpart can be missed. Manual search remains available, and similarity scores are presented as scores rather than probabilities.

Browser download verification encountered an in-app browser timeout. Report content and escaping passed automated tests, but downloaded files have not been independently verified end to end.

## Accomplishments that we're proud of

- A working import-to-review workflow using real CSV and XLSX inputs.
- Human confirmation, undo, and one-to-one matching instead of silently merging similar records.
- Original field values and source rows that make changes inspectable.
- Local processing without external APIs or paid dependencies.
- Eighteen passing automated tests, plus desktop and mobile browser checks.

## What we learned

Matching is only part of reconciliation. A useful tool also needs clear uncertainty, reversible decisions, and reports that distinguish evidence from assumptions.

We also learned that data preservation matters as much as similarity: normalization can help retrieve a candidate, but it must not hide a meaningful difference in the original values.

The MVP demonstrates the workflow, but it does not yet prove customer demand or time savings. Those need evaluation with real recurring tasks.

## What's next for ListCheck

Next, we want to test with operations staff who already reconcile recurring property or supplier lists. We will measure review time, accepted and rejected suggestions, and incorrect links against their existing workflow.

Technical priorities are reliable download verification across browsers, resumable review sessions, broader spreadsheet-format support, and larger-list performance and candidate-recall evaluation. These are planned improvements, not current features.

# Built with

Python, JavaScript, HTML5, CSS3, Web Workers, TF-IDF

# Try it out links

No public demo or source repository has been published yet. Do not submit the localhost URL as a public try-it-out link.

Local run: `python3 server.py`, then open `http://127.0.0.1:8765/`.

# Submission assets

- Thumbnail: `thumbnail.png` (generated illustration).
- Gallery: `gallery/01-import.png`, `gallery/02-mapping.png`, `gallery/03-candidates.png`, `gallery/04-changes.png` (actual interface screenshots).
- Demo: `listcheck-demo.mp4` (captioned walkthrough assembled from actual interface screenshots; not a continuous screen recording).
