# Mix Visual Engine — Wan 2.2 via Hugging Face Spaces

The video studio uses the Wan 2.2 image-to-video pipeline hosted on a public Hugging Face Space. It sends the product reference image and motion prompt through the Gradio client, waits for the shared GPU queue, downloads the generated MP4 and saves it under `public/generated-videos/`.

## Setup

Install the Node dependencies from the `remotion` folder:

```bash
npm install
```

Optional: create `remotion/.env.local` and add a Hugging Face token if the Space requires authenticated access:

```env
HF_TOKEN=hf_your_token_here
# Optional:
WAN_SPACE_ID=r3gm/wan2-2-fp8da-aoti-preview2
GEMINI_VIDEO_PORT=4180
```

A public Space may work without a token. Never commit `.env.local` or expose a token in browser code.

## Run

```bash
npm run video-ai-studio
```

Open http://localhost:4180. Enter the product name, a public HTTPS product image URL and the scene direction. The service saves the generated MP4 under `public/generated-videos/`.

## API contract for the Shopee adapter

`POST /api/generate-scene` with JSON:

```json
{
  "productName": "Product name",
  "imageUrl": "https://public-image-url/product.jpg",
  "prompt": "Detailed scene direction..."
}
```

The adapter can send `imageBase64` plus `imageMimeType` instead of `imageUrl`. The response contains `filename`, `file`, `videoUrl` and `model`.

## Limits and production notes

- The default Space is `r3gm/wan2-2-fp8da-aoti-preview2`, a community-hosted Wan 2.2 image-to-video Space running on shared ZeroGPU capacity.
- Shared free GPU access is best-effort: queue delays, rate limits, cold starts, capacity limits or Space downtime can occur. This is not a guaranteed free production API or a fixed monthly credit entitlement.
- If the public Space changes its API, becomes unavailable, or disallows automated access, configure another compatible Space with `WAN_SPACE_ID`.
- Generated videos may change product details. Preserve original product photography for frames where exact packaging, labels or dimensions must be guaranteed.
- Fish Audio narration and existing Remotion compositions are not modified by this studio.
- The Shopee product lookup is not yet wired into this test studio; its adapter can call the API contract above once the existing integration is located.
