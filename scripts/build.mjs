import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDirectory = path.join(projectRoot, "site");
const outputDirectory = path.join(projectRoot, "dist");
const clientDirectory = path.join(outputDirectory, "client");
const serverDirectory = path.join(outputDirectory, "server");

if (!outputDirectory.startsWith(`${projectRoot}${path.sep}`)) {
  throw new Error("Refusing to build outside the project directory.");
}

const html = await readFile(path.join(sourceDirectory, "index.html"), "utf8");
const requiredSeoSignals = [
  '<html lang="fa-IR" dir="rtl">',
  'name="description"',
  'rel="canonical"',
  'property="og:image"',
  'type="application/ld+json"',
  '<meta name="robots"',
];

for (const signal of requiredSeoSignals) {
  if (!html.includes(signal)) {
    throw new Error(`Missing required SEO signal: ${signal}`);
  }
}

if (/(?:\/_next\/|__NEXT_DATA__|data-reactroot|react-dom|next\/script)/i.test(html)) {
  throw new Error("Framework-specific markup was found in the static HTML.");
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(clientDirectory, { recursive: true });
await mkdir(serverDirectory, { recursive: true });
await cp(sourceDirectory, clientDirectory, { recursive: true });

const workerSource = await readFile(
  path.join(projectRoot, "scripts", "sites-worker.mjs"),
  "utf8",
);

await writeFile(path.join(serverDirectory, "index.js"), workerSource, "utf8");
await writeFile(
  path.join(serverDirectory, "wrangler.json"),
  `${JSON.stringify(
    {
      main: "index.js",
      compatibility_date: "2026-07-14",
      assets: {
        directory: "../client",
        binding: "ASSETS",
        html_handling: "none",
        not_found_handling: "none",
      },
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log("Static build created in dist/.");
