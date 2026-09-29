// Ricostruisce public/index.html partendo da src/app.jsx e src/shell.html.
// Uso: npm install && npm run build
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const res = await build({
  entryPoints: ["src/app.jsx"],
  loader: { ".jsx": "jsx" },
  jsx: "transform",
  minify: true,
  target: "es2019",
  write: false,
});
const js = res.outputFiles[0].text;
const shell = readFileSync("src/shell.html", "utf8");
const cut = shell.indexOf('<div id="root">');
const head = shell.slice(0, cut);
const body = shell.slice(cut).replace("/*APP*/", () => js);
const favicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23fbbf24'/%3E%3Cstop offset='.5' stop-color='%23f97316'/%3E%3Cstop offset='1' stop-color='%23dc2626'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='16' cy='16' r='15' fill='url(%23g)'/%3E%3Ccircle cx='16' cy='16' r='5' fill='%23fff'/%3E%3C/svg%3E";
const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Punto Fermo · demo del portale presenze: tablet kiosk di filiale e dashboard di sede per turni, timbrature e foglio ore.">
<meta name="robots" content="noindex">
<link rel="icon" href="${favicon}">
${head}<style>html,body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body}</body>
</html>
`;
mkdirSync("public", { recursive: true });
writeFileSync("public/index.html", html);
console.log(`public/index.html generato (${(html.length / 1024).toFixed(0)} KB)`);
