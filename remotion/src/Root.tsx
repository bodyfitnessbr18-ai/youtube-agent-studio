import React from "react";
import { Composition } from "remotion";
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

const mixDemo: MixVisualEngineProps = {
  title: "Mix Visual Engine",
  brandName: "MIX STUDIO",
  accent: "#e6b86b",
  showCaptions: true,
  musicVolume: 0.14,
  scenes: [
    { id: "opening", kind: "editorial", durationInFrames: 90, title: "IDEIAS QUE GANHAM VIDA", subtitle: "Um motor visual. Muitos universos.", narration: "Uma única plataforma para transformar ideias em vídeos." },
    { id: "product", kind: "product", durationInFrames: 120, title: "ANÚNCIOS DE PRODUTOS", subtitle: "Apresentações com presença visual.", narration: "Do detalhe à apresentação completa do produto." },
    { id: "isometric", kind: "isometric", durationInFrames: 150, title: "MUNDOS EM 3D", subtitle: "Cenários construídos por código.", narration: "Cidades, objetos e mundos tridimensionais." },
    { id: "storybook", kind: "storybook", durationInFrames: 120, title: "HISTÓRIAS ILUSTRADAS", subtitle: "Imaginação, cor e emoção.", narration: "Histórias infantis contadas com delicadeza." },
    { id: "traffic", kind: "traffic", durationInFrames: 120, title: "MOVIMENTO E INFORMAÇÃO", subtitle: "Animações explicativas e dinâmicas.", narration: "E animações técnicas que tornam assuntos complexos mais claros." }
  ]
};

const mixDuration = getTimelineDuration(mixDemo.scenes);

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
        const totalSeconds = props.scenes.reduce((total, scene) => total + Math.max(3, scene.durationSeconds ?? Math.max(8, Math.round((scene.narration || "").trim().split(/\s+/).filter(Boolean).length / 2.5))), 0);
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
    <Composition id="MixEngineVertical" component={MixVisualEngine} durationInFrames={mixDuration} fps={30} width={1080} height={1920} defaultProps={mixDemo} />
    <Composition id="MixEngineLandscape" component={MixVisualEngine} durationInFrames={mixDuration} fps={30} width={1920} height={1080} defaultProps={mixDemo} />
    <Composition id="MixEngineSquare" component={MixVisualEngine} durationInFrames={mixDuration} fps={30} width={1080} height={1080} defaultProps={mixDemo} />
  </>
);
