#!/usr/bin/env bash
set -euo pipefail

cv_dir="$(cd "$(dirname "$0")" && pwd)"
target="$(dirname "$cv_dir")/backend/media/CV Joppe Koers.pdf"
build_dir="$(mktemp -d)"
trap 'rm -rf "$build_dir"' EXIT

cp "$cv_dir"/cv.tex "$cv_dir"/*.png "$build_dir"

# Two passes so hyperref resolves its outline.
compile='pdflatex -interaction=nonstopmode -halt-on-error cv.tex >/dev/null && pdflatex -interaction=nonstopmode -halt-on-error cv.tex >/dev/null'
if command -v pdflatex >/dev/null; then
	(cd "$build_dir" && sh -c "$compile") || { cat "$build_dir/cv.log"; exit 1; }
else
	docker run --rm -u "$(id -u):$(id -g)" -v "$build_dir":/w -w /w texlive/texlive:latest-full sh -c "$compile" ||
		{ cat "$build_dir/cv.log"; exit 1; }
fi

mkdir -p "$(dirname "$target")"
mv "$build_dir/cv.pdf" "$target"
echo "Wrote '$target'"
