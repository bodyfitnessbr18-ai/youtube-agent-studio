import { Config } from "@remotion/cli/config";

// CPU-safe WebGL path for headless cloud rendering. On a desktop with a
// compatible GPU, "angle" may render faster.
Config.setChromiumOpenGlRenderer("swangle");
