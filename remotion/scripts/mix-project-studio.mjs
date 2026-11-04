import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const OUTPUT = path.join(PUBLIC, "mix-project.json");
const PORT = Number(process.env.MIX_STUDIO_PORT || 4178);
const kinds = ["product", "editorial", "storybook", "isometric", "traffic"];

const page = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mix Visual Engine Studio</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:28px;background:#10131b;color:#f6f7fb;font:15px system-ui}main{max-width:1050px;margin:auto}h1{margin:0;font-size:28px}.muted{color:#aab4c4}.panel{background:#1b202b;border:1px solid #303847;border-radius:16px;padding:20px;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}label{display:block;font-weight:650;margin:12px 0 6px}input,textarea,select{width:100%;padding:11px;border:1px solid #3b4658;border-radius:9px;background:#111722;color:#fff;font:inherit}textarea{min-height:74px}button{padding:12px 18px;border:0;border-radius:10px;background:#f47a20;color:#171717;font-weight:800;cursor:pointer;margin:8px 8px 0 0}.scene{border-top:1px solid #333d4d;padding-top:12px;margin-top:12px}.status{white-space:pre-wrap;color:#aab4c4;margin-top:12px}@media(max-width:650px){.grid{grid-template-columns:1fr}body{padding:14px}}
</style></head><body><main><h1>Mix Visual Engine • Studio</h1><p class="muted">Monte o anúncio, organize as cenas e exporte o arquivo de configuração pronto para renderizar no Remotion.</p>
<section class="panel"><h2>Identidade do anúncio</h2><div class="grid">
<div><label>Produto / título</label><input id="title" value="COQUETELEIRA SHAKER GO 600 ML FUMÊ"></div>
<div><label>Marca</label><input id="brand" value="MIX"></div>
<div><label>Cor de destaque</label><input id="accent" type="color" value="#f47a20"></div>
<div><label>Formato</label><select id="format"><option value="vertical">Vertical 9:16</option><option value="square">Quadrado 1:1</option><option value="horizontal">Horizontal 16:9</option></select></div>
<div><label>Trilha (caminho em public/)</label><input id="music" value="shaker-assets/music-bed.mp3"></div>
<div><label>Narração (caminho em public/)</label><input id="voice" value="shaker-assets/narration.mp3"></div>
<div><label>Volume da música (0 a 1)</label><input id="volume" type="number" min="0" max="1" step="0.01" value="0.14"></div>
<div><label>Legendas animadas</label><select id="captions"><option value="true">Ativadas</option><option value="false">Desativadas</option></select></div>
</div></section>
<section class="panel"><h2>Roteiro por cenas</h2><p class="muted">Edite os títulos, textos e narrações. O motor calcula a duração com base na fala.</p><div id="scenes"></div><button id="add">+ Adicionar cena</button></section>
<section class="panel"><h2>Gerar projeto</h2><button id="save">Salvar configuração do anúncio</button><button id="download">Baixar JSON</button><div class="status" id="status">Pronto para montar seu anúncio.</div><p class="muted">O arquivo será salvo em public/mix-project.json. Depois, use o comando de renderização exibido aqui.</p></section>
</main><script>
const $=id=>document.getElementById(id);let scenes=[
{title:"SUA ROTINA. SEU RITMO.",subtitle:"Shaker Go 600 ml Fumê",narration:"Sua rotina de treino merece praticidade. Conheça a Shaker Go de 600 ml.",kind:"product",videoSrc:""},
{title:"600 ML DE CAPACIDADE",subtitle:"Espaço para acompanhar seu treino",narration:"Com capacidade de 600 ml, ela acompanha você na academia e no dia a dia.",kind:"product"},
{title:"VISUAL FUMÊ. ESTILO MARCANTE.",subtitle:"Acabamento preto translúcido",narration:"O visual fumê traz um estilo moderno para sua rotina.",kind:"product"},
{title:"TAMPA E SOBRE ALÇA",subtitle:"Detalhes que fazem a diferença",narration:"Conta com tampa e sobrealça para facilitar o transporte.",kind:"product"},
{title:"LEVE PARA A ACADEMIA",subtitle:"Sua companheira de treino",narration:"Leve sua coqueteleira com você e mantenha sua rotina em movimento.",kind:"product"},
{title:"PRONTA PARA SEU PRÓXIMO TREINO?",subtitle:"Shaker Go 600 ml Fumê",narration:"Gostou? Confira os detalhes e garanta a sua.",kind:"product"}];
function render(){ $("scenes").innerHTML=scenes.map((s,i)=>'<div class="scene"><h3>Cena '+(i+1)+'</h3><div class="grid"><div><label>Tipo</label><select data-i="'+i+'" data-k="kind">'+kinds.map(k=>'<option '+(s.kind===k?'selected':'')+'>'+k+'</option>').join('')+'</select></div><div><label>Título</label><input data-i="'+i+'" data-k="title" value="'+esc(s.title)+'"></div><div><label>Subtítulo</label><input data-i="'+i+'" data-k="subtitle" value="'+esc(s.subtitle)+'"></div><div><label>Narração</label><textarea data-i="'+i+'" data-k="narration">'+esc(s.narration)+'</textarea></div><div><label>Vídeo gerado (caminho dentro de public/)</label><input data-i="'+i+'" data-k="videoSrc" placeholder="generated-videos/arquivo.mp4" value="'+esc(s.videoSrc||"")+'"></div></div><button class="remove" data-i="'+i+'">Remover cena</button></div>').join('');$("scenes").querySelectorAll("[data-k]").forEach(el=>el.oninput=()=>scenes[+el.dataset.i][el.dataset.k]=el.value);$("scenes").querySelectorAll(".remove").forEach(el=>el.onclick=()=>{scenes.splice(+el.dataset.i,1);render();});}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function build(){const [width,height]= $("format").value==="vertical"?[1080,1920]:$("format").value==="square"?[1080,1080]:[1920,1080];return {title:$("title").value,brandName:$("brand").value,accent:$("accent").value,showCaptions:$("captions").value==="true",musicVolume:Number($("volume").value),voiceSrc:$("voice").value?"/"+$("voice").value:"",musicSrc:$("music").value?"/"+$("music").value:"",width,height,fps:30,scenes:scenes.map((s,i)=>({id:"scene-"+(i+1),kind:s.kind,durationInFrames:150,title:s.title,subtitle:s.subtitle,narration:s.narration,videoSrc:s.videoSrc.trim()||undefined}))};}
$("add").onclick=()=>{scenes.push({title:"NOVA CENA",subtitle:"",narration:"",kind:"product"});render();};
$("save").onclick=async()=>{const data=build();$("status").textContent="Salvando projeto...";try{const r=await fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!r.ok)throw new Error(await r.text());$("status").textContent="Projeto salvo!\nArquivo: public/mix-project.json\nRenderize com o comando:\nnpx remotion render src/index.ts MixEngineVertical out/anuncio.mp4 --props-file=public/mix-project.json --gl=swangle";}catch(e){$("status").textContent="Erro: "+e.message;}};
$("download").onclick=()=>{const blob=new Blob([JSON.stringify(build(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mix-project.json";a.click();URL.revokeObjectURL(a.href);};
render();
</script></body></html>`;

const server=http.createServer(async(req,res)=>{
  if(req.method==="GET"&&req.url==="/"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(page);return;}
  if(req.method==="POST"&&req.url==="/api/save"){
    try{let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>300000)throw new Error("Projeto muito grande.");}
      const data=JSON.parse(raw);if(!data.title||!Array.isArray(data.scenes)||data.scenes.length<1)throw new Error("Informe o título e pelo menos uma cena.");
      const clean={title:data.title,brandName:data.brandName,accent:data.accent,showCaptions:data.showCaptions,musicVolume:data.musicVolume,voiceSrc:data.voiceSrc,musicSrc:data.musicSrc,scenes:data.scenes};
      fs.writeFileSync(OUTPUT,JSON.stringify(clean,null,2)+"\n");res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:true}));
    }catch(e){res.writeHead(400,{"Content-Type":"text/plain"});res.end(e.message);}return;
  }
  res.writeHead(404);res.end("Not found");
});
server.listen(PORT,"127.0.0.1",()=>console.log("Mix Project Studio: http://localhost:"+PORT));
