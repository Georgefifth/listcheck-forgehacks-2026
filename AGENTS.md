# ListCheck

Build only in this new directory. Do not inspect or reuse any other local project.

## Product goal
Help non-technical operations staff compare two recurring business lists, identify actual changes, and review ambiguous record matches without silently merging data.

## Architecture
- Python standard-library HTTP server bound to 127.0.0.1; CSV/XLSX parsing stays on the user's machine.
- Buildless accessible HTML/CSS and ES modules; no CDN, telemetry, external API or paid dependency.
- Matching uses unique exact keys when explicitly selected, then corpus-fitted character TF-IDF cosine similarity for candidate retrieval. Scores are similarities, never probabilities.
- Every fuzzy match needs human confirmation. Target records may be matched only once.
- Original data is immutable; exports are separate files. Nothing persists after the process/page closes.

## Constraints
- Do not publish, send user data, install system packages, or scan other directories.
- Treat uploaded workbooks as untrusted: size/member/cell limits, no formula execution, no macros, no XML entity expansion.
- Preserve strings, leading-zero number formats and basic Excel dates. Explain cached formulas and unsupported formats.
- Fail clearly on malformed files, duplicate headers, unsupported formats and empty inputs.
- Neutralize spreadsheet formula injection in CSV exports and explain the transformation.
- Use textContent for user content. Never inject uploaded values as HTML.

## Quality and checks
- Python unittest: CSV encoding, ZIP limits, workbook strings/dates/formulas and invalid input.
- Node tests: exact/duplicate keys, uncertain matches, competing targets, unmatched records, missing values, exports and adversarial spreadsheet text.
- Browser QA: sample end-to-end, mapping, human confirmation, filtering, export, reset, narrow viewport.
- Report validation honestly. No fabricated customer results, confidence claims, or contest compliance claims.
