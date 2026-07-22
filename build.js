import esbuild from "esbuild";
import fs from "fs";

const isWatch = process.argv.includes("--watch");

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DSCD — Deadly Simple Clash Dashboard</title>
<style>__CSS__</style>
</head>
<body>
<div id="app"></div>
<script>__JS__</script>
</body>
</html>`;

async function build() {
  try {
    const result = await esbuild.build({
      entryPoints: ["src/main.ts"],
      bundle: true,
      outfile: "dist/bundle.js",
      target: "es2020",
      format: "iife",
      minify: true,
      write: false,
    });

    const js = result.outputFiles[0].text;
    const css = fs.readFileSync("style.css", "utf-8");
    const html = HTML_TEMPLATE.replace("__CSS__", () => css).replace("__JS__", () => js);

    fs.mkdirSync("dist", { recursive: true });
    fs.writeFileSync("dist/dashboard.html", html, "utf-8");

    const size = (Buffer.byteLength(html) / 1024).toFixed(1);
    console.log(`✓ Built dist/dashboard.html (${size} KB)`);
  } catch (err) {
    console.error("Build failed:", err);
  }
}

if (isWatch) {
  const ctx = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/bundle.js",
    target: "es2020",
    format: "iife",
    plugins: [
      {
        name: "rebuild-callback",
        setup(build) {
          build.onEnd(async () => {
            await recreateHTML();
          });
        },
      },
    ],
  });
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  build();
}

async function recreateHTML() {
  try {
    const js = fs.readFileSync("dist/bundle.js", "utf-8");
    const css = fs.readFileSync("style.css", "utf-8");
    const html = HTML_TEMPLATE.replace("__CSS__", () => css).replace("__JS__", () => js);
    fs.mkdirSync("dist", { recursive: true });
    fs.writeFileSync("dist/dashboard.html", html, "utf-8");
    const size = (Buffer.byteLength(html) / 1024).toFixed(1);
    console.log(`✓ Rebuilt dist/dashboard.html (${size} KB)`);
  } catch (err) {
    console.error("Rebuild failed:", err);
  }
}
