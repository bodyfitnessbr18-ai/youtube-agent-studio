# Mix Visual Engine

Modular scene engine for the existing Remotion workspace. Remotion remains the timeline, composition and final-render orchestrator; the engine adapts Lemo-Opuscar's deterministic, code-rendered visual approach.

## Scene families
- `editorial`: typography-led explainers and educational videos.
- `product`: product showcase scene, ready for real product assets and 3D models.
- `isometric`: Three.js low-poly/isometric scene.
- `storybook`: illustrated storybook landscapes for children's and Bible stories.
- `traffic`: animated road and traffic scene, a starting point for the traffic project.

## Formats
`MIX_FORMATS` defines 9:16, 16:9 and 1:1 dimensions. Register separate Remotion compositions for each format; do not change dimensions inside a running composition.

## Add a scene
Add a new `MixSceneKind`, implement a component in `scenes/`, and register it in `SceneRenderer.tsx`. Keep animation frame-driven with Remotion's `useCurrentFrame` and `interpolate`; do not use timers or wall-clock time.

## Run
From this folder: `npm install`, `npm run dev`, `npm run render:mix-demo`.

3D integration uses `@remotion/three`, React Three Fiber and Three.js. The render environment must support WebGL. Existing compositions are retained; Mix Engine compositions are additive.

## Roadmap
1. Connect scene props from the YouTube Agent Studio API.
2. Replace product placeholder geometry with supplied product images/GLB models.
3. Add word-level subtitle timing and audio ducking.
4. Add reusable 3D traffic, vehicle, city and map scenes.
5. Add character rigs and storybook Bible-scene templates.
6. Add render validation (contact sheets, black-frame check, loudness and caption safe areas).
7. Add queue/worker rendering; keep Vercel API separate from the CPU/GPU render worker.

This is the first integrated foundation, not yet the complete Lemo-Opuscar pipeline. It does not install the Lemo repository wholesale or copy its demo films; its visual grammar and deterministic frame-based approach are being adapted to Remotion.
