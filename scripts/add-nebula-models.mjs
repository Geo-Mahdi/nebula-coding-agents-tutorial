// Adds every Nebula model you can use to your opencode config.
// Works on Ubuntu, macOS and Windows with Node.js 18 or newer:
//   node add-nebula-models.mjs
// It reads the key from your config (or from NEBULA_API_KEY if the config
// uses {env:NEBULA_API_KEY}), keeps names you already gave, and never prints the key.
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const path = process.argv[2] || join(homedir(), ".config", "opencode", "opencode.json");
const cfg = JSON.parse(readFileSync(path, "utf8"));
const nebula = cfg.provider.nebula;
let key = nebula.options.apiKey;
if (key.startsWith("{env:")) key = process.env[key.slice(5, -1)] || "";
const url = nebula.options.baseURL.replace(/\/+$/, "") + "/models";
const res = await fetch(url, { headers: { Authorization: "Bearer " + key } });
if (!res.ok) {
  console.error(`Nebula answered HTTP ${res.status}. HTTP 401 means the key is wrong.`);
  process.exit(1);
}
const ids = [...new Set((await res.json()).data.map((m) => m.id))].sort();
const old = nebula.models || {};
nebula.models = Object.fromEntries(ids.map((id) => [id, old[id] || {}]));
writeFileSync(path, JSON.stringify(cfg, null, 2) + "\n");
console.log(`Wrote ${ids.length} models to ${path}`);
