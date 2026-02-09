# starknet-dev-toolkit

## Purpose

This library exists to support smart contract developers working on our
contracts and tests. It is not intended for dapp usage or third-party
integration, and we do not provide support or encourage external adoption.

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

## Local development (linking)

1. In the consumer repo, link to use the local checked out `starknet-dev-toolkit`:

```
pnpm add --link ../starknet-dev-toolkit
```

2. In this repo, run the watch build:

```
pnpm build:watch
```

Changes compile into `dist/` within seconds. Source maps are emitted; enable
sourcemaps in your runtime/bundler to debug into the original TypeScript.
