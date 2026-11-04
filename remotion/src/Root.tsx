import React from "react";
import { Composition, staticFile } from "remotion";
import { YouTubeVideo, type VideoProps } from "./YouTubeVideo";
import { SleepVideo, type SleepVideoProps } from "./SleepVideo";
import { ReflexaoBiblica, type ReflexaoBiblicaProps } from "./ReflexaoBiblica";
import { MixVisualEngine, getTimelineDuration, type MixVisualEngineProps } from "./mix-visual-engine";

const demo: VideoProps = {
  title: "Seu dinheiro está desaparecendo?",
  scenes: [
    { heading: "PARA ONDE VAI SEU DINHEIRO?", narration: "Você recebe, paga as contas e, quando percebe, o dinheiro já acabou.", accent: "Uma pergunta que muita gente faz." },
    { heading: "O PROBLEMA NÃO É SÓ O SALÁRIO", narration: "Pequenos gastos recorrentes podem consumir uma parte importante do orçamento.", accent: "O invisível também pesa." },
    { heading: "ANOTE POR 7 DIAS", narration: "Registre cada compra, até mesmo o cafezinho. Depois agrupe os gastos por categoria.", accent: "Comece com um passo simples." },
    { heading: "DÊ UMA FUNÇÃO AO DINHEIRO", narration: "Separe primeiro o essencial, depois defina um limite para os gastos variáveis.", accent: "Planejamento traz clareza." },
    { heading: "QUAL GASTO VAI REVER?", narration: "Escolha uma despesa para observar nesta semana. Pequenas decisões podem abrir espaço no orçamento.", accent: "Comente sua experiência." }
  ]
};

const sleepDemo: SleepVideoProps = {
  title: "Moonlight Ocean Dreams",
  durationSeconds: 3600,
  musicSrc: "",
  audioLoop: true,
  scenes: Array.from({ length: 6 }, (_, index) => ({
    title: "Moonlit ocean scene " + (index + 1),
    durationSeconds: 600,
    imageSrc: "",
  })),
};

const reflexaoDemo: ReflexaoBiblicaProps = {
  videoSrc: "",
  headline: "Com sabedoria se edifica a casa...",
  subtitle: "E com inteligência ela se firma.",
  footerText: "Assim como o passarinho, edifique seu lar um dia de cada vez.",
  reference: "PROVÉRBIOS 24:3",
  voiceSrc: "",
  videoMuted: true,
  videoFit: "cover",
  durationSeconds: 10,
};

const shakerAd: MixVisualEngineProps = {
  title: "COQUETELEIRA SHAKER GO 600 ML",
  brandName: "MIX",
  accent: "#f47a20",
  showCaptions: true,
  musicVolume: 0.14,
  voiceSrc: staticFile("shaker-assets/narration.mp3"),
  musicSrc: staticFile("shaker-assets/music-bed.mp3"),
  scenes: [
    { id: "shaker-hook", kind: "product", durationInFrames: 150, title: "SUA ROTINA. SEU RITMO.", subtitle: "Coqueteleira Shaker Go 600 ml Fumê", narration: "Sua rotina de treino merece praticidade. Conheça a Shaker Go de 600 ml." },
    { id: "shaker-capacity", kind: "product", durationInFrames: 150, title: "600 ML DE CAPACIDADE", subtitle: "Espaço para acompanhar seu treino", narration: "Com capacidade de 600 ml, ela acompanha você na academia e no dia a dia." },
    { id: "shaker-design", kind: "product", durationInFrames: 150, title: "VISUAL FUMÊ. ESTILO MARCANTE.", subtitle: "Acabamento preto translúcido", narration: "O visual fumê traz um estilo moderno para sua rotina." },
    { id: "shaker-lid", kind: "product", durationInFrames: 150, title: "TAMPA E SOBRE ALÇA", subtitle: "Detalhes que fazem a diferença", narration: "Conta com tampa e sobrealça para facilitar o transporte." },
    { id: "shaker-gym", kind: "product", durationInFrames: 150, title: "LEVE PARA A ACADEMIA", subtitle: "Sua companheira de treino", narration: "Leve sua coqueteleira com você e mantenha sua rotina em movimento." },
    { id: "shaker-cta", kind: "product", durationInFrames: 150, title: "PRONTA PARA SEU PRÓXIMO TREINO?", subtitle: "Shaker Go 600 ml Fumê", narration: "Gostou? Confira os detalhes e garanta a sua." }
  ]
};

const mixDuration = getTimelineDuration(shakerAd.scenes);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="YouTubeVideo"
      component={YouTubeVideo}
      durationInFrames={9000}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={demo}
      calculateMetadata={({ props }) => {
        const totalSeconds = props.scenes.reduce((total, scene) => total + Math.max(3, scene.durationSeconds ?? Math.max(8, Math.round((scene.narration || "").trim().split(/\\s+/).filter(Boolean).length / 2.5))), 0);
        return { durationInFrames: Math.max(1, Math.ceil(totalSeconds * 30)) };
      }}
    />
    <Composition
      id="SleepVideo"
      component={SleepVideo}
      durationInFrames={108000}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={sleepDemo}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.ceil(props.durationSeconds * 30)) })}
    />
    <Composition
      id="ReflexaoBiblica"
      component={ReflexaoBiblica}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={reflexaoDemo}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.ceil(props.durationSeconds * 30)) })}
    />
    <Composition id="MixEngineVertical" component={MixVisualEngine} durationInFrames={mixDuration} fps={30} width={1080} height={1920} defaultProps={shakerAd} calculateMetadata={({ props }) => ({ durationInFrames: getTimelineDuration(props.scenes) })} />
    <Composition id="MixEngineLandscape" component={MixVisualEngine} durationInFrames={mixDuration} fps={30} width={1920} height={1080} defaultProps={shakerAd} />
    <Composition id="MixEngineSquare" component={MixVisualEngine} durationInFrames={mixDuration} fps={30} width={1080} height={1080} defaultProps={shakerAd} />
  </>
);
