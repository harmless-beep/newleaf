#!/bin/sh
# Installs the repo's commit-msg hook into this checkout so every commit is
# authored by the repo owner alone (strips any co-author footer).
# Run from anywhere in the repo:  sh scripts/install-git-hooks.sh
set -e
cd "$(dirname "$0")/.."
mkdir -p .git/hooks
cp git-hooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
echo "commit-msg hook installed — commits in this checkout are authored by the repo owner alone."