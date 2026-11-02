# Remotion renderer — YouTube Agent Studio

This is the first rendering scaffold for the Studio. It creates a 1920x1080, 30fps composition with animated scene cards.

## Run locally
- Node.js 20+
- `npm install`
- `npm run dev`
- Select `YouTubeVideo` in Remotion Studio.

Render the included sample:
`npm run render:sample`

The current sample is a visual proof of concept. Narration, generated assets, captions, music, timeline editing, project persistence and cloud rendering are subsequent integration steps. The 5-minute target is 9,000 frames at 30fps; the sample composition is configured to that duration.

## Pipeline target
Script API -> normalized scene JSON -> voice generation -> visual asset generation -> Remotion props -> preview -> MP4 render.

Do not put API keys in this folder or commit them to GitHub.
