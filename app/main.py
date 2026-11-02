import json
import logging
import os
import re
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import httpx

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

logger = logging.getLogger("youtube_agent_studio")
BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="YouTube Agent Studio", version="0.1.2")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

AGENTS = [
    {"id": "script", "name": "Roteirista", "status": "active", "description": "Cria hooks, roteiro falado e cenas."},
    {"id": "package", "name": "Título & Thumbnail", "status": "planned", "description": "Avalia título e conceito visual em conjunto."},
    {"id": "viral", "name": "Tendências", "status": "planned", "description": "Pesquisa formatos e vídeos relevantes do nicho."},
    {"id": "retention", "name": "Retenção", "status": "planned", "description": "Analisa exportações de retenção e quedas."},
    {"id": "edit", "name": "Edição", "status": "planned", "description": "Gera lista de cortes a partir de transcrição."},
    {"id": "shorts", "name": "Shorts", "status": "planned", "description": "Encontra trechos verticais em vídeos longos."},
    {"id": "seo", "name": "SEO", "status": "planned", "description": "Sugere descrição, palavras-chave e consultas."},
    {"id": "plan", "name": "Planejamento", "status": "planned", "description": "Organiza calendário editorial."},
    {"id": "comment", "name": "Comentários", "status": "planned", "description": "Classifica comentários e prepara respostas."},
    {"id": "chapters", "name": "Capítulos", "status": "planned", "description": "Cria capítulos com timestamps."},
    {"id": "audit", "name": "Auditoria", "status": "planned", "description": "Analisa o canal e prioriza uma melhoria."},
]

class ScriptRequest(BaseModel):
    topic: str = Field(min_length=5, max_length=500)
    audience: str = Field(default="Público geral", max_length=300)
    format: str = Field(default="YouTube Shorts", max_length=100)
    duration_seconds: int = Field(default=40, ge=15, le=3600)
    tone: str = Field(default="Direto, envolvente e natural", max_length=300)
    goal: str = Field(default="Ensinar algo útil e manter a atenção", max_length=500)
    voice_profile: str = Field(default="", max_length=4000)
    facts_sources: str = Field(default="", max_length=4000)

def word_count(text: str) -> int:
    return len(re.findall(r"\b[\wÀ-ÿ'-]+\b", text, flags=re.UNICODE))

def score_hook(text: str) -> dict:
    words = re.findall(r"\b[\wÀ-ÿ'-]+\b", text.lower(), flags=re.UNICODE)
    n = len(words)
    lower = text.lower()
    specific = 45 + 20 * bool(re.search(r"\d", text)) + 12 * bool(re.search(r"\b(hoje|ontem|amanhã|reais|por cento|minutos|anos)\b", lower))
    address = 35 + 25 * bool(re.search(r"\b(você|seu|sua|vocês)\b", lower))
    stakes = 30 + 18 * bool(re.search(r"\b(perder|ganhar|evitar|erro|custa|risco|pare|nunca)\b", lower))
    curiosity = 35 + 20 * bool(re.search(r"\b(por quê|como|segredo|ninguém|mas|até)\b", lower))
    brevity = 100 if 8 <= n <= 24 else max(25, 100 - abs(n - 16) * 5)
    values = [min(100, x) for x in (specific, address, stakes, curiosity, brevity)]
    score = round(.6 * sum(values) / 5 + .4 * min(values))
    return {"score": score, "band": "forte" if score >= 72 else "promissor" if score >= 55 else "revisar",
            "criteria": {"especificidade": min(100, specific), "fala_com_o_publico": min(100, address),
                         "consequência": min(100, stakes), "curiosidade": min(100, curiosity), "concisão": brevity},
            "note": "Pontuação heurística para comparar opções; não prevê viralização."}

