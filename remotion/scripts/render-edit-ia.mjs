import { spawnSync } from "node:child_process";

const allowed = new Set(["EditIAVertical", "EditIALandscape", "EditIASquare"]);
const requested = process.argv.slice(2).find((arg) => arg.startsWith("--composition="));
const composition = requested ? requested.split("=")[1] : "EditIAVertical";
if (!allowed.has(composition)) {
  console.error("Composição inválida. Use EditIAVertical, EditIALandscape ou EditIASquare.");
  process.exit(1);
}
const args = [
  "remotion", "render", "src/index.ts", composition, "out/edit-ia.mp4",
  "--props-file=public/edit-ia-project.json", "--gl=swangle"
];
const result = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
