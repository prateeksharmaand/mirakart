import type { Config } from "tailwindcss";
import clotyaPreset from "@mirakart/config/tailwind-preset";

const config: Config = {
  presets: [clotyaPreset as Config],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
