# Final demo QA

Actual duration: **208.786 seconds (3:28.786)**. Output: 1920×1080, 30 fps, H.264 video + AAC 48 kHz audio, MP4.

## Recording and editing

Used `/home/yap/tools/demo-recorder` for headless real-application capture, shared session state, synthetic mouse cursor and click ripples, built-in focus tracking/zoom processing, light editorial title cards, English Edge TTS (Aria), scene freeze-padding for narration, caption chunking, and final export. Reused its post module after re-recording the exact-match and candidate detail shots. No microphone, system sound, private records, fake interfaces, or fabricated results.

## Inspection completed

- All 15 scene captures completed without error; no failed scene was omitted.
- Inspected 104 samples across the final movie at two-second intervals, plus full-resolution detail frames.
- Reviewed hook, problem explanation, mapping, exact differences, candidate confirmation, undo, no-counterpart decision, export, architecture and conclusion.
- Initial detail framing put changed fields near the subtitle area. Re-recorded those shots with actual scrolling; final Owner and Status values are fully visible above captions.
- 42 burned-in English caption cues. Chunked and aligned by scene; they are not word-level aligned.
- Audio track decoded successfully. Mean -22.0 dB; maximum -1.8 dB, no clipping reported. TTS supplies all sound.
- Narration is given approximately 13–16 seconds for key task/results scenes, including holds and pauses.

## Official requirements

Official overview: https://forgehacks-2026.devpost.com/
Official rules: https://forgehacks-2026.devpost.com/rules

The overview requires a public 2–4 minute demo explaining the problem and how the project works, an online video, and a GitHub source repository with README. This movie is within that duration, the live task is the majority of its runtime, and synthetic data is explicitly disclosed. No required resolution, codec, frame rate, or synthetic-data ban was found in the checked pages. The repository and video page are public. YouTube is an example in the requirement; organizer acceptance of GitHub-hosted playback has not been confirmed separately.

## Limits

The ten-minute production window does not permit a full real-time human listen-through. Visual inspection covers the complete movie through sampled frames; speech pronunciation and fine-grained audio/subtitle synchronization have not been manually audited sentence by sentence. Browser playback verification is recorded below when completed. Original file upload is supported in the local app; the Pages app is an explicitly labeled example-only preview. No Devpost submission has been made.

## Actual scene timeline

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

## Public playback verification

GitHub Pages build completed. Opened the final public video page and clicked its Play demo control. The browser reported duration 208.786 seconds, readyState 4, paused false, muted false and no media error. The actual decoded opening frame was visible. This verifies public playback, not a complete human listen-through.

Public video: https://georgefifth.github.io/listcheck-forgehacks-2026/video.html
Public MP4: https://georgefifth.github.io/listcheck-forgehacks-2026/listcheck-live-demo.mp4
Source: https://github.com/Georgefifth/listcheck-forgehacks-2026

## Required submission hosting step — confirmed platform restriction

Devpost's official help page, https://help.devpost.com/article/85-uploading-a-demo-video, explicitly limits the Video demo field to YouTube, Vimeo, or Youku URLs. GitHub Pages playback therefore does NOT complete the submission video requirement. Upload the completed MP4 to an accepted service, enable public viewing/embedding as required, and paste that service's URL into Devpost. The Pages URL remains useful as a Try it out link. This upload and Devpost submission are unfinished; no supported-platform account session was used.
