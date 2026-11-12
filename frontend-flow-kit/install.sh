#!/usr/bin/env bash
# Front-end flow kit installer.
#
# Copies the agents, skills, instructions, MCP configs, convention checker and QA visual harness into another
# repository, fills the placeholders, creates the .claude/ symlinks, merges package.json and .gitignore, and
# prints what is left to adapt by hand (every <!-- ADAPT --> / // ADAPT: marker).
#
# Usage:
#   ./install.sh <target-repo> --name <ProjectName> --client-app <repo-relative path> [options]
#
# Options:
#   --app-url <url>          Live app URL for manual and Playwright MCP checks   (default http://localhost:5173)
#   --backend-build <cmd>    Command to run when a DTO changes                   (default "no backend build")
#   --build-output <path>    Repo-relative build output                          (default <client-app>/dist)
#   --images-dir <path>      Repo-relative folder for Figma-exported images      (default <client-app>/public/images)
#   --vault-dir <path>       Repo-relative Obsidian vault                        (default Docs/Vault/<name>)
#   --no-vault               Skip vault instructions, skills and seed
#   --no-harness             Skip the Playwright visual harness (qa-agent will be BLOCKED without it)
#   --with-charts            Also add echarts to package.json
#   --install                Run npm install + npx playwright install chromium after merging package.json
#   --force                  Overwrite files that already exist (default: keep them and report)
#   --dry-run                Show what would happen, change nothing
#
# Requirements: bash, git, node (for the package.json merge), perl.

set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MARKER="frontend-flow-kit"

die() { echo "error: $*" >&2; exit 1; }
info() { echo "  $*"; }

[ $# -ge 1 ] || { sed -n '2,25p' "$0"; exit 1; }
TARGET="$1"; shift

NAME=""; CLIENT_APP=""; APP_URL="http://localhost:5173"; BACKEND_BUILD="no backend build"
BUILD_OUTPUT=""; IMAGES_DIR=""; VAULT_DIR=""
WITH_VAULT=1; WITH_HARNESS=1; WITH_CHARTS=0; DO_INSTALL=0; FORCE=0; DRY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --name) NAME="$2"; shift 2 ;;
    --client-app) CLIENT_APP="${2%/}"; shift 2 ;;
    --app-url) APP_URL="$2"; shift 2 ;;
    --backend-build) BACKEND_BUILD="$2"; shift 2 ;;
    --build-output) BUILD_OUTPUT="${2%/}"; shift 2 ;;
    --images-dir) IMAGES_DIR="${2%/}"; shift 2 ;;
    --vault-dir) VAULT_DIR="${2%/}"; shift 2 ;;
    --no-vault) WITH_VAULT=0; shift ;;
    --no-harness) WITH_HARNESS=0; shift ;;
    --with-charts) WITH_CHARTS=1; shift ;;
    --install) DO_INSTALL=1; shift ;;
    --force) FORCE=1; shift ;;
    --dry-run) DRY=1; shift ;;
    *) die "unknown option $1" ;;
  esac
done

[ -n "$NAME" ] || die "--name is required"
[ -n "$CLIENT_APP" ] || die "--client-app is required (repo-relative, e.g. Src/Foo.Web/ClientApp, or .)"
[ -d "$TARGET" ] || die "target $TARGET does not exist"
TARGET="$(cd "$TARGET" && pwd)"
git -C "$TARGET" rev-parse --show-toplevel >/dev/null 2>&1 || die "$TARGET is not a git repository"
[ "$(git -C "$TARGET" rev-parse --show-toplevel)" = "$TARGET" ] || die "$TARGET must be the repository root"
[ "$TARGET" != "$(cd "$KIT_DIR/.." && pwd)" ] || die "refusing to install into the kit's own repository"
command -v node >/dev/null || die "node is required"
command -v perl >/dev/null || die "perl is required"

CLIENT_APP="${CLIENT_APP#./}"; [ -n "$CLIENT_APP" ] || CLIENT_APP="."
CLIENT_DIR="$TARGET/$CLIENT_APP"
[ -d "$CLIENT_DIR" ] || die "client app folder $CLIENT_APP does not exist in the target (scaffold Vite + Vue first)"
[ -f "$CLIENT_DIR/package.json" ] || die "$CLIENT_APP/package.json not found (scaffold Vite + Vue first)"

prefix() { [ "$CLIENT_APP" = "." ] && echo "$1" || echo "$CLIENT_APP/$1"; }
[ -n "$BUILD_OUTPUT" ] || BUILD_OUTPUT="$(prefix dist)"
[ -n "$IMAGES_DIR" ] || IMAGES_DIR="$(prefix public/images)"
[ -n "$VAULT_DIR" ] || VAULT_DIR="Docs/Vault/$NAME"
TODAY="$(date +%Y-%m-%d)"

