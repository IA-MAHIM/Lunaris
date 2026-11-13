#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if [ "$#" -ne 1 ]; then
  echo "Usage: sh GET_REAL_JPL_DATA_MAC_LINUX.sh YOUR_REAL_EMAIL@domain.com"
  exit 1
fi
python3 scripts/fetch_horizons.py --contact "$1" --start 2026-11-13 --days 14 --step-hours 3 --sites south-pole polar-ridge polar-basin polar-plateau
