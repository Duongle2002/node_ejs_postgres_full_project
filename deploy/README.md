# Deployment (Docker + Jenkins on CentOS Stream 10)

This repo includes production Dockerfiles, an NGINX config for the SPA, a docker-compose file, and a Jenkins pipeline to build, push, and deploy.

## 1) Prerequisites on the CentOS Server
- Docker Engine and Docker Compose v2 installed
- Jenkins installed; Jenkins user in the `docker` group (`sudo usermod -aG docker jenkins` then restart Jenkins)
- A Docker registry account (Docker Hub or private registry)

## 2) Configure Jenkins
1. Create a credential with ID `REGISTRY_CREDS` (Username with password) for your registry.
2. Create a Pipeline job pointing at this repository.
3. Set parameters on first run:
   - `REGISTRY`: e.g. `docker.io`
   - `IMAGE_PREFIX`: e.g. your Docker Hub username/org
   - `IMAGE_TAG`: leave empty to use the short commit SHA
   - `DEPLOY`: true to deploy on the same host with compose

Optional: Add environment variables `DATABASE_URL`, `JWT_SECRET`, `PAYPAL_CLIENT_ID`, etc. as Jenkins Global envs or pass them as build parameters, so the Deploy stage exports them to the compose file.

## 3) Build & Deploy
- Run the Jenkins job; it will:
  - Build and push two images: `${REGISTRY}/${IMAGE_PREFIX}/shop-backend` and `${REGISTRY}/${IMAGE_PREFIX}/shop-frontend` tagged by commit and `latest`.
  - Deploy with `deploy/docker-compose.prod.yml` on the Jenkins host.

## 4) Using external Postgres
- Set `DATABASE_URL` like: `postgres://user:pass@db-host:5432/dbname`.
- Optionally set `DB_SSL=true` if your provider requires SSL.
- You may remove or ignore the `db` service in compose when using an external DB.

### DB cài trực tiếp trên server (không chạy trong Docker)
- Cách đơn giản nhất để backend trong container kết nối về DB trên máy host là dùng hostname `host.docker.internal`.
- Cấu hình trong `deploy/.env`:
  - `DATABASE_URL=postgres://user:pass@host.docker.internal:5432/yourdb`
  - `DB_SSL=false` (trừ khi bạn bật SSL cho Postgres)
- Trong `deploy/docker-compose.prod.yml` đã thêm `extra_hosts: ["host.docker.internal:host-gateway"]` cho service `backend`.
- Lưu ý cấu hình Postgres trên host:
  - `postgresql.conf`: `listen_addresses = '*'` (hoặc ít nhất lắng nghe trên địa chỉ của bridge docker)
  - `pg_hba.conf`: cho phép subnet Docker (ví dụ `172.17.0.0/16`) kết nối: `host all all 172.17.0.0/16 md5`
  - Tường lửa (firewalld): chỉ mở cổng 5432 cho nội bộ nếu cần, ví dụ chỉ allow từ `172.17.0.0/16`.
  - Khởi động lại Postgres sau khi chỉnh: `sudo systemctl restart postgresql` (tên service có thể khác tùy bản cài đặt).

## 5) Local Postgres via Compose (default)
- `db` service uses `postgres:15-alpine` with defaults from `deploy/.env.example`.
- Backend uses `DATABASE_URL=postgres://shop:shop@db:5432/shop` unless overridden.

## 6) Ports
- Frontend serves on port 80 (host mapped to `80:80`).
- Backend listens on `3001` inside the network and is reverse-proxied by NGINX.

## 7) Files Added
- `Dockerfile` (backend)
- `frontend/Dockerfile` (frontend build -> NGINX)
- `frontend/nginx.conf` (SPA + proxy to backend)
- `deploy/docker-compose.prod.yml`
- `deploy/.env.example`
- `Jenkinsfile`
- `.dockerignore` and `frontend/.dockerignore`

---
Tip: Copy `deploy/.env.example` to `deploy/.env` and adjust values for production when running compose manually.
