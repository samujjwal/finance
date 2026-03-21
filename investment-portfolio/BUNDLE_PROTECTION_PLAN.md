# Bundle Protection Plan

## Purpose

This plan defines practical steps to reduce casual inspection and tampering of the desktop bundle while acknowledging the core constraint of local software distribution:

- Anything shipped to the user's machine must be treated as recoverable.
- Frontend assets loaded by the webview cannot be made truly secret.
- JavaScript server code bundled with the app can be made harder to inspect, but not impossible to extract.

The goal is therefore not perfect secrecy. The goal is to:

- reduce casual visibility of `dist` and bundled `server` files
- improve tamper resistance and integrity checking
- move sensitive logic out of recoverable JavaScript over time
- define a transition path away from a readable bundled Node server

## Current State

The current desktop package includes:

- React frontend bundle from `dist/`
- NestJS backend bundle under `src-tauri/resources/server/`
- bundled Node.js runtime under `src-tauri/resources/node/`

At runtime the Tauri shell locates and executes the bundled server resources directly. That means both the frontend and server artifacts are available to any local user with filesystem access.

## Threat Model

### In Scope

- casual file browsing of packaged resources
- extraction of readable JavaScript from installer or app bundle
- tampering with bundled server or frontend artifacts
- repackaging or local modification of app resources

### Out of Scope

- determined reverse engineering by a skilled analyst with full device access
- kernel-level or admin-level compromise of the host machine
- protection of secrets that are already shipped locally

## Design Principles

1. Do not ship secrets.
2. Treat local code as inspectable.
3. Use hardening to reduce convenience, not to claim secrecy.
4. Move truly sensitive logic to either:
   - a remote service, or
   - compiled native code with minimal JS exposure.
5. Add integrity checks even when confidentiality is limited.

## Short-Term Actions

Short-term means low-risk changes that fit the current architecture and can be done without redesigning the app.

### 1. Remove Production Source Maps

#### Why

Source maps make the bundle much easier to inspect and reconstruct.

#### Actions

- ensure frontend production builds do not emit source maps
- ensure server production build does not ship source maps
- verify no `.map` files are copied into `src-tauri/resources/server/`

#### Expected Result

- readable code remains extractable, but developer-friendly recovery becomes harder

### 2. Bundle the Server into a Single Minified Artifact

#### Why

The current bundled server is copied as a directory tree of compiled JS plus production dependencies. That is easy to browse.

#### Actions

- replace raw `dist/` copying with a server bundling step using one of:
  - `@vercel/ncc`
  - `esbuild`
- produce one entry artifact for the backend runtime
- minimize and mangle names where safe
- exclude unneeded files from the shipped server resource tree

#### Expected Result

- server logic remains recoverable, but inspection becomes less convenient and less structured

### 3. Strip Unnecessary Bundle Contents

#### Why

A large resource tree leaks structure, dependency details, and internal implementation shape.

#### Actions

- remove development-only files from frontend and server packaging
- remove test files, docs, examples, markdown, and unused Prisma assets from shipped resources
- verify the shipped resource tree contains only runtime essentials

#### Expected Result

- smaller bundle
- less operational detail exposed to the local filesystem

### 4. Add Startup Integrity Verification

#### Why

Hardening is incomplete without tamper detection.

#### Actions

- generate a manifest of checksums for critical bundled artifacts during build
- validate checksums in the Tauri shell before starting the bundled server
- fail closed or show a maintenance error if the bundle is modified unexpectedly

#### Expected Result

- improved resistance against naive file modification and repackaging

### 5. Harden Frontend Output for Production

#### Why

The frontend cannot be hidden, but it can be made less readable.

#### Actions

- confirm Vite production minification is enabled
- avoid shipping diagnostic globals in production
- remove verbose debug logging and internal environment hints from production builds
- review CSP and external connectivity allowances to reduce unnecessary exposure

#### Expected Result

- less readable browser-side code
- smaller surface for accidental disclosure of implementation detail

### 6. Review What Logic Lives in the Bundled Server

#### Why

Short-term hardening should prioritize the highest-value logic.

#### Actions

