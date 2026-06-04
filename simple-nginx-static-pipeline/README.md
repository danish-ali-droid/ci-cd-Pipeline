# 🌐 Simple Nginx Static Website Pipeline

> An automated CI/CD implementation engineering the compilation, packaging, and seamless delivery of static web applications to optimized Nginx web server environments — achieving atomic deployments with zero manual intervention and consistent configuration state management.

---

## 🎯 Use Case & Architecture Objective

This pipeline addresses a standard corporate frontend delivery scenario: automating the end-to-end deployment workflow of high-performance static web assets — HTML, CSS, and JavaScript — directly into an Nginx web root directory (`/usr/share/nginx/html`), containerized via a minimal `nginx:alpine` image.

The architecture eliminates manual deployment steps by enforcing a fully automated GitHub Actions pipeline that:

- Validates source integrity on every commit to the target branch.
- Packages static assets as **immutable artifacts** — ensuring deployment reproducibility across environments.
- Executes **atomic deployment** into the containerized Nginx web root, preventing partial-state delivery.
- Guarantees **consistent configuration state management** through Docker image layering, where every build produces a deterministic, versioned container image.
- Enforces **least-privilege process execution** by running the Nginx worker process under a non-root user context within the Alpine container, minimizing the blast radius of any runtime compromise.

**Target deployment environment:** Docker-hosted `nginx:alpine` container serving static files from `/usr/share/nginx/html` over port `80`, with zero-dependency runtime (no Node.js, no application server, no runtime interpreter).

---

## 🛠️ System Components & Toolchain

| Layer | Technology | Role |
|---|---|---|
| **Web Server** | Nginx (`nginx:alpine`) | Static file serving with low memory footprint, high concurrency handling, and efficient kernel-level I/O via `epoll`. |
| **Containerization** | Docker | Immutable image construction and Nginx web root mapping via `COPY` directives into the container filesystem. |
| **CI/CD Engine** | GitHub Actions | Automated pipeline orchestration using secure, ephemeral GitHub-hosted runners with scoped repository permissions. |
| **Delivery Model** | Artifact-driven staging | Source assets are validated, packaged as deployment-ready artifacts, and extracted into the container image during the Docker build phase. |
| **Source Assets** | HTML / CSS / JavaScript | Production-grade static frontend (`FlavorHaven`) — fully self-contained, no server-side rendering dependency. |
| **Base Image** | `nginx:alpine` (Alpine Linux) | Minimal OS footprint (~5 MB), reduced attack surface, and optimized for immutable container environments. |

---

## 🏗️ Pipeline Topology & Workflow Mechanics

The pipeline enforces a linear, fail-fast execution model. Each stage is a discrete engineering control — a failure at any stage halts the pipeline and prevents a corrupt artifact from reaching the delivery layer.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions Runner                        │
│                                                                     │
│  [1] Trigger        [2] Checkout       [3] Validate                 │
│  Push / PR     ──▶  Source Code   ──▶  Asset Integrity              │
│  (main branch)      (Sparse clone)     (Lint / Structure check)     │
│                                                │                    │
│                                                ▼                    │
│  [6] Push Image     [5] Tag & Push     [4] Docker Build             │
│  Registry      ◀──  Immutable Image ◀──  (nginx:alpine + COPY)      │
│  (GHCR / Hub)       (SHA-tagged)        Artifact packaging          │
└─────────────────────────────────────────────────────────────────────┘
```

### Stage Breakdown

**1. Pipeline Trigger**
Activates on `push` or `pull_request` events targeting the `main` branch. Branch protection rules enforce no direct commits to `main` without passing pipeline status checks, ensuring the delivery trunk remains green at all times.

**2. Source Checkout**
The GitHub Actions `actions/checkout` step performs a shallow clone of the repository, scoping the runner's filesystem to only the files required for build execution. This reduces I/O overhead and runner execution time.

**3. Asset Validation**
Static asset structure is verified prior to packaging. This control prevents broken file references, missing entry points (`index.html`), or malformed markup from propagating into the immutable artifact. For teams applying stricter quality gates, HTML linting (`htmlhint`) and CSS validation tools can be injected at this stage.

**4. Artifact Compilation & Docker Build**
The `Dockerfile` drives the artifact packaging phase:
- The `nginx:alpine` base layer provides a hardened, minimal runtime.
- The `COPY . /usr/share/nginx/html` directive performs **Nginx web root mapping** — transferring all source assets into the container's document root at image build time.
- Port `80` is exposed for HTTP traffic ingress.
- The resulting image is a **self-contained, immutable artifact**: every bit of state required to serve the application is baked into the image layer. No runtime file mounts, no post-start configuration injection.

**5. Image Tagging Strategy**
Images are tagged using a deterministic scheme — typically the Git commit SHA — ensuring **full deployment traceability**. Rolling back to any prior deployment state requires only referencing the corresponding SHA-tagged image.

**6. Registry Push & Deployment**
The finalized image is pushed to a container registry (GitHub Container Registry or Docker Hub). Downstream orchestration layers (Docker Compose, Kubernetes, ECS) pull the versioned image and execute a container replacement — achieving **atomic deployment** with no in-place file mutation on the host.

---

## 📂 Sub-directory Blueprint

```
simple-nginx-static-pipeline/
│
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions pipeline definition
│                                   # (trigger, build, push, deploy stages)
│
├── index.html                      # Static web application entry point
│                                   # (FlavorHaven — production-grade frontend)
│
├── Dockerfile                      # Container build specification
│                                   # Base: nginx:alpine
│                                   # Web root: /usr/share/nginx/html
│
├── nginx.conf                      # (Optional) Custom Nginx server block override
│                                   # Replaces default.conf for advanced routing,
│                                   # gzip compression, or cache-control headers
│
└── README.md                       # This document
```

> **Note:** The `nginx.conf` is optional when leveraging the `nginx:alpine` default configuration. It is introduced when custom routing directives, response header policies (e.g., `Cache-Control`, `X-Frame-Options`), or `gzip` compression tuning are required beyond the base image defaults.

---

## ⚙️ Core Configuration Snippets

### Dockerfile — Nginx Web Root Mapping

```dockerfile
# Base image: nginx:alpine
# Minimal OS footprint (~5 MB), non-root Nginx worker process,
# optimized for static file serving in immutable container environments.