def fallback_script(req: ScriptRequest) -> dict:
    hooks = [
        f"Você já percebeu como {req.topic.lower()} pode mudar o resultado?",
        f"O erro que muita gente comete quando o assunto é {req.topic.lower()}.",
        f"Como lidar com {req.topic.lower()} sem complicar sua vida?",
        f"Antes de continuar fazendo isso, entenda {req.topic.lower()}.",
        f"Existe um detalhe sobre {req.topic.lower()} que merece sua atenção."
    ]
    body = [
        {"time": "00:00–00:08", "voice": hooks[0], "visual": "Comece com um close e uma pergunta na tela."},
        {"time": "00:08–00:20", "voice": f"Vamos direto ao ponto: {req.goal}. Primeiro, entenda o que realmente está acontecendo.", "visual": "Mostre o problema em uma situação cotidiana."},
        {"time": "00:20–00:32", "voice": "Agora veja o detalhe que faz diferença: não basta conhecer a ideia; é preciso saber como aplicá-la.", "visual": "Demonstre uma ação ou exemplo concreto."},
        {"time": f"00:32–{req.duration_seconds:02d}", "voice": "Guarde esta mensagem e coloque em prática. Qual parte mais chamou sua atenção?", "visual": "Feche com uma pergunta simples para comentários."}
    ]
    return {"title_ideas": [req.topic, f"O que você precisa saber sobre {req.topic}", f"Entenda {req.topic} de uma vez por todas"],
            "hooks": [{"text": h, **score_hook(h)} for h in hooks], "winning_formula": "Pergunta + consequência",
            "script": body, "estimated_words": sum(word_count(x["voice"]) for x in body),
            "estimated_runtime_seconds": req.duration_seconds, "description": f"Neste vídeo, você vai entender: {req.topic}.",
            "hashtags": ["#YouTube", "#Conteudo", "#Aprendizado"],
            "safety_notes": ["Confirme números, datas e afirmações antes de gravar.", "A pontuação do hook é uma heurística, não uma garantia de desempenho."]}

def build_script_prompt(req: ScriptRequest) -> tuple[str, dict]:
    system = """Você é um roteirista profissional de YouTube em português brasileiro.
Crie conteúdo original, falável, específico e adequado à duração solicitada.
Não invente estatísticas, fontes, resultados, citações ou experiências. Se faltarem dados, sinalize a lacuna.
Entregue somente JSON válido com: title_ideas (3 strings), hooks (5 objetos com text),
winning_formula, script (lista com time, voice, visual), estimated_words,
estimated_runtime_seconds, description, hashtags e safety_notes.
Os hooks devem ser distintos, abrir curiosidade e indicar benefício. O roteiro deve ter começo,
desenvolvimento e conclusão, com fala e indicação visual em cada bloco.
Para vídeos curtos, use cenas objetivas, ritmo forte e uma CTA natural."""
    user = {"tema": req.topic, "público": req.audience, "formato": req.format,
            "duração_segundos": req.duration_seconds, "tom": req.tone, "objetivo": req.goal,
            "perfil_de_voz": req.voice_profile or "Use português brasileiro natural e narração masculina.",
            "fatos_e_fontes": req.facts_sources or "Nenhum. Não invente dados."}
    return system, user


def parse_generated_script(raw: str, req: ScriptRequest) -> dict:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if not match:
            raise ValueError("A IA não retornou um JSON válido.")
        data = json.loads(match.group(0))
    required = ("title_ideas", "hooks", "script")
    if not all(isinstance(data.get(key), list) for key in required):
        raise ValueError("A resposta da IA veio incompleta. Tente gerar novamente.")
    for hook in data.get("hooks", []):
        if isinstance(hook, dict):
            hook.update(score_hook(hook.get("text", "")))
    data["estimated_words"] = data.get("estimated_words") or sum(
        word_count(x.get("voice", "")) for x in data.get("script", []) if isinstance(x, dict))
    data["estimated_runtime_seconds"] = req.duration_seconds
    data.setdefault("description", f"Neste vídeo, você vai entender: {req.topic}.")
    data.setdefault("hashtags", ["#YouTube", "#Shorts"])
    data.setdefault("safety_notes", ["Revise informações factuais antes de publicar."])
    return data


