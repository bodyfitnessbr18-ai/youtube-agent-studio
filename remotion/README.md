# Remotion renderer — YouTube Agent Studio

The rendering workspace includes reusable video compositions for YouTube, sleep videos, biblical reflections and the Mix Visual Engine.

## Run locally
Requirements: Node.js 20+.

```bash
cd remotion
npm install
npm run dev
```

## Existing renderers
- YouTubeVideo: 1920x1080 at 30 fps.
- SleepVideo: long-form ambient videos.
- ReflexaoBiblica: 1080x1920 vertical biblical reflection videos.
- MixEngineVertical, MixEngineLandscape and MixEngineSquare: modular visual scene engine.

## Mix Visual Engine
The modular engine under `src/mix-visual-engine/` provides editorial, product, isometric, storybook, traffic and video-clip scene families.

Render the existing Mix demo:

```bash
npm run render:mix-demo
npm run render:mix-landscape
npm run render:mix-square
```

## EDIT IA Studio

The EDIT IA Studio is the first editing workspace integrated with the Mix Visual Engine. It supports multi-clip uploads, scene ordering, clip start/duration, titles, subtitles, narration text, music, project JSON export and Remotion rendering.

Start the local editor:

```bash
npm run edit-ia-studio
```

Open forwarded port **4179** in GitHub Codespaces.

Save a project in the panel, then render the chosen format:

```bash
npm run render:edit-ia -- --composition=EditIAVertical
```

Use `EditIALandscape` or `EditIASquare` for the other formats. Output: `out/edit-ia.mp4`.

See [EDIT-IA-STUDIO.md](./EDIT-IA-STUDIO.md) for setup, architecture, current limits and roadmap.

## Type checking

```bash
npm run typecheck
```

The EDIT IA upload server is intended for a private local Codespace. Do not expose it publicly without authentication. The Vercel serverless app is not the Remotion rendering worker.

Do not put API keys in this repository.
