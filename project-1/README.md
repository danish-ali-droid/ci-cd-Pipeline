# project-1

A small Flask application with CI/CD workflow support for testing, container build, and Docker Hub deployment.

## 1. Overview

This repository contains:

- `app.py` — the Flask application entrypoint.
- `Dockerfile` — container image build instructions.
- `requirements.txt` — Python dependencies.
- `test_app.py` — unit tests for the Flask app.

## 2. Prerequisites

Before running the CI/CD workflow, make sure you have the following configured:

- GitHub Actions enabled for this repository.
- Repository secrets in GitHub under `Settings > Secrets and variables > Actions`:
  - `DOCKERHUB_USERNAME` — Docker Hub username.
  - `DOCKERHUB_PASSWORD` — Docker Hub password.

## 3. Local Development & Testing

Run the following commands from the repository root to set up and verify the project locally:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run unit tests
pytest test_app.py

# Build the Docker image locally
docker build -t flask-app .
```

## 4. CI/CD Pipeline Status

The GitHub Actions pipeline is designed to ensure every code change is validated and packaged before deployment.

| Stage      | Action        | Purpose / Outcome                                  |
|------------|---------------|----------------------------------------------------|
| CI: Test   | `pytest`      | Verifies application behavior and prevents regressions |
| CD: Build  | `docker build`| Builds the Docker image for deployment             |
| CD: Push   | `docker push` | Pushes the image to Docker Hub for release         |

## 5. Notes

- Use a stable Python environment matching `requirements.txt`.
- Confirm Docker is installed and running before building images.
- Update repository secrets if your Docker Hub credentials change.

