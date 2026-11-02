import React from "react";

import {AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {renderMediaOnWeb, canRenderMediaOnWeb} from "@remotion/web-renderer";

const h=React.createElement;
function Scene({scene,index,total}) {
  const frame=useCurrentFrame(),{durationInFrames}=useVideoConfig();
  const opacity=interpolate(frame,[0,15,durationInFrames-15,durationInFrames],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const bob=Math.sin(frame/9)*5;
  return h(AbsoluteFill,{style:{justifyContent:"center",padding:"7% 8%",background:"radial-gradient(circle at 78% 20%, #244b79 0%, #101b32 38%, #080d18 100%)",color:"#f7f9ff",fontFamily:"Arial,sans-serif",opacity}},
    h("div",{style:{position:"absolute",top:42,left:"8%",fontSize:20,letterSpacing:5,color:"#8fbaff",fontWeight:800}},"YOUTUBE AGENT STUDIO"),
    h("div",{style:{position:"absolute",right:"8%",top:42,fontSize:20,color:"#9fb0c9"}},String(index+1).padStart(2,"0")+" / "+String(total).padStart(2,"0")),
    h("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:28,zIndex:1}},
      h("div",{style:{flex:1,maxWidth:1120}},
        h("div",{style:{width:90,height:8,background:"#68a7ff",borderRadius:8,marginBottom:28}}),
        h("div",{style:{fontSize:64,fontWeight:900,lineHeight:1.04,letterSpacing:-2}},scene.heading||""),
        h("div",{style:{fontSize:29,lineHeight:1.3,color:"#d6e2f5",marginTop:26}},scene.narration||""),
        scene.accent?h("div",{style:{fontSize:24,color:"#83b6ff",marginTop:26,fontWeight:800}},scene.accent):null),
      h("div",{style:{width:280,flexShrink:0,transform:"translateY("+bob+"px)"}},
        h("svg",{viewBox:"0 0 300 440",width:"100%",height:"auto"},
          h("ellipse",{cx:150,cy:420,rx:88,ry:12,fill:"#00000055"}),
          h("circle",{cx:150,cy:75,r:52,fill:"#fff",stroke:"#111827",strokeWidth:11}),
          h("path",{d:"M100 64 Q150 2 200 64",fill:"none",stroke:"#111827",strokeWidth:10,strokeLinecap:"round"}),
          h("circle",{cx:132,cy:78,r:5,fill:"#111827"}),h("circle",{cx:169,cy:78,r:5,fill:"#111827"}),
          h("path",{d:"M130 104 Q150 120 170 104",fill:"none",stroke:"#111827",strokeWidth:5,strokeLinecap:"round"}),
          h("path",{d:"M150 130 L150 290 M150 175 L82 245 M150 175 L220 245 M150 290 L102 390 M150 290 L205 390",stroke:"#111827",strokeWidth:16,strokeLinecap:"round",fill:"none"}),
          h("path",{d:"M110 190 Q150 165 190 190 L187 286 L113 286 Z",fill:"#68a7ff",stroke:"#111827",strokeWidth:8}),
          h("text",{x:150,y:244,textAnchor:"middle",fontSize:21,fontWeight:900,fill:"#071225"},"YA")
        ))
    ),
    h("div",{style:{position:"absolute",bottom:38,left:"8%",right:"8%",height:5,background:"#ffffff22",borderRadius:9}},
      h("div",{style:{height:"100%",width:(frame/durationInFrames*100)+"%",background:"#68a7ff",borderRadius:9}}))
  );
}
function Video({title,scenes,audioSrc}) {
  const {durationInFrames}=useVideoConfig();
  const safe=scenes?.length?scenes:[{heading:title,narration:""}];
  const weights=safe.map(s=>Math.max(1,Number(s.durationSeconds)||8));
  const total=weights.reduce((a,b)=>a+b,0);let cursor=0;
  const timings=weights.map((w,i)=>{const from=cursor;const duration=i===weights.length-1?durationInFrames-cursor:Math.max(1,Math.round(durationInFrames*w/total));cursor+=duration;return {from,duration};});
  return h(AbsoluteFill,{style:{background:"#080d18"}},
    audioSrc?h(Audio,{src:audioSrc}):null,
    ...safe.map((scene,i)=>h(Sequence,{key:i,from:timings[i].from,durationInFrames:timings[i].duration},h(Scene,{scene,index:i,total:safe.length})))
  );
}
window.renderStudioVideo=async function({props,onProgress}) {
  if (!("VideoEncoder" in window) || !("AudioEncoder" in window)) throw new Error("Este navegador não oferece WebCodecs para renderizar MP4. Use Chrome atualizado.");
  const support=await canRenderMediaOnWeb({videoCodec:"h264",container:"mp4"});
  if (!support) throw new Error("Este navegador não suporta a codificação MP4 necessária.");
  const fps=30,scenes=props.scenes||[];
  const seconds=scenes.reduce((sum,s)=>sum+Math.max(1,Number(s.durationSeconds)||8),0);
  const composition={id:"YouTubeVideoBrowser",component:Video,durationInFrames:Math.max(1,Math.ceil(seconds*fps)),fps,width:1280,height:720,defaultProps:props};
  const result=await renderMediaOnWeb({composition,inputProps:props,container:"mp4",videoCodec:"h264",videoBitrate:"medium",pageResponsiveness:"high",onProgress});
  return await result.getBlob();
};
\nwindow.dispatchEvent(new Event("studio-renderer-ready"));\n