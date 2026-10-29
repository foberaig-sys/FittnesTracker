#!/usr/bin/env bash
# Erzeugt den Branch "snack" aus dem aktuellen Stand von main: nur App-Code und
# Konfiguration, ohne Bilder, Lockfile und Entwicklungs-Tools (Snack-Import).
set -euo pipefail
root=$(git rev-parse --show-toplevel)
tmp=$(mktemp -d)
git -C "$root" worktree add -f "$tmp" main --detach >/dev/null
cd "$tmp"
git rm -rq --ignore-unmatch assets .claude scripts LICENSE AGENTS.md eslint.config.js tsconfig.json eas.json package-lock.json .gitignore
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
delete pkg.devDependencies; delete pkg.scripts;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
const app = JSON.parse(fs.readFileSync("app.json", "utf8"));
const { icon, splash, android, web, ...rest } = app.expo;
rest.plugins = ["expo-router"];
fs.writeFileSync("app.json", JSON.stringify({ expo: rest }, null, 2) + "\n");
'
git add -A
git commit -qm "Snack-Version aus main ($(git -C "$root" rev-parse --short main))"
sha=$(git rev-parse HEAD)
git -C "$root" branch -f snack "$sha"
cd "$root" && git worktree remove --force "$tmp"
echo "Branch snack aktualisiert."
