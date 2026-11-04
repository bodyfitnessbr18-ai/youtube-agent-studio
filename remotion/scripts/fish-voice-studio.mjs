import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, "public", "shaker-assets");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "narration.mp3");
const PORT = Number(process.env.FISH_STUDIO_PORT || 4177);

for (const file of [path.join(ROOT, ".env.local"), path.join(ROOT, ".env")]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?FISH_API_KEY\s*=\s*(.*?)\s*$/);
    if (match && !process.env.FISH_API_KEY) process.env.FISH_API_KEY = match[1].replace(/^["']|["']$/g, "");
  }
}

const voices = [
  ["a7f67c4e2d94440aad9c5a82365d9d92", "Voz 01"],
  ["84c748173dc14017a29c99ff7feb4d32", "Voz 02"],
  ["7ce2f29bf73549d1a4d0bcfd7a72fc19", "Voz 03"],
  ["78b3e1efbbb947f6bf9b0ddc3c9a18b9", "Aposto Paulo"],
  ["e2b7e279f9ee47138bdf0b6d62356e8b", "Contos e História"],
  ["6a88fe5df52d49d3a063241edc9f32b9", "Peter Griffin"],
  ["dfe49f8dc6e145238ca87f97ab89f3a5", "Narrador Calmo"],
  ["39ba7b1ab5d44e5dab4ab09d6a0354ad", "Narrador Dark"],
  ["9318b32b5477496a960e2958dd51c7ea", "Rick Sanchez"],
];

const options = voices.map((v) => '<option value="' + v[0] + '"' + (v[1] === "Narrador Calmo" ? " selected" : "") + '>' + v[1] + '</option>').join("");
const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fish Audio • Estúdio de Voz</title>' +
'<style>*{box-sizing:border-box}body{margin:0;background:#10131b;color:#f5f5f5;font:15px system-ui,sans-serif;padding:28px}main{max-width:820px;margin:auto}.panel{background:#1b202b;border:1px solid #303847;border-radius:16px;padding:22px;margin:16px 0}h1{font-size:27px;margin:0 0 6px}p{color:#aeb8c8;line-height:1.5}label{display:block;font-weight:650;margin:14px 0 7px}select,textarea,input{width:100%;padding:13px;border-radius:10px;border:1px solid #3b4658;background:#111722;color:#fff;font:inherit}textarea{min-height:180px;resize:vertical}button{border:0;border-radius:10px;padding:12px 17px;background:#f47a20;color:#171717;font-weight:750;cursor:pointer;margin:12px 8px 0 0}button.secondary{background:#344155;color:#fff}button:disabled{opacity:.5;cursor:wait}audio{width:100%;margin-top:14px}.status{color:#aeb8c8;white-space:pre-wrap;margin-top:12px}.small{font-size:12px;color:#8f9bad}</style></head><body><main>' +
'<h1>Estúdio de Voz • Fish Audio</h1><p>Escolha uma voz, ouça uma amostra e gere a narração. A chave da API fica somente no servidor.</p>' +
'<section class="panel"><label for="voice">Voz</label><select id="voice">' + options + '</select>' +
'<label for="sample">Texto para testar a voz</label><input id="sample" value="Olá! Esta é uma prévia da minha voz para os vídeos." />' +
'<button class="secondary" id="preview">Ouvir prévia</button><audio id="player" controls></audio></section>' +
'<section class="panel"><label for="text">Texto completo da narração</label><textarea id="text">Sua rotina de treino merece praticidade. Conheça a Shaker Go de 600 ml.&#10;&#10;Com capacidade de 600 ml, ela acompanha você na academia e no dia a dia.&#10;&#10;O visual fumê traz um estilo moderno para sua rotina.&#10;&#10;Conta com tampa e sobrealça para facilitar o transporte.&#10;&#10;Leve sua coqueteleira com você e mantenha sua rotina em movimento.&#10;&#10;Gostou? Confira os detalhes e garanta a sua!</textarea>' +
'<label for="direction">Direção de voz (opcional)</label><input id="direction" value="Português brasileiro natural, locução comercial envolvente, dicção clara, ritmo conversacional e pausas naturais." />' +
'<button id="generate">Gerar narration.mp3</button><div class="status" id="status">Pronto para testar.</div><p class="small">Modelo: S2.1 Pro • Formato: MP3 • Destino: public/shaker-assets/narration.mp3</p></section></main>' +
'<script>const $=id=>document.getElementById(id);async function send(url,payload,button){button.disabled=true;$("status").textContent="Gerando áudio no Fish Audio...";try{const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!res.ok)throw new Error(await res.text());const blob=await res.blob();$("player").src=URL.createObjectURL(blob);$("player").load();$("status").textContent=url.endsWith("generate")?"Narração salva em public/shaker-assets/narration.mp3. Renderize novamente o vídeo.":"Prévia pronta. Clique em reproduzir para ouvir.";}catch(e){$("status").textContent="Erro: "+e.message;}finally{button.disabled=false;}}$("preview").onclick=()=>send("/api/preview",{voiceId:$("voice").value,text:$("sample").value,direction:$("direction").value},$("preview"));$("generate").onclick=()=>send("/api/generate",{voiceId:$("voice").value,text:$("text").value,direction:$("direction").value},$("generate"));</script></body></html>';

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100000) throw new Error("Texto muito grande.");
  }
  return JSON.parse(body || "{}");
}
async function synthesize(payload) {
  if (!process.env.FISH_API_KEY) throw new Error("FISH_API_KEY não encontrada. Configure-a em remotion/.env.local.");
  if (!voices.some((v) => v[0] === payload.voiceId)) throw new Error("Voz não cadastrada.");
  if (typeof payload.text !== "string" || !payload.text.trim() || payload.text.length > 12000) throw new Error("Informe um texto entre 1 e 12.000 caracteres.");
  const direction = typeof payload.direction === "string" ? payload.direction.trim() : "";
  const response = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.FISH_API_KEY, "Content-Type": "application/json", model: "s2.1-pro" },
    body: JSON.stringify({ text: direction ? "[" + direction + "] " + payload.text.trim() : payload.text.trim(), reference_id: payload.voiceId, format: "mp3" }),
  });
  if (!response.ok) throw new Error("Fish Audio (" + response.status + "): " + (await response.text()).slice(0, 700));
  return Buffer.from(await response.arrayBuffer());
}
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(html); return;
    }
    if (req.method === "POST" && (req.url === "/api/preview" || req.url === "/api/generate")) {
      const audio = await synthesize(await readJson(req));
      if (req.url === "/api/generate") {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, audio);
      }
      res.writeHead(200, { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" }); res.end(audio); return;
    }
    res.writeHead(404); res.end("Not found");
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(error instanceof Error ? error.message : "Erro inesperado");
  }
});
server.listen(PORT, "127.0.0.1", () => {
  console.log("Fish Audio Voice Studio: http://localhost:" + PORT);
  if (!process.env.FISH_API_KEY) console.log("Configure FISH_API_KEY em remotion/.env.local antes de gerar áudio.");
});