- inventory sensitive business rules currently implemented in NestJS
- identify logic that is proprietary, security-sensitive, or licensing-sensitive
- classify each rule as:
  - safe to keep local
  - move to native code later
  - move to remote service later

#### Expected Result

- clear prioritization for medium-term migration work

## Medium-Term Actions

Medium-term means structural changes that reduce exposure instead of just obscuring it.

### 1. Reduce or Eliminate the Bundled Node Server

#### Why

The bundled Node server is the largest source of readable, extractable logic.

#### Actions

- identify APIs currently served only for local desktop usage
- move those responsibilities into Tauri Rust commands or a native service layer
- keep only minimal UI-facing orchestration in JavaScript if absolutely necessary
- progressively remove the need to ship a full NestJS runtime locally

#### Expected Result

- most sensitive local logic moves from plain JS to compiled native code
- bundle becomes materially harder to inspect casually

### 2. Move High-Value Logic to Remote Services

#### Why

If logic must remain confidential, it should not ship to the endpoint.

#### Candidate Logic

- proprietary analytics
- premium rules engines
- licensing and entitlement checks
- fraud or anomaly scoring models
- market-specific strategy logic

#### Actions

- define a service boundary for sensitive functions
- expose only narrow APIs to the desktop client
- add auth, rate limiting, and audit for those remote calls

#### Expected Result

- the most valuable logic is no longer recoverable from the desktop bundle

### 3. Introduce Signed Resource Manifests and Release Verification

#### Why

Checksums alone help detect changes, but signatures let the app verify provenance.

#### Actions

- sign the resource manifest during CI/CD
- embed public-key verification in the Tauri shell
- validate signature before loading critical resources

#### Expected Result

- stronger tamper detection
- better release trust guarantees

### 4. Encrypt Selected Local Assets Only as a Delay Mechanism

#### Why

Encryption at rest inside the app bundle does not create true secrecy, but it can slow opportunistic inspection.

#### Actions

- if used at all, apply only to small high-value artifacts
- decrypt only in memory at runtime
- avoid blanket encryption of the whole bundle

#### Caveat

- the key path still exists locally, so this is only a friction mechanism

#### Expected Result

- minor increase in effort for casual extraction, not real confidentiality

### 5. Add Tamper Response Policy

#### Why

Detection without response leaves the system ambiguous.

#### Actions

- define what the app does on manifest mismatch:
  - block startup
  - restrict to read-only mode
  - show explicit integrity warning
- log integrity failures for support diagnostics

#### Expected Result

- predictable behavior when local resources are modified

### 6. Revisit Desktop Architecture

#### Why

If the app remains desktop-first, the architecture should minimize recoverable code by design.

#### Candidate End States

- Tauri frontend + Rust-native business logic + SQLite
- Tauri frontend + minimal native bridge + remote backend for sensitive operations
- hybrid model where commodity CRUD stays local, proprietary logic moves remote

#### Expected Result

- clearer long-term architecture aligned with actual protection goals

## Recommended Implementation Order

### Phase 1: Immediate Hardening

1. disable source maps for production frontend and server builds
2. strip unnecessary files from shipped resources
3. bundle the server into a single minimized artifact
4. add checksum manifest generation and startup verification

### Phase 2: Architecture Reduction of Readable Logic

1. classify sensitive server logic
2. move highest-value local logic into Rust or remote services
3. reduce or remove the full bundled NestJS runtime

### Phase 3: Integrity and Release Maturity

1. sign resource manifests in CI/CD
2. enforce release verification in app startup
3. define tamper response and support workflow

## Success Criteria

### Short-Term Success

- no production source maps shipped
- bundled server no longer shipped as an easy-to-browse raw directory tree
- resource tree materially reduced in readability and size
- checksum verification blocks or flags modified resources

### Medium-Term Success

- highest-value business logic is no longer present as shipped JavaScript
- bundled Node dependency footprint is significantly reduced or removed
- app can verify signed release integrity at startup

## Non-Negotiable Rule

Never rely on bundle obfuscation to protect secrets. If a secret or algorithm must remain confidential, do not ship it in `dist`, `server`, or any local resource.