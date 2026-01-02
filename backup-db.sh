#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp database.sqlite backup/database_$DATE.sqlite
# Keep only last 7 backups
ls -t backup/database_*.sqlite | tail -n +8 | xargs rm -f
