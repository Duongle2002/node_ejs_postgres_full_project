#!/usr/bin/env bash
# Import a local plain-SQL pg dump into a Postgres Docker container.
# Usage (on the Docker host):
#   EDIT the variables below or pass env vars and run:
#     LOCAL_DUMP_PATH=/path/to/ecommerce.sql CONTAINER_NAME=shop-postgres ./scripts/import_local_to_container.sh
# Notes:
# - This script will BACKUP the current database inside the container to ./container-ecommerce-backup.sql
# - By default it will DROP and CREATE the target database (overwrite). Set DO_DROP_DB to "no" to append/merge instead.
# - The local dump should be a plain SQL file (pg_dump -F p). Avoid custom format (-Fc) unless you plan to use pg_restore with matching versions.

set -euo pipefail

# === Configuration (override via env or edit here) ===
LOCAL_DUMP_PATH=${LOCAL_DUMP_PATH:-"/tmp/ecommerce.sql"}
CONTAINER_NAME=${CONTAINER_NAME:-"shop-postgres"}
POSTGRES_USER=${POSTGRES_USER:-"postgres"}
DB_NAME=${DB_NAME:-"ecommerce"}
DO_DROP_DB=${DO_DROP_DB:-"yes"} # yes|no
BACKUP_ON_HOST=${BACKUP_ON_HOST:-"./container-ecommerce-backup.sql"}

# === Helpers ===
err() { echo "[ERROR] $*" >&2; }
info() { echo "[INFO] $*"; }

# === Sanity checks ===
if ! command -v docker >/dev/null 2>&1; then
  err "docker not found in PATH. Run this on the Docker host."
  exit 2
fi

if [ ! -f "$LOCAL_DUMP_PATH" ]; then
  err "Local dump not found: $LOCAL_DUMP_PATH"
  exit 3
fi

if ! docker ps --format '{{.Names}}' | grep -xq "$CONTAINER_NAME"; then
  err "Container '$CONTAINER_NAME' not running or not found. Run 'docker ps' to confirm."
  exit 4
fi

info "Container: $CONTAINER_NAME"
info "Local dump: $LOCAL_DUMP_PATH"
info "Target DB: $DB_NAME (user=$POSTGRES_USER)"
info "Drop & recreate DB: $DO_DROP_DB"

read -p "Proceed? (y/N): " answer
if [ "${answer,,}" != "y" ]; then
  info "Aborting."; exit 1
fi

# === 1) Backup current DB inside container to host file ===
info "Creating backup of current DB inside container..."
# create backup inside container
docker exec -u "$POSTGRES_USER" -i "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" -d "$DB_NAME" -F p -f "/tmp/container-backup.sql" || {
  err "Warning: pg_dump inside container failed (maybe DB doesn't exist). Continuing..."
}
# copy backup to host (if it exists)
docker cp "$CONTAINER_NAME":/tmp/container-backup.sql "$BACKUP_ON_HOST" 2>/dev/null || info "No container backup found to copy, continuing."
info "Container DB backup saved to: $BACKUP_ON_HOST"

# === 2) Copy local dump into container ===
info "Copying local dump into container..."
docker cp "$LOCAL_DUMP_PATH" "$CONTAINER_NAME":/tmp/import.sql

# === 3) Optionally drop & recreate database ===
if [ "$DO_DROP_DB" = "yes" ]; then
  info "Dropping and recreating database '$DB_NAME' inside container (this WILL erase data)..."
  docker exec -u "$POSTGRES_USER" -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "REVOKE CONNECT ON DATABASE \"$DB_NAME\" FROM PUBLIC;" 2>/dev/null || true
  docker exec -u "$POSTGRES_USER" -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid<>pg_backend_pid();" 2>/dev/null || true
  docker exec -u "$POSTGRES_USER" -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
  docker exec -u "$POSTGRES_USER" -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$POSTGRES_USER\";"
else
  info "Skipping drop/recreate; restore will run against existing DB (may cause conflicts)."
fi

# === 4) Restore ===
info "Restoring /tmp/import.sql into database '$DB_NAME'..."
# Use psql -f inside container
docker exec -u "$POSTGRES_USER" -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$DB_NAME" -f /tmp/import.sql

# === 5) Done, verify ===
info "Restore finished. Running basic verification..."
info "Tables:"
docker exec -u "$POSTGRES_USER" -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$DB_NAME" -c "\dt"
info "Sample users (if table exists):"
docker exec -u "$POSTGRES_USER" -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$DB_NAME" -c "SELECT id,email,role FROM users LIMIT 10;" || true

info "All done. If something went wrong you can restore the pre-backup stored at: $BACKUP_ON_HOST"

exit 0
