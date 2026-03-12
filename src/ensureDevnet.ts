import { spawnSync } from "node:child_process";
import { join } from "node:path";

export interface EnsureDevnetOptions {
  cwd?: string;
  imageTag?: string;
  containerName?: string;
  port?: string;
  rpcUrlEnv?: string;
  defaultRpcUrl?: string;
  loadDotenv?: boolean;
  forkRpcUrlEnv?: string;
  rm?: boolean;
  dockerBuildExtraArgs?: string[];
  dockerRunExtraArgs?: string[];
}

const DEFAULT_RPC_URL = "http://127.0.0.1:5050";

function isLocalDevnetUrl(url: string): boolean {
  return url.startsWith("http://127.0.0.1:") || url.startsWith("http://localhost:");
}

async function isDevnetAlive(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500);
  try {
    const res = await fetch(`${baseUrl}/is_alive`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function run(cwd: string, cmd: string, args: string[]): void {
  const result = spawnSync(cmd, args, { stdio: "inherit", cwd });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function canTalkToDocker(): boolean {
  const result = spawnSync("docker", ["info"], { stdio: "ignore" });
  return result.status === 0;
}

async function startDockerDesktopIfNeeded(): Promise<boolean> {
  if (canTalkToDocker()) return true;
  if (process.platform !== "darwin") return false;

  spawnSync("open", ["-a", "Docker"], { stdio: "ignore" });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (canTalkToDocker()) return true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

export async function ensureDevnet(options: EnsureDevnetOptions = {}): Promise<void> {
  const {
    cwd = process.cwd(),
    imageTag = "devnet",
    containerName = "devnet",
    port = "127.0.0.1:5050:5050",
    rpcUrlEnv = "RPC_URL",
    defaultRpcUrl = DEFAULT_RPC_URL,
    loadDotenv = false,
    forkRpcUrlEnv,
    rm = true,
    dockerBuildExtraArgs = [],
    dockerRunExtraArgs = [],
  } = options;

  if (loadDotenv || forkRpcUrlEnv) {
    const { config } = await import("dotenv");
    config({ path: join(cwd, ".env") });
  }

  const rpcUrl = process.env[rpcUrlEnv] || defaultRpcUrl;
  if (!isLocalDevnetUrl(rpcUrl)) {
    return;
  }

  if (await isDevnetAlive(rpcUrl)) return;

  if (!(await startDockerDesktopIfNeeded())) {
    throw new Error(
      [
        "Docker is installed but the Docker daemon is not running.",
        "Start Docker Desktop (or your Docker daemon) and re-run the tests,",
        "or set RPC_URL to a reachable Starknet RPC (to avoid using docker).",
      ].join(" "),
    );
  }

  if (forkRpcUrlEnv) {
    const forkRpcUrl = process.env[forkRpcUrlEnv];
    if (!forkRpcUrl) {
      throw new Error(`${forkRpcUrlEnv} env var is required to build the devnet image. See .env.template.`);
    }
  }

  const buildArgs = ["build", "-t", imageTag];
  if (forkRpcUrlEnv && process.env[forkRpcUrlEnv]) {
    buildArgs.push("--build-arg", `${forkRpcUrlEnv}=${process.env[forkRpcUrlEnv]}`);
  }
  buildArgs.push(...dockerBuildExtraArgs, ".");
  run(cwd, "docker", buildArgs);

  const runArgs = ["run", "-d"];
  if (containerName) {
    runArgs.push("--name", containerName);
  }
  if (rm) {
    runArgs.push("--rm");
  }
  runArgs.push("-p", port, ...dockerRunExtraArgs, imageTag);

  try {
    run(cwd, "docker", runArgs);
  } catch {
    // ignore
  }

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isDevnetAlive(rpcUrl)) return;
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`Devnet did not become ready at ${rpcUrl} (expected GET /is_alive to succeed).`);
}
