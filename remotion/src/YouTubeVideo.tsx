import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type Scene = { heading:string; narration:string; accent?:string; visual?:string; durationSeconds?:number };
export type VideoProps = { title:string; scenes:Scene[]; audioSrc?:string; musicSrc?:string };

const StickyMan:React.FC<{mood?:"worried"|"happy"|"thinking"|"confident"}>=({mood="thinking"})=>{
 const frame=useCurrentFrame(),bob=Math.sin(frame/9)*7,arm=Math.sin(frame/13)*10;
 const face=mood==="worried"?"☹":mood==="happy"?"☺":mood==="confident"?"😎":"?";
 return <div style={{width:340,height:500,position:"relative",transform:`translateY(${bob}px)`}}>
  <svg viewBox="0 0 360 520" width="100%" height="100%">
   <ellipse cx="180" cy="500" rx="105" ry="13" fill="#00000055"/>
   <circle cx="180" cy="92" r="62" fill="#fff" stroke="#111827" strokeWidth="13"/>
   <path d="M120 78 Q180 5 240 78" fill="none" stroke="#111827" strokeWidth="12" strokeLinecap="round"/>
   <circle cx="160" cy="94" r="6" fill="#111827"/><circle cx="202" cy="94" r="6" fill="#111827"/>
   <path d={mood==="worried"?"M158 128 Q180 110 202 128":mood==="happy"?"M155 119 Q180 148 205 119":"M160 126 Q180 136 200 126"} fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round"/>
   <path d="M180 158 L180 340" stroke="#111827" strokeWidth="20" strokeLinecap="round"/>
   <path d={`M180 200 L${95+arm} 285`} stroke="#111827" strokeWidth="17" strokeLinecap="round"/>
   <path d={`M180 200 L${270-arm} 270`} stroke="#111827" strokeWidth="17" strokeLinecap="round"/>
   <path d="M180 340 L120 465 M180 340 L245 465" stroke="#111827" strokeWidth="20" strokeLinecap="round"/>
   <path d="M90 470 L130 470 M225 470 L270 470" stroke="#111827" strokeWidth="18" strokeLinecap="round"/>
   <path d="M130 220 Q180 185 230 220 L225 335 L135 335 Z" fill="#68a7ff" stroke="#111827" strokeWidth="9"/>
   <text x="180" y="284" textAnchor="middle" fontSize="24" fontWeight="900" fill="#071225">SM</text>
  </svg>
  <div style={{position:"absolute",top:0,right:-4,background:"#fff",color:"#111827",border:"5px solid #111827",borderRadius:28,padding:"12px 20px",fontSize:42,fontWeight:900,boxShadow:"7px 7px 0 #000"}}>{face}</div>
 </div>;
};

const Caption:React.FC<{text:string}> = ({text})=>{
 return <div style={{position:"absolute",bottom:90,left:"10%",right:"10%",textAlign:"center",fontSize:31,fontWeight:900,lineHeight:1.2,color:"#fff",textShadow:"0 3px 7px #000,2px 2px 0 #000",background:"#071225cc",padding:"12px 20px",borderRadius:12}}>{text}</div>;
};

const SceneCard:React.FC<{scene:Scene;index:number;total:number}> = ({scene,index,total})=>{
 const frame=useCurrentFrame(),{durationInFrames}=useVideoConfig();
 const opacity=interpolate(frame,[0,18,durationInFrames-18,durationInFrames],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
 const zoom=interpolate(frame,[0,durationInFrames],[1,1.04]);
 const mood=index===0?"worried":index===total-1?"confident":index%2===0?"thinking":"happy";
 const words=(scene.narration||"").trim().split(/\s+/).filter(Boolean);
 const chunks:string[]=[];for(let i=0;i<words.length;i+=7)chunks.push(words.slice(i,i+7).join(" "));
 const chunkIndex=Math.min(chunks.length-1,Math.floor(frame/Math.max(1,durationInFrames/Math.max(1,chunks.length))));
 return <AbsoluteFill style={{justifyContent:"center",padding:"6% 8%",background:"radial-gradient(circle at 78% 20%, #244b79 0%, #101b32 38%, #080d18 100%)",color:"#f7f9ff",fontFamily:"Arial,sans-serif",opacity}}>
  <div style={{position:"absolute",inset:0,transform:`scale(${zoom})`,background:"linear-gradient(115deg,transparent 48%,#ffffff08 49%,transparent 65%)"}}/>
  <div style={{position:"absolute",top:52,left:"8%",fontSize:22,letterSpacing:6,color:"#8fbaff",fontWeight:800}}>STICKY MAN FINANÇAS</div>
  <div style={{position:"absolute",right:"8%",top:52,fontSize:22,color:"#9fb0c9"}}>{String(index+1).padStart(2,"0")} / {String(total).padStart(2,"0")}</div>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:30,zIndex:1}}>
   <div style={{flex:1,maxWidth:1100}}>
    <div style={{width:100,height:8,background:"#68a7ff",borderRadius:8,marginBottom:32}}/>
    <div style={{fontSize:66,fontWeight:900,lineHeight:1.04,letterSpacing:-2}}>{scene.heading}</div>
    <div style={{fontSize:29,lineHeight:1.3,color:"#d6e2f5",marginTop:28}}>{scene.narration}</div>
    {scene.accent&&<div style={{fontSize:25,color:"#83b6ff",marginTop:30,fontWeight:800}}>{scene.accent}</div>}
   </div>
   <div style={{width:330,flexShrink:0}}><StickyMan mood={mood}/></div>
  </div>
  {chunks.length>0&&<Caption text={chunks[chunkIndex]}/>}
  <div style={{position:"absolute",bottom:50,left:"8%",right:"8%",height:5,background:"#ffffff22",borderRadius:9}}>
   <div style={{height:"100%",width:`${frame/durationInFrames*100}%`,background:"#68a7ff",borderRadius:9}}/>
  </div>
 </AbsoluteFill>;
};

export const YouTubeVideo:React.FC<VideoProps>=({title,scenes,audioSrc,musicSrc})=>{
 const {durationInFrames,fps}=useVideoConfig();
 const safeScenes=scenes.length?scenes:[{heading:title,narration:"Adicione cenas ao roteiro para começar."}];
 const weights=safeScenes.map(s=>Math.max(1,s.durationSeconds??(s.narration.trim().split(/\s+/).length/2.5)));
 const total=weights.reduce((a,b)=>a+b,0);
 let cursor=0;
 const timings=weights.map((w,i)=>{const from=cursor;const duration=i===weights.length-1?durationInFrames-cursor:Math.max(1,Math.round(durationInFrames*w/total));cursor+=duration;return {from,duration};});
 return <AbsoluteFill style={{background:"#080d18"}}>
  {audioSrc&&<Audio src={audioSrc}/>}
  {musicSrc&&<Audio src={musicSrc} volume={0.12}/>}
  {safeScenes.map((scene,index)=><Sequence key={index} from={timings[index].from} durationInFrames={timings[index].duration}>
   <SceneCard scene={scene} index={index} total={safeScenes.length}/>
  </Sequence>)}
 </AbsoluteFill>;
};
