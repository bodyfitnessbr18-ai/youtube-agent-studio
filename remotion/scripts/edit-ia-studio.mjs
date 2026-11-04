import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const ASSETS = path.join(PUBLIC, "edit-ia-assets");
const PROJECT = path.join(PUBLIC, "edit-ia-project.json");
const PAGE = path.join(PUBLIC, "edit-ia-studio.html");
const PORT = Number(process.env.EDIT_IA_PORT || 4179);
const MAX_UPLOAD = 250 * 1024 * 1024;
fs.mkdirSync(ASSETS, { recursive: true });

const send = (res, status, body, type = "text/plain; charset=utf-8") => {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
};
const safeName = (value) => path.basename(decodeURIComponent(value || "upload.bin"))
  .replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100) || "upload.bin";

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && (req.url === "/" || req.url === "/edit-ia-studio")) {
      send(res, 200, fs.readFileSync(PAGE), "text/html; charset=utf-8");
      return;
    }
    if (req.method === "POST" && req.url === "/api/upload") {
      const filename = safeName(req.headers["x-file-name"]);
      const ext = path.extname(filename).toLowerCase();
      const allowed = new Set([".mp4", ".mov", ".webm", ".mp3", ".m4a", ".wav"]);
      if (!allowed.has(ext)) return send(res, 415, "Formato não permitido.");
      const declared = Number(req.headers["content-length"] || 0);
      if (declared > MAX_UPLOAD) return send(res, 413, "Arquivo ultrapassa 250 MB.");
      const targetName = Date.now() + "-" + filename;
      const target = path.join(ASSETS, targetName);
      const output = fs.createWriteStream(target, { flags: "wx" });
      let total = 0;
      try {
        for await (const chunk of req) {
          total += chunk.length;
          if (total > MAX_UPLOAD) throw new Error("Arquivo ultrapassa 250 MB.");
          if (!output.write(chunk)) await new Promise((resolve) => output.once("drain", resolve));
        }
        await new Promise((resolve, reject) => output.end((error) => error ? reject(error) : resolve()));
      } catch (error) {
        output.destroy();
        fs.rmSync(target, { force: true });
        throw error;
      }
      if (!total) { fs.rmSync(target, { force: true }); return send(res, 400, "Arquivo vazio."); }
      send(res, 200, JSON.stringify({ ok: true, path: "edit-ia-assets/" + targetName, filename, sizeBytes: total }), "application/json");
      return;
    }
    if (req.method === "POST" && req.url === "/api/project") {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk.toString("utf8");
        if (raw.length > 2 * 1024 * 1024) throw new Error("Projeto muito grande.");
      }
      const project = JSON.parse(raw);
      if (!project.title || !Array.isArray(project.scenes) || project.scenes.length < 1) throw new Error("Informe o título e pelo menos uma cena.");
      const allowedKinds = new Set(["video", "editorial"]);
      for (const scene of project.scenes) {
        if (!allowedKinds.has(scene.kind)) throw new Error("Tipo de cena inválido.");
        if (!Number.isFinite(scene.durationInFrames) || scene.durationInFrames < 1) throw new Error("Duração de cena inválida.");
        if (scene.videoSrc && !scene.videoSrc.startsWith("edit-ia-assets/")) throw new Error("Caminho de vídeo inválido.");
      }
      const clean = {
        title: String(project.title).slice(0, 180),
        brandName: String(project.brandName || "EDIT IA").slice(0, 80),
        accent: /^#[0-9a-f]{6}$/i.test(project.accent) ? project.accent : "#ff842d",
        showCaptions: project.showCaptions !== false,
        musicVolume: Math.max(0, Math.min(1, Number(project.musicVolume) || 0)),
        musicSrc: project.musicSrc && project.musicSrc.startsWith("edit-ia-assets/") ? project.musicSrc : "",
        voiceSrc: "",
        scenes: project.scenes
      };
      fs.writeFileSync(PROJECT, JSON.stringify(clean, null, 2) + "\n");
      send(res, 200, JSON.stringify({ ok: true, path: "public/edit-ia-project.json", message: "Configuração pronta para o Remotion." }), "application/json");
      return;
    }
    send(res, 404, "Not found");
  } catch (error) {
    send(res, 400, error.message || "Falha ao processar a solicitação.");
  }
});
server.listen(PORT, "127.0.0.1", () => console.log("EDIT IA Studio: http://localhost:" + PORT));
