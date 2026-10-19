#!/usr/bin/env bash
# Build the static export and publish it to the gh-pages branch, which
# GitHub Pages serves at https://guimuguo.github.io/grantagent-demo/.
set -euo pipefail
cd "$(dirname "$0")"

BASE_PATH=/grantagent-demo npx next build
touch out/.nojekyll   # keep GitHub Pages from hiding the _next/ directory

rev=$(git rev-parse --short HEAD)
tmp=$(mktemp -d)
cp -r out/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git commit -qm "Deploy demo from $rev"
git push -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
rm -rf "$tmp"
echo "Deployed $rev → https://guimuguo.github.io/grantagent-demo/"