def generate_with_gemini(req: ScriptRequest) -> dict:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY não configurada.")
    system, user = build_script_prompt(req)
    primary = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip().removeprefix("models/")
    if not primary or "gemini-2.5-flash" in primary or "gemini-2.0-flash" in primary:
        primary = "gemini-3.8-flash"
    # Modelo secundário estável para indisponibilidade/capacidade do principal.
    fallback = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.6-flash").strip().removeprefix("models/")
    models = [primary] + ([fallback] if fallback and fallback != primary else [])
    request_payload = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": json.dumps(user, ensure_ascii=False)}]}],
        "generationConfig": {"responseMimeType": "application/json", "maxOutputTokens": 8192}
    }
    last_error = None
    for model_index, model in enumerate(models):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        attempts = 1
        for attempt in range(attempts):
            try:
                response = httpx.post(
                    url,
                    headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                    json=request_payload,
                    timeout=httpx.Timeout(18.0, connect=8.0)
                )
                if response.status_code in (429, 500, 502, 503, 504):
                    try:
                        api_message = response.json().get("error", {}).get("message", "")
                    except Exception:
                        api_message = ""
                    last_error = f"HTTP {response.status_code}: {api_message[:220]}"
                    logger.warning("Gemini model=%s returned HTTP %s (attempt %s/%s)",
                                   model, response.status_code, attempt + 1, attempts)
                    if attempt + 1 < attempts:
                        time.sleep(2)
                        continue
                    break
                if response.status_code >= 400:
                    try:
                        api_message = response.json().get("error", {}).get("message", "")
                    except Exception:
                        api_message = ""
                    if response.status_code in (401, 403):
                        raise RuntimeError("A chave Gemini foi recusada. Confira GEMINI_API_KEY nas variáveis da Vercel.")
                    raise RuntimeError(f"Gemini recusou a solicitação (HTTP {response.status_code}). {api_message[:220]}")
                data = response.json()
                candidates = data.get("candidates") or []
                finish_reason = candidates[0].get("finishReason", "no_candidate") if candidates else "no_candidate"
                parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
                raw = "".join(part.get("text", "") for part in parts)
                logger.info("Gemini response received: model=%s candidates=%s finish_reason=%s text_chars=%s",
                            model, len(candidates), finish_reason, len(raw))
                if not raw:
                    feedback = data.get("promptFeedback", {})
                    block_reason = feedback.get("blockReason", "sem conteúdo")
                    raise RuntimeError(f"Gemini respondeu sem texto (motivo: {block_reason}; finalização: {finish_reason}).")
                try:
                    result = parse_generated_script(raw, req)
                    result["engine"] = f"gemini:{model}"
                    return result
                except (ValueError, json.JSONDecodeError) as exc:
                    logger.exception("Gemini returned invalid script JSON: %s", str(exc)[:300])
                    raise RuntimeError("O Gemini respondeu, mas o roteiro veio em formato inválido. Tente novamente.") from exc
            except httpx.TimeoutException as exc:
                last_error = "tempo limite"
                logger.warning("Gemini timeout: model=%s attempt=%s/%s", model, attempt + 1, attempts)
                if attempt + 1 < attempts:
                    time.sleep(2)
                    continue
                break
            except httpx.HTTPError as exc:
                last_error = str(exc)[:220]
                logger.warning("Gemini transport error: model=%s error=%s", model, last_error)
                break
    if len(models) > 1:
        raise RuntimeError(
            f"Gemini principal e modelo reserva estão temporariamente indisponíveis. "
            f"Modelos consultados: {', '.join(models)}. Último retorno: {last_error or 'sem resposta'}. "
            "Tente novamente em instantes."
        )
    if last_error and "HTTP 429" in last_error:
        raise RuntimeError("O limite ou a cota da API Gemini foi atingido. Confira os limites no Google AI Studio. " + last_error)
    raise RuntimeError("O Gemini está temporariamente indisponível. " + (last_error or "Tente novamente em instantes."))


def generate_with_openai(req: ScriptRequest) -> dict:
    if OpenAI is None:
        raise RuntimeError("Pacote openai não instalado.")
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return fallback_script(req)
    system, user = build_script_prompt(req)
    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            input=[{"role": "system", "content": system},
                   {"role": "user", "content": json.dumps(user, ensure_ascii=False)}],
            text={"format": {"type": "json_object"}}
        )
        return parse_generated_script(response.output_text, req)
    except Exception as exc:
        raise RuntimeError(f"Falha na geração OpenAI: {str(exc)[:300]}")


def generate_script(req: ScriptRequest) -> tuple[dict, str]:
    # Gemini é o principal; em falha, tenta OpenAI se configurado e nunca deixa a interface sem resposta.
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        try:
            result = generate_with_gemini(req)
            return result, result.get("engine", "gemini")
        except Exception as gemini_error:
            logger.warning("Gemini indisponível; acionando fallback: %s", str(gemini_error)[:240])
            if os.getenv("OPENAI_API_KEY"):
                try:
                    result = generate_with_openai(req)
                    result["engine"] = "openai:fallback"
                    result.setdefault("safety_notes", []).append("Roteiro gerado pelo provedor alternativo porque o Gemini estava indisponível.")
                    return result, "openai:fallback"
                except Exception as openai_error:
                    logger.exception("OpenAI fallback também falhou: %s", str(openai_error)[:240])
            result = fallback_script(req)
            result["engine"] = "template:fallback"
            result.setdefault("safety_notes", []).append("Modelo de roteiro simplificado usado porque os provedores de IA estavam indisponíveis. Revise e personalize antes de gravar.")
            return result, "template:fallback"
    if os.getenv("OPENAI_API_KEY"):
        return generate_with_openai(req), "openai"
    return fallback_script(req), "demo"

