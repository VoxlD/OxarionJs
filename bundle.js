import dts from "bun-plugin-dts";
import { rename, rmdir } from "fs/promises";

// Remove the dist folder
await rmdir("./dist", { recursive: true }).catch(() => {});

const options = {
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  splitting: true,
  target: "bun",
  minify: true,
  plugins: [dts()],
  sourcemap: false,
};

// Generate ESM
const esm_res = await Bun.build({
  ...options,
  format: "esm",
});

// Rename .js output to .mjs for ESM
if (esm_res.outputs)
  for (const output of esm_res.outputs) {
    if (output.path.endsWith(".js")) {
      const mjs = output.path.replace(/\.js$/, ".mjs");
      await rename(output.path, mjs);
    }
  }

// Generate CJS
await Bun.build({
  ...options,
  format: "cjs",
});
