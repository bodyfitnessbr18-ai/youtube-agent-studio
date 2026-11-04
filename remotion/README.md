# Remotion renderer — YouTube Agent Studio

The first rendering scaffold includes an animated reusable Sticky Man character and a five-minute financial education pilot.

## Run locally
Requirements: Node.js 20+.

```bash
cd remotion
npm install
npm run dev
```

Open the `YouTubeVideo` composition in Remotion Studio. The default composition is 1920x1080 at 30 fps and 9,000 frames (five minutes).

## Render the pilot MP4
```bash
npm run render:project
```
Output: `out/youtube-video.mp4`.

The render command reads `public/props.json`. Replace its scene data with the JSON exported by YouTube Agent Studio. Each scene supports:
- `heading`: large on-screen title
- `narration`: voiceover text displayed with the scene
- `accent`: supporting phrase
- `visual`: visual direction for future generated assets

## Optional audio
Put audio files inside `public/` and set `audioSrc` or `musicSrc` in `props.json` to a public path such as `/voiceover.mp3` or `/music.mp3`. The composition includes voice and background music tracks; background music is mixed at 12% volume.

## Current scope and limitations
- Sticky Man is currently a simple original vector character with basic idle movement and scene-dependent expressions.
- Scene changes are evenly distributed across the five-minute composition. The next iteration should use per-scene durations and word-timed captions.
- Voiceover generation, automatic subtitle timing, custom character poses, generated backgrounds, project persistence, cloud rendering and direct MP4 delivery from the web panel are not yet integrated.
- This is a local Remotion render workflow; Vercel's serverless web deployment is not itself the video rendering worker.

Do not put API keys in this repository.


## Mix Visual Engine

A new modular engine is available under `src/mix-visual-engine/`. It adds editorial, product, isometric 3D, storybook and traffic scene families while preserving the existing `YouTubeVideo`, `SleepVideo` and `ReflexaoBiblica` compositions.

### Install and run

```bash
cd remotion
npm install
npm run dev
```

Open `MixEngineVertical`, `MixEngineLandscape` or `MixEngineSquare` in Remotion Studio.

Render a demo:

```bash
npm run render:mix-demo
```

Render landscape or square:

```bash
npm run render:mix-landscape
npm run render:mix-square
```

Type-check the project:

```bash
npm run typecheck
```

The engine uses `@remotion/three`, React Three Fiber and Three.js for the isometric scene. The first product, storybook and traffic scenes are visual foundations; production assets, advanced camera paths, timed subtitles, procedural sound/music and render QA are the next development phase. See `src/mix-visual-engine/README.md`.
