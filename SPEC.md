# ListCheck MVP specification

## User
An operations worker who compares a company list to a partner list monthly. Initial scope: property and supplier lists, not accounting reconciliation.

## Workflow
1. Load two CSV/XLSX files, or a realistic sample; choose worksheet and header row.
2. Inspect rows, map corresponding columns, choose identity fields and optionally declare a unique identifier. Select comparison fields and similarity threshold.
3. Run comparison; inspect exact matches, changes, candidate matches, left-only and right-only records.
4. Confirm/reject candidate pairs or manually link an available right record. Decisions immediately update the report; each right record can be used once.
5. Export the review report or reusable mapping recipe. Import a recipe for the next cycle.

## Acceptance
- Sorting rows does not produce false changes when a valid unique identifier exists.
- Duplicate or blank identifiers never become automatic exact matches.
- Different text values are not silently normalized away in field-level differences.
- Ambiguous candidates remain unresolved until approved; rejecting a candidate does not discard the source row.
- Unmatched does not mean deleted: labels explain that absence only refers to the loaded files.
- Cached formulas are read but never evaluated. Missing caches block the affected worksheet.
- CSV export contains original row references, decisions, source/target values and unresolved states. Dangerous formula-leading values are prefixed with an apostrophe.
- Recipes contain field names and settings, no row data. A recipe cannot silently reuse nonexistent columns.
- Useful keyboard focus, readable empty/error states, responsive layout.

## Non-goals
No accounting decisions, autonomous merging, external integrations, authentication, cloud persistence, full Excel formatting preservation, or promise of market validation.

## AI/ML boundary
Character TF-IDF is fitted on the two lists and retrieves likely pairs. Exact-key and numeric comparisons remain deterministic. Human reviewers decide whether entities are the same. This is a working statistical matching component, not an LLM wrapper; organizer acceptance of this scope has not been verified.
