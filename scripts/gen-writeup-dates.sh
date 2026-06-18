#!/bin/bash
# Outputs data/writeup-git-dates.json — array of commit dates touching writeups/
mkdir -p "$(dirname "$0")/../data"
git -C "$(dirname "$0")/.." log --format="%ad" --date=short -- "content/writeups/" \
  | grep -v '^$' \
  | node -e "const l=[];process.stdin.on('data',d=>l.push(...d.toString().trim().split('\n').filter(Boolean)));process.stdin.on('end',()=>process.stdout.write(JSON.stringify({dates:l})))" \
  > "$(dirname "$0")/../data/writeupdates.json"
