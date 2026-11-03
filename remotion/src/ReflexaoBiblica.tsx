import React from "react";
import { AbsoluteFill, Audio, Video } from "remotion";

export type ReflexaoBiblicaProps = {
  videoSrc: string;
  headline: string;
  subtitle: string;
  footerText: string;
  reference: string;
  voiceSrc?: string;
  videoMuted?: boolean;
  videoFit?: "cover" | "contain";
  durationSeconds: number;
};

export const ReflexaoBiblica: React.FC<ReflexaoBiblicaProps> = ({
  videoSrc,
  headline,
  subtitle,
  footerText,
  reference,
  voiceSrc,
  videoMuted = true,
  videoFit = "cover",
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: "#FFFFFF",
      color: "#111111",
      fontFamily: "Arial, Helvetica, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
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
      }}
    >
      <div style={{ fontSize: 58, lineHeight: 1.14, fontWeight: 800 }}>
        {headline}
      </div>
      {subtitle ? (
        <div style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 500, color: "#333333" }}>
          {subtitle}
        </div>
      ) : null}
    </div>

    <div
      style={{
        height: "55%",
        width: "100%",
        flexShrink: 0,
        overflow: "hidden",
        backgroundColor: "#111111",
      }}
    >
      {videoSrc ? (
        <Video
          src={videoSrc}
          muted={videoMuted}
          style={{ width: "100%", height: "100%", objectFit: videoFit, objectPosition: "center" }}
        />
      ) : (
        <AbsoluteFill style={{ backgroundColor: "#eeeeee", justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 42, color: "#777777" }}>Adicione seu vídeo</div>
        </AbsoluteFill>
      )}
    </div>

    <div
      style={{
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
      }}
    >
      <div style={{ fontSize: 43, lineHeight: 1.18, fontWeight: 800 }}>
        {footerText}
      </div>
      <div style={{ width: 112, height: 5, borderRadius: 8, backgroundColor: "#B18A42" }} />
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 2, color: "#A77B32" }}>
        {reference}
      </div>
    </div>

    {voiceSrc ? <Audio src={voiceSrc} /> : null}
  </AbsoluteFill>
);