@app.get("/")
def home():
    return FileResponse(BASE_DIR / "static" / "index.html")

@app.get("/sleep-studio")
def sleep_studio():
    return FileResponse(BASE_DIR / "static" / "sleep-studio.html")

@app.post("/api/sleep/music")
async def upload_sleep_music(file: UploadFile = File(...)):
    """Store a Flow Music MP3 in persistent Vercel Blob storage."""
    filename = Path(file.filename or "flow-music.mp3").name
    if not filename.lower().endswith(".mp3"):
        raise HTTPException(400, "Envie um arquivo com extensão .mp3.")
    content_type = (file.content_type or "").lower()
    if content_type not in ("audio/mpeg", "audio/mp3", "application/octet-stream", ""):
        raise HTTPException(415, "O arquivo precisa ser um MP3.")
    max_bytes = 4 * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if not data:
        raise HTTPException(400, "O arquivo está vazio.")
    if len(data) > max_bytes:
        raise HTTPException(413, "O MP3 ultrapassa o limite de 4 MB. Comprima o áudio e tente novamente.")
    # MP3 files commonly start with an ID3 tag or an MPEG audio frame sync.
    is_mp3 = data.startswith(b"ID3") or (len(data) > 1 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0)
    if not is_mp3:
        raise HTTPException(415, "O conteúdo enviado não parece ser um arquivo MP3 válido.")
    if not os.getenv("BLOB_READ_WRITE_TOKEN"):
        raise HTTPException(503, "Armazenamento ainda não conectado. Crie uma Vercel Blob Store e conecte a variável BLOB_READ_WRITE_TOKEN ao projeto.")
    try:
        from vercel.blob import AsyncBlobClient
        client = AsyncBlobClient()
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "-", filename)[:100] or "flow-music.mp3"
        blob = await client.put(
            f"sleep-audio/{int(time.time())}-{safe_name}",
            data,
            access="public",
            add_random_suffix=True,
        )
        return {
            "ok": True,
            "url": blob.url,
            "pathname": blob.pathname,
            "filename": filename,
            "size_bytes": len(data),
            "content_type": "audio/mpeg",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Sleep music upload failed: %s", str(exc)[:300])
        raise HTTPException(502, "Falha ao salvar o MP3 no armazenamento. Confira a conexão da Vercel Blob e tente novamente.")

@app.get("/api/health")
def health():
    return {"ok": True, "gemini_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")), "openai_configured": bool(os.getenv("OPENAI_API_KEY")), "script_provider": "gemini" if (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")) else ("openai" if os.getenv("OPENAI_API_KEY") else "demo"), "agents": len(AGENTS)}

@app.get("/api/agents")
def agents():
    return {"agents": AGENTS}

@app.post("/api/script")
def create_script(req: ScriptRequest, request: Request):
    started = time.monotonic()
    request_id = request.headers.get("x-vercel-id") or request.headers.get("x-request-id") or "local"
    logger.info("Script request started: request_id=%s topic_chars=%s duration=%s",
                request_id, len(req.topic), req.duration_seconds)
    try:
        result, engine = generate_script(req)
        # Normalize the payload so a slightly irregular model response cannot
        # break the browser while it is rendering the result.
        result["title_ideas"] = [str(x) for x in result.get("title_ideas", []) if x is not None]
        result["hooks"] = [x for x in result.get("hooks", []) if isinstance(x, dict) and x.get("text")]
        result["script"] = [
            {"time": str(x.get("time", "")), "voice": str(x.get("voice", "")),
             "visual": str(x.get("visual", ""))}
            for x in result.get("script", []) if isinstance(x, dict)
        ]
        if not result["title_ideas"] or not result["hooks"] or not result["script"]:
            raise RuntimeError("A IA retornou um roteiro incompleto. Tente novamente.")
        result["engine"] = engine
        logger.info("Script request completed: request_id=%s engine=%s hooks=%s scenes=%s elapsed_seconds=%.1f",
                    request_id, engine, len(result["hooks"]), len(result["script"]), time.monotonic() - started)
        return result
    except RuntimeError as exc:
        logger.exception("Script generation failed: request_id=%s elapsed_seconds=%.1f error=%s",
                         request_id, time.monotonic() - started, str(exc)[:300])
        raise HTTPException(502, str(exc))
    except Exception as exc:
        logger.exception("Unexpected script generation error: request_id=%s elapsed_seconds=%.1f",
                         request_id, time.monotonic() - started)
        raise HTTPException(500, "Erro inesperado ao montar o roteiro. Tente novamente. Detalhe: " + str(exc)[:180])

class VoiceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=30000)
    voice_id: str = Field(default="", max_length=100)

