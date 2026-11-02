import json
import os
import re
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import httpx

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="YouTube Agent Studio", version="0.1.1")
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
    # Compatibilidade: contas novas não têm acesso ao Gemini 2.5 Flash.
    # Se a Vercel ainda tiver GEMINI_MODEL configurada com o modelo antigo,
    # atualizamos automaticamente para o modelo estável recomendado.
    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip().removeprefix("models/")
    if not model or "gemini-2.5-flash" in model or "gemini-2.0-flash" in model:
        model = "gemini-3.8-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    try:
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": json.dumps(user, ensure_ascii=False)}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.75, "maxOutputTokens": 8192}
        }
        response = None
        for attempt in range(2):
            response = httpx.post(
                url,
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                json=payload,
                timeout=180.0
            )
            if response.status_code not in (500, 502, 503, 504) or attempt == 1:
                break
            time.sleep(1.5)
        if response.status_code >= 400:
            try:
                api_message = response.json().get("error", {}).get("message", "")
            except Exception:
                api_message = ""
            if response.status_code in (401, 403):
                raise RuntimeError("A chave Gemini foi recusada. Confira GEMINI_API_KEY nas variáveis da Vercel.")
            if response.status_code == 429:
                raise RuntimeError("O limite ou a cota da API Gemini foi atingido. Confira o faturamento e os limites no Google AI Studio. " + api_message[:220])
            if response.status_code in (500, 502, 503, 504):
                raise RuntimeError("O Gemini está temporariamente indisponível. Tente novamente em alguns instantes. " + api_message[:220])
            raise RuntimeError("Gemini recusou a solicitação. Confira o modelo e os parâmetros enviados. " + api_message[:220])
        payload = response.json()
        candidates = payload.get("candidates") or []
        parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
        raw = "".join(part.get("text", "") for part in parts)
        if not raw:
            raise RuntimeError("Gemini não retornou conteúdo. Verifique os limites ou tente novamente.")
        return parse_generated_script(raw, req)
    except httpx.TimeoutException:
        raise RuntimeError("Tempo limite ao consultar o Gemini. Tente novamente.")
    except httpx.HTTPError:
        raise RuntimeError("Falha de comunicação com a API Gemini.")


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
    # Gemini é o provedor principal; OpenAI fica como alternativa quando não há chave Gemini.
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        return generate_with_gemini(req), "gemini"
    if os.getenv("OPENAI_API_KEY"):
        return generate_with_openai(req), "openai"
    return fallback_script(req), "demo"

@app.get("/")
def home():
    return FileResponse(BASE_DIR / "static" / "index.html")

@app.get("/api/health")
def health():
    return {"ok": True, "gemini_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")), "openai_configured": bool(os.getenv("OPENAI_API_KEY")), "script_provider": "gemini" if (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")) else ("openai" if os.getenv("OPENAI_API_KEY") else "demo"), "agents": len(AGENTS)}

@app.get("/api/agents")
def agents():
    return {"agents": AGENTS}

@app.post("/api/script")
def create_script(req: ScriptRequest):
    try:
        result, engine = generate_script(req)
    except RuntimeError as exc:
        raise HTTPException(502, str(exc))
    result["engine"] = engine
    return result

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
