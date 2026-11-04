import React from "react";
import { useCurrentFrame } from "remotion";

type Props = { text: string; durationInFrames: number; accent?: string };

export const WordCaption: React.FC<Props> = ({ text, durationInFrames, accent = "#f47a20" }) => {
  const frame = useCurrentFrame();
  const words = text.trim().split(/\\s+/).filter(Boolean);
  if (!words.length) return null;

  // Estimate word timing by word length and punctuation pauses.
  // This is a visual estimate; exact phoneme alignment requires timestamp data from the TTS provider.
  const weights = words.map((word) => {
    const punctuation = /[.!?…,:;]$/.test(word) ? 0.45 : 0;
    return Math.max(1, word.replace(/[^\\p{L}\\p{N}]/gu, "").length * 0.72) + punctuation;
  });
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const progress = Math.min(0.999, Math.max(0, frame / Math.max(1, durationInFrames)));
  let cursor = 0;
  let active = 0;
  for (let i = 0; i < weights.length; i++) {
    cursor += weights[i] / totalWeight;
    if (progress < cursor) { active = i; break; }
    active = i;
  }

  return (
    <div style={{ position: "absolute", bottom: "5%", left: "6%", right: "6%", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "7px 9px", padding: "18px 22px", borderRadius: 18, background: "rgba(5,8,13,.82)", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 12px 35px rgba(0,0,0,.25)" }}>
      {words.map((word, index) => {
        const isActive = index === active;
        const isPast = index < active;
        return (
          <span key={index} style={{ color: isActive ? "#151515" : isPast ? "#ffffff" : "rgba(255,255,255,.58)", background: isActive ? accent : "transparent", borderRadius: 6, padding: isActive ? "3px 7px" : "3px 0", fontSize: "clamp(19px,2.4vw,34px)", lineHeight: 1.2, fontWeight: isActive ? 900 : 700, transform: isActive ? "scale(1.06)" : "scale(1)", transition: "none" }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};
