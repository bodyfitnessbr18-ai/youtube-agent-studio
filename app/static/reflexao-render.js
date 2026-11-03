import React from "react";
import { AbsoluteFill, Audio, Video } from "remotion";
import { renderMediaOnWeb, canRenderMediaOnWeb } from "@remotion/web-renderer";

const h = React.createElement;

function ReflexaoComposition(props) {
  return h(
    AbsoluteFill,
    {
      style: {
        backgroundColor: "#FFFFFF",
        color: "#111111",
        fontFamily: "Arial, Helvetica, sans-serif",
        display: "flex",
        flexDirection: "column",
      },
    },
    h(
      "div",
      {
        style: {
          height: "25%",
          flexShrink: 0,
          padding: "34px 62px 22px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 20,
        },
      },
      h("div", { style: { fontSize: 58, lineHeight: 1.14, fontWeight: 800 } }, props.headline),
      props.subtitle
        ? h("div", { style: { fontSize: 30, lineHeight: 1.2, fontWeight: 500, color: "#333333" } }, props.subtitle)
        : null
    ),
    h(
      "div",
      {
        style: {
          height: "55%",
          width: "100%",
          flexShrink: 0,
          overflow: "hidden",
          backgroundColor: "#111111",
        },
      },
      h(Video, {
        src: props.videoSrc,
        muted: props.videoMuted !== false,
        style: {
          width: "100%",
          height: "100%",
          objectFit: props.videoFit || "cover",
          objectPosition: "center",
        },
      })
    ),
    h(
      "div",
      {
        style: {
          flex: 1,
          minHeight: 0,
          padding: "28px 70px 34px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 18,
        },
      },
      h("div", { style: { fontSize: 43, lineHeight: 1.18, fontWeight: 800 } }, props.footerText),
      h("div", { style: { width: 112, height: 5, borderRadius: 8, backgroundColor: "#B18A42" } }),
      h("div", { style: { fontSize: 32, fontWeight: 800, letterSpacing: 2, color: "#A77B32" } }, props.reference)
    ),
    props.voiceSrc ? h(Audio, { src: props.voiceSrc }) : null
  );
}

window.renderReflexaoVideo = async function ({ props, onProgress }) {
  if (!("VideoEncoder" in window) || !("AudioEncoder" in window)) {
    throw new Error("Este navegador não oferece WebCodecs para renderizar MP4. Tente no Chrome atualizado.");
  }
  const supported = await canRenderMediaOnWeb({ videoCodec: "h264", container: "mp4" });
  if (!supported) throw new Error("Este navegador não oferece codificação MP4 compatível.");

  const fps = 30;
  const seconds = Math.max(5, Math.min(180, Number(props.durationSeconds) || 10));
  const composition = {
    id: "ReflexaoBiblicaBrowser",
    component: ReflexaoComposition,
    durationInFrames: Math.ceil(seconds * fps),
    fps,
    width: 1080,
    height: 1920,
    defaultProps: props,
  };
  const result = await renderMediaOnWeb({
    composition,
    inputProps: props,
    container: "mp4",
    videoCodec: "h264",
    videoBitrate: "medium",
    pageResponsiveness: "high",
    onProgress,
  });
  return await result.getBlob();
};

window.dispatchEvent(new Event("reflexao-renderer-ready"));
