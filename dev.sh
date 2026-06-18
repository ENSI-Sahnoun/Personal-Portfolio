#!/bin/bash
trap "kill 0" EXIT
echo "=== Starting decap-server (no git) ==="
npx decap-server &
sleep 1
echo "=== Starting push-server ==="
node push-server.js &
sleep 1
echo "=== Generating writeup git dates ==="
bash scripts/gen-writeup-dates.sh
echo "=== Starting Hugo ==="
hugo server &
wait
