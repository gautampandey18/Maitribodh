# Cloudflare Native Enterprise Guidelines

## Metadata

| Field | Value |
|---|---|
| Document_Title | Cloudflare Native Enterprise Guidelines |
| Document_Type | ADLC Support Reference — Non-Phase-Gated |
| Platform_Target | Cloudflare |
| Project_Name | {{Project_Name}} |
| Execution_Mode | {{Execution_Mode}} |
| Account_Tier | {{Account_Tier — Free / Pro / Business / Enterprise}} |
| Primary_Zone | {{primary-domain.com}} |
| Cloudflare_Account_ID | {{Account_ID}} |
| Document_Version | {{1.0}} |
| Date | {{YYYY-MM-DD}} |
| Owner | {{Owner_Name}} |
| ADLC_References | 04_Target_Solution_Architecture, 05_Technology_Engineering_And_Design, 08_Release_Operations_And_Governance |

---

## Purpose

Instruction: Use this file as the canonical Cloudflare-native engineering reference for any project deploying to or primarily consuming Cloudflare services. This document is platform-specific and general-purpose — it contains no project-specific business logic, requirements, or data. Apply it alongside ADLC artifacts 04 (Architecture), 05 (Technology and Design), and 08 (Release and Governance) as a platform standards supplement.

| Intent | Detail |
|---|---|
| Primary Use | Provide authoritative Cloudflare product selection, configuration, naming, security, observability, and delivery guidelines reusable across any project |
| Scope | Frontend (Pages), backend (Workers), storage (KV / D1 / R2 / Durable Objects / Hyperdrive / Vectorize), async messaging (Queues / Cron / Email), security (WAF / ZT / DDoS / RL / Bot / API Shield), AI (AI Gateway / Workers AI), performance (Cache/Transform/Redirect Rules), observability (Logpush / Analytics Engine / Tail Workers), CI/CD (Wrangler / GitHub Actions / Workers Builds), local development, DNS, multi-account architecture, cost, compliance |
| Explicit Exclusions | ML model lifecycle management, non-Cloudflare cloud infrastructure (AWS / Azure / GCP specific guidance), business logic, data models, user requirements |
| Relationship to ADLC | This file does not replace any numbered artifact. Architecture decisions made using this reference must be recorded in 04_Target_Solution_Architecture. Technology stack choices must be recorded in 05_Technology_Engineering_And_Design. Governance and compliance evidence must be recorded in 08_Release_Operations_And_Governance. |
| Audience | Solution architects, backend engineers, frontend engineers, DevSecOps engineers, platform teams |

---

## Cloudflare Product Coverage Matrix

Instruction: Use this matrix as a quick reference for which Cloudflare products are in scope, whether they require an Enterprise plan, and which ADLC artifact should record decisions about them. Update the `{{In_Scope}}` column per project.

| Product | Category | Free Tier | Business Tier | Enterprise Required | ADLC Artifact Reference | In_Scope |
|---|---|---|---|---|---|---|
| Workers | Compute | Yes (100K req/day) | Yes | For Unbound / Workers for Platforms | 04, 05, 09 | {{Yes / No}} |
| Pages | Frontend Hosting | Yes | Yes | No | 04, 05, 09 | {{Yes / No}} |
| Workers KV | Edge Key-Value Store | Yes (100K reads/day) | Yes | No | 04, 05 | {{Yes / No}} |
| D1 | Edge Relational DB (SQLite) | Yes (5M rows/day) | Yes | No | 04, 05, 12 | {{Yes / No}} |
| R2 | Object Storage | Yes (10 GB storage) | Yes | No | 04, 05 | {{Yes / No}} |
| Durable Objects | Stateful Edge Coordination | No | Yes | No | 04, 05 | {{Yes / No}} |
| Hyperdrive | External DB Connection Pooling | No | Yes | No | 04, 05 | {{Yes / No}} |
| Vectorize | Vector Database | No | Yes | No | 04, 05 | {{Yes / No}} |
| Queues | Async Messaging | No | Yes | No | 04, 05 | {{Yes / No}} |
| Cron Triggers | Scheduled Workers | Yes | Yes | No | 05 | {{Yes / No}} |
| Email Workers | Email Routing and Processing | Yes | Yes | No | 04, 05 | {{Yes / No}} |
| Zero Trust / Access | Identity-Aware Proxy | Yes (up to 50 users) | Yes | For full device posture | 04, 08 | {{Yes / No}} |
| Cloudflare Tunnel | Private Network Connectivity | Yes | Yes | No | 04, 08 | {{Yes / No}} |
| WAF | Web Application Firewall | Partial (free ruleset) | Yes | For Advanced WAF | 04, 08 | {{Yes / No}} |
| DDoS Protection | Network and App Layer DDoS | Yes (always-on) | Yes | For Advanced DDoS | 04, 08 | {{Yes / No}} |
| Rate Limiting | Request Rate Controls | No | Yes | No | 04, 08 | {{Yes / No}} |
| Bot Management | Automated Traffic Detection | No | No | Yes | 04, 08 | {{Yes / No}} |
| API Shield | API Discovery and Schema Validation | No | No | Yes | 04, 08 | {{Yes / No}} |
| Page Shield | Client-Side Security | Partial | Yes | For full SRI/CSP | 04, 08 | {{Yes / No}} |
| Turnstile | CAPTCHA-Free Challenge | Yes | Yes | No | 04, 05 | {{Yes / No}} |
| AI Gateway | LLM Routing and Caching | Yes | Yes | No | 04, 05 | {{Yes / No}} |
| Workers AI | Serverless Inference | Yes (10K neurons/day) | Yes | No | 04, 05 | {{Yes / No}} |
| Logpush | Structured Log Export | No | Yes | No | 05, 08 | {{Yes / No}} |
| Analytics Engine | Custom Metrics and SQL Queries | No | Yes | No | 05, 08 | {{Yes / No}} |
| Web Analytics | Privacy-First Real User Monitoring | Yes | Yes | No | 08 | {{Yes / No}} |
| Cache Rules | Edge Caching Configuration | Yes | Yes | No | 05 | {{Yes / No}} |
| Transform Rules | URL Rewrite and Header Modification | Yes | Yes | No | 05 | {{Yes / No}} |
| Redirect Rules | Dynamic Redirects | Yes | Yes | No | 05 | {{Yes / No}} |
| Workers Builds | Cloudflare-Native CI/CD | No | Yes | No | 08 | {{Yes / No}} |
| Workers for Platforms | Multi-Tenant Worker Dispatch | No | No | Yes | 04, 05 | {{Yes / No}} |
| Image Resizing | On-the-Fly Image Optimization | No | Yes | No | 05 | {{Yes / No}} |

---

## Architecture Patterns

Instruction: Use this section to select a reference architecture pattern before choosing individual Cloudflare products. Each pattern represents a validated, production-ready Cloudflare-native stack composition. Record the selected pattern in 04_Target_Solution_Architecture under Architecture Decisions. Patterns may be combined.

### Common Cloudflare-Native Stack Blueprints

| Pattern | Use Case | Core Products | Optional Extensions |
|---|---|---|---|
| Full-Stack Web Application | SaaS, internal tools, customer portals with UI + API + data | Pages (frontend) + Workers (API) + D1 (relational data) + R2 (assets/uploads) + KV (sessions/cache) | Durable Objects (realtime/WebSocket), Queues (async jobs), Zero Trust (auth), Turnstile (forms) |
| API-Only Backend | Headless services, microservices, third-party integrations | Workers (API routes) + D1 or Hyperdrive (data) + KV (cache) | Queues (event processing), Email Workers (notifications), Vectorize (semantic search) |
| Edge CDN and Static Sites | Marketing sites, documentation, landing pages | Pages (static hosting) + Cache Rules + R2 (media) | Image Resizing, Polish, Transform Rules, Redirect Rules |
| AI-Native Application | LLM-powered features, RAG chatbots, embeddings-based search | Workers (orchestration) + AI Gateway (routing) + Workers AI (inference) + Vectorize (vector search) + D1 (metadata) + R2 (documents) | Queues (async inference jobs), Analytics Engine (usage tracking) |
| Data Pipeline / Event Processing | Async ingestion, background jobs, scheduled ETL | Workers (processors) + Queues (event bus) + Cron Triggers (schedulers) + D1 (state) + R2 (output) | Logpush (audit trail), Analytics Engine (metrics), Hyperdrive (external DB sync) |
| Real-Time Collaboration | WebSocket servers, live cursors, presence, multiplayer | Workers + Durable Objects (WebSocket Hibernation) + KV (shared state) | Queues (broadcast fan-out), D1 (persistence), Analytics Engine (session metrics) |
| Multi-Tenant SaaS Platform | Per-customer logic isolation, custom domains, tenant routing | Workers for Platforms (dispatch Worker) + D1 (per-tenant data) + R2 (per-tenant storage) + Cloudflare Access (tenant auth) | Durable Objects (per-tenant state), Vectorize (per-tenant embeddings), Logpush (per-tenant audit) |
| Hybrid Origin Offload | Existing origin server protected and accelerated by Cloudflare | WAF + Cache Rules + Transform Rules + Cloudflare Tunnel (origin connectivity) + Rate Limiting | Bot Management, API Shield, DDoS override rules, Zero Trust |

### When to Choose Cloudflare-Native

| Criterion | Cloudflare-Native Advantage | Consider Alternatives When |
|---|---|---|
| Latency requirements | Sub-10ms global P99 at the edge via 300+ PoPs | Application requires stateful in-region compute with complex session affinity |
| Egress cost sensitivity | R2 has zero egress fees; Workers have no data transfer billing | Workload transfers many TB/month to multiple non-Cloudflare destinations |
| Team size and ops burden | Zero infrastructure management, no VMs, no Kubernetes | Team has deep Kubernetes expertise and existing GitOps pipelines they cannot migrate |
| Security posture | WAF, DDoS, Zero Trust, Bot Management, API Shield in one control plane | Compliance mandate requires FedRAMP or sovereign-cloud-specific infrastructure |
| AI inference | Workers AI provides GPU inference at the edge with no cold start | Model requires fine-tuning pipelines, custom CUDA kernels, or >100B parameter models |
| Relational data | D1 is suitable for read-heavy SQLite workloads up to multi-GB | Application requires multi-writer relational DB, >10GB active dataset, or complex stored procedures |

---

## Storage Technology Selection Matrix

Instruction: Use this matrix as the primary decision guide before selecting any Cloudflare storage product. Do not select a product based on familiarity alone — match the use case and consistency model columns first. Record the selection rationale in 04_Target_Solution_Architecture under Data Architecture and Governance. Multiple products are expected to coexist in a single project.

| Storage Product | Best For | Consistency Model | Max Object / Row Size | Max Storage (Paid) | Anti-Patterns — Do Not Use When |
|---|---|---|---|---|---|
| **KV (Key-Value)** | Session tokens, feature flags, edge configuration, A/B test assignments, cached API responses | Eventually consistent — up to 60 seconds global propagation. Reads after writes may be stale. | Value: 25 MB; Metadata: 1 KB | Unlimited keys, unlimited storage | Requires strong read-after-write consistency; financial or transactional data; high-volume small random writes (use D1 instead); relationships between records |
| **D1 (SQLite at edge)** | Relational application data, user records, content management, product catalogs, audit logs | Strongly consistent writes to primary; read replicas (Sessions API) are eventually consistent | Row: no hard limit; DB size up to 10 GB (paid) | 10 GB per database | Multi-writer concurrent update workloads; > 10 GB active dataset; complex stored procedures or triggers; geographically distributed writes with strong consistency |
| **R2 (Object Storage)** | File uploads, media assets, static build artifacts, ML model blobs, backups, log archives | Strongly consistent per-object (S3-compatible) | Object: 5 TB (multipart); single PUT: 5 GB | Unlimited | Per-record structured queries; small frequent updates; transactional workloads; data requiring SQL joins |
| **Durable Objects** | WebSocket servers, distributed locks, per-user or per-session coordination, rate limiter state, CRDT-based collaboration | Strictly serialized within a single DO instance; cross-instance coordination requires explicit messaging | Storage per instance: 10 GB | 10 GB per DO instance | High-throughput stateless request handling (use Workers instead); bulk reads/writes across many instances (use D1 or KV instead); geographic fan-out without Durable Object routing |
| **Hyperdrive** | Connection pooling to existing external Postgres, MySQL, or compatible databases (Neon, Supabase, PlanetScale, Aiven) | Delegated to the external database — inherits its consistency guarantees | N/A — pass-through | N/A — storage is on external DB | Greenfield projects with no existing external DB (use D1 instead); read-only caching of static data (use KV instead); non-SQL databases |
| **Vectorize** | Semantic search, RAG pipelines, recommendation engines, similarity matching, embeddings storage | Eventually consistent — index updates may take seconds to propagate | Vector dimensions: up to 1536 (e.g., text-embedding-3-small); metadata: 10 KB | 5M vectors per index (paid) | Exact-match lookups (use D1 or KV); structured relational queries; transactional data; high-cardinality filtering without metadata pre-filtering |