echo "Front-end flow kit → $TARGET"
info "project:        $NAME"
info "client app:     $CLIENT_APP"
info "app url:        $APP_URL"
info "backend build:  $BACKEND_BUILD"
info "build output:   $BUILD_OUTPUT"
info "images dir:     $IMAGES_DIR"
info "vault:          $([ $WITH_VAULT = 1 ] && echo "$VAULT_DIR" || echo skipped)"
info "visual harness: $([ $WITH_HARNESS = 1 ] && echo yes || echo skipped)"
if [ $DRY = 1 ]; then echo "(dry run: nothing is written)"; fi
echo

COPIED=(); SKIPPED=()

# Fill only the kit placeholders in one file.
fill() {
  KIT_NAME="$NAME" KIT_CLIENT_APP="$CLIENT_APP" KIT_APP_URL="$APP_URL" KIT_BACKEND="$BACKEND_BUILD" \
  KIT_BUILD_OUTPUT="$BUILD_OUTPUT" KIT_IMAGES="$IMAGES_DIR" KIT_VAULT="$VAULT_DIR" KIT_TODAY="$TODAY" \
  perl -pi -e '
    s/\{\{PROJECT_NAME\}\}/$ENV{KIT_NAME}/g;      s/\{\{CLIENT_APP_DIR\}\}/$ENV{KIT_CLIENT_APP}/g;
    s/\{\{APP_URL\}\}/$ENV{KIT_APP_URL}/g;        s/\{\{BACKEND_BUILD_CMD\}\}/$ENV{KIT_BACKEND}/g;
    s/\{\{BUILD_OUTPUT_DIR\}\}/$ENV{KIT_BUILD_OUTPUT}/g; s/\{\{IMAGES_DIR\}\}/$ENV{KIT_IMAGES}/g;
    s/\{\{VAULT_DIR\}\}/$ENV{KIT_VAULT}/g;        s/\{\{TODAY\}\}/$ENV{KIT_TODAY}/g;
  ' "$1"
}

# copy_tree <src dir> <dest dir> <exclude regex or "">
copy_tree() {
  local src="$1" dest="$2" exclude="$3" rel
  while IFS= read -r -d '' file; do
    rel="${file#"$src"/}"
    if [ -n "$exclude" ] && echo "$rel" | grep -Eq "$exclude"; then continue; fi
    local out="$dest/$rel"
    if [ -e "$out" ] && [ $FORCE = 0 ]; then SKIPPED+=("${out#"$TARGET"/}"); continue; fi
    COPIED+=("${out#"$TARGET"/}")
    [ $DRY = 1 ] && continue
    mkdir -p "$(dirname "$out")"
    cp "$file" "$out"
    case "$out" in *.png|*.jpg|*.gif|*.woff*) ;; *) if grep -q "{{" "$out" 2>/dev/null; then fill "$out"; fi ;; esac
  done < <(find "$src" -type f ! -name ".DS_Store" -print0)
  return 0
}

# 1. Agents, skills, instructions, prompts, MCP configs
TEMPLATE_EXCLUDE=""
[ $WITH_VAULT = 0 ] && TEMPLATE_EXCLUDE='(skills/vault-|instructions/vault\.instructions)'
copy_tree "$KIT_DIR/template" "$TARGET" "$TEMPLATE_EXCLUDE"

# 2. Client app: convention checker (+ harness)
CLIENT_EXCLUDE='^PACKAGE\.md$'
[ $WITH_HARNESS = 0 ] && CLIENT_EXCLUDE='^(PACKAGE\.md|visual/|playwright\.config\.ts|tsconfig\.visual\.json)'
copy_tree "$KIT_DIR/clientapp" "$CLIENT_DIR" "$CLIENT_EXCLUDE"

# 3. Vault seed (only when the vault folder does not exist yet)
if [ $WITH_VAULT = 1 ]; then
  if [ -d "$TARGET/$VAULT_DIR" ]; then
    info "vault $VAULT_DIR already exists: seed not copied (check 00_Index/Tags.md has area/frontend and area/qa)"
  else
    copy_tree "$KIT_DIR/vault-seed" "$TARGET/$VAULT_DIR" ""
  fi
fi

