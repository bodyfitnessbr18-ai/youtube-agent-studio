# EDIT IA Studio — primeira entrega

O EDIT IA Studio é o editor de montagem de clipes integrado ao Mix Visual Engine e ao Remotion. Esta primeira entrega é um MVP funcional de ingestão local, organização de cenas e exportação do projeto.

## O que já está implementado

- Interface web responsiva em português.
- Upload de vários arquivos MP4, MOV e WEBM para `remotion/public/edit-ia-assets/`.
- Upload de trilha MP3 para a mesma pasta pública.
- Organização de clipes em cenas na ordem escolhida.
- Ajuste manual da duração e do ponto de início de cada clipe.
- Título, subtítulo e texto de narração por cena.
- Opção de legendas animadas com o componente de palavras existente.
- Exportação do projeto para `remotion/public/edit-ia-project.json`.
- Três composições Remotion: vertical 9:16, quadrada 1:1 e horizontal 16:9.
- Renderização MP4 com o pipeline Remotion existente.

## Executar no GitHub Codespaces

Abra o terminal no repositório e execute:

```bash
cd /workspaces/youtube-agent-studio
git fetch origin
git checkout feature/edit-ia-studio
cd remotion
npm install
npm run edit-ia-studio
```

O terminal exibirá o endereço local. Abra a porta **4179** no painel Ports do Codespaces e acesse o endereço encaminhado.

## Fluxo de uso

1. Envie um ou mais vídeos.
2. Edite o título, subtítulo, texto de narração, duração e ponto inicial de cada cena.
3. Selecione o formato de saída.
4. Envie uma trilha MP3, se desejar.
5. Clique em **Salvar projeto**.
6. O painel apresenta o comando de renderização correspondente.

Exemplo:

```bash
npm run render:edit-ia -- --composition=EditIAVertical
```

Composições disponíveis: `EditIAVertical`, `EditIALandscape` e `EditIASquare`. A saída é `remotion/out/edit-ia.mp4`.

## Arquitetura

- Interface e upload local: `scripts/edit-ia-studio.mjs`.
- Composição de clipe: `src/mix-visual-engine/scenes/VideoScene.tsx`.
- Integração no motor: `src/mix-visual-engine/SceneRenderer.tsx`.
- Composições e proporções: `src/Root.tsx`.
- Projeto editável: `public/edit-ia-project.json`.
- Mídia enviada: `public/edit-ia-assets/`.

## Limites desta fase

O servidor de upload é local e grava no disco do Codespace. Ele não deve ser exposto publicamente sem autenticação. O renderizador é o processo local do Remotion; a função serverless da Vercel não é usada para renderizar vídeos.

Esta entrega ainda não faz análise semântica automática, transcrição, detecção automática de pausas, remoção de fundo ou publicação em redes sociais. Essas capacidades entram nas próximas fases, usando o Gemini/Fish Audio já presentes e o worker Remotion.

## Próximas fases

1. Transcrever áudio e alinhar palavras/legendas com timestamps.
2. Analisar cenas com Gemini e sugerir os melhores cortes e ganchos.
3. Detectar silêncio e pausas com FFmpeg, com prévia e aprovação dos cortes.
4. Gerar narração por Fish Audio e mixar voz/música com ducking.
5. Adicionar presets de edição, motion graphics, zooms e transições.
6. Conectar os projetos aprovados à Central de Publicações.