### Storage Composition Guide

| Application Type | Recommended Combination | Notes |
|---|---|---|
| Standard web app | D1 (application data) + R2 (file uploads) + KV (sessions/cache) | Default starting point |
| Real-time / collaborative | D1 + R2 + KV + Durable Objects (WebSocket state) | Add DO only where serialized coordination is needed |
| AI / RAG app | D1 (metadata) + R2 (documents) + Vectorize (embeddings) + KV (LLM response cache) | Vectorize indexes must be kept in sync with D1 records via Workers |
| External DB migration | Hyperdrive (existing DB bridge) + KV (hot cache) + R2 (blobs) | Phase out Hyperdrive as data is migrated to D1 |
| Event-driven data pipeline | Queues (ingestion) + D1 (state tracking) + R2 (output artifacts) | Cron Triggers for scheduled reconciliation |

---

## Workers & Pages

Instruction: Apply the standards in this section to all Cloudflare Workers and Pages deployments. Workers handle server-side compute and API logic. Pages handles frontend hosting (static, SSR, or hybrid). All new code must use the ES Module syntax — Service Worker syntax is deprecated and must not be used in new projects. Record the chosen framework adapter and routing strategy in 05_Technology_Engineering_And_Design under Target Technology Stack.

### Worker Syntax and Module Standards

| Standard | Required Practice | Anti-Pattern |
|---|---|---|
| Syntax | Use ES Module syntax (`export default { fetch, scheduled, queue, email }`) | Do not use Service Worker `addEventListener('fetch', ...)` syntax in new code |
| TypeScript | Use TypeScript with `wrangler types` to generate binding type definitions | Untyped bindings — increases runtime error risk |
| Compatibility Date | Set `compatibility_date` to a date within the last 6 months from project start; do not use a date more than 12 months old | Leaving `compatibility_date` unset defaults to an old runtime with missing APIs |
| Module Bundling | Use `wrangler build` (esbuild under the hood) for bundling; declare `format = "esm"` in wrangler.toml | CommonJS-only packages that cannot be transpiled — evaluate polyfills or alternatives |
| Node.js Compat | Add `node_compat = true` in wrangler.toml only when required by a dependency; audit every use | Enabling `node_compat` increases bundle size and may expose polyfill edge cases |

### Worker Runtime Limits

| Limit | Free / Bundled | Paid (Workers Unbound) | Enterprise | Notes |
|---|---|---|---|---|
| CPU Time per Request | 10 ms | 30 seconds | 30 seconds | CPU time, not wall-clock time; awaiting I/O does not count |
| Memory per Worker | 128 MB | 128 MB | 128 MB | Shared across all in-flight requests on the same isolate |
| Script Size (compressed) | 1 MB | 10 MB | 10 MB | Including all bundled dependencies |
| Subrequests per Request | 50 | 1000 | 1000 | fetch() calls, KV ops, D1 queries, etc. |
| Outbound TCP Connections | Not available | connect() API available | Available | Use `connect()` from `cloudflare:sockets` for raw TCP |
| Worker Startup Time | < 5 ms (isolate reuse) | < 5 ms | < 5 ms | No cold starts in the traditional VM sense; isolate warm-up applies |
| Execution Wall Time | 30 seconds | 15 minutes (Cron) | 15 minutes (Cron) | Cron Triggers allow longer execution than HTTP requests |

### Environment Bindings Reference

| Binding Type | wrangler.toml Declaration | Access Pattern | Use For |
|---|---|---|---|
| Environment Variable | `[vars] MY_VAR = "value"` | `env.MY_VAR` | Non-secret configuration values committed to source control |
| Secret | `wrangler secret put MY_SECRET` | `env.MY_SECRET` | Passwords, API keys, tokens — never in wrangler.toml plaintext |
| KV Namespace | `[[kv_namespaces]] binding = "MY_KV"` | `env.MY_KV.get(key)` | Key-value reads/writes at the edge |
| D1 Database | `[[d1_databases]] binding = "MY_DB"` | `env.MY_DB.prepare(sql)` | Relational SQL queries |
| R2 Bucket | `[[r2_buckets]] binding = "MY_BUCKET"` | `env.MY_BUCKET.get(key)` | Object storage reads/writes |
| Durable Object | `[[durable_objects.bindings]] binding = "MY_DO"` | `env.MY_DO.get(id)` | Stateful coordination |
| Queue (Producer) | `[[queues.producers]] binding = "MY_QUEUE"` | `env.MY_QUEUE.send(msg)` | Enqueue messages |
| Queue (Consumer) | `[[queues.consumers]] queue = "queue-name"` | `export default { queue(batch, env) {} }` | Process batched messages |
| Service Binding | `[[services]] binding = "AUTH_WORKER"` | `env.AUTH_WORKER.fetch(req)` | Worker-to-Worker RPC (no public HTTP round-trip) |
| AI Binding | `[ai] binding = "AI"` | `env.AI.run(model, input)` | Workers AI inference |
| Vectorize Index | `[[vectorize]] binding = "MY_INDEX"` | `env.MY_INDEX.query(vector)` | Vector similarity search |
| Hyperdrive | `[[hyperdrive]] binding = "DB"` | `env.DB.connect()` | External database connection pooling |

### Pages Framework Adapter Matrix

| Framework | Cloudflare Adapter | SSR Support | Pages Functions | Notes |
|---|---|---|---|---|
| Next.js | `@cloudflare/next-on-pages` | Yes (Edge Runtime only) | Yes | App Router required; Pages Router has limited support; use `export const runtime = 'edge'` per route |
| Nuxt | `nitro` + `cloudflare-pages` preset | Yes | Yes | Built-in via Nitro; set `preset: 'cloudflare-pages'` in nuxt.config |
| SvelteKit | `@sveltejs/adapter-cloudflare` | Yes | Yes | Full adapter support; D1/KV bindings accessible via `platform.env` |
| Remix | `@remix-run/cloudflare-pages` | Yes | Yes | Use `createPagesFunctionHandler`; bindings via `context.cloudflare.env` |
| Astro | `@astrojs/cloudflare` | Yes (SSR mode) | Yes | Set `output: 'server'` or `output: 'hybrid'`; bindings via `Astro.locals.runtime.env` |
| Gatsby | `gatsby-plugin-cloudflare-pages` | Static only | Partial | SSR not fully supported; prefer Astro or Next.js for SSR use cases |
| Vite (SPA) | No adapter needed | No (static) | Manual | Deploy static build output; use Workers for API routes separately |

### Pages Configuration Files

| File | Location | Purpose | Example |
|---|---|---|---|
| `_redirects` | `/public/_redirects` | Static redirect rules (up to 2000 rules) | `/old-path /new-path 301` |
| `_headers` | `/public/_headers` | Custom HTTP response headers per path | `/api/* X-Content-Type-Options: nosniff` |
| `_routes.json` | Project root | Control which paths invoke Functions vs. serve static assets | `{"include": ["/api/*"], "exclude": []}` |

### Service Bindings (Worker-to-Worker Communication)

| Pattern | Use Case | Performance Benefit | Configuration |
|---|---|---|---|
| Internal API Call | Auth Worker called by API Worker | Zero-latency; no external HTTP round-trip; no egress cost | Declare `[[services]]` binding in caller's wrangler.toml |
| Shared Logic Worker | Common utilities (JWT validation, rate limit check) | Single source of truth; independently deployable | Export named handlers from the service Worker |
| Fan-Out Dispatch | One request triggers multiple downstream Workers | Parallel subrequests within the 1000 subrequest limit | Use `Promise.all()` with multiple service binding calls |
| Workers for Platforms | Multi-tenant: route requests to customer-specific Workers | Tenant isolation; independent deployments per tenant | Use Dispatch Namespace binding; one dispatch Worker per namespace |

### Smart Placement

| Setting | Behavior | When to Enable |
|---|---|---|
| `placement = { mode = "smart" }` in wrangler.toml | Cloudflare automatically places the Worker near its data sources (D1, external APIs) rather than near the user | Enable when Worker makes significant D1 queries or calls to a single-region external service — trades edge latency for reduced round-trips to the data source |
| Default (off) | Worker runs at the PoP closest to the user | Preferred when Worker is mostly computation or KV reads (already replicated globally) |

---

## Storage Architecture

Instruction: Apply the detailed guidelines in this section when configuring each storage product. Each product has specific configuration requirements, consistency caveats, and anti-patterns that must be understood before use. Cross-reference with the Storage Technology Selection Matrix above for product selection rationale. Record schema decisions in 04_Target_Solution_Architecture under Data Architecture and Governance.

### KV (Key-Value Store)

| Configuration Area | Requirement | Notes |
|---|---|---|
| Consistency Guarantee | Eventual consistency — reads may return stale data for up to 60 seconds after a write | Do not use KV for data where stale reads cause correctness errors (e.g., auth tokens that must be immediately revocable — use D1 instead with a TTL column) |
| TTL Strategy | Always set TTL on ephemeral data (`expirationTtl` in seconds) | KV with no TTL accumulates indefinitely; set TTL for sessions (e.g., 86400), cache entries (e.g., 300), and rate limit counters (e.g., 60) |
| Value Size Limit | Max 25 MB per value | Store large blobs in R2 and store the R2 object key in KV |
| Metadata Size Limit | Max 1 KB per key's metadata object | Do not store full documents in metadata; use it for lightweight attributes only (e.g., `{ contentType, lastModified }`) |
| Bulk Operations | Use `list()` with prefix and cursor for paginated key enumeration; use `getWithMetadata()` to retrieve value and metadata in one call | Do not use individual `get()` calls in a loop — costs subrequest budget; batch where possible |
| Namespace Separation | Use separate KV namespaces per environment (dev, staging, prod) — never share a namespace across environments | Separate namespace IDs in each `[env.*]` block of wrangler.toml |
| When NOT to Use KV | Do not use KV for: financial records, inventory counts, sequential IDs, records requiring join queries, data requiring immediate post-write read consistency | Use D1 for these cases |

### D1 (Edge Relational Database — SQLite)