# 4. .claude symlinks into .github (one copy of each skill)
link() { # link <link path> <relative target>
  local path="$TARGET/$1"
  if [ -L "$path" ] || [ -e "$path" ]; then SKIPPED+=("$1 (exists)"); return; fi
  COPIED+=("$1 -> $2")
  [ $DRY = 1 ] && return
  mkdir -p "$(dirname "$path")"; ln -s "$2" "$path"
}
for dir in "$KIT_DIR"/template/.github/skills/*/; do
  skill="$(basename "$dir")"
  case "$skill" in vault-*) [ $WITH_VAULT = 0 ] && continue ;; esac
  link ".claude/skills/$skill" "../../.github/skills/$skill"
done
link ".claude/commands/task-planner.md" "../../.github/prompts/task-planner.prompt.md"

# 5. Repository instructions (append a marked section once)
append_once() { # append_once <file> <snippet> <header for a new file>
  local file="$TARGET/$1"
  if [ -f "$file" ] && grep -q "$MARKER" "$file"; then SKIPPED+=("$1 (section already present)"); return; fi
  COPIED+=("$1 (front-end section appended)")
  [ $DRY = 1 ] && return
  mkdir -p "$(dirname "$file")"
  [ -f "$file" ] || printf '%s\n' "$3" > "$file"
  { echo; echo "<!-- $MARKER:start -->"; cat "$2"; echo "<!-- $MARKER:end -->"; } >> "$file"
  fill "$file"
}
append_once ".github/copilot-instructions.md" "$KIT_DIR/snippets/copilot-instructions.frontend.md" \
  "# $NAME - repository instructions"$'\n\n'"Shared by GitHub Copilot (loaded automatically) and Claude Code (imported by \`CLAUDE.md\`)."
append_once "CLAUDE.md" "$KIT_DIR/snippets/CLAUDE.frontend.md" "# $NAME"$'\n\n'"@.github/copilot-instructions.md"
if [ $DRY = 0 ] && ! grep -q '@.github/copilot-instructions.md' "$TARGET/CLAUDE.md"; then
  info "warning: CLAUDE.md does not import @.github/copilot-instructions.md; add it at the top"
fi

# 6. .gitignore
if [ -f "$TARGET/.gitignore" ] && grep -q "$MARKER" "$TARGET/.gitignore"; then
  SKIPPED+=(".gitignore (entries already present)")
else
  COPIED+=(".gitignore (entries appended)")
  [ $DRY = 0 ] && cat "$KIT_DIR/snippets/gitignore.txt" >> "$TARGET/.gitignore"
fi

# 7. package.json: add missing scripts and dependencies, never overwrite existing ones
if [ $DRY = 0 ]; then
  node - "$CLIENT_DIR/package.json" "$KIT_DIR/snippets/package-fragment.json" "$WITH_HARNESS" "$WITH_CHARTS" <<'NODE'
const fs = require('fs')
const [pkgPath, fragPath, withHarness, withCharts] = process.argv.slice(2)
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const frag = JSON.parse(fs.readFileSync(fragPath, 'utf8'))
const harnessOnly = /^(visual:|@playwright\/test$|pixelmatch$|pngjs$|@types\/pngjs$)/
const added = []
const merge = (section, entries) => {
  pkg[section] ??= {}
  for (const [k, v] of Object.entries(entries ?? {})) {
    if (withHarness === '0' && harnessOnly.test(k)) continue
    if (pkg[section][k] === undefined) { pkg[section][k] = v; added.push(`${section}.${k}`) }
  }
}
merge('scripts', frag.scripts)
merge('dependencies', frag.dependencies)
merge('devDependencies', frag.devDependencies)
if (withCharts === '1') merge('dependencies', frag.withCharts.dependencies)
if (pkg.type !== 'module') console.log('  warning: package.json has no "type": "module"; the harness .mjs/.ts files expect ESM')
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log(added.length ? `  package.json: added ${added.join(', ')}` : '  package.json: nothing to add')
NODE
fi

if [ $DO_INSTALL = 1 ] && [ $DRY = 0 ]; then
  (cd "$CLIENT_DIR" && npm install && { [ $WITH_HARNESS = 0 ] || npx playwright install chromium; })
fi

echo
echo "Written (${#COPIED[@]}):"; for f in "${COPIED[@]+"${COPIED[@]}"}"; do info "$f"; done
if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo "Kept as they were (${#SKIPPED[@]}; rerun with --force to overwrite, or merge by hand):"
  for f in "${SKIPPED[@]}"; do info "$f"; done
fi

if [ $DRY = 0 ]; then
  echo
  echo "Left to adapt by hand (ADAPT markers):"
  (cd "$TARGET" && grep -rln --exclude-dir=node_modules -e '<!-- ADAPT' -e 'ADAPT:' \
     .github/instructions .github/skills .github/agents .github/prompts "$CLIENT_APP/visual" "$CLIENT_APP/scripts" 2>/dev/null \
     | sed 's/^/  /') || true
  left="$(cd "$TARGET" && grep -rl --exclude-dir=node_modules -E '\{\{(PROJECT_NAME|CLIENT_APP_DIR|APP_URL|BACKEND_BUILD_CMD|BUILD_OUTPUT_DIR|IMAGES_DIR|VAULT_DIR|TODAY)\}\}' \
     .github .claude CLAUDE.md "$CLIENT_APP/visual" 2>/dev/null || true)"
  [ -z "$left" ] || { echo "warning: unfilled placeholders in:"; echo "$left" | sed 's/^/  /'; }
  echo
  echo "Next: follow frontend-flow-kit/README.md, section \"Depois do install\"."
fi
