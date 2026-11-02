import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type Scene = { heading: string; narration: string; accent?: string };
export type VideoProps = { title: string; scenes: Scene[] };

const SceneCard: React.FC<{scene: Scene; index: number; total: number}> = ({scene,index,total}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(frame,[0,18,durationInFrames-18,durationInFrames],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const drift = interpolate(frame,[0,durationInFrames],[28,-20]);
  return <AbsoluteFill style={{justifyContent:"center",padding:"9%",background:"radial-gradient(circle at 80% 20%, #244b79 0%, #101b32 38%, #080d18 100%)",color:"#f7f9ff",fontFamily:"Arial, sans-serif",opacity}}>
    <div style={{position:"absolute",top:70,left:"9%",fontSize:24,letterSpacing:7,color:"#8fbaff"}}>YOUTUBE AGENT STUDIO</div>
    <div style={{position:"absolute",right:"9%",top:70,fontSize:22,color:"#9fb0c9"}}>{String(index+1).padStart(2,"0")} / {String(total).padStart(2,"0")}</div>
    <div style={{transform:`translateY(${drift}px)`,maxWidth:1450}}>
      <div style={{width:110,height:8,background:"#68a7ff",borderRadius:8,marginBottom:42}}/>
      <div style={{fontSize:78,fontWeight:900,lineHeight:1.05,letterSpacing:-2}}>{scene.heading}</div>
      <div style={{fontSize:38,lineHeight:1.35,color:"#d6e2f5",marginTop:44,maxWidth:1250}}>{scene.narration}</div>
      {scene.accent && <div style={{fontSize:28,color:"#83b6ff",marginTop:54,fontWeight:700}}>{scene.accent}</div>}
    </div>
    <div style={{position:"absolute",bottom:70,left:"9%",right:"9%",height:5,background:"#ffffff22",borderRadius:9}}>
      <div style={{height:"100%",width:`${(frame/durationInFrames)*100}%`,background:"#68a7ff",borderRadius:9}}/>
    </div>
  </AbsoluteFill>;
};

export const YouTubeVideo: React.FC<VideoProps> = ({title,scenes}) => {
  const {fps,durationInFrames} = useVideoConfig();
  const safeScenes = scenes.length ? scenes : [{heading:title,narration:"Adicione cenas ao roteiro para começar.",accent:""}];
  const perScene = Math.floor(durationInFrames/safeScenes.length);
  return <AbsoluteFill style={{background:"#080d18"}}>
    {safeScenes.map((scene,index)=><Sequence key={index} from={index*perScene} durationInFrames={index===safeScenes.length-1?durationInFrames-index*perScene:perScene}>
      <SceneCard scene={scene} index={index} total={safeScenes.length}/>
    </Sequence>)}
  </AbsoluteFill>;
};