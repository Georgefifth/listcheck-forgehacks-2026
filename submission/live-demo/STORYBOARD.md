# Storyboard and full English narration

Planned pacing: within the official 2–4 minute window, with pauses for first-time viewers. Actual output timings are documented in FINAL-QA.md after export. Light editorial palette follows the product: ivory, emerald, mint. Synthetic data is explicitly disclosed.

## 0:00–0:12 · hook

Estimated duration: 12.0 s.

Visual: Designed title card: Same property. Different records. — A changed owner? A missing ID? A shortened address?

Viewer focus: One decision: changed record or different representation?.

Narration:

> A client sends an updated property list. Which records changed, and which just look different? Before trusting the spreadsheet, someone has to make that decision.

Direction: Hold a clean card; preserve subtitle safe area.

Actions:

- Native demo-recorder card rendering.

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 0:12–0:23 · problem

Estimated duration: 11.0 s.

Visual: Designed title card: Lookups leave loose ends. — Reordered rows. Different headers. Missing identifiers.

Viewer focus: Why exact lookup alone leaves work behind.

Narration:

> For operations staff, exact lookups only solve part of reconciliation. Missing identifiers and abbreviated addresses turn the remaining records into a manual investigation.

Direction: Hold a clean card; preserve subtitle safe area.

Actions:

- Native demo-recorder card rendering.

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 0:23–0:35 · import

Estimated duration: 11.6 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Two actual synthetic lists, six records each.

Narration:

> ListCheck keeps that investigation in one place. This is the running application, using six synthetic property records in each list. Files stay on your machine.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- #sample — waitFor
- #sample — click
- wait — hold 6.5s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 0:35–0:46 · map

Estimated duration: 11.2 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Address → Location; Owner → Contact.

Narration:

> First, map the fields. Address in our list corresponds to Location in the client file. Owner corresponds to Contact. Row order does not matter.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- #next — waitFor
- #next — click
- wait — hold 7s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 0:46–0:57 · id

Estimated duration: 10.8 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Unique-ID selector and its constraints.

Narration:

> We explicitly select Property ID. Only nonblank identifiers that are unique in both files can match automatically. Names and addresses remain candidate fields.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- #unique-key — waitFor
- exec — change a native selector through its actual change event (tool has no selectOption action)
- #unique-key — hover
- wait — hold 6.5s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 0:57–1:07 · compare

Estimated duration: 10.4 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Summary counts and uncertainty.

Narration:

> Now compare. Two records are unchanged. One exact match has changed fields. Three records still need review, including one without any candidate.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- #run — waitFor
- #run — click
- #results-section:not([hidden]) — waitFor
- wait — hold 6.5s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 1:07–1:23 · exact

Estimated duration: 15.9 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Alex Tan → Chris Park; Active → Paused.

Narration:

> River View has the same unique ID in both files. Its owner changed from Alex Tan to Chris Park, and its status changed from Active to Paused. The original values are visible side by side.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- exec — change a native selector through its actual change event (tool has no selectOption action)
- button[aria-label="View River View"] — waitFor
- button[aria-label="View River View"] — click
- wait — hold 8.5s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 1:23–1:38 · candidate

Estimated duration: 15.5 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Oak Garden ↔ Oak Gardens; address abbreviation; similarity 76%.

Narration:

> Oak Garden has no ID. ListCheck suggests Oak Gardens at thirty two Oak Street, abbreviated in the client file. The similarity score is evidence to inspect, not a probability that the match is correct.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- exec — change a native selector through its actual change event (tool has no selectOption action)
- button[aria-label="View Oak Garden"] — waitFor
- button[aria-label="View Oak Garden"] — click
- wait — hold 8.5s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 1:38–1:50 · confirm

Estimated duration: 11.2 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Human-confirmed status and updated changes.

Narration:

> After checking the fields, we confirm the match. The differences update immediately, and this client record is reserved so another property cannot claim it.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- #detail .pair-card button — waitFor
- #detail .pair-card button — click
- wait — hold 5.5s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 1:50–1:59 · undo

Estimated duration: 9.5 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Return to Needs review.

Narration:

> If that decision was wrong, undo puts the record back in review and releases its counterpart. Human decisions remain reversible.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- #detail button — waitFor
- #detail button — click
- wait — hold 4s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 1:59–2:11 · review-rest

