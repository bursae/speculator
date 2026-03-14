const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");

const ctxOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  platform: "node",
  outfile: "dist/extension.js",
  external: ["vscode"],
  sourcemap: true,
  target: "node18"
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(ctxOptions);
    await ctx.watch();
    return;
  }

  await esbuild.build(ctxOptions);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
