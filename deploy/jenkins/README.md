# Jenkins setup for node-ejs-postgres-full_project

This document describes how to configure Jenkins to build, push and deploy this project using the included `Jenkinsfile`.

Overview
- The repository already contains a `Jenkinsfile` that builds backend/frontend Docker images, pushes them to a registry and deploys using a docker-compose file (`deploy/docker-compose.prod.yml`).
- We will create a Multibranch Pipeline (recommended) or a Pipeline job that uses the `Jenkinsfile` from SCM.

Prerequisites on Jenkins host / agent
- A Jenkins controller (UI) and at least one executor/agent that can run Docker commands.
- The build agent that executes the pipeline must have:
  - Docker Engine installed and the Jenkins user must be able to run `docker` (or run the agent container with `/var/run/docker.sock` mounted).
  - `docker compose` (v2 plugin) available on PATH (the `Jenkinsfile` prefers `docker compose` but falls back to `docker-compose`).
  - Java (for Jenkins agent) and Git.

High level steps
1. Add required credentials in Jenkins Credentials store.
2. Create a Multibranch Pipeline (or Pipeline) that points to this Git repository.
3. Configure job parameters as needed and run the pipeline.

Required credentials and how to add them
- `REGISTRY_CREDS` (Username with password) — Docker registry credentials (e.g., Docker Hub username + password or token). The `Jenkinsfile` expects a credentials ID named `REGISTRY_CREDS`.
- Optional secret text credentials: `DATABASE_URL`, `JWT_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` — use "Secret text" type and the same IDs if you want the pipeline to export them directly.

Ways to add credentials (recommended):
- Use the Jenkins UI: Jenkins -> Credentials -> System -> Global credentials -> Add Credentials.
- Or use the Jenkins Script Console (see scripts in `scripts/jenkins/` for examples).

Create the job
- Option A (recommended): Multibranch Pipeline
  - New Item -> Multibranch Pipeline -> Source: Git -> enter repository URL and credentials -> Save.
  - Jenkins will scan branches and run `Jenkinsfile`.
- Option B: Pipeline job
  - New Item -> Pipeline -> Pipeline script from SCM -> Git -> repository URL -> Script Path: `Jenkinsfile`.

Environment/Parameters
- The Jenkinsfile defines parameters (REGISTRY, IMAGE_PREFIX, IMAGE_TAG, DEPLOY, COMPOSE_FILE, BACKEND_PORT, FRONTEND_PORT). You can override them at build time.
- Ensure `deploy/docker-compose.prod.yml` uses `${IMAGE_PREFIX}` and `${IMAGE_TAG}` placeholders (it already does).

Deployment behavior
- When `DEPLOY` is true, the pipeline will run `docker compose -f ${COMPOSE_FILE} pull` and `up -d` on the Jenkins host. This means the Jenkins agent must be the target host for deployment (it will run the compose command locally).
- Alternatively, adapt `Jenkinsfile` to SSH into the deployment host if your Jenkins agent is not the host where you want to deploy.

Troubleshooting
- If docker commands fail, check the agent's permissions and that Docker runs without sudo or configure sudoers for the Jenkins user.
- If compose reports missing images, ensure the pipeline pushed images to the registry and `IMAGE_PREFIX`/`IMAGE_TAG` are correct.

Automation scripts
- See `scripts/jenkins/` for helper scripts to add credentials and create a Multibranch job using the Jenkins Script Console or CLI.

If you want, I can:
- generate the Groovy scripts and a Job DSL or show the exact UI clicks and values. I can also create a small `bootstrap` script to install Docker and Docker Compose on an Ubuntu agent.
