# YouTube Agent Studio — MVP

Painel web independente para uma equipe planejada de 11 agentes. Nesta primeira versão, o módulo **Roteirista** está implementado.

## Recursos
- Interface em português brasileiro.
- Catálogo de 11 agentes (1 ativo; 10 planejados).
- API `GET /api/agents`, `GET /api/health` e `POST /api/script`.
- Cinco hooks avaliados por critérios heurísticos, roteiro por cenas, títulos, descrição e hashtags.
- Modo demonstração sem chave de API.
- Integração Gemini API (modelo padrão `gemini-3.8-flash`) e alternativa OpenAI. As chaves ficam somente no backend.
- Geração de narração por Fish Audio ou ElevenLabs.
- Exportação de cenas/props para Remotion e legendas SRT.

## Deploy na Vercel
O projeto inclui `api/index.py` e `vercel.json` para expor a aplicação FastAPI como função Python.

1. Importe este repositório na Vercel.
2. Configure `GEMINI_API_KEY` como variável secreta no projeto. O modelo padrão é `gemini-3.8-flash`; opcionalmente, configure `GEMINI_MODEL`.
3. Para narração, configure `FISH_API_KEY` e, se necessário, `FISH_AUDIO_VOICE_ID`. Como alternativa, use `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID`.
4. Opcionalmente, configure `OPENAI_API_KEY` e `OPENAI_MODEL` como provedor alternativo.
4. Faça o deploy.

## Execução local
Requer Python 3.11+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Abra http://localhost:8000.

No PowerShell:
```powershell
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Sem credenciais de IA, a API usa um roteiro demonstrativo. Nunca publique chaves no GitHub.

## Exemplo de requisição
```json
{
  "topic": "Por que seu salário desaparece antes do fim do mês?",
  "audience": "Adultos que querem organizar o orçamento",
  "format": "YouTube Shorts",
  "duration_seconds": 40,
  "tone": "Direto, didático e envolvente",
  "goal": "Ensinar uma ação prática"
}
```

## Próximas etapas
Persistência de projetos, autenticação, agentes de SEO/edição/retenção, YouTube Data API e OAuth do canal, geração de áudio e exportação para Remotion. Aprovação humana deve ser exigida antes de publicar ou responder comentários.
