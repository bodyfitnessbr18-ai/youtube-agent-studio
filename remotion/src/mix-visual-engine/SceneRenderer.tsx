import React from "react";
import type { MixScene } from "./types";
import { EditorialScene } from "./scenes/EditorialScene";
import { ProductScene } from "./scenes/ProductScene";
import { StorybookScene } from "./scenes/StorybookScene";
import { TrafficScene } from "./scenes/TrafficScene";
import { IsometricScene } from "./scenes/IsometricScene";
import { VideoScene } from "./scenes/VideoScene";

export const SceneRenderer: React.FC<{ scene: MixScene; accent?: string }> = ({ scene, accent }) => {
  switch (scene.kind) {
    case "video": return <VideoScene scene={scene} accent={accent} />;
    case "product": return <ProductScene scene={scene} accent={accent} />;
    case "storybook": return <StorybookScene scene={scene} accent={accent} />;
    case "traffic": return <TrafficScene scene={scene} accent={accent} />;
    case "isometric": return <IsometricScene scene={scene} />;
    case "editorial":
    default: return <EditorialScene scene={scene} accent={accent} />;
  }
};
