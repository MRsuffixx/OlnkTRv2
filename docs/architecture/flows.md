# Core flows

```mermaid
sequenceDiagram
  participant U as User
  participant A as Auth.js
  participant D as PostgreSQL
  participant M as SMTP
  U->>A: submit email
  A->>D: store hashed expiring token
  A->>M: send single-use link
  U->>A: open callback link
  A->>D: consume token; create/load user and DB session
```

```mermaid
flowchart LR
  E[Editable PageDraft + Blocks] --> V[Validate ownership, schemas, entitlement]
  V --> S[Immutable PageVersion snapshot]
  S --> A[Atomically update PagePublication]
  A --> C[Invalidate Redis profile key]
  C --> P[Public renderer]
```

```mermaid
flowchart LR
  H[Signed provider webhook] --> E[Unique durable event]
  E --> Q[BullMQ billing queue]
  Q --> T[Idempotent subscription transaction]
  T --> EN[Entitlement resolved from active state]
```

Analytics uses `browser beacon -> rate-limited route -> BullMQ -> event + daily aggregate`. Non-auth mail is queue-suitable; authentication mail remains synchronous, tracked, and observable so Auth.js can report delivery failures.

```mermaid
flowchart LR
  U[Short image/video upload] --> A[Private original MediaAsset]
  A --> Q[Media queue]
  Q --> F[FFprobe + bounded FFmpeg]
  F --> D[H.264 loop + WebP poster]
  D --> R[READY derivatives]
```

```mermaid
flowchart LR
  V[Public live widget] --> C{Fresh cache?}
  C -->|yes| P[Normalized payload]
  C -->|no| Q[Enqueue refresh]
  Q --> S[Return stale or unavailable immediately]
  Q --> W[Fixed-host provider adapter]
  W --> C
```

```mermaid
flowchart LR
  R[Deletion requested] --> M[Email one-time confirmation]
  M --> C[Account DELETION_PENDING + revoke sessions]
  C --> Q[Delayed maintenance job]
  Q --> A[Delete assets/content and anonymize identity]
  A --> L[Retain non-secret audit trail]
```
