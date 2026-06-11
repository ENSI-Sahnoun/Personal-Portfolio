#!/bin/bash
trap "kill 0" EXIT
echo "=== Starting decap-server ==="
npx decap-server &
sleep 1
echo "=== Starting Hugo ==="
hugo server &
wait
