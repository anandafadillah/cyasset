#!/usr/bin/env bash
# Backup harian database Postgres CyAsset — dump terkompresi, retensi 7 hari.
# Dipanggil lewat cron di VM (lihat DEPLOYMENT.md). Jalankan dari root project
# (tempat docker-compose.prod.yml berada), atau set CYASSET_DIR ke path itu.

set -euo pipefail

CYASSET_DIR="${CYASSET_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${CYASSET_DIR}/backups"
RETENTION_DAYS=7
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/cyasset-${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"
cd "${CYASSET_DIR}"

docker compose -f docker-compose.prod.yml exec -T db pg_dump -U cyasset cyasset | gzip > "${OUT_FILE}"

echo "Backup tersimpan: ${OUT_FILE} ($(du -h "${OUT_FILE}" | cut -f1))"

find "${BACKUP_DIR}" -name "cyasset-*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