| Configuration Area | Requirement | Notes |
|---|---|---|
| ORM Recommendation | Use **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`) for schema definition and migrations | Drizzle generates D1-compatible SQL migration files; use `drizzle-kit generate` then `wrangler d1 migrations apply` |
| Migration Strategy | All schema changes must go through versioned migration files — no ad hoc `ALTER TABLE` via the Wrangler dashboard in production | Store migration files in `drizzle/` or `migrations/` directory; commit to source control; apply in CI/CD pipeline |
| Read Replicas (Sessions API) | Enable the D1 Sessions API for read-heavy workloads to distribute reads across replicas | Use `ctx.waitUntil` to avoid blocking; replicas are eventually consistent — do not use for post-write reads |
| Batch Operations | Use `db.batch([...statements])` to execute multiple statements in a single network round-trip | Reduces subrequest count significantly; required when inserting/updating multiple related rows |
| Prepared Statements | Always use parameterized prepared statements: `db.prepare('SELECT * FROM users WHERE id = ?').bind(userId)` | Prevents SQL injection; required at all system boundaries |
| Transaction Pattern | Use `db.batch()` for atomic multi-statement operations; D1 does not expose explicit `BEGIN`/`COMMIT` from Workers | Batch is atomic — all statements succeed or all fail |
| Backup and Export | Use `wrangler d1 export --output db.sql` for point-in-time exports; schedule exports via Cron Trigger + Wrangler API | Cloudflare does not automatically backup D1 — project teams are responsible for export cadence |
| Local Development | Use `wrangler d1 execute --local` for local migrations; seed data with `wrangler d1 execute --local --file seed.sql` | Local D1 uses a SQLite file in `.wrangler/state/` |
| Connection Limits | D1 does not use traditional connection pools — each Worker request is a new execution context | No connection pool configuration needed; each request gets a fresh D1 client via the binding |

### R2 (Object Storage)

| Configuration Area | Requirement | Notes |
|---|---|---|
| S3 Compatibility | R2 exposes an S3-compatible API endpoint — existing S3 SDKs work with `endpoint` set to `https://<account-id>.r2.cloudflarestorage.com` | Use `@aws-sdk/client-s3` with the Cloudflare R2 endpoint for non-Workers integrations |
| Presigned URLs | Generate presigned URLs for direct client uploads and downloads to avoid routing large payloads through Workers | Use `R2Bucket.createMultipartUpload()` for files > 100 MB |
| CORS Configuration | Always configure CORS on R2 buckets that serve browser-initiated requests | Set `AllowedOrigins` to specific domains — do not use `*` in production |
| Event Notifications | Use R2 event notifications (object created / deleted) to trigger Queues or Workers for post-upload processing | Configure via Wrangler or dashboard; events are not real-time guaranteed — design for at-least-once delivery |
| Lifecycle Rules | Set lifecycle rules for automatic deletion of time-limited objects (e.g., temp uploads, expired exports) | Use `wrangler r2 bucket lifecycle set` with a JSON lifecycle policy |
| Data Residency | Use jurisdiction-constrained buckets for EU data residency: `jurisdiction = "eu"` in bucket settings | EU-constrained buckets replicate only within the EU — required for GDPR data localization |
| Public Access | Use R2 custom domains or Cloudflare Workers as an access proxy — do not enable direct public bucket access without authorization logic | Apply WAF and Cache Rules to the public domain for security and caching |
| Zero Egress | R2 has no egress fees when served via Cloudflare network — always serve R2 assets via a Worker or Pages domain, not direct S3 endpoint | Direct S3 endpoint reads from outside Cloudflare incur egress costs |

### Durable Objects

| Configuration Area | Requirement | Notes |
|---|---|---|
| Use Case Validation | Only use Durable Objects when you need: serialized access to shared state, WebSocket server lifecycle management, distributed rate limiting, or per-entity coordination | Durable Objects have higher complexity and cost than KV or D1 — validate the use case against the Storage Selection Matrix before adopting |
| WebSocket Hibernation | Always use the Hibernation API for WebSocket servers: `this.ctx.acceptWebSocket(ws)` instead of `ws.accept()` | Hibernation allows the DO to sleep between messages — critical for scale; non-hibernated DOs stay active indefinitely and incur continuous billing |
| Alarms API | Use `this.ctx.storage.setAlarm(timestamp)` for scheduled cleanup, TTL enforcement, or delayed processing within a DO instance | Alarms survive Worker restarts and DO hibernation — reliable for time-based state transitions |
| Geographic Affinity | Use `locationHint` when creating a DO ID to place the instance near its associated data source or users | `stub = env.MY_DO.get(id, { locationHint: 'eeur' })` — see Cloudflare location hint codes |
| Transactional Storage | Use `this.ctx.storage.transaction(async (txn) => { ... })` for atomic multi-key operations within a single DO instance | DO storage transactions are ACID within the instance but not distributed across instances |
| Class Migration | When renaming a DO class, use `new_classes` and `renamed_classes` in wrangler.toml to preserve existing instances | Deleting and re-creating a class destroys all existing DO instances and their storage |
| Storage Limits | Each DO instance is limited to 10 GB of transactional storage | Shard data across multiple DO instances using consistent hashing if approaching the limit |

### Hyperdrive (External Database Connection Pooling)

| Configuration Area | Requirement | Notes |
|---|---|---|
| Supported Databases | Postgres (and Postgres-compatible: Neon, Supabase, CockroachDB, AlloyDB), MySQL (and compatible: PlanetScale, Aiven) | Hyperdrive acts as a connection pool in front of the external DB — the Worker connects to Hyperdrive's local endpoint |
| Configuration | Create via `wrangler hyperdrive create MY_DB --connection-string "postgres://..."` — stores credentials encrypted in Cloudflare | Connection string is stored securely; never embed credentials in wrangler.toml |
| Query Caching | Hyperdrive caches read queries at the Cloudflare network edge — cache TTL configurable (default: 60 seconds) | Disable caching for queries that must always return fresh data: `{ caching: { disabled: true } }` |
| Connection Reuse | Hyperdrive maintains a pool of persistent connections to the origin DB — Workers do not hold connections open directly | Reduces connection overhead significantly for databases with low `max_connections` |
| Migration Path | Use Hyperdrive as a bridge during migration from an existing external DB to D1 — migrate table by table, switch bindings progressively | Hyperdrive is not a permanent architecture destination for greenfield projects — prefer D1 |

### Vectorize (Vector Database)

| Configuration Area | Requirement | Notes |
|---|---|---|
| Index Creation | `wrangler vectorize create my-index --dimensions=1536 --metric=cosine` | Match dimensions to the embedding model output: 1536 for `text-embedding-3-small`, 768 for `@cf/baai/bge-base-en-v1.5` |
| Distance Metrics | Use `cosine` for normalized text embeddings; use `euclidean` for spatial or non-normalized embeddings; use `dot-product` for un-normalized embeddings where magnitude matters | Cosine is the default and correct choice for most NLP/RAG use cases |
| Upsert Pattern | Use `env.MY_INDEX.upsert([{ id, values, metadata }])` — both insert and update in one call | Always include structured metadata (e.g., `{ docId, chunkIndex, sourceUrl }`) for post-query filtering |
| Query Pattern | `env.MY_INDEX.query(vector, { topK: 10, returnMetadata: 'all', filter: { docId: { $eq: 'abc' } } })` | Use metadata filters to pre-filter results before vector similarity ranking — reduces result noise |
| RAG Integration | Generate embeddings via `env.AI.run('@cf/baai/bge-base-en-v1.5', { text: chunk })` → store in Vectorize → retrieve at query time → inject into LLM prompt | Chunk documents to 512–1024 tokens; store chunk metadata in D1 for full document retrieval |
| Consistency Propagation | Vectorize index updates are eventually consistent — newly upserted vectors may not appear in query results immediately | Design RAG pipelines to tolerate a short propagation delay (typically < 30 seconds) |

---

## Async Processing & Messaging

Instruction: Use Cloudflare Queues for all asynchronous task processing, event fan-out, and decoupled producer-consumer workflows. Use Cron Triggers for scheduled jobs. Use Email Workers for email routing and processing. Do not implement polling loops inside long-lived Workers to simulate async behavior — use the appropriate primitive. Record async processing architecture in 04_Target_Solution_Architecture under Component Architecture.

### Queues

| Configuration Area | Requirement | Notes |
|---|---|---|
| Producer Pattern | Call `env.MY_QUEUE.send(body)` from any Worker (HTTP, Cron, or another Queue consumer) | Supports single message send or `sendBatch([...messages])` for bulk enqueue |
| Consumer Configuration | Declare `[[queues.consumers]]` in wrangler.toml; consumer Worker receives `queue(batch, env, ctx)` | Batch size and visibility timeout are configurable: `max_batch_size = 10`, `max_batch_timeout = 5` (seconds), `max_retries = 3` |
| Retry Policy | Messages that throw an error in the consumer are automatically retried up to `max_retries` times with exponential backoff | Design consumers to be idempotent — the same message may be delivered more than once (at-least-once delivery guarantee) |
| Dead Letter Queue | Configure a DLQ by setting `dead_letter_queue = "dlq-queue-name"` on the consumer | Messages that exhaust all retries are moved to the DLQ; create a separate monitoring consumer for the DLQ |
| Fan-Out Pattern | Send the same message to multiple queues from a single producer or use a fan-out Worker that reads one queue and writes to N downstream queues | Queues do not support native pub/sub — implement fan-out by chaining consumers |
| Message Size | Maximum message body: 128 KB | For large payloads, store the data in R2 and send only the R2 object key as the queue message |
| Queue Naming | Follow the naming convention: `{project}-{environment}-{purpose}` (e.g., `synergyiq-prod-email-send`) | Use separate queues per environment — never share a queue between staging and production |

### Cron Triggers

| Configuration Area | Requirement | Notes |
|---|---|---|
| Configuration | Declare `[triggers] crons = ["0 * * * *"]` in wrangler.toml; implement `scheduled(event, env, ctx)` in the Worker | Uses standard cron expression syntax (5-field); Cloudflare evaluates in UTC |
| Execution Limit | Cron-triggered Workers can run up to 15 minutes (Workers Unbound) | Ensure the `scheduled()` handler completes within the time limit; offload long work to Queues |
| Idempotency | Design all scheduled handlers to be idempotent — the same cron may fire more than once in failure recovery scenarios | Use a D1 table or KV key to record the last successful execution timestamp and skip if already processed |
| Error Handling | Cloudflare retries failed Cron Triggers; log failures to Analytics Engine and set an alert on cron error rate | Do not silently swallow errors in scheduled handlers — always re-throw or log before returning |
| Multiple Schedules | A single Worker can declare multiple cron expressions: `crons = ["0 6 * * *", "0 18 * * *"]` | Each expression fires independently; implement handler dispatch logic using `event.scheduledTime` or `event.cron` |

### Email Workers

| Configuration Area | Requirement | Notes |
|---|---|---|
| Receiving Email | Declare `[[email]]` trigger in wrangler.toml; implement `email(message, env, ctx)` in the Worker | Cloudflare Email Routing must be configured for the domain; MX records must point to Cloudflare |
| Processing Pattern | Parse `message.raw` as a MIME stream using `postal-mime` or equivalent library; extract headers, body, and attachments | Always call `message.forward(address)` or `message.setReject(reason)` — do not return without one of these |
| Sending Email | Use `MailChannels` integration (built into Workers) or a service binding to a dedicated email-send Worker with an external provider (SendGrid, Resend, Postmark) | MailChannels is available in Workers and Pages for free transactional email sending |
| DNS Requirements | Configure DMARC (`_dmarc` TXT record), DKIM (via Cloudflare dashboard), and SPF (`TXT` record including `include:_spf.mx.cloudflare.net`) for the sending domain | All three must be configured and validated before transactional email is enabled in production |
| Anti-Spam Compliance | Add `List-Unsubscribe` headers to bulk email; honor unsubscribe requests within 10 business days; do not use Email Workers for marketing without CAN-SPAM / GDPR compliance review | Email Workers are not a bulk marketing platform — use a dedicated ESP for marketing campaigns |

### WebSocket and Realtime Patterns (via Durable Objects)

| Pattern | Implementation | Notes |
|---|---|---|
| WebSocket Server | HTTP Worker handles upgrade handshake; stubs a Durable Object; DO accepts the WebSocket via `this.ctx.acceptWebSocket(ws)` | Use the Hibernation API — the DO sleeps between messages; `webSocketMessage()`, `webSocketClose()`, `webSocketError()` are the event handlers |
| Broadcast to Room | Store connected WebSocket clients via `this.ctx.getWebSockets()`; iterate and `ws.send(message)` for broadcast | `getWebSockets()` returns all live connections on the DO instance — supports broadcast to all room members |
| Presence Tracking | Store `{ userId, connectedAt }` in DO transactional storage on connect; remove on disconnect; broadcast presence changes | Combine with Durable Object alarms to expire stale presence entries on connection failure |
| Connection Scaling | Each DO instance handles all connections for one logical room or entity; route connections using `env.MY_DO.idFromName(roomId)` | If a single room requires > 1M concurrent connections, implement a hierarchical DO fan-out tree |

---

## Security Architecture

Instruction: Apply all security controls in this section as mandatory baselines. Do not treat any row as optional unless the `Required` column explicitly states conditional applicability. Record security architecture decisions in 04_Target_Solution_Architecture under Security Privacy and Compliance Architecture. Record governance evidence in 08_Release_Operations_And_Governance under Compliance and Audit Evidence.

### SSL / TLS Mode (Critical — Most Common Misconfiguration)

