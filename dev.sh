#!/bin/bash
# Dev server with auto-commit
trap "kill 0" EXIT
echo "=== Starting decap-server ==="
npx decap-server &
sleep 1
echo "=== Starting Hugo ==="
hugo server &
sleep 2
echo "=== Watching for changes (auto-commit on save) ==="
while inotifywait -qq -r -e modify,create,delete,move content/ config/; do
  sleep 1
  if git status --porcelain | grep -q .; then
    git add -A && git commit -m "Update from CMS" && git push && echo "✓ Pushed"
  fi
done