FROM nginx:alpine

# Artifact packaging: COPY transfers all static assets from the
# build context into the Nginx document root at image construction time.
# This produces an immutable artifact — no runtime writes to web root.
COPY . /usr/share/nginx/html

# Expose HTTP port for ingress traffic routing
EXPOSE 80
```

---

### GitHub Actions Workflow — CI/CD Pipeline Definition

```yaml
# .github/workflows/deploy.yml

name: 🚀 Build & Deploy Static Nginx Pipeline

on:
  push:
    branches:
      - main
    paths:
      - 'simple-nginx-static-pipeline/**'

jobs:
  build-and-push:
    name: Build Immutable Docker Image & Push to Registry
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write       # Scoped to GHCR push — least-privilege runner config

    steps:
      - name: 📥 Checkout Source
        uses: actions/checkout@v4

      - name: 🔐 Authenticate to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}   # Ephemeral token — no long-lived secrets

      - name: 🏗️ Build Immutable Docker Image
        run: |
          docker build \
            -t ghcr.io/${{ github.repository_owner }}/simple-nginx-static:${{ github.sha }} \
            ./simple-nginx-static-pipeline
        # Image tagged with Git commit SHA for full deployment traceability
        # and deterministic rollback capability

      - name: 📦 Push Artifact to Registry
        run: |
          docker push ghcr.io/${{ github.repository_owner }}/simple-nginx-static:${{ github.sha }}

      - name: 🚢 Deploy Container (Self-Hosted Runner / Remote Host)
        run: |
          docker pull ghcr.io/${{ github.repository_owner }}/simple-nginx-static:${{ github.sha }}
          docker stop nginx-static || true
          docker rm nginx-static   || true
          docker run -d \
            --name nginx-static \
            --restart unless-stopped \
            -p 80:80 \
            ghcr.io/${{ github.repository_owner }}/simple-nginx-static:${{ github.sha }}
        # Atomic deployment: old container stopped and removed before
        # new image is instantiated — prevents dual-state serving window
```

---

### Nginx Server Block — Custom Configuration (Optional Override)

```nginx
# nginx.conf — Custom server block for advanced static delivery control
# Mount path inside container: /etc/nginx/conf.d/default.conf

server {
    listen 80;
    server_name _;                        # Wildcard — accepts any hostname

    root /usr/share/nginx/html;           # Nginx web root mapping
    index index.html;

    # SPA routing support: fallback all unmatched paths to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Aggressive static asset caching — immutable assets served with
    # long-duration cache headers to minimize origin request load
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security headers — defense-in-depth for static delivery
    add_header X-Frame-Options "SAMEORIGIN"        always;
    add_header X-Content-Type-Options "nosniff"    always;
    add_header X-XSS-Protection "1; mode=block"    always;

    # Gzip compression — reduces payload size for high-concurrency scenarios
    gzip on;
    gzip_types text/plain text/css application/javascript image/svg+xml;
    gzip_min_length 1024;
}
```

---

## 🤝 Collaboration & Feedback

This pipeline is part of an active portfolio of production-oriented CI/CD implementations demonstrating systems engineering depth across containerization, infrastructure automation, and GitOps delivery models.

**System Architects, DevOps Leads, and Recruiters** are welcome to review the pipeline topology, examine the configuration decisions, and connect to discuss infrastructure optimization strategies — including:

- Multi-stage Docker builds for larger frontend toolchains (Node.js → dist → nginx:alpine).
- Registry promotion pipelines (dev → staging → production) with environment-scoped image tagging.
- Integration with Kubernetes ingress controllers and Helm chart delivery for orchestrated Nginx deployments.
- Secret management patterns using GitHub Actions OIDC federation with cloud providers (AWS, GCP, Azure).

---

<div align="center">

**Danish Ali**
DevOps & Infrastructure Engineer

[![GitHub](https://img.shields.io/badge/GitHub-danish--ali--droid-181717?style=flat&logo=github)](https://github.com/danish-ali-droid)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/danish-ali-droid)

*Building automated, reliable, and observable delivery systems — one pipeline at a time.*

</div>
