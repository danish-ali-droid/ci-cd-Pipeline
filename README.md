<div align="center">

# Automated CI/CD Pipeline Showcase

**Production-ready automation pipelines demonstrating artifact lifecycle management, containerized delivery, and frictionless deployment models — from source commit to live environment.**

<br>

![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-Automated-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python-Flask_App-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_App-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Static_Site-009639?style=for-the-badge&logo=nginx&logoColor=white)

<br>

**Pipeline Status**

[![CI - Flask App](https://github.com/danish-ali-droid/ci-cd-Pipeline/actions/workflows/ci.yaml/badge.svg)](https://github.com/danish-ali-droid/ci-cd-Pipeline/actions/workflows/ci.yaml)
[![CI - Node App](https://github.com/danish-ali-droid/ci-cd-Pipeline/actions/workflows/node-app.yaml/badge.svg)](https://github.com/danish-ali-droid/ci-cd-Pipeline/actions/workflows/node-app.yaml)
[![CI - Static Site](https://github.com/danish-ali-droid/ci-cd-Pipeline/actions/workflows/static-website-pipeline.yaml/badge.svg)](https://github.com/danish-ali-droid/ci-cd-Pipeline/actions/workflows/static-website-pipeline.yaml)
[![Node Practice CI](https://github.com/danish-ali-droid/ci-cd-Pipeline/actions/workflows/gha-node-practice.yaml/badge.svg)](https://github.com/danish-ali-droid/ci-cd-Pipeline/actions/workflows/gha-node-practice.yaml)

</div>

---

## 🎯 Project Overview

This repository is a **centralized engineering portfolio** that demonstrates the transition of manual software delivery processes into fully automated, declarative CI/CD pipelines. Each pipeline in this showcase is independently scoped to its own application stack — preventing cross-contamination between projects while enabling parallel pipeline execution across the monorepo.

The core engineering thesis implemented throughout is **"build once, deploy anywhere"**: each pipeline produces a deterministic, immutable artifact (a versioned Docker image) in the CI phase that is then promoted — without rebuilding — through subsequent deployment stages. This guarantees that what was tested is exactly what gets shipped.

Key engineering concepts demonstrated:

- **Stage Isolation** — The `build`, `test`, and `deploy` phases are modeled as discrete, dependency-linked jobs. No deployment logic leaks into the build phase; no build logic is duplicated in the deploy phase.
- **Artifact-Driven Deployment Strategy** — Docker images are built, tagged with both `latest` and `v${{ github.run_number }}` semantic identifiers, and pushed to Docker Hub as the canonical artifact. The deploy phase pulls exclusively from this registry, decoupling the deployment runtime from the source repository.
- **Path-Scoped Triggers** — Workflows activate only when their respective application directory changes, eliminating unnecessary pipeline runs and reducing CI resource consumption in a monorepo layout.
- **Fail-Fast Gate Enforcement** — Test jobs act as hard quality gates. A downstream `build_push` or `deploy` job will not execute unless the upstream `test` job exits with a zero status code, enforcing correctness before containerization.

---

## 🛠️ DevOps Toolchain & Integrations

### ⚙️ Orchestration & Automation Platforms

| Tool | Role |
|---|---|
| **GitHub Actions** | Declarative workflow engine; all pipelines are defined as YAML-based event-driven automation |
| **GitHub-Hosted Runners** (`ubuntu-latest`) | Ephemeral, pre-provisioned CI execution environments for build and test stages |
| **Self-Hosted Runner** | Persistent deployment target for the static website pipeline; executes `docker pull`, `docker stop/rm/run` against the live server environment |

### 📦 Container & Image Management

| Tool | Role |
|---|---|
| **Docker** | Containerization runtime; all three application stacks are packaged as portable OCI-compliant images |
| **Docker Hub** | Central container registry; acts as the artifact store between the CI (build) and CD (deploy) stages |
| **`docker/login-action@v4`** | Handles secure, secret-based registry authentication within workflow jobs |
| **`docker/build-push-action@v6`** | Executes multi-stage-aware Docker builds and pushes tagged images atomically |

### 🌐 Target Deployment Environments

| Environment | Pipeline | Stack |
|---|---|---|
| **Docker Hub (Registry)** | Flask App, Node App, Static Site | Image push + semantic versioning |
| **Self-Hosted Server** | Static Nginx Website | Container lifecycle management via Docker CLI |
| **GitHub Actions Runner** | Node Practice CI | Lint + test validation only (no deployment target) |

### 📝 Configuration Languages

| Language | Usage |
|---|---|
| **YAML** | All workflow definitions (`.github/workflows/*.yaml`) |
| **Dockerfile** | Container image build instructions for Python, Node.js, and Nginx stacks |
| **Shell (Bash)** | Inline `run` steps for Docker lifecycle commands (`docker pull`, `docker stop`, `docker rm`, `docker run`) |

---

## 🏗️ Pipeline Architecture & Design Patterns

### 1. Job Dependency Isolation via `needs:`

Every multi-stage pipeline in this repository enforces a strict linear dependency chain using the native GitHub Actions `needs:` keyword:

```
test  ──►  build_push  ──►  deploy
```

This pattern guarantees that:
- The **test job** is a mandatory quality gate — failure here halts the entire pipeline immediately.
- The **build_push job** only executes on a verified, passing codebase, ensuring no untested code is ever containerized.
- The **deploy job** only pulls and runs an image that has been independently validated and registered in the artifact store.

Each job runs on a fresh runner instance, providing full environment isolation between stages and eliminating shared-state side effects.

### 2. Immutable, Versioned Artifact Strategy

The Flask App pipeline implements dual-tag image versioning:

```yaml
tags: |
  ${{ secrets.DOCKERHUB_USERNAME }}/flask-app:latest
  ${{ secrets.DOCKERHUB_USERNAME }}/flask-app:v${{ github.run_number }}
```

The `latest` tag provides a stable, predictable pull target for deployment automation. The `v${{ github.run_number }}` tag creates an **immutable audit trail** — every successful pipeline run produces a uniquely addressable image that can be rolled back to at any point. This is the foundation of a sound artifact lifecycle management strategy.

### 3. Path-Scoped Monorepo Trigger Isolation

All workflows implement `paths:` filters to restrict execution to changes within their application boundary:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'flask-app-pipeline/**'
```

This pattern allows multiple independent application pipelines to coexist in a single repository without triggering unnecessary workflow runs. Only the pipeline that owns the modified code is activated — a critical optimization for monorepo CI efficiency and runner-minute conservation.

### 4. Ephemeral Runner vs. Self-Hosted Runner Separation of Concerns

The architecture deliberately separates the **build environment** from the **deployment environment**:

- `ubuntu-latest` (GitHub-hosted, ephemeral): Used for all CI stages — checkout, dependency install, test execution, and Docker image build/push. These runners are stateless and discarded after each job, ensuring build reproducibility.
- `self-hosted` (persistent, infrastructure-bound): Used exclusively in the deploy stage of the static website pipeline. This runner has direct access to the Docker daemon on the target server and executes the container lifecycle commands (`docker pull`, `docker stop`, `docker rm`, `docker run`) against the live environment.

### 5. Secrets-Based Credential Isolation

No credentials are hardcoded anywhere in the repository. All sensitive values — Docker Hub credentials, server access keys — are injected at runtime via GitHub Actions encrypted secrets:

```yaml
username: ${{ secrets.DOCKER_USERNAME }}
password: ${{ secrets.DOCKER_PASSWORD }}
```

This enforces the **Principle of Least Privilege**: the workflow YAML files are fully public and auditable, while the actual credentials remain scoped to the repository's secret store and are never exposed in logs or artifacts.

### 6. Working Directory Scoping for Monorepo Jobs

Jobs targeting a specific subdirectory use `defaults.run.working-directory` to scope all `run` steps to the correct application root:

```yaml
defaults:
  run:
    working-directory: ./node-app-pipeline
```

This eliminates the need for repetitive `cd` prefixes in every shell step and makes the working context declarative and immediately auditable from the job definition.

---

## 🔄 Inside the Workflow Execution

The following describes the end-to-end execution flow for the **Static Website Pipeline** — the most complete three-stage pipeline in this repository:

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER                                                        │
│  git push to main → path match: simple-nginx-static-pipeline/** │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  JOB 1 · test  (ubuntu-latest)                                  │
│  ① actions/checkout@v4   — clone repository at HEAD            │
│  ② Validation step       — confirm source integrity             │
│  ✅ Exit 0 → gate opens for downstream job                      │
└────────────────────────────┬────────────────────────────────────┘
                             │  needs: test
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  JOB 2 · build_push  (ubuntu-latest)                            │
│  ① actions/checkout@v4       — fresh checkout on new runner     │
│  ② docker/login-action@v4    — authenticate to Docker Hub       │
│     via encrypted secrets (DOCKER_USERNAME / DOCKER_PASSWORD)   │
│  ③ docker/build-push-action@v6                                  │
│     — build FROM nginx:alpine, COPY static assets               │
│     — push tagged image to Docker Hub registry                  │
│     — image tag: <username>/my-static-website:latest            │
│  ✅ Image registered in artifact store                          │
└────────────────────────────┬────────────────────────────────────┘
                             │  needs: build_push
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  JOB 3 · Deploy  (self-hosted runner on target server)          │
│  ① docker pull <username>/my-static-website:latest              │
│     — retrieve the exact immutable artifact from registry       │
│  ② docker stop my-website-container || true                     │
│     — gracefully terminate running container (idempotent)       │
│  ③ docker rm my-website-container || true                       │
│     — remove stale container (idempotent, no failure on miss)   │
│  ④ docker run -d --name my-website-container -p 8080:80 ...     │
│     — launch new container, expose Nginx on port 8080           │
│  ✅ Application live at http://<server>:8080                    │
└─────────────────────────────────────────────────────────────────┘
```

The `|| true` pattern on `docker stop` and `docker rm` is a deliberate **idempotence** implementation — the deploy job succeeds regardless of whether a prior container exists, making it safe to run on a clean server or during a rollback scenario without manual intervention.

---

## 📁 Repository Structure

```
ci-cd-Pipeline/
│
├── .github/
│   └── workflows/
│       ├── ci.yaml                      # Flask App: test → build → Docker Hub push
│       ├── node-app.yaml                # Node App: test → build → Docker Hub push
│       ├── static-website-pipeline.yaml # Nginx Static: test → build → self-hosted deploy
│       ├── gha-node-practice.yaml       # Node CI: lint → unit test (no deploy)
│       └── simple-pipeline-1.yaml       # Foundational pipeline skeleton
│
├── flask-app-pipeline/                  # Python Flask app (Python 3.10, pytest)
│   ├── app.py
│   ├── test_app.py
│   ├── requirements.txt
│   └── Dockerfile                       # FROM python:3.14-slim, EXPOSE 5000
│
├── node-app-pipeline/                   # Node.js Express app (Node 20, Alpine)
│   ├── server.js
│   ├── public/
│   ├── package.json
│   └── Dockerfile                       # FROM node:20-alpine, EXPOSE 3000
│
├── simple-nginx-static-pipeline/        # Static HTML/CSS served via Nginx
│   ├── index.html
│   └── Dockerfile                       # FROM nginx:alpine, EXPOSE 80
│
└── Practice-Gha-Node/                   # GitHub Actions practice: ESLint + Jest
    ├── src/sum.js
    ├── test/sum.test.js
    └── eslint.config.js
```

---

## 🚀 Enterprise Best Practices Applied

| Practice | Implementation |
|---|---|
| **Declarative Workflow Syntax** | All pipeline logic is expressed as YAML-based declarative configuration — no imperative shell scripts managing workflow state |
| **Fail-Fast Gate Enforcement** | `needs:` dependency chains ensure zero-tolerance for test failures before containerization or deployment proceeds |
| **Immutable Artifact Versioning** | Dual-tag strategy (`latest` + `v${{ github.run_number }}`) enables both automated deployment and manual rollback to any historical build |
| **Idempotent Deployment Commands** | `docker stop \|\| true` and `docker rm \|\| true` patterns ensure deploy jobs are re-runnable without side effects |
| **Monorepo Path Isolation** | `paths:` filters eliminate cross-application pipeline pollution and reduce unnecessary runner consumption |
| **Secrets-Scoped Credential Management** | All sensitive values injected via `${{ secrets.* }}` — zero credentials in version-controlled files |
| **Pinned Action Versions** | All third-party actions reference explicit major version tags (`@v4`, `@v6`) to prevent supply-chain drift and ensure reproducible builds |
| **Ephemeral Build Environments** | GitHub-hosted `ubuntu-latest` runners are provisioned fresh per job, eliminating environment state accumulation between runs |
| **Self-Hosted Runner for Deployment** | Persistent runner on the target server avoids SSH-based deployment complexity while maintaining direct Docker daemon access |
| **npm ci over npm install** | The Node practice pipeline uses `npm ci` for deterministic, lockfile-driven dependency resolution — the correct choice for CI environments |
| **Dependency Caching** | Node pipeline configures `cache: npm` in `actions/setup-node` to reduce cold-start dependency installation time |

---



[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/danish-ali-47950b366?utm_source=share_via&utm_content=profile&utm_medium=member_android)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/danish-ali-droid)
[![Email](https://img.shields.io/badge/Email-Contact-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:0000danishsh@gmail.com)


---


</div>