| Mode | Behavior | Required | Notes |
|---|---|---|---|
| **Full (Strict)** | Cloudflare validates origin certificate against a trusted CA or Cloudflare Origin CA cert | **MANDATORY for all production deployments** | The only mode that prevents SSL stripping between Cloudflare and origin |
| Full | Cloudflare validates origin certificate is present but not its authenticity | Prohibited in production | Vulnerable to MITM between Cloudflare and origin — do not use |
| Flexible | Cloudflare communicates to origin over unencrypted HTTP | Prohibited | Data in transit is unencrypted between Cloudflare and origin — do not use under any circumstances |
| Off | No SSL enforcement | Prohibited | HTTP only — do not use |

| SSL/TLS Configuration | Requirement |
|---|---|
| Minimum TLS Version | Set to TLS 1.2 minimum; enforce TLS 1.3 where possible |
| HSTS | Enable HSTS with `max-age=31536000`; do not enable `preload` until the domain has been stable on HTTPS for at least 6 months |
| Origin CA Certificate | For Workers-proxied origins and Cloudflare Tunnel endpoints, use a Cloudflare Origin CA certificate (15-year validity, trusted only by Cloudflare) |
| Always Use HTTPS | Enable "Always Use HTTPS" redirect rule at the zone level |
| Opportunistic Encryption | Enable for all zones |

### mTLS and API Shield

| Feature | Configuration | Use Case |
|---|---|---|
| mTLS Client Certificates | Create a Cloudflare mTLS certificate authority; issue client certs to API consumers; enforce mTLS on the API zone via API Shield | Machine-to-machine API authentication where OAuth tokens are insufficient or not applicable |
| API Shield — Schema Validation | Upload an OpenAPI 3.x schema; configure action: `block` for requests that violate the schema | Prevents malformed requests and injection payloads from reaching Workers; record schema file in 05_Technology_Engineering_And_Design |
| API Shield — API Discovery | Enable API Discovery to detect undocumented endpoints; review and add to schema | Identifies shadow APIs and endpoints not covered by the security policy |
| Sequence Mitigation | Enable API Shield Sequence Mitigation to detect and block out-of-sequence API call patterns | Effective against BOLA and broken object-level authorization attacks (OWASP API1) |

### WAF (Web Application Firewall)

| Configuration Area | Requirement | Notes |
|---|---|---|
| Cloudflare Managed Ruleset | Enable in `Log` mode first; review false positives for 72 hours; switch to `Block` | Ruleset ID: `efb7b8c949ac4650a09736fc376e9aee` for Cloudflare Managed Rules |
| OWASP Core Ruleset | Enable in `Simulate` mode; tune `Paranoia Level` (start at PL1); promote to `Block` after tuning | Covers OWASP Top 10 attack patterns |
| Custom WAF Rules | Create rules using Wireshark Filter Language (`http.request.uri.path contains "/admin" and not ip.src in $cloudflare_access_ips`) | Custom rules evaluate before managed rulesets — use for allowlisting trusted IP ranges |
| Rule Priority Order | Custom Rules → Rate Limiting Rules → Managed Rulesets → OWASP Ruleset | Higher-priority rules evaluate first; a `block` in custom rules skips managed rules |
| WAF Exceptions | Create WAF exceptions (skip rules) for known-good traffic patterns (e.g., security scanner IPs, internal health checks) | Document every exception in 08_Release_Operations_And_Governance under Compliance and Audit Evidence |
| WAF Analytics | Review WAF events in the Security Events dashboard weekly; create a Logpush job for WAF events to SIEM | Alert on sudden spike in blocked requests via Cloudflare Alerts |

### DDoS Protection

| Layer | Protection Level | Configuration | Notes |
|---|---|---|---|
| L3/L4 Network | Always-on for all plans — no configuration required | N/A | Magic Transit for BGP-level protection on enterprise plans |
| L7 HTTP DDoS | Always-on managed ruleset; sensitivity configurable | Set sensitivity to `medium` by default; tune `low` for APIs with high legitimate traffic spikes | Override rules available to exclude specific URI paths or IP ranges from DDoS mitigation |
| DDoS Override Rules | Create override rules to lower sensitivity for known high-volume legitimate endpoints | Use `cf.threat_score < 10` and path matching to scope overrides narrowly |
| Advanced DDoS (Enterprise) | Adaptive DDoS protection learns traffic baselines; automatically tunes thresholds | Requires Enterprise plan; enable adaptive protection in Security → DDoS dashboard |

### Rate Limiting

| Configuration Area | Requirement | Notes |
|---|---|---|
| Rule Structure | Create rate limiting rules in Security → WAF → Rate limiting rules using the expression editor | Rules support path, method, IP, ASN, header, cookie, query param, and JA3 fingerprint matching |
| Recommended Thresholds | Authentication endpoints: 5 req/min per IP; API endpoints: 100–1000 req/min per IP (tune per endpoint); Public endpoints: 1000+ req/min | Start conservative; loosen after monitoring legitimate traffic patterns |
| Fingerprinting | Combine IP + JA4 fingerprint + `cf-connecting-ip` for more accurate rate limit keys — reduces bypass via IP rotation | Use `http.request.ja4` field in the rate limiting rule expression |
| Action Options | `block` (immediate 429), `managed_challenge` (Turnstile or JS challenge), `interactive_challenge` (CAPTCHA), `log` (monitor only) | Use `managed_challenge` for auth endpoints to prevent bot abuse without blocking legitimate users |
| Custom Headers | Return `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` in 429 responses via Transform Rules | Allows API clients to back off gracefully |

### Bot Management

| Feature | Configuration | Notes |
|---|---|---|
| Bot Score | Cloudflare assigns a bot score 1–99 to every request: 1 = definitely automated, 99 = definitely human | Available in WAF custom rules as `cf.bot_management.score` (Enterprise only) |
| Verified Bots | Allow known good bots (Googlebot, Bingbot) via `cf.bot_management.verified_bot = true` | Create a WAF rule to skip bot blocking for verified bots on public content paths |
| JS Challenge | Challenge requests with `cf.bot_management.score < 30` with a JS challenge | Effective against simple scrapers; transparent to real browsers |
| Managed Challenge | Use Turnstile (managed challenge) for suspected bot traffic on forms and auth endpoints | Turnstile has a client-side widget; Cloudflare-managed challenge has no widget but requires JS execution |

### Turnstile (CAPTCHA Replacement)

| Configuration Area | Requirement | Notes |
|---|---|---|
| Site Registration | Register the domain in the Cloudflare dashboard → Turnstile; obtain a site key and secret key | Free for all plans; no request limits |
| Client Integration | Embed `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js">` and `<div class="cf-turnstile" data-sitekey="...">` | Automatically renders a non-interactive challenge; no user interaction required for most visitors |
| Server-Side Validation | Verify the `cf-turnstile-response` token server-side: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with the secret key and token | Never trust the client-side success indicator alone — always validate the token in a Worker before processing the form |
| Idempotency | Each Turnstile token is single-use — validate once and discard | Store used tokens in KV with a short TTL to prevent replay attacks |

### Page Shield (Client-Side Security)

| Feature | Configuration | Notes |
|---|---|---|
| Script Monitoring | Enable Page Shield to detect and inventory all scripts loaded on the page | Alerts on newly detected scripts that may indicate supply chain compromise |
| Content Security Policy (CSP) | Use Page Shield's CSP reporting to build a policy; enforce via `Content-Security-Policy` header via Transform Rule | Start in report-only mode (`Content-Security-Policy-Report-Only`) before enforcing |
| Subresource Integrity (SRI) | Enable SRI checking for third-party scripts: `<script src="..." integrity="sha384-..." crossorigin="anonymous">` | Page Shield Pro/Enterprise alerts on SRI mismatch |

### Zero Trust / Cloudflare Access

| Configuration Area | Requirement | Notes |
|---|---|---|
| Application Policy | Create an Access Application for every internal tool or admin panel; require identity provider authentication | Supported IdPs: Google Workspace, Okta, Azure AD, GitHub, SAML 2.0, OIDC |
| Service Tokens | Use Service Tokens (`CF-Access-Client-Id` + `CF-Access-Client-Secret` headers) for machine-to-machine authentication | Rotate service tokens at least every 90 days; store in Workers Secrets, not environment variables |
| WARP Client | Enforce WARP enrollment for access to sensitive internal applications | WARP enables device posture checks (OS version, disk encryption, firewall status) |
| Conditional Access Policies | Configure policies with device posture rules: require disk encryption, minimum OS version, and endpoint protection software | Combine with identity rules for phased rollout |
| Cloudflare Tunnel | Use `cloudflared` to connect private origins to Cloudflare without opening inbound firewall ports | Tunnel requires no public IP on the origin server; supports HTTP, SSH, RDP, and generic TCP |
| Split Tunneling | Configure WARP split tunneling to route only corporate traffic through Cloudflare; exclude consumer ISP traffic | Reduces WARP bandwidth usage; configure in the WARP client policy |

---

## AI Gateway & Workers AI

Instruction: Use AI Gateway as the mandatory routing and governance layer for all LLM API calls. Never call external LLM providers directly from Workers without routing through AI Gateway. Record AI product decisions in 04_Target_Solution_Architecture under Component Architecture. Record model usage policies in 08_Release_Operations_And_Governance under Governance Baseline and Ownership.

### AI Gateway Configuration

| Configuration Area | Requirement | Notes |
|---|---|---|
| Gateway Setup | Create one AI Gateway per project in the Cloudflare dashboard; obtain the gateway URL | Gateway URL format: `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}` |
| Provider Routing | Replace direct provider base URL with the AI Gateway URL prefix; all other API parameters remain unchanged | Supports: OpenAI, Anthropic, Google AI, Hugging Face, Workers AI, Bedrock, Azure OpenAI, Groq, Mistral |
| LLM Response Caching | Enable caching with a TTL (e.g., 3600 seconds) for deterministic prompts (same input → same output) | Cache key is the hash of the full request body including model, messages, and parameters; do not cache user-specific or time-sensitive prompts |
| Rate Limiting | Configure per-model rate limits in the AI Gateway settings to prevent runaway inference costs | Set limits on requests per minute and tokens per minute per gateway |
| Fallback / Provider Routing | Configure a fallback provider chain: primary → secondary on HTTP 429 or 5xx | Example: OpenAI GPT-4o → Anthropic Claude → Workers AI as cost-optimized fallback |

### Workers AI — Model Catalog

| Model | Type | Dimensions / Context | Cost Tier | Best For |
|---|---|---|---|---|
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Text generation (LLM) | 128K context | Medium | General-purpose instruction following, RAG Q&A |
| `@cf/meta/llama-3.1-8b-instruct` | Text generation (LLM, small) | 128K context | Low | Classification, summarization, low-latency responses |
| `@cf/google/gemma-3-12b-it` | Text generation (LLM) | 8K context | Low | Efficient multilingual tasks |
| `@cf/baai/bge-base-en-v1.5` | Text embeddings | 768 dimensions | Very Low | RAG embeddings, semantic search |
| `@cf/baai/bge-large-en-v1.5` | Text embeddings | 1024 dimensions | Low | Higher-accuracy RAG embeddings |
| `@cf/openai/whisper` | Audio transcription | — | Low | Speech-to-text, meeting transcription |
| `@cf/stabilityai/stable-diffusion-xl-base-1.0` | Image generation | — | Medium | On-demand image generation |
| `@cf/llava-hf/llava-1.5-7b-hf` | Vision (image + text) | — | Medium | Image description, visual Q&A |

### Workers AI Integration Pattern

| Step | Implementation | Notes |
|---|---|---|
| 1. Declare Binding | `[ai] binding = "AI"` in wrangler.toml | One binding per Worker; shared across all AI models |
| 2. Generate Embedding | `const embed = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: chunk })` | Returns `{ data: [{ values: float[] }] }` |
| 3. Store in Vectorize | `await env.MY_INDEX.upsert([{ id: chunkId, values: embed.data[0].values, metadata: { docId, chunkIdx } }])` | Upsert is idempotent — safe to re-run |
| 4. Query at Inference Time | `const results = await env.MY_INDEX.query(queryEmbed, { topK: 5, returnMetadata: 'all' })` | Retrieve top-K similar chunks |
| 5. Augment and Infer | Inject retrieved chunks as context in the system prompt; call LLM via AI Gateway | Apply a token budget to context injection to avoid exceeding model context window |

### AI Cost Controls

