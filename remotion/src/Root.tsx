import React from "react";
import { Composition } from "remotion";
import { YouTubeVideo, type VideoProps } from "./YouTubeVideo";\nimport { SleepVideo, type SleepVideoProps } from "./SleepVideo";
import { SleepVideo, type SleepVideoProps } from "./SleepVideo";

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

const estimateSceneSeconds = (scene: VideoProps["scenes"][number]) =>
  Math.max(
    3,
    scene.durationSeconds ??
      Math.max(8, Math.round((scene.narration || "").trim().split(/\\s+/).filter(Boolean).length / 2.5))
  );

export const RemotionRoot: React.FC = () => (
  <Composition
    id="YouTubeVideo"
    component={YouTubeVideo}
    durationInFrames={9000}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={demo}
    calculateMetadata={({ props }) => {
      const totalSeconds = props.scenes.reduce(
        (total, scene) => total + estimateSceneSeconds(scene),
        0
      );
      return { durationInFrames: Math.max(1, Math.ceil(totalSeconds * 30)) };
    }}
  />
);
