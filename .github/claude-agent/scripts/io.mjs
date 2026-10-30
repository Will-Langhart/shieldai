// Shared I/O for the agent scripts: config, GitHub REST, Actions outputs.
// Node 20+ (global fetch), no dependencies.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import cfg from "../config.mjs";

export { cfg };

export const REPO = process.env.GITHUB_REPOSITORY ?? "";
export const OWNER = REPO.split("/")[0] ?? "";
export const TOKEN = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
export const RUN_URL = `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${REPO}/actions/runs/${process.env.GITHUB_RUN_ID ?? ""}`;
export const BOT = "github-actions[bot]";

export async function gh(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? undefined : res.json();
}

export async function ghAll(path, maxPages = 10) {
  const out = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; page <= maxPages; page++) {
    const batch = await gh(`${path}${sep}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

/** Login of whoever last added `label` to issue `n`, or "". */
export async function labeledBy(n, label) {
  const events = await ghAll(`/repos/${REPO}/issues/${n}/events`);
  const hits = events.filter((e) => e.event === "labeled" && e.label?.name === label);
  return hits.at(-1)?.actor?.login ?? "";
}

export const trusted = (login) =>
  login.toLowerCase() === OWNER.toLowerCase() || login === BOT;

export function output(name, value) {
  const out = process.env.GITHUB_OUTPUT;
  const text = String(value);
  if (out) {
    if (text.includes("\n")) appendFileSync(out, `${name}<<EOF_${name}\n${text}\nEOF_${name}\n`);
    else appendFileSync(out, `${name}=${text}\n`);
  }
  console.log(`${name}=${text}`);
}

export function summary(text) {
  const out = process.env.GITHUB_STEP_SUMMARY;
  if (out) appendFileSync(out, `${text}\n`);
  console.log(text);
}

export function run(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32e6, ...opts });
  } catch (e) {
    return `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
}

export const readText = (path) => (existsSync(path) ? readFileSync(path, "utf8") : "");