| Control | Configuration | Notes |
|---|---|---|
| Gateway Rate Limits | Set per-gateway and per-model request limits to prevent accidental runaway costs | Configure in AI Gateway settings dashboard |
| Response Caching | Cache identical prompt+model combinations to avoid redundant inference | Cache TTL of 300–3600 seconds depending on prompt stability |
| Model Tiering | Route simple tasks (classification, extraction) to small models; complex reasoning to large models | Use system prompt complexity detection or explicit routing logic in the Worker |
| Usage Tracking | Write per-request token counts to Analytics Engine for cost attribution and budget forecasting | `env.AE.writeDataPoint({ dataset: 'ai_usage', indexes: ['model', 'userId'], blobs: ['promptId'], doubles: [inputTokens, outputTokens] })` |

---

## Performance & Caching Rules

Instruction: Use the Cloudflare Rules Engine (Cache Rules, Transform Rules, Redirect Rules) to define all caching and traffic manipulation behavior. Do not use legacy Page Rules — they are deprecated. All caching strategies must be documented in 05_Technology_Engineering_And_Design under Database Scheduler Integration and Deployment Configuration.

### Cache Rules (Replaces Page Rules)

| Rule Type | Configuration | Example Expression |
|---|---|---|
| Cache Static Assets | Cache images, fonts, JS, CSS at the edge with long TTL | `http.request.uri.path matches "\.(js|css|png|jpg|svg|woff2)$"` → Set TTL: Browser 1 year, Edge 30 days |
| Cache API Responses | Cache read-only API responses with short TTL; bypass cache for authenticated requests | `http.request.uri.path starts_with "/api/public/"` → Edge TTL: 60 seconds, bypass if `Cookie` header present |
| Bypass Cache for Authenticated | Never cache responses that vary per user | `http.request.headers["Authorization"] exists` OR `http.cookie contains "session="` → Cache: Bypass |
| Cache HTML Pages | Cache rendered HTML with short TTL; include `Vary: Accept-Encoding` | `http.request.uri.path ends_with "/"` → Edge TTL: 300 seconds; respect origin Cache-Control |

### Cache-Control Header Standards

| Response Type | Recommended `Cache-Control` Value | Notes |
|---|---|---|
| Static immutable assets (hashed filename) | `public, max-age=31536000, immutable` | Fingerprinted assets never change — 1-year cache safe |
| HTML pages | `public, max-age=0, must-revalidate` | Let Cache Rules control edge TTL; origin instructs CDN to revalidate |
| API responses (public, read-only) | `public, max-age=60, stale-while-revalidate=30` | 60-second freshness; serve stale while revalidating for 30s |
| API responses (user-specific) | `private, max-age=0, no-store` | Prevent intermediate caches from storing user data |
| R2 assets via Worker | `public, max-age=86400, s-maxage=2592000` | Browser: 1 day; CDN: 30 days |

### Transform Rules

| Use Case | Configuration | Notes |
|---|---|---|
| Add Security Headers | Add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` to all responses | Configure as a Modify Response Headers transform rule — applies globally without code changes in Workers |
| Remove Server Headers | Remove `Server`, `X-Powered-By`, `X-AspNet-Version` headers from all responses | Reduces information disclosure |
| URL Normalization | Normalize trailing slashes and lowercase URLs for consistent cache key behavior | Apply path normalization in Transform Rules before cache key evaluation |
| Request Header Injection | Inject `CF-Connecting-IP`, `CF-Ray`, `CF-Worker` headers to origin requests | Required when origin needs client IP or request traceability |

### Redirect Rules

| Use Case | Expression | Action |
|---|---|---|
| HTTP → HTTPS | `http.request.scheme eq "http"` | Redirect to `https://${http.request.host}${http.request.uri}` — 301 |
| Apex → www | `http.request.host eq "example.com"` | Redirect to `https://www.example.com${http.request.uri}` — 301 |
| Legacy URL migration | `http.request.uri.path eq "/old-feature"` | Redirect to `/new-feature` — 301 |
| Trailing slash normalization | `http.request.uri.path matches "^/.+/$"` | Redirect to path without trailing slash — 301 |

### Tiered Cache (Argo)

| Configuration | Behavior | Notes |
|---|---|---|
| Smart Tiered Cache | Cloudflare automatically selects an upper-tier PoP to serve cache misses before reaching origin | Enable in Caching → Tiered Cache; free on Enterprise; reduces origin requests by 40–80% for globally cached assets |
| Custom Tiered Topology | Define specific upper-tier regions for latency-sensitive origins | Available on Enterprise; configure in the Tiered Cache topology settings |

---

## Observability & Monitoring

Instruction: All production deployments must have Logpush configured to at least one destination within 24 hours of go-live. Analytics Engine must be used for custom metric tracking where Cloudflare native dashboards are insufficient. Alerting policies must be created for all severity-1 conditions listed below. Record observability architecture in 05_Technology_Engineering_And_Design and evidence in 08_Release_Operations_And_Governance.

### Logpush

| Configuration Area | Requirement | Notes |
|---|---|---|
| Destinations | Supported: R2 (recommended for cost), Cloudflare D1 (via pipeline), AWS S3, Google Cloud Storage, Azure Blob, Datadog, Splunk, Elastic, New Relic, Sumo Logic | Use R2 as primary storage for raw logs; forward to SIEM for security events |
| Dataset Selection | HTTP Request logs (all traffic), Firewall Events (WAF/rate limit hits), Workers Logs (runtime errors), DNS logs | Enable Workers Logs and Firewall Events as minimum baseline |
| Field Selection | Do not log request/response body content by default — PII risk | Log: `ClientIP`, `ClientRequestPath`, `EdgeResponseStatus`, `RayID`, `WorkerSubrequest`, `FirewallMatchesRuleIDs`, `FirewallMatchesActions` |
| Sampling Rate | Set `sample_rate = 1` (100%) for security events; set `sample_rate = 0.1` (10%) for high-volume HTTP access logs to control storage costs | Adjust sampling after reviewing log volume and storage cost |
| Log Filters | Use `filter` expressions to exclude health check paths (`/health`, `/ping`) from access logs | Reduces log noise and storage cost |

### Tail Workers (Real-Time Log Streaming)

| Configuration Area | Requirement | Notes |
|---|---|---|
| Setup | Declare a Tail Worker in wrangler.toml: `[[tail_consumers]] service = "my-log-worker"` on the production Worker | Tail Worker receives structured log events in near-real-time from the parent Worker |
| Use Cases | Real-time error alerting, live debugging, structured log forwarding to a custom endpoint, token usage tracking | Tail Workers do not block the parent Worker — they run asynchronously |
| Filtering | Filter tail events by outcome (`exception`, `canceled`, `exceeded-cpu`, `exceeded-memory`) in the Tail Worker handler | Focus real-time alerts on error conditions; avoid processing all `ok` events to reduce Tail Worker cost |

### Analytics Engine

| Configuration Area | Requirement | Notes |
|---|---|---|
| Dataset Naming | Follow convention: `{project}_{environment}_{metric_domain}` (e.g., `synergyiq_prod_api_usage`) | Each project should have separate datasets per domain area |
| Write API | `env.AE.writeDataPoint({ dataset: 'ds_name', indexes: ['dim1', 'dim2'], blobs: ['label1'], doubles: [metric1, metric2] })` | Max 20 doubles, 20 blobs, 20 indexes per data point; max 25 characters per index value |
| Query API | SQL API available at `https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql` | Supports `SELECT`, `GROUP BY`, `WHERE`, `ORDER BY`, `LIMIT` — no JOINs; retention 31 days (paid) |
| Key Metrics to Track | Request count per endpoint, error rate by Worker route, AI token usage per model, Durable Object alarm firing rate, Queue processing latency | Write metrics in the Worker response lifecycle using `ctx.waitUntil()` to avoid blocking response |
| Retention | Analytics Engine data is retained for 31 days (Paid) | For longer retention, use Logpush to R2 and query via Workers AI or Cloudflare D1 |

### Web Analytics

| Configuration Area | Requirement | Notes |
|---|---|---|
| Deployment | Add `<script defer src='https://static.cloudflare.com/beacon/analytics/web-vitals.min.js' data-cf-beacon='{"token": "{{beacon_token}}"}'></script>` to the HTML `<head>` | No cookie banner required — Cloudflare Web Analytics is privacy-first and GDPR compliant without cookies |
| Core Web Vitals | Monitors LCP, INP, CLS, FCP, TTFB per page | Review in Cloudflare Analytics → Web Analytics; alert on P75 LCP > 2.5 seconds |

### Alerting Policies

| Severity | Alert Condition | Notification Channel | Configuration |
|---|---|---|---|
| P1 — Critical | Worker error rate > 5% in any 5-minute window | PagerDuty / Opsgenie | Cloudflare Alerts → Workers → Error Rate |
| P1 — Critical | Zone-level 5xx rate > 1% in 5-minute window | PagerDuty / Opsgenie | Cloudflare Alerts → Zone → Error Rate |
| P1 — Critical | D1 query failure rate > 1% | PagerDuty / Opsgenie | Custom — implement via Tail Worker + Analytics Engine alert |
| P2 — High | WAF block rate spike > 200% of 7-day baseline | Email / Slack | Cloudflare Alerts → Security → WAF Spike |
| P2 — High | Health check failure for any origin | Email / Slack | Cloudflare Alerts → Health Checks |
| P2 — High | DDoS attack notification | Email / Slack | Cloudflare Alerts → DDoS → Attack Started |
| P3 — Medium | Logpush job failure | Email | Cloudflare Alerts → Logs → Logpush |
| P3 — Medium | AI Gateway error rate > 5% | Email | Custom — implement via AI Gateway analytics |
| P3 — Medium | Queue consumer error rate > 10% in 15-minute window | Email | Custom — implement via Tail Worker on Queue consumer |

---

## CI/CD Pipeline

Instruction: All production deployments must go through a gated CI/CD pipeline. No manual `wrangler deploy` to production is permitted without prior staging validation. Record the CI/CD pipeline configuration in 05_Technology_Engineering_And_Design under DevSecOps and Tooling. Record deployment approvals in 08_Release_Operations_And_Governance under Source Control Build and Release Baseline.

### wrangler.toml Environment Stacking Pattern

```toml
name = "{{project-name}}-worker"
main = "src/index.ts"
compatibility_date = "{{YYYY-MM-DD}}"
compatibility_flags = []

[vars]
APP_ENV = "development"
LOG_LEVEL = "debug"

[[kv_namespaces]]
binding = "MY_KV"
id = "{{dev_kv_namespace_id}}"

[[d1_databases]]
binding = "DB"
database_name = "{{project}}-dev"
database_id = "{{dev_d1_id}}"

[env.staging]
vars = { APP_ENV = "staging", LOG_LEVEL = "info" }
  [[env.staging.kv_namespaces]]
  binding = "MY_KV"
  id = "{{staging_kv_namespace_id}}"
  [[env.staging.d1_databases]]
  binding = "DB"
  database_name = "{{project}}-staging"
  database_id = "{{staging_d1_id}}"

[env.production]
vars = { APP_ENV = "production", LOG_LEVEL = "warn" }
  [[env.production.kv_namespaces]]
  binding = "MY_KV"
  id = "{{prod_kv_namespace_id}}"
  [[env.production.d1_databases]]
  binding = "DB"
  database_name = "{{project}}-prod"
  database_id = "{{prod_d1_id}}"
```

### GitHub Actions Promotion Pattern

| Stage | Trigger | Command | Gate |
|---|---|---|---|
| Type Check | Push to any branch | `tsc --noEmit` | Must pass; blocks deploy if failed |
| Lint | Push to any branch | `eslint src/` | Must pass |
| Unit Tests | Push to any branch | `vitest run` | Must pass; minimum coverage threshold enforced |
| Deploy to Dev | Push to `develop` branch | `wrangler deploy --env development` | Automatic |
| Deploy to Staging | Push to `main` branch | `wrangler deploy --env staging` | Automatic after tests pass |
| Integration Tests | After staging deploy | `playwright test --project=staging` | Must pass before production gate opens |
| Deploy to Production | Manual approval or tag push `v*.*.*` | `wrangler deploy --env production` | Requires manual approval in GitHub Environments |
| Rollback | Manual trigger | `wrangler rollback --env production` | Reverts to previous deployment version |

### Secrets Management

