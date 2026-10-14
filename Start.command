#!/bin/bash
set -eu
cd "$(dirname "$0")"
LAB_ROOT="$(pwd)"
export LAB_ROOT
case "$(uname -m)" in
  arm64) LAB_ARCH=darwin-arm64; LAB_MIN_MAJOR=15; LAB_MIN_MINOR=5 ;;
  x86_64) LAB_ARCH=darwin-x64; LAB_MIN_MAJOR=13; LAB_MIN_MINOR=5 ;;
  *) echo 'Unsupported Mac architecture'; exit 1 ;;
esac
LAB_OS="$(sw_vers -productVersion)"
IFS=. read -r LAB_MAJOR LAB_MINOR LAB_PATCH <<< "$LAB_OS"
if [ "$LAB_MAJOR" -lt "$LAB_MIN_MAJOR" ] || { [ "$LAB_MAJOR" -eq "$LAB_MIN_MAJOR" ] && [ "${LAB_MINOR:-0}" -lt "$LAB_MIN_MINOR" ]; }; then
  echo "This bundled runtime requires macOS $LAB_MIN_MAJOR.$LAB_MIN_MINOR or later on $LAB_ARCH. Found $LAB_OS."
  exit 1
fi
LAB_NODE="$LAB_ROOT/runtime/$LAB_ARCH/node"
export ANVIL_PATH="$LAB_ROOT/runtime/$LAB_ARCH/anvil"
chmod u+x "$LAB_NODE" "$ANVIL_PATH"
LAB_URL="http://127.0.0.1:${LAB_PORT:-4317}"
if curl -sf "$LAB_URL/api/health" | grep -q 'web3-agent-lab'; then
  LAB_RUNNING_HASH="$(curl -sf "$LAB_URL/api/health" | "$LAB_NODE" -e 'let s="";for await(const c of process.stdin)s+=c;console.log(JSON.parse(s).version?.sourceHash||"")' --input-type=module)"
  LAB_EXPECTED_HASH="$("$LAB_NODE" -e 'console.log(JSON.parse(require("fs").readFileSync("build-info.json","utf8")).sourceHash)')"
  if [ "$LAB_RUNNING_HASH" != "$LAB_EXPECTED_HASH" ]; then
    echo 'Another Web3 Agent Lab build is using this port. Stop the old version with its Stop.command before starting V0.12, or use different LAB_PORT and LAB_CHAIN_PORT.'
    exit 1
  fi
  open "$LAB_URL"
  exit 0
fi
mkdir -p data
nohup "$LAB_NODE" "$LAB_ROOT/dist/server.mjs" > data/server.stdout.log 2> data/server.stderr.log < /dev/null &
LAB_PID=$!
for _ in $(seq 1 60); do
  if curl -sf "$LAB_URL/api/health" | grep -q 'web3-agent-lab'; then open "$LAB_URL"; exit 0; fi
  if ! kill -0 "$LAB_PID" 2>/dev/null; then echo 'Startup failed. Read data/server.stderr.log'; exit 1; fi
  sleep 0.25
done
echo 'Startup timed out. Read data/server.stderr.log'
exit 1