Estimated duration: 11.6 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Second candidate confirmation; original values retained.

Narration:

> We review the second shortened name in the same way. Confirming these suggestions links records; it never hides their different IDs, names, or address values.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- #detail .pair-card button — waitFor
- #detail .pair-card button — click
- button[aria-label="View Sunrise Tower"] — waitFor
- button[aria-label="View Sunrise Tower"] — click
- wait — hold 2s
- #detail .pair-card button — waitFor
- #detail .pair-card button — click
- wait — hold 2s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 2:11–2:24 · no-counterpart

Estimated duration: 12.9 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Explicit no-counterpart decision.

Narration:

> West Park has no counterpart we can confirm. We mark that explicitly. This is different from an unreviewed record, and it does not prove a property was deleted.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- button[aria-label="View West Park"] — waitFor
- button[aria-label="View West Park"] — click
- wait — hold 1.5s
- #detail > button — waitFor
- #detail > button — click
- wait — hold 3.5s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 2:24–2:37 · report

Estimated duration: 12.9 s.

Visual: Continuous live application session; state persists across scenes.

Viewer focus: Final counts and CSV download.

Narration:

> The final result is two unchanged records, three with changes, and one confirmed without a counterpart. The CSV report preserves decisions, original row references, and any remaining uncertainty.

Direction: Synthetic cursor fly-in and click ripple; built-in eased focus zoom at relevant interactions. Keep result frames long enough to inspect.

Actions:

- #export — waitFor
- #export — click
- wait — hold 4.5s

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 2:37–2:52 · technical

Estimated duration: 15.9 s.

Visual: Designed title card: Statistical matching. Human judgment. — Character TF-IDF → candidate ranking → manual confirmation

Viewer focus: TF-IDF/worker/local parser boundary.

Narration:

> Under the hood, character level T F I D F and cosine similarity handle small text differences. A browser worker runs matching; a local Python service reads CSV and Excel files. Eighteen automated tests pass.

Direction: Hold a clean card; preserve subtitle safe area.

Actions:

- Native demo-recorder card rendering.

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## 2:52–3:04 · closing

Estimated duration: 12.0 s.

Visual: Designed title card: Less checking. More clarity. — For people reconciling recurring business lists.

Viewer focus: Practical value and unvalidated next step.

Narration:

> ListCheck makes spreadsheet reconciliation inspectable and reversible. Next, we will test real recurring workflows and measure time saved and incorrect links. Two lists. Clear differences.

Direction: Hold a clean card; preserve subtitle safe area.

Actions:

- Native demo-recorder card rendering.

Captions: generated from the full narration, chunked into short cues; English TTS voice en-US-AriaNeural. No music, microphone, system audio, or unrelated windows.

## Rules checked

Official overview: https://forgehacks-2026.devpost.com/ — public demo video 2–4 minutes, showing the problem and how the project works, hosted online; source repository and README required. Rules: https://forgehacks-2026.devpost.com/rules — working-demo quality is evaluated, AI-assisted coding is permitted and distinguished from product AI/ML. No specified codec, resolution or frame rate was found in those pages. We choose 1080p H.264/AAC MP4. GitHub-hosted video page will be public; YouTube hosting is given as an example rather than stated as the only host. Organizer acceptance of GitHub hosting is not independently confirmed.

## Revision after inspection

The initial exact-match shot placed Owner and Status too close to the subtitle area. The exact and candidate scenes were re-recorded using the same real application, native field-selector change events, and scrolling to the details panel. The existing recorder post-production module rebuilt the movie from the repaired capture ranges. No record values, results, or application state were fabricated.

## Actual output timeline

| Scene | Start | End |
|---|---|---|
| hook | 00:00 | 00:13 |
| problem | 00:13 | 00:27 |
| import | 00:27 | 00:40 |
| map | 00:40 | 00:54 |
| id | 00:54 | 01:07 |
| compare | 01:07 | 01:21 |
| exact | 01:21 | 01:36 |
| candidate | 01:36 | 01:52 |
| confirm | 01:52 | 02:03 |
| undo | 02:03 | 02:14 |
| review-rest | 02:14 | 02:26 |
| no-counterpart | 02:26 | 02:39 |
| report | 02:39 | 02:54 |
| technical | 02:54 | 03:12 |
| closing | 03:12 | 03:28 |
