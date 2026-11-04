# Mix Visual Engine — Gemini Omni Flash video generation

This studio calls the current Gemini Interactions API model `gemini-omni-1.1-flash` to generate a real MP4 from a product reference image and a scene direction.

## Setup

1. Create a Gemini API key with access to Gemini Omni Flash.
2. Add it to `remotion/.env.local` (never commit this file):

```env
GEMINI_API_KEY=your_key_here
# Optional:
GEMINI_VIDEO_MODEL=gemini-omni-1.1-flash
GEMINI_VIDEO_PORT=4180
```

## Run

```bash
cd remotion
npm run video-ai-studio
``

Open http://localhost:4180. Enter the product name, a public HTTPS product image URL and the scene direction. The service saves the generated MP4 under `public/generated-videos/`.

## API contract for the future Shopee adapter

`POST /api/generate-scene` with JSON:

```json
{
  "productName": "Product name",
  "imageUrl": "https://public-image-url/product.jpg",
  "prompt": "Detailed English scene direction..."
}
```

The adapter can send `imageBase64` plus `imageMimeType` instead of `imageUrl`. The response contains `filename`, `file`, `videoUrl` and `model`.

## Important integration notes

- This is a real generation call; Gemini API usage may incur charges.
- Output is portrait 9:16, 720p. Generated clips are short and should be sequenced and finished in Remotion.
- The reference image guides product identity, but generative video can still alter small details. Keep original product photography for any frame where exact packaging, labels or dimensions must be guaranteed.
- Fish Audio narration and the existing Remotion compositions are not modified by this studio.
- The current repository branch does not contain the user's Shopee product lookup implementation. The API contract above is ready for that existing integration to call; do not duplicate the Shopee API until its actual location is identified.
