import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { Client, handle_file } from "@gradio/client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const VIDEO_DIR = path.join(PUBLIC, "generated-videos");
const AUDIO_DIR = path.join(PUBLIC, "generated-audio");
const PROJECT_DIR = path.join(PUBLIC, "generated-projects");
const PORT = Number(process.env.PRODUCTION_STUDIO_PORT || 4181);
const SPACE_ID = process.env.WAN_SPACE_ID || "r3gm/wan2-2-fp8da-aoti-preview2";
const SPACE_URL = "https://r3gm-wan2-2-fp8da-aoti-preview2.hf.space";
const FISH_VOICE = process.env.FISH_VOICE_ID || "dfe49f8dc6e145238ca87f97ab89f3a5";
const FISH_DIRECTION = "Português brasileiro natural, locução comercial envolvente, dicção clara, ritmo conversacional e pausas naturais.";

function loadEnv() {
  for (const filename of [".env.local", ".env"]) {
    const full = path.join(ROOT, filename);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mix • Central de Produção IA</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0c111b;color:#f5f7fb;font:15px system-ui;padding:24px}main{max-width:860px;margin:auto}.panel{background:#151e2b;border:1px solid #2d3a4d;border-radius:18px;padding:22px;margin:16px 0}h1{font-size:30px;margin:0}p{color:#aab8cb;line-height:1.55}.brand{color:#f47a20;font-weight:800;letter-spacing:.14em;font-size:12px;margin-bottom:8px}label{display:block;margin:15px 0 7px;font-weight:700}input,textarea,select{width:100%;padding:13px;border-radius:10px;border:1px solid #39485d;background:#0c1420;color:#fff;font:inherit}textarea{min-height:110px}button{padding:14px 20px;border:0;border-radius:11px;background:#f47a20;color:#151515;font-weight:850;cursor:pointer;margin-top:16px}button:disabled{opacity:.55;cursor:wait}.status{white-space:pre-wrap;color:#c0ccdc;margin-top:14px;line-height:1.6}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.step{background:#0e1724;border:1px solid #29384c;border-radius:10px;padding:10px;font-size:12px;color:#b8c5d7}.step b{display:block;color:#fff;margin-bottom:4px}img,video{width:100%;border-radius:12px;margin-top:12px;background:#000}.muted{font-size:12px;color:#8494aa}@media(max-width:650px){body{padding:12px}.steps{grid-template-columns:repeat(2,1fr)}}
</style></head><body><main><div class="brand">MIX VISUAL ENGINE • AI STUDIO</div><h1>Central de Produção de Vídeos</h1>
<p>Cole o link de afiliado da Shopee. A central importa o produto do Mix da Pri, cria a cena com Wan 2.2, gera a narração com Fish Audio e monta o MP4 no Remotion.</p>
<div class="steps"><div class="step"><b>01 • Produto</b>Importação Mix da Pri</div><div class="step"><b>02 • Cena IA</b>Wan 2.2</div><div class="step"><b>03 • Voz</b>Fish Audio</div><div class="step"><b>04 • Vídeo</b>Remotion</div></div>
<section class="panel"><label for="url">Link do produto Shopee</label><input id="url" type="url" placeholder="https://s.shopee.com.br/...">
<label for="angle">Estilo do anúncio</label><select id="angle"><option value="gym">Demonstração em academia / uso real</option><option value="studio">Comercial premium em estúdio</option><option value="lifestyle">Lifestyle / uso no dia a dia</option></select>
<label for="narration">Narração (opcional — deixe em branco para gerar automaticamente)</label><textarea id="narration" placeholder="A central cria uma narração com base nos dados importados do produto."></textarea>
<button id="generate">GERAR MEU VÍDEO</button><div class="status" id="status">Aguardando o link do produto. A GPU do Hugging Face é compartilhada e pode ter fila.</div>
<div id="product"></div><video id="preview" controls playsinline></video><p class="muted">As credenciais permanecem no servidor. O link de afiliado importado é mantido nos dados do projeto.</p></section></main>
<script>
const $=id=>document.getElementById(id);
$("generate").onclick=async()=>{const b=$("generate");b.disabled=true;$("preview").removeAttribute("src");$("product").innerHTML="";$("status").textContent="Iniciando importação do produto...";try{const r=await fetch("/api/create-video",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:$("url").value,narration:$("narration").value,angle:$("angle").value})});const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{throw new Error(raw)}if(!r.ok)throw new Error(data.error||"Falha na produção");$("product").innerHTML='<h3>'+escapeHtml(data.product.title||"Produto importado")+'</h3><p>'+escapeHtml(data.product.price?("Preço: R$ "+data.product.price):"")+'</p>'+(data.product.image_url?'<img src="'+escapeAttr(data.product.image_url)+'" alt="Produto">':"")+(data.product.link?'<p><a style="color:#f6a15d" href="'+escapeAttr(data.product.link)+'" target="_blank" rel="noreferrer">Abrir link de afiliado</a></p>':"");$("preview").src=data.videoUrl;$("preview").load();$("status").textContent="Vídeo finalizado!\\nArquivo: "+data.file+"\nDuração: "+data.durationSeconds+" segundos";}catch(e){$("status").textContent="Não foi possível concluir: "+e.message;}finally{b.disabled=false;}};
function escapeHtml(s){return String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function escapeAttr(s){return escapeHtml(s).replace(/'/g,"&#39;");}
</script></body></html>`;

async function readJson(req) {
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > 100000) throw new Error("Requisição muito grande."); }
  return JSON.parse(body || "{}");
}
function safeText(value, max=5000) { return typeof value === "string" ? value.trim().slice(0,max) : ""; }
function assertHttpsImage(value) {
  const u = new URL(value);
  if (u.protocol !== "https:" || ["localhost","127.0.0.1","::1"].includes(u.hostname)) throw new Error("A imagem do produto precisa ter URL HTTPS pública.");
  return u;
}
async function importProduct(url) {
  const endpoint = process.env.MIXDPRI_IMPORT_ENDPOINT;
  const token = process.env.MIXDPRI_IMPORT_TOKEN;
  if (!endpoint || !token) throw new Error("Configure MIXDPRI_IMPORT_ENDPOINT e MIXDPRI_IMPORT_TOKEN no remotion/.env.local. Falta habilitar o endpoint seguro no Mix da Pri.");
  const response = await fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+token}, body:JSON.stringify({url}), signal:AbortSignal.timeout(45000) });
  const payload = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(payload.error || "Mix da Pri respondeu HTTP "+response.status);
  if (!payload.title || !payload.image_url) throw new Error((payload.warnings||[]).join(" ") || "O Mix da Pri não retornou título e imagem do produto.");
  return payload;
}
async function downloadImage(imageUrl) {
  const u=assertHttpsImage(imageUrl);
  const r=await fetch(u,{signal:AbortSignal.timeout(30000)});
  if(!r.ok) throw new Error("Não foi possível baixar a imagem do produto ("+r.status+").");
  const mime=(r.headers.get("content-type")||"").split(";")[0];
  if(!/^image\/(png|jpeg|webp)$/.test(mime)) throw new Error("A Shopee não retornou uma imagem PNG, JPEG ou WebP.");
  const b=Buffer.from(await r.arrayBuffer());
  if(b.length>12*1024*1024) throw new Error("Imagem do produto acima de 12 MB.");
  const ext=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
  fs.mkdirSync(VIDEO_DIR,{recursive:true});
  const file=path.join(VIDEO_DIR,".product-"+randomUUID()+"."+ext);
  fs.writeFileSync(file,b);
  return file;
}
async function makeWanClip(product,prompt) {
  const input=await downloadImage(product.image_url);
  let client;
  try {
    client=await Client.connect(SPACE_ID,process.env.HF_TOKEN?{hf_token:process.env.HF_TOKEN}:{});
    const fullPrompt="Photorealistic short product commercial for "+(product.title||"this product")+". "+prompt+" Preserve the exact product identity, shape, color, packaging, proportions, labels and visible details from the reference image. Do not invent product features, text or logos.";
    const result=await client.predict("/generate_video",[
      handle_file(input),null,fullPrompt,6,
      "low quality, flicker, jitter, distorted product, extra objects, text, watermark",
      6.0,1,1,42,true,6,"UniPCMultistep",6,32,"4x-UltraSharp",1,true,true,true
    ]);
    const output=result?.data?.[0]||result?.data?.[1];
    const src=typeof output==="string"?output:output?.url;
    if(!src) throw new Error("Wan 2.2 não retornou o vídeo esperado.");
    const remote=src.startsWith("http")?src:new URL(src,SPACE_URL).toString();
    const response=await fetch(remote,{signal:AbortSignal.timeout(180000)});
    if(!response.ok) throw new Error("Falha ao baixar vídeo Wan ("+response.status+").");
    const bytes=Buffer.from(await response.arrayBuffer());
    if(bytes.length<1000) throw new Error("O vídeo gerado está vazio ou inválido.");
    const filename="wan-"+randomUUID()+".mp4";
    fs.writeFileSync(path.join(VIDEO_DIR,filename),bytes);
    return filename;
  } finally {
    try{fs.unlinkSync(input);}catch{}
    try{await client?.close?.();}catch{}
  }
}
async function makeFishAudio(text) {
  if(!process.env.FISH_API_KEY) throw new Error("Configure FISH_API_KEY em remotion/.env.local.");
  const response=await fetch("https://api.fish.audio/v1/tts",{method:"POST",headers:{Authorization:"Bearer "+process.env.FISH_API_KEY,"Content-Type":"application/json",model:"s2.1-pro"},body:JSON.stringify({text:"["+FISH_DIRECTION+"] "+text,reference_id:FISH_VOICE,format:"mp3"}),signal:AbortSignal.timeout(90000)});
  if(!response.ok) throw new Error("Fish Audio ("+response.status+"): "+(await response.text()).slice(0,500));
  const audio=Buffer.from(await response.arrayBuffer());
  if(audio.length<1000) throw new Error("Fish Audio retornou um áudio inválido.");
  const filename="voice-"+randomUUID()+".mp3";
  fs.mkdirSync(AUDIO_DIR,{recursive:true});
  fs.writeFileSync(path.join(AUDIO_DIR,filename),audio);
  return filename;
}
function narrationFor(product) {
  const title=product.title||"este produto";
  const price=product.price?(" E você encontra por "+Number(product.price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+"."):"";
  return "Olha só essa novidade: "+title+". Um produto para trazer mais praticidade para o seu dia a dia."+price+" Confira os detalhes e aproveite o link na descrição.";
}
function runRender(propsFile,outputFile) {
  return new Promise((resolve,reject)=>{
    const bin=process.platform==="win32"?"npx.cmd":"npx";
    const args=["remotion","render","src/index.ts","MixEngineVertical",outputFile,"--props-file="+propsFile,"--codec","h264","--gl","swangle"];
    const child=spawn(bin,args,{cwd:ROOT,stdio:"inherit",shell:process.platform==="win32"});
    child.on("error",reject);
    child.on("close",code=>code===0?resolve():reject(new Error("Remotion terminou com código "+code)));
  });
}
async function createVideo(payload) {
  const url=safeText(payload.url,2000);
  if(!/^https?:\/\//i.test(url)) throw new Error("Cole um link válido da Shopee.");
  const product=await importProduct(url);
  const angles={
    gym:"A premium athletic lifestyle commercial in a modern gym, subtle camera push-in, realistic human interaction only if natural, dramatic but believable lighting.",
    studio:"Premium studio product advertising, elegant controlled camera orbit, soft commercial lighting, clean background, crisp product detail.",
    lifestyle:"Warm everyday lifestyle commercial, natural daylight, tasteful home setting, gentle camera movement, realistic premium advertising."
  };
  const clip=await makeWanClip(product,angles[payload.angle]||angles.gym);
  const narration=safeText(payload.narration,12000)||narrationFor(product);
  const audio=await makeFishAudio(narration);
  const projectId=randomUUID();
  const scenes=[{id:"product-main",kind:"product",durationInFrames:240,title:product.title||"Conheça este produto",subtitle:product.price?"Confira por R$ "+Number(product.price).toFixed(2).replace(".",","):"Confira os detalhes",narration,videoSrc:"generated-videos/"+clip}];
  const props={title:product.title||"Anúncio",brandName:"MIX DA PRI",accent:"#f47a20",showCaptions:true,musicVolume:0,voiceSrc:"/generated-audio/"+audio,musicSrc:"",scenes};
  fs.mkdirSync(PROJECT_DIR,{recursive:true});
  const propsFile=path.join(PROJECT_DIR,projectId+".json");
  fs.writeFileSync(propsFile,JSON.stringify(props,null,2));
  const finalName="anuncio-"+projectId+".mp4";
  const finalPath=path.join(VIDEO_DIR,finalName);
  await runRender(path.relative(ROOT,propsFile),path.relative(ROOT,finalPath));
  fs.writeFileSync(path.join(PROJECT_DIR,projectId+".product.json"),JSON.stringify(product,null,2));
  return {product,file:"public/generated-videos/"+finalName,videoUrl:"/generated-videos/"+finalName,durationSeconds:8};
}
const server=http.createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(html);return;}
    if(req.method==="GET"&&req.url.startsWith("/generated-videos/")){const name=path.basename(decodeURIComponent(req.url.split("?")[0].slice(17)));if(!name.endsWith(".mp4")){res.writeHead(404);res.end("Not found");return;}const file=path.join(VIDEO_DIR,name);if(!fs.existsSync(file)){res.writeHead(404);res.end("Not found");return;}res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":fs.statSync(file).size});fs.createReadStream(file).pipe(res);return;}
    if(req.method==="POST"&&req.url==="/api/create-video"){const result=await createVideo(await readJson(req));res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify(result));return;}
    res.writeHead(404);res.end("Not found");
  }catch(error){const message=error instanceof Error?error.message:String(error);console.error("[Mix Production Studio]",error?.stack||error);res.writeHead(500,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify({error:message}));}
});
server.listen(PORT,"127.0.0.1",()=>{console.log("Mix Central de Produção: http://localhost:"+PORT);console.log("Wan Space: "+SPACE_ID);});
