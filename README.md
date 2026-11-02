# YouTube Agent Studio — MVP

Painel web independente para uma equipe planejada de 11 agentes. Nesta primeira versão, o módulo **Roteirista** está implementado.

## Recursos
- Interface em português brasileiro.
- Catálogo de 11 agentes (1 ativo; 10 planejados).
- API `GET /api/agents`, `GET /api/health` e `POST /api/script`.
- Cinco hooks avaliados por critérios heurísticos, roteiro por cenas, títulos, descrição e hashtags.
- Modo demonstração sem chave de API.
- Integração OpenAI opcional no backend. A chave não é enviada ao navegador.

## Deploy na Vercel
O projeto inclui `api/index.py` e `vercel.json` para expor a aplicação FastAPI como função Python.

1. Importe este repositório na Vercel.
2. Configure a variável `OPENAI_API_KEY` como segredo no projeto (opcional para o modo demo).
3. Configure `OPENAI_MODEL` com um modelo disponível na sua conta (padrão atual: `gpt-4.1-mini`).
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

Sem `OPENAI_API_KEY`, a API usa um roteiro demonstrativo. Não publique uma chave no GitHub.

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
