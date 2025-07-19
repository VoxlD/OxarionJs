import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    entry: "src/index.ts",
  },
  splitting: false,
  skipNodeModulesBundle: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
  shims: true,
});
