#!/bin/bash
set -eu
cd "$(dirname "$0")"
case "$(uname -m)" in arm64) LAB_ARCH=darwin-arm64 ;; x86_64) LAB_ARCH=darwin-x64 ;; *) exit 1 ;; esac
export LAB_PORT="${LAB_PORT:-4317}"
"runtime/$LAB_ARCH/node" --input-type=module -e '
const url="http://127.0.0.1:"+process.env.LAB_PORT;
try{const h=await(await fetch(url+"/api/health")).json();if(h.app!=="web3-agent-lab")throw Error("Unexpected service");const r=await fetch(url+"/api/shutdown",{method:"POST",headers:{"X-Lab-Token":h.csrfToken,"Content-Type":"application/json"},body:"{}"});if(!r.ok)throw Error(await r.text());console.log("Stopped. Data remains in data/.");}catch(e){console.error(e.message);process.exitCode=1;}'
