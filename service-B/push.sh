#!/bin/bash
# Pushes this folder to https://github.com/elston17/service-B
set -e
cd "$(dirname "$0")"
git init -q 2>/dev/null || true
git add -A
git -c user.email=elstontankw@gmail.com -c user.name=elston17 \
    commit -q -m "RouteWise: Telegram bot and Mini App booking form" || true
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/elston17/service-B.git
git push -u origin main
echo
echo "Done. Now turn on Pages:"
echo "https://github.com/elston17/service-B/settings/pages"
echo "Source: Deploy from a branch -> main -> /docs -> Save"
