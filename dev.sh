#!/bin/bash
trap "kill 0" EXIT
echo "=== Starting local-server (no git) ==="
node local-server.js &
sleep 1
echo "=== Starting push-server ==="
node push-server.js &
sleep 1
echo "=== Starting Hugo ==="
hugo server &
wait