| Method | Use For | Command | Notes |
|---|---|---|---|
| `wrangler secret put SECRET_NAME` | Storing sensitive values in Cloudflare | `echo "value" \| wrangler secret put MY_API_KEY --env production` | Secrets are encrypted at rest; not visible in dashboard after creation |
| GitHub Actions Secrets | Storing values needed during CI/CD pipeline | `${{ secrets.CLOUDFLARE_API_TOKEN }}` in workflow YAML | Cloudflare API token must have `Workers Scripts:Edit` and `Account:Read` permissions |
| Workers Secrets Store (Beta) | Centralized secret management across multiple Workers | `wrangler secrets-store secret create` | Allows one secret to be shared across multiple Workers without per-Worker duplication |
| Rotation | Rotate all secrets at least every 90 days | `wrangler secret put KEY --env production` | Automate rotation via GitHub Actions scheduled workflow |

### Workers Builds (Cloudflare Native CI)

| Configuration Area | Requirement | Notes |
|---|---|---|
| Setup | Connect GitHub or GitLab repository to Workers Builds in the Cloudflare dashboard | Alternative to GitHub Actions — runs builds on Cloudflare infrastructure |
| Build Command | Specify build command, output directory, and root directory in the build configuration | Supports Node.js, Python, and custom Docker-based builds |
| Preview Deployments | Each pull request automatically receives a preview deployment URL | Preview URL format: `https://{branch}.{project}.pages.dev` for Pages; Workers Builds generates per-PR preview Workers |
| Branch Protection | Configure build status checks as required status checks in GitHub branch protection rules | Prevents merge if Cloudflare build fails |

### Rollback Procedure

| Step | Command | Notes |
|---|---|---|
| 1. Identify previous deployment | `wrangler deployments list --env production` | Lists last N deployments with version ID and timestamp |
| 2. Rollback to previous version | `wrangler rollback {deployment-id} --env production` | Instantly switches traffic to the previous Worker version; zero downtime |
| 3. Verify rollback | `curl https://api.{{project-domain.com}}/health` | Validate health check returns 200 with expected version identifier |
| 4. Record rollback in governance | Update 08_Release_Operations_And_Governance — Deployment Rollback and Communication section | Required for compliance evidence |

---

## Local Development & Testing

Instruction: All developers must be able to run the full Cloudflare-native stack locally without a live internet connection to Cloudflare APIs. Use `wrangler dev --local` for isolated local development. Use the Vitest Workers pool for unit and integration testing of Workers. Record testing strategy in 05_Technology_Engineering_And_Design under DevSecOps and Tooling.

### wrangler dev Modes

| Mode | Command | Behavior | Use When |
|---|---|---|---|
| Local (Miniflare) | `wrangler dev --local` | Runs entirely locally using Miniflare; uses local SQLite for D1, local files for R2, in-memory for KV | Day-to-day development; offline development; CI unit testing |
| Remote | `wrangler dev --remote` | Deploys to a temporary preview environment in Cloudflare's network; uses real Cloudflare APIs | Testing integration with real D1/KV/R2 data; testing Durable Objects behavior; debugging production-like behavior |
| Local with Remote Resources | `wrangler dev --local --persist` | Local execution but persists state between runs in `.wrangler/state/` | Testing stateful behavior locally without resetting data on each restart |

### Vitest Workers Pool

| Configuration Area | Requirement | Notes |
|---|---|---|
| Package | `@cloudflare/vitest-pool-workers` | Runs tests inside the actual Workers runtime (not Node.js) — catches runtime-specific bugs |
| vitest.config.ts | Set `pool: '@cloudflare/vitest-pool-workers'` and `poolOptions.workers.wrangler.configPath = './wrangler.toml'` | Tests inherit the same bindings and environment as the production Worker |
| Binding Mocks | Use `SELF.fetch()` for integration-style tests; mock KV / D1 / R2 via `env.MY_BINDING` directly in test setup | Miniflare provides real local implementations of all bindings in test context |
| Coverage | Run `vitest run --coverage` with minimum threshold: lines 80%, branches 75%, functions 80% | Enforce coverage thresholds in CI to block deploys on regression |

### D1 Local Development

| Step | Command | Notes |
|---|---|---|
| Apply migrations locally | `wrangler d1 migrations apply {{db_name}} --local` | Applies all pending migration files from `drizzle/` or `migrations/` directory |
| Seed local database | `wrangler d1 execute {{db_name}} --local --file=seed.sql` | Seed file must be idempotent (use `INSERT OR IGNORE`) |
| Inspect local database | `wrangler d1 execute {{db_name}} --local --command="SELECT * FROM users LIMIT 10"` | Direct SQLite inspection during development |
| Reset local state | Delete `.wrangler/state/` directory | Clears all local D1, KV, R2, and DO state |

### E2E Testing

| Configuration Area | Requirement | Notes |
|---|---|---|
| Tool | Playwright | Target staging or preview deployment URLs — do not run E2E tests against production |
| Test Scope | Critical user journeys only: authentication, primary CRUD operations, payment flows, key API contracts | E2E tests are slow — keep to < 30 critical paths; rely on Vitest Workers for unit/integration coverage |
| Preview Deployment E2E | Run Playwright tests against the PR preview deployment URL in CI before staging promotion | Gate staging deploy on E2E test pass |

---

## DNS & Zone Management

Instruction: DNS and zone configuration must be managed as code using Terraform (Cloudflare provider) or Pulumi for production zones. Manual dashboard changes must be documented and backfilled into infrastructure-as-code within 24 hours. Record DNS decisions in 05_Technology_Engineering_And_Design.

### DNS Record Types for Cloudflare-Native Projects

| Resource | DNS Record Type | Proxied | Notes |
|---|---|---|---|
| Workers custom domain | `CNAME` pointing to `{{worker-name}}.{{account-subdomain}}.workers.dev` | Yes (orange cloud) | Must be proxied — Cloudflare Workers require the proxy to intercept requests |
| Pages custom domain | `CNAME` pointing to `{{project-name}}.pages.dev` | Yes | Cloudflare automatically provisions SSL for custom Pages domains |
| Cloudflare Tunnel | `CNAME` pointing to `{{tunnel-id}}.cfargotunnel.com` | Yes | Created automatically by `cloudflared tunnel route dns` |
| Email (MX) | `MX` pointing to `route1.mx.cloudflare.net` and `route2.mx.cloudflare.net` | Not applicable | Required for Email Routing / Email Workers; priority 90 and 98 respectively |
| SPF | `TXT` at apex: `"v=spf1 include:_spf.mx.cloudflare.net ~all"` | Not applicable | Required for email authentication; merge with existing SPF if present |
| DMARC | `TXT` at `_dmarc`: `"v=DMARC1; p=quarantine; rua=mailto:dmarc@{{domain}}"` | Not applicable | Start with `p=none` (report only) for 30 days; promote to `quarantine` then `reject` |
| Wildcard | `CNAME` at `*` pointing to the Pages or Worker domain | Yes | Required for subdomain-per-tenant patterns |

### SSL Certificate Management

| Certificate Type | Use Case | Provisioning | Renewal |
|---|---|---|---|
| Universal SSL (default) | All proxied hostnames on the zone | Automatic — provisioned within minutes of zone activation | Automatic — Cloudflare renews before expiry |
| Advanced Certificate Manager | Wildcard certificates, custom SANs, specific CA selection | Manual configuration in SSL → Edge Certificates | Automatic renewal managed by Cloudflare |
| Custom (bring your own cert) | Regulatory requirements for a specific CA; legacy compatibility | Upload via API or dashboard | Manual — customer responsible for renewal |
| Cloudflare Origin CA | Securing origin server connection when Full Strict mode is used | Generate in SSL → Origin Server | 15-year validity; install on origin; renewed manually |

---

## Multi-Account & Multi-Zone Architecture

Instruction: Define account hierarchy and resource scoping strategy at project inception — it is expensive to migrate resources between Cloudflare accounts later. Record the account architecture decision in 04_Target_Solution_Architecture under Architecture Decisions.

### Account Hierarchy Strategies

| Strategy | Description | Use When | Trade-offs |
|---|---|---|---|
| Single Account, Multiple Environments | One Cloudflare account; separate KV namespaces, D1 databases, R2 buckets, and Workers per environment via wrangler.toml env blocks | Small to medium projects; single team; simple governance | Simpler management; risk of accidental cross-environment impact; shared account billing |
| Separate Accounts Per Environment | Dedicated Cloudflare accounts for dev, staging, and production | Regulated industries; multi-team; strict environment isolation required | Stronger isolation; higher management overhead; requires cross-account secret synchronization |
| Organization Account (Enterprise) | Cloudflare for Teams organization with sub-accounts per team or BU | Large enterprises; multiple product teams sharing a Cloudflare contract | Centralized billing; isolated sub-account blast radius; Enterprise plan required |

### Resource Scoping: Account-Level vs. Zone-Level

| Resource | Scoped To | Notes |
|---|---|---|
| Workers (without custom domain) | Account | `*.workers.dev` subdomain; no zone required |
| Workers (with custom domain) | Account + Zone | Custom domain requires the zone to be on the same account |
| D1, KV, R2, Queues, Durable Objects | Account | Not zone-bound; accessible from any Worker in the account |
| WAF Rules (custom) | Zone | Each zone has independent WAF rules; use Managed Rulesets at the account level for cross-zone consistency |
| Rate Limiting | Zone | Defined per zone; not shared across zones |
| Zero Trust / Access Applications | Account | Access policies apply across all zones in the account |
| Cloudflare Tunnel | Account | Tunnels are account-scoped; can route to multiple zones |
| SSL Certificates | Zone | Universal and Advanced certificates are zone-scoped |

### Workers for Platforms (Multi-Tenant)

| Configuration Area | Requirement | Notes |
|---|---|---|
| Dispatch Namespace | Create a dispatch namespace: `wrangler dispatch-namespace create my-namespace` | Each namespace is a container for tenant Workers |
| Dispatch Worker | The dispatch Worker receives all incoming requests and calls `env.DISPATCH_NS.get(tenantId)` to route to the tenant Worker | The dispatch Worker handles routing, authentication, and request pre-processing |
| Tenant Worker Upload | Upload tenant Workers to the namespace via the Workers for Platforms API | Tenants can have their own code, bindings, and secrets within the namespace |
| Isolation | Each tenant Worker is fully isolated — a crash in one tenant Worker does not affect others | Use outbound Workers to control what external APIs tenant Workers can call |

---

## Dependency & Compatibility Management

Instruction: `compatibility_date` is the primary mechanism controlling which Cloudflare Workers runtime behaviors are active. Treat it as a dependency version — update it deliberately, not automatically. Record the compatibility date policy in 05_Technology_Engineering_And_Design under Target Technology Stack.

### Compatibility Date Management

| Policy | Requirement | Notes |
|---|---|---|
| Initial Setting | Set `compatibility_date` to the project start date or within the prior 30 days | Enables all runtime features available at that date |
| Update Cadence | Review and update `compatibility_date` at most quarterly; never update without reading the Workers changelog for breaking changes | Incrementing `compatibility_date` may change default behavior of existing APIs |
| Breaking Change Review | Before updating `compatibility_date` in production, test in a dev environment and review `https://developers.cloudflare.com/workers/configuration/compatibility-dates/` for all new flags activated by the new date | Automate this review as part of the quarterly dependency audit |
| Compatibility Flags | Use `compatibility_flags` only for opt-in behaviors not yet activated by the compatibility date | Remove flags from `compatibility_flags` once the behavior is activated by the updated `compatibility_date` |

### npm Bundling in Workers

| Constraint | Value | Mitigation |
|---|---|---|
| Worker script size (compressed) | 1 MB (Free/Bundled), 10 MB (Paid/Unbound) | Use tree shaking; replace heavy libraries with lighter edge-compatible alternatives |
| Build tool | esbuild (used by `wrangler build`) | Configure `build.command` and `build.upload.main` in wrangler.toml for custom build steps |
| Bundle analysis | Use `wrangler deploy --dry-run --outdir dist/` and inspect output | Identify large dependencies; replace `lodash` with native alternatives; use `date-fns` only for needed functions |
| node_compat | Adds Node.js API polyfills; increases bundle size | Enable only when required; audit polyfilled APIs for edge compatibility gaps |
| External modules | Declare `external_modules = ["node:*"]` for Node.js built-ins when using `node_compat = true` | Prevents bundling Node.js internals that are polyfilled at runtime |

