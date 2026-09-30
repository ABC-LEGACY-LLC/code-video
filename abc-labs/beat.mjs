#!/usr/bin/env node
// Written by `labs rooms init` — do not edit; run init again to renew. Every Claude Code hook in this
// repository reports a beat to the Labs workspace: the event, the tool's name and a path inside this
// repository, nothing else. Silent when there is no token (LABS_PROJECT_TOKEN in .env, never committed).
import { readFileSync } from "node:fs";
import { isAbsolute, relative } from "node:path";
const WORKSPACE = "https://workspace.labs.abclegacyllc.com";
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
let token = process.env.LABS_PROJECT_TOKEN;
if (!token) { try { token = /^LABS_PROJECT_TOKEN=(.+)$/m.exec(readFileSync(root + "/.env", "utf8"))?.[1]?.trim().replace(/^(["'])(.*)\1$/, "$2"); } catch { /* no .env */ } }
if (!token) process.exit(0);
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { raw += c; });
process.stdin.on("end", async () => {
  let ev; try { ev = JSON.parse(raw); } catch { process.exit(0); }
  const rel = (p) => (typeof p === "string" ? (isAbsolute(p) ? relative(root, p) : p) : undefined);
  const event = { session_id: ev.session_id, hook_event_name: ev.hook_event_name, tool_name: ev.tool_name, notification_type: ev.notification_type, reason: ev.reason, tool_input: ev.tool_input ? { file_path: rel(ev.tool_input.file_path), notebook_path: rel(ev.tool_input.notebook_path), path: rel(ev.tool_input.path) } : undefined };
  try { await fetch(WORKSPACE + "/api/beat", { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify({ event }), signal: AbortSignal.timeout(5000) }); } catch { /* the floor is not the session's problem */ }
  process.exit(0);
});
setTimeout(() => process.exit(0), 8000).unref();
