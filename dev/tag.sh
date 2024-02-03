#!/usr/bin/env bash
# Confirm the first argument is one of major, minor, or patch
if [[ ! $1 =~ ^(major|minor|patch)$ ]]; then
    echo "First argument must be one of major, minor, or patch"
    exit 1
fi
# Confirm the second argument is not empty
if [[ -z $2 ]]; then
    echo "Second argument must be a commit message"
    exit 1
fi
npm run build && git add . && git commit --allow-empty -m"$2"
version=$(npm version "$1")
echo "npm version is now $version"
# echo "Tagging $version"
# git tag -a "$version" -m"$2"
git push && git push origin "$version"
