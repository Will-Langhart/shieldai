// Serves the current production build locally (config.localPreview) and runs the
// preview browser specs against it, the same specs a Vercel preview must pass.
// Build first, with every flag on (VERCEL_ENV=preview and NEXT_PUBLIC_VERCEL_ENV=preview).
//
//   node .github/claude-agent/scripts/preview-local.mjs [spec paths or playwright flags]
import { spawn } from "node:child_process";
import { cfg } from "./io.mjs";

const { command, port } = cfg.localPreview;
const cwd = cfg.appDir;
const specDir =
  cfg.appDir === "." ? cfg.previewSpecDir : cfg.previewSpecDir.replace(`${cfg.appDir.replace(/\/$/, "")}/`, "");
const base = `http://localhost:${port}`;

const server = spawn("bash", ["-c", command], { cwd, stdio: "inherit", detached: true });
const stop = () => {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
};
process.on("exit", stop);

async function up() {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(`preview server exited with ${server.exitCode}`);
    try {
      await fetch(base);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`nothing answered on ${base} after 120s`);
}

try {
  await up();
} catch (e) {
  console.error(String(e));
  process.exit(1);
}
const args = process.argv.slice(2);
const specs = args.some((a) => !a.startsWith("-")) ? [] : [specDir];
const pw = spawn("npx", ["playwright", "test", ...specs, ...args], {
  cwd,
  stdio: "inherit",
  env: { ...process.env, PLAYWRIGHT_BASE_URL: base },
});
pw.on("exit", (code) => process.exit(code ?? 1));
