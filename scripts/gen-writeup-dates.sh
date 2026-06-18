#!/bin/bash
# Outputs data/writeup-git-dates.json — array of commit dates touching writeups/
mkdir -p "$(dirname "$0")/../data"
git -C "$(dirname "$0")/.." log --format="%ad" --date=short -- "content/writeups/" \
  | grep -v '^$' \
  | jq -R . | jq -s '{"dates": .}' \
  > "$(dirname "$0")/../data/writeup-git-dates.json"
