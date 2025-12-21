#!/usr/bin/env bash
set -euo pipefail

# Deploy UniversalSwapApp to ZetaChain Athens (ZEVM).
#
# Required env:
# - PRIVATE_KEY               (hex, with or without 0x)
#
# Optional env:
# - ZETA_TESTNET_RPC_URL      (default: BlockPI public RPC)
# - GATEWAY_ZEVM              (default: Athens GatewayZEVM)
# - UNISWAP_ROUTER            (default: Athens UniswapV2Router02)
# - ON_REVERT_GAS_LIMIT       (default: 500000)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ZETA_TESTNET_RPC_URL="${ZETA_TESTNET_RPC_URL:-https://zetachain-athens-evm.blockpi.network/v1/rpc/public}"
GATEWAY_ZEVM="${GATEWAY_ZEVM:-0x6c533f7fe93fae114d0954697069df33c9b74fd7}"
UNISWAP_ROUTER="${UNISWAP_ROUTER:-0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe}"
ON_REVERT_GAS_LIMIT="${ON_REVERT_GAS_LIMIT:-500000}"

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Missing env: PRIVATE_KEY" >&2
  exit 1
fi

export ZETA_TESTNET_RPC_URL
export GATEWAY_ZEVM
export UNISWAP_ROUTER
export ON_REVERT_GAS_LIMIT

echo "RPC:            ${ZETA_TESTNET_RPC_URL}"
echo "GATEWAY_ZEVM:    ${GATEWAY_ZEVM}"
echo "UNISWAP_ROUTER:  ${UNISWAP_ROUTER}"
echo "ON_REVERT_GAS_LIMIT: ${ON_REVERT_GAS_LIMIT}"
echo ""

cd "${ROOT_DIR}"

OUT="$(forge script script/DeployUniversalSwapApp.s.sol:DeployUniversalSwapApp \
  --rpc-url "${ZETA_TESTNET_RPC_URL}" \
  --broadcast 2>&1 | tee /dev/stderr)"

ADDR="$(echo "${OUT}" | sed -n 's/.*UniversalSwapApp deployed at: //p' | tail -n 1 | tr -d '\r')"
if [[ -n "${ADDR}" ]]; then
  echo ""
  echo "UniversalSwapApp: ${ADDR}"
  echo "Set in frontend/.env.local:"
  echo "NEXT_PUBLIC_UNIVERSAL_SWAP_APP_ADDRESS=${ADDR}"
fi