@app.get("/api/voice/status")
def voice_status():
    fish_ready = bool(os.getenv("FISH_API_KEY"))
    eleven_ready = bool(os.getenv("ELEVENLABS_API_KEY") and os.getenv("ELEVENLABS_VOICE_ID"))
    return {
        "provider": "fish_audio" if fish_ready else ("elevenlabs" if eleven_ready else "none"),
        "configured": fish_ready or eleven_ready,
        "fish_audio_configured": fish_ready,
        "elevenlabs_configured": eleven_ready,
        "default_voice_configured": bool(os.getenv("FISH_AUDIO_VOICE_ID") or os.getenv("ELEVENLABS_VOICE_ID"))
    }


def split_text_for_voice(text: str, limit: int = 4500) -> list[str]:
    paragraphs = [p.strip() for p in re.split(r"\n+", text) if p.strip()]
    chunks, current = [], ""
    for paragraph in paragraphs:
        while len(paragraph) > limit:
            cut = paragraph.rfind(" ", 0, limit)
            if cut < 1:
                cut = limit
            piece, paragraph = paragraph[:cut].strip(), paragraph[cut:].strip()
            if current:
                chunks.append(current)
                current = ""
            chunks.append(piece)
        candidate = (current + "\\n\\n" + paragraph).strip() if current else paragraph
        if len(candidate) > limit:
            if current:
                chunks.append(current)
            current = paragraph
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks

@app.post("/api/voice")
def create_voice(req: VoiceRequest):
    fish_key = os.getenv("FISH_API_KEY")
    fish_voice_id = req.voice_id or os.getenv("FISH_AUDIO_VOICE_ID")
    audio_parts = []
    try:
        if fish_key:
            for chunk in split_text_for_voice(req.text, limit=4500):
                payload = {"text": chunk, "format": "mp3"}
                if fish_voice_id:
                    payload["reference_id"] = fish_voice_id
                response = httpx.post(
                    "https://api.fish.audio/v1/tts",
                    headers={
                        "Authorization": f"Bearer {fish_key}",
                        "Content-Type": "application/json",
                        "model": os.getenv("FISH_AUDIO_MODEL", "s2.1-pro-free")
                    },
                    json=payload,
                    timeout=120.0
                )
                if response.status_code >= 400:
                    raise HTTPException(502, "Fish Audio recusou a geração. Confira a chave, o Voice ID e os limites da API.")
                audio_parts.append(response.content)
        else:
            api_key = os.getenv("ELEVENLABS_API_KEY")
            voice_id = req.voice_id or os.getenv("ELEVENLABS_VOICE_ID")
            if not api_key or not voice_id:
                raise HTTPException(503, "Configure FISH_API_KEY ou as credenciais do ElevenLabs na Vercel.")
            for chunk in split_text_for_voice(req.text):
                response = httpx.post(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                    headers={"xi-api-key": api_key, "Accept": "audio/mpeg", "Content-Type": "application/json"},
                    json={
                        "text": chunk,
                        "model_id": os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2"),
                        "voice_settings": {"stability": 0.48, "similarity_boost": 0.78, "style": 0.25, "use_speaker_boost": True}
                    },
                    timeout=90.0
                )
                if response.status_code >= 400:
                    raise HTTPException(502, "ElevenLabs não conseguiu gerar a narração. Verifique voz, créditos e limites.")
                audio_parts.append(response.content)
        return Response(content=b"".join(audio_parts), media_type="audio/mpeg", headers={"Content-Disposition": "inline; filename=voiceover.mp3"})
    except httpx.TimeoutException:
        raise HTTPException(504, "Tempo limite ao gerar a narração.")
    except httpx.HTTPError:
        raise HTTPException(502, "Falha de comunicação com o serviço de narração.")
