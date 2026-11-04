import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, "public", "generated-videos");
const PORT = Number(process.env.GEMINI_VIDEO_PORT || 4180);
const MODEL = process.env.GEMINI_VIDEO_MODEL || "gemini-omni-1.1-flash";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

function loadEnv() {
  for (const filename of [".env.local", ".env"]) {
    const full = path.join(ROOT, filename);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?(GEMINI_API_KEY|GEMINI_VIDEO_MODEL|GEMINI_VIDEO_PORT)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mix • Gerador de vídeo IA</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0d1119;color:#f5f7fb;font:15px system-ui;padding:28px}main{max-width:760px;margin:auto}.panel{background:#171e2a;border:1px solid #303b4c;border-radius:16px;padding:22px;margin:16px 0}h1{margin:0 0 8px;font-size:28px}p{color:#aeb9ca;line-height:1.55}label{display:block;margin:15px 0 7px;font-weight:650}input,textarea{width:100%;padding:13px;border-radius:9px;border:1px solid #39465a;background:#0e1520;color:#fff;font:inherit}textarea{min-height:120px}button{margin-top:16px;padding:13px 18px;border:0;border-radius:10px;background:#f47a20;color:#171717;font-weight:800;cursor:pointer}button:disabled{opacity:.55}.status{white-space:pre-wrap;color:#b7c4d8;margin-top:14px}video{width:100%;margin-top:14px;border-radius:12px;background:#000}.hint{font-size:12px;color:#8c9bb0}
</style></head><body><main><h1>Mix Visual Engine • Vídeo generativo</h1>
<p>Teste real do Gemini Omni Flash: transforma uma imagem de referência do produto em um clipe vertical com movimento cinematográfico.</p>
<section class="panel"><label for="product">Nome do produto</label><input id="product" placeholder="Ex.: Coqueteleira Shaker Go 600 ml fumê">
<label for="image">URL pública da imagem do produto</label><input id="image" type="url" placeholder="https://...">
<label for="scene">Direção da cena</label><textarea id="scene">Commercial footage, photorealistic. A fit adult athlete picks up the exact product and uses it naturally in a modern gym. Smooth camera push-in, subtle handheld movement, realistic lighting, premium product advertising. Preserve the product's shape, color, lid, proportions and visible details from the reference image. Do not invent logos, text or product features. No subtitles or on-screen text.</textarea>
<button id="generate">Gerar clipe com IA</button><div class="status" id="status">Aguardando. A geração usa créditos pagos da API Gemini.</div><video id="preview" controls playsinline></video><p class="hint">Este é um teste de geração de vídeo. O fluxo automático com link Shopee será conectado ao adaptador de produto depois que localizarmos a integração Shopee existente.</p></section></main>
<script>
const $=id=>document.getElementById(id);
$("generate").onclick=async()=>{const b=$("generate");b.disabled=true;$("status").textContent="Enviando imagem e prompt ao Gemini Omni Flash. A geração pode levar alguns minutos...";$("preview").removeAttribute("src");
try{const r=await fetch("/api/generate-scene",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productName:$("product").value,imageUrl:$("image").value,prompt:$("scene").value})});if(!r.ok)throw new Error(await r.text());const data=await r.json();$("preview").src=data.videoUrl;$("preview").load();$("status").textContent="Clipe gerado e salvo em: "+data.file+"\nModelo: "+data.model;}catch(e){$("status").textContent="Falha: "+e.message;}finally{b.disabled=false;}};
</script></body></html>`;

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2_000_000) throw new Error("Requisição muito grande.");
  }
  return JSON.parse(body || "{}");
}

function imageMime(buffer, declared) {
  if (declared && /^image\/(png|jpeg|webp)$/.test(declared)) return declared;
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "image/webp";
  throw new Error("Imagem inválida. Use PNG, JPEG ou WebP.");
}

async function getReferenceImage(payload) {
  if (typeof payload.imageBase64 === "string" && payload.imageBase64.length) {
    const raw = payload.imageBase64.replace(/^data:image\/(?:png|jpeg|webp);base64,/, "");
    const buffer = Buffer.from(raw, "base64");
    if (buffer.length > 12 * 1024 * 1024) throw new Error("Imagem acima de 12 MB.");
    return { buffer, mime: imageMime(buffer, payload.imageMimeType) };
  }
  if (typeof payload.imageUrl !== "string" || !payload.imageUrl.trim()) throw new Error("Informe imageUrl ou imageBase64.");
  const url = new URL(payload.imageUrl);
  if (url.protocol !== "https:") throw new Error("A imagem precisa usar HTTPS.");
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new Error("Host local não permitido.");
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error("Não foi possível baixar a imagem (" + response.status + ").");
  const declared = (response.headers.get("content-type") || "").split(";")[0].trim();
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 12 * 1024 * 1024) throw new Error("Imagem acima de 12 MB.");
  return { buffer, mime: imageMime(buffer, declared) };
}

async function generateClip(payload) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente. Adicione a chave em remotion/.env.local.");
  const productName = String(payload.productName || "produto").slice(0, 180);
  const prompt = String(payload.prompt || "").trim();
  if (!prompt || prompt.length > 5000) throw new Error("Informe uma direção de cena (até 5.000 caracteres).");
  const { buffer, mime } = await getReferenceImage(payload);
  const input = [
    { type: "image", data: buffer.toString("base64"), mime_type: mime },
    { type: "text", text: "Create a polished, photorealistic product advertisement video. Product: " + productName + ". Use the reference image to preserve the product identity. " + prompt }
  ];
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      input,
      generation_config: { video_config: { task: "image_to_video" } },
      response_format: [{ type: "video", aspect_ratio: "9:16", resolution: "720p", duration: "5s" }]
    }),
    signal: AbortSignal.timeout(12 * 60 * 1000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Gemini API (" + response.status + "): " + JSON.stringify(data).slice(0, 1200));
  const stepVideo = data.steps?.flatMap((step) => step.content || []).find((part) => part.type === "video" && part.data);
  const videoBase64 = data.output_video?.data || stepVideo?.data;
  if (!videoBase64) throw new Error("A API respondeu, mas não retornou vídeo. Resposta: " + JSON.stringify(data).slice(0, 1200));
  const video = Buffer.from(videoBase64, "base64");
  if (video.length < 1000) throw new Error("O arquivo de vídeo retornado parece inválido.");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = "mix-ai-" + randomUUID() + ".mp4";
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), video);
  return { filename, bytes: video.length, model: MODEL };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(html); return;
    }
    if (req.method === "GET" && req.url.startsWith("/generated-videos/")) {
      const name = path.basename(decodeURIComponent(req.url.split("?")[0].slice("/generated-videos/".length)));
      if (!name.endsWith(".mp4")) { res.writeHead(404); res.end("Not found"); return; }
      const full = path.join(OUTPUT_DIR, name);
      if (!fs.existsSync(full)) { res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": fs.statSync(full).size }); fs.createReadStream(full).pipe(res); return;
    }
    if (req.method === "POST" && req.url === "/api/generate-scene") {
      const result = await generateClip(await readJson(req));
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ ...result, file: "public/generated-videos/" + result.filename, videoUrl: "/generated-videos/" + result.filename })); return;
    }
    res.writeHead(404); res.end("Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    console.error("[Mix AI Video Studio]", message);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    res.end(message);
  }
});
server.listen(PORT, "127.0.0.1", () => {
  console.log("Mix AI Video Studio: http://localhost:" + PORT);
  console.log("Model: " + MODEL);
  if (!process.env.GEMINI_API_KEY) console.log("Configure GEMINI_API_KEY em remotion/.env.local.");
});