### Dependency Audit Checklist

| Check | Frequency | Tool |
|---|---|---|
| Outdated dependencies | Monthly | `npm outdated` |
| Known vulnerabilities | Every PR and weekly | `npm audit` or Dependabot |
| License compliance | Quarterly | `license-checker` |
| Bundle size regression | Every deploy | `wrangler deploy --dry-run` — compare output size to baseline |
| Compatibility date breaking changes | Quarterly | Manual review of Workers changelog |

---

## Enterprise Naming Conventions

Instruction: Apply these naming conventions to all Cloudflare resources at project inception. Renaming most Cloudflare resources requires deleting and recreating them — inconsistent naming is expensive to fix. Record the naming convention decision in 05_Technology_Engineering_And_Design under Naming Conventions.

| Resource Type | Pattern | Example | Anti-Pattern |
|---|---|---|---|
| Worker Script | `{project}-{purpose}-{environment}` | `acme-api-production`, `acme-auth-staging` | `worker1`, `my-worker`, `test` |
| Pages Project | `{project}-{frontend_name}` | `acme-dashboard`, `acme-marketing-site` | `frontend`, `pages-project-1` |
| KV Namespace | `{PROJECT}_{PURPOSE}_{ENVIRONMENT}` (uppercase) | `ACME_SESSIONS_PROD`, `ACME_FLAGS_STAGING` | `kv1`, `my_namespace`, `sessions` |
| R2 Bucket | `{project}-{purpose}-{environment}` (lowercase, hyphens) | `acme-uploads-prod`, `acme-exports-staging` | `bucket1`, `my-bucket`, `uploads` |
| D1 Database | `{project}-{domain}-{environment}` | `acme-core-prod`, `acme-analytics-staging` | `db`, `database1`, `main` |
| Durable Object Class | `{PurposeDurableObject}` (PascalCase) | `RateLimiterDurableObject`, `RoomStateDurableObject` | `MyDO`, `DO1`, `state` |
| Queue | `{project}-{purpose}-{environment}` | `acme-email-send-prod`, `acme-job-process-staging` | `queue1`, `my-queue` |
| DLQ | `{original-queue-name}-dlq` | `acme-email-send-prod-dlq` | `deadletter`, `failed` |
| Cloudflare Tunnel | `{project}-{environment}-tunnel` | `acme-prod-tunnel`, `acme-staging-tunnel` | `tunnel1`, `my-tunnel` |
| Zero Trust Application | `{Project} {Environment} - {Purpose}` | `Acme Production - Admin Panel`, `Acme Staging - Internal API` | `App1`, `my-app` |
| Secret Name | `{DOMAIN}_{PURPOSE}_{ENVIRONMENT}` (uppercase, underscores) | `DB_PASSWORD_PROD`, `OPENAI_API_KEY_STAGING` | `secret1`, `mykey`, `password` |
| Vectorize Index | `{project}-{domain}-{environment}` | `acme-docs-prod`, `acme-products-staging` | `index1`, `vectors` |
| Environment Tags | `production`, `staging`, `development` (lowercase) | Tag all resources with `env:production` | `prod`, `PRD`, `PRODUCTION` |
| Cron Trigger (logical name) | `{project}-{job-purpose}-cron` | `acme-report-generation-cron`, `acme-data-cleanup-cron` | `job1`, `scheduler` |

---

## Cost Model & Pricing Reference

Instruction: Review the pricing reference in this section during architecture design. Cost surprises are a common failure mode in Cloudflare-native projects because pricing is usage-based — a single architectural decision (e.g., not caching, using Unbound Workers for simple tasks) can result in orders-of-magnitude cost difference. Document the cost estimation and any budget cap strategy in 04_Target_Solution_Architecture under Scalability Resilience and Operations.

### Per-Product Pricing Reference

| Product | Free Tier Limit | Paid (Workers Paid Plan) | Enterprise Notes | Pricing Unit |
|---|---|---|---|---|
| Workers (Bundled) | 100,000 req/day | $5/month for 10M req/month, then $0.50/1M req | Custom | Requests |
| Workers (Unbound) | Not available on free | $0.02/1M req + $0.02/GB-s CPU time | Custom | Requests + CPU duration |
| Workers KV — Reads | 100,000/day | $0.50/1M reads | Custom | Read operations |
| Workers KV — Writes | 1,000/day | $5.00/1M writes | Custom | Write operations |
| Workers KV — Deletes | 1,000/day | $5.00/1M deletes | Custom | Delete operations |
| Workers KV — Storage | 1 GB | $0.50/GB-month | Custom | GB-month stored |
| D1 — Reads | 5M rows/day | $0.001/1M rows read | Custom | Rows read |
| D1 — Writes | 100K rows/day | $1.00/1M rows written | Custom | Rows written |
| D1 — Storage | 5 GB | $0.75/GB-month | Custom | GB-month stored |
| R2 — Storage | 10 GB/month | $0.015/GB-month | Custom | GB-month stored |
| R2 — Class A Ops (PUT/POST) | 1M/month | $4.50/1M operations | Custom | Operations |
| R2 — Class B Ops (GET/HEAD) | 10M/month | $0.36/1M operations | Custom | Operations |
| R2 — Egress | 0 (no egress fee) | $0 (no egress fee) | $0 | Always free |
| Durable Objects — Requests | Not on free | $0.15/1M requests | Custom | Requests |
| Durable Objects — Duration | Not on free | $12.50/1M GB-s | Custom | GB-seconds active |
| Durable Objects — Storage | Not on free | $0.20/GB-month | Custom | GB-month stored |
| Queues — Messages | Not on free | $0.40/1M messages (delivered) | Custom | Messages delivered |
| Workers AI — Neurons | 10,000/day | $0.011/1K neurons (varies by model) | Custom | Neurons consumed |
| Vectorize — Queries | Not on free | $0.04/1M queries | Custom | Queries |
| Vectorize — Storage | Not on free | $0.05/1M vector dimensions/month | Custom | Dimensions stored |
| Logpush | Not on free | Included in Business/Enterprise | Included | — |
| Analytics Engine | Not on free | $0.25/1M writes | Custom | Data points written |

### Cost Optimization Strategies

| Strategy | Product | Estimated Saving | Implementation |
|---|---|---|---|
| Cache API responses at the edge | Workers + Cache Rules | 60–90% reduction in Worker invocations for cacheable endpoints | Set `Cache-Control` on responses; configure Cache Rules to cache by path |
| Use R2 instead of S3 for assets served via Cloudflare | R2 vs. AWS S3 | Eliminate all egress fees (can be > $0.09/GB on S3) | Store assets in R2; serve via Worker or Pages custom domain |
| Use Workers AI for embedding generation instead of OpenAI | Workers AI vs. OpenAI | 80–95% cost reduction for embedding workloads | `@cf/baai/bge-base-en-v1.5` is free within neuron quota; OpenAI charges per token |
| Use AI Gateway caching for repeated LLM queries | AI Gateway | Eliminate duplicate inference costs for repeated prompts | Enable gateway caching with appropriate TTL |
| Use KV instead of D1 for read-mostly lookup tables | KV vs. D1 | KV reads are cheaper at very high volume (> 100M reads/month) | Migrate reference data (country codes, config) from D1 to KV |
| Use Queues batch processing | Queues | Reduce per-message cost with batch sizes of 10–100 | Set `max_batch_size = 100` in consumer config |
| Enable Tiered Cache (Argo) | Cache | 40–80% reduction in origin requests | Enable in Caching → Tiered Cache dashboard |

### Budget Governance

| Control | Method | Notes |
|---|---|---|
| Spending Notifications | Configure email alerts at 80% and 100% of monthly budget threshold in Cloudflare Billing | Available for all paid plans |
| Usage Caps (Workers Paid) | Set a maximum daily request budget to auto-pause the Worker if exceeded | Available via Workers Settings → Usage Limits on the Paid plan |
| Cost Attribution | Tag all resources and track per-tag usage via Cloudflare Analytics | Use consistent project and environment tags |
| Monthly Review | Compare actual vs. estimated costs monthly; update the cost model when traffic patterns change | Store cost model in 04_Target_Solution_Architecture |

---

## Data Residency & Compliance Register

Instruction: Complete this section during the architecture phase (04_Target_Solution_Architecture) and update evidence in 08_Release_Operations_And_Governance under Compliance and Audit Evidence. Do not proceed to production without verifying applicable compliance requirements.

### Compliance Mapping

| Regulation / Standard | Cloudflare Coverage | Required Configuration | Evidence Location |
|---|---|---|---|
| GDPR (EU) | Cloudflare signs DPA with customers; Data Localization Suite available; R2 EU jurisdiction available | Sign Cloudflare DPA; enable Data Localization Suite if EU personal data transits Cloudflare network; use `jurisdiction = "eu"` on R2 buckets containing personal data | 08_Release_Operations_And_Governance — Compliance and Audit Evidence |
| HIPAA | Cloudflare signs BAA for eligible services (Workers, R2, D1, Zero Trust, Cloudflare One); AI inference via Workers AI is excluded from HIPAA BAA scope | Request BAA from Cloudflare account team; document which services are in scope for PHI; do not route PHI through Workers AI or AI Gateway | 08_Release_Operations_And_Governance |
| SOC 2 Type II | Cloudflare is SOC 2 Type II certified; certification covers core infrastructure and services | Obtain Cloudflare SOC 2 report from trust portal; document in compliance register | 08_Release_Operations_And_Governance |
| ISO 27001 | Cloudflare is ISO 27001 certified | Obtain certificate from Cloudflare trust portal | 08_Release_Operations_And_Governance |
| PCI DSS | Cloudflare is a PCI DSS Level 1 Service Provider for WAF, CDN, and DDoS services; Workers and D1 are not PCI-scoped by default | Do not store or process raw card data (PAN, CVV) in Workers KV, D1, or R2 without explicit PCI scoping; use tokenization | 08_Release_Operations_And_Governance |
| FedRAMP | Cloudflare Government Cloud provides FedRAMP Moderate authorization | FedRAMP requires using Cloudflare Government endpoints — different from commercial accounts; confirm with Cloudflare account team | 08_Release_Operations_And_Governance |

### Data Localization Suite

| Feature | Use When | Configuration |
|---|---|---|
| Regional Services | Personal data of EU residents must not be processed outside the EU | Enable Regional Services; select EU region in Cloudflare Zone Settings → Data Localization |
| Customer Metadata Boundary | Cloudflare metadata (logs, analytics) must remain in a specific region | Enable Customer Metadata Boundary; logs and analytics will only be stored in the selected region |
| Key Management | Customer holds their own encryption keys (BYOK) | Enterprise — configure with Cloudflare account team |

### PII Handling in Workers

| Requirement | Implementation | Notes |
|---|---|---|
| Do not log PII | Filter PII fields from Logpush configuration; mask PII before writing to Analytics Engine | Audit Logpush field list; exclude email, name, phone, IP (if required by regulation) from logs |
| Do not store PII in KV keys | Use pseudonymous IDs (UUID, hash) as KV keys; never use email or name as KV key | KV key names appear in Logpush logs and analytics |
| Encrypt PII at rest | Cloudflare encrypts KV, D1, and R2 at rest with AES-256 — no additional configuration required | Document encryption-at-rest evidence in compliance register |
| Data Subject Request Support | Implement a Worker endpoint that accepts DSR requests and deletes/exports user data from D1 and R2 | Required for GDPR Article 17 (Right to Erasure) and Article 20 (Data Portability) |

### Audit Logs

| Log Source | Access Method | Retention | Notes |
|---|---|---|---|
| Cloudflare Audit Log | Cloudflare Dashboard → Account → Audit Log; or via API `GET /accounts/{id}/audit_logs` | 6 months in dashboard | Captures changes to zone settings, WAF rules, user access, API token usage |
| Workers Logs | Logpush → Workers dataset | Configurable via Logpush destination | Capture Worker invocations, errors, and subrequest outcomes |
| Zero Trust Access Logs | Logpush → Zero Trust dataset | Configurable | Captures every Access authentication event with user identity, device posture, and decision |
| WAF / Firewall Events | Logpush → Firewall Events dataset | Configurable | Captures every request matched by WAF, rate limiting, or DDoS rules |

---

