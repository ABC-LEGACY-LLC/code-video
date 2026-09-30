#!/usr/bin/env node
// Written by `labs rooms init` — do not edit; run init again to renew. Runs the Labs repository CLI at
// the version the catalog publishes now (npx keeps a tarball it fetched once, so a fixed link would
// run yesterday's CLI forever; `index.json` names today's).
import { spawnSync } from "node:child_process";
const LABS = "https://labs.abclegacyllc.com";
let url = LABS + "/cli.tgz";
try { const j = await (await fetch(LABS + "/index.json", { signal: AbortSignal.timeout(8000) })).json(); if (typeof j.site?.cli === "string") url = j.site.cli; } catch { /* the fixed link, then */ }
const r = spawnSync("npx", ["-y", url, ...process.argv.slice(2)], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(r.status ?? 1);
