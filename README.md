# starknet-dev-toolkit

## Purpose

This library exists to support smart contract developers working on our
contracts and tests. It is not intended for dapp usage or third-party
integration, and we do not provide support or encourage external adoption.

## Web / browser

Not fully supported but some things might work. For Vite (and similar bundlers), use the two helpers from `browser-shims/alias`:

- `getNodeShimAliases()` aliases Node built-ins (`fs`, `path`, `crypto`, `child_process`) to browser shims so the bundle compiles.
- `getEnvDefines()` injects your env vars into the toolkit's `process.env` references at build time so `manager`/`deployer` initialize correctly.

```ts
import { getEnvDefines, getNodeShimAliases } from "starknet-dev-toolkit/browser-shims/alias";

export default defineConfig({
  define: getEnvDefines(),
  resolve: { alias: getNodeShimAliases() },
  // ...
});
```

Map your framework's env var names (e.g. SvelteKit's `PUBLIC_*`) to the toolkit's `RPC_URL`, `ADDRESS`, and `PRIVATE_KEY`. The config file runs in Node so `process.env` works there. Vite/SvelteKit loads `.env` before evaluating the config.

For non-Vite setups you can still call `setEnvProvider(() => ({ nodeUrl: "...", allowRpcUrlEnv: true, ... }))` before importing modules that use `manager`/`deployer`.

## Consume the library

Install from a git tag (no registry):

```
pnpm add argentlabs/starknet-dev-toolkit.git#vX.Y.Z
```

## Publish a release (library maintainers)

1. Update `version` in `package.json`.
2. Build and tag:

```
pnpm build
git tag vX.Y.Z
git push origin vX.Y.Z
```

## Local development

1. In the consumer's `package.json`, point to your local checkout using `file:`:

```json
"starknet-dev-toolkit": "file:../dev-toolkit"
```

Then run `pnpm install --no-frozen-lockfile`.

Do **not** use `pnpm add --link`. With `link:`, pnpm creates a symlink and each project keeps its own `node_modules`, which causes duplicate module instances (e.g. `chai` gets loaded twice and plugins like `chai-as-promised` break). `file:` goes through pnpm's normal resolution so peer dependencies are deduplicated correctly.

2. In this repo, run the watch build:

```
pnpm build:watch
```

Changes compile into `dist/` within seconds. Source maps are emitted; enable
sourcemaps in your runtime/bundler to debug into the original TypeScript.

3. `file:` uses hard links, so edits to existing files in `dist/` are reflected automatically. If you add or delete files, re-run `pnpm install` in the consumer to pick them up.