## Enterprise Readiness Checklist

Instruction: Complete this checklist before any production deployment. Every row must have a defined `{{Status}}` before the deployment gate in 07_Quality_Test_And_Validation is passed. `Blocker` items must be `Complete` before go-live. `Required` items may be deferred to a post-launch sprint only with documented owner and due date. Record completion evidence in 08_Release_Operations_And_Governance under Production Readiness Checklist.

| Category | Requirement | Evidence Required | Severity | {{Status}} |
|---|---|---|---|---|
| **Security** | SSL/TLS mode set to Full (Strict) on all zones | Cloudflare dashboard screenshot or API response showing mode = full_strict | Blocker | {{Not Started / In Progress / Complete}} |
| **Security** | WAF Managed Ruleset enabled and in Block mode | WAF configuration export; no rules in Log-only mode for known attack classes | Blocker | {{Not Started / In Progress / Complete}} |
| **Security** | Rate limiting rules configured for all authentication endpoints | Rule list exported with thresholds; tested with load testing tool | Blocker | {{Not Started / In Progress / Complete}} |
| **Security** | All secrets stored as Wrangler secrets — no plaintext in wrangler.toml or source code | wrangler.toml reviewed; GitHub Secret Scanning enabled on the repository | Blocker | {{Not Started / In Progress / Complete}} |
| **Security** | Cloudflare Access protecting all admin interfaces | Access application configuration; test of unauthorized access attempt fails | Blocker | {{Not Started / In Progress / Complete}} |
| **Security** | HSTS enabled on all zones | `Strict-Transport-Security` header present in response; max-age >= 31536000 | Blocker | {{Not Started / In Progress / Complete}} |
| **Security** | Turnstile or bot protection on all public form endpoints | Turnstile widget present; server-side token validation implemented and tested | Required | {{Not Started / In Progress / Complete}} |
| **Security** | mTLS or service tokens configured for all machine-to-machine API calls | Certificate issued; `CF-Access-Client-Id` validation present in Worker | Required | {{Not Started / In Progress / Complete}} |
| **Security** | Page Shield enabled and CSP configured | Page Shield configuration; `Content-Security-Policy` header present in responses | Required | {{Not Started / In Progress / Complete}} |
| **Security** | DMARC, DKIM, and SPF configured for all sending domains | DNS records verified; DMARC policy = quarantine or reject | Required | {{Not Started / In Progress / Complete}} |
| **Observability** | Logpush job configured for Workers Logs and Firewall Events | Logpush job active; test log delivery confirmed in destination | Blocker | {{Not Started / In Progress / Complete}} |
| **Observability** | P1 and P2 alerting policies configured | Alerting policy list; test alert fired and received by on-call channel | Blocker | {{Not Started / In Progress / Complete}} |
| **Observability** | Health checks configured for all origins | Health check list; notification configured for failure | Required | {{Not Started / In Progress / Complete}} |
| **Observability** | Tail Worker or Analytics Engine tracking error rates | Error rate dashboard created; alert threshold set | Required | {{Not Started / In Progress / Complete}} |
| **Observability** | Web Analytics beacon deployed on all public pages | Beacon script present in HTML; data appearing in Web Analytics dashboard | Required | {{Not Started / In Progress / Complete}} |
| **CI/CD** | No direct `wrangler deploy` to production without CI gate | GitHub branch protection rules configured; production environment requires approval | Blocker | {{Not Started / In Progress / Complete}} |
| **CI/CD** | Staging deployment validated before every production deploy | CI pipeline configuration showing staging → approval → production flow | Blocker | {{Not Started / In Progress / Complete}} |
| **CI/CD** | Rollback procedure documented and tested | Rollback runbook in 08 artifact; `wrangler rollback` tested in staging | Required | {{Not Started / In Progress / Complete}} |
| **CI/CD** | `wrangler types` run in CI to keep binding types in sync | CI step present; TypeScript errors on binding type mismatch would fail build | Required | {{Not Started / In Progress / Complete}} |
| **Cost** | Cost estimation model completed and reviewed | Cost estimate in 04_Target_Solution_Architecture; compared to budget | Required | {{Not Started / In Progress / Complete}} |
| **Cost** | Spending notification alerts configured at 80% and 100% of budget | Alert configuration in Cloudflare Billing dashboard | Required | {{Not Started / In Progress / Complete}} |
| **Cost** | Cache Rules configured for all cacheable endpoints | Cache rule list; `cf-cache-status: HIT` confirmed for cacheable paths | Required | {{Not Started / In Progress / Complete}} |
| **Compliance** | Cloudflare DPA signed (if processing EU personal data) | DPA signed and on file | Blocker (if GDPR applicable) | {{Not Started / In Progress / Complete / N/A}} |
| **Compliance** | Data Localization Suite configured (if EU data residency required) | Regional services enabled; confirmation from Cloudflare account | Blocker (if required) | {{Not Started / In Progress / Complete / N/A}} |
| **Compliance** | Cloudflare BAA signed (if HIPAA applicable) | BAA signed and on file; PHI data flows documented | Blocker (if HIPAA applicable) | {{Not Started / In Progress / Complete / N/A}} |
| **Compliance** | Audit Log export configured for compliance evidence | Logpush → Audit Log dataset active; destination confirmed | Required | {{Not Started / In Progress / Complete}} |
| **Resilience** | DDoS protection override rules tuned for known high-volume legitimate traffic | Override rule list; test traffic passes through during synthetic DDoS simulation | Required | {{Not Started / In Progress / Complete}} |
| **Resilience** | Queue Dead Letter Queue configured and monitored | DLQ consumer Worker deployed; alert on DLQ message count > 0 | Required (if Queues in use) | {{Not Started / In Progress / Complete / N/A}} |
| **Resilience** | Durable Object Hibernation API used for all WebSocket handlers | Code review confirms `acceptWebSocket()` used instead of `ws.accept()` | Blocker (if DO + WebSocket in use) | {{Not Started / In Progress / Complete / N/A}} |
| **Resilience** | D1 migrations applied and verified in staging before production | Migration apply log from CI; row count verification query passed | Blocker | {{Not Started / In Progress / Complete}} |
| **Performance** | Cache hit rate > 70% for public content paths | `cf-cache-status` distribution from Logpush; Analytics Engine query | Required | {{Not Started / In Progress / Complete}} |
| **Performance** | Core Web Vitals: P75 LCP < 2.5s, INP < 200ms, CLS < 0.1 | Web Analytics Core Web Vitals report for the last 7 days | Required | {{Not Started / In Progress / Complete}} |
| **Performance** | `wrangler deploy --dry-run` confirmed Worker bundle size < 1 MB compressed | Build log showing bundle size; or < 10 MB if on Unbound | Required | {{Not Started / In Progress / Complete}} |
| **AI Governance** | AI Gateway enabled and all LLM calls routed through it | Worker code review confirms no direct provider calls; AI Gateway logs showing traffic | Blocker (if AI features in use) | {{Not Started / In Progress / Complete / N/A}} |
| **AI Governance** | Per-model rate limits configured in AI Gateway | AI Gateway rate limit configuration screenshot | Required (if AI features in use) | {{Not Started / In Progress / Complete / N/A}} |
| **AI Governance** | PHI and PII excluded from LLM prompts | Prompt construction code reviewed; PII scrubbing function present and tested | Blocker (if HIPAA + AI in use) | {{Not Started / In Progress / Complete / N/A}} |

---

## Known Limits & Constraints Register

Instruction: Review this register during architecture design to identify limits that may affect the solution design. Where a limit is expected to be reached, record the mitigation strategy in 04_Target_Solution_Architecture under Scalability Resilience and Operations. Update this register when Cloudflare changes product limits — verify at `https://developers.cloudflare.com/workers/platform/limits/`.

| Product | Limit Type | Free | Paid / Business | Enterprise | Mitigation if Limit Reached |
|---|---|---|---|---|---|
| Workers | CPU time per request | 10 ms | 30 s (Unbound) | 30 s (Unbound) | Break long computation into Queue-backed async jobs; offload to Durable Objects with alarm-based processing |
| Workers | Memory per isolate | 128 MB | 128 MB | 128 MB | Avoid loading large in-memory datasets; stream large payloads from R2 |
| Workers | Bundle size (compressed) | 1 MB | 10 MB | 10 MB | Tree shake dependencies; replace heavy libraries; use `wrangler deploy --dry-run` in CI |
| Workers | Subrequests per request (fetch, KV, D1) | 50 | 1,000 | 1,000 | Batch KV reads; use D1 batch(); avoid N+1 subrequest patterns |
| Workers | Concurrent requests per zone | No hard limit (auto-scaled) | No hard limit | No hard limit | — |
| Workers KV | Reads per day (free) | 100,000 | Unlimited (billed) | Unlimited | Cache KV reads in Workers memory for the duration of the request |
| Workers KV | Writes per day (free) | 1,000 | Unlimited (billed) | Unlimited | Batch writes; reduce write frequency with write-through caching patterns |
| Workers KV | Value size | 25 MB | 25 MB | 25 MB | Store large objects in R2; store R2 key in KV |
| Workers KV | Global consistency propagation | Up to 60 s | Up to 60 s | Up to 60 s | Do not use KV when read-after-write consistency is required; use D1 |
| D1 | Database size | 500 MB | 10 GB | 10 GB | Archive historical data to R2 as parquet; shard by date or tenant across multiple D1 databases |
| D1 | Row reads per day (free) | 5 M | Unlimited (billed) | Unlimited | Add D1 → KV caching layer for frequently read reference data |
| D1 | Databases per account | 10 | 50,000 | 50,000 | — |
| R2 | Single object size | 5 TB (multipart) | 5 TB (multipart) | 5 TB (multipart) | Use multipart upload for objects > 5 GB |
| R2 | Single PUT size | 5 GB | 5 GB | 5 GB | Use multipart upload for objects > 5 GB |
| Durable Objects | Storage per instance | — | 10 GB | 10 GB | Shard data across multiple DO instances using consistent hashing |
| Durable Objects | Concurrent requests per instance | Serialized (1 at a time) | Serialized | Serialized | DOs serialize all requests — design for low-contention; do not use DO for high-throughput read operations |
| Queues | Message body size | — | 128 KB | 128 KB | Store payload in R2; enqueue only the R2 object key |
| Queues | Messages per queue | — | Unlimited | Unlimited | — |
| Queues | Consumer batch size | — | Max 100 | Max 100 | Process in batches of 100; chain multiple queue consumers for pipelines |
| Vectorize | Vectors per index | — | 5,000,000 | Custom | Shard embeddings across multiple indexes with routing logic in Worker |
| Vectorize | Dimensions per vector | — | 1,536 | 1,536 | Use a model with fewer dimensions if storage/query cost is a concern |
| Vectorize | Metadata per vector | — | 10 KB | 10 KB | Store full document content in D1 or R2; use metadata only for filtering |
| Cron Triggers | Execution time per run | 10 ms CPU (free) | 15 min wall (Unbound) | 15 min wall (Unbound) | For jobs > 15 minutes, fan out work to Queues from the Cron handler |
| Cron Triggers | Number per Worker | 3 | 3 | 3 | Use a single Cron handler that dispatches to multiple internal functions or Queues |
| AI Gateway | Providers supported | All plans | All plans | All plans | — |
| Workers AI | Neurons per day (free) | 10,000 | Unlimited (billed) | Unlimited | Cache inference results in KV or AI Gateway; use smaller models for high-volume tasks |
| Pages | Build time limit | 20 min | 20 min | 20 min | Split monorepo builds; use incremental builds; move heavy build steps to Workers Builds |
| Pages | Deployments per day | 500 | 500 | Custom | Use preview deployments for PRs; deploy to production only from main branch |
| Pages | Custom domains per project | 10 | 10 | Custom | Use wildcard domains for multi-tenant Pages deployments |
| Rate Limiting | Rules per zone | 10 (free) | 100 | Custom | Combine overlapping rules with OR expressions; use priority ordering |
| WAF Custom Rules | Rules per zone | 5 (free) | 100 | Custom | Consolidate related rules using composite expressions with `or` operators |
| Zero Trust | Users (free) | 50 | Custom | Custom | — |
| Cloudflare Tunnel | Replicas per tunnel | 1 | Unlimited | Unlimited | Run multiple `cloudflared` replica processes for high availability |
