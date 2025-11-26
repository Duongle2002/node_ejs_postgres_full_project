#!/usr/bin/env bash
set -euo pipefail

# Small bootstrap script for an Ubuntu/Debian Jenkins agent to install Docker & docker compose plugin
# Run as root or with sudo.

apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release

mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add jenkins user to docker group (replace jenkins with your agent user)
if id -u jenkins >/dev/null 2>&1; then
  usermod -aG docker jenkins || true
fi

echo "Docker and docker compose plugin installed. Restart agent or re-login for group changes to apply."
